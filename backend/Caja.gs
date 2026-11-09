// GESTION_CELULARES - Caja.gs (Diseno Tecnico 4.26 a 4.30)
// Ajustes de caja, traslados entre medios, gastos operativos y lecturas de caja.

var CATEGORIAS_GASTO = ['Alquiler', 'Servicios', 'Sueldos', 'Transporte', 'Publicidad', 'Comisión de medio de pago', 'Impuestos', 'Herramientas', 'Otros'];

definir('ajustarCaja', {
  roles: [ROL_ADMIN],
  huella: function (p) { return ['ajustarCaja', p.medio, p.tipo, p.monto].join('|'); },
  planificar: function (p, pl) {
    var monto = Util.entero(p.monto); if (isNaN(monto) || monto <= 0) throw Util.error('El monto debe ser un entero mayor que 0');
    if (p.tipo !== 'Ingreso' && p.tipo !== 'Egreso') throw Util.error('Indique si el ajuste es Ingreso o Egreso');
    var motivo = Util.texto(p.motivo); if (motivo.length < 10) throw Util.error('El motivo es obligatorio (mínimo 10 caracteres)');
    var medios = Contab.validarMedios([{ medio: p.medio, monto: monto }], monto);
    if (p.tipo === 'Egreso' && Contab.saldosPorMedio(pl)[p.medio] < monto) throw Util.error('El medio ' + p.medio + ' no tiene saldo suficiente');
    var idDec = pl.decision('Caja', 'Ajuste manual de caja en ' + p.medio, p.tipo + ' de ' + monto + ' Gs.', motivo);
    Contab.dinero(pl, p.tipo, 'Ajuste de caja', medios, 'Decisiones', idDec, motivo);
    pl.resultado = { id_decision: idDec, disponible: Contab.dineroDisponible(pl) + (p.tipo === 'Ingreso' ? monto : -monto) };
  }
});

function comisionSugerida(medioOrigen, monto) {
  var bps = /billetera/i.test(medioOrigen) ? Config.valor('comision_extraccion_bps') : (/transferencia/i.test(medioOrigen) ? Config.valor('comision_transferencia_bps') : 0);
  return Util.pct(monto, bps);
}
definir('sugerirComisionTraslado', {
  roles: [ROL_ADMIN], lectura: true,
  leer: function (p) { var m = Util.entero(p.monto); if (isNaN(m) || m <= 0) throw Util.error('El monto debe ser un entero mayor que 0'); return { comision_sugerida: comisionSugerida(p.medio_origen, m) }; }
});
definir('trasladarEntreMedios', {
  roles: [ROL_ADMIN],
  huella: function (p) { return ['traslado', p.medio_origen, p.medio_destino, p.monto].join('|'); },
  planificar: function (p, pl) {
    var monto = Util.entero(p.monto); if (isNaN(monto) || monto <= 0) throw Util.error('El monto debe ser un entero mayor que 0');
    if (p.medio_origen === p.medio_destino) throw Util.error('El medio de origen y el de destino deben ser distintos');
    var com = p.comision === undefined || p.comision === '' ? 0 : Util.entero(p.comision);
    if (isNaN(com) || com < 0) throw Util.error('La comisión debe ser un entero mayor o igual a 0');
    var o = Contab.validarMedios([{ medio: p.medio_origen, monto: monto }], monto), d = Contab.validarMedios([{ medio: p.medio_destino, monto: monto }], monto);
    if (Contab.saldosPorMedio(pl)[p.medio_origen] < monto + com) throw Util.error('El medio ' + p.medio_origen + ' no tiene saldo suficiente');
    var idT = 'TRS-' + pl.idOp.substring(0, 8);
    Contab.dinero(pl, 'Egreso', 'Traslado entre medios', o, 'Traslados', idT, 'Hacia ' + p.medio_destino);
    Contab.dinero(pl, 'Ingreso', 'Traslado entre medios', d, 'Traslados', idT, 'Desde ' + p.medio_origen);
    if (com > 0) {
      var g = pl.add('Gastos_Operativos', { fecha: Util.hoy(), categoria: 'Comisión de medio de pago', monto: com, medio: p.medio_origen, descripcion: 'Comisión de traslado ' + p.medio_origen + ' → ' + p.medio_destino, responsable: pl.usuario.email, anulado: 'No' });
      Contab.dinero(pl, 'Egreso', 'Gasto operativo', Contab.validarMedios([{ medio: p.medio_origen, monto: com }], com), 'Gastos_Operativos', g.id_gasto, 'Comisión');
    }
    pl.resultado = { id_traslado: idT, comision: com };
  }
});

