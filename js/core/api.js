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

  // Prueba de conectividad de Fase 0: trae Equipos y Modelos.
  async function obtenerEquiposYModelos() {
    return llamar("obtenerEquiposYModelos");
  }

  // Prueba de escritura de Fase 0.
  async function probarEscrituraEquipo(idEquipo, version, nota) {
    return llamar("probarEscrituraEquipo", { idEquipo, version, nota });
  }

  // Ficha de Equipo (Fase 1): equipo, historial y transiciones
  // disponibles para el rol actual.
  async function obtenerFichaEquipo(idEquipo) {
    return llamar("obtenerFichaEquipo", { idEquipo });
  }

  // Ejecuta una transicion de estado. version es la que el frontend
  // tenia cargada - si no coincide con la real, el backend rechaza
  // (control de concurrencia, Diseno Tecnico Seccion 5.1).
  async function transicionarEquipo(idEquipo, version, estadoNuevo, comentario) {
    return llamar("transicionarEquipo", { idEquipo, version, estadoNuevo, comentario });
  }

  return {
    llamar,
    obtenerEquiposYModelos,
    probarEscrituraEquipo,
    obtenerFichaEquipo,
    transicionarEquipo,
  };
})();
