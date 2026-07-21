// GESTION_CELULARES - js/pantallas/ventas.js
// Fase 3, Pieza 2: Panel de Garantias (Especificacion de Interfaz
// Seccion 4.7). El registro de venta y la entrega ya viven en
// ficha-equipo.js (Pieza 1, cerrada) - esta pantalla es la vista
// propia de "Ventas y Garantías" que faltaba en la navegación.
//
// Alcance de esta pieza: solo el Panel de Garantías (lista de
// equipos "En garantía", días restantes, filtro por vencimiento
// próximo). El historial completo de ventas (todas las ventas,
// no solo las que siguen en garantía) queda pendiente para una
// pieza aparte - no estaba en el alcance pedido para esta sesión y
// se señala así en vez de improvisarlo.
//
// Mismo patrón que equipos.js: sin botón de "transición rápida" por
// fila - cada fila linkea a la Ficha de Equipo, que ya tiene el
// panel de acciones correcto (Registrar devolución, Cerrar garantía)
// según las reglas reales del backend.

const DIAS_VENCIMIENTO_PROXIMO = 7;

let garantiasEstadoLista = {
  todos: [],
  filtrados: [],
  soloProximosAVencer: false,
};

async function renderVentasGarantias(contenedor) {
  contenedor.innerHTML = `<p>Cargando garantías activas...</p>`;

  try {
    const equipos = await Api.obtenerEquiposEnGarantia();
    garantiasEstadoLista.todos = equipos;
    garantiasEstadoLista.filtrados = equipos;
    garantiasEstadoLista.soloProximosAVencer = false;
    pintarVentasGarantias(contenedor);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar garantías: ${err.message}</p>`;
  }
}

function pintarVentasGarantias(contenedor) {
  contenedor.innerHTML = `
    <h2>Ventas y Garantías</h2>
    <p class="ficha-seccion-deshabilitada">
      Historial completo de ventas: pendiente, todavía no tiene pantalla propia.
      El registro de una venta se hace desde la Ficha de Equipo ("Vendido" / "Entregado").
    </p>

    <h3>Panel de Garantías</h3>

    <div class="equipos-filtros">
      <label>
        <input type="checkbox" id="filtro-vencimiento-proximo" />
        Solo próximas a vencer (${DIAS_VENCIMIENTO_PROXIMO} días o menos, incluye vencidas)
      </label>
    </div>

    <div id="garantias-tabla-contenedor"></div>
  `;

  document
    .getElementById("filtro-vencimiento-proximo")
    .addEventListener("change", (ev) => {
      garantiasEstadoLista.soloProximosAVencer = ev.target.checked;
      aplicarFiltroGarantias();
    });

  aplicarFiltroGarantias();
}

function aplicarFiltroGarantias() {
  const { todos, soloProximosAVencer } = garantiasEstadoLista;

  garantiasEstadoLista.filtrados = soloProximosAVencer
    ? todos.filter((g) => g.diasRestantes !== null && g.diasRestantes <= DIAS_VENCIMIENTO_PROXIMO)
    : todos;

  pintarTablaGarantias();
}

function pintarTablaGarantias() {
  const { filtrados } = garantiasEstadoLista;

  const filas = filtrados
    .map((g) => {
      if (g.inconsistente) {
        return `
        <tr class="fila-estado-atencion">
          <td>${g.idEquipo}</td>
          <td>${g.marca ?? ""}</td>
          <td>${g.modelo ?? ""}</td>
          <td colspan="4">Sin venta asociada encontrada - revisar en la ficha.</td>
          <td><a href="#ficha-equipo/${g.idEquipo}">Ver ficha</a></td>
        </tr>`;
      }

      return `
      <tr class="${claseFilaGarantia(g.diasRestantes)}">
        <td>${g.idEquipo}</td>
        <td>${g.marca ?? ""}</td>
        <td>${g.modelo ?? ""}</td>
        <td>${g.cliente ?? "-"}</td>
        <td>${formatearFechaCortaGarantia(g.fechaVenta)}</td>
        <td>${g.garantiaDias} día(s)</td>
        <td>${textoDiasRestantes(g.diasRestantes)}</td>
        <td><a href="#ficha-equipo/${g.idEquipo}">Ver ficha</a></td>
      </tr>`;
    })
    .join("");

  document.getElementById("garantias-tabla-contenedor").innerHTML = `
    <p>${filtrados.length} equipo(s) en garantía</p>
    <table class="tabla-simple">
      <thead>
        <tr>
          <th>ID</th><th>Marca</th><th>Modelo</th><th>Cliente</th>
          <th>Fecha venta</th><th>Garantía</th><th>Días restantes</th><th></th>
        </tr>
      </thead>
      <tbody>${filas || '<tr><td colspan="8">Sin equipos en garantía por ahora.</td></tr>'}</tbody>
    </table>
  `;
}

function claseFilaGarantia(diasRestantes) {
  if (diasRestantes === null) return "fila-estado-atencion";
  if (diasRestantes < 0) return "fila-estado-cerrado";
  if (diasRestantes <= DIAS_VENCIMIENTO_PROXIMO) return "fila-estado-atencion";
  return "";
}

function textoDiasRestantes(diasRestantes) {
  if (diasRestantes === null) return "-";
  if (diasRestantes < 0) return `Vencida hace ${Math.abs(diasRestantes)} día(s)`;
  if (diasRestantes === 0) return "Vence hoy";
  return `${diasRestantes} día(s)`;
}

function formatearFechaCortaGarantia(valor) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleDateString("es-PY");
}

Router.registrar("ventas", renderVentasGarantias);
