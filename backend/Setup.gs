// GESTION_CELULARES - Setup.gs : preparacion inicial del Sheet (se ejecuta una vez desde el editor)

function prepararSistema() {
  var libro = Datos.abrirLibro(), creadas = [], nombres = Object.keys(HOJAS);
  nombres.forEach(function (n) {
    var cols = HOJAS[n], sh = libro.getSheetByName(n);
    if (!sh) { sh = libro.insertSheet(n); creadas.push(n); }
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
      sh.setFrozenRows(1);
      cols.forEach(function (c, i) { if (TEXTO_RE.test(c)) sh.getRange(2, i + 1, Math.max(sh.getMaxRows() - 1, 1), 1).setNumberFormat('@'); });
    }
  });
  var vacia = libro.getSheetByName('Hoja 1') || libro.getSheetByName('Sheet1');
  if (vacia && libro.getSheets().length > 1 && vacia.getLastRow() <= 1) libro.deleteSheet(vacia);
  Datos.reiniciar();
  var conf = Datos.leer('Configuracion').map(function (f) { return f.clave; });
  Object.keys(CONFIG_DEFAULTS).forEach(function (k) { if (conf.indexOf(k) < 0) Datos.agregar('Configuracion', { clave: k, valor: CONFIG_DEFAULTS[k] }); });
  if (!Datos.buscar('Tarifas_Trabajo', 'id_trabajo', TRABAJO_OTRO)) {
    Datos.agregar('Tarifas_Trabajo', { id_tarifa: 'TAR-000', id_trabajo: TRABAJO_OTRO, nombre_trabajo: 'Otro trabajo', monto: 0, exige_detalle: 'Sí', exige_repuesto: 'No', activo: 'Sí', vigente_desde: Util.hoy(), motivo: 'Tarifa especial del sistema', responsable: 'sistema', version: 1 });
  }
  return { hojas_creadas: creadas, total_hojas: nombres.length };
}

function crearPrimerAdministrador(email, nombre, pin) {
  Datos.reiniciar();
  email = String(email).toLowerCase().trim();
  if (Datos.leer('Usuarios').length) throw new Error('Ya existen usuarios. Use la pantalla de Usuarios.');
  if (!/^\d{4,8}$/.test(String(pin))) throw new Error('El PIN debe tener 4 a 8 digitos');
  Datos.agregar('Usuarios', { email: email, nombre: nombre, roles: ROL_ADMIN, activo: 'Sí', fecha_alta: Util.hoy(), pin_hash: Util.hashPin(email, String(pin)) });
  return 'Administrador creado: ' + email;
}

// Edite estos tres valores y ejecute esta funcion una sola vez
function crearAdministradorInicial() {
  return crearPrimerAdministrador('CORREO_AQUI@gmail.com', 'Pedro Martin Villalba', '0000');
}
