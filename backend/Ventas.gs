// GESTION_CELULARES - Ventas.gs (Diseno Tecnico 3.7, 4.18, 4.28)
// Venta de contado, venta a credito, entrega, cierre de garantia, reclamos.

var Ventas = {
  chequearTarifasPendientes: function (pl, idEquipo) {
    var p = pl.filas('Reparaciones').filter(function (r) { return r.id_equipo === idEquipo && (r.estado_tarifa === 'Pendiente de aprobación' || r.estado_tarifa === 'Devuelta'); });
    if (p.length) throw Util.error('La unidad tiene una tarifa de técnico sin aprobar (' + p[0].id_reparacion + '): aprobá la tarifa primero');
  },
  cliente: function (pl, id) {
    var c = pl.get('Clientes', id); if (!c) throw Util.error('El cliente no existe'); return c;
  },
  validarVendible: function (pl, e) {
    if (['Publicado', 'Reservado'].indexOf(e.estado) < 0) throw Util.error('Solo se vende una unidad Publicada o Reservada (estado actual: ' + e.estado + ')');
    Ventas.chequearTarifasPendientes(pl, e.id_equipo);
  },
  // Falta de datos para abrir credito (Seccion 3.8)
  faltantesCredito: function (c) {
    var f = [];
    if (c.ficha_credito_completa !== 'Sí') f.push('ficha de crédito completa');
    return f;
  },
  edad: function (nacimiento, hoy) {
    var a = String(nacimiento).substring(0, 10).split('-'), h = hoy.split('-');
    var e = +h[0] - +a[0]; if (+h[1] < +a[1] || (+h[1] === +a[1] && +h[2] < +a[2])) e--; return e;
  },
  precioFijadoVigente: function (e) { return e.precio_fijado === '' ? '' : e.precio_fijado; }
};

definir('registrarVenta', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['EQ:' + p.id_equipo]; },
  planificar: function (p, pl, u) {
    var e = Equipos.obtener(pl, p.id_equipo); Equipos.verificarVersion(e, p.version);
    Ventas.validarVendible(pl, e);
    var cli = Ventas.cliente(pl, p.id_cliente);
    var precio = Util.entero(p.precio_venta); if (isNaN(precio) || precio <= 0) throw Util.error('El precio de venta debe ser un entero mayor que 0');
    var garantia = p.garantia_dias === undefined || p.garantia_dias === '' ? Number(Config.valor('dias_garantia_default')) : Util.entero(p.garantia_dias);
    if (isNaN(garantia) || garantia < 0) throw Util.error('Los días de garantía deben ser un entero mayor o igual a 0');
    if (['Facebook Marketplace', 'WhatsApp', 'Tienda física', 'Otro'].indexOf(p.canal_venta) < 0) throw Util.error('Indique el canal de venta');
    var medios = Contab.normalizarMedios(p, precio);
    var v = pl.add('Ventas', { id_equipo: e.id_equipo, fecha_venta: pl.ahora, cliente: cli.id_cliente, precio_venta: precio, canal_venta: p.canal_venta, garantia_dias: garantia, tipo_venta: 'Contado', entrega_inicial: precio, id_credito: '', estado_venta: 'Vigente', estado_garantia: '', precio_fijado_vigente: Ventas.precioFijadoVigente(e), responsable: u.email });
    Contab.dinero(pl, 'Ingreso', 'Venta de contado', medios, 'Ventas', v.id_venta, '');
    pl.upd('Equipos', e.id_equipo, { cliente: cli.id_cliente }, false);
    Equipos.cambiarEstado(pl, e, 'Vendido', 'Venta de contado ' + v.id_venta + ' por ' + precio + ' Gs.');
    Contab.asentarEquipos(pl, e.id_equipo, 'Venta', 'Ventas', v.id_venta);
    pl.cache('equipo:' + e.id_equipo);
    var fijado = Util.num(e.precio_fijado);
    pl.resultado = { id_venta: v.id_venta, precio_venta: precio, precio_fijado: fijado || null, diferencia_vs_fijado: fijado ? precio - fijado : null, diferencia_pct: fijado ? Math.round((precio - fijado) * 1000 / fijado) / 10 : null, ganancia_equipos: Contab.gananciaEquipos(pl, e.id_equipo), version: Util.num(e.version) + 1 };
  }
});

