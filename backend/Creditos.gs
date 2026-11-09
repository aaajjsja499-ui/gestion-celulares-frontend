// GESTION_CELULARES - Creditos.gs (Diseno Tecnico 4.18 a 4.23)
// Cobros, reversas, cancelacion anticipada, condonacion, incobrable,
// recuperacion de equipo, devolucion/desistimiento y saldo a favor.

var Creditos = {
  obtener: function (src, id) {
    var c = src.get('Creditos', id); if (!c) throw Util.error('No existe el crédito ' + id); return c;
  },
  verificarVersion: function (cr, version) {
    if (version !== undefined && Util.entero(version) !== Util.num(cr.version)) throw Util.error('El crédito cambió desde que lo abrió. Actualice la pantalla.');
  },
  cfg: function (cr) { return { capBps: Util.num(cr.pct_capital_bps), fondoBps: Util.num(cr.pct_fondo_bps) }; },
  huella: function (src, cr) {
    var a = Contab.agregadosCredito(src, cr.id_credito), s = Contab.situacion(src, cr.id_equipo);
    var cobros = src.filas('Cobros').filter(function (c) { return c.id_credito === cr.id_credito; });
    return [cobros.filter(function (c) { return c.tipo === 'Cobro'; }).length, cobros.filter(function (c) { return c.tipo !== 'Cobro'; }).length, cr.estado, Contab.deuda(a), Contab.saldoFondo(src), s.C, s.P, s.G, s.estado, s.F].join('|');
  },
  // Compara la huella de la simulacion con el estado real (Seccion 4.16)
  controlarHuella: function (p, src, cr) {
    var h = Creditos.huella(src, cr);
    if (p.huella_simulada && p.huella_simulada !== h) throw Util.error('el estado cambió desde la simulación: simular de nuevo');
    return h;
  },
  tocar: function (pl, id, cambios) { pl.upd('Creditos', id, cambios || {}, true); pl.cache('credito:' + id); },
  checarSaldoParaCierre: function (pl, cr) {
    var saldo = Contab.saldoCliente(pl, cr.id_cliente);
    if (saldo > 0) {
      var dejado = pl.filas('Saldo_Cliente').some(function (m) { return m.id_cliente === cr.id_cliente && m.tipo === 'Conservado por decisión documentada' && m.id_credito === cr.id_credito; });
      if (!dejado) throw Util.error('El cliente tiene saldo a favor de ' + saldo + ' Gs. Úselo, devuélvalo o déjelo conscientemente (dejarSaldoAFavor) antes de seguir.');
    }
  },
  // Aplica un importe a un credito (cobro). medios null = saldo a favor (no entra dinero)
  aplicarCobro: function (pl, cr, recibido, medioEtiqueta, medios, comentario) {
    var a = Contab.agregadosCredito(pl, cr.id_credito), deuda = Contab.deuda(a);
    if (cr.estado !== 'Abierto' && cr.estado !== 'Cancelando') throw Util.error('el credito no esta Abierto: ' + cr.estado);
    var aplicado = Math.min(recibido, deuda), sf = recibido - aplicado;
    var s = M.pagar(aplicado, { capital: a.pendiente_capital, fondo: a.pendiente_fondo, interes: a.pendiente_interes }, Creditos.cfg(cr));
    if (s.sobrante !== 0) throw Util.error('sobrante inesperado ' + s.sobrante);
    var cobro = pl.add('Cobros', { id_credito: cr.id_credito, fecha_hora: pl.ahora, tipo: 'Cobro', medio: medioEtiqueta, monto_recibido: recibido, monto_aplicado: aplicado, saldo_favor_generado: sf, capital: s.c, fondo: s.f, interes: s.i, responsable: pl.usuario.email, comentario: comentario || '' });
    // aplicacion contractual a las cuotas, de la mas antigua a la mas nueva
    var cub = {};
    pl.filas('Aplicaciones_Cuota').forEach(function (x) { cub[x.id_cuota] = (cub[x.id_cuota] || 0) + Util.num(x.monto); });
    var cuotas = pl.filas('Cuotas').filter(function (q) { return q.id_credito === cr.id_credito; }).sort(function (x, y) { return Util.num(x.nro) - Util.num(y.nro); });
    var resto = aplicado;
    cuotas.forEach(function (q) {
      if (resto <= 0) return;
      var libre = Util.num(q.monto) - (cub[q.id_cuota] || 0), x = Math.min(resto, libre);
      if (x > 0) { pl.add('Aplicaciones_Cuota', { id_cobro: cobro.id_cobro, id_cuota: q.id_cuota, monto: x }); resto -= x; }
    });
    if (s.f > 0) Contab.moverFondo(pl, s.f, 'Aporte por cobro', cr.id_credito, 'Cobros', cobro.id_cobro);
    Contab.asiento(pl, 'Intereses', s.i, 'Cobro', ['Cobros', cobro.id_cobro], { id_credito: cr.id_credito });
    if (sf > 0) Contab.moverSaldoCliente(pl, cr.id_cliente, cr.id_credito, 'Generado por pago de más', sf, 'Cobros', cobro.id_cobro);
    if (medios) Contab.dinero(pl, 'Ingreso', 'Cobro de cuota', medios, 'Cobros', cobro.id_cobro, comentario || '');
    var pagado = deuda - aplicado === 0;
    return { cobro: cobro, reparto: s, aplicado: aplicado, saldo_favor: sf, pagado: pagado };
  }
};

