// GESTION_CELULARES - js/pantallas/decisiones.js
// Fase 6, primera pieza: Bitacora de Decisiones (Especificacion de
// Interfaz Seccion 4.9, v1.8). Pantalla de solo lectura: listado
// cronologico de la hoja Decisiones, filtro por categoria, buscador
// de texto libre y vista de detalle sin edicion. Alcance confirmado
// por Pedro mediante elicitacion guiada al abrir la Fase 6 - sin
// formulario de alta manual y sin marcado de "Obsoleta" en esta
// version (ver Especificacion 4.9 e Indice Maestro).
//
// La hoja Decisiones ya recibe escrituras reales desde otras
// pantallas (hoy, Catalogo de Modelos via Modelos.gs); esta pantalla
// solo lee, nunca escribe - no crea un segundo mecanismo de alta.
//
// Misma estructura que clientes.js: una sola ruta ("#decisiones") con
// dos modos, listado (sin parametro) y detalle (con id_decision como
// parametro).

let decisionesEstadoLista = { todas: [], categoria: "", busqueda: "" };

async function renderDecisiones(contenedor, idDecision) {
  if (idDecision) {
    return renderDetalleDecision(contenedor, idDecision);
  }
  return renderListadoDecisiones(contenedor);
}

// --- Listado ---

async function renderListadoDecisiones(contenedor) {
  contenedor.innerHTML = `<p>Cargando bitácora de decisiones...</p>`;

  try {
    const decisiones = await Api.obtenerDecisiones();
    // Mas recientes primero. Si alguna fecha no se puede interpretar,
    // se la deja al final en vez de romper el orden de las demas.
    decisionesEstadoLista.todas = [...decisiones].sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();
      if (isNaN(fechaA)) return 1;
      if (isNaN(fechaB)) return -1;
      return fechaB - fechaA;
    });
    decisionesEstadoLista.categoria = "";
    decisionesEstadoLista.busqueda = "";
    pintarListadoDecisiones(contenedor);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar la bitácora de decisiones: ${err.message}</p>`;
  }
}

function pintarListadoDecisiones(contenedor) {
  const categorias = [...new Set(decisionesEstadoLista.todas.map((d) => d.categoria).filter(Boolean))].sort();

  const opcionesCategoria = categorias
    .map((c) => `<option value="${c}">${c}</option>`)
    .join("");

  contenedor.innerHTML = `
    <p><a href="#dashboard">&larr; Volver</a></p>
    <h2>Bitácora de Decisiones</h2>
    <p>Historial de decisiones registradas en el sistema. Pantalla de solo lectura - las decisiones se registran desde la pantalla correspondiente (por ejemplo, Catálogo de Modelos), no desde acá.</p>

    <div class="equipos-filtros">
      <input type="text" id="decisiones-busqueda" placeholder="Buscar en contexto, decisión o razón..." />
      <select id="decisiones-categoria">
        <option value="">Todas las categorías</option>
        ${opcionesCategoria}
      </select>
    </div>

    <div id="decisiones-tabla-contenedor"></div>
  `;

  document.getElementById("decisiones-busqueda").addEventListener("input", (ev) => {
    decisionesEstadoLista.busqueda = ev.target.value.trim().toLowerCase();
    pintarTablaDecisiones();
  });

  document.getElementById("decisiones-categoria").addEventListener("change", (ev) => {
    decisionesEstadoLista.categoria = ev.target.value;
    pintarTablaDecisiones();
  });

  pintarTablaDecisiones();
}

function pintarTablaDecisiones() {
  const { todas, categoria, busqueda } = decisionesEstadoLista;

  const filtradas = todas.filter((d) => {
    if (categoria && d.categoria !== categoria) return false;
    if (!busqueda) return true;
    const texto = [d.descripcion_contexto, d.decision_tomada, d.razon_principal]
      .join(" ")
      .toLowerCase();
    return texto.includes(busqueda);
  });

  const filas = filtradas
    .map(
      (d) => `
      <tr>
        <td>${formatearFechaDecision(d.fecha)}</td>
        <td>${d.categoria || "-"}</td>
        <td>${truncarTextoDecision(d.decision_tomada)}</td>
        <td>${d.estado || "-"}</td>
        <td><a href="#decisiones/${d.id_decision}">Ver detalle</a></td>
      </tr>`
    )
    .join("");

  document.getElementById("decisiones-tabla-contenedor").innerHTML = `
    <p>${filtradas.length} decisión(es)</p>
    <table class="tabla-simple">
      <thead><tr><th>Fecha</th><th>Categoría</th><th>Decisión tomada</th><th>Estado</th><th></th></tr></thead>
      <tbody>${filas || '<tr><td colspan="5">Sin decisiones que coincidan.</td></tr>'}</tbody>
    </table>
  `;
}

// --- Detalle ---

async function renderDetalleDecision(contenedor, idDecision) {
  contenedor.innerHTML = `<p>Cargando decisión ${idDecision}...</p>`;

  try {
    // Se reutiliza el listado ya cacheado en esta sesion de pantalla
    // si esta disponible, para no pedir de nuevo toda la hoja solo
    // para ver un detalle; si no esta (por ejemplo, se entro
    // directamente a esta URL), se carga la hoja completa una vez.
    if (!decisionesEstadoLista.todas.length) {
      decisionesEstadoLista.todas = await Api.obtenerDecisiones();
    }
    const decision = decisionesEstadoLista.todas.find((d) => d.id_decision === idDecision);

    if (!decision) {
      contenedor.innerHTML = `
        <p><a href="#decisiones">&larr; Volver al listado</a></p>
        <p>No se encontró la decisión ${idDecision}.</p>
      `;
      return;
    }

    pintarDetalleDecision(contenedor, decision);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar la decisión: ${err.message}</p>`;
  }
}

function pintarDetalleDecision(contenedor, d) {
  contenedor.innerHTML = `
    <p><a href="#decisiones">&larr; Volver al listado</a></p>

    <div class="ficha-encabezado">
      <h2>${d.id_decision}</h2>
      <p>Fecha: ${formatearFechaDecision(d.fecha)}</p>
      <p>Categoría: ${d.categoria || "-"}</p>
      <p>Estado: ${d.estado || "-"}</p>
    </div>

    <details class="ficha-seccion" open>
      <summary>Contexto y decisión</summary>
      <p><strong>Descripción del contexto:</strong> ${d.descripcion_contexto || "-"}</p>
      <p><strong>Decisión tomada:</strong> ${d.decision_tomada || "-"}</p>
      <p><strong>Razón principal:</strong> ${d.razon_principal || "-"}</p>
      <p><strong>Impacto esperado:</strong> ${d.impacto_esperado || "-"}</p>
      <p><strong>Quién decidió:</strong> ${d.quien_decidio || "-"}</p>
    </details>
  `;
}

// --- Utilidades locales (mismo patron que clientes.js: cada pantalla
// resuelve su propio formateo hasta que exista una utilidad comun) ---

function formatearFechaDecision(valor) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString("es-PY");
}

function truncarTextoDecision(texto, limite = 80) {
  if (!texto) return "-";
  return texto.length > limite ? texto.slice(0, limite).trim() + "…" : texto;
}

Router.registrar("decisiones", renderDecisiones);
