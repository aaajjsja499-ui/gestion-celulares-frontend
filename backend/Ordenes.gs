// GESTION_CELULARES - Ordenes.gs (Diseno Tecnico 3.26, 3.27, 4.24)
// Servicio tecnico a terceros: el equipo del cliente no es inventario.

var TRANS_ORDEN = {
  'Recibida': ['En diagnóstico', 'Cancelada'],
  'En diagnóstico': ['En reparación', 'Esperando repuestos', 'Lista', 'No reparada', 'Cancelada'],
  'En reparación': ['Esperando repuestos', 'Lista', 'No reparada', 'Cancelada'],
  'Esperando repuestos': ['En reparación', 'No reparada', 'Cancelada'],
  'Lista': [], 'No reparada': [], 'Cancelada': [], 'Entregada': []
};
var ESTADOS_CIERRE_ORDEN = ['Lista', 'No reparada', 'Cancelada'];

var Ordenes = {
  obtener: function (src, id) { var o = src.get('Ordenes_Servicio', id); if (!o) throw Util.error('No existe la orden ' + id); return o; },
  verificarVersion: function (o, v) { if (v !== undefined && Util.entero(v) !== Util.num(o.version)) throw Util.error('La orden cambió. Actualice la pantalla.'); },
  costo: function (src, idOrden) {
    var rep = Util.suma(src.filas('Repuestos_Usados').filter(function (u) { return u.id_orden === idOrden; }), function (u) { return Util.num(u.costo_total_aplicado); });
    var tar = Util.suma(src.filas('Reparaciones').filter(function (r) { return r.id_orden === idOrden; }), function (r) { return Util.num(r.tarifa_trabajo); });
    var ajustes = Util.suma(src.filas('Costos_Tecnico').filter(function (c) { return c.id_orden === idOrden && c.tipo === 'Ajuste'; }), function (c) { return Util.num(c.monto); });
    return { repuestos: rep, tarifa: tar + ajustes, total: rep + tar + ajustes };
  },
  historial: function (pl, o, nuevo, com) {
    pl.add('Historial_Ordenes', { id_orden: o.id_orden, fecha_hora: pl.ahora, estado_anterior: o.estado, estado_nuevo: nuevo, responsable: pl.usuario.email, comentario: com });
  }
};

definir('crearOrden', {
  roles: [ROL_ADMIN, ROL_SOPORTE],
  planificar: function (p, pl, u) {
    var cli = Ventas.cliente(pl, p.id_cliente);
    var desc = Util.texto(p.equipo_descripcion), falla = Util.texto(p.falla_reportada);
    if (!desc) throw Util.error('Describa el equipo (marca, modelo, color, accesorios)');
    if (!falla) throw Util.error('Indique la falla reportada');
    var origen = Util.texto(p.id_orden_origen), garantia = '';
    if (origen) {
      var oo = Ordenes.obtener(pl, origen);
      if (oo.estado !== 'Entregada' || !oo.garantia_hasta) throw Util.error('Solo se reclama la garantía de una orden entregada');
      if (Util.hoy() > String(oo.garantia_hasta).substring(0, 10)) throw Util.error('La garantía de esa orden venció el ' + String(oo.garantia_hasta).substring(0, 10));
      garantia = origen;
    } else if (!Auth.tieneRol(u, [ROL_ADMIN])) throw Util.error('Solo el Administrador abre una orden nueva (Soporte abre órdenes de garantía)');
    var o = pl.add('Ordenes_Servicio', { id_cliente: cli.id_cliente, equipo_descripcion: desc, equipo_identificador: Util.texto(p.equipo_identificador), falla_reportada: falla, estado: 'Recibida', fecha_recepcion: pl.ahora, anticipos_recibidos: 0, id_orden_origen: garantia, version: 1 });
    pl.add('Historial_Ordenes', { id_orden: o.id_orden, fecha_hora: pl.ahora, estado_anterior: '', estado_nuevo: 'Recibida', responsable: u.email, comentario: 'Equipo recibido' + (garantia ? ' (reclamo de garantía de ' + garantia + ')' : '') });
    pl.resultado = { id_orden: o.id_orden };
  }
});

