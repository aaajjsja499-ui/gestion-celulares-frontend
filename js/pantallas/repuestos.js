// GESTION_CELULARES - js/pantallas/repuestos.js
// Inventario de Repuestos (Especificacion de Interfaz Seccion 4.6).
//
// Brecha encontrada al escribir esta pantalla (se declara aca, no en
// silencio - Metodologia del proyecto): la Especificacion 4.6 pide
// una cosa que la hoja Repuestos (Diseno Tecnico Seccion 3.6) no
// tiene columna para:
//   "No se elimina, se marca como Inactivo si deja de usarse" ->
//   hace falta una columna de estado (se asume "activo": Si/No).
//   Sigue pendiente de que Pedro la agregue a la hoja Repuestos en
//   Sheets (ver Indice Maestro, backlog item 27).
//
// Stock bajo (Especificacion 4.6, Diseno Tecnico 4.4 v2.2, Fase 8):
// la primera version de esta pantalla asumia un campo "stock_minimo"
// por repuesto que nunca llego a existir en la hoja real, asi que el
// resaltado nunca se activaba y el formulario ofrecia un campo que
// no se guardaba en ningun lado. Decision de Pedro en Fase 8: un
// umbral unico global, Configuracion.stock_minimo_repuestos, igual
// para todos los repuestos. Esta pantalla lo lee con
// Api.obtenerConfiguracion (mismo criterio que la tarjeta de stock
// bajo del Dashboard y el conteo del backend: stock_actual por
// debajo del umbral) y, si el umbral no esta cargado o no se puede
// leer, no resalta nada y lo avisa, sin inventar un numero. El campo
// por repuesto se quito del formulario (Indice Maestro, backlog
// items 28 y 29).

let repuestosEstado = {
  todos: [],
  filtros: { compatibilidad: "", proveedor: "", soloActivos: true },
  // Umbral unico global de stock bajo (Configuracion.stock_minimo_repuestos).
  // umbral: numero, o null si no hay umbral utilizable. umbralMotivo explica
  // por que es null: "sin-configurar" (celda vacia o no numerica) o "error"
  // (no se pudo leer Configuracion).
  umbral: null,
  umbralMotivo: "sin-configurar",
};

function leerUmbralStockBajo_(configuracion) {
  if (!configuracion) return { umbral: null, umbralMotivo: "error" };
  const crudo = configuracion.stock_minimo_repuestos;
  if (crudo === "" || crudo === null || crudo === undefined) {
    return { umbral: null, umbralMotivo: "sin-configurar" };
  }
  const numero = Number(crudo);
  if (!Number.isFinite(numero)) return { umbral: null, umbralMotivo: "sin-configurar" };
  return { umbral: numero, umbralMotivo: "" };
}

function textoUmbralRepuestos_() {
  const { umbral, umbralMotivo } = repuestosEstado;
  if (umbral !== null) {
    return `<p class="panel-ampliado-periodo">Stock bajo: menos de ${umbral} unidad(es) (umbral único para todos los repuestos, Configuracion.stock_minimo_repuestos).</p>`;
  }
  if (umbralMotivo === "error") {
    return `<p class="tarjeta-aviso">No se pudo cargar el umbral de stock bajo por ahora: no se resalta ningún repuesto.</p>`;
  }
  return `<p class="tarjeta-aviso">Configuracion.stock_minimo_repuestos todavía no está cargado: no se resalta ningún repuesto.</p>`;
}

