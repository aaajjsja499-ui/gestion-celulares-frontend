// Arnes de pruebas: carga los .gs en un contexto vm con Apps Script simulado
const vm = require('vm'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const DIR = path.join(__dirname, '..');
const ORDEN = ['Esquema','Util','Motor','Datos','Config','Auth','Operaciones','Contab','Equipos','Taller','Ventas','Creditos','Ordenes','Tecnico','Caja','Cierre','Invariantes','Maestros','Main','Setup','PruebasMotor'];

function crearContexto() {
  const hojas = {};
  function Hoja(nombre) {
    this.nombre = nombre; this.datos = [];
  }
  Hoja.prototype.getDataRange = function () { const self = this; return { getValues: () => self.datos.map(f => f.slice()) }; };
  Hoja.prototype.getLastRow = function () { return this.datos.length; };
  Hoja.prototype.getLastColumn = function () { return this.datos.reduce((m, f) => Math.max(m, f.length), 0); };
  Hoja.prototype.getMaxRows = function () { return 1000; };
  Hoja.prototype.setFrozenRows = function () {};
  Hoja.prototype.getRange = function (r, c, nr, nc) {
    const self = this;
    const rg = {
      setValues(v) { for (let i = 0; i < v.length; i++) { while (self.datos.length < r + i) self.datos.push([]); const fila = self.datos[r - 1 + i]; for (let j = 0; j < v[i].length; j++) fila[c - 1 + j] = v[i][j]; } return rg; },
      setFontWeight() { return rg; }, setNumberFormat() { return rg; }
    };
    return rg;
  };
  const ss = {
    getSheetByName: n => hojas[n] || null,
    insertSheet: n => (hojas[n] = new Hoja(n)),
    getSheets: () => Object.values(hojas),
    deleteSheet: h => { delete hojas[h.nombre]; }
  };
  const cache = {};
  const ctx = {
    console,
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    CacheService: { getScriptCache: () => ({ get: k => cache[k] === undefined ? null : cache[k], put: (k, v) => { cache[k] = v; }, remove: k => { delete cache[k]; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {} }) },
    ContentService: { createTextOutput: t => ({ t, setMimeType() { return this; } }), MimeType: { JSON: 'json' } },
    Utilities: {
      formatDate: (d, z, f) => { const t = new Date(d.getTime() - 3 * 3600 * 1000).toISOString(); return f.replace("yyyy-MM-dd'T'HH:mm:ss", t.substring(0, 19)); },
      computeDigest: (alg, s) => Array.from(crypto.createHash('sha256').update(s).digest()).map(b => b > 127 ? b - 256 : b),
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      getUuid: () => crypto.randomUUID()
    },
    __hojas: hojas
  };
  vm.createContext(ctx);
  for (const f of ORDEN) {
    const p = path.join(DIR, f + '.gs');
    vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f + '.gs' });
  }
  return ctx;
}
module.exports = { crearContexto };