definir('registrarCobro', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['CRE:' + p.id_credito]; },
  huella: function (p) { return ['registrarCobro', p.id_credito, p.monto_recibido].join('|'); },
  planificar: function (p, pl) {
    var cr = Creditos.obtener(pl, p.id_credito); Creditos.verificarVersion(cr, p.version);
    var recibido = Util.entero(p.monto_recibido); if (isNaN(recibido) || recibido <= 0) throw Util.error('El monto recibido debe ser un entero mayor que 0');
    var medios = Contab.normalizarMedios(p, recibido);
    var h = Creditos.controlarHuella(p, pl, cr);
    var r = Creditos.aplicarCobro(pl, cr, recibido, Contab.etiquetaMedio(medios), medios, Util.texto(p.comentario));
    if (r.pagado) Creditos.tocar(pl, cr.id_credito, { estado: 'Pagado' }); else Creditos.tocar(pl, cr.id_credito, {});
    Contab.asentarEquipos(pl, cr.id_equipo, 'Cobro', 'Cobros', r.cobro.id_cobro);
    pl.cache('equipo:' + cr.id_equipo);
    var a = Contab.agregadosCredito(pl, cr.id_credito);
    pl.resultado = { id_cobro: r.cobro.id_cobro, aplicado: r.aplicado, saldo_favor_generado: r.saldo_favor, capital: r.reparto.c, fondo: r.reparto.f, interes: r.reparto.i, estado_credito: r.pagado ? 'Pagado' : 'Abierto', deuda_restante: Contab.deuda(a), huella: h };
  }
});

definir('usarSaldoAFavor', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['CRE:' + p.id_credito]; },
  planificar: function (p, pl) {
    var cr = Creditos.obtener(pl, p.id_credito); Creditos.verificarVersion(cr, p.version);
    var monto = Util.entero(p.monto); if (isNaN(monto) || monto <= 0) throw Util.error('El monto debe ser un entero mayor que 0');
    if (Contab.saldoCliente(pl, cr.id_cliente) < monto) throw Util.error('El saldo a favor del cliente no alcanza');
    var a0 = Contab.agregadosCredito(pl, cr.id_credito);
    if (monto > Contab.deuda(a0)) throw Util.error('El monto supera la deuda pendiente');
    var r = Creditos.aplicarCobro(pl, cr, monto, 'Saldo a favor', null, 'Saldo a favor');
    Contab.moverSaldoCliente(pl, cr.id_cliente, cr.id_credito, 'Aplicado a un crédito', -monto, 'Cobros', r.cobro.id_cobro);
    Creditos.tocar(pl, cr.id_credito, r.pagado ? { estado: 'Pagado' } : {});
    Contab.asentarEquipos(pl, cr.id_equipo, 'Cobro', 'Cobros', r.cobro.id_cobro);
    pl.cache('equipo:' + cr.id_equipo);
    pl.resultado = { id_cobro: r.cobro.id_cobro, aplicado: r.aplicado };
  }
});

definir('devolverSaldoAFavor', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['CLI:' + p.id_cliente]; },
  huella: function (p) { return ['devolverSaldoAFavor', p.id_cliente, p.monto].join('|'); },
  planificar: function (p, pl) {
    var monto = Util.entero(p.monto); if (isNaN(monto) || monto <= 0) throw Util.error('El monto debe ser un entero mayor que 0');
    if (!pl.get('Clientes', p.id_cliente)) throw Util.error('El cliente no existe');
    if (Contab.saldoCliente(pl, p.id_cliente) < monto) throw Util.error('El saldo a favor del cliente no alcanza');
    var medios = Contab.normalizarMedios(p, monto);
    var m = Contab.moverSaldoCliente(pl, p.id_cliente, '', 'Devuelto al cliente', -monto, 'Movimientos_Dinero', '');
    Contab.dinero(pl, 'Egreso', 'Devolución de saldo a favor', medios, 'Saldo_Cliente', m.id_mov_saldo, 'Devolución de saldo a favor');
    pl.resultado = { id_mov_saldo: m.id_mov_saldo, saldo: Contab.saldoCliente(pl, p.id_cliente) };
  }
});

definir('dejarSaldoAFavor', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['CRE:' + p.id_credito]; },
  planificar: function (p, pl) {
    var cr = Creditos.obtener(pl, p.id_credito);
    var saldo = Contab.saldoCliente(pl, cr.id_cliente);
    if (saldo <= 0) throw Util.error('El cliente no tiene saldo a favor');
    var motivo = Util.texto(p.motivo); if (motivo.length < 10) throw Util.error('El motivo debe tener al menos 10 caracteres');
    var d = pl.decision('Procesos', 'Saldo a favor del cliente ' + cr.id_cliente + ' (' + saldo + ' Gs.) al cerrar el crédito ' + cr.id_credito, 'Se deja el saldo a favor como saldo vigente', motivo);
    pl.add('Saldo_Cliente', { id_cliente: cr.id_cliente, id_credito: cr.id_credito, fecha_hora: pl.ahora, tipo: 'Conservado por decisión documentada', monto: 0, saldo_posterior: saldo, ref_tabla: 'Decisiones', ref_id: d });
    pl.add('Eventos_Credito', { id_credito: cr.id_credito, fecha_hora: pl.ahora, tipo: 'Saldo a favor dejado', estado_anterior: cr.estado, estado_nuevo: cr.estado, motivo: motivo, autorizado_por: pl.usuario.email, id_decision: d });
    pl.resultado = { id_decision: d, saldo: saldo };
  }
});