async function renderRepuestos(contenedor) {
  contenedor.innerHTML = `<p>Cargando repuestos...</p>`;

  try {
    const [repuestos, configuracion] = await Promise.all([
      Api.obtenerRepuestos(),
      Api.obtenerConfiguracion().catch((err) => {
        console.warn("No se pudo cargar Configuracion para el umbral de stock bajo:", err);
        return null;
      }),
    ]);
    repuestosEstado.todos = repuestos;
    repuestosEstado.filtros = { compatibilidad: "", proveedor: "", soloActivos: true };
    Object.assign(repuestosEstado, leerUmbralStockBajo_(configuracion));
    pintarRepuestos(contenedor);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar repuestos: ${err.message}</p>`;
  }
}

function pintarRepuestos(contenedor) {
  contenedor.innerHTML = `
    <p><a href="#dashboard">&larr; Volver</a></p>
    <h2>Inventario de Repuestos</h2>

    <div class="equipos-filtros">
      <input type="text" id="repuestos-filtro-compat" placeholder="Filtrar por modelo compatible..." />
      <input type="text" id="repuestos-filtro-proveedor" placeholder="Filtrar por proveedor..." />
      <label><input type="checkbox" id="repuestos-filtro-activos" checked /> Solo activos</label>
      <button id="repuestos-nuevo">+ Nuevo repuesto</button>
    </div>

    ${textoUmbralRepuestos_()}

    <div id="repuestos-tabla-contenedor"></div>
  `;

  document.getElementById("repuestos-filtro-compat").addEventListener("input", (ev) => {
    repuestosEstado.filtros.compatibilidad = ev.target.value.trim().toLowerCase();
    pintarTablaRepuestos();
  });
  document.getElementById("repuestos-filtro-proveedor").addEventListener("input", (ev) => {
    repuestosEstado.filtros.proveedor = ev.target.value.trim().toLowerCase();
    pintarTablaRepuestos();
  });
  document.getElementById("repuestos-filtro-activos").addEventListener("change", (ev) => {
    repuestosEstado.filtros.soloActivos = ev.target.checked;
    pintarTablaRepuestos();
  });
  document.getElementById("repuestos-nuevo").addEventListener("click", () => {
    abrirModalRepuesto(null, () => renderRepuestos(contenedor));
  });

  pintarTablaRepuestos();
}

function pintarTablaRepuestos() {
  const { todos, filtros } = repuestosEstado;

  const filtrados = todos.filter((r) => {
    if (filtros.soloActivos && r.activo === "No") return false;
    if (filtros.compatibilidad && !(r.compatibilidad || "").toLowerCase().includes(filtros.compatibilidad)) return false;
    if (filtros.proveedor && !(r.proveedor || "").toLowerCase().includes(filtros.proveedor)) return false;
    return true;
  });

  const filas = filtrados
    .map((r) => {
      const stockBajo =
        repuestosEstado.umbral !== null &&
        r.stock_actual !== "" && r.stock_actual !== null && r.stock_actual !== undefined &&
        Number(r.stock_actual) < repuestosEstado.umbral;
      return `
      <tr class="${stockBajo ? "fila-stock-bajo" : ""}">
        <td>${r.id_repuesto}</td>
        <td>${r.nombre}</td>
        <td>${r.compatibilidad || "-"}</td>
        <td>${r.proveedor || "-"}</td>
        <td>${formatearPYG(r.costo_unitario)}</td>
        <td class="${stockBajo ? "celda-stock-bajo" : ""}">${stockBajo ? "&#9888; " : ""}${r.stock_actual}</td>
        <td>${r.tiempo_reposicion_dias !== undefined ? r.tiempo_reposicion_dias + " día(s)" : "-"}</td>
        <td>${r.activo === "No" ? "Inactivo" : "Activo"}</td>
        <td>
          <button class="repuesto-ajustar" data-id="${r.id_repuesto}">Ajustar stock</button>
          <button class="repuesto-editar" data-id="${r.id_repuesto}">Editar</button>
        </td>
      </tr>`;
    })
    .join("");

  document.getElementById("repuestos-tabla-contenedor").innerHTML = `
    <p>${filtrados.length} repuesto(s)</p>
    <table class="tabla-simple">
      <thead>
        <tr>
          <th>ID</th><th>Nombre</th><th>Compatibilidad</th><th>Proveedor</th>
          <th>Costo unitario</th><th>Stock actual</th><th>Reposición</th><th>Estado</th><th></th>
        </tr>
      </thead>
      <tbody>${filas || '<tr><td colspan="9">Sin repuestos que coincidan.</td></tr>'}</tbody>
    </table>
  `;

  document.querySelectorAll(".repuesto-editar").forEach((boton) => {
    boton.addEventListener("click", () => {
      const r = repuestosEstado.todos.find((x) => x.id_repuesto === boton.getAttribute("data-id"));
      abrirModalRepuesto(r, () => renderRepuestos(document.getElementById("app-contenido")));
    });
  });
  document.querySelectorAll(".repuesto-ajustar").forEach((boton) => {
    boton.addEventListener("click", () => {
      const r = repuestosEstado.todos.find((x) => x.id_repuesto === boton.getAttribute("data-id"));
      abrirModalAjusteStock(r, () => renderRepuestos(document.getElementById("app-contenido")));
    });
  });
}

// --- Modal de alta / edicion ---

function abrirModalRepuesto(repuestoExistente, alGuardar) {
  const esEdicion = !!repuestoExistente;
  const r = repuestoExistente || {};

  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>${esEdicion ? "Editar repuesto" : "Nuevo repuesto"}</h3>

      <label for="repuesto-nombre">Nombre</label>
      <input type="text" id="repuesto-nombre" value="${esEdicion ? r.nombre || "" : ""}" />

      <label for="repuesto-compatibilidad">Compatibilidad (modelos separados por coma)</label>
      <input type="text" id="repuesto-compatibilidad" value="${esEdicion ? r.compatibilidad || "" : ""}" />

      <label for="repuesto-proveedor">Proveedor</label>
      <input type="text" id="repuesto-proveedor" value="${esEdicion ? r.proveedor || "" : ""}" />

      <label for="repuesto-costo">Costo unitario (PYG)</label>
      <input type="number" id="repuesto-costo" value="${esEdicion ? r.costo_unitario || "" : ""}" />

      ${!esEdicion ? `
      <label for="repuesto-stock-inicial">Stock inicial</label>
      <input type="number" id="repuesto-stock-inicial" value="0" />
      ` : ""}

      <label for="repuesto-tiempo-reposicion">Tiempo de reposición (días)</label>
      <input type="number" id="repuesto-tiempo-reposicion" value="${esEdicion ? r.tiempo_reposicion_dias || "" : ""}" />

      <label for="repuesto-notas">Notas</label>
      <textarea id="repuesto-notas" rows="2">${esEdicion ? r.notas || "" : ""}</textarea>

      ${esEdicion ? `
      <label for="repuesto-activo">Estado</label>
      <select id="repuesto-activo">
        <option value="Si">Activo</option>
        <option value="No">Inactivo</option>
      </select>
      ` : ""}

      <p id="repuesto-error" class="modal-error" hidden></p>
      <div class="modal-botones">
        <button id="repuesto-cancelar">Cancelar</button>
        <button id="repuesto-guardar">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  if (esEdicion) {
    const selectActivo = document.getElementById("repuesto-activo");
    selectActivo.value = r.activo === "No" ? "No" : "Si";
  }

  document.getElementById("repuesto-cancelar").addEventListener("click", () => fondo.remove());

  const botonGuardar = document.getElementById("repuesto-guardar");
  botonGuardar.addEventListener("click", async () => {
    const errorEl = document.getElementById("repuesto-error");
    const nombre = document.getElementById("repuesto-nombre").value.trim();

    if (!nombre) {
      errorEl.textContent = "El nombre es obligatorio.";
      errorEl.hidden = false;
      return;
    }

    const datosComunes = {
      nombre,
      compatibilidad: document.getElementById("repuesto-compatibilidad").value.trim(),
      proveedor: document.getElementById("repuesto-proveedor").value.trim(),
      costo_unitario: Number(document.getElementById("repuesto-costo").value || 0),
      tiempo_reposicion_dias: Number(document.getElementById("repuesto-tiempo-reposicion").value || 0),
      notas: document.getElementById("repuesto-notas").value.trim(),
    };

    if (botonGuardar.disabled) return;
    botonGuardar.disabled = true;
    const textoOriginal = botonGuardar.textContent;
    botonGuardar.textContent = "Guardando...";

    try {
      if (esEdicion) {
        datosComunes.activo = document.getElementById("repuesto-activo").value;
        await Api.actualizarRepuesto(r.id_repuesto, datosComunes);
      } else {
        datosComunes.stock_actual = Number(document.getElementById("repuesto-stock-inicial").value || 0);
        await Api.crearRepuesto(datosComunes);
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

// --- Modal de ajuste de stock ---

function abrirModalAjusteStock(repuesto, alGuardar) {
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>Ajustar stock: ${repuesto.nombre}</h3>
      <p>Stock actual: ${repuesto.stock_actual}</p>

      <label for="ajuste-cantidad">Cantidad (positiva suma, negativa resta)</label>
      <input type="number" id="ajuste-cantidad" value="0" />

      <label for="ajuste-motivo">Motivo</label>
      <select id="ajuste-motivo">
        <option value="Compra">Compra</option>
        <option value="Perdida">Pérdida</option>
        <option value="Correccion">Corrección</option>
        <option value="Rescate">Pieza rescatada de equipo desarmado</option>
      </select>

      <label for="ajuste-comentario">Comentario</label>
      <textarea id="ajuste-comentario" rows="2"></textarea>

      <p id="ajuste-error" class="modal-error" hidden></p>
      <div class="modal-botones">
        <button id="ajuste-cancelar">Cancelar</button>
        <button id="ajuste-guardar">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  document.getElementById("ajuste-cancelar").addEventListener("click", () => fondo.remove());

  const botonGuardar = document.getElementById("ajuste-guardar");
  botonGuardar.addEventListener("click", async () => {
    const errorEl = document.getElementById("ajuste-error");
    const cantidad = Number(document.getElementById("ajuste-cantidad").value || 0);
    const motivo = document.getElementById("ajuste-motivo").value;
    const comentario = document.getElementById("ajuste-comentario").value.trim();

    if (!cantidad) {
      errorEl.textContent = "La cantidad no puede ser cero.";
      errorEl.hidden = false;
      return;
    }
    if (!comentario) {
      errorEl.textContent = "El comentario es obligatorio.";
      errorEl.hidden = false;
      return;
    }

    if (botonGuardar.disabled) return;
    botonGuardar.disabled = true;
    const textoOriginal = botonGuardar.textContent;
    botonGuardar.textContent = "Guardando...";

    try {
      await Api.ajustarStockRepuesto(repuesto.id_repuesto, cantidad, motivo, comentario);
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

Router.registrar("repuestos", renderRepuestos);
