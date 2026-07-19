// GESTION_CELULARES - js/pantallas/dashboard.js
// Version minima de Fase 0: prueba de conectividad leyendo Equipos
// y Modelos, y mostrandolos en una tabla simple (criterio de
// aceptacion de Fase 0, Hoja de Ruta). Incluye tambien la prueba de
// escritura con control de version (mismo criterio de aceptacion),
// y ahora links a la Ficha de Equipo y al Listado de Equipos
// (Fase 1). El Dashboard real y completo (tarjetas, alertas, capital
// de trabajo, aging, etc. - Especificacion de Interfaz Seccion 4.1)
// se construye mas adelante en Fase 1 y Fase 4.

async function renderDashboard(contenedor) {
  contenedor.innerHTML = `
    <h2>Prueba de conectividad - Fase 0</h2>
    <p><a href="#equipos">Ver listado completo de equipos &rarr;</a></p>
    <p id="dashboard-estado">Cargando datos desde Apps Script...</p>
    <div id="dashboard-tablas"></div>
    <div id="dashboard-prueba-escritura"></div>
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
    pintarPruebaEscritura(datos.equipos);
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
    .map(
      (e) =>
        `<tr><td><a href="#ficha-equipo/${e.id_equipo}">${e.id_equipo ?? ""}</a></td><td>${e.marca ?? ""}</td><td>${e.modelo ?? ""}</td><td>${e.estado ?? ""}</td></tr>`
    )
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

function pintarPruebaEscritura(equipos) {
  const cont = document.getElementById("dashboard-prueba-escritura");
  if (!equipos.length) {
    cont.innerHTML = "<p>Sin equipos para probar escritura todavia.</p>";
    return;
  }

  const equipoPrueba = equipos[0];

  cont.innerHTML = `
    <h3>Prueba de escritura (Fase 0)</h3>
    <p>Equipo: ${equipoPrueba.id_equipo} - version actual: <span id="prueba-version">${equipoPrueba.version}</span></p>
    <input type="text" id="prueba-nota" placeholder="Nota de prueba" />
    <button id="prueba-boton">Probar escritura</button>
    <p id="prueba-resultado"></p>
  `;

  document.getElementById("prueba-boton").addEventListener("click", async () => {
    const resultadoEl = document.getElementById("prueba-resultado");
    const nota = document.getElementById("prueba-nota").value;
    const versionActual = Number(document.getElementById("prueba-version").textContent);

    resultadoEl.textContent = "Escribiendo...";
    try {
      const resultado = await Api.probarEscrituraEquipo(equipoPrueba.id_equipo, versionActual, nota);
      resultadoEl.textContent = `Escritura OK. Nueva version: ${resultado.versionNueva}`;
      document.getElementById("prueba-version").textContent = resultado.versionNueva;
    } catch (err) {
      resultadoEl.textContent = `Error: ${err.message}`;
    }
  });
}

Router.registrar("dashboard", renderDashboard);
