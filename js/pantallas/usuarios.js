// GESTION_CELULARES - js/pantallas/usuarios.js
// Fase 8, segunda pieza (Gestion de Usuarios - Especificacion de
// Interfaz Seccion 4.14, Diseno Tecnico Seccion 4.13). Pantalla
// completa dedicada, visible solo para el rol Administrador - no un
// panel dentro de otra pantalla (decision de Pedro). La pantalla
// nunca edita la hoja Usuarios directamente: todo pasa por los tres
// endpoints de Administrador (altaUsuario, reiniciarPinUsuario,
// desactivarUsuario) mas la lectura obtenerUsuarios, los cuatro ya
// validados por rol en el servidor (Usuarios.gs) - si alguien sin
// Administrador entra a esta pantalla por URL directa, la llamada de
// lectura falla con el mismo error que el servidor le daria a
// cualquier otro endpoint restringido, y esta pantalla lo muestra
// igual que clientes.js u otras pantallas muestran cualquier error de
// backend, sin logica de permisos propia duplicada en el frontend.

const ROLES_USUARIO_PANTALLA = ["Comprador", "Técnico", "Vendedor", "Soporte de garantía", "Administrador"];

let usuariosEstadoLista = { todos: [], filtroEstado: "Todos" };

async function renderUsuarios(contenedor) {
  contenedor.innerHTML = `<p>Cargando usuarios...</p>`;

  try {
    const usuarios = await Api.obtenerUsuarios();
    usuariosEstadoLista.todos = usuarios;
    usuariosEstadoLista.filtroEstado = "Todos";
    pintarListadoUsuarios(contenedor);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar usuarios: ${err.message}</p>`;
  }
}

function pintarListadoUsuarios(contenedor) {
  contenedor.innerHTML = `
    <p><a href="#dashboard">&larr; Volver</a></p>
    <h2>Gestión de Usuarios</h2>

    <div class="equipos-filtros">
      <label>
        Estado
        <select id="usuarios-filtro-estado">
          <option value="Todos">Todos</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </label>
      <button id="usuarios-nuevo">+ Nuevo usuario</button>
    </div>

    <div id="usuarios-tabla-contenedor"></div>
  `;

  document.getElementById("usuarios-filtro-estado").value = usuariosEstadoLista.filtroEstado;
  document.getElementById("usuarios-filtro-estado").addEventListener("change", (evento) => {
    usuariosEstadoLista.filtroEstado = evento.target.value;
    pintarTablaUsuarios();
  });
  document.getElementById("usuarios-nuevo").addEventListener("click", () => {
    abrirModalUsuario(null);
  });

  pintarTablaUsuarios();
}

function pintarTablaUsuarios() {
  const cont = document.getElementById("usuarios-tabla-contenedor");
  if (!cont) return;

  const { usuario: usuarioSesion } = Estado.get();
  const filtro = usuariosEstadoLista.filtroEstado;
  const filas = usuariosEstadoLista.todos.filter((u) => {
    return filtro === "Todos" || u.activo === filtro;
  });

  if (filas.length === 0) {
    cont.innerHTML = `<p>No hay usuarios para mostrar con este filtro.</p>`;
    return;
  }

  cont.innerHTML = `
    <table class="tabla-simple">
      <thead>
        <tr>
          <th>Email</th>
          <th>Nombre</th>
          <th>Roles</th>
          <th>Estado</th>
          <th>Fecha de alta</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${filas.map((u) => filaUsuarioHtml(u, usuarioSesion)).join("")}
      </tbody>
    </table>
  `;

  filas.forEach((u) => {
    const botonEditarRoles = document.getElementById(`usuario-editar-${cssId(u.email)}`);
    if (botonEditarRoles) botonEditarRoles.addEventListener("click", () => abrirModalUsuario(u));

    const botonPin = document.getElementById(`usuario-pin-${cssId(u.email)}`);
    if (botonPin) botonPin.addEventListener("click", () => abrirModalReiniciarPin(u));

    const botonDesactivar = document.getElementById(`usuario-desactivar-${cssId(u.email)}`);
    if (botonDesactivar) botonDesactivar.addEventListener("click", () => abrirModalDesactivar(u));
  });
}

// Los ids de elementos no pueden tener "@" ni "." de forma segura en
// selectores - se arma un id simple reemplazando esos caracteres.
function cssId(email) {
  return String(email).replace(/[^a-zA-Z0-9]/g, "_");
}

function filaUsuarioHtml(u, usuarioSesion) {
  const esUsuarioActual = usuarioSesion && u.email.trim().toLowerCase() === String(usuarioSesion.email).trim().toLowerCase();
  const fecha = formatearFechaUsuario(u.fecha_alta);
  const clase = u.activo === "Inactivo" ? "fila-estado-cerrado" : "";

  return `
    <tr class="${clase}">
      <td>${u.email}</td>
      <td>${u.nombre}</td>
      <td>${u.roles.join(", ")}</td>
      <td>${u.activo}</td>
      <td>${fecha}</td>
      <td>
        <button id="usuario-editar-${cssId(u.email)}">Editar</button>
        <button id="usuario-pin-${cssId(u.email)}">Reiniciar PIN</button>
        ${
          u.activo === "Activo" && !esUsuarioActual
            ? `<button id="usuario-desactivar-${cssId(u.email)}">Desactivar</button>`
            : ""
        }
      </td>
    </tr>
  `;
}

function formatearFechaUsuario(valor) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleDateString("es-PY");
}

// --- Modal: Nuevo usuario / Editar roles y nombre ---
//
// Un solo modal para alta y edicion (mismo espiritu que el modal de
// clientes.js). "Editar" reusa altaUsuario: si el email ya existe y
// esta Activo, el backend actualiza roles/nombre? No - Diseno Tecnico
// 4.13 no define una edicion de usuario activo, solo alta (nuevo o
// reactivacion) y reinicio de PIN. Por eso el boton "Editar" de la
// tabla solo tiene sentido hoy para completar el alta de un usuario
// que ya esta en la hoja pero Inactivo (reactivarlo) - si el usuario
// ya esta Activo, este modal pide igual un PIN nuevo porque
// altaUsuario siempre recalcula pin_hash, no hay forma de "editar
// roles sin tocar el PIN" con los tres endpoints tal como estan
// definidos en el Diseno Tecnico. Sin resolver en silencio: senalado
// en el Contexto de Sesion como posible hueco a confirmar con Pedro
// si en el uso real hace falta editar roles de un usuario Activo sin
// tener que escribir un PIN nuevo cada vez.
function abrirModalUsuario(usuarioExistente) {
  const esEdicionDeInactivo = usuarioExistente && usuarioExistente.activo === "Inactivo";
  const esEdicionDeActivo = usuarioExistente && usuarioExistente.activo === "Activo";

  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>${usuarioExistente ? "Editar usuario" : "Nuevo usuario"}</h3>
      ${
        esEdicionDeInactivo
          ? `<p>Este email existe pero está <strong>Inactivo</strong>. Guardar lo reactiva en vez de crear un usuario duplicado.</p>`
          : ""
      }
      ${
        esEdicionDeActivo
          ? `<p>Vas a definir un PIN nuevo para esta persona (se recalcula siempre al guardar).</p>`
          : ""
      }

      <label for="usuario-email">Email</label>
      <input type="text" id="usuario-email" value="${usuarioExistente ? usuarioExistente.email : ""}" ${usuarioExistente ? "readonly" : ""} />

      <label for="usuario-nombre">Nombre</label>
      <input type="text" id="usuario-nombre" value="${usuarioExistente ? usuarioExistente.nombre : ""}" />

      <label>Roles</label>
      <div id="usuario-roles-checkboxes">
        ${ROLES_USUARIO_PANTALLA.map((rol) => {
          const marcado = usuarioExistente && usuarioExistente.roles.indexOf(rol) >= 0;
          return `
            <label style="display:flex; align-items:center; gap:0.4em; font-weight:400; margin-top:0.4em;">
              <input type="checkbox" class="usuario-rol-checkbox" value="${rol}" ${marcado ? "checked" : ""} />
              ${rol}
            </label>
          `;
        }).join("")}
      </div>

      <label for="usuario-pin">PIN ${usuarioExistente ? "nuevo" : "inicial"} (4 a 6 dígitos)</label>
      <input type="password" id="usuario-pin" inputmode="numeric" pattern="[0-9]{4,6}" minlength="4" maxlength="6" />
      <p style="font-size:0.8rem; color:#555; margin-top:0.3em;">
        Comunicá el PIN a la persona por fuera del sistema. No se vuelve a mostrar después de guardar.
      </p>

      <p class="modal-error" id="usuario-modal-error" hidden></p>

      <div class="modal-botones">
        <button type="button" id="usuario-modal-cancelar">Cancelar</button>
        <button type="button" id="usuario-modal-guardar">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  document.getElementById("usuario-modal-cancelar").addEventListener("click", () => fondo.remove());

  const botonGuardar = document.getElementById("usuario-modal-guardar");
  const errorEl = document.getElementById("usuario-modal-error");

  botonGuardar.addEventListener("click", async () => {
    errorEl.hidden = true;

    const email = document.getElementById("usuario-email").value.trim();
    const nombre = document.getElementById("usuario-nombre").value.trim();
    const pin = document.getElementById("usuario-pin").value.trim();
    const roles = [...document.querySelectorAll(".usuario-rol-checkbox:checked")].map((c) => c.value);

    if (!email || !nombre) {
      errorEl.textContent = "Email y nombre son obligatorios.";
      errorEl.hidden = false;
      return;
    }
    if (roles.length === 0) {
      errorEl.textContent = "Elegí al menos un rol.";
      errorEl.hidden = false;
      return;
    }
    if (!/^[0-9]{4,6}$/.test(pin)) {
      errorEl.textContent = "El PIN debe tener entre 4 y 6 dígitos numéricos.";
      errorEl.hidden = false;
      return;
    }

    if (botonGuardar.disabled) return;
    botonGuardar.disabled = true;
    const textoOriginal = botonGuardar.textContent;
    botonGuardar.textContent = "Guardando...";

    try {
      const resultado = await Api.altaUsuario(email, nombre, roles, pin);
      fondo.remove();
      mostrarMensajeUsuarios(resultado.reactivado ? "Usuario reactivado." : "Usuario guardado.");
      await renderUsuarios(document.getElementById("app-contenido"));
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      botonGuardar.disabled = false;
      botonGuardar.textContent = textoOriginal;
    }
  });
}

// --- Modal: Reiniciar PIN ---

function abrirModalReiniciarPin(u) {
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>Reiniciar PIN</h3>
      <p>${u.nombre} (${u.email})</p>

      <label for="usuario-pin-nuevo">PIN nuevo (4 a 6 dígitos)</label>
      <input type="password" id="usuario-pin-nuevo" inputmode="numeric" pattern="[0-9]{4,6}" minlength="4" maxlength="6" />

      <p class="modal-error" id="usuario-pin-modal-error" hidden></p>

      <div class="modal-botones">
        <button type="button" id="usuario-pin-modal-cancelar">Cancelar</button>
        <button type="button" id="usuario-pin-modal-guardar">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  document.getElementById("usuario-pin-modal-cancelar").addEventListener("click", () => fondo.remove());

  const botonGuardar = document.getElementById("usuario-pin-modal-guardar");
  const errorEl = document.getElementById("usuario-pin-modal-error");

  botonGuardar.addEventListener("click", async () => {
    errorEl.hidden = true;
    const pinNuevo = document.getElementById("usuario-pin-nuevo").value.trim();

    if (!/^[0-9]{4,6}$/.test(pinNuevo)) {
      errorEl.textContent = "El PIN debe tener entre 4 y 6 dígitos numéricos.";
      errorEl.hidden = false;
      return;
    }

    if (botonGuardar.disabled) return;
    botonGuardar.disabled = true;
    const textoOriginal = botonGuardar.textContent;
    botonGuardar.textContent = "Guardando...";

    try {
      await Api.reiniciarPinUsuario(u.email, pinNuevo);
      fondo.remove();
      mostrarMensajeUsuarios("PIN reiniciado.");
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      botonGuardar.disabled = false;
      botonGuardar.textContent = textoOriginal;
    }
  });
}

// --- Modal: Desactivar ---
//
// Sin campo de comentario obligatorio (a diferencia del modal de
// confirmacion estandar de la Seccion 3.3): Pedro confirmo sacarlo de
// esta pantalla en vez de agregarlo a Decisiones, ver la nota al
// inicio de Usuarios.gs (backend) para el detalle completo del
// hallazgo y la decision.
function abrirModalDesactivar(u) {
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>Desactivar usuario</h3>
      <p>¿Desactivar a ${u.nombre} (${u.email})? No se elimina su historial ni sus registros anteriores - solo deja de poder iniciar sesión.</p>

      <p class="modal-error" id="usuario-desactivar-modal-error" hidden></p>

      <div class="modal-botones">
        <button type="button" id="usuario-desactivar-modal-cancelar">Cancelar</button>
        <button type="button" id="usuario-desactivar-modal-confirmar">Desactivar</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  document.getElementById("usuario-desactivar-modal-cancelar").addEventListener("click", () => fondo.remove());

  const botonConfirmar = document.getElementById("usuario-desactivar-modal-confirmar");
  const errorEl = document.getElementById("usuario-desactivar-modal-error");

  botonConfirmar.addEventListener("click", async () => {
    if (botonConfirmar.disabled) return;
    botonConfirmar.disabled = true;
    const textoOriginal = botonConfirmar.textContent;
    botonConfirmar.textContent = "Desactivando...";

    try {
      await Api.desactivarUsuario(u.email);
      fondo.remove();
      mostrarMensajeUsuarios("Usuario desactivado.");
      await renderUsuarios(document.getElementById("app-contenido"));
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      botonConfirmar.disabled = false;
      botonConfirmar.textContent = textoOriginal;
    }
  });
}

// Mensaje simple de confirmacion. La Especificacion de Interfaz
// Seccion 3.3 documenta "Toasts de notificacion" como elemento comun
// de toda la app, pero ninguna pantalla existente (clientes.js,
// vendedores.js, modelos) implementa un sistema de toasts real
// todavia - todas muestran resultado recargando la lista o con
// mensajes en linea. Se sigue el mismo patron ya en produccion en vez
// de introducir el primer toast real de la app en esta pieza aislada.
function mostrarMensajeUsuarios(texto) {
  const cont = document.getElementById("usuarios-tabla-contenedor");
  if (!cont) return;
  const aviso = document.createElement("p");
  aviso.textContent = texto;
  cont.parentElement.insertBefore(aviso, cont);
  setTimeout(() => aviso.remove(), 4000);
}

Router.registrar("usuarios", renderUsuarios);