definir('reversarCobro', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['COB:' + p.id_cobro]; },
  planificar: function (p, pl) {
    var x = pl.get('Cobros', p.id_cobro); if (!x || x.tipo !== 'Cobro') throw Util.error('No existe el cobro');
    var cr = Creditos.obtener(pl, x.id_credito);
    var motivo = Util.texto(p.motivo); if (motivo.length < 5) throw Util.error('El motivo es obligatorio');
    if (['Abierto', 'Pagado'].indexOf(cr.estado) < 0) throw Util.error('Con el crédito en estado ' + cr.estado + ' no se reversan cobros');
    var vig = Contab.cobrosVigentes(pl, cr.id_credito), ult = vig[vig.length - 1];
    if (!ult || ult.id_cobro !== x.id_cobro) throw Util.error('solo se puede reversar el ultimo cobro vigente');
    if (Contab.revertidoPorDevolucion(pl, x.id_cobro) > 0) throw Util.error('El cobro ya fue revertido por una devolución');
    var sf = Util.num(x.saldo_favor_generado);
    if (x.medio === 'Saldo a favor') { /* devuelve el saldo usado */ }
    else if (sf > 0 && Contab.saldoCliente(pl, cr.id_cliente) < sf) throw Util.error('el saldo a favor de este cobro ya se uso');
    var h = Creditos.controlarHuella(p, pl, cr);
    var rev = pl.add('Cobros', { id_credito: cr.id_credito, fecha_hora: pl.ahora, tipo: 'Reversa', id_cobro_revertido: x.id_cobro, medio: x.medio, monto_recibido: -Util.num(x.monto_recibido), monto_aplicado: -Util.num(x.monto_aplicado), saldo_favor_generado: -sf, capital: -Util.num(x.capital), fondo: -Util.num(x.fondo), interes: -Util.num(x.interes), responsable: pl.usuario.email, comentario: motivo });
    pl.filas('Aplicaciones_Cuota').filter(function (ap) { return ap.id_cobro === x.id_cobro && Util.num(ap.monto) > 0; }).forEach(function (ap) {
      pl.add('Aplicaciones_Cuota', { id_cobro: rev.id_cobro, id_cuota: ap.id_cuota, monto: -Util.num(ap.monto) });
    });
    var f = Util.num(x.fondo), saldoF = Contab.saldoFondo(pl), sale = Math.min(f, saldoF), faltante = f - sale;
    if (sale > 0) Contab.moverFondo(pl, -sale, 'Reversa de cobro', cr.id_credito, 'Cobros', rev.id_cobro);
    if (faltante > 0) Contab.asiento(pl, 'Faltante de fondo', faltante, 'Reversa de cobro', ['Cobros', rev.id_cobro], { id_credito: cr.id_credito });
    Contab.asiento(pl, 'Intereses', -Util.num(x.interes), 'Reversa de cobro', ['Cobros', rev.id_cobro], { id_credito: cr.id_credito });
    if (sf > 0 && x.medio !== 'Saldo a favor') Contab.moverSaldoCliente(pl, cr.id_cliente, cr.id_credito, 'Generado por pago de más', -sf, 'Cobros', rev.id_cobro);
    if (x.medio === 'Saldo a favor') Contab.moverSaldoCliente(pl, cr.id_cliente, cr.id_credito, 'Generado por pago de más', Util.num(x.monto_recibido), 'Cobros', rev.id_cobro);
    else {
      var medios = pl.filas('Movimientos_Dinero').filter(function (m) { return m.ref_tabla === 'Cobros' && m.ref_id === x.id_cobro && m.concepto === 'Cobro de cuota'; }).map(function (m) { return { medio: m.medio, monto: Util.num(m.monto) }; });
      Contab.dinero(pl, 'Egreso', 'Reversa de cobro', medios, 'Cobros', rev.id_cobro, motivo);
    }
    Creditos.tocar(pl, cr.id_credito, cr.estado === 'Pagado' ? { estado: 'Abierto' } : {});
    Contab.asentarEquipos(pl, cr.id_equipo, 'Reversa de cobro', 'Cobros', rev.id_cobro);
    pl.cache('equipo:' + cr.id_equipo);
    pl.resultado = { id_reversa: rev.id_cobro, faltante_fondo: faltante, fondo_devuelto: sale, huella: h };
  }
});

