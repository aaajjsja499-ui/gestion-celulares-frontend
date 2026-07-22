// GESTION_CELULARES - js/pantallas/clientes.js
// Fase 3: Directorio de Clientes (Especificacion de Interfaz Seccion
// 4.10). Una sola ruta ("#clientes") con dos modos: listado (sin
// parametro) y ficha (con id_cliente como parametro), igual de
// espiritu a como equipos.js linkea a ficha-equipo.js pero en un
// solo archivo, porque el listado y la ficha de cliente son chicos.

let clientesEstadoLista = { todos: [], filtro: "" };

async function renderClientes(contenedor, idCliente) {
  if (idCliente) {
    return renderFichaCliente(contenedor, idCliente);
  }
  return renderListadoClientes(contenedor);
}

// --- Listado ---

async function renderListadoClientes(contenedor) {
  contenedor.innerHTML = `<p>Cargando clientes...</p>`;

  try {
    const clientes = await Api.obtenerClientes();
    clientesEstadoLista.todos = clientes;
    clientesEstadoLista.filtro = "";
    pintarListadoClientes(contenedor);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar clientes: ${err.message}</p>`;
  }
}

function pintarListadoClientes(contenedor) {
  contenedor.innerHTML = `
    <p><a href="#dashboard">&larr; Volver</a></p>
    <h2>Directorio de Clientes</h2>

    <div class="equipos-filtros">
      <input type="text" id="clientes-busqueda" placeholder="Buscar por nombre o contacto..." />
      <button id="clientes-nuevo">+ Nuevo cliente</button>
    </div>

    <div id="clientes-tabla-contenedor"></div>
  `;

  document.getElementById("clientes-busqueda").addEventListener("input", (ev) => {
    clientesEstadoLista.filtro = ev.target.value.trim().toLowerCase();
    pintarTablaClientes();
  });

  document.getElementById("clientes-nuevo").addEventListener("click", () => {
    abrirModalCliente(null, () => renderListadoClientes(contenedor));
  });

  pintarTablaClientes();
}

function pintarTablaClientes() {
  const { todos, filtro } = clientesEstadoLista;

  const filtrados = !filtro
    ? todos
    : todos.filter(
        (c) =>
          (c.nombre || "").toLowerCase().includes(filtro) ||
          (c.contacto || "").toLowerCase().includes(filtro)
      );

  const filas = filtrados
    .map(
      (c) => `
      <tr>
        <td>${c.id_cliente}</td>
        <td>${c.nombre}</td>
        <td>${c.contacto || "-"}</td>
        <td><a href="#clientes/${c.id_cliente}">Ver ficha</a></td>
      </tr>`
    )
    .join("");

  document.getElementById("clientes-tabla-contenedor").innerHTML = `
    <p>${filtrados.length} cliente(s)</p>
    <table class="tabla-simple">
      <thead><tr><th>ID</th><th>Nombre</th><th>Contacto</th><th></th></tr></thead>
      <tbody>${filas || '<tr><td colspan="4">Sin clientes que coincidan.</td></tr>'}</tbody>
    </table>
  `;
}

// --- Ficha de cliente ---

async function renderFichaCliente(contenedor, idCliente) {
  contenedor.innerHTML = `<p>Cargando ficha de ${idCliente}...</p>`;

  try {
    const ficha = await Api.obtenerFichaCliente(idCliente);
    pintarFichaCliente(contenedor, ficha);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar el cliente: ${err.message}</p>`;
  }
}