definir('registrarVentaCredito', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['EQ:' + p.id_equipo, 'CLI:' + p.id_cliente]; },
  planificar: function (p, pl, u) {
    var e = Equipos.obtener(pl, p.id_equipo); Equipos.verificarVersion(e, p.version);
    Ventas.validarVendible(pl, e);
    var cli = Ventas.cliente(pl, p.id_cliente);
    var cfg = Config.todo();
    var precio = Util.entero(p.precio), entrega = p.entrega_inicial === undefined || p.entrega_inicial === '' ? 0 : Util.entero(p.entrega_inicial);
    var cuota = Util.entero(p.cuota_monto), n = Util.entero(p.cantidad_cuotas);
    if (isNaN(precio) || precio <= 0) throw Util.error('El precio debe ser un entero mayor que 0');
    if (isNaN(entrega) || entrega < 0 || entrega >= precio) throw Util.error('La entrega inicial debe ser mayor o igual a 0 y menor que el precio (si iguala al precio es una venta de contado)');
    if (isNaN(n) || n < 1 || n > cfg.max_cuotas) throw Util.error('La cantidad de cuotas debe estar entre 1 y ' + cfg.max_cuotas);
    if (isNaN(cuota) || cuota <= 0) throw Util.error('El monto de la cuota debe ser un entero mayor que 0');
    if (['Semanal', 'Quincenal', 'Mensual'].indexOf(p.frecuencia) < 0) throw Util.error('Indique la frecuencia de las cuotas');
    if (!p.fecha_primera_cuota || String(p.fecha_primera_cuota).substring(0, 10) <= Util.hoy()) throw Util.error('La primera cuota debe vencer después de hoy');
    if (['Facebook Marketplace', 'WhatsApp', 'Tienda física', 'Otro'].indexOf(p.canal_venta) < 0) throw Util.error('Indique el canal de venta');
    var garantia = p.garantia_dias === undefined || p.garantia_dias === '' ? cfg.dias_garantia_default : Util.entero(p.garantia_dias);
    if (isNaN(garantia) || garantia < 0) throw Util.error('Los días de garantía deben ser un entero mayor o igual a 0');
    var faltan = Ventas.faltantesCredito(cli);
    if (cli.ficha_credito_completa === 'Sí') {
      if (Ventas.edad(cli.fecha_nacimiento, Util.hoy()) < 18) faltan.push('el cliente debe tener 18 años o más');
    }
    if (faltan.length) { var er = Util.error('No se puede abrir el crédito. Falta: ' + faltan.join(', ')); er.codigo = 'ficha_incompleta'; throw er; }
    var cr0 = { precio: precio, entrega: entrega, cuota: cuota, n: n, cfg: { capBps: cfg.pct_capital_bps, fondoBps: cfg.pct_fondo_bps, topeFondoBps: cfg.tope_fondo_bps } };
    var sim;
    try { sim = M.abrirCredito(cr0); } catch (ex) { throw Util.error(ex.message === 'interes negativo: error de carga' ? 'La deuda total (cuota × cantidad) es menor que el capital financiado: revise las cifras' : ex.message); }
    var medios = entrega > 0 ? Contab.normalizarMedios(p, entrega) : null;
    var cr = pl.add('Creditos', { id_venta: '', id_equipo: e.id_equipo, id_cliente: cli.id_cliente, fecha_apertura: pl.ahora, precio: precio, entrega_inicial: entrega, capital_financiado: sim.capitalFin, cuota_monto: cuota, cantidad_cuotas: n, frecuencia: p.frecuencia, fecha_primera_cuota: String(p.fecha_primera_cuota).substring(0, 10), deuda_total: sim.deuda, interes_bruto: sim.interesBruto, tope_fondo: sim.tope, pct_capital_bps: cfg.pct_capital_bps, pct_fondo_bps: cfg.pct_fondo_bps, estado: 'Abierto', pendiente_capital: sim.pend.capital, pendiente_fondo: sim.pend.fondo, pendiente_interes: sim.pend.interes, cobrado_precio: entrega, interes_cobrado: 0, fondo_aportado: 0, descuento_total: 0, version: 1 });
    var v = pl.add('Ventas', { id_equipo: e.id_equipo, fecha_venta: pl.ahora, cliente: cli.id_cliente, precio_venta: precio, canal_venta: p.canal_venta, garantia_dias: garantia, tipo_venta: 'Crédito', entrega_inicial: entrega, id_credito: cr.id_credito, estado_venta: 'Vigente', precio_fijado_vigente: Ventas.precioFijadoVigente(e), responsable: u.email });
    cr.id_venta = v.id_venta;
    for (var k = 0; k < n; k++) pl.add('Cuotas', { id_credito: cr.id_credito, nro: k + 1, fecha_vencimiento: Util.fechaCuota(String(p.fecha_primera_cuota).substring(0, 10), p.frecuencia, k), monto: cuota, cubierto: 0 });
    pl.add('Eventos_Credito', { id_credito: cr.id_credito, fecha_hora: pl.ahora, tipo: 'Apertura', estado_anterior: '', estado_nuevo: 'Abierto', motivo: '' });
    if (entrega > 0) Contab.dinero(pl, 'Ingreso', 'Entrega inicial', medios, 'Ventas', v.id_venta, '');
    pl.upd('Equipos', e.id_equipo, { cliente: cli.id_cliente }, false);
    Equipos.cambiarEstado(pl, e, 'Vendido', 'Venta a crédito ' + v.id_venta + ' por ' + precio + ' Gs., entrega ' + entrega);
    Contab.asentarEquipos(pl, e.id_equipo, 'Venta', 'Ventas', v.id_venta);
    pl.cache('equipo:' + e.id_equipo); pl.cache('credito:' + cr.id_credito);
    pl.resultado = { id_venta: v.id_venta, id_credito: cr.id_credito, deuda_total: sim.deuda, interes_bruto: sim.interesBruto, tope_fondo: sim.tope, version: Util.num(e.version) + 1 };
  }
});