definir('cancelarAnticipado', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['CRE:' + p.id_credito]; },
  huella: function (p) { return ['cancelarAnticipado', p.id_credito, p.descuento || 0].join('|'); },
  planificar: function (p, pl) {
    var cr = Creditos.obtener(pl, p.id_credito); Creditos.verificarVersion(cr, p.version);
    if (cr.estado !== 'Abierto') throw Util.error('el credito no esta Abierto: ' + cr.estado);
    var desc = p.descuento === undefined || p.descuento === '' ? 0 : Util.entero(p.descuento);
    if (isNaN(desc) || desc < 0) throw Util.error('El descuento debe ser un entero mayor o igual a 0');
    var a = Contab.agregadosCredito(pl, cr.id_credito);
    if (desc > a.pendiente_interes) throw Util.error('descuento supera el interes pendiente');
    var motivo = Util.texto(p.motivo);
    if (desc > 0 && motivo.length < 5) throw Util.error('Un descuento exige motivo');
    var h = Creditos.controlarHuella(p, pl, cr);
    if (desc > 0) pl.add('Eventos_Credito', { id_credito: cr.id_credito, fecha_hora: pl.ahora, tipo: 'Descuento', estado_anterior: 'Abierto', estado_nuevo: 'Abierto', motivo: motivo, autorizado_por: pl.usuario.email, descuento: desc });
    var a2 = Contab.agregadosCredito(pl, cr.id_credito), paga = Contab.deuda(a2);
    if (paga <= 0) throw Util.error('El crédito no tiene deuda pendiente');
    var medios = Contab.normalizarMedios(p, paga);
    var r = Creditos.aplicarCobro(pl, cr, paga, Contab.etiquetaMedio(medios), medios, 'Cancelación anticipada');
    pl.add('Eventos_Credito', { id_credito: cr.id_credito, fecha_hora: pl.ahora, tipo: 'Cancelación anticipada', estado_anterior: 'Abierto', estado_nuevo: 'Cancelado anticipadamente', motivo: motivo || 'Cancelación anticipada sin descuento', autorizado_por: pl.usuario.email });
    Creditos.tocar(pl, cr.id_credito, { estado: 'Cancelado anticipadamente' });
    Contab.asentarEquipos(pl, cr.id_equipo, 'Cierre de crédito', 'Creditos', cr.id_credito);
    pl.cache('equipo:' + cr.id_equipo);
    pl.resultado = { paga: paga, descuento: desc, capital: r.reparto.c, fondo: r.reparto.f, interes: r.reparto.i, aviso: a.pendiente_interes === 0 ? 'el sistema no calcula devolucion; esto lo debe ver el asesor' : '', huella: h };
  }
});

definir('condonarCredito', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['CRE:' + p.id_credito]; },
  planificar: function (p, pl) {
    var cr = Creditos.obtener(pl, p.id_credito); Creditos.verificarVersion(cr, p.version);
    if (cr.estado !== 'Abierto') throw Util.error('el credito no esta Abierto: ' + cr.estado);
    var motivo = Util.texto(p.motivo); if (motivo.length < 10) throw Util.error('El motivo debe tener al menos 10 caracteres');
    Creditos.checarSaldoParaCierre(pl, cr);
    var h = Creditos.controlarHuella(p, pl, cr);
    var s = Contab.situacion(pl, cr.id_equipo), a = Contab.agregadosCredito(pl, cr.id_credito);
    var d = pl.decision('Procesos', 'Condonación del crédito ' + cr.id_credito, 'Se condona el saldo pendiente de ' + Contab.deuda(a) + ' Gs.', motivo, cr.id_equipo);
    pl.add('Eventos_Credito', { id_credito: cr.id_credito, fecha_hora: pl.ahora, tipo: 'Condonación', estado_anterior: 'Abierto', estado_nuevo: 'Condonado', motivo: motivo, autorizado_por: pl.usuario.email, deuda_perdonada: Contab.deuda(a), costo_no_cobrado: Math.max(0, s.C - s.P), id_decision: d });
    Creditos.tocar(pl, cr.id_credito, { estado: 'Condonado' });
    Contab.asentarEquipos(pl, cr.id_equipo, 'Cierre de crédito', 'Creditos', cr.id_credito);
    pl.cache('equipo:' + cr.id_equipo);
    pl.resultado = { deuda_perdonada: Contab.deuda(a), ganancia_equipos: Contab.gananciaEquipos(pl, cr.id_equipo), id_decision: d, huella: h };
  }
});

definir('marcarIncobrable', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['CRE:' + p.id_credito]; },
  planificar: function (p, pl) {
    var cr = Creditos.obtener(pl, p.id_credito); Creditos.verificarVersion(cr, p.version);
    if (cr.estado !== 'Abierto') throw Util.error('el credito no esta Abierto: ' + cr.estado);
    var der = Contab.estadoDerivado(pl, cr.id_credito, Util.hoy()), minimo = Number(Config.valor('dias_incobrable'));
    if (der.estado !== 'Vencido' || der.dias_atraso < minimo) throw Util.error('Solo se declara incobrable un crédito vencido con al menos ' + minimo + ' días de atraso (tiene ' + der.dias_atraso + ')');
    var motivo = Util.texto(p.motivo); if (motivo.length < 10) throw Util.error('El motivo debe tener al menos 10 caracteres');
    Creditos.checarSaldoParaCierre(pl, cr);
    var h = Creditos.controlarHuella(p, pl, cr);
    var s = Contab.situacion(pl, cr.id_equipo), E = Math.max(0, s.C - s.P), F = Math.min(Contab.saldoFondo(pl), E);
    var d = pl.decision('Procesos', 'Incobrable: crédito ' + cr.id_credito + ' con ' + der.dias_atraso + ' días de atraso', 'Se declara incobrable', motivo, cr.id_equipo);
    if (F > 0) Contab.moverFondo(pl, -F, 'Aplicación por incobrable', cr.id_credito, 'Creditos', cr.id_credito);
    pl.add('Eventos_Credito', { id_credito: cr.id_credito, fecha_hora: pl.ahora, tipo: 'Incobrable', estado_anterior: 'Abierto', estado_nuevo: 'Incobrable', motivo: motivo, autorizado_por: pl.usuario.email, dias_atraso: der.dias_atraso, costo_no_cobrado: E, fondo_aplicado: F, resultado_neto: s.P + F - s.C, id_decision: d });
    Creditos.tocar(pl, cr.id_credito, { estado: 'Incobrable' });
    Contab.asentarEquipos(pl, cr.id_equipo, 'Incobrable', 'Creditos', cr.id_credito);
    pl.cache('equipo:' + cr.id_equipo);
    pl.resultado = { exposicion: E, fondo_aplicado: F, resultado_neto: s.P + F - s.C, saldo_fondo: Contab.saldoFondo(pl), id_decision: d, huella: h };
  }
});

