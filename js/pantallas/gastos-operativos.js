// GESTION_CELULARES - js/pantallas/gastos-operativos.js
// Fase 8, cuarta pieza (Gestion de Gastos Operativos - Especificacion
// de Interfaz Seccion 4.15, Diseno Tecnico Seccion 4.15). Pantalla
// completa dedicada, visible solo para el rol Administrador (decision
// de Pedro, D-015: "Solo rol administrativo"), mismo patron que
// Vendedores y Repuestos - no un panel dentro de Reportes. Si alguien
// sin Administrador entra por URL directa, la llamada de escritura
// falla con el mismo error que el servidor le daria a cualquier otro
// endpoint restringido (mismo criterio que usuarios.js).
//
// Hueco encontrado al responder una pregunta operativa de Pedro sobre
// donde registrar los gastos operativos: no existia ninguna pantalla,
// solo edicion manual de la hoja Gastos_Operativos.
//
// Lectura: no se agrega un endpoint de lectura nuevo - se reutiliza
// Api.obtenerDatosDashboardAmpliado().gastosOperativos, exactamente
// como ya hace reportes.js (misma fuente de datos, sin duplicar una
// segunda forma de leer la hoja completa). El Diseno Tecnico Seccion
// 4.15 no especifica de donde viene la lectura para esta pantalla
// (solo documenta los dos endpoints de escritura) - decision tomada
// al construir el codigo, senalada aqui con transparencia en vez de
// resuelta en silencio.
//
// Escritura: crearGastoOperativo (alta, responsable completado por
// el servidor con el usuario logueado - nunca se tipea) y
// anularGastoOperativo (anulacion con motivo obligatorio, nunca edita
// ni borra el registro original - Gastos_Operativos.gs).

const CATEGORIAS_GASTO = ["Alquiler", "Servicios", "Impuestos", "Otro"];

let gastosEstado = { todos: [] };

