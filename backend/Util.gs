// GESTION_CELULARES - Util.gs
// Funciones auxiliares sin acceso a hojas. Zona horaria America/Asuncion
// (Diseno Tecnico, Seccion 5.9). Las fechas se guardan como texto
// AAAA-MM-DDTHH:mm:ss en hora de Asuncion, sin conversion implicita.

var ZONA = 'America/Asuncion';
var RELOJ_FIJO = null; // solo para pruebas: texto AAAA-MM-DDTHH:mm:ss

var Util = {
  ahora: function () {
    if (RELOJ_FIJO) return RELOJ_FIJO;
    return Utilities.formatDate(new Date(), ZONA, "yyyy-MM-dd'T'HH:mm:ss");
  },
  hoy: function () { return Util.ahora().substring(0, 10); },
  mes: function (fecha) { return String(fecha || Util.ahora()).substring(0, 7); },
  fechaDeDate: function (d) { return Utilities.formatDate(d, ZONA, "yyyy-MM-dd'T'HH:mm:ss"); },
  // Segundos desde una fecha de texto hasta ahora (ambas en hora de Asuncion)
  segundosEntre: function (desde, hasta) {
    var a = Util.aEpoch(desde), b = Util.aEpoch(hasta || Util.ahora());
    return Math.floor((b - a) / 1000);
  },
  aEpoch: function (f) {
    var s = String(f); var p = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2}))?/);
    if (!p) return NaN;
    return Date.UTC(+p[1], +p[2] - 1, +p[3], +(p[4] || 0), +(p[5] || 0), +(p[6] || 0));
  },
  diasEntre: function (desde, hasta) {
    return Math.floor((Util.aEpoch(String(hasta).substring(0, 10)) - Util.aEpoch(String(desde).substring(0, 10))) / 86400000);
  },
  sumarDias: function (fecha, n) {
    var t = Util.aEpoch(String(fecha).substring(0, 10)) + n * 86400000; return Util.isoFecha(new Date(t));
  },
  isoFecha: function (d) { return d.toISOString().substring(0, 10); },
  // Fecha de la cuota k (k desde 0) segun la frecuencia (Seccion 3.19)
  fechaCuota: function (primera, frecuencia, k) {
    if (frecuencia === 'Semanal') return Util.sumarDias(primera, 7 * k);
    if (frecuencia === 'Quincenal') return Util.sumarDias(primera, 15 * k);
    var p = String(primera).substring(0, 10).split('-'); var y = +p[0], m = +p[1] - 1 + k, dia = +p[2];
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    var ultimo = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return Util.isoFecha(new Date(Date.UTC(y, m, Math.min(dia, ultimo))));
  },
  esEntero: function (n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; },
  entero: function (v) { if (v === '' || v === null || v === undefined) return NaN; var n = Number(v); return (isFinite(n) && Math.floor(n) === n) ? n : NaN; },
  num: function (v) { var n = Number(v); return isFinite(n) ? n : 0; },
  texto: function (v) { return (v === null || v === undefined) ? '' : String(v).trim(); },
  uuid: function () { return Utilities.getUuid(); },
  // Hash del PIN: SHA-256 de email + ':' + pin, en hexadecimal (Seccion 3.13)
  hashPin: function (email, pin) {
    var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(email).toLowerCase() + ':' + pin, Utilities.Charset.UTF_8);
    return bytes.map(function (b) { var v = (b < 0 ? b + 256 : b).toString(16); return v.length === 1 ? '0' + v : v; }).join('');
  },
  normalizarDocumento: function (d) { return String(d || '').toUpperCase().replace(/[.\s\-]/g, ''); },
  normalizarTelefono: function (t) { return String(t || '').replace(/[^\d+]/g, ''); },
  normalizarNombre: function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, ''); },
  rellenar: function (n, ancho) { var s = String(n); while (s.length < ancho) s = '0' + s; return s; },
  pct: function (importe, bps) { return Math.floor((importe * bps) / 10000); },
  suma: function (arr, f) { var s = 0; for (var i = 0; i < arr.length; i++) s += f(arr[i]); return s; },
  copiar: function (o) { return JSON.parse(JSON.stringify(o)); },
  error: function (mensaje, extra) { var e = new Error(mensaje); if (extra) e.extra = extra; return e; }
};