definir('crearGastoOperativo', {
  roles: [ROL_ADMIN],
  huella: function (p) { return ['gasto', p.categoria, p.monto, p.descripcion].join('|'); },
  planificar: function (p, pl) {
    var monto = Util.entero(p.monto); if (isNaN(monto) || monto <= 0) throw Util.error('El monto debe ser un entero mayor que 0');
    if (CATEGORIAS_GASTO.indexOf(p.categoria) < 0) throw Util.error('Categoría de gasto inválida');
    var desc = Util.texto(p.descripcion); if (desc.length < 3) throw Util.error('Describa el gasto');
    var medios = Contab.normalizarMedios(p, monto), saldos = Contab.saldosPorMedio(pl);
    medios.forEach(function (m) { if (saldos[m.medio] < m.monto) throw Util.error('El medio ' + m.medio + ' no tiene saldo suficiente'); });
    var g = pl.add('Gastos_Operativos', { fecha: p.fecha ? String(p.fecha).substring(0, 10) : Util.hoy(), categoria: p.categoria, monto: monto, medio: Contab.etiquetaMedio(medios), descripcion: desc, responsable: pl.usuario.email, anulado: 'No' });
    Contab.dinero(pl, 'Egreso', 'Gasto operativo', medios, 'Gastos_Operativos', g.id_gasto, desc);
    pl.resultado = { id_gasto: g.id_gasto };
  }
});

definir('anularGastoOperativo', {
  roles: [ROL_ADMIN],
  planificar: function (p, pl) {
    var g = pl.get('Gastos_Operativos', p.id_gasto); if (!g) throw Util.error('No existe el gasto');
    if (g.anulado === 'Sí') throw Util.error('El gasto ya está anulado');
    var motivo = Util.texto(p.motivo); if (motivo.length < 5) throw Util.error('El motivo es obligatorio');
    var movs = pl.filas('Movimientos_Dinero').filter(function (m) { return m.ref_tabla === 'Gastos_Operativos' && m.ref_id === g.id_gasto && m.tipo === 'Egreso'; });
    Contab.dinero(pl, 'Ingreso', 'Anulación de gasto', movs.map(function (m) { return { medio: m.medio, monto: Util.num(m.monto) }; }), 'Gastos_Operativos', g.id_gasto, motivo);
    pl.upd('Gastos_Operativos', g.id_gasto, { anulado: 'Sí', motivo_anulacion: motivo }, false);
    pl.resultado = { id_gasto: g.id_gasto };
  }
});

definir('obtenerCaja', {
  roles: [ROL_ADMIN], lectura: true,
  leer: function (p) {
    var desde = p && p.desde ? String(p.desde) : '', hasta = p && p.hasta ? String(p.hasta) : '9999';
    var movs = Datos.leer('Movimientos_Dinero').filter(function (m) { var f = String(m.fecha_hora).substring(0, 10); return f >= desde && f <= hasta; });
    return {
      disponible: Contab.dineroDisponible(FuenteDatos), por_medio: Contab.saldosPorMedio(FuenteDatos), saldos_a_favor: Contab.saldosAFavorTotal(FuenteDatos),
      tecnico_a_pagar: Contab.tecnicoAPagar(FuenteDatos), capital_libre: Contab.capitalLibre(FuenteDatos), cuentas_por_cobrar: Contab.cuentasPorCobrar(FuenteDatos), fondo: Contab.saldoFondo(FuenteDatos),
      movimientos: movs.slice(-300).reverse(), gastos: Datos.leer('Gastos_Operativos').slice(-100).reverse(), medios: Config.medios(), categorias: CATEGORIAS_GASTO
    };
  }
});

definir('obtenerResumenDia', {
  roles: [ROL_ADMIN], lectura: true,
  leer: function (p) {
    var dia = p && p.fecha ? String(p.fecha).substring(0, 10) : Util.hoy(), r = { fecha: dia, ingresos: 0, egresos: 0, por_concepto: {} };
    Datos.leer('Movimientos_Dinero').forEach(function (m) {
      if (String(m.fecha_hora).substring(0, 10) !== dia) return;
      var s = (m.tipo === 'Ingreso' ? 1 : -1) * Util.num(m.monto);
      if (s > 0) r.ingresos += s; else r.egresos -= s;
      r.por_concepto[m.concepto] = (r.por_concepto[m.concepto] || 0) + s;
    });
    r.neto = r.ingresos - r.egresos; r.disponible = Contab.dineroDisponible(FuenteDatos);
    return r;
  }
});