definir('entregarEquipo', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['EQ:' + p.id_equipo]; },
  planificar: function (p, pl, u) {
    var e = Equipos.obtener(pl, p.id_equipo); Equipos.verificarVersion(e, p.version);
    if (e.estado !== 'Vendido') throw Util.error('Solo se entrega una unidad Vendida');
    var v = Contab.ventaVigente(pl, e.id_equipo); if (!v) throw Util.error('La unidad no tiene una venta vigente');
    Equipos.cambiarEstado(pl, e, 'Entregado', 'Entrega al cliente de la venta ' + v.id_venta);
    pl.add('Historial_Estados', { id_equipo: e.id_equipo, fecha_hora: pl.ahora, estado_anterior: 'Entregado', estado_nuevo: 'En garantía', responsable: u.email, comentario: 'Comienza la garantía (' + v.garantia_dias + ' días)' });
    pl.upd('Equipos', e.id_equipo, { estado: 'En garantía' }, false);
    pl.upd('Ventas', v.id_venta, { estado_garantia: 'Activa', fecha_entrega: pl.ahora }, false);
    pl.resultado = { id_equipo: e.id_equipo, estado: 'En garantía', garantia_hasta: Util.sumarDias(Util.hoy(), Util.num(v.garantia_dias)), version: Util.num(e.version) + 1 };
  }
});

