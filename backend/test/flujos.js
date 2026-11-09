const { mundo, ADM, ADM2, TEC, COM, SOP } = require('./lib');
let fallas = 0, oks = 0;
const ok = (c, m) => { if (c) oks++; else { fallas++; console.log('FALLA:', m); } };
const paso = (nombre, f) => { try { f(); } catch (e) { fallas++; console.log('EXCEPCION en', nombre + ':', e.message.split('\n')[0]); } };
function credito(w, precio, entrega, cuota, n, costo) {
  const eq = w.equipoPublicado(costo || 800000, precio);
  const c = w.op('registrarVentaCredito', { id_equipo: eq, id_cliente: w.cliCredito, precio, entrega_inicial: entrega, cuota_monto: cuota, cantidad_cuotas: n, frecuencia: 'Mensual', fecha_primera_cuota: '2026-12-01', canal_venta: 'WhatsApp', medio: 'Efectivo', version: w.ver(eq) });
  w.op('entregarEquipo', { id_equipo: eq, version: w.ver(eq) }); return { eq, c };
}
const inv = (w, m) => { const d = w.inv(); ok(d.length === 0, m + ': ' + (d[0] && d[0].detalle)); };
const credV = (w, id) => w.filas('Creditos', c => c.id_credito === id)[0].version;

paso('devolucion contado', () => {
  const w = mundo(); const eq = w.equipoPublicado(300000, 500000);
  const v = w.op('registrarVenta', { id_equipo: eq, id_cliente: w.cli, precio_venta: 500000, canal_venta: 'WhatsApp', medio: 'Efectivo', version: w.ver(eq) });
  const r = w.op('registrarDevolucion', { id_venta: v.id_venta, tipo: 'Desistimiento', causa: 'Cliente', monto_reembolsado: 450000, motivo: 'el cliente se arrepintió y devolvió', medio: 'Efectivo' });
  ok(r.reembolsado === 450000, 'reembolso 450.000: ' + JSON.stringify(r)); inv(w, 'devolución contado');
});
paso('cancelacion anticipada', () => {
  const w = mundo(); const { c } = credito(w, 1000000, 200000, 200000, 5); w.reloj('2026-12-01T10:00:00');
  w.op('registrarCobro', { id_credito: c.id_credito, monto_recibido: 200000, medio: 'Efectivo' });
  const r = w.op('cancelarAnticipado', { id_credito: c.id_credito, descuento: 0, medio: 'Efectivo', version: credV(w, c.id_credito) }); ok(r.paga > 0, 'cancelación: ' + JSON.stringify(r));
  ok(w.filas('Creditos')[0].estado === 'Cancelado anticipadamente', 'estado'); inv(w, 'cancelación anticipada');
});
paso('condonar', () => {
  const w = mundo(); const { c } = credito(w, 1000000, 200000, 200000, 5); w.reloj('2026-12-01T10:00:00');
  w.op('registrarCobro', { id_credito: c.id_credito, monto_recibido: 200000, medio: 'Efectivo' });
  w.op('condonarCredito', { id_credito: c.id_credito, motivo: 'situación excepcional del cliente', version: credV(w, c.id_credito) }); inv(w, 'condonar');
});
paso('incobrable y recuperacion', () => {
  const w = mundo(); const { c, eq } = credito(w, 1000000, 200000, 200000, 5, 600000); w.reloj('2026-12-01T10:00:00');
  w.op('registrarCobro', { id_credito: c.id_credito, monto_recibido: 200000, medio: 'Efectivo' }); w.reloj('2027-08-01T10:00:00');
  const i = w.op('marcarIncobrable', { id_credito: c.id_credito, motivo: 'no responde hace meses', version: credV(w, c.id_credito) }); inv(w, 'incobrable');
  const r = w.op('recuperarEquipo', { id_credito: c.id_credito, motivo: 'el cliente entregó el equipo', valor_ingreso: 300000, estimacion_venta: 500000, motivo_valoracion: 'cotización de mercado local', version: credV(w, c.id_credito) });
  ok(r.id_unidad_nueva, 'unidad nueva: ' + JSON.stringify(r)); inv(w, 'recuperación');
});
paso('reversa y saldo a favor', () => {
  const w = mundo(); const { c } = credito(w, 600000, 100000, 250000, 2); w.reloj('2026-12-01T10:00:00');
  const cb = w.op('registrarCobro', { id_credito: c.id_credito, monto_recibido: 300000, medio: 'Efectivo' });
  w.reloj('2026-12-02T10:00:00');
  const cb2 = w.op('registrarCobro', { id_credito: c.id_credito, monto_recibido: 700000, medio: 'Efectivo', confirmar_duplicado: true }).saldo_favor_generado;
  ok(cb2 > 0, 'sobrepago genera saldo a favor: ' + cb2); inv(w, 'con saldo a favor');
  w.op('devolverSaldoAFavor', { id_cliente: w.cliCredito, monto: cb2, medio: 'Efectivo' }); inv(w, 'saldo devuelto');
});
paso('invariantes y cierre global', () => {
  const w = mundo(); const eq = w.equipoPublicado(100000, 200000); w.op('registrarVenta', { id_equipo: eq, id_cliente: w.cli, precio_venta: 200000, canal_venta: 'Tienda física', medio: 'Efectivo', version: w.ver(eq) });
  w.reloj('2026-12-03T10:00:00'); const c = w.op('cerrarMes', { mes: '2026-11', dinero_contado: w.disponible() + 5000, medio_ajuste: 'Efectivo', motivo_ajuste: 'faltó anotar un vuelto' });
  ok(c.ajuste_caja === 5000, 'ajuste de caja'); inv(w, 'cierre con ajuste');
  const bloq = w.run("Invariantes.bloquear('EQ:EQ-001','prueba'), 1"); 
  let rech = false; try { w.op('transicionarEquipo', { id_equipo: eq, estado_nuevo: 'Entregado', comentario: 'x y z', version: 1 }); } catch (e) { rech = /bloqueado/.test(e.message); } ok(rech, 'registro bloqueado rechaza la operación');
});
console.log(oks + ' ok, ' + fallas + ' fallas');
