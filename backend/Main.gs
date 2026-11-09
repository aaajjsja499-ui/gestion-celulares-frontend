// GESTION_CELULARES - Main.gs : punto de entrada web (doPost / doGet)
// Cuerpo: {accion, token, operacion, params}. Respuesta: {ok:true, datos} o {ok:false, error, codigo}.

function salida(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

function doGet() { return salida({ ok: true, servicio: 'Sistema de Gestion de Celulares', hora: Util.ahora() }); }

function doPost(e) {
  try {
    var cuerpo = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    return salida({ ok: true, datos: despachar(cuerpo) });
  } catch (err) {
    return salida({ ok: false, error: String(err && err.message || err), codigo: (err && err.codigo) || 'error' });
  }
}

function despachar(c) {
  Datos.reiniciar();
  var accion = c.accion || 'operacion';
  if (accion === 'login') return Auth.login(c.email, c.pin);
  var u = Auth.sesion(c.token);
  if (accion === 'logout') { Auth.cerrarSesion(c.token); return { ok: true }; }
  if (accion === 'sesion') return u;
  var params = c.params || {};
  if (c.operacion === 'resolverOperacionInterrumpida') {
    if (!Auth.tieneRol(u, [ROL_ADMIN])) throw Util.error('Su rol no permite esta operacion');
    params.__usuario_email = u.email;
    return resolverOperacionInterrumpida(params, u);
  }
  if (c.operacion === 'ejecutarCasosAceptacion') {
    if (!Auth.tieneRol(u, [ROL_ADMIN])) throw Util.error('Su rol no permite esta operacion');
    return ejecutarCasosAceptacion();
  }
  return ejecutarOperacion(c.operacion, params, u);
}
