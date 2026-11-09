// GESTION_CELULARES - Auth.gs (Seccion 3.13 y 5.3)
// Login propio email + PIN. El token se valida en cada llamada contra
// Sesiones_Activas; el rol sale siempre de la hoja Usuarios, nunca del cliente.

var DURACION_SESION_HORAS = 12;
var MAX_INTENTOS = 5;

var Auth = {
  login: function (email, pin) {
    email = Util.texto(email).toLowerCase(); pin = Util.texto(pin);
    if (!email || !pin) throw Util.error('Ingrese email y PIN');
    var cache = CacheService.getScriptCache();
    var clave = 'intentos_' + email;
    var intentos = Number(cache.get(clave) || 0);
    if (intentos >= MAX_INTENTOS) throw Util.error('Demasiados intentos fallidos. Espere 10 minutos y vuelva a intentar.');
    var u = Datos.buscar('Usuarios', 'email', email);
    var ok = u && u.activo === 'Sí' && String(u.pin_hash) === Util.hashPin(email, pin);
    if (!ok) { cache.put(clave, String(intentos + 1), 600); throw Util.error('Email o PIN incorrecto'); }
    cache.remove(clave);
    var ahora = Util.ahora();
    Datos.filtrar('Sesiones_Activas', function (s) { return s.fecha_expiracion < ahora; }).forEach(function (s) {
      Datos.actualizar('Sesiones_Activas', s, { token: '', email: '', fecha_expiracion: '' });
    });
    var token = Util.uuid() + Util.uuid().replace(/-/g, '');
    var vence = Util.fechaDeDate(new Date(Date.now() + DURACION_SESION_HORAS * 3600 * 1000));
    Datos.agregar('Sesiones_Activas', { token: token, email: email, fecha_expiracion: vence });
    return { token: token, email: email, nombre: u.nombre, roles: Auth.listaRoles(u.roles) };
  },
  listaRoles: function (texto) {
    return String(texto || '').split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s !== ''; });
  },
  // Devuelve {email, nombre, roles} o lanza error si el token no vale
  sesion: function (token) {
    if (!token) throw Util.error('Sesion no valida. Vuelva a ingresar.');
    var s = Datos.buscar('Sesiones_Activas', 'token', token);
    if (!s || s.fecha_expiracion < Util.ahora()) throw Util.error('Sesion vencida. Vuelva a ingresar.');
    var u = Datos.buscar('Usuarios', 'email', s.email);
    if (!u || u.activo !== 'Sí') throw Util.error('Usuario inactivo');
    return { email: u.email, nombre: u.nombre, roles: Auth.listaRoles(u.roles) };
  },
  cerrarSesion: function (token) {
    var s = Datos.buscar('Sesiones_Activas', 'token', token);
    if (s) Datos.actualizar('Sesiones_Activas', s, { token: '', email: '', fecha_expiracion: '' });
  },
  tieneRol: function (usuario, roles) {
    for (var i = 0; i < roles.length; i++) if (usuario.roles.indexOf(roles[i]) >= 0) return true;
    return false;
  }
};
