// GESTION_CELULARES - js/pantallas/dashboard.js
// Dashboard real de Fase 1 (Especificacion de Interfaz Seccion 4.1,
// alcance segun Hoja de Ruta): tarjetas de resumen por estado,
// alertas de estancamiento (dias en estado actual vs SLA de
// Configuracion), y alta de equipo nuevo ("Nuevo equipo detectado").
// Reemplaza la pantalla de prueba de conectividad de Fase 0 (ya
// cerrada y verificada - ver Indice Maestro v2.8).
// Ventas del mes, stock de repuestos, capital de trabajo y el panel
// ampliado son de fases posteriores (RG-01). El Panel de Garantías
// (Fase 3, Pieza 2) ya existe en #ventas - link agregado abajo.

async function renderDashboard(contenedor) {
  contenedor.innerHTML = `<p>Cargando dashboard...</p>`;

  try {
    const datos = await Api.obtenerDatosDashboard();
    Cache.guardar("equipos", datos.equipos);
    Estado.set({
      cache: { equipos: datos.equipos, modelos: [], ultimaActualizacion: new Date().toISOString() },
    });
    pintarDashboard(contenedor, datos);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>No se pudo conectar con Apps Script: ${err.message}</p>`;
  }
}

function pintarDashboard(contenedor, datos) {
  const usuario = Estado.get().usuario;
  const puedeCrear = usuario && usuario.roles.some((r) => r === "Comprador" || r === "Administrador");

  contenedor.innerHTML = `
    <h2>Dashboard</h2>
    <p>
      <a href="#equipos">Ver listado completo de equipos &rarr;</a> ·
      <a href="#diagnosticos">Iniciar diagnóstico &rarr;</a> ·
      <a href="#ventas">Ventas y Garantías &rarr;</a>
    </p>

    ${puedeCrear ? '<button id="boton-nuevo-equipo">+ Nuevo equipo detectado</button>' : ""}

    <div id="dashboard-tarjetas"></div>
    <div id="dashboard-alertas"></div>
  `;

  pintarTarjetas(datos.equipos);
  pintarAlertas(datos.equipos, datos.historial, datos.configuracionSla);

  const botonNuevo = document.getElementById("boton-nuevo-equipo");
  if (botonNuevo) {
    botonNuevo.addEventListener("click", () => abrirModalNuevoEquipo());
  }
}

function pintarTarjetas(equipos) {
  const conteos = {};
  equipos.forEach((e) => {
    conteos[e.estado] = (conteos[e.estado] || 0) + 1;
  });

  const cont = document.getElementById("dashboard-tarjetas");
  const estados = Object.keys(conteos).sort();

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
    </div>
  `;
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
// estado (ej. Publicado), no genera alerta - se cubre con aging mas
// adelante (Fase 4).
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

function abrirModalNuevoEquipo() {
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>Nuevo equipo detectado</h3>
      <label for="nuevo-marca">Marca</label>
      <input type="text" id="nuevo-marca" />
      <label for="nuevo-modelo">Modelo</label>
      <input type="text" id="nuevo-modelo" />
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
