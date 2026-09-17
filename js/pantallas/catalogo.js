// GESTION_CELULARES - js/pantallas/catalogo.js
// Catalogo de Modelos (Especificacion de Interfaz Seccion 4.8).
// Listado con filtros, alta de modelo nuevo, y edicion (solo
// Administrador) de los campos que Pedro puede tocar desde la app:
// valor_promedio_mercado, facilidad_repuestos, rentabilidad_esperada,
// estado_comercial y los 3 campos de disponibilidad de PT-09.
//
// Identificador de fila: la hoja Modelos no tiene columna id (Diseno
// Tecnico Seccion 3.9) - se identifica cada modelo por el par
// marca+modelo, unico por diseño (no se permiten dos filas con la
// misma marca y modelo).
//
// H-05 (retroalimentacion al catalogo) y el indicador de margen
// promedio (parrafo 3 de esta seccion) dependen de datos que hoy
// no llegan en una sola llamada (diagnosticos de TODOS los equipos,
// no solo de uno). Mientras esa operacion de backend no exista
// (Api.obtenerDiagnosticosTodos, ver nota en el Indice Maestro), esta
// pantalla funciona igual (listado, alta, edicion) pero sin el aviso
// H-05 ni el indicador de margen - se degrada con una nota visible,
// nunca en silencio.
//
// Fase 5 (Viabilidad, v3.24 del Indice Maestro): renderCatalogo ahora
// acepta un parametro de ruta opcional. Si llega "nuevo" (desde
// "Agregar modelo al catalogo" en Consulta de Viabilidad, cuando el
// modelo buscado no existe todavia), se preabre el modal de alta
// automaticamente - reutiliza el modal existente, no crea un segundo
// mecanismo. Sin efecto si el rol actual no es Administrador (mismo
// criterio que el boton "+ Nuevo modelo").

let catalogoEstado = { todos: [], equipos: [], diagnosticos: null, configuracion: null, filtros: { marca: "", gama: "", estadoComercial: "" } };

const CATALOGO_ITEMS_DIAGNOSTICO = [
  "pantalla", "tactil", "bateria", "camara_trasera", "camara_frontal",
  "altavoz", "microfono", "puerto_carga", "botones", "huella_faceid",
  "wifi", "bluetooth", "red_movil",
];

