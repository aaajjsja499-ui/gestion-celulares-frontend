// GESTION_CELULARES - Cierre.gs (Diseno Tecnico 4.28)
// Cierre mensual: fotografia de los saldos, ajuste de caja contra el conteo fisico.

function mesAnterior(mes) {
  var p = mes.split('-'), y = +p[0], m = +p[1] - 1;
  if (m === 0) { y--; m = 12; }
  return y + '-' + Util.rellenar(m, 2);
}
function mesSiguiente(mes) {
  var p = mes.split('-'), y = +p[0], m = +p[1] + 1;
  if (m === 13) { y++; m = 1; }
  return y + '-' + Util.rellenar(m, 2);
}

definir('cerrarMes', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['CIERRE:' + p.mes]; },
  planificar: function (p, pl) {
    var mes = Util.texto(p.mes);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw Util.error('Indique el mes a cerrar (AAAA-MM)');
    if (mes >= Util.mes(pl.ahora)) throw Util.error('Solo se cierra un mes ya terminado');
    if (Contab.mesCerrado(pl, mes)) throw Util.error('El mes ' + mes + ' ya está cerrado');
    var cierres = pl.filas('Cierres_Mensuales').map(function (c) { return c.mes; }).sort();
    if (cierres.length && mes !== mesSiguiente(cierres[cierres.length - 1])) throw Util.error('El siguiente mes a cerrar es ' + mesSiguiente(cierres[cierres.length - 1]));
    var pend = pl.filas('Reparaciones').filter(function (r) { return (r.estado_tarifa === 'Pendiente de aprobación' || r.estado_tarifa === 'Devuelta') && Util.mes(r.fecha_fin || r.fecha_inicio) <= mes; });
    if (pend.length) throw Util.error('Hay ' + pend.length + ' tarifas de técnico sin aprobar o devueltas hasta ' + mes + ': ' + pend.map(function (r) { return r.id_reparacion; }).join(', '));
    var abiertas = pl.filas('Operaciones').filter(function (o) { return o.estado === 'Iniciada'; });
    if (abiertas.length) throw Util.error('Hay operaciones interrumpidas pendientes (' + abiertas.map(function (o) { return o.id_operacion; }).join(', ') + '): resuélvalas en Operaciones pendientes antes de cerrar');
    var bloq = pl.filas('Registros_Bloqueados').filter(function (b) { return b.activo === 'Sí'; });
    if (bloq.length) throw Util.error('Hay registros bloqueados por diferencia: resuélvalos antes de cerrar');
    var difs = Invariantes.verificarTodo(pl);
    if (difs.length) throw Util.error('Los invariantes no cuadran (' + difs.length + '): ' + difs[0].detalle);
    var libro = Contab.dineroDisponible(pl), contado = p.dinero_contado === undefined || p.dinero_contado === '' ? undefined : Util.entero(p.dinero_contado);
    if (contado !== undefined && (isNaN(contado) || contado < 0)) throw Util.error('El dinero contado debe ser un entero mayor o igual a 0');
    var c = M.cerrarMes({ dineroLibro: libro, dineroContado: contado });
    var idCierre = 'CIE-' + mes.replace('-', '');
    if (c.ajusteCaja !== 0) {
      var motivo = Util.texto(p.motivo_ajuste); if (motivo.length < 10) throw Util.error('Hay diferencia de caja de ' + c.ajusteCaja + ' Gs.: indique el motivo (mínimo 10 caracteres) y el medio');
      var medios = Contab.validarMedios([{ medio: p.medio_ajuste, monto: Math.abs(c.ajusteCaja) }], Math.abs(c.ajusteCaja));
      var idDec = pl.decision('Caja', 'Cierre ' + mes + ': dinero contado ' + contado + ' vs libro ' + libro, 'Ajuste de ' + c.ajusteCaja + ' Gs.', motivo);
      Contab.dinero(pl, c.ajusteCaja > 0 ? 'Ingreso' : 'Egreso', 'Ajuste de cierre', medios, 'Cierres_Mensuales', idCierre, motivo);
      pl.add('Cierres_Excepciones', { id_cierre: idCierre, tipo: 'Ajuste de caja', ref_tabla: 'Decisiones', ref_id: idDec, importe: c.ajusteCaja, motivo: motivo, saldo_antes: libro, saldo_despues: c.dineroFinal });
    }
    var suma = function (renglon) {
      return Util.suma(pl.filas('Asientos_Ganancia').filter(function (a) { return a.renglon === renglon && Util.mes(a.fecha_hora) === mes; }), function (a) { return Util.num(a.delta); });
    };
    var final = Contab.dineroDisponible(pl);
    pl.add('Cierres_Mensuales', { id_cierre: idCierre, mes: mes, fecha_hora: pl.ahora, responsable: pl.usuario.email, dinero_antes_ajuste: libro, ajuste_caja: c.ajusteCaja, dinero_disponible: final, cuentas_por_cobrar: Contab.cuentasPorCobrar(pl), saldo_fondo: Contab.saldoFondo(pl), saldos_a_favor: Contab.saldosAFavorTotal(pl), tecnico_a_pagar: Contab.tecnicoAPagar(pl), capital_libre: Contab.capitalLibre(pl), ganancia_equipos: suma('Equipos'), ganancia_intereses: suma('Intereses'), ganancia_servicio_tecnico: suma('Servicio técnico'), danos_retenidos: suma('Daños retenidos'), bajas_inventario: suma('Baja de inventario'), faltantes_fondo: suma('Faltante de fondo'), recuperado_incobrables: 0, dinero_contado: contado === undefined ? '' : contado, diferencias: c.ajusteCaja, revisado_por: pl.usuario.email });
    pl.resultado = { id_cierre: idCierre, mes: mes, ajuste_caja: c.ajusteCaja, dinero_disponible: final };
  }
});

definir('obtenerCierres', {
  roles: [ROL_ADMIN], lectura: true,
  leer: function () {
    var ult = Datos.leer('Cierres_Mensuales').map(function (c) { return c.mes; }).sort();
    return { cierres: Datos.leer('Cierres_Mensuales'), excepciones: Datos.leer('Cierres_Excepciones'), siguiente: ult.length ? mesSiguiente(ult[ult.length - 1]) : null };
  }
});
