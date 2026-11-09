// GESTION_CELULARES - Datos.gs
// Capa de acceso a hojas. Cada hoja se lee una sola vez por ejecucion y se
// mantiene en memoria; toda escritura va a la hoja y a la copia en memoria.
// Ninguna otra parte del backend toca SpreadsheetApp directamente.

var TEXTO_RE = /^(fecha|vigente_desde|verificada_en|imei|numero_|contacto|telefono|trabajo_telefono|referencia\d_telefono|mes|equipo_identificador|payload|plan)/;

var Datos = (function () {
  var memoria = {};
  var libro = null;

  function abrirLibro() {
    if (libro) return libro;
    libro = SpreadsheetApp.getActiveSpreadsheet();
    if (!libro) {
      var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      if (id) libro = SpreadsheetApp.openById(id);
    }
    if (!libro) throw Util.error('El script no esta vinculado a una hoja de calculo. Ejecute prepararSistema desde la hoja.');
    return libro;
  }

  function celda(v) {
    if (v instanceof Date) return Util.fechaDeDate(v);
    return v;
  }

  function cargar(nombre) {
    if (memoria[nombre]) return memoria[nombre];
    var cols = HOJAS[nombre];
    if (!cols) throw Util.error('Hoja desconocida: ' + nombre);
    var sh = abrirLibro().getSheetByName(nombre);
    if (!sh) throw Util.error('Falta la hoja ' + nombre + '. Ejecute prepararSistema.');
    var valores = sh.getDataRange().getValues();
    var enc = valores[0] || [];
    var idx = {};
    for (var i = 0; i < enc.length; i++) idx[enc[i]] = i;
    var filas = [];
    for (var r = 1; r < valores.length; r++) {
      var o = { _fila: r + 1 };
      for (var c = 0; c < cols.length; c++) {
        var pos = idx[cols[c]];
        o[cols[c]] = pos === undefined ? '' : celda(valores[r][pos]);
      }
      filas.push(o);
    }
    memoria[nombre] = { sh: sh, cols: cols, idx: idx, filas: filas, siguiente: valores.length + 1 };
    return memoria[nombre];
  }

  function aArray(h, obj) {
    var fila = new Array(h.sh.getLastColumn() || h.cols.length);
    for (var i = 0; i < fila.length; i++) fila[i] = '';
    for (var c = 0; c < h.cols.length; c++) {
      var pos = h.idx[h.cols[c]];
      if (pos !== undefined) fila[pos] = (obj[h.cols[c]] === undefined || obj[h.cols[c]] === null) ? '' : obj[h.cols[c]];
    }
    return fila;
  }

  return {
    leer: function (nombre) { return cargar(nombre).filas; },
    filtrar: function (nombre, f) { return cargar(nombre).filas.filter(f); },
    buscar: function (nombre, col, valor) {
      var fs = cargar(nombre).filas;
      for (var i = 0; i < fs.length; i++) if (String(fs[i][col]) === String(valor)) return fs[i];
      return null;
    },
    agregar: function (nombre, obj) {
      var h = cargar(nombre);
      var fila = {};
      for (var c = 0; c < h.cols.length; c++) {
        var v = obj[h.cols[c]];
        fila[h.cols[c]] = (v === undefined || v === null) ? '' : v;
      }
      var n = h.sh.getLastRow() + 1;
      h.sh.getRange(n, 1, 1, h.sh.getLastColumn() || h.cols.length).setValues([aArray(h, fila)]);
      fila._fila = n;
      h.filas.push(fila);
      return fila;
    },
    actualizar: function (nombre, fila, cambios) {
      var h = cargar(nombre);
      for (var k in cambios) {
        if (!Object.prototype.hasOwnProperty.call(cambios, k)) continue;
        if (h.idx[k] === undefined) throw Util.error('Columna inexistente ' + nombre + '.' + k);
        fila[k] = cambios[k];
      }
      h.sh.getRange(fila._fila, 1, 1, h.sh.getLastColumn()).setValues([aArray(h, fila)]);
      return fila;
    },
    // Identificador secuencial PREFIJO-000001 mirando el maximo existente
    siguienteId: function (nombre, col, prefijo, ancho) {
      var fs = cargar(nombre).filas, max = 0, re = new RegExp('^' + prefijo + '-(\\d+)$');
      for (var i = 0; i < fs.length; i++) { var m = re.exec(String(fs[i][col])); if (m) max = Math.max(max, +m[1]); }
      var reservados = Datos._reserva[nombre + '.' + col] || 0;
      var n = Math.max(max, reservados) + 1;
      Datos._reserva[nombre + '.' + col] = n;
      return prefijo + '-' + Util.rellenar(n, ancho || 6);
    },
    siguienteNumero: function (nombre, col) {
      var fs = cargar(nombre).filas, max = 0;
      for (var i = 0; i < fs.length; i++) max = Math.max(max, Number(fs[i][col]) || 0);
      var r = Datos._reserva[nombre + '.' + col] || 0; var n = Math.max(max, r) + 1; Datos._reserva[nombre + '.' + col] = n; return n;
    },
    _reserva: {},
    reiniciar: function () { memoria = {}; Datos._reserva = {}; libro = null; },
    abrirLibro: abrirLibro,
    columnasTexto: function (cols) { return cols.map(function (c) { return TEXTO_RE.test(c); }); }
  };
})();
