// GESTION_CELULARES - Tecnico.gs (Diseno Tecnico 4.25)
// Liquidacion mensual y pago al tecnico.

var Tecnico = {
  pendientes: function (src, tecnico) {
    return src.filas('Costos_Tecnico').filter(function (c) { return c.tecnico === tecnico && !c.id_liquidacion; });
  }
};

definir('liquidarTecnico', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['TEC:' + p.tecnico]; },
  planificar: function (p, pl) {
    var tec = Util.texto(p.tecnico).toLowerCase(), mes = Util.texto(p.mes_liquidado);
    if (!/^\d{4}-\d{2}$/.test(mes)) throw Util.error('Indique el mes a liquidar (AAAA-MM)');
    if (!Contab.mesCerrado(pl, mes)) throw Util.error('La liquidación es posterior al cierre mensual: cierre ' + mes + ' primero');
    var filas = Tecnico.pendientes(pl, tec).filter(function (c) { return c.mes_costo <= mes; });
    if (!filas.length) throw Util.error('No hay costos pendientes de liquidar hasta ' + mes);
    var suma = Util.suma(filas, function (c) { return Util.num(c.monto); }), total = Math.max(0, suma);
    var n = pl.filas('Liquidaciones_Tecnico').filter(function (l) { return l.mes_liquidado === mes; }).length + 1;
    var liq = pl.add('Liquidaciones_Tecnico', { id_liquidacion: 'LIQ-' + mes.replace('-', '') + '-' + Util.rellenar(n, 2), tecnico: tec, mes_liquidado: mes, fecha_creacion: pl.ahora, total: total, estado: 'Creada', autorizado_por: pl.usuario.email, version: 1 });
    filas.forEach(function (c) { pl.upd('Costos_Tecnico', c.id_costo_tecnico, { id_liquidacion: liq.id_liquidacion }, false); });
    var arrastre = 0;
    if (suma < 0) {
      arrastre = suma;
      Contab.devengarTecnico(pl, { tecnico: tec, tipo: 'Ajuste', monto: suma, motivo: 'Saldo de ajustes pendiente arrastrado de ' + liq.id_liquidacion, ref_id: liq.id_liquidacion });
    }
    pl.resultado = { id_liquidacion: liq.id_liquidacion, total: total, costos_incluidos: filas.length, saldo_ajustes_arrastrado: arrastre };
  }
});

definir('pagarLiquidacion', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['LIQ:' + p.id_liquidacion]; },
  huella: function (p) { return ['pagarLiquidacion', p.id_liquidacion].join('|'); },
  planificar: function (p, pl) {
    var l = pl.get('Liquidaciones_Tecnico', p.id_liquidacion); if (!l) throw Util.error('No existe la liquidación');
    if (l.estado !== 'Creada') throw Util.error('La liquidación ya está ' + l.estado);
    var total = Util.num(l.total), idMov = '';
    if (total > 0) {
      var medios = Contab.normalizarMedios(p, total);
      idMov = Contab.dinero(pl, 'Egreso', 'Pago de liquidación del técnico', medios, 'Liquidaciones_Tecnico', l.id_liquidacion, 'Liquidación ' + l.id_liquidacion)[0].id_mov_dinero;
    }
    pl.upd('Liquidaciones_Tecnico', l.id_liquidacion, { estado: 'Pagada', fecha_pago: pl.ahora, id_mov_dinero: idMov }, true);
    pl.resultado = { id_liquidacion: l.id_liquidacion, pagado: total };
  }
});

definir('obtenerPagosTecnicos', {
  roles: [ROL_ADMIN, ROL_TECNICO], lectura: true,
  leer: function (p, u) {
    var admin = Auth.tieneRol(u, [ROL_ADMIN]);
    var porTec = {};
    Datos.leer('Costos_Tecnico').forEach(function (c) {
      if (!admin && c.tecnico !== u.email) return;
      var t = porTec[c.tecnico] = porTec[c.tecnico] || { tecnico: c.tecnico, pendiente: 0, incluido: 0, pagado: 0, saldo_ajustes: 0, filas: [] };
      var liq = c.id_liquidacion ? Datos.buscar('Liquidaciones_Tecnico', 'id_liquidacion', c.id_liquidacion) : null;
      var estado = !liq ? 'Pendiente de liquidación' : (liq.estado === 'Pagada' ? 'Pagado' : 'Incluido en liquidación');
      if (estado === 'Pendiente de liquidación') t.pendiente += Util.num(c.monto); else if (estado === 'Pagado') t.pagado += Util.num(c.monto); else t.incluido += Util.num(c.monto);
      t.filas.push({ id_costo_tecnico: c.id_costo_tecnico, fecha_hora: c.fecha_hora, mes_costo: c.mes_costo, tipo: c.tipo, monto: c.monto, motivo: c.motivo, id_reparacion: c.id_reparacion, id_equipo: c.id_equipo, id_orden: c.id_orden, estado: estado, id_liquidacion: c.id_liquidacion });
    });
    var lista = Object.keys(porTec).map(function (k) { var t = porTec[k]; t.saldo_ajustes = t.pendiente < 0 ? t.pendiente : 0; return t; });
    var liqs = Datos.leer('Liquidaciones_Tecnico').filter(function (l) { return admin || l.tecnico === u.email; });
    return { tecnicos: lista, liquidaciones: liqs, cierres: Datos.leer('Cierres_Mensuales').map(function (c) { return c.mes; }) };
  }
});
