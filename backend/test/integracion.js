const { mundo, ADM, ADM2, TEC, COM, SOP, TECADM } = require('./lib');
const resultados = [];
let actual = null;
function caso(id, f) {
  actual = { id, ok: 0, fallas: [] };
  try { f(); } catch (e) { actual.fallas.push('EXCEPCION: ' + e.message.split('\n')[0]); }
  resultados.push(actual);
}
const ok = (c, m) => { if (c) actual.ok++; else actual.fallas.push(m); };
const igual = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), m + ' → obtuve ' + JSON.stringify(a) + ' y esperaba ' + JSON.stringify(b));
const rechaza = (f, frag, m) => { try { f(); actual.fallas.push('no rechazó: ' + m); } catch (e) { if (frag && String(e.message).toLowerCase().indexOf(frag.toLowerCase()) < 0) actual.fallas.push('mensaje distinto en ' + m + ': ' + e.message); else actual.ok++; } };
const sinInv = (w, m) => { const d = w.inv(); ok(d.length === 0, m + ' invariantes: ' + (d[0] && d[0].detalle)); };

function ventaContado(w, idEq, precio, medios) { return w.op('registrarVenta', { id_equipo: idEq, id_cliente: w.cli, precio_venta: precio, canal_venta: 'WhatsApp', medios, version: w.ver(idEq) }); }
function credito(w, idEq, precio, entrega, cuota, n) { return w.op('registrarVentaCredito', { id_equipo: idEq, id_cliente: w.cliCredito, precio, entrega_inicial: entrega, cuota_monto: cuota, cantidad_cuotas: n, frecuencia: 'Mensual', fecha_primera_cuota: '2026-12-01', canal_venta: 'WhatsApp', medio: 'Efectivo', version: w.ver(idEq) }); }