definir('recuperarEquipo', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['CRE:' + p.id_credito]; },
  planificar: function (p, pl) {
    var cr = Creditos.obtener(pl, p.id_credito); Creditos.verificarVersion(cr, p.version);
    if (cr.estado !== 'Abierto' && cr.estado !== 'Incobrable') throw Util.error('Solo se recupera el equipo de un crédito Abierto o Incobrable (estado: ' + cr.estado + ')');
    var motivo = Util.texto(p.motivo); if (motivo.length < 10) throw Util.error('El motivo debe tener al menos 10 caracteres');
    var est = Util.entero(p.estimacion_venta); if (isNaN(est) || est <= 0) throw Util.error('Indique la estimación de venta del equipo (entero mayor que 0)');
    if (Util.texto(p.motivo_valoracion).length < 5) throw Util.error('Indique cómo se estimó el valor de ingreso');
    if (cr.estado === 'Abierto') Creditos.checarSaldoParaCierre(pl, cr);
    var h = Creditos.controlarHuella(p, pl, cr);
    var s = Contab.situacion(pl, cr.id_equipo), V = Math.min(s.C, est), previo = null;
    if (cr.estado === 'Incobrable') previo = pl.filas('Eventos_Credito').filter(function (x) { return x.id_credito === cr.id_credito && x.tipo === 'Incobrable'; }).pop();
    var E = Math.max(0, s.C - s.P - V), F;
    if (previo) {
      var F1 = Util.num(previo.fondo_aplicado);
      F = Math.min(Contab.saldoFondo(pl) + F1, E);
      var dif = F1 - F; if (dif !== 0) Contab.moverFondo(pl, dif, 'Corrección por recuperación', cr.id_credito, 'Eventos_Credito', previo.id_evento);
    } else {
      F = Math.min(Contab.saldoFondo(pl), E);
      if (F > 0) Contab.moverFondo(pl, -F, 'Aplicación por recuperación', cr.id_credito, 'Creditos', cr.id_credito);
    }
    var e0 = Equipos.obtener(pl, cr.id_equipo);
    var nueva = pl.add('Equipos', { tipo_articulo: e0.tipo_articulo, marca: e0.marca, modelo: e0.modelo, imei: e0.imei, numero_serie: e0.numero_serie, id_unidad_origen: e0.id_equipo, estado: 'Recibido', fecha_deteccion: pl.ahora, fecha_compra: pl.ahora, notas: 'Recuperado del crédito ' + cr.id_credito, version: 1 });
    pl.add('Historial_Estados', { id_equipo: nueva.id_equipo, fecha_hora: pl.ahora, estado_anterior: '', estado_nuevo: 'Recibido', responsable: pl.usuario.email, comentario: 'Equipo recuperado de la unidad ' + e0.id_equipo + ' (crédito ' + cr.id_credito + ')' });
    var d = pl.decision('Procesos', 'Recuperación del equipo del crédito ' + cr.id_credito, 'Se recupera el equipo; valor de ingreso ' + V + ' Gs.', motivo + ' | Valoración: ' + Util.texto(p.motivo_valoracion) + ' | Traslado: ' + Util.texto(p.medio_traslado), cr.id_equipo);
    var ev = pl.add('Eventos_Credito', { id_credito: cr.id_credito, fecha_hora: pl.ahora, tipo: previo ? 'Recuperación tras incobrable' : 'Recuperación', estado_anterior: cr.estado, estado_nuevo: 'Recuperado', motivo: motivo, autorizado_por: pl.usuario.email, costo_no_cobrado: Math.max(0, s.C - s.P), fondo_aplicado: F, resultado_neto: s.P + V + F - s.C, valor_ingreso: V, estimacion_venta: est, id_unidad_nueva: nueva.id_equipo, id_evento_origen: previo ? previo.id_evento : '', fondo_aplicado_previo: previo ? Util.num(previo.fondo_aplicado) : '', id_decision: d });
    Creditos.tocar(pl, cr.id_credito, { estado: 'Recuperado' });
    if (['Entregado', 'En garantía'].indexOf(pl.get('Equipos', cr.id_equipo).estado) >= 0) Equipos.cambiarEstado(pl, e0, 'Cerrado por venta', 'Equipo recuperado: crédito ' + cr.id_credito);
    Contab.asentarEquipos(pl, cr.id_equipo, 'Recuperación', 'Eventos_Credito', ev.id_evento);
    Contab.agregarCosto(pl, { id_equipo: nueva.id_equipo, tipo: 'Valor de ingreso por recuperación', monto: V, ref_tabla: 'Eventos_Credito', ref_id: ev.id_evento, motivo: 'Valor de ingreso por recuperación' });
    pl.cache('equipo:' + cr.id_equipo);
    pl.resultado = { id_unidad_nueva: nueva.id_equipo, valor_ingreso: V, exposicion: E, fondo_aplicado: F, resultado_total: s.P + V + F - s.C, saldo_fondo: Contab.saldoFondo(pl), id_decision: d, huella: h };
  }
});

