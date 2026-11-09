const { crearContexto } = require('./mock');
const vm = require('vm');
const ADM = { email: 'a@x.com', nombre: 'Admin', roles: ['Administrador'] };
const ADM2 = { email: 'b@x.com', nombre: 'Admin2', roles: ['Administrador'] };
const TEC = { email: 't@x.com', nombre: 'Tecnico', roles: ['Técnico'] };
const COM = { email: 'c@x.com', nombre: 'Comprador', roles: ['Comprador'] };
const SOP = { email: 's@x.com', nombre: 'Soporte', roles: ['Soporte de garantía'] };
const TECADM = { email: 't@x.com', nombre: 'Tecnico', roles: ['Técnico', 'Administrador'] };
let contador = 0;
function mundo(saldo) {
  const ctx = crearContexto();
  const run = s => vm.runInContext(s, ctx);
  const w = { ctx, run, ADM, ADM2, TEC, COM, SOP, TECADM };
  w.reloj = t => run('RELOJ_FIJO=' + JSON.stringify(t));
  w.op = (nombre, params, u) => { ctx.__n = nombre; ctx.__p = Object.assign({ id_operacion: 'OP-' + String(++contador).padStart(8, '0') }, params); ctx.__u = u || ADM; return run('ejecutarOperacion(__n, __p, __u)'); };
  w.opId = (id, nombre, params, u) => { ctx.__n = nombre; ctx.__p = Object.assign({ id_operacion: id }, params); ctx.__u = u || ADM; return run('ejecutarOperacion(__n, __p, __u)'); };
  w.lee = (nombre, params, u) => { ctx.__n = nombre; ctx.__p = params || {}; ctx.__u = u || ADM; run('Datos.reiniciar()'); return run('ejecutarOperacion(__n, __p, __u)'); };
  w.filas = (hoja, f) => { ctx.__h = hoja; run('Datos.reiniciar()'); const r = run('Datos.leer(__h).map(function(x){return JSON.parse(JSON.stringify(x))})'); return f ? r.filter(f) : r; };
  w.inv = () => { run('Datos.reiniciar()'); return run('Invariantes.verificarTodo(FuenteDatos)'); };
  w.disponible = () => { run('Datos.reiniciar()'); return run('Contab.dineroDisponible(FuenteDatos)'); };
  w.cortarTrasHoja = (hoja, nth, f) => {
    run('var __orig=Datos.agregar, __cnt=0; Datos.agregar=function(h,o){ if(h===' + JSON.stringify(hoja) + ' && ++__cnt>' + nth + ') throw new Error(\'CORTE\'); return __orig.call(Datos,h,o); }');
    try { return f(); } finally { run('Datos.agregar=__orig'); }
  };
  w.cortar = (k, f) => { // corta la aplicacion del plan tras k escrituras (sin contar la hoja Operaciones)
    run('var __orig=Datos.agregar, __cnt=0, __lim=' + k + '; Datos.agregar=function(h,o){ if(h!==\'Operaciones\' && ++__cnt>__lim) throw new Error(\'CORTE\'); return __orig.call(Datos,h,o); }');
    try { return f(); } finally { run('Datos.agregar=__orig'); }
  };
  w.reloj('2026-11-01T10:00:00');
  run('prepararSistema()'); run("crearPrimerAdministrador('a@x.com','Admin','1234')");
  [['t@x.com', 'Técnico'], ['c@x.com', 'Comprador'], ['s@x.com', 'Soporte de garantía']].forEach(([e, r]) => w.op('altaUsuario', { email: e, nombre: e, roles: [r], pin: '4321' }));
  w.op('altaUsuario', { email: 'b@x.com', nombre: 'Admin2', roles: ['Administrador'], pin: '4321' });
  w.op('actualizarConfiguracion', { cambios: { saldo_inicial_caja: saldo === undefined ? 20000000 : saldo }, comentario: 'capital inicial' });
  w.prv = w.op('guardarProveedor', { nombre: 'Juan Vendedor', contacto: '0981123456' }).id_proveedor;
  w.cli = w.op('guardarCliente', { nombre: 'Maria Cliente', contacto: '0982111222' }).id_cliente;
  w.cliCredito = w.op('guardarCliente', { nombre: 'Carlos Credito', contacto: '0982333444', tipo_documento: 'Cédula de identidad', numero_documento: '2345678', foto_documento_frente: 'u', foto_documento_dorso: 'u', fecha_nacimiento: '1985-01-01', domicilio_direccion: 'Calle 2', domicilio_barrio_ciudad: 'Centro', trabajo_lugar: 'Y', ingreso_comprobante: 'u', referencia1_nombre: 'A', referencia1_parentesco: 'x', referencia1_telefono: '0981', referencia2_nombre: 'B', referencia2_parentesco: 'y', referencia2_telefono: '0982' }).id_cliente;
  w.ver = id => w.lee('obtenerFichaEquipo', { id_equipo: id }).equipo.version;
  let n = 0;
  // Equipo hasta un estado dado (por defecto Publicado a precio fijado), sin reparacion
  w.equipoPublicado = (costo, precio) => {
    const imei = '35693803564' + String(3000 + (++n)).padStart(4, '0'); // se ajusta el digito Luhn abajo
    const e = w.op('crearEquipo', { tipo_articulo: 'Artículo nuevo', marca: 'Marca', modelo: 'M' + n, numero_serie: 'SN' + n + Math.random().toString(36).substring(2, 7) }, COM);
    const id = e.id_equipo;
    w.op('transicionarEquipo', { id_equipo: id, estado_nuevo: 'En negociación', comentario: 'negociando', version: w.ver(id) }, COM);
    w.op('cerrarCompra', { id_equipo: id, precio_compra: costo, medio: 'Efectivo', id_proveedor: w.prv, version: w.ver(id) }, COM);
    w.op('transicionarEquipo', { id_equipo: id, estado_nuevo: 'Recibido', comentario: 'recibido ok', version: w.ver(id) }, COM);
    w.op('transicionarEquipo', { id_equipo: id, estado_nuevo: 'Listo para venta', comentario: 'nuevo listo', version: w.ver(id) });
    w.op('fijarPrecio', { id_equipo: id, precio: precio, version: w.ver(id) });
    w.op('transicionarEquipo', { id_equipo: id, estado_nuevo: 'Publicado', comentario: 'publicado ok', version: w.ver(id) });
    return id;
  };
  // Equipo hasta En reparacion con trabajo abierto
  w.equipoEnReparacion = (costo) => {
    const e = w.op('crearEquipo', { tipo_articulo: 'Artículo usado', marca: 'Marca', modelo: 'U' + (++n), numero_serie: 'SU' + n + Math.random().toString(36).substring(2, 7), id_proveedor: w.prv }, COM);
    const id = e.id_equipo;
    w.op('transicionarEquipo', { id_equipo: id, estado_nuevo: 'En negociación', comentario: 'negociando', version: w.ver(id) }, COM);
    w.op('cerrarCompra', { id_equipo: id, precio_compra: costo, medio: 'Efectivo', version: w.ver(id) }, COM);
    w.op('transicionarEquipo', { id_equipo: id, estado_nuevo: 'Recibido', comentario: 'recibido ok', version: w.ver(id) }, COM);
    w.op('transicionarEquipo', { id_equipo: id, estado_nuevo: 'En diagnóstico', comentario: 'a diagnostico', version: w.ver(id) });
    return id;
  };
  w.tarifa = (nombre, monto, extra) => w.op('guardarTarifa', Object.assign({ nombre_trabajo: nombre, monto }, extra || {}));
  w.completar = (idEq, idTar, u, extra) => {
    const rep = w.op('iniciarReparacion', { id_equipo: idEq, version: w.ver(idEq) }, u || TEC);
    const c = w.op('completarReparacion', Object.assign({ id_reparacion: rep.id_reparacion, version: 1, resultado: 'Exitoso', trabajos: [{ id_tarifa: idTar }] }, extra || {}), u || TEC);
    return { id_reparacion: rep.id_reparacion, c };
  };
  w.aprobar = (idRep, u, extra) => {
    ctx.__r = idRep;
    const r = w.filas('Reparaciones', x => x.id_reparacion === idRep)[0];
    const rts = w.filas('Reparacion_Trabajos', x => x.id_reparacion === idRep && x.etapa === 'Elegido' && x.ronda === r.ronda_tarifa).map(x => ({ id_rt_origen: x.id_rt }));
    return w.op('aprobarTarifaReparacion', Object.assign({ id_reparacion: idRep, version: r.version, trabajos_aprobados: rts }, extra || {}), u || ADM);
  };
  return w;
}
module.exports = { mundo, ADM, ADM2, TEC, COM, SOP, TECADM };