function pintarFichaCliente(contenedor, ficha) {
  const c = ficha.cliente;

  contenedor.innerHTML = `
    <p><a href="#clientes">&larr; Volver al listado</a></p>

    <div class="ficha-encabezado">
      <h2>${c.nombre}</h2>
      <p>ID: ${c.id_cliente}</p>
      <p>Contacto: ${c.contacto || "sin registrar"}</p>
      <p>Notas: ${c.notas || "-"}</p>
      <button id="cliente-editar">Editar</button>
    </div>

    <details class="ficha-seccion" ${ficha.garantiasActivas.length ? "open" : ""}>
      <summary>Garantías activas (${ficha.garantiasActivas.length})</summary>
      ${pintarComprasCliente(ficha.garantiasActivas)}
    </details>

    <details class="ficha-seccion" open>
      <summary>Historial de compras (${ficha.historialCompras.length})</summary>
      ${pintarComprasCliente(ficha.historialCompras)}
    </details>
  `;

  document.getElementById("cliente-editar").addEventListener("click", () => {
    abrirModalCliente(c, () => renderFichaCliente(contenedor, c.id_cliente));
  });
}

function pintarComprasCliente(compras) {
  if (!compras.length) return '<p class="ficha-seccion-deshabilitada">Sin registros.</p>';

  const filas = compras
    .map(
      (h) => `
      <tr>
        <td><a href="#ficha-equipo/${h.idEquipo}">${h.idEquipo}</a></td>
        <td>${h.marca || "-"} ${h.modelo || ""}</td>
        <td>${formatearFechaCliente(h.fechaVenta)}</td>
        <td>${formatearGuaraniesCliente(h.precioVenta)}</td>
        <td>${h.estadoEquipo || "-"}</td>
      </tr>`
    )
    .join("");

  return `
    <table class="tabla-simple">
      <thead><tr><th>Equipo</th><th>Modelo</th><th>Fecha venta</th><th>Precio</th><th>Estado</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

// --- Modal de creacion / edicion ---

function abrirModalCliente(clienteExistente, alGuardar) {
  const esEdicion = !!clienteExistente;
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>${esEdicion ? "Editar cliente" : "Nuevo cliente"}</h3>
      <label for="cliente-nombre">Nombre</label>
      <input type="text" id="cliente-nombre" value="${esEdicion ? clienteExistente.nombre : ""}" />
      <label for="cliente-contacto">Contacto</label>
      <input type="text" id="cliente-contacto" value="${esEdicion ? clienteExistente.contacto || "" : ""}" />
      <label for="cliente-notas">Notas</label>
      <textarea id="cliente-notas" rows="3">${esEdicion ? clienteExistente.notas || "" : ""}</textarea>
      <p id="cliente-error" class="modal-error" hidden></p>
      <div class="modal-botones">
        <button id="cliente-cancelar">Cancelar</button>
        <button id="cliente-guardar">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  document.getElementById("cliente-cancelar").addEventListener("click", () => fondo.remove());

  const botonGuardar = document.getElementById("cliente-guardar");
  botonGuardar.addEventListener("click", async () => {
    const errorEl = document.getElementById("cliente-error");
    const nombre = document.getElementById("cliente-nombre").value.trim();
    const contacto = document.getElementById("cliente-contacto").value.trim();
    const notas = document.getElementById("cliente-notas").value.trim();

    if (!nombre) {
      errorEl.textContent = "El nombre es obligatorio.";
      errorEl.hidden = false;
      return;
    }

    // Evita doble-envio: si el click anterior todavia esta en curso
    // (red lenta, mobile), este click no dispara una segunda
    // llamada. Sin esto, un segundo click mientras la primera
    // peticion sigue pendiente crea el cliente duplicado.
    if (botonGuardar.disabled) return;
    botonGuardar.disabled = true;
    const textoOriginal = botonGuardar.textContent;
    botonGuardar.textContent = "Guardando...";

    try {
      if (esEdicion) {
        await Api.actualizarCliente(clienteExistente.id_cliente, nombre, contacto, notas);
      } else {
        await Api.crearCliente(nombre, contacto, notas);
      }
      fondo.remove();
      alGuardar();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      botonGuardar.disabled = false;
      botonGuardar.textContent = textoOriginal;
    }
  });
}

function formatearFechaCliente(valor) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleDateString("es-PY");
}

function formatearGuaraniesCliente(valor) {
  if (!valor && valor !== 0) return "-";
  return "Gs. " + Number(valor).toLocaleString("es-PY");
}

Router.registrar("clientes", renderClientes);
