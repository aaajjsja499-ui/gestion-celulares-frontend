// GESTION_CELULARES - Invariantes.gs (Diseno Tecnico 4.31 / 5.8)
// Comprobaciones que recalculan desde los libros y comparan con las cachés.
// 1 credito: pendientes y cobrado == libros | 2 credito: cuotas cubiertas == aplicaciones
// 3 credito: cuota cubierta <= monto | 5 unidad: costo_total == libro de costos
// 6 unidad: ganancia asentada == objetivo | 7 saldos no negativos (fondo, cliente, medios, stock)
// 8 cliente: cadena de saldo_posterior | 9 liquidacion: total == costos incluidos
// 11 orden: anticipos == libro de dinero | 12 dinero: suma por medios == disponible | 13 repuestos: stock == libro

var Invariantes = {
  credito: function (src, id) {
    var d = [], cr = src.get('Creditos', id); if (!cr) return d;
    var a = Contab.agregadosCredito(src, id);
    ['pendiente_capital', 'pendiente_fondo', 'pendiente_interes', 'cobrado_precio', 'interes_cobrado', 'fondo_aportado', 'descuento_total'].forEach(function (k) {
      if (Util.num(cr[k]) !== a[k]) d.push({ registro: 'CRE:' + id, inv: 1, detalle: 'invariante 1: ' + k + ' de ' + id + ' es ' + cr[k] + ' y los libros dan ' + a[k] });
    });
    var apl = {}; src.filas('Aplicaciones_Cuota').forEach(function (x) { apl[x.id_cuota] = (apl[x.id_cuota] || 0) + Util.num(x.monto); });
    src.filas('Cuotas').filter(function (q) { return q.id_credito === id; }).forEach(function (q) {
      if (Util.num(q.cubierto) !== (apl[q.id_cuota] || 0)) d.push({ registro: 'CRE:' + id, inv: 2, detalle: 'invariante 2: la cuota ' + q.id_cuota + ' tiene cubierto ' + q.cubierto + ' y las aplicaciones suman ' + (apl[q.id_cuota] || 0) });
      if (Util.num(q.cubierto) > Util.num(q.monto)) d.push({ registro: 'CRE:' + id, inv: 3, detalle: 'invariante 3: la cuota ' + q.id_cuota + ' está cubierta por encima de su monto' });
    });
    return d;
  },
  unidad: function (src, id) {
    var d = [], e = src.get('Equipos', id); if (!e) return d;
    var costos = src.filas('Costos_Unidad').filter(function (c) { return c.id_equipo === id; });
    if (costos.length && Util.num(e.costo_total) !== Contab.costoTotal(src, id)) d.push({ registro: 'EQ:' + id, inv: 5, detalle: 'invariante 5: costo_total de ' + id + ' es ' + e.costo_total + ' y el libro da ' + Contab.costoTotal(src, id) });
    var s = Contab.situacion(src, id), obj = Contab.objetivo(s);
    if (s.G !== obj) d.push({ registro: 'EQ:' + id, inv: 6, detalle: 'invariante 6: ganancia asentada de ' + id + ' es ' + s.G + ' y el objetivo es ' + obj });
    return d;
  },
  cliente: function (src, id) {
    var d = [], saldo = 0;
    src.filas('Saldo_Cliente').filter(function (m) { return m.id_cliente === id; }).forEach(function (m) {
      saldo += Util.num(m.monto);
      if (Util.num(m.saldo_posterior) !== saldo) d.push({ registro: 'CLI:' + id, inv: 8, detalle: 'invariante 8: saldo_posterior de ' + m.id_mov_saldo + ' es ' + m.saldo_posterior + ' y la cadena da ' + saldo });
      if (saldo < 0) d.push({ registro: 'CLI:' + id, inv: 7, detalle: 'invariante 7: saldo a favor negativo de ' + id });
    });
    return d;
  },
  liquidacion: function (src, id) {
    var d = [], l = src.get('Liquidaciones_Tecnico', id); if (!l) return d;
    var s = Util.suma(src.filas('Costos_Tecnico').filter(function (c) { return c.id_liquidacion === id; }), function (c) { return Util.num(c.monto); });
    if (Math.max(0, s) !== Util.num(l.total)) d.push({ registro: 'LIQ:' + id, inv: 9, detalle: 'invariante 9: total de ' + id + ' es ' + l.total + ' y los costos incluidos dan ' + Math.max(0, s) });
    return d;
  },
  orden: function (src, id) {
    var d = [], o = src.get('Ordenes_Servicio', id); if (!o) return d;
    var a = Contab.anticiposOrden(src, id);
    if (Util.num(o.anticipos_recibidos) !== a) d.push({ registro: 'ORD:' + id, inv: 11, detalle: 'invariante 11: anticipos_recibidos de ' + id + ' es ' + o.anticipos_recibidos + ' y el libro da ' + a });
    return d;
  },
  repuesto: function (src, id) {
    var d = [], r = src.get('Repuestos', id); if (!r) return d;
    var s = Contab.stockRepuesto(src, id);
    if (Util.num(r.stock_actual) !== s) d.push({ registro: 'RP:' + id, inv: 13, detalle: 'invariante 13: stock_actual de ' + id + ' es ' + r.stock_actual + ' y el libro da ' + s });
    if (s < 0) d.push({ registro: 'RP:' + id, inv: 7, detalle: 'invariante 7: stock negativo de ' + id });
    return d;
  },
  global: function (src) {
    var d = [];
    if (Contab.saldoFondo(src) < 0) d.push({ registro: 'FONDO', inv: 7, detalle: 'invariante 7: el fondo está negativo' });
    var s = Contab.saldosPorMedio(src), tot = 0, k;
    for (k in s) { tot += s[k]; if (s[k] < 0) d.push({ registro: 'CAJA', inv: 7, detalle: 'invariante 7: el medio ' + k + ' está negativo (' + s[k] + ')' }); }
    if (tot !== Contab.dineroDisponible(src)) d.push({ registro: 'CAJA', inv: 12, detalle: 'invariante 12: la suma por medios no coincide con el disponible' });
    return d;
  },
  verificarRegistros: function (regs, src) {
    src = src || FuenteDatos; var d = [];
    regs.forEach(function (r) {
      var p = r.split(':'), t = p[0], id = p.slice(1).join(':');
      var f = { CRE: Invariantes.credito, EQ: Invariantes.unidad, CLI: Invariantes.cliente, LIQ: Invariantes.liquidacion, ORD: Invariantes.orden, RP: Invariantes.repuesto }[t];
      if (f) d = d.concat(f(src, id));
    });
    return d;
  },
  verificarTodo: function (src) {
    src = src || FuenteDatos; var d = Invariantes.global(src);
    src.filas('Creditos').forEach(function (c) { d = d.concat(Invariantes.credito(src, c.id_credito)); });
    src.filas('Equipos').forEach(function (e) { d = d.concat(Invariantes.unidad(src, e.id_equipo)); });
    src.filas('Clientes').forEach(function (c) { d = d.concat(Invariantes.cliente(src, c.id_cliente)); });
    src.filas('Liquidaciones_Tecnico').forEach(function (l) { d = d.concat(Invariantes.liquidacion(src, l.id_liquidacion)); });
    src.filas('Ordenes_Servicio').forEach(function (o) { d = d.concat(Invariantes.orden(src, o.id_orden)); });
    src.filas('Repuestos').forEach(function (r) { d = d.concat(Invariantes.repuesto(src, r.id_repuesto)); });
    return d;
  },
  bloquear: function (registro, motivo) {
    var b = Datos.buscar('Registros_Bloqueados', 'registro', registro);
    if (b) Datos.actualizar('Registros_Bloqueados', b, { motivo: motivo, fecha_hora: Util.ahora(), activo: 'Sí' });
    else Datos.agregar('Registros_Bloqueados', { registro: registro, motivo: motivo, fecha_hora: Util.ahora(), activo: 'Sí' });
  },
  // Tras un ajuste correctivo: si el registro vuelve a verde se desbloquea
  revisar: function (registros) {
    var res = [];
    registros.forEach(function (r) {
      var d = Invariantes.verificarRegistros([r]);
      var b = Datos.buscar('Registros_Bloqueados', 'registro', r);
      if (d.length === 0 && b && b.activo === 'Sí') Datos.actualizar('Registros_Bloqueados', b, { activo: 'No' });
      if (d.length) res.push(d[0]);
    });
    return res;
  }
};

definir('verificarInvariantes', {
  roles: [ROL_ADMIN], lectura: true,
  leer: function () { var d = Invariantes.verificarTodo(FuenteDatos); return { ok: d.length === 0, diferencias: d, bloqueados: Datos.leer('Registros_Bloqueados').filter(function (b) { return b.activo === 'Sí'; }) }; }
});