async function renderCatalogo(contenedor, parametroRuta) {
  contenedor.innerHTML = `<p>Cargando catalogo...</p>`;

  try {
    const [equiposYModelos, configuracion] = await Promise.all([
      Api.obtenerEquiposYModelos(),
      Api.obtenerConfiguracion(),
    ]);

    catalogoEstado.todos = equiposYModelos.modelos || [];
    catalogoEstado.equipos = equiposYModelos.equipos || [];
    catalogoEstado.configuracion = configuracion;
    catalogoEstado.filtros = { marca: "", gama: "", estadoComercial: "" };

    // H-05 necesita diagnosticos de todos los equipos. Operacion
    // opcional: si todavia no existe en el backend, la pantalla sigue
    // funcionando sin el aviso (ver nota de cabecera del archivo).
    try {
      catalogoEstado.diagnosticos = (Api.obtenerDiagnosticosTodos)
        ? await Api.obtenerDiagnosticosTodos()
        : null;
    } catch (errDiag) {
      console.warn("No se pudieron cargar diagnosticos para H-05:", errDiag);
      catalogoEstado.diagnosticos = null;
    }

    pintarCatalogo(contenedor);

    if (parametroRuta === "nuevo") {
      const usuario = Estado.get().usuario;
      const esAdmin = !!(usuario && usuario.roles.includes("Administrador"));
      if (esAdmin) {
        abrirModalModelo(null, () => renderCatalogo(contenedor));
      }
    }
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar el catalogo: ${err.message}</p>`;
  }
}

function pintarCatalogo(contenedor) {
  const usuario = Estado.get().usuario;
  const esAdmin = !!(usuario && usuario.roles.includes("Administrador"));

  contenedor.innerHTML = `
    <p><a href="#dashboard">&larr; Volver</a></p>
    <h2>Catalogo de Modelos</h2>
    ${catalogoEstado.diagnosticos === null
      ? '<p class="modal-error" style="display:block;">Aviso H-05 y margen promedio no disponibles todavia: falta una operacion de backend (obtenerDiagnosticosTodos). El resto de la pantalla funciona con normalidad.</p>'
      : ""}

    <div class="equipos-filtros">
      <input type="text" id="catalogo-filtro-marca" placeholder="Filtrar por marca..." />
      <select id="catalogo-filtro-gama">
        <option value="">Gama: todas</option>
        <option value="Baja">Baja</option>
        <option value="Media">Media</option>
        <option value="Alta">Alta</option>
      </select>
      <select id="catalogo-filtro-estado">
        <option value="">Estado: todos</option>
        <option value="Activo">Activo</option>
        <option value="Descontinuado">Descontinuado</option>
        <option value="No comprar">No comprar</option>
      </select>
      ${esAdmin ? '<button id="catalogo-nuevo">+ Nuevo modelo</button>' : ""}
    </div>

    <div id="catalogo-tabla-contenedor"></div>
  `;

  document.getElementById("catalogo-filtro-marca").addEventListener("input", (ev) => {
    catalogoEstado.filtros.marca = ev.target.value.trim().toLowerCase();
    pintarTablaCatalogo(esAdmin);
  });
  document.getElementById("catalogo-filtro-gama").addEventListener("change", (ev) => {
    catalogoEstado.filtros.gama = ev.target.value;
    pintarTablaCatalogo(esAdmin);
  });
  document.getElementById("catalogo-filtro-estado").addEventListener("change", (ev) => {
    catalogoEstado.filtros.estadoComercial = ev.target.value;
    pintarTablaCatalogo(esAdmin);
  });

  const botonNuevo = document.getElementById("catalogo-nuevo");
  if (botonNuevo) {
    botonNuevo.addEventListener("click", () => abrirModalModelo(null, () => renderCatalogo(contenedor)));
  }

  pintarTablaCatalogo(esAdmin);
}

function pintarTablaCatalogo(esAdmin) {
  const { todos, filtros } = catalogoEstado;

  const filtrados = todos.filter((m) => {
    if (filtros.marca && !(m.marca || "").toLowerCase().includes(filtros.marca)) return false;
    if (filtros.gama && m.gama !== filtros.gama) return false;
    if (filtros.estadoComercial && m.estado_comercial !== filtros.estadoComercial) return false;
    return true;
  });

  const filas = filtrados
    .map((m) => {
      const stats = calcularEstadisticasModelo(m);
      const alertaH05 = evaluarAlertaH05(stats, catalogoEstado.configuracion);
      return `
      <tr class="${alertaH05 ? "fila-estado-atencion" : ""}">
        <td>${m.marca}</td>
        <td>${m.modelo}</td>
        <td>${m.año || "-"}</td>
        <td>${m.gama || "-"}</td>
        <td>${formatearPYG(m.valor_promedio_mercado)}</td>
        <td>${m.estado_comercial || "-"}</td>
        <td>${stats.margenPromedio === null ? "-" : stats.margenPromedio.toFixed(1) + "%"}</td>
        <td>${alertaH05 ? "&#9888; revisar" : ""}</td>
        <td>${esAdmin ? `<button class="catalogo-editar" data-marca="${escaparAtributoCatalogo(m.marca)}" data-modelo="${escaparAtributoCatalogo(m.modelo)}">Editar</button>` : ""}</td>
      </tr>`;
    })
    .join("");

  document.getElementById("catalogo-tabla-contenedor").innerHTML = `
    <p>${filtrados.length} modelo(s)</p>
    <table class="tabla-simple">
      <thead>
        <tr>
          <th>Marca</th><th>Modelo</th><th>Año</th><th>Gama</th>
          <th>Valor mercado</th><th>Estado comercial</th>
          <th>Margen prom.</th><th>H-05</th><th></th>
        </tr>
      </thead>
      <tbody>${filas || '<tr><td colspan="9">Sin modelos que coincidan.</td></tr>'}</tbody>
    </table>
  `;

  document.querySelectorAll(".catalogo-editar").forEach((boton) => {
    boton.addEventListener("click", () => {
      const marca = boton.getAttribute("data-marca");
      const modelo = boton.getAttribute("data-modelo");
      const m = catalogoEstado.todos.find((x) => x.marca === marca && x.modelo === modelo);
      abrirModalModelo(m, () => renderCatalogo(document.getElementById("app-contenido")));
    });
  });
}

// Indicador de margen promedio (Especificacion 4.8, parrafo 3):
// ventas historicas de ese modelo comparadas contra su valor de
// mercado de catalogo. Distinto de rentabilidadReal (H-05, Diseno
// Tecnico Seccion 4.8), que compara contra el costo total del
// equipo, no contra el valor de mercado - se muestran ambos para no
// mezclar dos preguntas distintas ("¿vendo cerca del precio de
// mercado?" vs "¿me deja margen sobre lo que invertí?").
function calcularEstadisticasModelo(modelo) {
  const equiposVendidos = catalogoEstado.equipos.filter(
    (e) => e.marca === modelo.marca && e.modelo === modelo.modelo && e.precio_venta
  );

  let margenPromedio = null;
  if (equiposVendidos.length && modelo.valor_promedio_mercado) {
    const suma = equiposVendidos.reduce(
      (acc, e) => acc + ((e.precio_venta - modelo.valor_promedio_mercado) / modelo.valor_promedio_mercado) * 100,
      0
    );
    margenPromedio = suma / equiposVendidos.length;
  }

  let rentabilidadReal = null;
  const ventasConCosto = equiposVendidos.filter((e) => e.precio_compra);
  if (ventasConCosto.length) {
    const suma = ventasConCosto.reduce((acc, e) => {
      const costoTotal = Number(e.precio_compra || 0) + Number(e.costo_reparacion_total || 0);
      return acc + ((e.precio_venta - costoTotal) / e.precio_venta) * 100;
    }, 0);
    rentabilidadReal = suma / ventasConCosto.length;
  }

  let tasaFalla = null;
  if (catalogoEstado.diagnosticos) {
    const idsEquiposDelModelo = new Set(
      catalogoEstado.equipos.filter((e) => e.marca === modelo.marca && e.modelo === modelo.modelo).map((e) => e.id_equipo)
    );
    const diagsDelModelo = catalogoEstado.diagnosticos.filter((d) => idsEquiposDelModelo.has(d.id_equipo));
    if (diagsDelModelo.length) {
      const conFallo = diagsDelModelo.filter((d) => CATALOGO_ITEMS_DIAGNOSTICO.some((item) => d[item] === "Fallado"));
      tasaFalla = (conFallo.length / diagsDelModelo.length) * 100;
    }
  }

  return { margenPromedio, rentabilidadReal, tasaFalla, cantidadVentas: ventasConCosto.length };
}

// H-05 (Diseno Tecnico Seccion 4.8): aviso visual, nunca cambia el
// catalogo solo. Requiere Configuracion.umbral_tasa_falla,
// Configuracion.ventas_minimas_evaluacion y Configuracion.margen_minimo.
function evaluarAlertaH05(stats, configuracion) {
  if (!configuracion) return false;
  if (stats.tasaFalla !== null && configuracion.umbral_tasa_falla && stats.tasaFalla > Number(configuracion.umbral_tasa_falla)) {
    return true;
  }
  if (
    stats.rentabilidadReal !== null &&
    configuracion.ventas_minimas_evaluacion &&
    stats.cantidadVentas >= Number(configuracion.ventas_minimas_evaluacion) &&
    configuracion.margen_minimo &&
    stats.rentabilidadReal < Number(configuracion.margen_minimo)
  ) {
    return true;
  }
  return false;
}

// --- Modal de alta / edicion ---

function abrirModalModelo(modeloExistente, alGuardar) {
  const esEdicion = !!modeloExistente;
  const m = modeloExistente || {};

  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>${esEdicion ? "Editar modelo" : "Nuevo modelo"}</h3>

      <label for="modelo-marca">Marca</label>
      <input type="text" id="modelo-marca" value="${esEdicion ? m.marca : ""}" ${esEdicion ? "disabled" : ""} />

      <label for="modelo-modelo">Modelo</label>
      <input type="text" id="modelo-modelo" value="${esEdicion ? m.modelo : ""}" ${esEdicion ? "disabled" : ""} />

      ${!esEdicion ? `
      <label for="modelo-año">Año</label>
      <input type="number" id="modelo-año" value="${m.año || ""}" />

      <label for="modelo-gama">Gama</label>
      <select id="modelo-gama">
        <option value="Baja">Baja</option>
        <option value="Media">Media</option>
        <option value="Alta">Alta</option>
      </select>

      <label for="modelo-capacidad">Capacidad</label>
      <input type="text" id="modelo-capacidad" placeholder="128GB" value="${m.capacidad || ""}" />

      <label for="modelo-demanda">Demanda</label>
      <select id="modelo-demanda">
        <option value="Alta">Alta</option>
        <option value="Media">Media</option>
        <option value="Baja">Baja</option>
      </select>
      ` : ""}

      <label for="modelo-valor-mercado">Valor promedio de mercado (PYG)</label>
      <input type="number" id="modelo-valor-mercado" value="${m.valor_promedio_mercado || ""}" />

      <label for="modelo-facilidad-repuestos">Facilidad de repuestos</label>
      <select id="modelo-facilidad-repuestos">
        <option value="Fácil">Fácil</option>
        <option value="Media">Media</option>
        <option value="Difícil">Difícil</option>
      </select>

      <label for="modelo-rentabilidad-esperada">Rentabilidad esperada (%)</label>
      <input type="number" id="modelo-rentabilidad-esperada" value="${m.rentabilidad_esperada || ""}" />

      <label for="modelo-estado-comercial">Estado comercial</label>
      <select id="modelo-estado-comercial">
        <option value="Activo">Activo</option>
        <option value="Descontinuado">Descontinuado</option>
        <option value="No comprar">No comprar</option>
      </select>

      <label for="modelo-disp-pantalla">Disponibilidad de pantalla (PT-09)</label>
      <select id="modelo-disp-pantalla">
        <option value="Disponible">Disponible</option>
        <option value="Escasa">Escasa</option>
        <option value="Descontinuada">Descontinuada</option>
      </select>

      <label for="modelo-disp-bateria">Disponibilidad de batería (PT-09)</label>
      <select id="modelo-disp-bateria">
        <option value="Disponible">Disponible</option>
        <option value="Escasa">Escasa</option>
        <option value="Descontinuada">Descontinuada</option>
      </select>

      <label for="modelo-disp-carga">Disponibilidad de módulo de carga (PT-09)</label>
      <select id="modelo-disp-carga">
        <option value="Disponible">Disponible</option>
        <option value="Escasa">Escasa</option>
        <option value="Descontinuado">Descontinuado</option>
      </select>

      <label for="modelo-comentario">Comentario (obligatorio - queda en Bitácora de Decisiones)</label>
      <textarea id="modelo-comentario" rows="2"></textarea>

      <p id="modelo-error" class="modal-error" hidden></p>
      <div class="modal-botones">
        <button id="modelo-cancelar">Cancelar</button>
        <button id="modelo-guardar">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  // Preseleccionar valores actuales en los <select> (edicion) o
  // defaults razonables (alta - todo "disponible/facil/activo" hasta
  // que Pedro diga lo contrario, nunca "No comprar" por defecto).
  seleccionarValorCatalogo("modelo-gama", m.gama || "Media");
  seleccionarValorCatalogo("modelo-demanda", m.demanda || "Media");
  seleccionarValorCatalogo("modelo-facilidad-repuestos", m.facilidad_repuestos || "Media");
  seleccionarValorCatalogo("modelo-estado-comercial", m.estado_comercial || "Activo");
  seleccionarValorCatalogo("modelo-disp-pantalla", m.disponibilidad_pantalla || "Disponible");
  seleccionarValorCatalogo("modelo-disp-bateria", m.disponibilidad_bateria || "Disponible");
  seleccionarValorCatalogo("modelo-disp-carga", m.disponibilidad_modulo_carga || "Disponible");

  document.getElementById("modelo-cancelar").addEventListener("click", () => fondo.remove());

  const botonGuardar = document.getElementById("modelo-guardar");
  botonGuardar.addEventListener("click", async () => {
    const errorEl = document.getElementById("modelo-error");
    const comentario = document.getElementById("modelo-comentario").value.trim();

    if (!comentario) {
      errorEl.textContent = "El comentario es obligatorio (queda registrado en Decisiones).";
      errorEl.hidden = false;
      return;
    }

    const cambios = {
      valor_promedio_mercado: Number(document.getElementById("modelo-valor-mercado").value || 0),
      facilidad_repuestos: document.getElementById("modelo-facilidad-repuestos").value,
      rentabilidad_esperada: Number(document.getElementById("modelo-rentabilidad-esperada").value || 0),
      estado_comercial: document.getElementById("modelo-estado-comercial").value,
      disponibilidad_pantalla: document.getElementById("modelo-disp-pantalla").value,
      disponibilidad_bateria: document.getElementById("modelo-disp-bateria").value,
      disponibilidad_modulo_carga: document.getElementById("modelo-disp-carga").value,
    };

    if (botonGuardar.disabled) return;
    botonGuardar.disabled = true;
    const textoOriginal = botonGuardar.textContent;
    botonGuardar.textContent = "Guardando...";

    try {
      if (esEdicion) {
        await Api.actualizarModelo(m.marca, m.modelo, cambios, comentario);
      } else {
        const marca = document.getElementById("modelo-marca").value.trim();
        const modelo = document.getElementById("modelo-modelo").value.trim();
        if (!marca || !modelo) {
          errorEl.textContent = "Marca y modelo son obligatorios.";
          errorEl.hidden = false;
          botonGuardar.disabled = false;
          botonGuardar.textContent = textoOriginal;
          return;
        }
        await Api.crearModelo({
          marca,
          modelo,
          año: Number(document.getElementById("modelo-año").value || 0),
          gama: document.getElementById("modelo-gama").value,
          capacidad: document.getElementById("modelo-capacidad").value.trim(),
          demanda: document.getElementById("modelo-demanda").value,
          ...cambios,
          comentario,
        });
      }
      fondo.remove();
      alGuardar();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      botonGuardar.disabled = false;
      botonGuardar.textContent = textoOriginal;
    }
  });
}

function seleccionarValorCatalogo(idSelect, valor) {
  const el = document.getElementById(idSelect);
  if (el && valor) el.value = valor;
}

function escaparAtributoCatalogo(valor) {
  return String(valor || "").replace(/"/g, "&quot;");
}

Router.registrar("catalogo", renderCatalogo);
