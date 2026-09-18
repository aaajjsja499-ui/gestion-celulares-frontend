// GESTION_CELULARES - js/pantallas/vendedores.js
// Fase 7: Directorio de Vendedores/fuentes de compra (Especificacion
// de Interfaz Seccion 4.12; Diseno Tecnico Seccion 3.14, H-04 de la
// Propuesta de Brechas). Misma estructura que clientes.js (listado +
// ficha en una sola ruta, con id_vendedor como parametro) porque el
// listado y la ficha de vendedor son igual de chicos.
//
// No confundir con Clientes (js/pantallas/clientes.js): Clientes son
// compradores (a quienes Luma les vende), Vendedores son las fuentes
// de las que Luma compra equipos (Diseno Tecnico 3.14).

let vendedoresEstadoLista = { todos: [], filtro: "" };

async function renderVendedores(contenedor, idVendedor) {
  if (idVendedor) {
    return renderFichaVendedor(contenedor, idVendedor);
  }
  return renderListadoVendedores(contenedor);
}

// --- Listado ---

async function renderListadoVendedores(contenedor) {
  contenedor.innerHTML = `<p>Cargando vendedores...</p>`;

  try {
    const vendedores = await Api.obtenerVendedores();
    vendedoresEstadoLista.todos = vendedores;
    vendedoresEstadoLista.filtro = "";
    pintarListadoVendedores(contenedor);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar vendedores: ${err.message}</p>`;
  }
}

function pintarListadoVendedores(contenedor) {
  contenedor.innerHTML = `
    <p><a href="#dashboard">&larr; Volver</a></p>
    <h2>Directorio de Vendedores</h2>
    <p class="ficha-seccion-deshabilitada">Fuentes de compra: personas o canales de los que Luma compra equipos (no confundir con Clientes, que son compradores).</p>

    <div class="equipos-filtros">
      <input type="text" id="vendedores-busqueda" placeholder="Buscar por nombre o contacto..." />
      <button id="vendedores-nuevo">+ Nuevo vendedor</button>
    </div>

    <div id="vendedores-tabla-contenedor"></div>
  `;

  document.getElementById("vendedores-busqueda").addEventListener("input", (ev) => {
    vendedoresEstadoLista.filtro = ev.target.value.trim().toLowerCase();
    pintarTablaVendedores();
  });

  document.getElementById("vendedores-nuevo").addEventListener("click", () => {
    abrirModalVendedor(null, () => renderListadoVendedores(contenedor));
  });

  pintarTablaVendedores();
}

function pintarTablaVendedores() {
  const { todos, filtro } = vendedoresEstadoLista;

  const filtrados = !filtro
    ? todos
    : todos.filter(
        (v) =>
          (v.nombre || "").toLowerCase().includes(filtro) ||
          (v.contacto || "").toLowerCase().includes(filtro)
      );

  const filas = filtrados
    .map(
      (v) => `
      <tr>
        <td>${v.id_vendedor}</td>
        <td>${v.nombre}</td>
        <td>${v.contacto || "-"}</td>
        <td>${v.canal_habitual || "-"}</td>
        <td><a href="#vendedores/${v.id_vendedor}">Ver ficha</a></td>
      </tr>`
    )
    .join("");

  document.getElementById("vendedores-tabla-contenedor").innerHTML = `
    <p>${filtrados.length} vendedor(es)</p>
    <table class="tabla-simple">
      <thead><tr><th>ID</th><th>Nombre</th><th>Contacto</th><th>Canal habitual</th><th></th></tr></thead>
      <tbody>${filas || '<tr><td colspan="5">Sin vendedores que coincidan.</td></tr>'}</tbody>
    </table>
  `;
}

// --- Ficha de vendedor ---

async function renderFichaVendedor(contenedor, idVendedor) {
  contenedor.innerHTML = `<p>Cargando ficha de ${idVendedor}...</p>`;

  try {
    const ficha = await Api.obtenerFichaVendedor(idVendedor);
    pintarFichaVendedor(contenedor, ficha);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar el vendedor: ${err.message}</p>`;
  }
}