definir('transicionarOrden', {
  roles: [ROL_ADMIN, ROL_TECNICO],
  registros: function (p) { return ['ORD:' + p.id_orden]; },
  planificar: function (p, pl, u) {
    var o = Ordenes.obtener(pl, p.id_orden); Ordenes.verificarVersion(o, p.version);
    var nuevo = p.estado_nuevo;
    if (!TRANS_ORDEN[o.estado] || TRANS_ORDEN[o.estado].indexOf(nuevo) < 0) throw Util.error('Transición no permitida: ' + o.estado + ' → ' + nuevo);
    if (nuevo === 'En reparación' && o.estado !== 'Esperando repuestos') throw Util.error('El trabajo se inicia con iniciarReparacion');
    if (nuevo === 'Cancelada' && !Auth.tieneRol(u, [ROL_ADMIN])) throw Util.error('Solo el Administrador cancela una orden');
    var com = Util.texto(p.comentario); if (com.length < 3) throw Util.error('El comentario es obligatorio');
    if (ESTADOS_CIERRE_ORDEN.indexOf(nuevo) >= 0) {
      var reps = pl.filas('Reparaciones').filter(function (r) { return r.id_orden === o.id_orden; });
      if (reps.some(function (r) { return !r.fecha_fin; })) throw Util.error('Hay un trabajo en curso: complételo (aunque sea sin trabajos hechos) antes de cerrar la orden');
      if (reps.some(function (r) { return r.estado_tarifa === 'Pendiente de aprobación' || r.estado_tarifa === 'Devuelta'; })) throw Util.error('La orden tiene una tarifa de técnico sin aprobar: la Administración debe aprobarla antes de cerrar');
      if (nuevo === 'Lista' && reps.length && reps.every(function (r) { return r.resultado === 'No reparado'; })) throw Util.error('Todos los trabajos fueron No reparado: use el estado No reparada');
      if (!o.fecha_cierre_trabajo) {
        var c = Ordenes.costo(pl, o.id_orden);
        Contab.asiento(pl, 'Servicio técnico', -c.total, 'Orden cerrada', ['Ordenes_Servicio', o.id_orden], { id_orden: o.id_orden });
        pl.upd('Ordenes_Servicio', o.id_orden, { fecha_cierre_trabajo: pl.ahora }, false);
      }
    }
    Ordenes.historial(pl, o, nuevo, com);
    pl.upd('Ordenes_Servicio', o.id_orden, { estado: nuevo }, true);
    pl.resultado = { id_orden: o.id_orden, estado: nuevo, version: Util.num(o.version) + 1 };
  }
});

definir('registrarRepuestoDeOrden', {
  roles: [ROL_ADMIN, ROL_TECNICO],
  registros: function (p) { return ['ORD:' + p.id_orden]; },
  planificar: function (p, pl) {
    var o = Ordenes.obtener(pl, p.id_orden);
    if (['En diagnóstico', 'En reparación', 'Esperando repuestos'].indexOf(o.estado) < 0) throw Util.error('La orden no admite repuestos en el estado ' + o.estado);
    var r = Taller.reparacion(pl, p.id_reparacion);
    if (r.id_orden !== o.id_orden || r.fecha_fin) throw Util.error('El trabajo no pertenece a la orden o ya está cerrado');
    Taller.lineasRepuesto(pl, [{ id_repuesto: p.id_repuesto, cantidad: p.cantidad }], { id_reparacion: r.id_reparacion, id_orden: o.id_orden });
    pl.resultado = { ok: true };
  }
});

definir('registrarAnticipoOrden', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['ORD:' + p.id_orden]; },
  huella: function (p) { return ['anticipo', p.id_orden, p.monto].join('|'); },
  planificar: function (p, pl) {
    var o = Ordenes.obtener(pl, p.id_orden);
    if (['Recibida', 'En diagnóstico', 'En reparación', 'Esperando repuestos', 'Lista', 'No reparada'].indexOf(o.estado) < 0) throw Util.error('La orden no admite anticipos en el estado ' + o.estado);
    if (o.cobro_final !== '' && o.cobro_final !== undefined) throw Util.error('El cobro final ya está fijado');
    var monto = Util.entero(p.monto); if (isNaN(monto) || monto <= 0) throw Util.error('El monto debe ser un entero mayor que 0');
    var medios = Contab.normalizarMedios(p, monto);
    Contab.dinero(pl, 'Ingreso', 'Anticipo de servicio técnico', medios, 'Ordenes_Servicio', o.id_orden, '');
    pl.cache('orden:' + o.id_orden);
    pl.resultado = { id_orden: o.id_orden, anticipos: Contab.anticiposOrden(pl, o.id_orden) };
  }
});

