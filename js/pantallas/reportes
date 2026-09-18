// GESTION_CELULARES - js/pantallas/reportes.js
// Reportes Exportables (Especificacion de Interfaz Seccion 4.13,
// Diseno Tecnico Seccion 4.12, Fase 6 - tercera y ultima pieza):
// cuatro reportes independientes (Equipos, Ventas, Reparaciones,
// Gastos_Operativos), cada uno con sus propios filtros y dos botones
// de exportacion (CSV, Excel). Cada reporte exporta todas las
// columnas reales de su hoja, sin agregar columnas calculadas (eso ya
// lo cubre el Dashboard ampliado) - las columnas se toman
// dinamicamente de las claves de los datos que devuelve el backend,
// en el mismo orden en que vienen (Object.keys respeta el orden de
// insercion, que a su vez respeta el orden de columnas de la hoja
// segun leerHojaComoObjetos_ en el backend).
//
// Equipos reutiliza exactamente los mismos filtros ya construidos
// para el Listado de Equipos (equipos.js / Especificacion 4.2) -
// mismo criterio, sin duplicar un segundo componente de filtro.
//
// Excel (.xlsx) requiere la libreria SheetJS (variable global XLSX),
// cargada por index.html antes de este archivo - primera dependencia
// externa del proyecto (Diseno Tecnico Seccion 4.12). Si por algun
// motivo no cargo (ej. sin conexion a la CDN), el boton de Excel
// avisa en vez de fallar en silencio; el CSV nunca depende de ella.

let reportesEstado = {
  equipos: { todos: [], filtrados: [] },
  ventas: { todos: [], filtrados: [] },
  reparaciones: { todos: [], filtrados: [] },
  gastos: { todos: [], filtrados: [] },
};

