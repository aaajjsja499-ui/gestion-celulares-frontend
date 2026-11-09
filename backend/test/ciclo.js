const { crearContexto } = require('./mock');
const vm = require('vm');
const ctx = crearContexto();
global.__ctx = ctx;
const run = s => vm.runInContext(s, ctx);
let nOp = 0, fallas = 0, oks = 0;
function setReloj(t) { run("RELOJ_FIJO=" + JSON.stringify(t)); }
function usuario(email, roles) { return { email, nombre: email, roles }; }
const ADM = usuario('a@x.com', ['Administrador']), TEC = usuario('t@x.com', ['Técnico']), COM = usuario('c@x.com', ['Comprador']), SOP = usuario('s@x.com', ['Soporte de garantía']);
function op(nombre, params, u) {
  ctx.__n = nombre; ctx.__p = Object.assign({ id_operacion: 'OP-' + String(++nOp).padStart(8, '0') }, params); ctx.__u = u || ADM;
  return run('ejecutarOperacion(__n, __p, __u)');
}
function lee(nombre, params, u) { ctx.__n = nombre; ctx.__p = params || {}; ctx.__u = u || ADM; run('Datos.reiniciar()'); return run('ejecutarOperacion(__n, __p, __u)'); }
function ok(c, msg) { if (c) oks++; else { fallas++; console.log('FALLA:', msg); } }
function throws(f, msg, frag) { try { f(); fallas++; console.log('FALLA (no lanzó):', msg); } catch (e) { if (frag && String(e.message).indexOf(frag) < 0) { fallas++; console.log('FALLA mensaje:', msg, '→', e.message); } else oks++; } }
function inv() { run('Datos.reiniciar()'); return run('Invariantes.verificarTodo(FuenteDatos)'); }
function chk(msg) { const d = inv(); ok(d.length === 0, msg + ' invariantes: ' + (d[0] && d[0].detalle)); }

run('prepararSistema()'); run("crearPrimerAdministrador('a@x.com','Admin','1234')");
setReloj('2026-11-01T10:00:00');
for (const [e, r] of [['t@x.com', 'Técnico'], ['c@x.com', 'Comprador'], ['s@x.com', 'Soporte de garantía']]) op('altaUsuario', { email: e, nombre: e, roles: [r], pin: '4321' });
const prv = op('guardarProveedor', { nombre: 'Juan Vendedor', contacto: '0981123456' }).id_proveedor;
const cli = op('guardarCliente', { nombre: 'Maria Cliente', contacto: '0982111222', tipo_documento: 'Cédula de identidad', numero_documento: '1.234.567', foto_documento_frente: 'u', foto_documento_dorso: 'u', fecha_nacimiento: '1990-05-05', domicilio_direccion: 'Calle 1', domicilio_barrio_ciudad: 'Centro', trabajo_lugar: 'X', ingreso_comprobante: 'u', referencia1_nombre: 'A', referencia1_parentesco: 'x', referencia1_telefono: '0981', referencia2_nombre: 'B', referencia2_parentesco: 'y', referencia2_telefono: '0982' });
ok(cli.ficha_credito_completa === 'Sí', 'ficha completa');
throws(() => op('guardarCliente', { nombre: 'Otra', contacto: '099999', tipo_documento: 'Cédula de identidad', numero_documento: '1234567' }), 'documento duplicado', 'Ya existe');
// Configuración: saldo inicial
op('actualizarConfiguracion', { cambios: { saldo_inicial_caja: 10000000 }, comentario: 'capital inicial' });
// Compra
const eq = op('crearEquipo', { tipo_articulo: 'Celular', marca: 'Samsung', modelo: 'A15', imei: '356938035643809', id_proveedor: prv }, COM);
let v = 1;
op('transicionarEquipo', { id_equipo: eq.id_equipo, estado_nuevo: 'En negociación', comentario: 'contacto', version: v++ }, COM);
op('registrarConsultaIMEI', { id_equipo: eq.id_equipo, resultado: 'Limpio', fuente: 'manual' }, COM);
const c1 = op('cerrarCompra', { id_equipo: eq.id_equipo, precio_compra: 1000000, medio: 'Efectivo', version: v++ }, COM);
ok(c1.estado === 'Comprado', 'compra'); chk('tras compra');
setReloj('2026-11-02T10:00:00');
for (const est of ['Recibido', 'En diagnóstico']) op('transicionarEquipo', { id_equipo: eq.id_equipo, estado_nuevo: est, comentario: 'avance', version: v++ }, ADM);
console.log('eq', JSON.stringify(lee('obtenerFichaEquipo', { id_equipo: eq.id_equipo }, ADM).equipo || '').substring(0, 120));
console.log('RESUMEN parcial:', oks, 'ok', fallas, 'fallas');
module.exports = { op, lee, ok, throws, chk, run, ctx, setReloj, ADM, TEC, COM, SOP, eq, cli, prv };
