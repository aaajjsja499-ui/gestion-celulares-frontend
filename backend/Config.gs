// GESTION_CELULARES - Config.gs (Seccion 3.11 y 4.14)
// Configuracion en formato clave-valor. Toda modificacion exige comentario y
// deja una fila en Decisiones (lo hace Operaciones de Administracion).

var Config = {
  todo: function () {
    var salida = {}, k;
    for (k in CONFIG_DEFAULTS) salida[k] = CONFIG_DEFAULTS[k];
    Datos.leer('Configuracion').forEach(function (f) {
      if (f.clave === '') return;
      salida[f.clave] = (CONFIG_TEXTO.indexOf(f.clave) >= 0) ? String(f.valor) : (f.valor === '' ? CONFIG_DEFAULTS[f.clave] : Number(f.valor));
    });
    return salida;
  },
  valor: function (clave) {
    var c = Config.todo();
    if (!(clave in c)) throw Util.error('Parametro de configuracion desconocido: ' + clave);
    return c[clave];
  },
  medios: function () {
    return String(Config.valor('medios_pago')).split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s !== ''; });
  },
  // Cambia un parametro (la fila de Decisiones la escribe quien llama)
  fijar: function (clave, valor) {
    var f = Datos.buscar('Configuracion', 'clave', clave);
    if (f) Datos.actualizar('Configuracion', f, { valor: valor });
    else Datos.agregar('Configuracion', { clave: clave, valor: valor });
  },
  validarCambios: function (cambios, actual) {
    var errores = [], k;
    var nuevo = {};
    for (k in actual) nuevo[k] = actual[k];
    for (k in cambios) {
      if (!(k in CONFIG_DEFAULTS)) { errores.push('Parametro desconocido: ' + k); continue; }
      if (CONFIG_TEXTO.indexOf(k) < 0) {
        var n = Util.entero(cambios[k]);
        if (isNaN(n) || n < 0) { errores.push(k + ' debe ser un numero entero mayor o igual a 0'); continue; }
        cambios[k] = n;
      }
      nuevo[k] = cambios[k];
    }
    var pesos = ['peso_pantalla', 'peso_bateria', 'peso_carga', 'peso_repuestos', 'peso_demanda', 'peso_antiguedad', 'peso_rentabilidad'];
    var s = 0; pesos.forEach(function (p) { s += Number(nuevo[p]); });
    if (s !== 100) errores.push('Los siete pesos deben sumar 100 (suman ' + s + ')');
    if (Number(nuevo.pct_capital_bps) + Number(nuevo.pct_fondo_bps) > 10000) errores.push('pct_capital_bps + pct_fondo_bps no puede superar 10000');
    if (Number(nuevo.max_cuotas) < 1) errores.push('max_cuotas debe ser al menos 1');
    if (cambios.medios_pago !== undefined) {
      var m = String(cambios.medios_pago).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      if (!m.length) errores.push('medios_pago no puede quedar vacio');
    }
    if (cambios.saldo_inicial_caja !== undefined && Datos.leer('Movimientos_Dinero').length > 0) errores.push('saldo_inicial_caja solo se puede editar mientras Movimientos_Dinero no tenga filas');
    return errores;
  }
};
