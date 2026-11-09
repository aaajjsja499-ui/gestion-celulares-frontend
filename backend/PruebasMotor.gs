// GESTION_CELULARES - PruebasMotor.gs (Diseno Tecnico v4.2, Seccion 7.5 y Anexo A)
// Casos de aceptacion del motor financiero como pruebas automaticas.
// ejecutarCasosAceptacion() es de solo lectura: no toca ninguna hoja.
// Regla de entrega: ninguna entrega que toque Motor.gs se da por buena si verde != true.
function ejecutarCasosAceptacion() {
  const LOG = [];
  const consola = { log: function () { LOG.push(Array.prototype.slice.call(arguments).join(' ')); } };
  const IDS = ['1','2','3','4','5','6','6bis','7','8a','8b','9','10','11','12','13',
 'N1','N1b','N2','N3','N4','N5','N6','N7','N8','N9','N10','N11','N12',
 'N13','N14','N15','N16','N17','N18','N19','N20','N21','N22','N23','N24','N25','N26','N27','N28','N29','N30','N31','N32','N33','N34','N35','N36','N37'];
  let ok = 0, bad = 0; const cubiertos = new Set(); let actual = null;
  const caso = (id, f) => { if (!IDS.includes(id)) throw new Error('ID fuera de lista: ' + id); cubiertos.add(id); actual = id; f(); };
  const eq = (n, a, b) => { const A = JSON.stringify(a), B = JSON.stringify(b); if (A === B) { ok++; consola.log('OK  ', actual, n); } else { bad++; consola.log('FALLA', actual, n, '\n  obtenido', A, '\n  esperado', B); } };
  const thr = (n, f) => { try { f(); bad++; consola.log('FALLA', actual, n, '(no lanzo)'); } catch (e) { ok++; consola.log('OK  ', actual, n, '->', e.message); } };
  const nuevo = (precio, entrega, cuota, n) => M.abrirCredito({ precio, entrega, cuota, n });
  const vend = (id, C, P) => { const u = new M.Unidad(id, C); u.estado = 'vivo'; u.cobradoPrecio(P, 'cobros'); return u; };
  const mk = () => { const c = nuevo(100000, 20000, 30000, 3); M.cobrar(c, 'a', 30000); M.cobrar(c, 'b', 30000); return c; };
  let cr, u, f;

  caso('1', () => { cr = nuevo(100000, 0, 50000, 3); eq('inicial', [cr.interesBruto, cr.tope], [50000, 5000]);
    eq('tabla', [1, 2, 3].map((k) => { const c = M.cobrar(cr, 'c1-' + k, 50000); return [c.c, c.f, c.i]; }), [[40000, 5000, 5000], [40000, 0, 10000], [20000, 0, 30000]]);
    eq('cierra', [cr.estado, M.deudaPendiente(cr)], ['Pagado', 0]); });
  caso('2', () => { cr = nuevo(100000, 0, 35000, 3); eq('inicial', [cr.interesBruto, cr.tope], [5000, 500]);
    eq('tabla', [1, 2, 3].map((k) => { const c = M.cobrar(cr, 'c2-' + k, 35000); return [c.c, c.f, c.i]; }), [[30000, 500, 4500], [35000, 0, 0], [35000, 0, 0]]); });
  caso('3', () => { cr = nuevo(100000, 0, 50000, 3); const c = M.cobrar(cr, 'p', 10000); eq('parcial', [c.c, c.f, c.i], [8000, 1000, 1000]); });
  caso('4', () => {
    for (const [d, paga, intNeto] of [[0, 100000, 45000], [20000, 80000, 25000], [40000, 60000, 5000]]) {
      cr = nuevo(100000, 0, 50000, 3); M.cobrar(cr, 'a', 50000); const r = M.cancelarAnticipado(cr, 'b', d);
      eq('desc ' + d, [r.paga, cr.interesCobrado, cr.fondoAportado, cr.estado], [paga, intNeto, 5000, 'Cancelado anticipadamente']); }
    cr = nuevo(100000, 0, 50000, 3); M.cobrar(cr, 'a', 50000); thr('descuento > interes pendiente', () => M.cancelarAnticipado(cr, 'b', 40001));
    cr = nuevo(100000, 0, 50000, 3); M.cobrar(cr, 'a', 50000); const r = M.cancelarAnticipado(cr, 'b', 20000); eq('reparto', [r.cobro.c, r.cobro.f, r.cobro.i], [60000, 0, 20000]); });
  caso('5', () => { cr = nuevo(100000, 0, 50000, 3); M.cobrar(cr, 'a', 50000); M.cobrar(cr, 'b', 50000);
    eq('acumulado', [cr.cobradoPrecio, cr.fondoAportado, cr.interesCobrado, cr.pend.capital], [80000, 5000, 15000, 20000]);
    thr('cobro duplicado', () => M.cobrar(cr, 'a', 1));
    cr = nuevo(100000, 0, 50000, 3); const cx = M.cobrar(cr, 'x', 200000); eq('pago de mas', [cx.aplicado, cx.saldoFavor, cr.saldoFavor, cr.estado], [150000, 50000, 50000, 'Pagado']); });
  caso('6', () => { u = vend('u6', 90000, 80000); f = new M.Fondo(5000); const r = M.incobrable(u, f, 'cr6');
    eq('incobrable', [r.E, r.F, r.delta, u.G, f.saldo], [10000, 5000, -5000, -5000, 0]); });
  caso('6bis', () => { u = vend('u6b', 70000, 130000); f = new M.Fondo(5000); const r = M.incobrable(u, f, 'x'); eq('cobro>costo', [r.E, r.F, u.G, f.saldo], [0, 0, 60000, 5000]); });
  caso('7', () => { u = new M.Unidad('u7', 100000); u.estado = 'vivo'; u.cobradoPrecio(40000, 'p'); eq('vive', u.G, 0); u.cobradoPrecio(80000, 'fin'); eq('vive 80k', u.G, 0);
    const d = M.cerrarSinRecuperar(u); eq('cierre', [u.G, d], [-20000, -20000]); });
  caso('8a', () => { u = vend('u8', 90000, 80000); eq('sano', M.recuperar(u, new M.Fondo(0), 90000, 'x').total, 80000); });
  caso('8b', () => { u = vend('u8b', 90000, 80000); eq('roto', M.recuperar(u, new M.Fondo(0), 30000, 'x').total, 20000);
    thr('valor de ingreso > costo', () => { const q = vend('q', 90000, 80000); M.recuperar(q, new M.Fondo(0), 90001, 'x'); }); });
  caso('9', () => { u = new M.Unidad('u9', 70000); u.estado = 'vivo'; const as = [50000, 90000, 130000].map((p) => u.cobradoPrecio(p, 'cobro')); eq('deltas', [as, u.G], [[0, 20000, 40000], 60000]);
    M.cerrarSinRecuperar(u); eq('sin duplicar', u.G, 60000); });
  caso('10', () => { u = vend('u10', 90000, 80000); const d = u.costo('Repuesto garantia', 25000, 'g'); eq('dia gasto', [d, u.G, u.C], [0, 0, 115000]);
    M.incobrable(u, new M.Fondo(0), 'x'); eq('incobrable', u.G, -35000); });
  caso('11', () => { u = vend('u11', 90000, 120000); eq('previo', u.G, 30000); const d = u.costo('Gasto', 40000, 'g'); eq('gasto', [d, u.G], [-30000, 0]);
    M.cerrarSinRecuperar(u); eq('cierre', u.G, -10000); });
  caso('12', () => { u = vend('u12', 90000, 120000); u.costo('Gasto', 40000, 'g'); const d = u.costo('Devolucion repuesto', -25000, 'dev'); eq('dev repuesto', [d, u.C, u.G], [15000, 105000, 15000]); });
  caso('13', () => { u = vend('u13', 90000, 80000); u.costo('Repuesto', 25000, 'p'); eq('antes', [u.C, u.G], [115000, 0]); eq('recuperar', M.recuperar(u, new M.Fondo(0), 90000, 'x').total, 55000); });

  caso('N1', () => { u = vend('n1', 90000, 80000); f = new M.Fondo(5000); const i = M.incobrable(u, f, 'cr'); eq('incobrable', [i.F, u.G, f.saldo], [5000, -5000, 0]);
    const rr = M.recuperar(u, f, 60000, 'cr', { F: 5000 }); eq('recuperado', [rr.E, rr.F, u.G, f.saldo], [0, 0, 50000, 5000]); eq('P+V-C+F', u.G, 80000 + 60000 - 90000); });
  caso('N1b', () => { u = vend('n1b', 90000, 40000); f = new M.Fondo(8000); const j = M.incobrable(u, f, 'cr'); eq('incobrable', [j.E, j.F, u.G, f.saldo], [50000, 8000, -42000, 0]);
    const k = M.recuperar(u, f, 30000, 'cr', { F: 8000 }); eq('recuperado', [k.E, k.F, u.G, f.saldo], [20000, 8000, -12000, 0]); eq('P+V-C+F', u.G, 40000 + 30000 - 90000 + 8000); });
  // Devolucion total (N2): valores ABSOLUTOS fijados a mano, no autorreferentes
  caso('N2', () => { cr = mk(); eq('inicial', [cr.capitalFin, cr.interesBruto, cr.tope], [80000, 10000, 1000]);
    f = new M.Fondo(cr.fondoAportado); u = vend('n2', 50000, cr.cobradoPrecio); eq('ganancia antes', u.G, 20000);
    const d = M.devolver(cr, u, f, { reembolso: 80000, ref: 'dev1' });
    eq('revierte', [d.rev.c + d.rev.entrega, d.rev.f, d.rev.i], [70000, 1000, 9000]);
    eq('retenido y daños', [d.retenido, d.danosRetenidos, u.G, cr.estado, f.saldo], [0, 0, 0, 'Anulado', 0]);
    eq('caches netos', [cr.interesCobrado, cr.fondoAportado, cr.cobradoPrecio], [0, 0, 0]);
    eq('netos desde libros = caches', M.netos(cr), { cobradoPrecio: cr.cobradoPrecio, interesCobrado: cr.interesCobrado, fondoAportado: cr.fondoAportado }); });
  caso('N3', () => { cr = mk(); f = new M.Fondo(cr.fondoAportado); u = vend('n3', 50000, cr.cobradoPrecio);
    const d = M.devolver(cr, u, f, { reembolso: 50000, ref: 'dev3' });
    eq('revierte', [d.rev.c, d.rev.f, d.rev.i, d.rev.entrega], [42000, 666, 7334, 0]);
    eq('retenido', d.retenido, 30000); eq('daños', d.danosRetenidos, 28000);
    eq('caja = fondo+interes+danos', d.danosRetenidos + cr.interesCobrado + cr.fondoAportado, d.retenido);
    eq('netos = caches', M.netos(cr), { cobradoPrecio: cr.cobradoPrecio, interesCobrado: cr.interesCobrado, fondoAportado: cr.fondoAportado }); });
  caso('N4', () => { cr = nuevo(100000, 20000, 30000, 3); ['a', 'b', 'c'].forEach((k) => M.cobrar(cr, k, 30000));
    eq('pagado', [cr.estado, cr.cobradoPrecio, cr.interesCobrado, cr.fondoAportado], ['Pagado', 100000, 9000, 1000]);
    f = new M.Fondo(1000); u = vend('n4', 60000, cr.cobradoPrecio); eq('ganancia antes', u.G, 40000);
    const d = M.devolver(cr, u, f, { reembolso: 110000, ref: 'dev12' });
    eq('devolucion', [d.rev.c + d.rev.entrega, d.rev.f, d.rev.i, d.danosRetenidos, u.G, f.saldo, cr.estado, cr.interesCobrado], [100000, 1000, 9000, 0, 0, 0, 'Anulado', 0]); });
  // N5: faltante de fondo NO va a Equipos
  caso('N5', () => { cr = mk(); f = new M.Fondo(0); u = vend('n5', 50000, cr.cobradoPrecio);
    const d = M.devolver(cr, u, f, { reembolso: 80000, ref: 'd5' });
    eq('fondo no negativo; faltante informativo; Equipos 0', [f.saldo, d.fSale, d.faltanteFondo, u.G], [0, 0, 1000, 0]); });
  caso('N6', () => { cr = nuevo(100000, 0, 50000, 3); M.cobrar(cr, 'a', 50000); u = vend('n6', 70000, cr.cobradoPrecio); f = new M.Fondo(cr.fondoAportado);
    cr.estado = 'Condonado'; M.cerrarSinRecuperar(u); eq('condonado', u.G, -30000);
    M.devolver(cr, u, f, { reembolso: 50000, ref: 'd6' }); eq('anulado', [u.G, cr.estado, f.saldo, cr.interesCobrado], [0, 'Anulado', 0, 0]); });
  caso('N7', () => { u = new M.Unidad('n7', 60000); eq('costo sobre unidad sin vender', [u.costo('Repuesto', 5000, 'r'), u.C, u.G], [0, 65000, 0]); });
  caso('N8', () => { const os = M.ordenServicio({ cobro: 0, repuestos: 15000, tarifa: 30000 }); eq('cancelada con tarifa', os.ganancia, -45000);
    const o2 = M.ordenServicio({ cobro: 0, repuestos: 15000, tarifa: 0 }); eq('cancelada tarifa parcial 0', o2.ganancia, -15000); });
  caso('N9', () => { eq('entregada', M.ordenServicio({ cobro: 120000, repuestos: 30000, tarifa: 40000 }).ganancia, 50000); });
  caso('N10', () => { const ct = new M.CostosTecnico(); ct.devengar('2026-10', 40000, 'o1'); ct.devengar('2026-10', 30000, 'o2');
    eq('devengado', ct.saldoAPagar(), 70000); ct.liquidar('L1'); eq('incluido', ct.saldoAPagar(), 70000); ct.pagar('L1'); eq('pagado', ct.saldoAPagar(), 0);
    eq('capital libre', M.capitalLibre({ dineroDisponible: 1000000, saldosAFavor: 50000, tecnicoDevengadoImpago: 70000 }), 880000); });
  caso('N11', () => { const p1 = M.pagar(1, { capital: 1e6, fondo: 5000, interes: 45000 }), p2 = M.pagar(49999, { capital: 1e6, fondo: 5000 - p1.f, interes: 45000 }), p3 = M.pagar(50000, { capital: 1e6, fondo: 5000, interes: 45000 });
    eq('truncado', [p1.f + p2.f, p3.f], [4999, 5000]); });
  caso('N12', () => { eq('remanente fondo', M.pagar(90, { capital: 0, fondo: 30, interes: 60 }), { c: 0, f: 30, i: 60, sobrante: 0 });
    // barrido exhaustivo de pendientes chicos (uno, dos o tres componentes) y todos los pagos hasta la deuda
    let malos = 0, total = 0;
    for (let c = 0; c <= 12; c++) for (let f = 0; f <= 6; f++) for (let i = 0; i <= 12; i++) { const deuda = c + f + i; for (let p = 1; p <= deuda; p++) { total++; const r = M.pagar(p, { capital: c, fondo: f, interes: i });
      if (r.c < 0 || r.f < 0 || r.i < 0 || r.c > c || r.f > f || r.i > i || r.c + r.f + r.i + r.sobrante !== p || r.sobrante !== 0) malos++; } }
    eq('barrido pagar() (' + total + ' combinaciones)', malos, 0); });
  // ---- Casos agregados en v3.1
  caso('N13', () => { u = vend('n13', 90000, 80000); f = new M.Fondo(5000); M.incobrable(u, f, 'cr'); eq('antes', u.G, -5000);
    const d = u.costo('Ajuste', 1, 'x'); eq('un costo posterior conserva el fondo', [d, u.G], [-1, -5001]); });
  caso('N14', () => { u = vend('n14', 90000, 80000); f = new M.Fondo(5000); M.incobrable(u, f, 'cr'); M.recuperar(u, f, 60000, 'cr', { F: 5000 }); eq('antes', u.G, 50000);
    eq('costo posterior a recuperado', [u.costo('Ajuste', 1000, 'x'), u.G], [-1000, 49000]); });
  caso('N15', () => { u = new M.Unidad('n15', 100000); eq('perdida de baja con rescate', M.darDeBaja(u, { rescate: 30000 }), 70000); eq('Equipos no se toca', u.G, 0);
    thr('no se da de baja una unidad vendida', () => { const v = vend('v', 100000, 50000); M.darDeBaja(v); }); });
  caso('N16', () => { cr = nuevo(100000, 0, 50000, 3); M.cobrar(cr, 'a', 50000); M.cobrar(cr, 'b', 50000); f = new M.Fondo(cr.fondoAportado);
    thr('solo el ultimo cobro', () => M.reversarCobro(cr, f, 'a', 'rev'));
    const r = M.reversarCobro(cr, f, 'b', 'rev'); eq('revierte', [cr.pend.capital, cr.pend.fondo, cr.pend.interes, cr.estado, r.faltanteFondo], [60000, 0, 40000, 'Abierto', 0]);
    eq('netos = caches', M.netos(cr), { cobradoPrecio: cr.cobradoPrecio, interesCobrado: cr.interesCobrado, fondoAportado: cr.fondoAportado }); });
  caso('N17', () => { cr = nuevo(100000, 0, 50000, 3); M.cobrar(cr, 'x', 200000); f = new M.Fondo(cr.fondoAportado);
    eq('saldo a favor', cr.saldoFavor, 50000); const sf = cr.saldoFavor; M.reversarCobro(cr, f, 'x', 'rev'); eq('reversa baja el saldo a favor', [cr.saldoFavor, sf - cr.saldoFavor], [0, 50000]); });
  caso('N18', () => { cr = mk(); f = new M.Fondo(cr.fondoAportado); u = vend('n18', 50000, cr.cobradoPrecio); M.devolver(cr, u, f, { reembolso: 80000, ref: 'd' });
    thr('cobro en credito Anulado', () => M.cobrar(cr, 'z', 30000));
    const c2 = nuevo(100000, 0, 50000, 3); c2.estado = 'Incobrable'; thr('cobro en credito Incobrable', () => M.cobrar(c2, 'z', 1)); });
  caso('N19', () => { eq('ajuste de caja primero', M.cerrarMes({ dineroLibro: 1000000, dineroContado: 990000 }), { dineroAntesAjuste: 1000000, ajusteCaja: -10000, dineroFinal: 990000 });
    eq('sin conteo', M.cerrarMes({ dineroLibro: 1000000 }), { dineroAntesAjuste: 1000000, ajusteCaja: 0, dineroFinal: 1000000 }); });
  caso('N20', () => { const l = M.costoLinea(100000, 3); eq('total manda', [l.total, l.unitarioInformativo, l.unitarioInformativo * 3], [100000, 33333, 99999]); });
  // N21: recuperacion reintentada con el PAYLOAD ORIGINAL (mismo evento, mismo F1): el fondo no se repone dos veces
  caso('N21', () => { u = vend('n21', 90000, 80000); f = new M.Fondo(5000); M.incobrable(u, f, 'cr'); eq('tras incobrable', [f.saldo, u.G], [0, -5000]);
    M.recuperar(u, f, 60000, 'rec1', { F: 5000 }); eq('primera ejecucion', [f.saldo, u.F, u.G], [5000, 0, 50000]);
    const r2 = M.recuperar(u, f, 60000, 'rec1', { F: 5000 }); /* identico payload: reintento real */
    eq('reintento identico no mueve fondo ni ganancia', [f.saldo, u.G, r2.delta, r2.repetido], [5000, 50000, 0, true]);
    const r3 = M.incobrable(vend('n21b', 90000, 80000), new M.Fondo(5000), 'x'); eq('incobrable tambien es idempotente', r3.F, 5000);
    const uu = vend('n21c', 90000, 80000), ff = new M.Fondo(5000); M.incobrable(uu, ff, 'y'); const rep = M.incobrable(uu, ff, 'y'); eq('incobrable repetido', [ff.saldo, uu.G, rep.repetido], [0, -5000, true]); });
  // N22: ejecutar devolucion y luego conciliar: ganancia, fondo, netos coherentes con libro
  caso('N22', () => { cr = mk(); f = new M.Fondo(cr.fondoAportado); u = vend('n22', 50000, cr.cobradoPrecio);
    M.devolver(cr, u, f, { reembolso: 50000, ref: 'd' }); const n = M.netos(cr);
    eq('invariante 2 (netos = caches)', n, { cobradoPrecio: cr.cobradoPrecio, interesCobrado: cr.interesCobrado, fondoAportado: cr.fondoAportado });
    eq('fondo = aportado neto - usado', f.saldo, cr.fondoAportado - 0); });

  const OP = () => new M.Operaciones();
  caso('N23', () => { const o = OP(); cr = nuevo(100000, 0, 50000, 3); cr.estado = 'Anulado';
    thr('validacion rechaza', () => o.ejecutar({ id: 'a', registro: 'CRE1', payload: { monto: 50000 }, validar: () => M.cobrar(cr, 'zz', 1), escribir: () => 'x' }));
    eq('no queda fila Iniciada ni reserva', [o.filas.size, o.reservas.size], [0, 0]);
    cr.estado = 'Abierto';
    eq('el reintento con el mismo id se valida como operacion nueva y entra', o.ejecutar({ id: 'a', registro: 'CRE1', payload: { monto: 50000 }, validar: () => {}, escribir: (p, w) => { w(1, p.monto); return 'ok'; } }), 'ok'); });
  caso('N24', () => { const o = OP(); let corte = true; const run = (payload) => o.ejecutar({ id: 'b', registro: 'CRE2', payload, validar: () => {}, escribir: (p, w) => { w(1, 'cobro ' + p.monto); if (corte) throw new Error('corte'); w(2, 'cuota'); w(3, 'fondo'); return 'ok'; } });
    thr('primera ejecucion se corta', () => run({ monto: 50000 }));
    eq('queda Iniciada con 1 fila y el registro reservado', [o.filas.get('b').estado, o.libro.length, o.reservas.get('CRE2')], ['Iniciada', 1, 'b']);
    corte = false; const r = run({ monto: 99999 }); /* el cliente reintenta con un payload cualquiera: manda el guardado */
    eq('reanuda con el payload guardado, sin duplicar', [r, o.libro.length, o.libro[0].dato, o.filas.get('b').estado, o.reservas.size], ['ok', 3, 'cobro 50000', 'Completa', 0]);
    eq('tercer intento devuelve el resultado guardado', run({ monto: 1 }), 'ok'); });
  caso('N25', () => { const o = OP(); let corte = true;
    thr('corte', () => o.ejecutar({ id: 'c', registro: 'CRE3', payload: {}, validar: () => {}, escribir: (p, w) => { w(1, 'x'); throw new Error('corte'); } }));
    thr('otra operacion sobre el mismo registro mientras hay una pendiente', () => o.ejecutar({ id: 'd', registro: 'CRE3', payload: {}, validar: () => {}, escribir: () => 'y' }));
    eq('otro registro no se afecta', o.ejecutar({ id: 'e', registro: 'CRE9', payload: {}, validar: () => {}, escribir: () => 'z' }), 'z'); });
  caso('N26', () => { const o = OP(); o.bloquearRegistro('CRE4');
    thr('una operacion financiera comun queda bloqueada', () => o.ejecutar({ id: 'f', registro: 'CRE4', payload: {}, validar: () => {}, escribir: () => 'x' }));
    const r = o.ejecutar({ id: 'g', registro: 'CRE4', payload: {}, validar: () => {}, escribir: () => 'ajuste', correctivo: true, idDecision: 'DEC-1', verificar: () => [] });
    eq('el ajuste que corrige la diferencia SI pasa y, con el invariante en verde, levanta el bloqueo', [r.resultado, r.diferenciaResuelta, o.bloqueados.size], ['ajuste', true, 0]);
    eq('resuelta la diferencia, se opera normal', o.ejecutar({ id: 'h', registro: 'CRE4', payload: {}, validar: () => {}, escribir: () => 'ok' }), 'ok'); });
  caso('N27', () => { cr = nuevo(100000, 0, 50000, 3); f = new M.Fondo(0); M.cobrar(cr, 'a', 50000); const h = M.huellaEstado(cr, f);
    eq('sin cambios, la confirmacion pasa', (() => { M.confirmarConHuella(h, cr, f); return 'ok'; })(), 'ok');
    M.cobrar(cr, 'b', 50000); thr('otro cobro cambio el estado: hay que simular de nuevo', () => M.confirmarConHuella(h, cr, f)); });
  caso('N28', () => { const rec = []; const hu = 'ajuste|U1|25000';
    eq('primer ajuste', M.guardiaDuplicado(rec, hu, 0), true);
    thr('mismo ajuste en 60 s con otro id: posible duplicado', () => M.guardiaDuplicado(rec, hu, 60));
    eq('confirmado por la persona', M.guardiaDuplicado(rec, hu, 61, { confirmar: true }), true);
    eq('pasados los 2 minutos no molesta', M.guardiaDuplicado([{ huella: hu, t: 0 }], hu, 500), true);
    eq('otro importe no molesta', M.guardiaDuplicado(rec, 'ajuste|U1|30000', 62), true); });


  // ---- v3.3 (ronda 3): casos N29 a N33
  // N29: recuperacion DIRECTA (sin incobrable previo) tambien es idempotente por evento
  caso('N29', () => { u = vend('n29', 90000, 80000); f = new M.Fondo(5000);
    const r1 = M.recuperar(u, f, 60000, 'rec-directa'); eq('primera ejecucion', [r1.E, r1.F, f.saldo, u.G], [0, 0, 5000, 50000]);
    const u2 = vend('n29b', 90000, 80000), f2 = new M.Fondo(5000); const a = M.recuperar(u2, f2, 20000, 'rd'); /* E=0 -> F=0 */
    const u3 = vend('n29c', 100000, 80000), f3 = new M.Fondo(5000); const c1 = M.recuperar(u3, f3, 10000, 'rd'); eq('con exposicion: toma del fondo', [c1.E, c1.F, f3.saldo, u3.G], [10000, 5000, 0, -5000]); /* G = P+V+F-C = 80.000+10.000+5.000-100.000 */
    const c2 = M.recuperar(u3, f3, 10000, 'rd'); eq('reintento con el mismo ref no mueve nada', [f3.saldo, u3.G, c2.delta, c2.repetido], [0, c1.total, 0, true]);
    eq('sin efecto colateral en la otra unidad', [a.F, f2.saldo], [0, 5000]); });
  // N30: la huella de incobrable/recuperacion incluye costo, cobrado, ganancia, estado y fondo aplicado de la unidad
  caso('N30', () => { cr = nuevo(100000, 0, 50000, 3); const mkU = () => { const x = vend('n30', 90000, 80000); return x; };
    // sin la huella de la unidad: simulacion = 10.000 y, tras un repuesto de 25.000, el asiento real seria 25.000 y el fondo quedaria en 25.000
    const sim = (extra) => { const x = mkU(), ff = new M.Fondo(40000); M.incobrable(x, ff, 'inc'); if (extra) x.costo('Repuesto garantia', extra, 'g'); const r = M.recuperar(x, ff, 20000, 'rec', { F: 10000 }); return [r.delta, ff.saldo]; };
    eq('simulado sin repuesto', sim(0), [10000, 40000]); eq('real con repuesto cargado en el medio (lo que se evita)', sim(25000), [25000, 25000]);
    const x = mkU(), ff = new M.Fondo(40000); M.incobrable(x, ff, 'inc'); const h = M.huellaEstado(cr, ff, x);
    eq('sin cambios la confirmacion pasa', (() => { M.confirmarConHuella(h, cr, ff, x); return 'ok'; })(), 'ok');
    x.costo('Repuesto garantia', 25000, 'g'); thr('un costo nuevo cambia la huella: hay que simular de nuevo', () => M.confirmarConHuella(h, cr, ff, x));
    const y = mkU(), fy = new M.Fondo(40000); M.incobrable(y, fy, 'inc'); const h2 = M.huellaEstado(cr, fy, y); y.cobradoPrecio(85000, 'cobro tardio'); thr('un cambio del cobrado tambien', () => M.confirmarConHuella(h2, cr, fy, y)); });
  // N31: operacion interrumpida: listar, reanudar, abandonar (sin deshacer filas) y diferencia posterior
  caso('N31', () => { const o = OP(); const corta = (id, reg) => thr('corte ' + id, () => o.ejecutar({ id, registro: reg, payload: { monto: 50000 }, validar: () => {}, escribir: (p, w) => { w(1, 'cobro'); throw new Error('corte'); } }));
    corta('p1', 'CRE7'); eq('aparece en la lista de pendientes', o.listarPendientes().map((x) => [x.id, x.registro]), [['p1', 'CRE7']]);
    thr('abandonar sin motivo', () => o.resolverInterrumpida({ id: 'p1', accion: 'abandonar', idDecision: 'D' }));
    thr('abandonar sin id_decision', () => o.resolverInterrumpida({ id: 'p1', accion: 'abandonar', motivo: 'x' }));
    const rs = o.resolverInterrumpida({ id: 'p1', accion: 'abandonar', motivo: 'perdi el id en el telefono', idDecision: 'D-9', verificar: () => ['invariante 2: cobrado sin aplicar a cuotas'] });
    eq('abandonar: no deshace la fila escrita, libera la reserva y deja el registro bloqueado por la diferencia', [rs.abandonada, rs.filasEscritasQuedan, o.reservas.size, o.bloqueados.has('CRE7'), o.listarPendientes().length], [true, 1, 0, true, 0]);
    thr('una operacion comun sigue bloqueada por la diferencia', () => o.ejecutar({ id: 'q', registro: 'CRE7', payload: {}, validar: () => {}, escribir: () => 'x' }));
    const ra = o.ejecutar({ id: 'aj', registro: 'CRE7', payload: {}, validar: () => {}, escribir: () => 'ajuste', correctivo: true, idDecision: 'D-10', verificar: () => [] });
    eq('el ajuste correctivo en verde la libera', [ra.diferenciaResuelta, o.bloqueados.has('CRE7')], [true, false]);
    thr('la operacion abandonada ya no se puede resolver otra vez', () => o.resolverInterrumpida({ id: 'p1', accion: 'reanudar', escribir: () => 'x' }));
    corta('p2', 'CRE8'); const rr = o.resolverInterrumpida({ id: 'p2', accion: 'reanudar', escribir: (p, w) => { w(1, 'cobro'); w(2, 'cuota'); return 'ok'; } });
    eq('reanudar: completa con el payload guardado, sin duplicar la fila 1', [rr, o.libro.filter((x) => x.k.startsWith('p2#')).length, o.reservas.size, o.filas.get('p2').estado], ['ok', 2, 0, 'Completa']);
    corta('p3', 'CRE9'); const ver = o.resolverInterrumpida({ id: 'p3', accion: 'abandonar', motivo: 'lo cobre a mano y lo ajuste', idDecision: 'D-11', verificar: () => [] });
    eq('abandonar con el invariante en verde: no bloquea el registro', [ver.diferencias.length, o.bloqueados.has('CRE9'), o.reservas.size], [0, false, 0]); });
  // N32: ajuste correctivo: exige id_decision y solo levanta el bloqueo si el invariante vuelve a verde
  caso('N32', () => { const o = OP(); o.bloquearRegistro('CRE5');
    thr('sin id_decision no entra', () => o.ejecutar({ id: 'c1', registro: 'CRE5', payload: {}, validar: () => {}, escribir: () => 'a', correctivo: true, verificar: () => [] }));
    eq('no quedo fila ni reserva', [o.filas.size, o.reservas.size], [0, 0]);
    const r = o.ejecutar({ id: 'c2', registro: 'CRE5', payload: {}, validar: () => {}, escribir: (p, w) => { w(1, 'ajuste de 1 Gs'); return 'a'; }, correctivo: true, idDecision: 'DEC-2', verificar: () => ['invariante 2: diferencia 50000'] });
    eq('ajuste inutil: la fila se escribe pero la diferencia no se resolvio', [r.diferenciaResuelta, r.diferencias.length, o.bloqueados.has('CRE5'), o.libro.length], [false, 1, true, 1]);
    thr('el registro sigue bloqueado para operaciones comunes', () => o.ejecutar({ id: 'c3', registro: 'CRE5', payload: {}, validar: () => {}, escribir: () => 'x' }));
    const r2 = o.ejecutar({ id: 'c4', registro: 'CRE5', payload: {}, validar: () => {}, escribir: () => 'a2', correctivo: true, idDecision: 'DEC-3', verificar: () => [] });
    eq('el segundo ajuste deja el invariante en verde y levanta el bloqueo', [r2.diferenciaResuelta, o.bloqueados.has('CRE5')], [true, false]); });
  // N33: la guardia de doble toque va DESPUES de la idempotencia; el correctivo se distingue en la huella pero tambien pasa por la guardia
  caso('N33', () => { const o = OP(); const hu = M.huellaNegocio({ operacion: 'ajuste', registro: 'U1', tipo: 'Repuesto', monto: 25000 });
    const run = (id, ahora, extra = {}) => o.ejecutar({ id, registro: 'U1', payload: {}, validar: () => {}, escribir: () => 'ok-' + id, guardia: { huella: hu, ahoraSeg: ahora, ...extra } });
    eq('primer ajuste', run('a1', 0), 'ok-a1');
    eq('reintento con el MISMO id (mala senal) devuelve el resultado guardado sin pasar por la guardia', run('a1', 10), 'ok-a1');
    thr('otro id, misma huella, 60 s despues: posible duplicado', () => run('a2', 60));
    eq('confirmado por la persona', run('a2', 61, { confirmar: true }), 'ok-a2');
    eq('pasados los 2 minutos no molesta', run('a3', 400), 'ok-a3');
    const hc = M.huellaNegocio({ operacion: 'ajuste', registro: 'U1', tipo: 'Repuesto', monto: 25000, correctivo: true });
    eq('un correctivo no se confunde con un ajuste ordinario', hc !== hu, true);
    const o2 = OP(); const rc = (id, t, conf) => o2.ejecutar({ id, registro: 'CRE6', payload: {}, validar: () => {}, escribir: () => 'ok', correctivo: true, idDecision: 'D', verificar: () => [], guardia: { huella: hc, ahoraSeg: t, confirmar: conf } });
    rc('k1', 0); thr('dos correctivos iguales en 30 s tambien piden confirmacion', () => rc('k2', 30));
    const o3 = OP(); thr('la validacion falla: no se anota la huella', () => o3.ejecutar({ id: 'v1', registro: 'U2', payload: {}, validar: () => { throw new Error('no'); }, escribir: () => 'x', guardia: { huella: hu, ahoraSeg: 0 } }));
    eq('y el reintento legitimo no se toma por duplicado', o3.ejecutar({ id: 'v2', registro: 'U2', payload: {}, validar: () => {}, escribir: () => 'ok', guardia: { huella: hu, ahoraSeg: 5 } }), 'ok'); });


  // ---- v3.4 (ronda 4): casos N34 y N35
  // N34: el ajuste correctivo corre TODOS los invariantes del tipo de registro; verificarInvariantes desmarca un registro que vuelve a verde
  caso('N34', () => { const INV = M.INVARIANTES_POR_REGISTRO;
    eq('todo tipo de registro incluye el control de dinero (7)', Object.values(INV).every((l) => l.includes(7)), true);
    eq('credito: 1, 2, 3, 6 y 7; unidad: 5, 6 y 7', [INV.credito, INV.unidad], [[1, 2, 3, 6, 7], [5, 6, 7]]);
    const rojos = new Set([2, 7]); const verifCred = () => INV.credito.filter((i) => rojos.has(i)).map((i) => 'invariante ' + i);
    const o = OP(); o.bloquearRegistro('CRE1');
    rojos.delete(2); const r1 = o.ejecutar({ id: 'k1', registro: 'CRE1', payload: {}, validar: () => {}, escribir: () => 'a', correctivo: true, idDecision: 'D1', verificar: verifCred });
    eq('el ajuste corrigio el 2 pero el 7 sigue en rojo: el bloqueo persiste', [r1.diferenciaResuelta, r1.diferencias, o.bloqueados.has('CRE1')], [false, ['invariante 7'], true]);
    rojos.delete(7); const r2 = o.ejecutar({ id: 'k2', registro: 'CRE1', payload: {}, validar: () => {}, escribir: () => 'b', correctivo: true, idDecision: 'D2', verificar: verifCred });
    eq('con todos en verde se levanta', [r2.diferenciaResuelta, o.bloqueados.has('CRE1')], [true, false]);
    const o2 = OP(); o2.bloquearRegistro('CRE2');
    eq('verificarInvariantes con una diferencia: sigue bloqueado', o2.revisar('CRE2', () => ['invariante 2']).desbloqueado, false);
    eq('verificarInvariantes con todo en verde (se corrigio la hoja a mano): se desmarca', [o2.revisar('CRE2', () => []).desbloqueado, o2.bloqueados.has('CRE2')], [true, false]); });
  // N35: la reserva abarca todos los registros que la operacion escribe (credito, unidad, cliente)
  caso('N35', () => { const o = OP(); const regs = ['CRE1', 'U1', 'CLI1'];
    thr('devolucion cortada', () => o.ejecutar({ id: 'dv', registro: regs, payload: { reembolso: 80000 }, validar: () => {}, escribir: (p, w) => { w(1, 'cobro reversa'); throw new Error('corte'); } }));
    thr('un ajuste de costo sobre la UNIDAD mientras la devolucion esta a medias', () => o.ejecutar({ id: 'aj', registro: 'U1', payload: {}, validar: () => {}, escribir: () => 'x' }));
    eq('otra unidad no se afecta', o.ejecutar({ id: 'aj2', registro: 'U2', payload: {}, validar: () => {}, escribir: () => 'y' }), 'y');
    eq('la lista de pendientes muestra los tres registros', o.listarPendientes()[0].registros, regs);
    const rr = o.resolverInterrumpida({ id: 'dv', accion: 'reanudar', escribir: (p, w) => { w(1, 'cobro reversa'); w(2, 'devolucion'); return 'ok'; } });
    eq('reanudar completa y libera los tres registros', [rr, o.reservas.size, o.libro.filter((x) => x.k.startsWith('dv#')).length], ['ok', 0, 2]);
    thr('otra devolucion cortada', () => o.ejecutar({ id: 'dv2', registro: ['CRE5', 'U5', 'CLI5'], payload: {}, validar: () => {}, escribir: (p, w) => { w(1, 'x'); throw new Error('corte'); } }));
    const ab = o.resolverInterrumpida({ id: 'dv2', accion: 'abandonar', motivo: 'lo repito', idDecision: 'D-7', verificar: () => ['invariante 6'] });
    eq('abandonar con diferencia bloquea los tres registros', [ab.abandonada, ['CRE5', 'U5', 'CLI5'].every((r) => o.bloqueados.has(r)), o.reservas.size], [true, true, 0]); });

  // ---- v3.6: servicio tecnico con anticipos
  // N36: orden entregada con anticipo: el cobro_final es el precio total; entra solo el saldo; la ganancia no se duplica
  caso('N36', () => { const o = M.ordenServicio({ cobro: 120000, repuestos: 30000, tarifa: 40000 }); const c = M.cobroOrden({ cobro_final: 120000, anticipos: 50000 });
    eq('asiento de Servicio tecnico = precio total; saldo que entra al entregar; sin devolucion', [c.asiento, c.saldo, c.devolucion], [120000, 70000, 0]);
    eq('el dinero de la orden (anticipo + saldo) es el precio total, no 170.000', c.dineroDeLaOrden, 120000);
    eq('la ganancia de la orden es la misma que sin anticipo (N9)', o.ganancia, 50000);
    eq('sin anticipo el comportamiento anterior no cambia', M.cobroOrden({ cobro_final: 120000, anticipos: 0 }).saldo, 120000); });
  // N37: orden cancelada con anticipo: se retiene lo fijado por el Administrador y se devuelve el resto
  caso('N37', () => { const c = M.cobroOrden({ cobro_final: 20000, anticipos: 50000 }); const o = M.ordenServicio({ cobro: 20000, repuestos: 15000, tarifa: 30000 });
    eq('se retienen 20.000: asiento 20.000, no entra saldo, se devuelven 30.000', [c.asiento, c.saldo, c.devolucion], [20000, 0, 30000]);
    eq('el dinero que se queda es lo retenido', c.dineroDeLaOrden, 20000);
    eq('renglon de servicio: retenido 20.000 menos el costo 45.000 de N8', o.ganancia, -25000);
    const c0 = M.cobroOrden({ cobro_final: 0, anticipos: 50000 }); eq('sin retencion se devuelve todo el anticipo', [c0.asiento, c0.devolucion, c0.dineroDeLaOrden], [0, 50000, 0]); });

  const faltan = IDS.filter((x) => !cubiertos.has(x)); eq('META: todos los IDs cubiertos', faltan, []);
  consola.log(`\nRESULTADO: ${ok} OK, ${bad} FALLA`);
  return { ok: ok, falla: bad, verde: bad === 0, ids_cubiertos: cubiertos.size, log: LOG };

}
