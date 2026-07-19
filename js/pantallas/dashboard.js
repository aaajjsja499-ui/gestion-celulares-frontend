// GESTION_CELULARES - js/core/api.js
// Unico punto de contacto con Apps Script. Cada operacion de
// negocio es UNA sola llamada (Diseno Tecnico, Seccion 5.2) - nunca
// se encadenan varias escrituras sueltas desde el frontend.
// Toda llamada (salvo "login") manda el token de sesion propio;
// Apps Script lo verifica siempre del lado servidor contra
// Sesiones_Activas (Seccion 5.3 y 6.1).

const Api = (() => {
  async function llamar(operacion, payload = {}) {
    const cuerpo = {
      operacion,
      token: Auth.getToken ? Auth.getToken() : null,
      datos: payload,
    };

    const respuesta = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      // Apps Script Web Apps no siempre negocian bien
      // application/json en el preflight; text/plain evita CORS
      // preflight y el propio script parsea el JSON del body.
      body: JSON.stringify(cuerpo),
    });

    if (!respuesta.ok) {
      throw new Error(`Apps Script respondio ${respuesta.status}`);
    }

    const resultado = await respuesta.json();

    if (resultado.error) {
      throw new Error(resultado.error);
    }

    return resultado.datos;
  }

  async function obtenerEquiposYModelos() {
    return llamar("obtenerEquiposYModelos");
  }

  async function probarEscrituraEquipo(idEquipo, version, nota) {
    return llamar("probarEscrituraEquipo", { idEquipo, version, nota });
  }

  async function obtenerFichaEquipo(idEquipo) {
    return llamar("obtenerFichaEquipo", { idEquipo });
  }

  async function transicionarEquipo(idEquipo, version, estadoNuevo, comentario) {
    return llamar("transicionarEquipo", { idEquipo, version, estadoNuevo, comentario });
  }

  // Dashboard real (Fase 1): equipos, historial y config de SLA.
  async function obtenerDatosDashboard() {
    return llamar("obtenerDatosDashboard");
  }

  // Alta de equipo nuevo en estado Detectado.
  async function crearEquipoDetectado(marca, modelo, notas) {
    return llamar("crearEquipoDetectado", { marca, modelo, notas });
  }

  return {
    llamar,
    obtenerEquiposYModelos,
    probarEscrituraEquipo,
    obtenerFichaEquipo,
    transicionarEquipo,
    obtenerDatosDashboard,
    crearEquipoDetectado,
  };
})();