async function renderReportes(contenedor) {
  contenedor.innerHTML = `<p>Cargando reportes...</p>`;

  try {
    const [equiposYModelos, datosAmpliado, reparaciones] = await Promise.all([
      Api.obtenerEquiposYModelos(),
      Api.obtenerDatosDashboardAmpliado(),
      Api.obtenerReparacionesTodas(),
    ]);

    reportesEstado.equipos.todos = equiposYModelos.equipos || [];
    reportesEstado.ventas.todos = datosAmpliado.ventas || [];
    reportesEstado.gastos.todos = datosAmpliado.gastosOperativos || [];
    reportesEstado.reparaciones.todos = reparaciones || [];

    pintarReportes(contenedor);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar reportes: ${err.message}</p>`;
  }
}

function pintarReportes(contenedor) {
  contenedor.innerHTML = `
    <h2>Reportes</h2>
    <p>Cada reporte se descarga con las columnas reales de su hoja y las filas que queden después de aplicar sus filtros.</p>

    <section id="reporte-equipos" class="reporte-bloque"></section>
    <section id="reporte-ventas" class="reporte-bloque"></section>
    <section id="reporte-reparaciones" class="reporte-bloque"></section>
    <section id="reporte-gastos" class="reporte-bloque"></section>
  `;

  pintarReporteEquipos();
  pintarReporteVentas();
  pintarReporteReparaciones();
  pintarReporteGastos();
}

// --- Equipos: texto libre, estado, marca, rango de fechas (mismos
// filtros que Listado de Equipos, Especificacion 4.2) ---

function pintarReporteEquipos() {
  const datos = reportesEstado.equipos.todos;
  const estados = [...new Set(datos.map((e) => e.estado))].filter(Boolean).sort();
  const marcas = [...new Set(datos.map((e) => e.marca))].filter(Boolean).sort();
  const cont = document.getElementById("reporte-equipos");

  cont.innerHTML = `
    <h3>Equipos</h3>
    <div class="equipos-filtros">
      <input type="text" id="rep-eq-busqueda" placeholder="Buscar por ID, IMEI, marca, modelo, cliente..." />
      <select id="rep-eq-estado">
        <option value="">Todos los estados</option>
        ${estados.map((s) => `<option value="${s}">${s}</option>`).join("")}
      </select>
      <select id="rep-eq-marca">
        <option value="">Todas las marcas</option>
        ${marcas.map((m) => `<option value="${m}">${m}</option>`).join("")}
      </select>
      <label>Detección desde <input type="date" id="rep-eq-desde" /></label>
      <label>hasta <input type="date" id="rep-eq-hasta" /></label>
    </div>
    <p id="rep-eq-resumen"></p>
    <div class="reporte-botones">
      <button id="rep-eq-csv">Descargar CSV</button>
      <button id="rep-eq-excel">Descargar Excel</button>
    </div>
  `;

  ["rep-eq-busqueda", "rep-eq-estado", "rep-eq-marca", "rep-eq-desde", "rep-eq-hasta"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => aplicarFiltroEquipos());
  });

  document
    .getElementById("rep-eq-csv")
    .addEventListener("click", () => exportarCSV(reportesEstado.equipos.filtrados, "reporte_equipos"));
  document
    .getElementById("rep-eq-excel")
    .addEventListener("click", () => exportarExcel(reportesEstado.equipos.filtrados, "reporte_equipos", "Equipos"));

  aplicarFiltroEquipos();
}

function aplicarFiltroEquipos() {
  const texto = document.getElementById("rep-eq-busqueda").value.trim().toLowerCase();
  const estado = document.getElementById("rep-eq-estado").value;
  const marca = document.getElementById("rep-eq-marca").value;
  const desde = document.getElementById("rep-eq-desde").value;
  const hasta = document.getElementById("rep-eq-hasta").value;

  reportesEstado.equipos.filtrados = reportesEstado.equipos.todos.filter((e) => {
    if (estado && e.estado !== estado) return false;
    if (marca && e.marca !== marca) return false;

    if (texto) {
      const campos = [e.id_equipo, e.imei, e.marca, e.modelo, e.cliente].map((v) => String(v ?? "").toLowerCase());
      if (!campos.some((c) => c.includes(texto))) return false;
    }

    if (desde || hasta) {
      const fecha = e.fecha_deteccion ? new Date(e.fecha_deteccion) : null;
      if (!fecha || isNaN(fecha.getTime())) return false;
      if (desde && fecha < new Date(desde)) return false;
      if (hasta && fecha > new Date(hasta + "T23:59:59")) return false;
    }

    return true;
  });

  actualizarResumenYBotones("rep-eq-resumen", "rep-eq-csv", "rep-eq-excel", reportesEstado.equipos.filtrados);
}

// --- Ventas: rango de fechas (fecha_venta), canal_venta ---

function pintarReporteVentas() {
  const datos = reportesEstado.ventas.todos;
  const canales = [...new Set(datos.map((v) => v.canal_venta))].filter(Boolean).sort();
  const cont = document.getElementById("reporte-ventas");

  cont.innerHTML = `
    <h3>Ventas</h3>
    <div class="equipos-filtros">
      <label>Venta desde <input type="date" id="rep-ve-desde" /></label>
      <label>hasta <input type="date" id="rep-ve-hasta" /></label>
      <select id="rep-ve-canal">
        <option value="">Todos los canales</option>
        ${canales.map((c) => `<option value="${c}">${c}</option>`).join("")}
      </select>
    </div>
    <p id="rep-ve-resumen"></p>
    <div class="reporte-botones">
      <button id="rep-ve-csv">Descargar CSV</button>
      <button id="rep-ve-excel">Descargar Excel</button>
    </div>
  `;

  ["rep-ve-desde", "rep-ve-hasta", "rep-ve-canal"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => aplicarFiltroVentas());
  });

  document
    .getElementById("rep-ve-csv")
    .addEventListener("click", () => exportarCSV(reportesEstado.ventas.filtrados, "reporte_ventas"));
  document
    .getElementById("rep-ve-excel")
    .addEventListener("click", () => exportarExcel(reportesEstado.ventas.filtrados, "reporte_ventas", "Ventas"));

  aplicarFiltroVentas();
}

function aplicarFiltroVentas() {
  const desde = document.getElementById("rep-ve-desde").value;
  const hasta = document.getElementById("rep-ve-hasta").value;
  const canal = document.getElementById("rep-ve-canal").value;

  reportesEstado.ventas.filtrados = reportesEstado.ventas.todos.filter((v) => {
    if (canal && v.canal_venta !== canal) return false;

    if (desde || hasta) {
      const fecha = v.fecha_venta ? new Date(v.fecha_venta) : null;
      if (!fecha || isNaN(fecha.getTime())) return false;
      if (desde && fecha < new Date(desde)) return false;
      if (hasta && fecha > new Date(hasta + "T23:59:59")) return false;
    }

    return true;
  });

  actualizarResumenYBotones("rep-ve-resumen", "rep-ve-csv", "rep-ve-excel", reportesEstado.ventas.filtrados);
}

// --- Reparaciones: rango de fechas (fecha_inicio), resultado ---

function pintarReporteReparaciones() {
  const datos = reportesEstado.reparaciones.todos;
  const resultados = [...new Set(datos.map((r) => r.resultado))].filter(Boolean).sort();
  const cont = document.getElementById("reporte-reparaciones");

  cont.innerHTML = `
    <h3>Reparaciones</h3>
    <div class="equipos-filtros">
      <label>Inicio desde <input type="date" id="rep-re-desde" /></label>
      <label>hasta <input type="date" id="rep-re-hasta" /></label>
      <select id="rep-re-resultado">
        <option value="">Todos los resultados</option>
        ${resultados.map((r) => `<option value="${r}">${r}</option>`).join("")}
      </select>
    </div>
    <p id="rep-re-resumen"></p>
    <div class="reporte-botones">
      <button id="rep-re-csv">Descargar CSV</button>
      <button id="rep-re-excel">Descargar Excel</button>
    </div>
  `;

  ["rep-re-desde", "rep-re-hasta", "rep-re-resultado"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => aplicarFiltroReparaciones());
  });

  document
    .getElementById("rep-re-csv")
    .addEventListener("click", () => exportarCSV(reportesEstado.reparaciones.filtrados, "reporte_reparaciones"));
  document
    .getElementById("rep-re-excel")
    .addEventListener("click", () =>
      exportarExcel(reportesEstado.reparaciones.filtrados, "reporte_reparaciones", "Reparaciones")
    );

  aplicarFiltroReparaciones();
}

function aplicarFiltroReparaciones() {
  const desde = document.getElementById("rep-re-desde").value;
  const hasta = document.getElementById("rep-re-hasta").value;
  const resultado = document.getElementById("rep-re-resultado").value;

  reportesEstado.reparaciones.filtrados = reportesEstado.reparaciones.todos.filter((r) => {
    if (resultado && r.resultado !== resultado) return false;

    if (desde || hasta) {
      const fecha = r.fecha_inicio ? new Date(r.fecha_inicio) : null;
      if (!fecha || isNaN(fecha.getTime())) return false;
      if (desde && fecha < new Date(desde)) return false;
      if (hasta && fecha > new Date(hasta + "T23:59:59")) return false;
    }

    return true;
  });

  actualizarResumenYBotones("rep-re-resumen", "rep-re-csv", "rep-re-excel", reportesEstado.reparaciones.filtrados);
}

// --- Gastos_Operativos: rango de fechas (fecha) ---

function pintarReporteGastos() {
  const cont = document.getElementById("reporte-gastos");

  cont.innerHTML = `
    <h3>Gastos operativos</h3>
    <div class="equipos-filtros">
      <label>Fecha desde <input type="date" id="rep-ga-desde" /></label>
      <label>hasta <input type="date" id="rep-ga-hasta" /></label>
    </div>
    <p id="rep-ga-resumen"></p>
    <div class="reporte-botones">
      <button id="rep-ga-csv">Descargar CSV</button>
      <button id="rep-ga-excel">Descargar Excel</button>
    </div>
  `;

  ["rep-ga-desde", "rep-ga-hasta"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => aplicarFiltroGastos());
  });

  document
    .getElementById("rep-ga-csv")
    .addEventListener("click", () => exportarCSV(reportesEstado.gastos.filtrados, "reporte_gastos_operativos"));
  document
    .getElementById("rep-ga-excel")
    .addEventListener("click", () =>
      exportarExcel(reportesEstado.gastos.filtrados, "reporte_gastos_operativos", "Gastos_Operativos")
    );

  aplicarFiltroGastos();
}

function aplicarFiltroGastos() {
  const desde = document.getElementById("rep-ga-desde").value;
  const hasta = document.getElementById("rep-ga-hasta").value;

  reportesEstado.gastos.filtrados = reportesEstado.gastos.todos.filter((g) => {
    if (desde || hasta) {
      const fecha = g.fecha ? new Date(g.fecha) : null;
      if (!fecha || isNaN(fecha.getTime())) return false;
      if (desde && fecha < new Date(desde)) return false;
      if (hasta && fecha > new Date(hasta + "T23:59:59")) return false;
    }

    return true;
  });

  actualizarResumenYBotones("rep-ga-resumen", "rep-ga-csv", "rep-ga-excel", reportesEstado.gastos.filtrados);
}

// --- Comun a los cuatro reportes ---

function actualizarResumenYBotones(idResumen, idBotonCsv, idBotonExcel, filas) {
  const resumenEl = document.getElementById(idResumen);
  const csvEl = document.getElementById(idBotonCsv);
  const excelEl = document.getElementById(idBotonExcel);

  resumenEl.textContent = filas.length ? `${filas.length} fila(s) para exportar.` : "Sin filas para exportar con estos filtros.";

  csvEl.disabled = !filas.length;
  excelEl.disabled = !filas.length;
}

// --- Exportacion (Diseno Tecnico 4.12) ---

function columnasDeFilas(filas) {
  return filas.length ? Object.keys(filas[0]) : [];
}

function escaparCeldaCSV(valor) {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  if (/[",\n\r;]/.test(texto)) {
    return '"' + texto.replace(/"/g, '""') + '"';
  }
  return texto;
}

function armarTextoCSV(filas) {
  const columnas = columnasDeFilas(filas);
  if (!columnas.length) return "";

  const encabezado = columnas.map(escaparCeldaCSV).join(",");
  const filasTexto = filas.map((fila) => columnas.map((c) => escaparCeldaCSV(fila[c])).join(","));

  return [encabezado, ...filasTexto].join("\r\n");
}

function marcaTiempoArchivo() {
  const ahora = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return ahora.getFullYear() + pad(ahora.getMonth() + 1) + pad(ahora.getDate()) + "_" + pad(ahora.getHours()) + pad(ahora.getMinutes());
}

function descargarBlob(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

function exportarCSV(filas, nombreBase) {
  if (!filas.length) return;

  const texto = armarTextoCSV(filas);
  // BOM UTF-8 al inicio: sin esto, Excel (sobre todo en Windows)
  // interpreta mal las tildes y la "ñ" de campos como marca/estado.
  const blob = new Blob(["﻿" + texto], { type: "text/csv;charset=utf-8;" });
  descargarBlob(blob, `${nombreBase}_${marcaTiempoArchivo()}.csv`);
}

function exportarExcel(filas, nombreBase, nombreHoja) {
  if (!filas.length) return;

  if (typeof XLSX === "undefined") {
    alert("No se pudo cargar la librería de Excel (sin conexión, o la CDN no respondió). Probá de nuevo, o usá Descargar CSV mientras tanto.");
    return;
  }

  const columnas = columnasDeFilas(filas);
  const hoja = XLSX.utils.json_to_sheet(filas, { header: columnas });
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, (nombreHoja || "Reporte").slice(0, 31));
  XLSX.writeFile(libro, `${nombreBase}_${marcaTiempoArchivo()}.xlsx`);
}

Router.registrar("reportes", renderReportes);