definir('registrarDevolucion', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['VTA:' + p.id_venta]; },
  planificar: function (p, pl, u) {
    var v = pl.get('Ventas', p.id_venta); if (!v) throw Util.error('No existe la venta');
    if (v.estado_venta !== 'Vigente') throw Util.error('La venta ya está anulada');
    var e = Equipos.obtener(pl, v.id_equipo);
    var cr = v.id_credito ? Creditos.obtener(pl, v.id_credito) : null;
    if (cr && ['Incobrable', 'Recuperado', 'Anulado'].indexOf(cr.estado) >= 0) throw Util.error('Un crédito ' + cr.estado + ' no admite devolución');
    if (['Desistimiento', 'Devolución en garantía'].indexOf(p.tipo) < 0) throw Util.error('Indique si es desistimiento o devolución en garantía');
    if (p.tipo === 'Desistimiento' && e.estado !== 'Vendido') throw Util.error('El desistimiento se registra antes de la entrega (unidad Vendida)');
    if (p.tipo === 'Devolución en garantía') {
      if (e.estado !== 'En garantía') throw Util.error('La devolución en garantía exige la unidad En garantía');
      var hasta = Util.sumarDias(String(v.fecha_entrega).substring(0, 10), Util.num(v.garantia_dias));
      if (Util.hoy() > hasta) throw Util.error('La garantía venció el ' + hasta);
    }
    if (['Negocio', 'Cliente'].indexOf(p.causa) < 0) throw Util.error('Indique la causa (Negocio o Cliente)');
    var motivo = Util.texto(p.motivo); if (motivo.length < 10) throw Util.error('El motivo debe tener al menos 10 caracteres');
    var a0 = cr ? Contab.agregadosCredito(pl, cr.id_credito) : null;
    var total = cr ? a0.cobrado_precio + a0.interes_cobrado + a0.fondo_aportado : Util.num(v.precio_venta);
    var reem = Util.entero(p.monto_reembolsado); if (isNaN(reem) || reem < 0) throw Util.error('El reembolso debe ser un entero mayor o igual a 0');
    if (reem > total) throw Util.error('reembolso mayor a lo cobrado (' + total + ')');
    var retenido = total - reem;
    if (p.causa === 'Negocio' && retenido !== 0) throw Util.error('Con causa Negocio se devuelve todo lo cobrado');
    var h = cr ? Creditos.controlarHuella(p, pl, cr) : '';
    var medios = reem > 0 ? Contab.normalizarMedios(p, reem) : null;
    var saldoCli = cr ? Contab.saldoCliente(pl, cr.id_cliente) : 0;
    var destino = Util.texto(p.destino_saldo_favor) || 'No aplica';
    if (saldoCli > 0 && ['Devolver', 'Aplicar', 'Conservar con decisión documentada'].indexOf(destino) < 0) throw Util.error('El cliente tiene saldo a favor de ' + saldoCli + ' Gs.: indique su destino (Devolver / Aplicar / Conservar con decisión documentada)');
    var rev = { c: 0, f: 0, i: 0, entrega: 0 };
    var dev = pl.add('Devoluciones', { id_venta: v.id_venta, id_equipo: e.id_equipo, id_credito: v.id_credito || '', fecha_hora: pl.ahora, tipo: p.tipo, causa: p.causa, total_cobrado: total, monto_reembolsado: reem, monto_retenido: retenido, motivo: motivo, destino_saldo_favor: destino, autorizado_por: u.email });
    if (cr) {
      var resto = reem, vig = Contab.cobrosVigentes(pl, cr.id_credito).slice().reverse();
      vig.forEach(function (x) {
        if (resto <= 0) return;
        var disp = Util.num(x.monto_aplicado); if (disp <= 0) return;
        var r = Math.min(resto, disp); resto -= r;
        var completo = r === disp, cC = completo ? Util.num(x.capital) : Math.floor(r * Util.num(x.capital) / disp), cF = completo ? Util.num(x.fondo) : Math.floor(r * Util.num(x.fondo) / disp), cI = r - cC - cF;
        var rv = pl.add('Cobros', { id_credito: cr.id_credito, fecha_hora: pl.ahora, tipo: 'Reversa por devolución', id_cobro_revertido: x.id_cobro, id_devolucion: dev.id_devolucion, medio: x.medio, monto_recibido: -r, monto_aplicado: -r, saldo_favor_generado: 0, capital: -cC, fondo: -cF, interes: -cI, responsable: u.email, comentario: motivo });
        var porRev = r;
        pl.filas('Aplicaciones_Cuota').filter(function (ap) { return ap.id_cobro === x.id_cobro && Util.num(ap.monto) > 0; }).reverse().forEach(function (ap) {
          if (porRev <= 0) return; var q = Math.min(porRev, Util.num(ap.monto)); porRev -= q;
          pl.add('Aplicaciones_Cuota', { id_cobro: rv.id_cobro, id_cuota: ap.id_cuota, monto: -q });
        });
        rev.c += cC; rev.f += cF; rev.i += cI;
      });
      rev.entrega = resto;
    }
    dev.revertido_capital = rev.c; dev.revertido_entrega = rev.entrega; dev.revertido_interes = rev.i; dev.revertido_fondo = rev.f;
    var fSale = Math.min(rev.f, Contab.saldoFondo(pl)), faltante = rev.f - fSale;
    if (fSale > 0) Contab.moverFondo(pl, -fSale, 'Devolución de venta', v.id_credito, 'Devoluciones', dev.id_devolucion);
    dev.faltante_fondo = faltante;
    if (faltante > 0) Contab.asiento(pl, 'Faltante de fondo', faltante, 'Devolución', ['Devoluciones', dev.id_devolucion], { id_credito: v.id_credito });
    if (rev.i > 0) Contab.asiento(pl, 'Intereses', -rev.i, 'Devolución', ['Devoluciones', dev.id_devolucion], { id_credito: v.id_credito });
    var aDespues = cr ? Contab.agregadosCredito(pl, cr.id_credito) : { interes_cobrado: 0, fondo_aportado: 0 };
    var danos = retenido - aDespues.interes_cobrado - aDespues.fondo_aportado;
    dev.danos_retenidos = danos;
    if (danos !== 0) Contab.asiento(pl, 'Daños retenidos', danos, 'Devolución', ['Devoluciones', dev.id_devolucion], { id_equipo: e.id_equipo, id_venta: v.id_venta });
    if (reem > 0) Contab.dinero(pl, 'Egreso', 'Reembolso de devolución', medios, 'Devoluciones', dev.id_devolucion, motivo);
    // saldo a favor
    if (saldoCli > 0) {
      if (destino === 'Devolver') {
        var medSaldo = Contab.normalizarMedios({ medios: p.medios_saldo }, saldoCli);
        var ms = Contab.moverSaldoCliente(pl, cr.id_cliente, cr.id_credito, 'Devuelto al cliente', -saldoCli, 'Devoluciones', dev.id_devolucion);
        Contab.dinero(pl, 'Egreso', 'Devolución de saldo a favor', medSaldo, 'Saldo_Cliente', ms.id_mov_saldo, motivo);
      } else if (destino.indexOf('Conservar') === 0) {
        pl.add('Saldo_Cliente', { id_cliente: cr.id_cliente, id_credito: cr.id_credito, fecha_hora: pl.ahora, tipo: 'Conservado por decisión documentada', monto: 0, saldo_posterior: saldoCli, ref_tabla: 'Devoluciones', ref_id: dev.id_devolucion });
      }
    }
    var d = pl.decision('Garantía', 'Devolución de la venta ' + v.id_venta + ' (' + p.tipo + ', causa ' + p.causa + ')', 'Reembolso ' + reem + ' Gs.; retenido ' + retenido + ' Gs.', motivo, e.id_equipo);
    dev.id_decision = d;
    pl.upd('Ventas', v.id_venta, { estado_venta: 'Anulada', id_devolucion: dev.id_devolucion }, false);
    if (cr) {
      pl.add('Eventos_Credito', { id_credito: cr.id_credito, fecha_hora: pl.ahora, tipo: 'Anulación', estado_anterior: cr.estado, estado_nuevo: 'Anulado', motivo: motivo, autorizado_por: u.email, id_decision: d });
      Creditos.tocar(pl, cr.id_credito, { estado: 'Anulado' });
    }
    if (p.tipo === 'Desistimiento') { Equipos.cambiarEstado(pl, e, 'Publicado', 'Desistimiento de la venta ' + v.id_venta); pl.upd('Equipos', e.id_equipo, { cliente: '' }, false); }
    else if (p.equipo_recibido === 'Sí' || p.equipo_recibido === true) { Equipos.cambiarEstado(pl, e, 'Devuelto', 'Devolución de la venta ' + v.id_venta); pl.upd('Equipos', e.id_equipo, { cliente: '' }, false); }
    Contab.asentarEquipos(pl, e.id_equipo, 'Devolución', 'Devoluciones', dev.id_devolucion);
    pl.cache('equipo:' + e.id_equipo);
    pl.resultado = { id_devolucion: dev.id_devolucion, total_cobrado: total, reembolsado: reem, retenido: retenido, revertido_capital: rev.c, revertido_entrega: rev.entrega, revertido_interes: rev.i, revertido_fondo: rev.f, faltante_fondo: faltante, danos_retenidos: danos, interes_que_sigue: aDespues.interes_cobrado, fondo_que_sigue: aDespues.fondo_aportado, ganancia_equipos: Contab.gananciaEquipos(pl, e.id_equipo), huella: h, id_decision: d };
  }
});

