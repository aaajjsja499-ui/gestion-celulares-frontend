// GESTION_CELULARES - js/pantallas/ficha-equipo.js
// Ficha de Equipo (Especificacion de Interfaz Seccion 4.3, alcance
// de Fase 1): encabezado, panel de acciones de transicion, datos de
// compra, historial de estados. Diagnosticos, Reparaciones y Ventas
// son de Fase 2 y Fase 3 (Hoja de Ruta) - se muestran como secciones
// deshabilitadas, no vacias sin explicacion.

async function renderFichaEquipo(contenedor, idEquipo) {
  if (!idEquipo) {
    contenedor.innerHTML = "<p>Falta el ID de equipo en la URL.</p>";
    return;
  }

  contenedor.innerHTML = `<p>Cargando ficha de ${idEquipo}...</p>`;

  try {
    const [ficha, diagnosticosPrevios] = await Promise.all([
      Api.obtenerFichaEquipo(idEquipo),
      Api.obtenerDiagnosticosEquipo(idEquipo),
    ]);
    pintarFicha(contenedor, ficha, diagnosticosPrevios);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar la ficha: ${err.message}</p>`;
  }
}

function pintarFicha(contenedor, ficha, diagnosticosPrevios) {
  const e = ficha.equipo;

  contenedor.innerHTML = `
    <p><a href="#dashboard">&larr; Volver</a></p>

    <div class="ficha-encabezado">
      <h2>${e.id_equipo} - ${e.marca} ${e.modelo}</h2>
      <p>IMEI: ${e.imei || "sin registrar"}</p>
      <p class="ficha-estado-actual">Estado: <strong>${e.estado}</strong></p>
    </div>

    <div class="ficha-panel-acciones" id="ficha-panel-acciones"></div>

    <details class="ficha-seccion" open>
      <summary>Datos de compra</summary>
      <p>Fecha detección: ${formatearFecha(e.fecha_deteccion)}</p>
      <p>Fecha compra: ${formatearFecha(e.fecha_compra)}</p>
      <p>Precio compra: ${formatearGuaranies(e.precio_compra)}</p>
      <p>Notas: ${e.notas || "-"}</p>
    </details>

    <details class="ficha-seccion" ${diagnosticosPrevios.length ? "" : "open"}>
      <summary>Diagnósticos (${diagnosticosPrevios.length})</summary>
      <p><a href="#diagnosticos/${e.id_equipo}">Nuevo diagnóstico &rarr;</a></p>
      ${pintarDiagnosticosPrevios(diagnosticosPrevios)}
    </details>

    <details class="ficha-seccion">
      <summary>Reparaciones (disponible en Fase 2)</summary>
      <p class="ficha-seccion-deshabilitada">Esta seccion se habilita cuando se implemente Fase 2 (Diagnóstico y Reparaciones) de la Hoja de Ruta.</p>
    </details>

    <details class="ficha-seccion" open>
      <summary>Historial de Estados</summary>
      ${pintarHistorial(ficha.historial)}
    </details>

    <details class="ficha-seccion">
      <summary>Ventas (disponible en Fase 3)</summary>
      <p class="ficha-seccion-deshabilitada">Esta seccion se habilita cuando se implemente Fase 3 (Ventas y Garantías) de la Hoja de Ruta.</p>
    </details>
  `;

  pintarPanelAcciones(ficha);
}

function pintarPanelAcciones(ficha) {
  const cont = document.getElementById("ficha-panel-acciones");
  const disponibles = ficha.transicionesDisponibles;

  if (!disponibles.length) {
    cont.innerHTML = "<p>No hay transiciones disponibles para tu rol actual desde este estado.</p>";
    return;
  }

  cont.innerHTML = disponibles
    .map((estadoNuevo) => `<button class="boton-transicion" data-estado="${estadoNuevo}">${estadoNuevo}</button>`)
    .join(" ");

  cont.querySelectorAll(".boton-transicion").forEach((boton) => {
    boton.addEventListener("click", () => abrirModalTransicion(ficha, boton.dataset.estado));
  });
}

function abrirModalTransicion(ficha, estadoNuevo) {
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>Cambiar a "${estadoNuevo}"</h3>
      <p>Equipo: ${ficha.equipo.id_equipo} (estado actual: ${ficha.equipo.estado})</p>
      <label for="modal-comentario">Comentario (obligatorio)</label>
      <textarea id="modal-comentario" rows="3"></textarea>
      <p id="modal-error" class="modal-error" hidden></p>
      <div class="modal-botones">
        <button id="modal-cancelar">Cancelar</button>
        <button id="modal-confirmar">Confirmar</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  document.getElementById("modal-cancelar").addEventListener("click", () => fondo.remove());

  document.getElementById("modal-confirmar").addEventListener("click", async () => {
    const comentario = document.getElementById("modal-comentario").value.trim();
    const errorEl = document.getElementById("modal-error");

    if (!comentario) {
      errorEl.textContent = "El comentario es obligatorio.";
      errorEl.hidden = false;
      return;
    }

    try {
      await Api.transicionarEquipo(ficha.equipo.id_equipo, ficha.equipo.version, estadoNuevo, comentario);
      fondo.remove();
      Router.navegar("ficha-equipo", ficha.equipo.id_equipo);
      renderFichaEquipo(document.getElementById("app-contenido"), ficha.equipo.id_equipo);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}

function pintarHistorial(historial) {
  if (!historial.length) return "<p>Sin cambios de estado todavia.</p>";

  const filas = historial
    .map(
      (h) =>
        `<tr><td>${formatearFecha(h.fecha_hora)}</td><td>${h.estado_anterior}</td><td>${h.estado_nuevo}</td><td>${h.responsable}</td><td>${h.comentario}</td></tr>`
    )
    .join("");

  return `
    <table class="tabla-simple">
      <thead><tr><th>Fecha</th><th>De</th><th>A</th><th>Responsable</th><th>Comentario</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

function formatearFecha(valor) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString("es-PY");
}

function formatearGuaranies(valor) {
  if (!valor && valor !== 0) return "-";
  return "Gs. " + Number(valor).toLocaleString("es-PY");
}

Router.registrar("ficha-equipo", renderFichaEquipo);
