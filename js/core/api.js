// GESTION_CELULARES - api.js : unico punto de contacto con Apps Script
// Cuerpo: {accion, token, operacion, params}. Respuesta: {ok, datos} | {ok:false, error, codigo}.
const Api = (() => {
  let token = null;
  async function llamar(cuerpo) {
    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL === 'PENDIENTE') throw new Error('Falta configurar la URL del servidor (config.js).');
    let r;
    try {
      r = await fetch(CONFIG.APPS_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(cuerpo) });
    } catch (e) { const er = new Error('Sin conexión con el servidor. Revise internet y reintente.'); er.codigo = 'red'; throw er; }
    if (!r.ok) { const er = new Error('El servidor respondió ' + r.status); er.codigo = 'red'; throw er; }
    const j = await r.json();
    if (!j.ok) { const er = new Error(j.error || 'Error'); er.codigo = j.codigo || 'error'; throw er; }
    return j.datos;
  }
  return {
    setToken(t) { token = t; },
    getToken() { return token; },
    login: (email, pin) => llamar({ accion: 'login', email, pin }),
    sesion: () => llamar({ accion: 'sesion', token }),
    logout: () => llamar({ accion: 'logout', token }).catch(() => null),
    // lectura: sin id_operacion
    leer: (operacion, params) => llamar({ accion: 'operacion', token, operacion, params: params || {} }),
    // escritura: lleva SIEMPRE id_operacion (reintentar con el mismo id no duplica)
    escribir: (operacion, params, idOp) => llamar({ accion: 'operacion', token, operacion, params: Object.assign({}, params, { id_operacion: idOp || U.idOp() }) }),
  };
})();