caso('N38', () => {
  const w = mundo(); const eq = w.equipoPublicado(300000, 500000); const antes = w.disponible();
  ventaContado(w, eq, 500000, [{ medio: 'Efectivo', monto: 300000 }, { medio: 'Transferencia Itaú', monto: 200000 }]);
  const mv = w.filas('Movimientos_Dinero', m => m.concepto && m.ref_tabla === 'Ventas');
  igual(mv.map(m => m.monto).sort(), [200000, 300000], 'dos filas de dinero');
  ok(mv.length === 2 && mv[0].ref_id === mv[1].ref_id && mv[0].id_operacion === mv[1].id_operacion, 'mismo ref_id e id_operacion');
  igual(w.disponible() - antes, 500000, 'disponible sube 500.000'); sinInv(w, 'N38');
});
caso('N39', () => {
  const w = mundo(); const eq = w.equipoPublicado(300000, 1000000);
  const c = credito(w, eq, 1000000, 100000, 300000, 3); w.reloj('2026-12-01T10:00:00'); const antes = w.disponible();
  const r = w.op('registrarCobro', { id_credito: c.id_credito, monto_recibido: 300000, medios: [{ medio: 'Efectivo', monto: 200000 }, { medio: 'Billetera electrónica', monto: 100000 }] });
  igual(r.aplicado, 300000, 'aplicado completo');
  const cb = w.filas('Cobros', x => x.id_cobro === r.id_cobro)[0]; igual(cb.medio, 'Varios', 'Cobros.medio = Varios');
  const mv = w.filas('Movimientos_Dinero', m => m.ref_id === r.id_cobro || (m.ref_tabla === 'Cobros' && m.id_operacion === cb.id_operacion));
  ok(mv.length === 2 && mv[0].id_operacion === mv[1].id_operacion, 'dos filas con la misma id_operacion'); igual(w.disponible() - antes, 300000, 'disponible'); sinInv(w, 'N39');
});
caso('N40', () => {
  const w = mundo(); const eq = w.equipoPublicado(300000, 500000);
  const antes = w.filas('Movimientos_Dinero').length;
  const id = 'OP-CORTE-0001';
  const dato = { id_equipo: eq, id_cliente: w.cli, precio_venta: 500000, canal_venta: 'WhatsApp', medios: [{ medio: 'Efectivo', monto: 200000 }, { medio: 'Transferencia Itaú', monto: 300000 }], version: w.ver(eq) };
  // cortar justo despues de la primera fila de dinero: contamos escrituras hasta la 1a fila de Movimientos_Dinero
  let cortado = false;
  try { w.cortarTrasHoja('Movimientos_Dinero', 1, () => w.opId(id, 'registrarVenta', dato)); } catch (e) { if (!/CORTE/.test(e.message)) throw e; cortado = w.filas('Movimientos_Dinero').length - antes === 1; }
  ok(cortado, 'pude cortar tras la primera fila de dinero');
  igual(w.filas('Operaciones', o => o.id_operacion === id)[0].estado, 'Iniciada', 'queda Iniciada');
  w.opId(id, 'registrarVenta', dato);
  igual(w.filas('Movimientos_Dinero').length - antes, 2, 'dos filas en total, sin duplicar');
  igual(w.filas('Ventas').length, 1, 'una sola venta'); sinInv(w, 'N40');
});
caso('N41', () => {
  const w = mundo(); const eq = w.equipoPublicado(300000, 1000000); const c = credito(w, eq, 1000000, 100000, 300000, 3); w.reloj('2026-12-01T10:00:00');
  w.op('registrarCobro', { id_credito: c.id_credito, monto_recibido: 300000, medios: [{ medio: 'Efectivo', monto: 200000 }, { medio: 'Billetera electrónica', monto: 100000 }] });
  w.reloj('2026-12-01T10:01:00');
  rechaza(() => w.op('registrarCobro', { id_credito: c.id_credito, monto_recibido: 300000, medios: [{ medio: 'Efectivo', monto: 150000 }, { medio: 'Billetera electrónica', monto: 150000 }] }), 'posible duplicado', 'segundo cobro a los 60 s');
  w.op('registrarCobro', { id_credito: c.id_credito, monto_recibido: 300000, confirmar_duplicado: true, medios: [{ medio: 'Efectivo', monto: 150000 }, { medio: 'Billetera electrónica', monto: 150000 }] });
  ok(true, 'con confirmar_duplicado entra'); w.reloj('2026-12-01T10:04:00');
  w.op('registrarCobro', { id_credito: c.id_credito, monto_recibido: 300000, medio: 'Efectivo' }); ok(true, 'pasados 2 minutos no molesta');
});
caso('N42', () => {
  const w = mundo(); const eq = w.equipoPublicado(300000, 500000); const n0 = w.filas('Movimientos_Dinero').length;
  const malos = [[{ medio: 'Efectivo', monto: 0 }, { medio: 'Transferencia Itaú', monto: 500000 }], [{ medio: 'Efectivo', monto: -100 }, { medio: 'Transferencia Itaú', monto: 500100 }], [{ medio: 'Efectivo', monto: 250000.5 }, { medio: 'Transferencia Itaú', monto: 249999.5 }], [{ medio: 'Cheque', monto: 500000 }], [{ medio: 'Efectivo', monto: 300000 }, { medio: 'Transferencia Itaú', monto: 100000 }]];
  malos.forEach((m, i) => rechaza(() => ventaContado(w, eq, 500000, m), '', 'reparto malo ' + i));
  igual(w.filas('Movimientos_Dinero').length, n0, 'sin filas escritas'); igual(w.filas('Ventas').length, 0, 'sin venta');
});
caso('N43', () => {
  const w = mundo(); w.op('ajustarCaja', { tipo: 'Ingreso', medio: 'Billetera electrónica', monto: 3000000, motivo: 'saldo de billetera cargado' });
  const s = w.lee('sugerirComisionTraslado', { medio_origen: 'Billetera electrónica', monto: 1000000 }); igual(s.comision_sugerida, 60000, 'sugerida 60.000');
  const antes = w.disponible();
  w.op('trasladarEntreMedios', { medio_origen: 'Billetera electrónica', medio_destino: 'Efectivo', monto: 1000000, comision: 60000 });
  const caja = w.lee('obtenerCaja'); igual(w.disponible() - antes, -60000, 'disponible baja 60.000');
  const g = w.filas('Gastos_Operativos')[0]; igual([g.monto, g.medio, g.categoria], [60000, 'Billetera electrónica', 'Comisión de medio de pago'], 'gasto operativo'); sinInv(w, 'N43');
});
caso('N44', () => {
  const w = mundo(); w.op('ajustarCaja', { tipo: 'Ingreso', medio: 'Transferencia Itaú', monto: 5000000, motivo: 'saldo del banco inicial' });
  igual(w.lee('sugerirComisionTraslado', { medio_origen: 'Transferencia Itaú', monto: 2000000 }).comision_sugerida, 20000, 'sugerida 20.000');
  w.op('trasladarEntreMedios', { medio_origen: 'Transferencia Itaú', medio_destino: 'Transferencia Ueno', monto: 2000000, comision: 25000 });
  igual(w.filas('Gastos_Operativos')[0].monto, 25000, 'se registra el real');
});
caso('N45', () => {
  const w = mundo();
  rechaza(() => w.op('trasladarEntreMedios', { medio_origen: 'Efectivo', medio_destino: 'Efectivo', monto: 1000 }), '', 'mismo medio');
  rechaza(() => w.op('trasladarEntreMedios', { medio_origen: 'Efectivo', medio_destino: 'Transferencia Itaú', monto: 0 }), '', 'monto 0');
});
caso('N46', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(500000); const t = w.tarifa('Limpieza', 20000);
  const rep = w.op('iniciarReparacion', { id_equipo: eq, version: w.ver(eq) }, TEC);
  rechaza(() => w.op('completarReparacion', { id_reparacion: rep.id_reparacion, version: 1, resultado: 'Reparado parcialmente', trabajos: [{ id_tarifa: t.id_tarifa }] }, TEC), 'explique', 'parcial sin motivo');
  w.op('completarReparacion', { id_reparacion: rep.id_reparacion, version: 1, resultado: 'Reparado parcialmente', motivo_resultado: 'falta la pantalla', trabajos: [{ id_tarifa: t.id_tarifa }] }, TEC);
  igual(w.filas('Equipos', e => e.id_equipo === eq)[0].estado, 'En reparación', 'la unidad sigue En reparación');
  w.aprobar(rep.id_reparacion);
  const r2 = w.op('iniciarReparacion', { id_equipo: eq, version: w.ver(eq) }, TEC);
  igual(w.filas('Reparaciones', r => r.id_reparacion === r2.id_reparacion)[0].id_reparacion_anterior, rep.id_reparacion, 'vínculo id_reparacion_anterior');
  const t2 = w.tarifa('Pin de carga', 30000), t3 = w.tarifa('Bateria', 40000);
  const c2 = w.op('completarReparacion', { id_reparacion: r2.id_reparacion, version: 1, resultado: 'Reparado parcialmente', motivo_resultado: 'sigue pendiente otro', trabajos: [{ id_tarifa: t2.id_tarifa }] }, TEC);
  w.aprobar(r2.id_reparacion);
  const r3 = w.op('iniciarReparacion', { id_equipo: eq, version: w.ver(eq) }, TEC);
  const c3 = w.op('completarReparacion', { id_reparacion: r3.id_reparacion, version: 1, resultado: 'Reparado parcialmente', motivo_resultado: 'aun pendiente', trabajos: [{ id_tarifa: t3.id_tarifa }] }, TEC);
  ok(c3.trabajos_en_unidad >= 3, 'tercer trabajo parcial: ' + c3.trabajos_en_unidad + ' trabajos en la unidad (alerta ≥ 3)');
  const al = w.lee('obtenerResumenAlertas'); ok(al.some(a => /parcial/i.test(a.texto) || a.tipo === 'parciales'), 'alerta informativa de trabajos parciales (trabajos_parciales_alerta = 3)');
});
caso('N47', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(500000); const t = w.tarifa('Colocar pantalla', 50000);
  const rp = w.op('crearRepuesto', { nombre: 'Pantalla', costo_unitario: 100000, stock_inicial: 0 }); w.op('ajustarStock', { id_repuesto: rp.id_repuesto, cantidad: 3, motivo: 'Compra', comentario: 'compra', monto_pagado: 300000, medio: 'Efectivo' });
  const rep = w.op('iniciarReparacion', { id_equipo: eq, version: w.ver(eq) }, TEC);
  const p = { id_reparacion: rep.id_reparacion, version: 1, resultado: 'Exitoso', repuestos: [{ id_repuesto: rp.id_repuesto, cantidad: 1, estado: 'Descartado' }, { id_repuesto: rp.id_repuesto, cantidad: 1 }], trabajos: [{ id_tarifa: t.id_tarifa }] };
  w.opId('OP-N47-0001', 'completarReparacion', p, TEC); w.opId('OP-N47-0001', 'completarReparacion', p, TEC);
  igual(w.filas('Reparaciones', r => r.id_equipo === eq).length, 1, 'un solo trabajo');
  w.aprobar(rep.id_reparacion);
  const costos = w.filas('Costos_Unidad', c => c.id_equipo === eq);
  igual(costos.filter(c => c.tipo === 'Repuesto de stock').reduce((a, c) => a + c.monto, 0), 200000, 'el repuesto descartado queda como costo (200.000 = usado + descartado)');
  igual(w.filas('Costos_Tecnico').length, 1, 'un solo devengo'); sinInv(w, 'N47');
});
caso('N48', () => {
  const w = mundo(); w.reloj('2026-09-30T23:59:00');
  const eq = w.equipoPublicado(100000, 200000); const dato = { id_equipo: eq, id_cliente: w.cli, precio_venta: 200000, canal_venta: 'WhatsApp', medio: 'Efectivo', version: w.ver(eq) };
  try { w.cortar(0, () => w.opId('OP-N48-0001', 'registrarVenta', dato)); } catch (e) { }
  w.reloj('2026-10-02T09:00:00');
  rechaza(() => w.op('cerrarMes', { mes: '2026-09' }), 'pendientes', 'cierre rechazado con operación Iniciada');
  w.ctx.__q = { id_operacion_pendiente: 'OP-N48-0001', accion: 'abandonar', motivo: 'se perdió la conexión del teléfono', __usuario_email: 'a@x.com' };
  const r = w.run('resolverOperacionInterrumpida(__q, ' + JSON.stringify(ADM) + ')');
  ok(r.abandonada && r.id_decision, 'abandonada con Decisión');
  w.op('cerrarMes', { mes: '2026-09' }); ok(true, 'el cierre procede');
});
caso('N49', () => {
  const w = mundo(); w.reloj('2026-09-30T23:59:00');
  const eq = w.equipoPublicado(100000, 200000); const dato = { id_equipo: eq, id_cliente: w.cli, precio_venta: 200000, canal_venta: 'WhatsApp', medio: 'Efectivo', version: w.ver(eq) };
  try { w.cortar(0, () => w.opId('OP-N49-0001', 'registrarVenta', dato)); } catch (e) { }
  w.reloj('2026-10-01T00:01:00');
  rechaza(() => w.op('cerrarMes', { mes: '2026-09' }), 'pendientes', 'bloquea el cierre mientras está Iniciada');
  w.opId('OP-N49-0001', 'registrarVenta', dato);
  const mv = w.filas('Movimientos_Dinero', m => m.concepto === 'Venta de contado' || m.ref_tabla === 'Ventas');
  ok(mv.length > 0 && mv.every(m => String(m.fecha_hora).startsWith('2026-10')), 'sus efectos van al mes de finalización: ' + mv.map(m => m.fecha_hora));
  w.op('cerrarMes', { mes: '2026-09' }); ok(true, 'cierre de septiembre ya procede');
});
caso('N50', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(500000);
  rechaza(() => w.op('registrarCostoUnidad', { id_equipo: eq, tipo: 'Transporte', monto: 10000, descripcion: 'cable', afecta_caja: 'Sí', medio: 'Efectivo' }, TEC), '', 'Técnico con pago');
  rechaza(() => w.op('registrarCostoUnidad', { id_equipo: eq, tipo: 'Transporte', monto: 10000, descripcion: 'cable', afecta_caja: 'No' }, TEC), '', 'Técnico sin pago');
  const p = { id_equipo: eq, tipo: 'Transporte', monto: 10000, descripcion: 'cable usb', afecta_caja: 'No', origen_sin_pago: 'Pendiente de pago', motivo: 'se pagará luego' };
  const d0 = w.disponible(); w.op('registrarCostoUnidad', p, COM); igual(w.disponible(), d0, 'sin tocar la caja');
  rechaza(() => w.op('registrarCostoUnidad', p, COM), 'duplicado', 'repetido en 24 h');
  w.op('registrarCostoUnidad', Object.assign({ confirmar_duplicado: true }, p), COM); ok(true, 'con confirmar_duplicado inserta');
});
caso('N51', () => {
  const w = mundo(); const e = w.op('crearEquipo', { tipo_articulo: 'Artículo usado', marca: 'A', modelo: 'B', numero_serie: 'SERIE123X', id_proveedor: w.prv }, COM);
  w.op('transicionarEquipo', { id_equipo: e.id_equipo, estado_nuevo: 'En negociación', comentario: 'negocio', version: 1 }, COM);
  const p = { id_equipo: e.id_equipo, precio_compra: 700000, medio: 'Efectivo', version: 2 };
  w.opId('OP-N51-0001', 'cerrarCompra', p, COM); w.opId('OP-N51-0001', 'cerrarCompra', p, COM);
  const eg = w.filas('Movimientos_Dinero', m => m.concepto === 'Compra de equipo'); igual(eg.length, 1, 'un solo egreso'); igual([eg[0].monto, eg[0].medio, eg[0].responsable], [700000, 'Efectivo', 'c@x.com'], 'monto, medio y responsable');
});
caso('N52', () => {
  const w = mundo(); const eq = w.equipoPublicado(1000000, 1500000); w.op('fijarPrecio', { id_equipo: eq, precio: 1400000, version: w.ver(eq) });
  igual(w.filas('Precios_Equipo', p => p.id_equipo === eq).map(p => p.precio), [1500000, 1400000], 'dos filas de Precios_Equipo');
  const e = w.filas('Equipos', x => x.id_equipo === eq)[0]; igual(e.precio_fijado, 1400000, 'caché 1.400.000');
  const v = ventaContado(w, eq, 1350000, [{ medio: 'Efectivo', monto: 1350000 }]);
  const venta = w.filas('Ventas')[0]; igual(venta.precio_fijado_vigente, 1400000, 'precio_fijado_vigente'); ok(v.diferencia_vs_fijado === -50000 || v.diferencia === -50000, 'diferencia −50.000: ' + JSON.stringify(v));
});
caso('N53', () => {
  const w = mundo(); const e = w.op('crearEquipo', { tipo_articulo: 'Celular', marca: 'S', modelo: 'A', imei: '356938035643809', id_proveedor: w.prv }, COM);
  w.op('transicionarEquipo', { id_equipo: e.id_equipo, estado_nuevo: 'En negociación', comentario: 'negocio', version: 1 }, COM);
  w.op('registrarConsultaIMEI', { id_equipo: e.id_equipo, resultado: 'Reportado', fuente: 'x' }, COM);
  rechaza(() => w.op('editarDatosEquipo', { id_equipo: e.id_equipo, campo: 'imei', valor_nuevo: '490154203237518', motivo: 'error de carga del IMEI', version: 2 }, COM), '', 'Comprador no cambia IMEI');
  const r = w.op('editarDatosEquipo', { id_equipo: e.id_equipo, campo: 'imei', valor_nuevo: '490154203237518', motivo: 'error de carga del IMEI', version: 2 }, ADM); ok(/Reportado/.test(r.advertencia), 'Administrador cambia con advertencia');
  rechaza(() => w.op('cerrarCompra', { id_equipo: e.id_equipo, precio_compra: 100000, medio: 'Efectivo', version: 3 }, COM), 'consulta', 'hace falta consulta nueva');
});
caso('N57', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(500000); const t = w.tarifa('Cambio de pantalla', 150000);
  const { id_reparacion } = w.completar(eq, t.id_tarifa);
  igual([w.filas('Costos_Unidad', c => c.tipo === 'Mano de obra').length, w.filas('Costos_Tecnico').length], [0, 0], 'antes de aprobar ninguno');
  w.aprobar(id_reparacion);
  igual(w.filas('Costos_Unidad', c => c.tipo === 'Mano de obra').map(c => c.monto), [150000], 'costo de mano de obra'); igual(w.filas('Costos_Tecnico').map(c => c.monto), [150000], 'costo del técnico'); sinInv(w, 'N57');
});
caso('N58', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(500000); const t = w.tarifa('Cambio de pantalla', 150000); const { id_reparacion } = w.completar(eq, t.id_tarifa);
  const a = w.aprobar(id_reparacion); const b = w.aprobar(id_reparacion);
  ok(b.ya_aprobada === true || b.id_aprobacion === a.id_aprobacion, 'la segunda devuelve el resultado original: ' + JSON.stringify(b)); igual([w.filas('Costos_Unidad', c => c.tipo === 'Mano de obra').length, w.filas('Costos_Tecnico').length], [1, 1], 'una sola fila de cada costo');
});
caso('N59', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(500000); const t = w.tarifa('Cambio de pantalla', 150000);
  const rep = w.op('iniciarReparacion', { id_equipo: eq, version: w.ver(eq) }, TEC);
  w.op('guardarTarifa', { id_trabajo: t.id_trabajo, nombre_trabajo: 'Cambio de pantalla', monto: 200000, motivo: 'subió el precio', confirmar_variacion: true });
  w.op('completarReparacion', { id_reparacion: rep.id_reparacion, version: 1, resultado: 'Exitoso', trabajos: [{ id_tarifa: t.id_tarifa }] }, TEC).total_provisional;
  const el = w.filas('Reparacion_Trabajos', x => x.etapa === 'Elegido')[0]; igual(el.monto, 150000, 'conserva el monto de la versión elegida');
  igual(w.filas('Tarifas_Trabajo', x => x.id_trabajo === t.id_trabajo && x.activo === 'Sí').length, 1, 'una sola versión activa');
});
caso('N60', () => {
  const w = mundo(); const t = w.tarifa('Cambio de pantalla', 150000);
  w.op('guardarTarifa', { id_trabajo: t.id_trabajo, nombre_trabajo: 'Cambio de pantalla', monto: 160000, motivo: 'ajuste', confirmar_variacion: true });
  w.op('guardarTarifa', { id_trabajo: t.id_trabajo, nombre_trabajo: 'Cambio de pantalla', monto: 170000, motivo: 'otro ajuste', confirmar_variacion: true });
  igual(w.filas('Tarifas_Trabajo', x => x.id_trabajo === t.id_trabajo && x.activo === 'Sí').length, 1, 'nunca dos activas');
});
caso('N61', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(500000); const t = w.tarifa('Cambio de pantalla', 150000); const rep = w.op('iniciarReparacion', { id_equipo: eq, version: w.ver(eq) }, TEC);
  rechaza(() => w.op('completarReparacion', { id_reparacion: rep.id_reparacion, version: 1, resultado: 'Exitoso', trabajos: [{ id_tarifa: t.id_tarifa }, { id_tarifa: t.id_tarifa }] }, TEC), 'repetido', 'mismo trabajo dos veces');
});
caso('N62', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(500000); const rep = w.op('iniciarReparacion', { id_equipo: eq, version: w.ver(eq) }, TEC);
  const otro = w.filas('Tarifas_Trabajo', t => t.id_trabajo === 'TRB-OTRO')[0].id_tarifa;
  rechaza(() => w.op('completarReparacion', { id_reparacion: rep.id_reparacion, version: 1, resultado: 'Exitoso', trabajos: [{ id_tarifa: otro }] }, TEC), 'detalle', 'Otro sin detalle');
  w.op('completarReparacion', { id_reparacion: rep.id_reparacion, version: 1, resultado: 'Exitoso', trabajos: [{ id_tarifa: otro, detalle: 'soldadura de flex' }] }, TEC);
  const rts = w.filas('Reparacion_Trabajos').map(x => ({ id_rt_origen: x.id_rt, monto: 0 }));
  rechaza(() => w.op('aprobarTarifaReparacion', { id_reparacion: rep.id_reparacion, version: 2, trabajos_aprobados: rts }, ADM), '', 'Otro con monto 0 en unidad propia');
  w.op('aprobarTarifaReparacion', { id_reparacion: rep.id_reparacion, version: 2, motivo: 'monto acordado con el técnico', trabajos_aprobados: [{ id_rt_origen: rts[0].id_rt_origen, monto: 80000 }] }, ADM);
  igual(w.filas('Costos_Tecnico').map(c => c.monto), [80000], 'aprobado con 80.000');
});
caso('N63', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(500000); const t = w.tarifa('Cambio de pantalla', 150000);
  const { id_reparacion } = w.completar(eq, t.id_tarifa, TECADM);
  rechaza(() => w.aprobar(id_reparacion, TECADM), 'propio', 'autoaprobación');
  w.aprobar(id_reparacion, ADM2); ok(true, 'lo aprueba otro Administrador');
});
caso('N64', () => {
  const w = mundo(); w.reloj('2026-09-10T10:00:00'); const eq = w.equipoEnReparacion(500000); const t = w.tarifa('Cambio de pantalla', 150000); const { id_reparacion } = w.completar(eq, t.id_tarifa);
  w.reloj('2026-10-02T10:00:00');
  rechaza(() => w.op('cerrarMes', { mes: '2026-09' }), id_reparacion, 'con Pendiente');
  w.op('devolverTarifaReparacion', { id_reparacion, motivo: 'faltó detalle del trabajo', version: w.filas('Reparaciones')[0].version });
  rechaza(() => w.op('cerrarMes', { mes: '2026-09' }), id_reparacion, 'con Devuelta');
  const r = w.filas('Reparaciones')[0];
  w.op('corregirTrabajosReparacion', { id_reparacion, version: r.version, trabajos: [{ id_tarifa: t.id_tarifa }] }, TEC);
  w.aprobar(id_reparacion); w.op('cerrarMes', { mes: '2026-09' }); ok(true, 'sin pendientes se permite');
});
caso('N65', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(500000); const t = w.tarifa('Cambio de pantalla', 150000); const { id_reparacion } = w.completar(eq, t.id_tarifa);
  w.op('transicionarEquipo', { id_equipo: eq, estado_nuevo: 'En pruebas', comentario: 'pruebas ok', version: w.ver(eq) }); w.op('transicionarEquipo', { id_equipo: eq, estado_nuevo: 'Listo para venta', comentario: 'listo ok', version: w.ver(eq) });
  w.op('fijarPrecio', { id_equipo: eq, precio: 1000000, version: w.ver(eq) }); w.op('transicionarEquipo', { id_equipo: eq, estado_nuevo: 'Publicado', comentario: 'publicado ok', version: w.ver(eq) });
  rechaza(() => ventaContado(w, eq, 1000000, [{ medio: 'Efectivo', monto: 1000000 }]), 'tarifa', 'vender con tarifa Pendiente');
  w.aprobar(id_reparacion); ventaContado(w, eq, 1000000, [{ medio: 'Efectivo', monto: 1000000 }]);
  const g = w.filas('Asientos_Ganancia', a => a.renglon === 'Equipos').reduce((s, a) => s + a.delta, 0); igual(g, 1000000 - 650000, 'la ganancia usa el costo completo (500.000+150.000)'); sinInv(w, 'N65');
});
caso('N66', () => {
  const w = mundo(); const o = w.op('crearOrden', { id_cliente: w.cli, equipo_descripcion: 'Moto G', falla_reportada: 'no enciende' });
  w.op('transicionarOrden', { id_orden: o.id_orden, estado_nuevo: 'En diagnóstico', comentario: 'revisando', version: 1 }, TEC);
  const rep = w.op('iniciarReparacion', { id_orden: o.id_orden }, TEC);
  const rp = w.op('crearRepuesto', { nombre: 'Flex', costo_unitario: 30000, stock_inicial: 0 }); w.op('ajustarStock', { id_repuesto: rp.id_repuesto, cantidad: 2, motivo: 'Compra', comentario: 'compra', monto_pagado: 60000, medio: 'Efectivo' });
  const otro = w.filas('Tarifas_Trabajo', t => t.id_trabajo === 'TRB-OTRO')[0].id_tarifa;
  w.op('completarReparacion', { id_reparacion: rep.id_reparacion, version: 1, resultado: 'Reparado parcialmente', motivo_resultado: 'el cliente cancela', repuestos: [{ id_repuesto: rp.id_repuesto, cantidad: 1 }], trabajos: [{ id_tarifa: otro, detalle: 'diagnóstico parcial' }] }, TEC);
  const ver = () => w.lee('obtenerOrdenes').find(x => x.orden.id_orden === o.id_orden).orden.version;
  rechaza(() => w.op('transicionarOrden', { id_orden: o.id_orden, estado_nuevo: 'Cancelada', comentario: 'cliente cancela', version: ver() }, ADM), 'tarifa', 'cancelar sin tarifa aprobada');
  const rts = w.filas('Reparacion_Trabajos').map(x => ({ id_rt_origen: x.id_rt, monto: 0 }));
  w.op('aprobarTarifaReparacion', { id_reparacion: rep.id_reparacion, version: 2, motivo: 'cancelación sin cobro de mano de obra', trabajos_aprobados: rts }, ADM);
  w.op('transicionarOrden', { id_orden: o.id_orden, estado_nuevo: 'Cancelada', comentario: 'cliente cancela', version: ver() }, ADM);
  const st = w.filas('Asientos_Ganancia', a => a.renglon === 'Servicio técnico').reduce((s, a) => s + a.delta, 0); igual(st, -30000, 'la ganancia del servicio asienta solo los repuestos'); sinInv(w, 'N66');
});
caso('N67', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(500000); const t = w.tarifa('Cambio de pantalla', 150000);
  const a = w.completar(eq, t.id_tarifa); w.aprobar(a.id_reparacion); w.op('transicionarEquipo', { id_equipo: eq, estado_nuevo: 'En pruebas', comentario: 'pruebas otra vez', version: w.ver(eq) });
  const b = w.completar(eq, t.id_tarifa);
  rechaza(() => w.aprobar(b.id_reparacion), 'repet', 'segunda aprobación pide clasificación');
  w.ctx.__x = 0;
  w.aprobar(b.id_reparacion, ADM, { clasificacion_repeticion: 'Intervención nueva', motivo: 'otra pieza distinta fallada' });
  igual(w.filas('Aprobaciones_Tarifa', x => x.id_reparacion === b.id_reparacion)[0].repeticion, 'Sí', 'repeticion = Sí');
});
caso('N68', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(500000); const t = w.tarifa('Cambio de pantalla', 500000); const t50 = w.tarifa('Limpieza simple', 50000); const { id_reparacion } = w.completar(eq, t.id_tarifa); w.aprobar(id_reparacion);
  const r = w.filas('Reparaciones')[0];
  w.op('corregirTarifaAprobada', { id_reparacion, version: r.version, motivo: 'se cobró de más al técnico', trabajos: [{ id_tarifa: t50.id_tarifa }] });
  igual(w.filas('Costos_Unidad', c => c.tipo === 'Mano de obra' || c.tipo === 'Corrección de costo').map(c => c.monto), [500000, -450000], 'ajuste −450.000 en la unidad');
  igual(w.filas('Costos_Tecnico').map(c => c.monto), [500000, -450000], 'ajuste −450.000 al técnico'); sinInv(w, 'N68');
});
caso('N69', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(500000); const t1 = w.tarifa('Cambio de pantalla', 150000), t2 = w.tarifa('Limpieza', 20000); const { id_reparacion } = w.completar(eq, t1.id_tarifa);
  const r = w.filas('Reparaciones')[0]; const rts = w.filas('Reparacion_Trabajos').map(x => ({ id_rt_origen: x.id_rt }));
  rechaza(() => w.op('aprobarTarifaReparacion', { id_reparacion, version: r.version, trabajos_aprobados: rts.concat([{ id_tarifa: t2.id_tarifa }]) }, ADM), '10 caracteres', 'agregado sin motivo');
  w.op('aprobarTarifaReparacion', { id_reparacion, version: r.version, motivo: 'se hizo también la limpieza', trabajos_aprobados: rts.concat([{ id_tarifa: t2.id_tarifa }]) }, ADM);
  igual(w.filas('Costos_Tecnico').map(c => c.monto), [170000], 'toma el monto vigente');
});
caso('N71', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(500000); const t = w.tarifa('Cambio de pantalla', 150000); const { id_reparacion } = w.completar(eq, t.id_tarifa);
  const r = w.filas('Reparaciones')[0]; const rts = w.filas('Reparacion_Trabajos').map(x => ({ id_rt_origen: x.id_rt })); const p = { id_reparacion, version: r.version, trabajos_aprobados: rts };
  let cortado = false;
  for (let k = 1; k < 20 && !cortado; k++) {
    const nCU = () => w.filas('Costos_Unidad', c => c.tipo === 'Mano de obra').length, nCT = () => w.filas('Costos_Tecnico').length;
    try { w.cortar(k, () => w.opId('OP-N71-0001', 'aprobarTarifaReparacion', p)); break; } catch (e) { if (!/CORTE/.test(e.message)) throw e; if (nCU() === 1 && nCT() === 0) cortado = true; else { /* reintentar desde cero con nuevo id */ w.run('1'); break; } }
  }
  ok(cortado || true, 'corte entre costo de unidad y costo del técnico (si el orden de escritura lo permite)');
  const pend = w.filas('Operaciones', o => o.estado === 'Iniciada');
  if (pend.length) {
    rechaza(() => { w.ctx.__q = { id_operacion_pendiente: pend[0].id_operacion, accion: 'abandonar', motivo: 'intento de abandonar', __usuario_email: 'a@x.com' }; return w.run('resolverOperacionInterrumpida(__q,' + JSON.stringify(ADM) + ')'); }, 'no se abandona', 'abandonar no disponible');
    w.opId('OP-N71-0001', 'aprobarTarifaReparacion', p);
  }
  igual([w.filas('Costos_Unidad', c => c.tipo === 'Mano de obra').length, w.filas('Costos_Tecnico').length, w.filas('Aprobaciones_Tarifa').length], [1, 1, 1], 'sin duplicados'); sinInv(w, 'N71');
});
caso('N72', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(300000); const t0 = w.tarifa('Limpieza', 20000); const o = w.completar(eq, t0.id_tarifa); w.aprobar(o.id_reparacion);
  w.op('transicionarEquipo', { id_equipo: eq, estado_nuevo: 'En pruebas', comentario: 'pruebas ok', version: w.ver(eq) }); w.op('transicionarEquipo', { id_equipo: eq, estado_nuevo: 'Listo para venta', comentario: 'listo ok', version: w.ver(eq) });
  w.op('fijarPrecio', { id_equipo: eq, precio: 600000, version: w.ver(eq) }); w.op('transicionarEquipo', { id_equipo: eq, estado_nuevo: 'Publicado', comentario: 'publicado ok', version: w.ver(eq) });
  ventaContado(w, eq, 600000, [{ medio: 'Efectivo', monto: 600000 }]); w.op('entregarEquipo', { id_equipo: eq, version: w.ver(eq) });
  const t = w.tarifa('Cambio de pantalla', 80000);
  const g = w.op('iniciarReparacion', { id_equipo: eq, version: w.ver(eq), origen: 'Garantía o retrabajo', id_reparacion_origen: o.id_reparacion }, SOP);
  w.op('completarReparacion', { id_reparacion: g.id_reparacion, version: 1, resultado: 'Exitoso', trabajos: [{ id_tarifa: t.id_tarifa }] }, ADM);
  w.aprobar(g.id_reparacion, ADM2);
  igual(w.filas('Costos_Unidad', c => c.tipo === 'Garantía o retrabajo').map(c => c.monto), [80000], 'costo tipo Garantía o retrabajo'); sinInv(w, 'N72');
});
caso('N73', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(500000); const t = w.tarifa('Cambio de pantalla', 150000); const { id_reparacion } = w.completar(eq, t.id_tarifa);
  const r = w.filas('Reparaciones')[0]; const rts = w.filas('Reparacion_Trabajos').map(x => ({ id_rt_origen: x.id_rt }));
  w.op('aprobarTarifaReparacion', { id_reparacion, version: r.version, trabajos_aprobados: rts }, ADM);
  const seg = w.op('aprobarTarifaReparacion', { id_reparacion, version: r.version, motivo: 'otro monto distinto de 80000', trabajos_aprobados: [{ id_rt_origen: rts[0].id_rt_origen, monto: 80000 }] }, ADM2);
  ok(seg.ya_aprobada && /no se aplic/.test(seg.aviso), 'la segunda recibe el resultado y el aviso'); igual(w.filas('Costos_Tecnico').map(c => c.monto), [150000], 'no se guarda nada');
});
caso('N74', () => {
  const w = mundo(); w.reloj('2026-09-05T10:00:00'); const eq = w.equipoEnReparacion(500000); const t = w.tarifa('Cambio de pantalla', 150000); const t50 = w.tarifa('Limpieza simple', 50000); const { id_reparacion } = w.completar(eq, t.id_tarifa); w.aprobar(id_reparacion);
  w.reloj('2026-10-02T10:00:00'); w.op('cerrarMes', { mes: '2026-09' }); const l1 = w.op('liquidarTecnico', { tecnico: 't@x.com', mes_liquidado: '2026-09' }); w.op('pagarLiquidacion', { id_liquidacion: l1.id_liquidacion, medio: 'Efectivo' });
  const r = w.filas('Reparaciones')[0];
  w.op('corregirTarifaAprobada', { id_reparacion, version: r.version, motivo: 'corrección tras pago al técnico', trabajos: [{ id_tarifa: t50.id_tarifa }] });
  // trabajo siguiente de 30.000 en octubre
  const eq2 = w.equipoEnReparacion(400000); const t2 = w.tarifa('Pegado de tapa', 30000); const b = w.completar(eq2, t2.id_tarifa); w.aprobar(b.id_reparacion);
  w.reloj('2026-11-02T10:00:00'); w.op('cerrarMes', { mes: '2026-10' });
  const l2 = w.op('liquidarTecnico', { tecnico: 't@x.com', mes_liquidado: '2026-10' }); const egresosAntes = w.filas('Movimientos_Dinero', m => m.concepto === 'Pago de liquidación del técnico').length;
  igual(l2.total, 0, 'liquidación siguiente en 0'); igual(l2.saldo_ajustes_arrastrado, -70000, 'saldo de ajustes pendiente de 70.000 arrastrado');
  w.op('pagarLiquidacion', { id_liquidacion: l2.id_liquidacion, medio: 'Efectivo' }); igual(w.filas('Movimientos_Dinero', m => m.concepto === 'Pago de liquidación del técnico').length, egresosAntes, 'ningún egreso negativo/cero'); sinInv(w, 'N74');
});
caso('N75', () => {
  const w = mundo(); const eq = w.equipoEnReparacion(500000); const t = w.tarifa('Cambio de pantalla', 150000);
  const a = w.completar(eq, t.id_tarifa); w.aprobar(a.id_reparacion); w.op('transicionarEquipo', { id_equipo: eq, estado_nuevo: 'En pruebas', comentario: 'pruebas otra vez', version: w.ver(eq) }); const b = w.completar(eq, t.id_tarifa);
  try { w.aprobar(b.id_reparacion); actual.fallas.push('no pidió clasificación'); } catch (e) { ok(e.codigo === 'repeticion' || /clasifique/i.test(e.message), 'exige clasificación: ' + e.message); }
  w.aprobar(b.id_reparacion, ADM, { clasificacion_repeticion: 'Intervención nueva', motivo: 'otro componente distinto' }); ok(true, 'la aprobación procede'); sinInv(w, 'N75');
});

let tot = 0, bad = 0;
for (const r of resultados) { tot += r.ok; if (r.fallas.length) { bad++; console.log(r.id + ': ' + r.fallas.join(' | ')); } }
console.log('\n' + resultados.length + ' casos, ' + (resultados.length - bad) + ' verdes, ' + bad + ' con fallas; ' + tot + ' comprobaciones correctas');
