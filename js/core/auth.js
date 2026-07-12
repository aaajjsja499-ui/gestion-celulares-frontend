// GESTION_CELULARES - js/core/auth.js
// Login real con Google Identity Services (Propuesta de
// Autenticacion Real, DOC-011). El id_token que Google entrega aca
// se manda en cada escritura; Apps Script lo vuelve a verificar del
// lado servidor - este archivo NUNCA decide por si solo quien tiene
// que rol, solo obtiene el token y pide a Apps Script los datos
// reales de Usuarios.

const Auth = (() => {
  let idToken = null;

  function iniciar() {
    if (!window.google || !window.google.accounts) {
      console.error("Google Identity Services no cargo. Revisar el script en index.html.");
      return;
    }
    google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: manejarRespuestaGoogle,
    });
    google.accounts.id.renderButton(
      document.getElementById("boton-login-google"),
      { theme: "outline", size: "large", text: "signin_with" }
    );
  }

  async function manejarRespuestaGoogle(respuesta) {
    idToken = respuesta.credential;
    try {
      const perfil = await Api.llamar("verificarSesion", { idToken });
      if (!perfil || !perfil.activo) {
        mostrarErrorAcceso();
        return;
      }
      Estado.set({
        usuario: { email: perfil.email, nombre: perfil.nombre, roles: perfil.roles },
        rolActivo: perfil.roles.length === 1 ? perfil.roles[0] : null,
      });
      document.dispatchEvent(new CustomEvent("gestion-celulares:login-ok"));
    } catch (err) {
      console.error("Error verificando sesion contra Usuarios:", err);
      mostrarErrorAcceso();
    }
  }

  function mostrarErrorAcceso() {
    const cont = document.getElementById("login-error");
    if (cont) {
      cont.textContent =
        "Esta cuenta no esta dada de alta o fue desactivada. Contacta al Administrador.";
      cont.hidden = false;
    }
  }

  function getIdToken() {
    return idToken;
  }

  function cerrarSesion() {
    idToken = null;
    Estado.set({ usuario: null, rolActivo: null });
    if (window.google && window.google.accounts) {
      google.accounts.id.disableAutoSelect();
    }
  }

  return { iniciar, getIdToken, cerrarSesion };
})();
