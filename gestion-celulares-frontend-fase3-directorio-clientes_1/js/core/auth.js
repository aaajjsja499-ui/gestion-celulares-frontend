// GESTION_CELULARES - js/core/auth.js
// Login propio por email + PIN (Propuesta de Autenticacion Real
// v2.0, DOC-011). Reemplaza Google Identity Services: Apps Script
// valida el PIN contra el hash guardado en Usuarios y devuelve un
// token de sesion propio. Ese token se manda en cada escritura;
// Apps Script lo vuelve a verificar del lado servidor contra
// Sesiones_Activas - este archivo NUNCA decide por si solo quien
// tiene que rol, solo obtiene el token y pide a Apps Script los
// datos reales de Usuarios.

const Auth = (() => {
  let token = null;

  function iniciar() {
    const form = document.getElementById("form-login");
    if (!form) {
      console.error("No se encontro #form-login en index.html.");
      return;
    }
    form.addEventListener("submit", manejarEnvioLogin);
  }

  async function manejarEnvioLogin(evento) {
    evento.preventDefault();
    ocultarError();

    const email = document.getElementById("login-email").value.trim();
    const pin = document.getElementById("login-pin").value.trim();

    try {
      const perfil = await Api.llamar("login", { email, pin });
      token = perfil.token;
      Estado.set({
        usuario: { email: perfil.email, nombre: perfil.nombre, roles: perfil.roles },
        rolActivo: perfil.roles.length === 1 ? perfil.roles[0] : null,
      });
      document.dispatchEvent(new CustomEvent("gestion-celulares:login-ok"));
    } catch (err) {
      console.error("Error de login:", err);
      mostrarError(err.message || "No se pudo iniciar sesion.");
    }
  }

  function mostrarError(mensaje) {
    const cont = document.getElementById("login-error");
    if (cont) {
      cont.textContent = mensaje;
      cont.hidden = false;
    }
  }

  function ocultarError() {
    const cont = document.getElementById("login-error");
    if (cont) cont.hidden = true;
  }

  function getToken() {
    return token;
  }

  function cerrarSesion() {
    token = null;
    Estado.set({ usuario: null, rolActivo: null });
  }

  return { iniciar, getToken, cerrarSesion };
})();