definir('registrarIngresoExcepcional', {
  roles: [ROL_ADMIN],
  huella: function (p) { return ['ingresoExcepcional', p.id_credito || '', p.monto].join('|'); },
  planificar: function (p, pl) {
    var monto = Util.entero(p.monto); if (isNaN(monto) || monto <= 0) throw Util.error('El monto debe ser un entero mayor que 0');
    var motivo = Util.texto(p.motivo); if (motivo.length < 10) throw Util.error('El motivo debe tener al menos 10 caracteres');
    var concepto = p.concepto === 'Ingreso excepcional' ? 'Ingreso excepcional' : 'Cobro posterior a incobrable';
    var ref = '';
    if (concepto === 'Cobro posterior a incobrable') {
      var cr = Creditos.obtener(pl, p.id_credito);
      var ev = pl.filas('Eventos_Credito').filter(function (x) { return x.id_credito === cr.id_credito && x.tipo === 'Incobrable'; }).pop();
      if (!ev) throw Util.error('El crédito no tiene un evento Incobrable');
      ref = ev.id_evento;
    }
    var medios = Contab.normalizarMedios(p, monto);
    var d = pl.decision('Procesos', concepto + (ref ? ' (' + ref + ')' : ''), 'Ingreso de ' + monto + ' Gs.', motivo);
    Contab.dinero(pl, 'Ingreso', concepto, medios, ref ? 'Eventos_Credito' : 'Decisiones', ref || d, motivo);
    pl.resultado = { id_decision: d };
  }
});