function pintarFichaVendedor(contenedor, ficha) {
  const v = ficha.vendedor;

  contenedor.innerHTML = `
    <p><a href="#vendedores">&larr; Volver al listado</a></p>

    <div class="ficha-encabezado">
      <h2>${v.nombre}</h2>
      <p>ID: ${v.id_vendedor}</p>
      <p>Contacto: ${v.contacto || "sin registrar"}</p>
      <p>Canal habitual: ${v.canal_habitual || "-"}</p>
      <p>Notas: ${v.notas || "-"}</p>
      <button id="vendedor-editar">Editar</button>
    </div>

    <details class="ficha-seccion" open>
      <summary>Equipos comprados (${ficha.equiposComprados.length})</summary>
      ${pintarEquiposComprados(ficha.equiposComprados)}
    </details>
  `;

  document.getElementById("vendedor-editar").addEventListener("click", () => {
    abrirModalVendedor(v, () => renderFichaVendedor(contenedor, v.id_vendedor));
  });
}

function pintarEquiposComprados(equipos) {
  if (!equipos.length) return '<p class="ficha-seccion-deshabilitada">Sin equipos registrados todavía.</p>';

  const filas = equipos
    .map(
      (e) => `
      <tr>
        <td><a href="#ficha-equipo/${e.id_equipo}">${e.id_equipo}</a></td>
        <td>${e.marca || "-"} ${e.modelo || ""}</td>
        <td>${e.estado || "-"}</td>
        <td>${formatearFechaVendedor(e.fecha_deteccion)}</td>
        <td>${formatearGuaraniesVendedor(e.precio_compra)}</td>
      </tr>`
    )
    .join("");

  return `
    <table class="tabla-simple">
      <thead><tr><th>Equipo</th><th>Modelo</th><th>Estado</th><th>Fecha detección</th><th>Precio compra</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

// --- Modal de creacion / edicion ---

function abrirModalVendedor(vendedorExistente, alGuardar) {
  const esEdicion = !!vendedorExistente;
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>${esEdicion ? "Editar vendedor" : "Nuevo vendedor"}</h3>
      <label for="vendedor-nombre">Nombre</label>
      <input type="text" id="vendedor-nombre" value="${esEdicion ? vendedorExistente.nombre : ""}" />
      <label for="vendedor-contacto">Contacto</label>
      <input type="text" id="vendedor-contacto" value="${esEdicion ? vendedorExistente.contacto || "" : ""}" />
      <label for="vendedor-canal">Canal habitual</label>
      <input type="text" id="vendedor-canal" value="${esEdicion ? vendedorExistente.canal_habitual || "" : ""}" />
      <label for="vendedor-notas">Notas</label>
      <textarea id="vendedor-notas" rows="3">${esEdicion ? vendedorExistente.notas || "" : ""}</textarea>
      <p id="vendedor-error" class="modal-error" hidden></p>
      <div class="modal-botones">
        <button id="vendedor-cancelar">Cancelar</button>
        <button id="vendedor-guardar">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  document.getElementById("vendedor-cancelar").addEventListener("click", () => fondo.remove());

  const botonGuardar = document.getElementById("vendedor-guardar");
  botonGuardar.addEventListener("click", async () => {
    const errorEl = document.getElementById("vendedor-error");
    const nombre = document.getElementById("vendedor-nombre").value.trim();
    const contacto = document.getElementById("vendedor-contacto").value.trim();
    const canal_habitual = document.getElementById("vendedor-canal").value.trim();
    const notas = document.getElementById("vendedor-notas").value.trim();

    if (!nombre) {
      errorEl.textContent = "El nombre es obligatorio.";
      errorEl.hidden = false;
      return;
    }

    // Evita doble-envio (mismo patron que clientes.js).
    if (botonGuardar.disabled) return;
    botonGuardar.disabled = true;
    const textoOriginal = botonGuardar.textContent;
    botonGuardar.textContent = "Guardando...";

    try {
      if (esEdicion) {
        await Api.actualizarVendedor(vendedorExistente.id_vendedor, { nombre, contacto, canal_habitual, notas });
      } else {
        await Api.crearVendedor({ nombre, contacto, canal_habitual, notas });
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

function formatearFechaVendedor(valor) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleDateString("es-PY");
}

function formatearGuaraniesVendedor(valor) {
  if (!valor && valor !== 0) return "-";
  return "Gs. " + Number(valor).toLocaleString("es-PY");
}

Router.registrar("vendedores", renderVendedores);
