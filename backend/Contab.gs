// GESTION_CELULARES - Contab.gs (Diseno Tecnico, Secciones 4.17 a 4.26)
// Libros y cachés: costo unico, ganancia de equipos, fondo, saldo a favor,
// caja y costos del tecnico. Todo importe sale de Motor.gs o de sumas de
// libros; las cachés se recalculan desde los libros, nunca por incremento.
// "src" es un Planificador (ve lo ya planificado) o FuenteDatos (solo hojas).

var FuenteDatos = {
  filas: function (h) { return Datos.leer(h); },
  get: function (h, pk) { return Datos.buscar(h, PKS[h], pk); }
};

var Contab = {
  // ---------- Credito ----------
  agregadosCredito: function (src, idCredito) {
    var cr = src.get('Creditos', idCredito);
    var cob = src.filas('Cobros').filter(function (c) { return c.id_credito === idCredito; });
    var s = function (k) { return Util.suma(cob, function (c) { return Util.num(c[k]); }); };
    var devs = src.filas('Devoluciones').filter(function (d) { return d.id_credito === idCredito; });
    var entregaRev = Util.suma(devs, function (d) { return Util.num(d.revertido_entrega); });
    var desc = Util.suma(src.filas('Eventos_Credito').filter(function (e) { return e.id_credito === idCredito && e.tipo === 'Descuento'; }), function (e) { return Util.num(e.descuento); });
    var cap = s('capital'), fon = s('fondo'), int = s('interes');
    return {
      capital: cap, fondo: fon, interes: int, descuento: desc,
      cobrado_precio: Util.num(cr.entrega_inicial) - entregaRev + cap,
      interes_cobrado: int, fondo_aportado: fon, descuento_total: desc,
      pendiente_capital: Util.num(cr.capital_financiado) - cap,
      pendiente_fondo: Util.num(cr.tope_fondo) - fon,
      pendiente_interes: Util.num(cr.interes_bruto) - Util.num(cr.tope_fondo) - int - desc,
      entrega_revertida: entregaRev
    };
  },
  deuda: function (a) { return a.pendiente_capital + a.pendiente_fondo + a.pendiente_interes; },
  // Cobros vigentes: tipo Cobro sin Reversa total que los referencie
  cobrosVigentes: function (src, idCredito) {
    var todos = src.filas('Cobros').filter(function (c) { return c.id_credito === idCredito; });
    var revertidos = {};
    todos.forEach(function (c) { if (c.tipo === 'Reversa') revertidos[c.id_cobro_revertido] = true; });
    return todos.filter(function (c) { return c.tipo === 'Cobro' && !revertidos[c.id_cobro]; });
  },
  // Importe aplicado de un cobro que ya fue revertido por devoluciones (negativo en las filas)
  revertidoPorDevolucion: function (src, idCobro) {
    return -Util.suma(src.filas('Cobros').filter(function (c) { return c.tipo === 'Reversa por devolución' && c.id_cobro_revertido === idCobro; }), function (c) { return Util.num(c.monto_aplicado); });
  },
  estadoDerivado: function (src, idCredito, hoy) {
    var cuotas = src.filas('Cuotas').filter(function (q) { return q.id_credito === idCredito; });
    var venc = cuotas.filter(function (q) { return String(q.fecha_vencimiento).substring(0, 10) < hoy && Util.num(q.cubierto) < Util.num(q.monto); });
    var vencido = Util.suma(venc, function (q) { return Util.num(q.monto) - Util.num(q.cubierto); });
    var dias = 0;
    if (venc.length) {
      venc.sort(function (a, b) { return Util.num(a.nro) - Util.num(b.nro); });
      dias = Util.diasEntre(venc[0].fecha_vencimiento, hoy);
    }
    return { estado: venc.length ? 'Vencido' : 'Al día', cuotas_vencidas: venc.length, vencido: vencido, dias_atraso: dias };
  },
  saldoCliente: function (src, idCliente) {
    return Util.suma(src.filas('Saldo_Cliente').filter(function (m) { return m.id_cliente === idCliente; }), function (m) { return Util.num(m.monto); });
  },
  // ---------- Unidad: costo y ganancia (Seccion 4.17) ----------
  costoTotal: function (src, idEquipo) {
    return Util.suma(src.filas('Costos_Unidad').filter(function (c) { return c.id_equipo === idEquipo; }), function (c) { return Util.num(c.monto); });
  },
  ventaVigente: function (src, idEquipo) {
    var v = src.filas('Ventas').filter(function (x) { return x.id_equipo === idEquipo && x.estado_venta === 'Vigente'; });
    return v.length ? v[v.length - 1] : null;
  },
  gananciaEquipos: function (src, idEquipo) {
    return Util.suma(src.filas('Asientos_Ganancia').filter(function (a) { return a.id_equipo === idEquipo && a.renglon === 'Equipos'; }), function (a) { return Util.num(a.delta); });
  },
  situacion: function (src, idEquipo) {
    var C = Contab.costoTotal(src, idEquipo), v = Contab.ventaVigente(src, idEquipo);
    var r = { C: C, P: 0, F: 0, V: 0, estado: 'inventario', G: Contab.gananciaEquipos(src, idEquipo), venta: v };
    if (!v) return r;
    if (v.tipo_venta === 'Contado') { r.estado = 'contado'; r.P = Util.num(v.precio_venta); return r; }
    var cr = src.get('Creditos', v.id_credito);
    var a = Contab.agregadosCredito(src, v.id_credito);
    r.P = a.cobrado_precio;
    var mapa = { 'Abierto': 'vivo', 'Pagado': 'cerrado', 'Cancelado anticipadamente': 'cerrado', 'Condonado': 'cerrado', 'Incobrable': 'incobrable', 'Recuperado': 'recuperado', 'Anulado': 'anulada' };
    r.estado = mapa[cr.estado] || 'vivo';
    if (r.estado === 'incobrable' || r.estado === 'recuperado') {
      var ev = src.filas('Eventos_Credito').filter(function (e) { return e.id_credito === v.id_credito && (e.tipo === 'Incobrable' || e.tipo === 'Recuperación' || e.tipo === 'Recuperación tras incobrable'); });
      var u = ev[ev.length - 1]; r.F = Util.num(u.fondo_aplicado); r.V = Util.num(u.valor_ingreso);
    }
    return r;
  },
  objetivo: function (s) {
    switch (s.estado) {
      case 'inventario': case 'anulada': return 0;
      case 'contado': case 'cerrado': return s.P - s.C;
      case 'vivo': return Math.max(0, s.P - s.C);
      case 'incobrable': return s.P + s.F - s.C;
      case 'recuperado': return s.P + s.V + s.F - s.C;
    }
    throw Util.error('estado de unidad desconocido ' + s.estado);
  },
  // Inserta el asiento de diferencia (si la hay) y devuelve la diferencia
  asentarEquipos: function (pl, idEquipo, causa, refTabla, refId, extra) {
    var s = Contab.situacion(pl, idEquipo), d = Contab.objetivo(s) - s.G;
    if (d !== 0) {
      var a = { fecha_hora: pl.ahora, renglon: 'Equipos', id_equipo: idEquipo, delta: d, saldo_posterior: s.G + d, causa: causa, ref_tabla: refTabla || '', ref_id: refId || '', responsable: pl.usuario.email };
      if (extra) for (var k in extra) a[k] = extra[k];
      if (s.venta) { a.id_venta = a.id_venta || s.venta.id_venta; a.id_credito = a.id_credito || s.venta.id_credito || ''; }
      pl.add('Asientos_Ganancia', a);
    }
    return d;
  },
  asiento: function (pl, renglon, delta, causa, ref, extra) {
    if (delta === 0) return 0;
    var base = Util.suma(pl.filas('Asientos_Ganancia').filter(function (a) {
      return a.renglon === renglon && (extra && extra.id_credito ? a.id_credito === extra.id_credito : extra && extra.id_orden ? a.id_orden === extra.id_orden : extra && extra.id_equipo ? a.id_equipo === extra.id_equipo : true);
    }), function (a) { return Util.num(a.delta); });
    var a = { fecha_hora: pl.ahora, renglon: renglon, delta: delta, saldo_posterior: base + delta, causa: causa, ref_tabla: ref ? ref[0] : '', ref_id: ref ? ref[1] : '', responsable: pl.usuario.email };
    if (extra) for (var k in extra) a[k] = extra[k];
    pl.add('Asientos_Ganancia', a);
    return delta;
  },
  // Agrega un costo a la unidad, con su efecto incremental en la ganancia
  agregarCosto: function (pl, c) {
    var ant = Contab.costoTotal(pl, c.id_equipo), post = ant + c.monto;
    var vv = Contab.ventaVigente(pl, c.id_equipo);
    var fila = pl.add('Costos_Unidad', { id_equipo: c.id_equipo, fecha_hora: c.fecha_hora || pl.ahora, tipo: c.tipo, monto: c.monto, motivo: c.motivo || '', posterior_a_venta: vv ? 'Sí' : 'No', costo_total_anterior: ant, costo_total_posterior: post, efecto_ganancia: 0, ref_tabla: c.ref_tabla || '', ref_id: c.ref_id || '', afecta_caja: c.afecta_caja || 'No', origen_sin_pago: c.origen_sin_pago || '', descripcion: c.descripcion || '', responsable: pl.usuario.email });
    var d = Contab.asentarEquipos(pl, c.id_equipo, 'Costo', 'Costos_Unidad', fila.id_costo);
    fila.efecto_ganancia = d;
    pl.cache('equipo:' + c.id_equipo);
    return fila;
  },
  // ---------- Fondo (Seccion 4.21) ----------
  saldoFondo: function (src) {
    return Util.suma(src.filas('Movimientos_Fondo'), function (m) { return Util.num(m.monto); });
  },
  moverFondo: function (pl, monto, motivo, idCredito, refTabla, refId) {
    if (monto === 0) return null;
    var ant = Contab.saldoFondo(pl);
    if (ant + monto < 0) throw Util.error('FONDO NEGATIVO: ' + motivo);
    return pl.add('Movimientos_Fondo', { fecha_hora: pl.ahora, saldo_anterior: ant, monto: monto, saldo_posterior: ant + monto, motivo: motivo, id_credito: idCredito || '', ref_tabla: refTabla || '', ref_id: refId || '', responsable: pl.usuario.email });
  },
  moverSaldoCliente: function (pl, idCliente, idCredito, tipo, monto, refTabla, refId) {
    var ant = Contab.saldoCliente(pl, idCliente), post = ant + monto;
    if (post < 0) throw Util.error('el saldo a favor del cliente no alcanza');
    return pl.add('Saldo_Cliente', { id_cliente: idCliente, id_credito: idCredito || '', fecha_hora: pl.ahora, tipo: tipo, monto: monto, saldo_posterior: post, ref_tabla: refTabla || '', ref_id: refId || '' });
  },
  // ---------- Caja (Seccion 4.26 y 4.30) ----------
  dineroDisponible: function (src) {
    var ini = Number(Config.valor('saldo_inicial_caja')) || 0;
    return ini + Util.suma(src.filas('Movimientos_Dinero'), function (m) { return (m.tipo === 'Ingreso' ? 1 : -1) * Util.num(m.monto); });
  },
  saldosPorMedio: function (src) {
    var s = {};
    Config.medios().forEach(function (m) { s[m] = 0; });
    var ini = Number(Config.valor('saldo_inicial_caja')) || 0, m0 = Config.medios()[0]; if (m0) s[m0] += ini;
    src.filas('Movimientos_Dinero').forEach(function (m) { var k = m.medio || 'Sin medio'; s[k] = (s[k] || 0) + (m.tipo === 'Ingreso' ? 1 : -1) * Util.num(m.monto); });
    return s;
  },
  // medios: [{medio, monto}] o, por compatibilidad, un medio unico + total
  normalizarMedios: function (p, total) {
    var m = p.medios;
    if (!m && p.medio) m = [{ medio: p.medio, monto: total }];
    if (!m && typeof SIMULANDO !== 'undefined' && SIMULANDO && total > 0) m = [{ medio: Config.medios()[0], monto: total }];
    return Contab.validarMedios(m, total);
  },
  validarMedios: function (medios, total) {
    if (!Array.isArray(medios) || !medios.length) throw Util.error('Indique el medio de pago');
    var validos = Config.medios(), vistos = {}, suma = 0;
    var salida = medios.map(function (x) {
      var monto = Util.entero(x.monto);
      if (isNaN(monto) || monto <= 0) throw Util.error('Cada monto del reparto por medios debe ser un entero mayor que cero');
      if (validos.indexOf(x.medio) < 0) throw Util.error('Medio de pago fuera de la lista: ' + x.medio);
      if (vistos[x.medio]) throw Util.error('Medio repetido en el reparto: ' + x.medio);
      vistos[x.medio] = true; suma += monto;
      return { medio: x.medio, monto: monto };
    });
    if (suma !== total) throw Util.error('La suma de los medios (' + suma + ') no coincide con el importe (' + total + ')');
    salida.sort(function (a, b) { return a.medio < b.medio ? -1 : a.medio > b.medio ? 1 : a.monto - b.monto; });
    return salida;
  },
  dinero: function (pl, tipo, concepto, medios, refTabla, refId, comentario) {
    var filas = [];
    medios.forEach(function (m) {
      filas.push(pl.add('Movimientos_Dinero', { fecha_hora: pl.ahora, tipo: tipo, concepto: concepto, monto: m.monto, medio: m.medio, ref_tabla: refTabla || '', ref_id: refId || '', comentario: comentario || '', responsable: pl.usuario.email }));
    });
    return filas;
  },
  etiquetaMedio: function (medios) { return medios.length === 1 ? medios[0].medio : 'Varios'; },
  // ---------- Tecnico (Seccion 4.25) ----------
  devengarTecnico: function (pl, d) {
    var mesCierre = Util.mes(d.fecha_hora || pl.ahora), mes = mesCierre, mesOrigen = '';
    if (Contab.mesCerrado(pl, mesCierre)) { mes = Util.mes(pl.ahora); mesOrigen = mesCierre; }
    return pl.add('Costos_Tecnico', { fecha_hora: d.fecha_hora || pl.ahora, tecnico: d.tecnico, mes_costo: mes, id_reparacion: d.id_reparacion || '', id_equipo: d.id_equipo || '', id_orden: d.id_orden || '', tipo: d.tipo, monto: d.monto, motivo: d.motivo || '', mes_origen: mesOrigen, ref_id: d.ref_id || '' });
  },
  mesCerrado: function (src, mes) {
    return src.filas('Cierres_Mensuales').some(function (c) { return c.mes === mes; });
  },
  tecnicoAPagar: function (src) {
    var pagadas = {};
    src.filas('Liquidaciones_Tecnico').forEach(function (l) { if (l.estado === 'Pagada') pagadas[l.id_liquidacion] = true; });
    return Util.suma(src.filas('Costos_Tecnico'), function (c) { return (c.id_liquidacion && pagadas[c.id_liquidacion]) ? 0 : Util.num(c.monto); });
  },
  saldosAFavorTotal: function (src) {
    return Util.suma(src.filas('Saldo_Cliente'), function (m) { return Util.num(m.monto); });
  },
  capitalLibre: function (src) {
    return Contab.dineroDisponible(src) - Contab.saldosAFavorTotal(src) - Contab.tecnicoAPagar(src);
  },
  cuentasPorCobrar: function (src) {
    var t = 0;
    src.filas('Creditos').forEach(function (c) { if (c.estado === 'Abierto') { var a = Contab.agregadosCredito(src, c.id_credito); t += Contab.deuda(a); } });
    return t;
  },
  // ---------- Cachés (se recalculan desde los libros) ----------
  recalcular: function (nombre) {
    var p = nombre.split(':'), tipo = p[0], id = p[1], src = FuenteDatos;
    if (tipo === 'equipo') {
      var e = Datos.buscar('Equipos', 'id_equipo', id); if (!e) return;
      var costos = Datos.filtrar('Costos_Unidad', function (c) { return c.id_equipo === id; });
      var compra = Util.suma(costos.filter(function (c) { return c.tipo === 'Compra'; }), function (c) { return Util.num(c.monto); });
      var total = Util.suma(costos, function (c) { return Util.num(c.monto); });
      var v = Contab.ventaVigente(src, id);
      var precios = Datos.filtrar('Precios_Equipo', function (x) { return x.id_equipo === id; });
      Datos.actualizar('Equipos', e, { precio_compra: costos.length ? compra : '', costo_reparacion_total: costos.length ? total - compra : '', costo_total: costos.length ? total : '', precio_venta: v ? v.precio_venta : '', precio_fijado: precios.length ? precios[precios.length - 1].precio : '' });
    } else if (tipo === 'credito') {
      var cr = Datos.buscar('Creditos', 'id_credito', id); if (!cr) return;
      var a = Contab.agregadosCredito(src, id);
      Datos.actualizar('Creditos', cr, { pendiente_capital: a.pendiente_capital, pendiente_fondo: a.pendiente_fondo, pendiente_interes: a.pendiente_interes, cobrado_precio: a.cobrado_precio, interes_cobrado: a.interes_cobrado, fondo_aportado: a.fondo_aportado, descuento_total: a.descuento_total });
      Contab.recalcular('cuotas:' + id);
    } else if (tipo === 'cuotas') {
      var apl = {};
      Datos.leer('Aplicaciones_Cuota').forEach(function (x) { apl[x.id_cuota] = (apl[x.id_cuota] || 0) + Util.num(x.monto); });
      Datos.filtrar('Cuotas', function (q) { return q.id_credito === id; }).forEach(function (q) {
        var c = apl[q.id_cuota] || 0; if (Util.num(q.cubierto) !== c || q.cubierto === '') Datos.actualizar('Cuotas', q, { cubierto: c });
      });
    } else if (tipo === 'repuesto') {
      var r = Datos.buscar('Repuestos', 'id_repuesto', id); if (!r) return;
      var ent = Util.suma(Datos.filtrar('Movimientos_Repuestos', function (m) { return m.id_repuesto === id; }), function (m) { return Util.num(m.cantidad); });
      var usado = Util.suma(Datos.filtrar('Repuestos_Usados', function (u) { return u.id_repuesto === id; }), function (u) { return Util.num(u.cantidad); });
      Datos.actualizar('Repuestos', r, { stock_actual: ent - usado });
    } else if (tipo === 'orden') {
      var o = Datos.buscar('Ordenes_Servicio', 'id_orden', id); if (!o) return;
      var ant = Contab.anticiposOrden(src, id);
      Datos.actualizar('Ordenes_Servicio', o, { anticipos_recibidos: ant });
    }
  },
  anticiposOrden: function (src, idOrden) {
    return Util.suma(src.filas('Movimientos_Dinero').filter(function (m) { return m.ref_tabla === 'Ordenes_Servicio' && m.ref_id === idOrden && (m.concepto === 'Anticipo de servicio técnico' || m.concepto === 'Devolución de anticipo'); }), function (m) { return (m.concepto === 'Devolución de anticipo' ? -1 : 1) * Util.num(m.monto); });
  },
  stockRepuesto: function (src, idRepuesto) {
    var ent = Util.suma(src.filas('Movimientos_Repuestos').filter(function (m) { return m.id_repuesto === idRepuesto; }), function (m) { return Util.num(m.cantidad); });
    var usado = Util.suma(src.filas('Repuestos_Usados').filter(function (u) { return u.id_repuesto === idRepuesto; }), function (u) { return Util.num(u.cantidad); });
    return ent - usado;
  }
};
