// GESTION_CELULARES - js/core/api.js
// Unico punto de contacto con Apps Script. Cada operacion de
// negocio es UNA sola llamada (Diseno Tecnico, Seccion 5.2) - nunca
// se encadenan varias escrituras sueltas desde el frontend.
// Toda llamada de escritura manda el idToken; Apps Script lo
// verifica siempre del lado servidor (Seccion 5.3 y 6.1).

const Api = (() => {
  async function llamar(operacion, payload = {}) {
    const cuerpo = {
      operacion,
      idToken: Auth.getIdToken ? Auth.getIdToken() : null,
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

  return { llamar, obtenerEquiposYModelos };
})();
