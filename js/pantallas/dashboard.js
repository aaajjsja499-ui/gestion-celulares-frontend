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
    <div id="dashboard-prueba-escritura" hidden>
      <h3>Prueba de escritura (criterio de cierre de Fase 0)</h3>
      <input type="text" id="prueba-nota" placeholder="Nota de prueba" />
      <button id="btn-prueba-escritura">Probar escritura</button>
      <p id="prueba-resultado"></p>
    </div>
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
    configurarPruebaEscritura(datos.equipos);
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

/**
 * Prueba de escritura minima para cerrar el criterio de aceptacion
 * de Fase 0: "el frontend puede leer y escribir en Equipos con
 * incremento de version". Toma el primer equipo ya cargado y manda
 * siempre la version con la que se cargo la pantalla (no la
 * actualiza tras un exito) - asi el primer clic escribe bien y
 * cualquier clic siguiente sin refrescar dispara a proposito el
 * conflicto de version (Diseno Tecnico, Seccion 5.1).
 */
function configurarPruebaEscritura(equipos) {
  const cont = document.getElementById("dashboard-prueba-escritura");
  const resultadoEl = document.getElementById("prueba-resultado");
  const boton = document.getElementById("btn-prueba-escritura");

  if (!equipos.length) {
    resultadoEl.textContent = "No hay equipos cargados para probar la escritura.";
    cont.hidden = false;
    return;
  }

  const equipoPrueba = equipos[0];
  cont.hidden = false;

  boton.addEventListener("click", async () => {
    const nota = document.getElementById("prueba-nota").value;
    resultadoEl.textContent = "Escribiendo...";
    try {
      const resultado = await Api.llamar("probarEscrituraEquipo", {
        idEquipo: equipoPrueba.id_equipo,
        version: equipoPrueba.version,
        nota,
      });
      resultadoEl.textContent = `Escritura OK, nueva version: ${resultado.versionNueva}`;
    } catch (err) {
      resultadoEl.textContent = `Error: ${err.message}`;
    }
  });
}

Router.registrar("dashboard", renderDashboard);
