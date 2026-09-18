// GESTION_CELULARES - js/pantallas/dashboard.js
// Dashboard real de Fase 1 (Especificacion de Interfaz Seccion 4.1,
// alcance segun Hoja de Ruta): tarjetas de resumen por estado,
// alertas de estancamiento (dias en estado actual vs SLA de
// Configuracion), y alta de equipo nuevo ("Nuevo equipo detectado").
// Reemplaza la pantalla de prueba de conectividad de Fase 0 (ya
// cerrada y verificada - ver Indice Maestro v2.8).
// Ventas del mes y stock de repuestos siguen pendientes de una fase
// posterior (RG-01). El Panel de Garantías (Fase 3, Pieza 2) ya
// existe en #ventas - link agregado abajo.
//
// Fase 5 (Viabilidad, v3.24 del Indice Maestro): agregado el link a
// Consulta de Viabilidad, y soporte para recibir un parametro de ruta
// "marca|modelo" (ver codificarParametroViabilidad en
// viabilidad-consulta.js) que preabre el modal de alta de equipo con
// esos datos ya cargados - reutiliza el modal existente en vez de
// crear un segundo mecanismo de alta.
//
// Fase 6, segunda pieza (Panel ampliado - Especificacion de Interfaz
// Seccion 4.1 v1.9, Diseno Tecnico Secciones 4.5 a 4.9): se agrega la
// tarjeta de Capital de Trabajo (H-01, documentada desde Fase 1 pero
// nunca construida - hueco declarado al elicitar esta pieza) junto a
// las tarjetas de estado, y un bloque nuevo con aging (H-02), tasa de
// conversion (H-03), rentabilidad global del mes en curso (H-07) y
// alertas de retroalimentacion al catalogo (H-05). Se carga en un
// segundo paso, separado del dashboard base, para no retrasar lo que
// ya funcionaba (Api.obtenerDatosDashboard sigue siendo la primera
// llamada, igual que antes).
//
// Fase 6, tercera pieza (Reportes - Especificacion de Interfaz
// Seccion 4.13, Diseno Tecnico Seccion 4.12): agregado el link a
// Reportes en la lista de navegacion de abajo.