var SIMULANDO = false;
// Simulaciones: ejecutan el mismo plan sin escribir y devuelven la huella del estado usado
['Cobro:registrarCobro', 'Cancelacion:cancelarAnticipado', 'Incobrable:marcarIncobrable', 'Recuperacion:recuperarEquipo', 'Devolucion:registrarDevolucion', 'Reversa:reversarCobro', 'Condonacion:condonarCredito'].forEach(function (par) {
  var partes = par.split(':'), real = partes[1];
  definir('simular' + partes[0], { roles: [ROL_ADMIN], lectura: true, leer: function (p, u) {
    Datos.reiniciar();
    var pl = new Planificador(u, 'simulacion', real);
    var p2 = Util.copiar(p); p2.huella_simulada = '';
    SIMULANDO = true;
    try { OPS[real].planificar(p2, pl, u); } finally { SIMULANDO = false; }
    var r = pl.resultado || {};
    return r;
  } });
});

// ---------- Lecturas ----------
definir('obtenerCartera', {
  roles: [ROL_ADMIN], lectura: true,
  leer: function () {
    var hoy = Util.hoy();
    return Datos.leer('Creditos').filter(function (c) { return c.estado === 'Abierto'; }).map(function (c) {
      var d = Contab.estadoDerivado(FuenteDatos, c.id_credito, hoy), a = Contab.agregadosCredito(FuenteDatos, c.id_credito);
      var cli = Datos.buscar('Clientes', 'id_cliente', c.id_cliente), e = Datos.buscar('Equipos', 'id_equipo', c.id_equipo);
      var proxima = Datos.filtrar('Cuotas', function (q) { return q.id_credito === c.id_credito && Util.num(q.cubierto) < Util.num(q.monto); }).sort(function (x, y) { return Util.num(x.nro) - Util.num(y.nro); })[0];
      var s = Contab.situacion(FuenteDatos, c.id_equipo);
      return { id_credito: c.id_credito, id_cliente: c.id_cliente, cliente: cli ? cli.nombre : '', contacto: cli ? cli.contacto : '', equipo: e ? e.marca + ' ' + e.modelo : '', estado_derivado: d.estado, cuotas_vencidas: d.cuotas_vencidas, vencido: d.vencido, dias_atraso: d.dias_atraso, deuda: Contab.deuda(a), proxima_cuota: proxima ? { nro: proxima.nro, fecha: proxima.fecha_vencimiento, saldo: Util.num(proxima.monto) - Util.num(proxima.cubierto) } : null, exposicion: Math.max(0, s.C - s.P), version: c.version };
    }).sort(function (x, y) { return y.dias_atraso - x.dias_atraso; });
  }
});

definir('obtenerCredito', {
  roles: [ROL_ADMIN], lectura: true,
  leer: function (p) {
    var c = Datos.buscar('Creditos', 'id_credito', p.id_credito); if (!c) throw Util.error('No existe el crédito');
    var cli = Datos.buscar('Clientes', 'id_cliente', c.id_cliente), a = Contab.agregadosCredito(FuenteDatos, c.id_credito);
    var s = Contab.situacion(FuenteDatos, c.id_equipo);
    var cobros = Datos.filtrar('Cobros', function (x) { return x.id_credito === c.id_credito; });
    return { credito: c, cliente: cli ? { id_cliente: cli.id_cliente, nombre: cli.nombre, contacto: cli.contacto } : null, derivado: Contab.estadoDerivado(FuenteDatos, c.id_credito, Util.hoy()), agregados: a, deuda: Contab.deuda(a), cuotas: Datos.filtrar('Cuotas', function (q) { return q.id_credito === c.id_credito; }), cobros: cobros, eventos: Datos.filtrar('Eventos_Credito', function (x) { return x.id_credito === c.id_credito; }), saldo_a_favor: Contab.saldoCliente(FuenteDatos, c.id_cliente), costo_unidad: s.C, cobrado_precio: s.P, ganancia_equipos: s.G, exposicion: Math.max(0, s.C - s.P), saldo_fondo: Contab.saldoFondo(FuenteDatos), huella: Creditos.huella(FuenteDatos, c), ultimo_cobro_vigente: (Contab.cobrosVigentes(FuenteDatos, c.id_credito).pop() || {}).id_cobro || null };
  }
});

definir('obtenerFondo', {
  roles: [ROL_ADMIN], lectura: true,
  leer: function () {
    var exp = 0;
    Datos.leer('Creditos').forEach(function (c) { if (c.estado === 'Abierto') { var s = Contab.situacion(FuenteDatos, c.id_equipo); exp += Math.max(0, s.C - s.P); } });
    var saldo = Contab.saldoFondo(FuenteDatos);
    return { saldo: saldo, exposicion: exp, cobertura_pct: exp > 0 ? Math.round(saldo * 1000 / exp) / 10 : null, movimientos: Datos.leer('Movimientos_Fondo').slice(-100).reverse() };
  }
});
