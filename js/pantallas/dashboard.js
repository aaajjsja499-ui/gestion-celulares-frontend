// GESTION_CELULARES - js/pantallas/dashboard.js
// Version minima de Fase 0: prueba de conectividad leyendo Equipos
// y Modelos, y mostrandolos en una tabla simple (criterio de
// aceptacion de Fase 0, Hoja de Ruta). El Dashboard real y completo
// (tarjetas, alertas, capital de trabajo, aging, etc. - Especificacion
// de Interfaz Seccion 4.1) se construye en Fase 1 y Fase 4.

async function renderDashboard(contenedor) {
  contenedor.innerHTML = `
    <h2>Prueba de conectividad - Fase 0</h2>
    <p id="dashboard-estado">Cargando datos desde Apps Script...</p>
    <div id="dashboard-tablas"></div>
  `;

  const estadoEl = document.getElementById("dashboard-estado");

  try {
    const datos = await Api.obtenerEquiposYModelos();
    Cache.guardar("equipos", datos.equipos);
    Cache.guardar("modelos", datos.modelos);
    Estado.set({
      cache: {
        equipos: datos.equipos,
        modelos: datos.modelos,
        ultimaActualizacion: new Date().toISOString(),
      },
    });
    estadoEl.textContent = `Conexion OK. ${datos.equipos.length} equipos, ${datos.modelos.length} modelos.`;
    pintarTablas(datos);
  } catch (err) {
    console.error(err);
    estadoEl.textContent =
      "No se pudo conectar con Apps Script. Revisar CONFIG.APPS_SCRIPT_URL en config.js.";

    const cacheEquipos = Cache.leer("equipos");
    if (cacheEquipos) {
      estadoEl.textContent += " Mostrando la ultima copia guardada en este telefono.";
      pintarTablas({ equipos: cacheEquipos.valor, modelos: Cache.leer("modelos")?.valor || [] });
    }
  }
}

function pintarTablas(datos) {
  const cont = document.getElementById("dashboard-tablas");

  const filasEquipos = datos.equipos
    .map((e) => `<tr><td>${e.id_equipo ?? ""}</td><td>${e.marca ?? ""}</td><td>${e.modelo ?? ""}</td><td>${e.estado ?? ""}</td></tr>`)
    .join("");

  const filasModelos = datos.modelos
    .map((m) => `<tr><td>${m.id_modelo ?? ""}</td><td>${m.marca ?? ""}</td><td>${m.modelo ?? ""}</td><td>${m.estado_comercial ?? ""}</td></tr>`)
    .join("");

  cont.innerHTML = `
    <h3>Equipos (${datos.equipos.length})</h3>
    <table class="tabla-simple">
      <thead><tr><th>ID</th><th>Marca</th><th>Modelo</th><th>Estado</th></tr></thead>
      <tbody>${filasEquipos || '<tr><td colspan="4">Sin equipos todavia.</td></tr>'}</tbody>
    </table>

    <h3>Modelos (${datos.modelos.length})</h3>
    <table class="tabla-simple">
      <thead><tr><th>ID</th><th>Marca</th><th>Modelo</th><th>Estado comercial</th></tr></thead>
      <tbody>${filasModelos || '<tr><td colspan="4">Sin modelos todavia.</td></tr>'}</tbody>
    </table>
  `;
}

Router.registrar("dashboard", renderDashboard);