definir('entregarOrden', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['ORD:' + p.id_orden]; },
  planificar: function (p, pl, u) {
    var o = Ordenes.obtener(pl, p.id_orden); Ordenes.verificarVersion(o, p.version);
    if (ESTADOS_CIERRE_ORDEN.indexOf(o.estado) < 0) throw Util.error('Solo se entrega una orden Lista, No reparada o Cancelada');
    var cobro = Util.entero(p.cobro_final); if (isNaN(cobro) || cobro < 0) throw Util.error('El cobro final debe ser un entero mayor o igual a 0 (puede ser 0)');
    if (o.id_orden_origen && cobro !== 0) throw Util.error('Un reclamo de garantía se atiende sin cobro');
    var anticipos = Contab.anticiposOrden(pl, o.id_orden);
    var c = M.cobroOrden({ cobro_final: cobro, anticipos: anticipos });
    var idDec = '';
    if (o.estado !== 'Lista' && (cobro > 0 || anticipos > 0)) {
      var motivo = Util.texto(p.motivo); if (motivo.length < 10) throw Util.error('En una orden ' + o.estado + ' con cobro o anticipo, indique el motivo (mínimo 10 caracteres)');
      idDec = pl.decision('Servicio técnico', 'Orden ' + o.id_orden + ' ' + o.estado + ' con anticipos de ' + anticipos + ' Gs.', 'Cobro final fijado en ' + cobro + ' Gs.', motivo);
    }
    if (c.saldo > 0) Contab.dinero(pl, 'Ingreso', 'Cobro de servicio técnico', Contab.normalizarMedios(p, c.saldo), 'Ordenes_Servicio', o.id_orden, '');
    if (c.devolucion > 0) Contab.dinero(pl, 'Egreso', 'Devolución de anticipo', Contab.validarMedios(p.medios_devolucion || p.medios, c.devolucion), 'Ordenes_Servicio', o.id_orden, 'Devolución de anticipo');
    Contab.asiento(pl, 'Servicio técnico', c.asiento, 'Cobro de orden', ['Ordenes_Servicio', o.id_orden], { id_orden: o.id_orden });
    var garantia = o.estado === 'Lista' ? Util.sumarDias(Util.hoy(), Number(Config.valor('dias_garantia_servicio'))) : '';
    Ordenes.historial(pl, o, 'Entregada', 'Entrega al cliente. Cobro final ' + cobro + ' Gs.');
    pl.upd('Ordenes_Servicio', o.id_orden, { estado: 'Entregada', fecha_entrega: pl.ahora, cobro_final: cobro, medio_cobro: c.saldo > 0 ? 'Cobrado' : 'Sin cobro', garantia_hasta: garantia, id_decision: idDec }, true);
    pl.cache('orden:' + o.id_orden);
    pl.resultado = { id_orden: o.id_orden, asiento: c.asiento, saldo_cobrado: c.saldo, anticipo_devuelto: c.devolucion, garantia_hasta: garantia, costo: Ordenes.costo(pl, o.id_orden).total };
  }
});

definir('obtenerOrdenes', {
  roles: [ROL_ADMIN, ROL_TECNICO, ROL_SOPORTE], lectura: true,
  leer: function (p, u) {
    var hoy = Util.hoy(), alerta = Number(Config.valor('dias_alerta_orden_sin_retirar')), aband = Number(Config.valor('dias_abandono_orden'));
    var admin = Auth.tieneRol(u, [ROL_ADMIN]);
    return Datos.leer('Ordenes_Servicio').map(function (o) {
      var cli = Datos.buscar('Clientes', 'id_cliente', o.id_cliente), c = Ordenes.costo(FuenteDatos, o.id_orden);
      var sinRetirar = ESTADOS_CIERRE_ORDEN.indexOf(o.estado) >= 0 && o.fecha_cierre_trabajo ? Util.diasEntre(o.fecha_cierre_trabajo, hoy) : 0;
      var r = { orden: o, cliente: cli ? { nombre: cli.nombre, contacto: cli.contacto } : null, reparaciones: Datos.filtrar('Reparaciones', function (x) { return x.id_orden === o.id_orden; }).map(function (x) { return { id_reparacion: x.id_reparacion, fecha_fin: x.fecha_fin, estado_tarifa: x.estado_tarifa, resultado: x.resultado, tecnico: x.tecnico, version: x.version }; }), dias_sin_retirar: sinRetirar, alerta_sin_retirar: sinRetirar >= alerta, posible_abandono: sinRetirar >= aband, anticipos: Contab.anticiposOrden(FuenteDatos, o.id_orden) };
      if (admin) r.costo = c;
      return r;
    });
  }
});