definir('cerrarPorVencimiento', {
  roles: [ROL_SOPORTE, ROL_ADMIN],
  registros: function (p) { return ['EQ:' + p.id_equipo]; },
  planificar: function (p, pl) {
    var e = Equipos.obtener(pl, p.id_equipo); Equipos.verificarVersion(e, p.version);
    if (e.estado !== 'En garantía') throw Util.error('La unidad no está En garantía');
    var v = Contab.ventaVigente(pl, e.id_equipo);
    var hasta = Util.sumarDias(String(v.fecha_entrega).substring(0, 10), Util.num(v.garantia_dias));
    if (Util.hoy() <= hasta) throw Util.error('La garantía vence el ' + hasta + ': todavía no se puede cerrar');
    if (pl.filas('Reparaciones').some(function (r) { return r.id_equipo === e.id_equipo && r.origen === 'Garantía o retrabajo' && !r.fecha_fin; })) throw Util.error('Hay un trabajo de garantía en curso');
    Equipos.cambiarEstado(pl, e, 'Cerrado por venta', 'Garantía vencida sin novedades');
    pl.upd('Ventas', v.id_venta, { estado_garantia: 'Expirada' }, false);
    pl.resultado = { id_equipo: e.id_equipo, estado: 'Cerrado por venta' };
  }
});

definir('rechazarReclamo', {
  roles: [ROL_SOPORTE, ROL_ADMIN],
  planificar: function (p, pl) {
    var e = Equipos.obtener(pl, p.id_equipo);
    if (e.estado !== 'En garantía') throw Util.error('Solo se rechaza un reclamo de una unidad En garantía');
    var motivo = Util.texto(p.motivo); if (motivo.length < 10) throw Util.error('El motivo debe tener al menos 10 caracteres');
    var d = pl.decision('Garantía', 'Reclamo de garantía de ' + e.id_equipo, 'Reclamo rechazado', motivo, e.id_equipo);
    pl.resultado = { id_decision: d };
  }
});

definir('simularCredito', {
  roles: [ROL_ADMIN], lectura: true,
  leer: function (p) {
    var cfg = Config.todo();
    var precio = Util.entero(p.precio), entrega = p.entrega_inicial === undefined || p.entrega_inicial === '' ? 0 : Util.entero(p.entrega_inicial), cuota = Util.entero(p.cuota_monto), n = Util.entero(p.cantidad_cuotas);
    if (isNaN(precio) || isNaN(entrega) || isNaN(cuota) || isNaN(n)) throw Util.error('Complete precio, entrega, cuota y cantidad de cuotas con números enteros');
    var c;
    try { c = M.abrirCredito({ precio: precio, entrega: entrega, cuota: cuota, n: n, cfg: { capBps: cfg.pct_capital_bps, fondoBps: cfg.pct_fondo_bps, topeFondoBps: cfg.tope_fondo_bps } }); } catch (ex) { throw Util.error(ex.message === 'interes negativo: error de carga' ? 'La deuda total (cuota × cantidad) es menor que el capital financiado' : 'Revise las cifras: ' + ex.message); }
    if (n > cfg.max_cuotas) throw Util.error('Máximo ' + cfg.max_cuotas + ' cuotas');
    var tabla = [];
    for (var k = 1; k <= n; k++) { var cb = M.cobrar(c, 'sim' + k, cuota); tabla.push({ nro: k, capital: cb.c, fondo: cb.f, interes: cb.i }); }
    var costo = null, recupera = null;
    if (p.id_equipo) { var e = Datos.buscar('Equipos', 'id_equipo', p.id_equipo); if (e) { costo = Contab.costoTotal(FuenteDatos, e.id_equipo); recupera = Math.min(entrega, costo); } }
    return { capital_financiado: precio - entrega, deuda_total: cuota * n, interes_bruto: cuota * n - (precio - entrega), tope_fondo: c.tope, interes_neto_del_fondo: (cuota * n - (precio - entrega)) - c.tope, aviso_interes_primera_cuota: (cuota - Util.pct(cuota, cfg.pct_capital_bps)) >= (cuota * n - (precio - entrega)), costo_unidad: costo, recupera_con_entrega: recupera, recupera_pct: costo ? Math.round(recupera * 1000 / costo) / 10 : null, tabla: tabla };
  }
});
