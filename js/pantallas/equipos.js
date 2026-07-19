// GESTION_CELULARES - js/pantallas/equipos.js
// Listado de Equipos (Especificacion de Interfaz Seccion 4.2):
// filtros, busqueda por texto, tabla coloreada por estado, y
// paginacion simple del lado del cliente. Sin boton de "transicion
// rapida" por fila (ver nota en Indice Maestro) - cada fila linkea
// a la Ficha de Equipo, que ya tiene el panel de acciones correcto
// segun las reglas reales del backend.

const EQUIPOS_POR_PAGINA = 20;

let equiposEstadoLista = {
  todos: [],
  filtrados: [],
  pagina: 1,
};

async function renderListadoEquipos(contenedor) {
  contenedor.innerHTML = `<p>Cargando equipos...</p>`;

  try {
    const datos = await Api.obtenerEquiposYModelos();
    equiposEstadoLista.todos = datos.equipos;
    equiposEstadoLista.filtrados = datos.equipos;
    equiposEstadoLista.pagina = 1;
    pintarListado(contenedor);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar equipos: ${err.message}</p>`;
  }
}

function pintarListado(contenedor) {
  const estados = [...new Set(equiposEstadoLista.todos.map((e) => e.estado))].sort();
  const marcas = [...new Set(equiposEstadoLista.todos.map((e) => e.marca))].filter(Boolean).sort();

  contenedor.innerHTML = `
    <h2>Listado de Equipos</h2>

    <div class="equipos-filtros">
      <input type="text" id="filtro-busqueda" placeholder="Buscar por ID, IMEI, marca, modelo, cliente..." />

      <select id="filtro-estado">
        <option value="">Todos los estados</option>
        ${estados.map((s) => `<option value="${s}">${s}</option>`).join("")}
      </select>

      <select id="filtro-marca">
        <option value="">Todas las marcas</option>
        ${marcas.map((m) => `<option value="${m}">${m}</option>`).join("")}
      </select>

      <label>Detección desde <input type="date" id="filtro-fecha-desde" /></label>
      <label>hasta <input type="date" id="filtro-fecha-hasta" /></label>
    </div>

    <div id="equipos-tabla-contenedor"></div>
    <div id="equipos-paginacion"></div>
  `;

  ["filtro-busqueda", "filtro-estado", "filtro-marca", "filtro-fecha-desde", "filtro-fecha-hasta"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => aplicarFiltros());
  });

  aplicarFiltros();
}

function aplicarFiltros() {
  const texto = document.getElementById("filtro-busqueda").value.trim().toLowerCase();
  const estado = document.getElementById("filtro-estado").value;
  const marca = document.getElementById("filtro-marca").value;
  const desde = document.getElementById("filtro-fecha-desde").value;
  const hasta = document.getElementById("filtro-fecha-hasta").value;

  equiposEstadoLista.filtrados = equiposEstadoLista.todos.filter((e) => {
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

  equiposEstadoLista.pagina = 1;
  pintarTablaYPaginacion();
}

function pintarTablaYPaginacion() {
  const { filtrados, pagina } = equiposEstadoLista;
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / EQUIPOS_POR_PAGINA));
  const inicio = (pagina - 1) * EQUIPOS_POR_PAGINA;
  const pagina_actual = filtrados.slice(inicio, inicio + EQUIPOS_POR_PAGINA);

  const filas = pagina_actual
    .map(
      (e) => `
      <tr class="fila-estado-${claseEstado(e.estado)}">
        <td>${e.id_equipo}</td>
        <td>${e.marca ?? ""}</td>
        <td>${e.modelo ?? ""}</td>
        <td>${e.estado ?? ""}</td>
        <td>${formatearFechaCorta(e.fecha_deteccion)}</td>
        <td>${formatearGuaraniesCorta(e.precio_compra)}</td>
        <td>${formatearGuaraniesCorta(e.precio_venta)}</td>
        <td><a href="#ficha-equipo/${e.id_equipo}">Ver ficha</a></td>
      </tr>`
    )
    .join("");

  document.getElementById("equipos-tabla-contenedor").innerHTML = `
    <p>${filtrados.length} equipo(s) encontrado(s)</p>
    <table class="tabla-simple">
      <thead>
        <tr><th>ID</th><th>Marca</th><th>Modelo</th><th>Estado</th><th>Detección</th><th>Precio compra</th><th>Precio venta</th><th></th></tr>
      </thead>
      <tbody>${filas || '<tr><td colspan="8">Sin resultados.</td></tr>'}</tbody>
    </table>
  `;

  const paginacionEl = document.getElementById("equipos-paginacion");
  if (totalPaginas <= 1) {
    paginacionEl.innerHTML = "";
    return;
  }

  paginacionEl.innerHTML = `
    <button id="pagina-anterior" ${pagina <= 1 ? "disabled" : ""}>Anterior</button>
    <span>Página ${pagina} de ${totalPaginas}</span>
    <button id="pagina-siguiente" ${pagina >= totalPaginas ? "disabled" : ""}>Siguiente</button>
  `;

  document.getElementById("pagina-anterior")?.addEventListener("click", () => {
    equiposEstadoLista.pagina -= 1;
    pintarTablaYPaginacion();
  });
  document.getElementById("pagina-siguiente")?.addEventListener("click", () => {
    equiposEstadoLista.pagina += 1;
    pintarTablaYPaginacion();
  });
}

function claseEstado(estado) {
  const positivos = ["Listo para venta", "Publicado", "Vendido", "Entregado"];
  const atencion = ["En reparación", "Esperando repuestos", "En garantía", "Devuelto"];
  const cerrados = ["Baja definitiva"];

  if (positivos.includes(estado)) return "positivo";
  if (atencion.includes(estado)) return "atencion";
  if (cerrados.includes(estado)) return "cerrado";
  return "neutro";
}

function formatearFechaCorta(valor) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleDateString("es-PY");
}

function formatearGuaraniesCorta(valor) {
  if (!valor && valor !== 0) return "-";
  return "Gs. " + Number(valor).toLocaleString("es-PY");
}

Router.registrar("equipos", renderListadoEquipos);