async function renderDashboard(contenedor, parametroRuta) {
  contenedor.innerHTML = `<p>Cargando dashboard...</p>`;

  try {
    const [datos, configuracion] = await Promise.all([
      Api.obtenerDatosDashboard(),
      Api.obtenerConfiguracion(),
    ]);
    Cache.guardar("equipos", datos.equipos);
    Estado.set({
      cache: { equipos: datos.equipos, modelos: [], ultimaActualizacion: new Date().toISOString() },
    });
    pintarDashboard(contenedor, datos, configuracion, parametroRuta);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>No se pudo conectar con Apps Script: ${err.message}</p>`;
  }
}

function pintarDashboard(contenedor, datos, configuracion, parametroRuta) {
  const usuario = Estado.get().usuario;
  const puedeCrear = usuario && usuario.roles.some((r) => r === "Comprador" || r === "Administrador");

  contenedor.innerHTML = `
    <h2>Dashboard</h2>
    <p>
      <a href="#equipos">Ver listado completo de equipos &rarr;</a> ·
      <a href="#viabilidad-consulta">Consulta de Viabilidad &rarr;</a> ·
      <a href="#diagnosticos">Iniciar diagnóstico &rarr;</a> ·
      <a href="#reparaciones">Cola de Reparaciones &rarr;</a> ·
      <a href="#ventas">Ventas y Garantías &rarr;</a> ·
      <a href="#clientes">Directorio de Clientes &rarr;</a> ·
      <a href="#catalogo">Catálogo de Modelos &rarr;</a> ·
      <a href="#repuestos">Inventario de Repuestos &rarr;</a> ·
      <a href="#reportes">Reportes &rarr;</a>
    </p>

    ${puedeCrear ? '<button id="boton-nuevo-equipo">+ Nuevo equipo detectado</button>' : ""}

    <div id="dashboard-tarjetas"></div>
    <div id="dashboard-alertas"></div>
    <div id="dashboard-panel-ampliado">
      <h3>Panel ampliado</h3>
      <p>Cargando panel ampliado...</p>
    </div>
  `;

  pintarTarjetas(datos.equipos, configuracion);
  pintarAlertas(datos.equipos, datos.historial, datos.configuracionSla);
  cargarYPintarPanelAmpliado(datos.equipos, datos.historial, configuracion);

  const botonNuevo = document.getElementById("boton-nuevo-equipo");
  if (botonNuevo) {
    botonNuevo.addEventListener("click", () => abrirModalNuevoEquipo());
  }

  // Llegada desde "Registrar equipo de este modelo" en Viabilidad:
  // preabre el modal ya con marca/modelo cargados, solo si el rol
  // puede crear equipos (mismo criterio que el boton de arriba).
  if (parametroRuta && puedeCrear) {
    const [marcaPre, modeloPre] = parametroRuta.split("|").map((valor) => decodeURIComponent(valor || ""));
    if (marcaPre || modeloPre) {
      abrirModalNuevoEquipo(marcaPre, modeloPre);
    }
  }
}

function pintarTarjetas(equipos, configuracion) {
  const conteos = {};
  equipos.forEach((e) => {
    conteos[e.estado] = (conteos[e.estado] || 0) + 1;
  });

  const cont = document.getElementById("dashboard-tarjetas");
  const estados = Object.keys(conteos).sort();
  const capital = Alertas.calcularCapitalDeTrabajo(equipos, configuracion);

  cont.innerHTML = `
    <div class="tarjetas-resumen">
      ${estados
        .map(
          (estado) => `
        <div class="tarjeta-resumen">
          <div class="tarjeta-numero">${conteos[estado]}</div>
          <div class="tarjeta-etiqueta">${estado}</div>
        </div>`
        )
        .join("")}
      ${!estados.length ? "<p>Sin equipos todavia. Usa \"Nuevo equipo detectado\" para cargar el primero.</p>" : ""}
      ${pintarTarjetaCapital(capital)}
    </div>
  `;
}

// Capital de Trabajo (H-01, Diseno Tecnico Seccion 4.5): documentada
// desde v1.4 como parte del Dashboard base de Fase 1, construida
// recien aca (Fase 6) - hueco declarado, no resuelto en silencio (ver
// Indice Maestro). Configuracion.capital_disponible y
// capital_minimo_alerta pueden estar vacios en la hoja real: se avisa
// en vez de inventar un numero, mismo patron que Viabilidad.
function pintarTarjetaCapital(capital) {
  if (!capital.capitalDisponibleConfigurado) {
    return `
      <div class="tarjeta-resumen tarjeta-aviso-sin-configurar">
        <div class="tarjeta-etiqueta">Capital de trabajo</div>
        <div class="tarjeta-aviso">Configuracion.capital_disponible todavía no está cargado.</div>
      </div>`;
  }

  return `
    <div class="tarjeta-resumen ${capital.alerta ? "tarjeta-resumen-alerta" : ""}">
      <div class="tarjeta-numero">${formatearPYG(capital.capitalLibre)}</div>
      <div class="tarjeta-etiqueta">Capital libre (inmovilizado: ${formatearPYG(capital.capitalInmovilizado)})</div>
      ${
        !capital.umbralConfigurado
          ? '<div class="tarjeta-aviso">Umbral capital_minimo_alerta todavía no configurado - por ahora solo avisa si el capital libre es negativo.</div>'
          : ""
      }
    </div>`;
}

function pintarAlertas(equipos, historial, configuracionSla) {
  const alertas = calcularAlertas(equipos, historial, configuracionSla);
  const cont = document.getElementById("dashboard-alertas");

  if (!alertas.length) {
    cont.innerHTML = "<h3>Alertas</h3><p>Sin equipos estancados por ahora.</p>";
    return;
  }

  cont.innerHTML = `
    <h3>Alertas (${alertas.length})</h3>
    <ul class="lista-alertas">
      ${alertas
        .map(
          (a) => `
        <li>
          <a href="#ficha-equipo/${a.idEquipo}">${a.idEquipo}</a> -
          ${a.estado} hace ${a.dias} día(s) (objetivo: ${a.sla} día(s))
        </li>`
        )
        .join("")}
    </ul>
  `;
}

// Calcula, para cada equipo, cuantos dias lleva en su estado actual
// (segun la entrada mas reciente en Historial_Estados, o
// fecha_deteccion si no hay historial todavia) y lo compara contra
// el SLA de Configuracion para ese estado. Sin SLA definido para el
// estado (ej. Publicado), no genera alerta - se cubre con aging en el
// Panel ampliado (Fase 6, ver cargarYPintarPanelAmpliado).
function calcularAlertas(equipos, historial, configuracionSla) {
  const ultimaEntradaPorEquipo = {};
  historial.forEach((h) => {
    const fecha = new Date(h.fecha_hora);
    if (!ultimaEntradaPorEquipo[h.id_equipo] || fecha > ultimaEntradaPorEquipo[h.id_equipo]) {
      ultimaEntradaPorEquipo[h.id_equipo] = fecha;
    }
  });

  const ahora = new Date();
  const alertas = [];

  equipos.forEach((e) => {
    const sla = configuracionSla[e.estado];
    if (!sla) return;

    const fechaEntrada = ultimaEntradaPorEquipo[e.id_equipo] || (e.fecha_deteccion ? new Date(e.fecha_deteccion) : null);
    if (!fechaEntrada || isNaN(fechaEntrada.getTime())) return;

    const dias = Math.floor((ahora - fechaEntrada) / (1000 * 60 * 60 * 24));
    if (dias > sla) {
      alertas.push({ idEquipo: e.id_equipo, estado: e.estado, dias, sla });
    }
  });

  return alertas.sort((a, b) => b.dias - a.dias);
}

// Panel ampliado (Fase 6, segunda pieza): aging, tasa de conversion,
// rentabilidad global y alertas H-05. Se pide en un segundo paso,
// separado del dashboard base, para no retrasar las tarjetas y
// alertas de estancamiento que ya funcionaban antes de esta pieza.
async function cargarYPintarPanelAmpliado(equipos, historial, configuracion) {
  const cont = document.getElementById("dashboard-panel-ampliado");

  try {
    const [datosAmpliado, equiposYModelos, diagnosticos] = await Promise.all([
      Api.obtenerDatosDashboardAmpliado(),
      Api.obtenerEquiposYModelos(),
      Api.obtenerDiagnosticosTodos().catch((err) => {
        console.warn("No se pudo cargar diagnosticos para H-05 en el Dashboard:", err);
        return null;
      }),
    ]);

    const rango = Alertas.obtenerRangoMesActual();
    const aging = Alertas.calcularAging(equipos, historial);
    const conversionCompra = Alertas.calcularTasaConversion(historial, "Detectado", "Comprado", rango);
    const conversionVenta = Alertas.calcularTasaConversion(historial, "Publicado", "Vendido", rango);
    const rentabilidad = Alertas.calcularRentabilidadGlobal(
      datosAmpliado.ventas,
      equipos,
      datosAmpliado.gastosOperativos,
      rango
    );
    const alertasCatalogo = diagnosticos
      ? Alertas.listarAlertasCatalogo(equiposYModelos.modelos, equipos, diagnosticos, configuracion)
      : { umbralesConfigurados: false, sinDatos: true, alertas: [] };

    pintarPanelAmpliado(cont, { rango, aging, conversionCompra, conversionVenta, rentabilidad, alertasCatalogo });
  } catch (err) {
    console.error(err);
    cont.innerHTML = `<h3>Panel ampliado</h3><p>No se pudo cargar el panel ampliado: ${err.message}</p>`;
  }
}

function pintarPanelAmpliado(cont, datos) {
  const { rango, aging, conversionCompra, conversionVenta, rentabilidad, alertasCatalogo } = datos;
  const agingTop = aging.slice(0, 5);
  const etiquetaPeriodo =
    "Mes en curso (" + rango.inicio.toLocaleDateString("es-PY") + " a " + rango.fin.toLocaleDateString("es-PY") + ")";

  cont.innerHTML = `
    <h3>Panel ampliado</h3>
    <p class="panel-ampliado-periodo">Período: ${etiquetaPeriodo}</p>

    <div class="tarjetas-resumen">
      <div class="tarjeta-resumen">
        <div class="tarjeta-numero">${conversionCompra.tasa === null ? "-" : conversionCompra.tasa.toFixed(0) + "%"}</div>
        <div class="tarjeta-etiqueta">Detectado &rarr; Comprado (${conversionCompra.cantidadB}/${conversionCompra.cantidadA})</div>
      </div>
      <div class="tarjeta-resumen">
        <div class="tarjeta-numero">${conversionVenta.tasa === null ? "-" : conversionVenta.tasa.toFixed(0) + "%"}</div>
        <div class="tarjeta-etiqueta">Publicado &rarr; Vendido (${conversionVenta.cantidadB}/${conversionVenta.cantidadA})</div>
      </div>
      <div class="tarjeta-resumen ${rentabilidad.rentabilidadGlobal < 0 ? "tarjeta-resumen-alerta" : ""}">
        <div class="tarjeta-numero">${formatearPYG(rentabilidad.rentabilidadGlobal)}</div>
        <div class="tarjeta-etiqueta">Rentabilidad global (${rentabilidad.cantidadVentas} venta(s) - ${formatearPYG(rentabilidad.gastosOperativos)} gastos)</div>
      </div>
    </div>

    <h4>Antigüedad de inventario (Listo para venta / Publicado)</h4>
    ${
      agingTop.length
        ? `
      <ul class="lista-alertas">
        ${agingTop
          .map(
            (a) => `
          <li>
            <a href="#ficha-equipo/${a.idEquipo}">${a.idEquipo}</a> -
            ${a.marca || ""} ${a.modelo || ""}, ${a.estado}, ${a.dias === null ? "sin fecha" : a.dias + " día(s)"}
          </li>`
          )
          .join("")}
      </ul>`
        : "<p>Sin equipos en Listo para venta o Publicado por ahora.</p>"
    }

    <h4>Retroalimentación al catálogo (H-05)</h4>
    ${
      alertasCatalogo.sinDatos
        ? '<p class="tarjeta-aviso">No se pudo cargar el detalle de diagnósticos - este bloque no está disponible por ahora.</p>'
        : !alertasCatalogo.umbralesConfigurados
        ? '<p class="tarjeta-aviso">Configuracion.umbral_tasa_falla y/o ventas_minimas_evaluacion todavía no están cargados - este aviso queda pendiente hasta que se definan los valores reales.</p>'
        : alertasCatalogo.alertas.length
        ? `<ul class="lista-alertas">
            ${alertasCatalogo.alertas
              .map((a) => `<li><a href="#catalogo">${a.marca} ${a.modelo}</a> - ${a.motivos.join("; ")}</li>`)
              .join("")}
          </ul>`
        : "<p>Sin modelos que superen los umbrales por ahora.</p>"
    }
  `;
}

function abrirModalNuevoEquipo(marcaPrefill, modeloPrefill) {
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>Nuevo equipo detectado</h3>
      <label for="nuevo-marca">Marca</label>
      <input type="text" id="nuevo-marca" value="${marcaPrefill || ""}" />
      <label for="nuevo-modelo">Modelo</label>
      <input type="text" id="nuevo-modelo" value="${modeloPrefill || ""}" />
      <label for="nuevo-notas">Notas (opcional)</label>
      <textarea id="nuevo-notas" rows="2"></textarea>
      <p id="nuevo-error" class="modal-error" hidden></p>
      <div class="modal-botones">
        <button id="nuevo-cancelar">Cancelar</button>
        <button id="nuevo-confirmar">Crear</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  document.getElementById("nuevo-cancelar").addEventListener("click", () => fondo.remove());

  document.getElementById("nuevo-confirmar").addEventListener("click", async () => {
    const marca = document.getElementById("nuevo-marca").value.trim();
    const modelo = document.getElementById("nuevo-modelo").value.trim();
    const notas = document.getElementById("nuevo-notas").value.trim();
    const errorEl = document.getElementById("nuevo-error");

    if (!marca || !modelo) {
      errorEl.textContent = "Marca y modelo son obligatorios.";
      errorEl.hidden = false;
      return;
    }

    try {
      const resultado = await Api.crearEquipoDetectado(marca, modelo, notas);
      fondo.remove();
      Router.navegar("ficha-equipo", resultado.idEquipo);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}

Router.registrar("dashboard", renderDashboard);
