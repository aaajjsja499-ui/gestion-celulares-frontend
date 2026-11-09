const T = require('./ciclo');
const { op, lee, ok, throws, chk, run, setReloj, ADM, TEC, COM, SOP, eq, cli } = T;
let v = 4; // version del equipo tras En diagnóstico (1 crear,2 neg,3 comprado,4 recibido,5 diag) -> se relee
function ver() { return lee('obtenerFichaEquipo', { id_equipo: eq.id_equipo }).equipo.version; }
const diag = {}; ['pantalla','tactil','bateria','camara_trasera','camara_frontal','altavoz','microfono','puerto_carga','botones','huella_faceid','wifi','bluetooth','red_movil'].forEach(c => diag[c] = 'OK');
op('registrarDiagnostico', Object.assign({ id_equipo: eq.id_equipo, imei_verificado: 'OK', estado_fisico: 'Bueno', evidencia_humedad: 'No' }, diag), TEC);
const tar = op('guardarTarifa', { nombre_trabajo: 'Cambio de pantalla', monto: 80000 });
const rep = op('iniciarReparacion', { id_equipo: eq.id_equipo, version: ver() }, TEC);
const rp = op('crearRepuesto', { nombre: 'Pantalla A15', costo_unitario: 150000, stock_inicial: 0 });
op('ajustarStock', { id_repuesto: rp.id_repuesto, cantidad: 2, motivo: 'Compra', comentario: 'compra inicial', monto_pagado: 300000, medio: 'Efectivo' });
T.chk('tras comprar repuestos');
const rver = () => lee('obtenerReparaciones', {}, ADM).find ? 1 : 1;
const comp = op('completarReparacion', { id_reparacion: rep.id_reparacion, version: 1, resultado: 'Exitoso', tiempo_invertido_min: 45, repuestos: [{ id_repuesto: rp.id_repuesto, cantidad: 1 }], trabajos: [{ id_tarifa: tar.id_tarifa }] }, TEC);
ok(comp.estado_tarifa === 'Pendiente de aprobación', 'tarifa pendiente');
throws(() => op('transicionarEquipo', { id_equipo: eq.id_equipo, estado_nuevo: 'En pruebas', comentario: 'avance ok', version: ver() }, ADM) && op('transicionarEquipo', { id_equipo: eq.id_equipo, estado_nuevo: 'Listo para venta', comentario: 'avance ok', version: ver() }, ADM) && op('fijarPrecio', { id_equipo: eq.id_equipo, precio: 2000000, version: ver() }) && op('transicionarEquipo', { id_equipo: eq.id_equipo, estado_nuevo: 'Publicado', comentario: 'avance ok', version: ver() }) && op('registrarVenta', { id_equipo: eq.id_equipo, id_cliente: cli.id_cliente, precio_venta: 2000000, canal_venta: 'WhatsApp', medio: 'Efectivo', version: ver() }), 'venta bloqueada con tarifa pendiente', 'tarifa');
const rts = run("Datos.reiniciar(), Datos.leer('Reparacion_Trabajos').map(function(x){return {id_rt:x.id_rt}})");
const aprobados = rts.map(r => ({ id_rt_origen: r.id_rt }));
throws(() => op('aprobarTarifaReparacion', { id_reparacion: rep.id_reparacion, version: 2, trabajos_aprobados: aprobados }, { email: 't@x.com', nombre: 't@x.com', roles: ['Administrador', 'Técnico'] }), 'autoaprobación', 'propio');
const ap = op('aprobarTarifaReparacion', { id_reparacion: rep.id_reparacion, version: 2, trabajos_aprobados: aprobados }, ADM);
console.log('aprobada', JSON.stringify(ap));
chk('tras aprobar tarifa');
console.log('costos', JSON.stringify(lee('obtenerFichaEquipo', { id_equipo: eq.id_equipo }).equipo).match(/costo_total":[^,]*/));
console.log('RESUMEN:', T.run('1'), 'ok');
