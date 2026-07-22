// GESTION_CELULARES - js/pantallas/reparaciones.js
// Gestion de Reparaciones (Especificacion de Interfaz Seccion 4.5,
// Fase 2 - segunda pieza). Cola de equipos en "En reparacion" o
// "Esperando repuestos", con acciones Tomar / Completar / Pausar
// por repuesto. Sigue el mismo patron de dashboard.js y
// ficha-equipo.js: una funcion renderX(contenedor), modal para
// datos que requieren confirmacion, y el mismo tratamiento de
// conflicto de version ("El equipo/reparacion cambio desde que se
// cargo esta pantalla. Refresca e intenta de nuevo.") que ya usa
// ficha-equipo.js.

async function renderReparaciones(contenedor) {
  contenedor.innerHTML = `<p>Cargando cola de reparaciones...</p>`;

  try {
    const datos = await Api.obtenerColaReparaciones();
    pintarCola(contenedor, datos);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>No se pudo cargar la cola: ${err.message}</p>`;
  }
}

function pintarCola(contenedor, datos) {
  const cola = datos.equiposEnCola || [];

  contenedor.innerHTML = `
    <h2>Gestión de Reparaciones</h2>
    <p><a href="#dashboard">&larr; Volver al dashboard</a></p>

    <div id="reparaciones-lista"></div>
  `;

  const lista = document.getElementById("reparaciones-lista");

  if (!cola.length) {
    lista.innerHTML = "<p>Sin equipos en reparación ni esperando repuestos por ahora.</p>";
    return;
  }

  lista.innerHTML = `
    <table class="tabla-simple">
      <thead>
        <tr><th>Equipo</th><th>Estado</th><th>Técnico</th><th>Días</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        ${cola
          .map(
            (item) => `
          <tr data-id-equipo="${item.idEquipo}">
            <td><a href="#ficha-equipo/${item.idEquipo}">${item.idEquipo}</a><br>${item.marca} ${item.modelo}</td>
            <td>${item.estado}</td>
            <td>${item.tecnico || "-"}</td>
            <td>${item.diasEnEstado ?? "-"}</td>
            <td>
              ${
                item.idReparacion
                  ? `<button class="boton-completar" data-id-reparacion="${item.idReparacion}">Completar</button>
                     <button class="boton-pausar" data-id-reparacion="${item.idReparacion}">Pausar por repuesto</button>`
                  : `<button class="boton-tomar" data-id-equipo="${item.idEquipo}">Tomar reparación</button>`
              }
            </td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;

  lista.querySelectorAll(".boton-tomar").forEach((boton) => {
    boton.addEventListener("click", () => tomarReparacion(boton.dataset.idEquipo));
  });

  lista.querySelectorAll(".boton-completar").forEach((boton) => {
    const item = cola.find((c) => c.idReparacion === boton.dataset.idReparacion);
    boton.addEventListener("click", () =>
      abrirModalCompletar(item, datos.repuestosDisponibles || [], datos.tarifaManoObra)
    );
  });

  lista.querySelectorAll(".boton-pausar").forEach((boton) => {
    const item = cola.find((c) => c.idReparacion === boton.dataset.idReparacion);
    boton.addEventListener("click", () => abrirModalPausar(item));
  });
}

async function tomarReparacion(idEquipo) {
  try {
    await Api.iniciarReparacion(idEquipo);
    renderReparaciones(document.getElementById("app-contenido"));
  } catch (err) {
    alert(err.message);
  }
}

function abrirModalCompletar(item, repuestosDisponibles, tarifaManoObra) {
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>Completar reparación - ${item.idEquipo}</h3>

      <label for="completar-tiempo">Tiempo invertido (minutos)</label>
      <input type="number" id="completar-tiempo" min="0" />
      <p>Costo de mano de obra estimado: <span id="completar-costo-preview">Gs. 0</span></p>

      <label>Repuestos utilizados</label>
      <div id="completar-repuestos"></div>
      <button type="button" id="completar-agregar-repuesto">+ Agregar repuesto</button>

      <label for="completar-resultado">Resultado</label>
      <select id="completar-resultado">
        <option value="Exitoso">Exitoso</option>
        <option value="Reparado parcialmente">Reparado parcialmente</option>
        <option value="No reparado">No reparado</option>
      </select>

      <label for="completar-comentario">Comentario</label>
      <textarea id="completar-comentario" rows="3"></textarea>

      <p id="completar-error" class="modal-error" hidden></p>
      <div class="modal-botones">
        <button id="completar-cancelar">Cancelar</button>
        <button id="completar-confirmar">Confirmar</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  const filasRepuestos = document.getElementById("completar-repuestos");
  const tiempoInput = document.getElementById("completar-tiempo");
  const costoPreview = document.getElementById("completar-costo-preview");

  function actualizarCostoPreview() {
    const minutos = Number(tiempoInput.value) || 0;
    const tarifa = Number(tarifaManoObra) || 0;
    costoPreview.textContent = "Gs. " + Math.round(minutos * tarifa).toLocaleString("es-PY");
  }

  tiempoInput.addEventListener("input", actualizarCostoPreview);

  function agregarFilaRepuesto() {
    const fila = document.createElement("div");
    fila.className = "completar-fila-repuesto";
    fila.innerHTML = `
      <select class="repuesto-select">
        <option value="">Selecciona un repuesto</option>
        ${repuestosDisponibles
          .map((r) => `<option value="${r.idRepuesto}">${r.nombre} (stock: ${r.stockActual})</option>`)
          .join("")}
      </select>
      <input type="number" class="repuesto-cantidad" min="1" value="1" style="width:4em" />
      <button type="button" class="repuesto-quitar">Quitar</button>
    `;
    fila.querySelector(".repuesto-quitar").addEventListener("click", () => fila.remove());
    filasRepuestos.appendChild(fila);
  }

  document.getElementById("completar-agregar-repuesto").addEventListener("click", agregarFilaRepuesto);

  document.getElementById("completar-cancelar").addEventListener("click", () => fondo.remove());

  document.getElementById("completar-confirmar").addEventListener("click", async () => {
    const errorEl = document.getElementById("completar-error");
    const tiempoInvertidoMin = Number(tiempoInput.value);
    const resultado = document.getElementById("completar-resultado").value;
    const comentario = document.getElementById("completar-comentario").value.trim();

    if (!tiempoInvertidoMin || tiempoInvertidoMin <= 0) {
      errorEl.textContent = "Ingresa el tiempo invertido en minutos.";
      errorEl.hidden = false;
      return;
    }
    if (!comentario) {
      errorEl.textContent = "El comentario es obligatorio.";
      errorEl.hidden = false;
      return;
    }

    const repuestosUsados = Array.from(filasRepuestos.querySelectorAll(".completar-fila-repuesto"))
      .map((fila) => ({
        idRepuesto: fila.querySelector(".repuesto-select").value,
        cantidad: Number(fila.querySelector(".repuesto-cantidad").value),
      }))
      .filter((r) => r.idRepuesto && r.cantidad > 0);

    try {
      await Api.completarReparacion(
        item.idReparacion,
        item.versionReparacion,
        tiempoInvertidoMin,
        repuestosUsados,
        resultado,
        comentario
      );
      fondo.remove();
      renderReparaciones(document.getElementById("app-contenido"));
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });

  actualizarCostoPreview();
}

function abrirModalPausar(item) {
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>Pausar por repuesto - ${item.idEquipo}</h3>
      <label for="pausar-comentario">Comentario (obligatorio)</label>
      <textarea id="pausar-comentario" rows="3"></textarea>
      <p id="pausar-error" class="modal-error" hidden></p>
      <div class="modal-botones">
        <button id="pausar-cancelar">Cancelar</button>
        <button id="pausar-confirmar">Confirmar</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  document.getElementById("pausar-cancelar").addEventListener("click", () => fondo.remove());

  document.getElementById("pausar-confirmar").addEventListener("click", async () => {
    const comentario = document.getElementById("pausar-comentario").value.trim();
    const errorEl = document.getElementById("pausar-error");

    if (!comentario) {
      errorEl.textContent = "El comentario es obligatorio.";
      errorEl.hidden = false;
      return;
    }

    try {
      await Api.pausarPorRepuesto(item.idReparacion, item.versionEquipo, comentario);
      fondo.remove();
      renderReparaciones(document.getElementById("app-contenido"));
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}

Router.registrar("reparaciones", renderReparaciones);