async function renderGastosOperativos(contenedor) {
  contenedor.innerHTML = `<p>Cargando gastos operativos...</p>`;

  try {
    const datosAmpliado = await Api.obtenerDatosDashboardAmpliado();
    gastosEstado.todos = datosAmpliado.gastosOperativos || [];
    pintarGastosOperativos(contenedor);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar gastos operativos: ${err.message}</p>`;
  }
}

function pintarGastosOperativos(contenedor) {
  contenedor.innerHTML = `
    <p><a href="#dashboard">&larr; Volver</a></p>
    <h2>Gastos Operativos</h2>

    <div class="equipos-filtros">
      <label>Fecha desde <input type="date" id="gasto-filtro-desde" /></label>
      <label>hasta <input type="date" id="gasto-filtro-hasta" /></label>
      <select id="gasto-filtro-categoria">
        <option value="">Todas las categorías</option>
        ${CATEGORIAS_GASTO.map((c) => `<option value="${c}">${c}</option>`).join("")}
      </select>
      <button id="gasto-nuevo">+ Nuevo gasto</button>
    </div>

    <div id="gastos-tabla-contenedor"></div>
  `;

  ["gasto-filtro-desde", "gasto-filtro-hasta", "gasto-filtro-categoria"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => pintarTablaGastos());
  });
  document.getElementById("gasto-nuevo").addEventListener("click", () => abrirModalNuevoGasto());

  pintarTablaGastos();
}

function pintarTablaGastos() {
  const cont = document.getElementById("gastos-tabla-contenedor");
  if (!cont) return;

  const desde = document.getElementById("gasto-filtro-desde").value;
  const hasta = document.getElementById("gasto-filtro-hasta").value;
  const categoria = document.getElementById("gasto-filtro-categoria").value;

  const filas = gastosEstado.todos
    .filter((g) => {
      if (categoria && g.categoria !== categoria) return false;
      if (desde || hasta) {
        const fecha = g.fecha ? new Date(g.fecha) : null;
        if (!fecha || isNaN(fecha.getTime())) return false;
        if (desde && fecha < new Date(desde)) return false;
        if (hasta && fecha > new Date(hasta + "T23:59:59")) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (filas.length === 0) {
    cont.innerHTML = `<p>No hay gastos para mostrar con este filtro.</p>`;
    return;
  }

  cont.innerHTML = `
    <table class="tabla-simple">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Categoría</th>
          <th>Monto</th>
          <th>Descripción</th>
          <th>Responsable</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${filas.map((g) => filaGastoHtml(g)).join("")}
      </tbody>
    </table>
  `;

  filas.forEach((g) => {
    const boton = document.getElementById(`gasto-anular-${g.id_gasto}`);
    if (boton) boton.addEventListener("click", () => abrirModalAnularGasto(g));
  });
}

function filaGastoHtml(g) {
  const anulado = g.anulado === "Sí";
  const clase = anulado ? "fila-estado-cerrado" : "";
  const fecha = formatearFechaGasto(g.fecha);
  const monto = formatearMontoGasto(g.monto);

  return `
    <tr class="${clase}">
      <td>${fecha}</td>
      <td>${g.categoria}</td>
      <td>${monto}</td>
      <td>${g.descripcion || "-"}</td>
      <td>${g.responsable || "-"}</td>
      <td>${anulado ? `Anulado${g.motivo_anulacion ? ` (${g.motivo_anulacion})` : ""}` : "Activo"}</td>
      <td>${anulado ? "" : `<button id="gasto-anular-${g.id_gasto}">Anular</button>`}</td>
    </tr>
  `;
}

function formatearFechaGasto(valor) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleDateString("es-PY");
}

function formatearMontoGasto(valor) {
  const numero = Number(valor);
  if (isNaN(numero)) return String(valor ?? "-");
  return "Gs. " + numero.toLocaleString("es-PY");
}

// --- Modal: Nuevo gasto ---
// responsable no se tipea - lo completa el servidor con el email de
// la sesion validada (decision de Pedro, mismo criterio que
// Historial_Estados.responsable).

function abrirModalNuevoGasto() {
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>Nuevo gasto operativo</h3>

      <label for="gasto-fecha">Fecha</label>
      <input type="date" id="gasto-fecha" value="${new Date().toISOString().slice(0, 10)}" />

      <label for="gasto-categoria">Categoría</label>
      <select id="gasto-categoria">
        ${CATEGORIAS_GASTO.map((c) => `<option value="${c}">${c}</option>`).join("")}
      </select>

      <label for="gasto-monto">Monto (Gs.)</label>
      <input type="number" id="gasto-monto" min="1" step="1" />

      <label for="gasto-descripcion">Descripción</label>
      <textarea id="gasto-descripcion" rows="2"></textarea>

      <p class="modal-error" id="gasto-modal-error" hidden></p>

      <div class="modal-botones">
        <button type="button" id="gasto-modal-cancelar">Cancelar</button>
        <button type="button" id="gasto-modal-guardar">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  document.getElementById("gasto-modal-cancelar").addEventListener("click", () => fondo.remove());

  const botonGuardar = document.getElementById("gasto-modal-guardar");
  const errorEl = document.getElementById("gasto-modal-error");

  botonGuardar.addEventListener("click", async () => {
    errorEl.hidden = true;

    const fecha = document.getElementById("gasto-fecha").value;
    const categoria = document.getElementById("gasto-categoria").value;
    const monto = Number(document.getElementById("gasto-monto").value);
    const descripcion = document.getElementById("gasto-descripcion").value.trim();

    if (!fecha) {
      errorEl.textContent = "La fecha es obligatoria.";
      errorEl.hidden = false;
      return;
    }
    if (!monto || monto <= 0) {
      errorEl.textContent = "El monto debe ser mayor a cero.";
      errorEl.hidden = false;
      return;
    }

    if (botonGuardar.disabled) return;
    botonGuardar.disabled = true;
    const textoOriginal = botonGuardar.textContent;
    botonGuardar.textContent = "Guardando...";

    try {
      await Api.crearGastoOperativo(fecha, categoria, monto, descripcion);
      fondo.remove();
      mostrarMensajeGastos("Gasto registrado.");
      await renderGastosOperativos(document.getElementById("app-contenido"));
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      botonGuardar.disabled = false;
      botonGuardar.textContent = textoOriginal;
    }
  });
}

// --- Modal: Anular gasto ---
// Motivo obligatorio (decision explicita de Pedro, D-015). Nunca edita
// ni borra los datos originales del gasto - solo cambia su estado y
// guarda el motivo (huella completa).

function abrirModalAnularGasto(g) {
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>Anular gasto</h3>
      <p>${g.categoria} - ${formatearMontoGasto(g.monto)} (${formatearFechaGasto(g.fecha)})</p>
      <p>Esta acción no borra el gasto: queda visible en el listado y en los reportes, marcado como anulado.</p>

      <label for="gasto-motivo-anulacion">Motivo de la anulación</label>
      <textarea id="gasto-motivo-anulacion" rows="2"></textarea>

      <p class="modal-error" id="gasto-anular-modal-error" hidden></p>

      <div class="modal-botones">
        <button type="button" id="gasto-anular-modal-cancelar">Cancelar</button>
        <button type="button" id="gasto-anular-modal-confirmar">Anular</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  document.getElementById("gasto-anular-modal-cancelar").addEventListener("click", () => fondo.remove());

  const botonConfirmar = document.getElementById("gasto-anular-modal-confirmar");
  const errorEl = document.getElementById("gasto-anular-modal-error");

  botonConfirmar.addEventListener("click", async () => {
    errorEl.hidden = true;
    const motivo = document.getElementById("gasto-motivo-anulacion").value.trim();

    if (!motivo) {
      errorEl.textContent = "El motivo es obligatorio.";
      errorEl.hidden = false;
      return;
    }

    if (botonConfirmar.disabled) return;
    botonConfirmar.disabled = true;
    const textoOriginal = botonConfirmar.textContent;
    botonConfirmar.textContent = "Anulando...";

    try {
      await Api.anularGastoOperativo(g.id_gasto, motivo);
      fondo.remove();
      mostrarMensajeGastos("Gasto anulado.");
      await renderGastosOperativos(document.getElementById("app-contenido"));
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      botonConfirmar.disabled = false;
      botonConfirmar.textContent = textoOriginal;
    }
  });
}

// Mismo patron ya en produccion que usuarios.js: sin sistema de
// toasts real todavia en la app, mensaje en linea con auto-dismiss.
function mostrarMensajeGastos(texto) {
  const cont = document.getElementById("gastos-tabla-contenedor");
  if (!cont) return;
  const aviso = document.createElement("p");
  aviso.textContent = texto;
  cont.parentElement.insertBefore(aviso, cont);
  setTimeout(() => aviso.remove(), 4000);
}

Router.registrar("gastos-operativos", renderGastosOperativos);
