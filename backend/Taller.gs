// GESTION_CELULARES - Taller.gs (Diseno Tecnico 3.3-3.6, 3.28, 3.38-3.39, 4.25, 4.31)
// Diagnostico, reparaciones, repuestos y tarifas por trabajo del tecnico.

var VALORES_DIAG = ['OK', 'Fallado', 'No aplica'];
var CAMPOS_DIAG = ['pantalla', 'tactil', 'bateria', 'camara_trasera', 'camara_frontal', 'altavoz', 'microfono', 'puerto_carga', 'botones', 'huella_faceid', 'wifi', 'bluetooth', 'red_movil'];
var RESULTADOS_REP = ['Exitoso', 'Reparado parcialmente', 'No reparado'];
var CLASIF_REPETICION = ['Intervención nueva', 'Garantía o retrabajo', 'Corrección de registro'];

var Taller = {
  totalElegido: function (src, idRep, ronda) {
    return Util.suma(src.filas('Reparacion_Trabajos').filter(function (t) { return t.id_reparacion === idRep && t.etapa === 'Elegido' && Util.num(t.ronda) === Util.num(ronda); }), function (t) { return Util.num(t.monto); });
  },
  filasEtapa: function (src, idRep, etapa, ronda) {
    return src.filas('Reparacion_Trabajos').filter(function (t) { return t.id_reparacion === idRep && t.etapa === etapa && (ronda === undefined || Util.num(t.ronda) === Util.num(ronda)); });
  },
  reparacion: function (src, id) {
    var r = src.get('Reparaciones', id); if (!r) throw Util.error('No existe la reparación ' + id); return r;
  },
  // Valida y arma las filas Elegido de una lista de trabajos (id_tarifa, detalle)
  armarElegidos: function (pl, trabajos, idRep, ronda) {
    if (!Array.isArray(trabajos) || !trabajos.length) throw Util.error('Elija al menos un trabajo hecho');
    var vistos = {}, filas = [];
    trabajos.forEach(function (t) {
      var tar = pl.get('Tarifas_Trabajo', t.id_tarifa);
      if (!tar) throw Util.error('El trabajo elegido no existe en el catálogo');
      if (tar.activo !== 'Sí') throw Util.error('El trabajo "' + tar.nombre_trabajo + '" ya no está activo en el catálogo');
      if (vistos[tar.id_trabajo]) throw Util.error('El trabajo "' + tar.nombre_trabajo + '" está repetido: una línea por tipo de trabajo');
      vistos[tar.id_trabajo] = true;
      var detalle = Util.texto(t.detalle);
      if ((tar.exige_detalle === 'Sí' || tar.id_trabajo === TRABAJO_OTRO) && detalle.length < 3) throw Util.error('El trabajo "' + tar.nombre_trabajo + '" exige un detalle');
      filas.push(pl.add('Reparacion_Trabajos', { id_reparacion: idRep, etapa: 'Elegido', ronda: ronda, id_tarifa: tar.id_tarifa, id_trabajo: tar.id_trabajo, nombre_trabajo: tar.nombre_trabajo, monto: Util.num(tar.monto), detalle: detalle, responsable: pl.usuario.email, fecha_hora: pl.ahora }));
    });
    return filas;
  },
  // Lineas de repuestos de un trabajo (stock propio o compra directa)
  lineasRepuesto: function (pl, lineas, ctx) {
    var total = 0;
    (lineas || []).forEach(function (l) {
      var cant = Util.entero(l.cantidad);
      if (isNaN(cant) || cant <= 0) throw Util.error('La cantidad de repuesto debe ser un entero mayor que 0');
      var estado = l.estado === 'Descartado' ? 'Descartado' : 'Usado';
      if (l.id_repuesto) {
        var r = pl.get('Repuestos', l.id_repuesto); if (!r) throw Util.error('No existe el repuesto ' + l.id_repuesto);
        if (r.activo === 'No') throw Util.error('El repuesto ' + r.nombre + ' está inactivo');
        var stock = Contab.stockRepuesto(pl, r.id_repuesto);
        if (cant > stock) throw Util.error('No hay stock suficiente de ' + r.nombre + ' (disponible ' + stock + ')');
        var unit = Util.num(r.costo_unitario), tot = cant * unit;
        var uso = pl.add('Repuestos_Usados', { id_reparacion: ctx.id_reparacion, id_repuesto: r.id_repuesto, descripcion: r.nombre, cantidad: cant, costo_unitario_aplicado: unit, costo_total_aplicado: tot, id_equipo: ctx.id_equipo || '', id_orden: ctx.id_orden || '', estado: estado });
        pl.cache('repuesto:' + r.id_repuesto);
        if (ctx.id_equipo && tot !== 0) Contab.agregarCosto(pl, { id_equipo: ctx.id_equipo, tipo: 'Repuesto de stock', monto: tot, ref_tabla: 'Repuestos_Usados', ref_id: uso.id_uso, descripcion: r.nombre });
        total += tot;
      } else {
        if (!Auth.tieneRol(pl.usuario, [ROL_ADMIN])) throw Util.error('Solo la Administración registra repuestos comprados para el trabajo');
        var desc = Util.texto(l.descripcion); if (!desc) throw Util.error('Describa el repuesto comprado');
        var pagado = Util.entero(l.monto_pagado); if (isNaN(pagado) || pagado <= 0) throw Util.error('Indique el importe pagado por el repuesto');
        var medios = Contab.normalizarMedios(l, pagado);
        var uso2 = pl.add('Repuestos_Usados', { id_reparacion: ctx.id_reparacion, id_repuesto: '', descripcion: desc, cantidad: cant, costo_unitario_aplicado: Math.floor(pagado / cant), costo_total_aplicado: pagado, id_equipo: ctx.id_equipo || '', id_orden: ctx.id_orden || '', estado: estado });
        if (ctx.id_equipo) Contab.agregarCosto(pl, { id_equipo: ctx.id_equipo, tipo: 'Repuesto directo', monto: pagado, ref_tabla: 'Repuestos_Usados', ref_id: uso2.id_uso, descripcion: desc, afecta_caja: 'Sí' });
        Contab.dinero(pl, 'Egreso', 'Repuesto directo', medios, 'Repuestos_Usados', uso2.id_uso, desc);
        total += pagado;
      }
    });
    return total;
  }
};

// ---------- Diagnostico ----------
definir('registrarDiagnostico', {
  roles: [ROL_TECNICO, ROL_ADMIN],
  registros: function (p) { return ['EQ:' + p.id_equipo]; },
  planificar: function (p, pl, u) {
    var e = Equipos.obtener(pl, p.id_equipo);
    if (e.estado !== 'En diagnóstico') throw Util.error('El diagnóstico se registra con el equipo En diagnóstico');
    var fila = { id_equipo: e.id_equipo, fecha: Util.hoy(), tecnico: u.nombre };
    CAMPOS_DIAG.forEach(function (c) {
      if (VALORES_DIAG.indexOf(p[c]) < 0) throw Util.error('Complete el campo ' + c.replace('_', ' ') + ' (OK / Fallado / No aplica)');
      fila[c] = p[c];
    });
    if (['OK', 'No verificado', 'Reportado'].indexOf(p.imei_verificado) < 0) throw Util.error('Indique el resultado de la verificación de IMEI');
    if (['Excelente', 'Bueno', 'Regular', 'Malo'].indexOf(p.estado_fisico) < 0) throw Util.error('Indique el estado físico');
    if (['Sí', 'No'].indexOf(p.evidencia_humedad) < 0) throw Util.error('Indique si hay evidencia de humedad');
    fila.imei_verificado = p.imei_verificado; fila.estado_fisico = p.estado_fisico; fila.evidencia_humedad = p.evidencia_humedad; fila.comentario = Util.texto(p.comentario);
    var d = pl.add('Diagnosticos', fila);
    pl.resultado = { id_diagnostico: d.id_diagnostico };
  }
});

// ---------- Reparaciones ----------
definir('iniciarReparacion', {
  roles: [ROL_TECNICO, ROL_ADMIN, ROL_SOPORTE],
  registros: function (p) { return [p.id_orden ? 'ORD:' + p.id_orden : 'EQ:' + p.id_equipo]; },
  planificar: function (p, pl, u) {
    var origen = p.origen === 'Garantía o retrabajo' ? 'Garantía o retrabajo' : 'Preparación';
    var base = { fecha_inicio: pl.ahora, tecnico: u.nombre, tecnico_email: u.email, ronda_tarifa: 1, estado_tarifa: '', tarifa_migrada: 'No', origen: origen, id_reparacion_origen: '', version: 1 };
    if (origen === 'Garantía o retrabajo') {
      if (!p.id_reparacion_origen) throw Util.error('Indique la reparación original que motiva la garantía o el retrabajo');
      var ro = Taller.reparacion(pl, p.id_reparacion_origen); base.id_reparacion_origen = ro.id_reparacion;
    }
    if (p.id_orden) {
      var o = pl.get('Ordenes_Servicio', p.id_orden); if (!o) throw Util.error('No existe la orden');
      if (['En diagnóstico', 'En reparación', 'Esperando repuestos'].indexOf(o.estado) < 0) throw Util.error('La orden debe estar En diagnóstico, En reparación o Esperando repuestos');
      var abierta = pl.filas('Reparaciones').filter(function (r) { return r.id_orden === o.id_orden && !r.fecha_fin; });
      if (abierta.length) throw Util.error('La orden ya tiene un trabajo en curso');
      var rep = pl.add('Reparaciones', Object.assign(base, { id_orden: o.id_orden, id_equipo: '' }));
      if (o.estado !== 'En reparación') {
        pl.add('Historial_Ordenes', { id_orden: o.id_orden, fecha_hora: pl.ahora, estado_anterior: o.estado, estado_nuevo: 'En reparación', responsable: u.email, comentario: 'Se inició un trabajo' });
        pl.upd('Ordenes_Servicio', o.id_orden, { estado: 'En reparación' }, true);
      }
      pl.resultado = { id_reparacion: rep.id_reparacion };
      return;
    }
    var e = Equipos.obtener(pl, p.id_equipo); Equipos.verificarVersion(e, p.version);
    var abiertaE = pl.filas('Reparaciones').filter(function (r) { return r.id_equipo === e.id_equipo && !r.fecha_fin; });
    if (abiertaE.length) throw Util.error('La unidad ya tiene un trabajo en curso');
    if (origen === 'Garantía o retrabajo') {
      if (['En garantía', 'En reparación', 'En diagnóstico'].indexOf(e.estado) < 0) throw Util.error('La garantía se atiende con el equipo En garantía');
    } else {
      if (['En diagnóstico', 'Esperando repuestos', 'En pruebas', 'En reparación'].indexOf(e.estado) < 0) throw Util.error('No se puede iniciar un trabajo desde el estado ' + e.estado);
      if (!Auth.tieneRol(u, [ROL_TECNICO, ROL_ADMIN])) throw Util.error('Su rol no inicia reparaciones de preparación');
    }
    var anterior = '';
    if (e.estado === 'En reparación') {
      var cerradas = pl.filas('Reparaciones').filter(function (r) { return r.id_equipo === e.id_equipo && r.fecha_fin; });
      var ult = cerradas[cerradas.length - 1]; if (ult && ult.resultado === 'Reparado parcialmente') anterior = ult.id_reparacion;
    }
    var rep2 = pl.add('Reparaciones', Object.assign(base, { id_equipo: e.id_equipo, id_orden: '', id_reparacion_anterior: anterior }));
    if (origen === 'Preparación' && e.estado !== 'En reparación') Equipos.cambiarEstado(pl, e, 'En reparación', 'Se inició la reparación ' + rep2.id_reparacion);
    pl.resultado = { id_reparacion: rep2.id_reparacion };
  }
});

definir('completarReparacion', {
  roles: [ROL_TECNICO, ROL_ADMIN],
  registros: function (p) { return ['REP:' + p.id_reparacion]; },
  planificar: function (p, pl, u) {
    var r = Taller.reparacion(pl, p.id_reparacion);
    if (r.fecha_fin) throw Util.error('La reparación ya está completa');
    if (Util.entero(p.version) !== Util.num(r.version)) throw Util.error('La reparación cambió. Actualice la pantalla.');
    if (r.tecnico_email !== u.email && !Auth.tieneRol(u, [ROL_ADMIN])) throw Util.error('Solo quien inició el trabajo (o la Administración) lo completa');
    if (RESULTADOS_REP.indexOf(p.resultado) < 0) throw Util.error('Indique el resultado del trabajo');
    var motivo = Util.texto(p.motivo_resultado);
    if (p.resultado !== 'Exitoso' && motivo.length < 5) throw Util.error('Explique por qué el resultado fue "' + p.resultado + '"');
    var minutos = p.tiempo_invertido_min === undefined || p.tiempo_invertido_min === '' ? '' : Util.entero(p.tiempo_invertido_min);
    if (minutos !== '' && (isNaN(minutos) || minutos < 0)) throw Util.error('Los minutos invertidos deben ser un entero mayor o igual a 0');
    var ctx = { id_reparacion: r.id_reparacion, id_equipo: r.id_equipo, id_orden: r.id_orden };
    var e = null, destino = null;
    if (r.id_equipo) {
      e = Equipos.obtener(pl, r.id_equipo);
      if (r.origen !== 'Garantía o retrabajo') {
        if (e.estado !== 'En reparación') throw Util.error('La unidad no está En reparación');
        destino = p.resultado === 'Exitoso' ? 'Reparado' : (p.destino || (p.resultado === 'No reparado' ? 'Desarmado para repuestos' : 'En reparación'));
        if (p.resultado === 'Exitoso' && p.destino && p.destino !== 'Reparado') throw Util.error('Con resultado Exitoso la unidad pasa a Reparado');
        if (['Reparado', 'En reparación', 'Esperando repuestos', 'Desarmado para repuestos'].indexOf(destino) < 0) throw Util.error('Destino de la unidad no válido');
      }
    }
    Taller.lineasRepuesto(pl, p.repuestos, ctx);
    Taller.armarElegidos(pl, p.trabajos, r.id_reparacion, 1);
    pl.upd('Reparaciones', r.id_reparacion, { fecha_fin: pl.ahora, tiempo_invertido_min: minutos, resultado: p.resultado, motivo_resultado: motivo, comentario: Util.texto(p.comentario), estado_tarifa: 'Pendiente de aprobación', ronda_tarifa: 1 }, true);
    if (e && destino && destino !== 'En reparación') Equipos.cambiarEstado(pl, e, destino, 'Trabajo ' + r.id_reparacion + ' cerrado: ' + p.resultado);
    var cont = e ? Util.num(pl.filas('Reparaciones').filter(function (x) { return x.id_equipo === e.id_equipo; }).length) : 0;
    pl.resultado = { id_reparacion: r.id_reparacion, estado_unidad: destino || (e ? e.estado : ''), estado_tarifa: 'Pendiente de aprobación', total_provisional: Taller.totalElegido(pl, r.id_reparacion, 1), trabajos_en_unidad: cont };
  }
});

definir('devolverRepuesto', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['USO:' + p.id_uso]; },
  planificar: function (p, pl) {
    var u0 = pl.get('Repuestos_Usados', p.id_uso); if (!u0) throw Util.error('No existe el uso de repuesto');
    if (Util.num(u0.cantidad) <= 0 || u0.estado === 'Devuelto') throw Util.error('Ese uso no se puede devolver');
    var ya = Util.suma(pl.filas('Repuestos_Usados').filter(function (x) { return x.estado === 'Devuelto' && String(x.descripcion).indexOf('Devolución de ' + u0.id_uso) === 0; }), function (x) { return -Util.num(x.cantidad); });
    var cant = Util.entero(p.cantidad); if (isNaN(cant) || cant <= 0 || cant > Util.num(u0.cantidad) - ya) throw Util.error('Cantidad a devolver no válida');
    var motivo = Util.texto(p.motivo); if (motivo.length < 5) throw Util.error('El motivo es obligatorio');
    var alEstante = p.al_estante !== 'No' && p.al_estante !== false;
    var monto = Math.floor(Util.num(u0.costo_total_aplicado) * cant / Util.num(u0.cantidad));
    if (cant === Util.num(u0.cantidad) - ya) monto = Util.num(u0.costo_total_aplicado) - Util.suma(pl.filas('Repuestos_Usados').filter(function (x) { return x.estado === 'Devuelto' && String(x.descripcion).indexOf('Devolución de ' + u0.id_uso) === 0; }), function (x) { return -Util.num(x.costo_total_aplicado); });
    var fila = pl.add('Repuestos_Usados', { id_reparacion: u0.id_reparacion, id_repuesto: u0.id_repuesto, descripcion: 'Devolución de ' + u0.id_uso, cantidad: -cant, costo_unitario_aplicado: u0.costo_unitario_aplicado, costo_total_aplicado: -monto, id_equipo: u0.id_equipo, id_orden: u0.id_orden, estado: 'Devuelto' });
    if (u0.id_repuesto) {
      pl.cache('repuesto:' + u0.id_repuesto);
      if (!alEstante) pl.add('Movimientos_Repuestos', { id_repuesto: u0.id_repuesto, fecha_hora: pl.ahora, cantidad: -cant, motivo: 'Corrección', responsable: pl.usuario.email, comentario: 'devuelto al proveedor: ' + motivo });
    }
    if (u0.id_equipo) Contab.agregarCosto(pl, { id_equipo: u0.id_equipo, tipo: 'Repuesto devuelto', monto: -monto, motivo: motivo, ref_tabla: 'Repuestos_Usados', ref_id: fila.id_uso });
    if (p.medios && monto > 0) Contab.dinero(pl, 'Ingreso', 'Reembolso recibido', Contab.normalizarMedios(p, monto), 'Repuestos_Usados', fila.id_uso, motivo);
    pl.resultado = { id_uso: fila.id_uso, monto_devuelto: monto };
  }
});

// ---------- Tarifas: catalogo ----------
definir('guardarTarifa', {
  roles: [ROL_ADMIN],
  planificar: function (p, pl) {
    var nombre = Util.texto(p.nombre_trabajo), monto = Util.entero(p.monto);
    if (!nombre) throw Util.error('El nombre del trabajo es obligatorio');
    if (isNaN(monto) || monto <= 0) throw Util.error('El monto debe ser un entero mayor que 0');
    var exige = p.exige_detalle === 'Sí' || p.exige_detalle === true ? 'Sí' : 'No';
    var exigeRep = p.exige_repuesto === 'Sí' || p.exige_repuesto === true ? 'Sí' : 'No';
    var todas = pl.filas('Tarifas_Trabajo');
    var idT = Util.texto(p.id_trabajo), anterior = null;
    if (idT === TRABAJO_OTRO) throw Util.error('"Otro trabajo" no se edita');
    if (idT) {
      var versiones = todas.filter(function (t) { return t.id_trabajo === idT; });
      if (!versiones.length) throw Util.error('No existe el trabajo');
      anterior = versiones.filter(function (t) { return t.activo === 'Sí'; })[0] || versiones[versiones.length - 1];
    }
    var norm = Util.normalizarNombre(nombre);
    var parecido = todas.filter(function (t) { return t.activo === 'Sí' && t.id_trabajo !== idT && t.id_trabajo !== TRABAJO_OTRO && (Util.normalizarNombre(t.nombre_trabajo) === norm || Util.normalizarNombre(t.nombre_trabajo).indexOf(norm) >= 0 || norm.indexOf(Util.normalizarNombre(t.nombre_trabajo)) >= 0); });
    if (parecido.length && !(p.confirmar_similar === true || p.confirmar_similar === 'Sí')) { var e1 = Util.error('Ya existe un trabajo con nombre igual o parecido: "' + parecido[0].nombre_trabajo + '". Confirme si es otro distinto.'); e1.codigo = 'confirmar'; throw e1; }
    var motivo = Util.texto(p.motivo);
    if (anterior) {
      var cambioMonto = Util.num(anterior.monto) !== monto;
      if (cambioMonto && motivo.length < 5) throw Util.error('El motivo es obligatorio al cambiar el monto');
      var umbral = Number(Config.valor('tarifa_variacion_alerta_pct'));
      var variacion = Math.abs(monto - Util.num(anterior.monto)) * 100 / Math.max(1, Util.num(anterior.monto));
      if (cambioMonto && variacion > umbral && !(p.confirmar_variacion === true || p.confirmar_variacion === 'Sí')) { var e2 = Util.error('El monto cambia ' + Math.round(variacion) + '% (de ' + anterior.monto + ' a ' + monto + ', diferencia ' + (monto - Util.num(anterior.monto)) + ' Gs). Confirme el cambio.'); e2.codigo = 'confirmar'; throw e2; }
    }
    if (!idT) {
      var max = 0; todas.forEach(function (t) { var m = /^TRB-(\d+)$/.exec(t.id_trabajo); if (m) max = Math.max(max, +m[1]); });
      idT = 'TRB-' + Util.rellenar(max + 1, 3);
    }
    if (anterior && anterior.activo === 'Sí') pl.upd('Tarifas_Trabajo', anterior.id_tarifa, { activo: 'No' }, true);
    var n = pl.add('Tarifas_Trabajo', { id_trabajo: idT, nombre_trabajo: nombre, monto: monto, exige_detalle: exige, exige_repuesto: exigeRep, activo: 'Sí', vigente_desde: pl.ahora, motivo: motivo, responsable: pl.usuario.email, version: 1 });
    var activas = pl.filas('Tarifas_Trabajo').filter(function (t) { return t.id_trabajo === idT && t.activo === 'Sí'; });
    if (activas.length !== 1) throw Util.error('El trabajo quedaría con más de una versión activa');
    pl.decision('Servicio técnico', 'Catálogo de trabajos del técnico', (anterior ? 'Nueva versión de ' : 'Nuevo trabajo ') + nombre + ' a ' + monto + ' Gs', motivo || 'Alta del trabajo');
    pl.resultado = { id_tarifa: n.id_tarifa, id_trabajo: idT };
  }
});

definir('desactivarTarifa', {
  roles: [ROL_ADMIN],
  planificar: function (p, pl) {
    if (p.id_trabajo === TRABAJO_OTRO) throw Util.error('"Otro trabajo" no se desactiva');
    var act = pl.filas('Tarifas_Trabajo').filter(function (t) { return t.id_trabajo === p.id_trabajo && t.activo === 'Sí'; })[0];
    if (!act) throw Util.error('El trabajo no está activo');
    var motivo = Util.texto(p.motivo); if (motivo.length < 5) throw Util.error('El motivo es obligatorio');
    pl.upd('Tarifas_Trabajo', act.id_tarifa, { activo: 'No', motivo: motivo }, true);
    pl.decision('Servicio técnico', 'Catálogo de trabajos del técnico', 'Se desactivó ' + act.nombre_trabajo, motivo);
    pl.resultado = { id_trabajo: p.id_trabajo };
  }
});

definir('obtenerTarifas', {
  roles: [ROL_ADMIN, ROL_TECNICO], lectura: true,
  leer: function (p, u) {
    var todas = Datos.leer('Tarifas_Trabajo');
    return Auth.tieneRol(u, [ROL_ADMIN]) ? todas : todas.filter(function (t) { return t.activo === 'Sí'; });
  }
});

// ---------- Tarifas: devolver, corregir, aprobar ----------
definir('devolverTarifaReparacion', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['REP:' + p.id_reparacion]; },
  planificar: function (p, pl) {
    var r = Taller.reparacion(pl, p.id_reparacion);
    if (r.estado_tarifa !== 'Pendiente de aprobación') throw Util.error('La tarifa no está pendiente de aprobación');
    var motivo = Util.texto(p.motivo); if (motivo.length < 10) throw Util.error('El motivo debe tener al menos 10 caracteres');
    pl.add('Aprobaciones_Tarifa', { id_reparacion: r.id_reparacion, evento: 'Devuelta', ronda: r.ronda_tarifa, total_elegido: Taller.totalElegido(pl, r.id_reparacion, r.ronda_tarifa), motivo: motivo, autoaprobada: 'No', responsable: pl.usuario.email, fecha_hora: pl.ahora });
    pl.upd('Reparaciones', r.id_reparacion, { estado_tarifa: 'Devuelta' }, true);
    pl.resultado = { id_reparacion: r.id_reparacion, estado_tarifa: 'Devuelta' };
  }
});

definir('corregirTrabajosReparacion', {
  roles: [ROL_TECNICO, ROL_ADMIN],
  registros: function (p) { return ['REP:' + p.id_reparacion]; },
  planificar: function (p, pl, u) {
    var r = Taller.reparacion(pl, p.id_reparacion);
    if (r.estado_tarifa !== 'Devuelta') throw Util.error('Solo se corrige una tarifa devuelta');
    if (r.tecnico_email !== u.email && !Auth.tieneRol(u, [ROL_ADMIN])) throw Util.error('Solo el técnico dueño de la reparación la corrige');
    var ronda = Util.num(r.ronda_tarifa) + 1;
    Taller.armarElegidos(pl, p.trabajos, r.id_reparacion, ronda);
    pl.upd('Reparaciones', r.id_reparacion, { estado_tarifa: 'Pendiente de aprobación', ronda_tarifa: ronda }, true);
    pl.resultado = { id_reparacion: r.id_reparacion, ronda: ronda, total_provisional: Taller.totalElegido(pl, r.id_reparacion, ronda) };
  }
});

// Arma las lineas aprobadas a partir de lo que manda la Administracion
Taller.lineasAprobadas = function (pl, r, entrada, etapa, ronda, idAprob) {
  var elegidas = Taller.filasEtapa(pl, r.id_reparacion, 'Elegido', r.ronda_tarifa);
  var vistos = {}, filas = [], esOrden = !!r.id_orden;
  (entrada || []).forEach(function (t) {
    var origen = t.id_rt_origen ? pl.get('Reparacion_Trabajos', t.id_rt_origen) : null;
    var tarifa = t.id_tarifa ? pl.get('Tarifas_Trabajo', t.id_tarifa) : (origen ? pl.get('Tarifas_Trabajo', origen.id_tarifa) : null);
    if (origen && origen.id_reparacion !== r.id_reparacion) throw Util.error('La línea de origen no pertenece a esta reparación');
    if (!tarifa) throw Util.error('Trabajo no válido');
    if (vistos[tarifa.id_trabajo]) throw Util.error('Trabajo repetido: una línea por tipo de trabajo');
    vistos[tarifa.id_trabajo] = true;
    var detalle = Util.texto(t.detalle !== undefined ? t.detalle : (origen ? origen.detalle : ''));
    var monto, linea;
    if (tarifa.id_trabajo === TRABAJO_OTRO) {
      monto = Util.entero(t.monto);
      if (isNaN(monto) || monto < 0) throw Util.error('Indique el monto de "Otro trabajo"');
      if (detalle.length < 3) throw Util.error('"Otro trabajo" exige un detalle');
      if (monto === 0 && !esOrden) throw Util.error('"Otro trabajo" con monto 0 solo se admite en la cancelación de una orden de terceros');
    } else if (origen) {
      monto = Util.num(origen.monto);
      if (tarifa.exige_detalle === 'Sí' && detalle.length < 3) throw Util.error('El trabajo "' + tarifa.nombre_trabajo + '" exige un detalle');
    } else {
      // agregado por la Administracion: version vigente a la fecha de cierre del trabajo
      var cierre = r.fecha_fin || pl.ahora;
      var versiones = pl.filas('Tarifas_Trabajo').filter(function (x) { return x.id_trabajo === tarifa.id_trabajo && String(x.vigente_desde) <= String(cierre); });
      if (!versiones.length) throw Util.error('No hay una versión de "' + tarifa.nombre_trabajo + '" vigente a la fecha de cierre del trabajo');
      monto = Util.num(versiones[versiones.length - 1].monto);
      if (tarifa.exige_detalle === 'Sí' && detalle.length < 3) throw Util.error('El trabajo "' + tarifa.nombre_trabajo + '" exige un detalle');
    }
    var origenLinea = !origen ? 'Agregada por Administración' : ((tarifa.id_trabajo === TRABAJO_OTRO ? (monto !== Util.num(origen.monto) || detalle !== String(origen.detalle)) : detalle !== String(origen.detalle)) ? 'Cambiada' : 'Elegida');
    filas.push({ tarifa: tarifa, detalle: detalle, monto: monto, id_rt_origen: origen ? origen.id_rt : '', origen_linea: origenLinea });
  });
  return { filas: filas, total: Util.suma(filas, function (f) { return f.monto; }), elegidas: elegidas };
};

definir('aprobarTarifaReparacion', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['REP:' + p.id_reparacion]; },
  planificar: function (p, pl, u) {
    var r = Taller.reparacion(pl, p.id_reparacion);
    if (r.tecnico_email && r.tecnico_email === u.email) throw Util.error('Nadie aprueba su propio trabajo: lo debe aprobar otro Administrador');
    if (r.estado_tarifa === 'Aprobada') {
      var prev = pl.filas('Aprobaciones_Tarifa').filter(function (a) { return a.id_reparacion === r.id_reparacion && a.evento === 'Aprobada'; })[0];
      pl.resultado = { id_reparacion: r.id_reparacion, ya_aprobada: true, aviso: 'tu selección no se aplicó: la tarifa ya estaba aprobada', total_aprobado: prev ? Util.num(prev.total_aprobado) : Util.num(r.tarifa_trabajo) };
      return;
    }
    if (r.estado_tarifa !== 'Pendiente de aprobación') throw Util.error('La tarifa no está pendiente de aprobación');
    if (Util.entero(p.version) !== Util.num(r.version)) throw Util.error('La reparación cambió desde que la abrió. Actualice la pantalla.');
    var esOrden = !!r.id_orden;
    var ap = Taller.lineasAprobadas(pl, r, p.trabajos_aprobados, 'Aprobado', r.ronda_tarifa);
    if (!ap.filas.length && !esOrden) throw Util.error('Apruebe al menos un trabajo');
    var totalElegido = Taller.totalElegido(pl, r.id_reparacion, r.ronda_tarifa), total = ap.total, dif = total - totalElegido;
    var cambio = dif !== 0 || ap.filas.length !== ap.elegidas.length || ap.filas.some(function (f) { return f.origen_linea !== 'Elegida'; });
    var motivo = Util.texto(p.motivo);
    if (cambio && motivo.length < 10) throw Util.error('Si lo aprobado difiere de lo elegido, el motivo debe tener al menos 10 caracteres');
    // repeticion: el mismo trabajo ya aprobado antes en la misma unidad u orden
    var hermanas = pl.filas('Reparaciones').filter(function (x) { return x.id_reparacion !== r.id_reparacion && ((r.id_equipo && x.id_equipo === r.id_equipo) || (r.id_orden && x.id_orden === r.id_orden)); }).map(function (x) { return x.id_reparacion; });
    var repetidos = ap.filas.filter(function (f) { return pl.filas('Reparacion_Trabajos').some(function (t) { return (t.etapa === 'Aprobado' || t.etapa === 'Corregido') && hermanas.indexOf(t.id_reparacion) >= 0 && t.id_trabajo === f.tarifa.id_trabajo && t.id_trabajo !== TRABAJO_OTRO; }); });
    var repeticion = repetidos.length ? 'Sí' : 'No', clasif = '';
    if (repeticion === 'Sí' && r.origen !== 'Garantía o retrabajo') {
      clasif = Util.texto(p.clasificacion_repeticion);
      if (CLASIF_REPETICION.indexOf(clasif) < 0) { var er = Util.error('El trabajo "' + repetidos[0].tarifa.nombre_trabajo + '" ya se aprobó antes en esta unidad. Clasifique la repetición.'); er.codigo = 'repeticion'; throw er; }
      if (motivo.length < 10) throw Util.error('La repetición exige un motivo específico (mínimo 10 caracteres)');
    }
    var apt = pl.add('Aprobaciones_Tarifa', { id_reparacion: r.id_reparacion, evento: 'Aprobada', ronda: r.ronda_tarifa, total_elegido: totalElegido, total_aprobado: total, diferencia: dif, motivo: motivo, repeticion: repeticion, clasificacion_repeticion: clasif, autoaprobada: 'No', responsable: u.email, fecha_hora: pl.ahora });
    ap.filas.forEach(function (f) {
      pl.add('Reparacion_Trabajos', { id_reparacion: r.id_reparacion, etapa: 'Aprobado', ronda: r.ronda_tarifa, id_tarifa: f.tarifa.id_tarifa, id_trabajo: f.tarifa.id_trabajo, nombre_trabajo: f.tarifa.nombre_trabajo, monto: f.monto, detalle: f.detalle, id_aprobacion: apt.id_aprobacion, id_rt_origen: f.id_rt_origen, origen_linea: f.origen_linea, responsable: u.email, fecha_hora: pl.ahora });
    });
    var esGarantia = r.origen === 'Garantía o retrabajo';
    if (total > 0) {
      if (r.id_equipo) {
        var c = Contab.agregarCosto(pl, { id_equipo: r.id_equipo, fecha_hora: r.fecha_fin, tipo: esGarantia ? 'Garantía o retrabajo' : 'Mano de obra', monto: total, motivo: esGarantia ? 'Retrabajo o garantía de ' + (r.id_reparacion_origen || '') : '', ref_tabla: 'Aprobaciones_Tarifa', ref_id: apt.id_aprobacion });
        apt.id_costo_unidad = c.id_costo;
      }
      var ct = Contab.devengarTecnico(pl, { fecha_hora: r.fecha_fin, tecnico: r.tecnico_email, id_reparacion: r.id_reparacion, id_equipo: r.id_equipo, id_orden: r.id_orden, tipo: esGarantia ? 'Retrabajo o garantía' : 'Trabajo', monto: total, ref_id: apt.id_aprobacion });
      apt.id_costo_tecnico = ct.id_costo_tecnico;
    }
    pl.upd('Reparaciones', r.id_reparacion, { tarifa_trabajo: total, estado_tarifa: 'Aprobada' }, true);
    pl.resultado = { id_reparacion: r.id_reparacion, total_aprobado: total, total_elegido: totalElegido, diferencia: dif, repeticion: repeticion, id_aprobacion: apt.id_aprobacion };
  }
});

definir('corregirTarifaAprobada', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['REP:' + p.id_reparacion]; },
  planificar: function (p, pl, u) {
    var r = Taller.reparacion(pl, p.id_reparacion);
    if (r.estado_tarifa !== 'Aprobada' || r.tarifa_migrada === 'Sí') throw Util.error('Solo se corrige una tarifa aprobada bajo este flujo');
    var motivo = Util.texto(p.motivo); if (motivo.length < 10) throw Util.error('El motivo debe tener al menos 10 caracteres');
    var ap = Taller.lineasAprobadas(pl, r, p.trabajos, 'Corregido', r.ronda_tarifa);
    var vigente = Util.num(r.tarifa_trabajo) + Util.suma(pl.filas('Costos_Tecnico').filter(function (c) { return c.id_reparacion === r.id_reparacion && c.tipo === 'Ajuste'; }), function (c) { return Util.num(c.monto); });
    var dif = ap.total - vigente;
    if (dif === 0) throw Util.error('La corrección no cambia el total vigente (' + vigente + ')');
    var apt = pl.add('Aprobaciones_Tarifa', { id_reparacion: r.id_reparacion, evento: 'Corrección', ronda: r.ronda_tarifa, total_elegido: vigente, total_aprobado: ap.total, diferencia: dif, motivo: motivo, repeticion: 'No', autoaprobada: 'No', responsable: u.email, fecha_hora: pl.ahora });
    ap.filas.forEach(function (f) {
      pl.add('Reparacion_Trabajos', { id_reparacion: r.id_reparacion, etapa: 'Corregido', ronda: r.ronda_tarifa, id_tarifa: f.tarifa.id_tarifa, id_trabajo: f.tarifa.id_trabajo, nombre_trabajo: f.tarifa.nombre_trabajo, monto: f.monto, detalle: f.detalle, id_aprobacion: apt.id_aprobacion, id_rt_origen: f.id_rt_origen, origen_linea: f.origen_linea, responsable: u.email, fecha_hora: pl.ahora });
    });
    if (r.id_equipo) {
      var c = Contab.agregarCosto(pl, { id_equipo: r.id_equipo, tipo: 'Corrección de costo', monto: dif, motivo: 'Corrección de tarifa de ' + r.id_reparacion + ': ' + motivo, ref_tabla: 'Aprobaciones_Tarifa', ref_id: apt.id_aprobacion });
      apt.id_costo_unidad = c.id_costo;
    } else if (r.id_orden && pl.filas('Asientos_Ganancia').some(function (a) { return a.id_orden === r.id_orden && a.causa === 'Orden cerrada'; })) {
      Contab.asiento(pl, 'Servicio técnico', -dif, 'Costo', ['Aprobaciones_Tarifa', apt.id_aprobacion], { id_orden: r.id_orden });
    }
    var ct = Contab.devengarTecnico(pl, { fecha_hora: pl.ahora, tecnico: r.tecnico_email, id_reparacion: r.id_reparacion, id_equipo: r.id_equipo, id_orden: r.id_orden, tipo: 'Ajuste', monto: dif, motivo: motivo, ref_id: apt.id_aprobacion });
    apt.id_costo_tecnico = ct.id_costo_tecnico;
    pl.resultado = { id_reparacion: r.id_reparacion, diferencia: dif, total_vigente: ap.total };
  }
});

// ---------- Repuestos ----------
definir('crearRepuesto', {
  roles: [ROL_ADMIN],
  planificar: function (p, pl) {
    var nombre = Util.texto(p.nombre); if (!nombre) throw Util.error('El nombre es obligatorio');
    var costo = p.costo_unitario === undefined || p.costo_unitario === '' ? 0 : Util.entero(p.costo_unitario);
    if (isNaN(costo) || costo < 0) throw Util.error('El costo unitario debe ser un entero mayor o igual a 0');
    var cant = p.stock_inicial === undefined || p.stock_inicial === '' ? 0 : Util.entero(p.stock_inicial);
    if (isNaN(cant) || cant < 0) throw Util.error('El stock inicial debe ser un entero mayor o igual a 0');
    if (cant > 0 && costo <= 0) throw Util.error('Con stock inicial indique el costo unitario');
    var r = pl.add('Repuestos', { nombre: nombre, compatibilidad: Util.texto(p.compatibilidad), proveedor: Util.texto(p.proveedor), costo_unitario: costo, stock_actual: 0, tiempo_reposicion_dias: p.tiempo_reposicion_dias || '', notas: Util.texto(p.notas), activo: 'Sí' });
    if (cant > 0) { pl.add('Movimientos_Repuestos', { id_repuesto: r.id_repuesto, fecha_hora: pl.ahora, cantidad: cant, motivo: 'Otro', responsable: pl.usuario.email, comentario: 'Stock inicial' }); }
    pl.cache('repuesto:' + r.id_repuesto);
    pl.resultado = { id_repuesto: r.id_repuesto };
  }
});

definir('editarRepuesto', {
  roles: [ROL_ADMIN],
  planificar: function (p, pl) {
    var r = pl.get('Repuestos', p.id_repuesto); if (!r) throw Util.error('No existe el repuesto');
    var c = {};
    ['nombre', 'compatibilidad', 'proveedor', 'notas'].forEach(function (k) { if (p[k] !== undefined) c[k] = Util.texto(p[k]); });
    if (p.tiempo_reposicion_dias !== undefined) c.tiempo_reposicion_dias = p.tiempo_reposicion_dias;
    if (p.activo !== undefined) { if (['Sí', 'No'].indexOf(p.activo) < 0) throw Util.error('Activo debe ser Sí o No'); c.activo = p.activo; }
    if (c.nombre === '') throw Util.error('El nombre es obligatorio');
    pl.upd('Repuestos', r.id_repuesto, c, false);
    pl.resultado = { id_repuesto: r.id_repuesto };
  }
});

definir('ajustarStock', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['RP:' + p.id_repuesto]; },
  planificar: function (p, pl) {
    var r = pl.get('Repuestos', p.id_repuesto); if (!r) throw Util.error('No existe el repuesto');
    var motivo = p.motivo, cant = Util.entero(p.cantidad);
    if (['Compra', 'Pérdida', 'Corrección', 'Pieza rescatada', 'Otro'].indexOf(motivo) < 0) throw Util.error('Motivo no válido');
    if (isNaN(cant) || cant === 0) throw Util.error('La cantidad debe ser un entero distinto de 0');
    var com = Util.texto(p.comentario); if (com.length < 3) throw Util.error('El comentario es obligatorio');
    var stock = Contab.stockRepuesto(pl, r.id_repuesto), costo = Util.num(r.costo_unitario);
    var fila = { id_repuesto: r.id_repuesto, fecha_hora: pl.ahora, cantidad: cant, motivo: motivo, responsable: pl.usuario.email, comentario: com };
    if (motivo === 'Pérdida' && cant > 0) throw Util.error('Una pérdida resta stock (cantidad negativa)');
    if (motivo === 'Compra' || motivo === 'Pieza rescatada') {
      if (cant < 0) throw Util.error('Esta operación suma stock');
      var total;
      if (motivo === 'Compra') {
        total = Util.entero(p.monto_pagado); if (isNaN(total) || total <= 0) throw Util.error('Indique el importe pagado');
        fila.monto_pagado = total;
        var medios = Contab.normalizarMedios(p, total);
        Contab.dinero(pl, 'Egreso', 'Compra de repuesto', medios, 'Repuestos', r.id_repuesto, com);
      } else {
        var vu = Util.entero(p.valor_unitario); if (isNaN(vu) || vu <= 0) throw Util.error('Indique el valor unitario de la pieza rescatada');
        var eq = Equipos.obtener(pl, p.id_equipo_origen);
        if (eq.estado !== 'Desarmado para repuestos') throw Util.error('La unidad de origen debe estar Desarmada para repuestos');
        total = vu * cant;
        if (total > Contab.costoTotal(pl, eq.id_equipo)) throw Util.error('El valor de las piezas supera el costo de la unidad');
        fila.valor_unitario = vu; fila.id_equipo_origen = eq.id_equipo;
        Contab.agregarCosto(pl, { id_equipo: eq.id_equipo, tipo: 'Piezas rescatadas', monto: -total, motivo: 'Pieza rescatada para ' + r.nombre, ref_tabla: 'Repuestos', ref_id: r.id_repuesto });
      }
      var nuevoCosto = Math.floor((stock * costo + total) / (stock + cant));
      pl.upd('Repuestos', r.id_repuesto, { costo_unitario: nuevoCosto }, false);
    } else if (stock + cant < 0) throw Util.error('El stock no puede quedar negativo (hay ' + stock + ')');
    pl.add('Movimientos_Repuestos', fila);
    pl.cache('repuesto:' + r.id_repuesto);
    pl.resultado = { id_repuesto: r.id_repuesto, stock_nuevo: stock + cant };
  }
});

definir('obtenerRepuestos', {
  roles: [ROL_ADMIN, ROL_TECNICO, ROL_COMPRADOR], lectura: true,
  leer: function (p, u) {
    var ver = Auth.tieneRol(u, [ROL_ADMIN]);
    return Datos.leer('Repuestos').map(function (r) { var o = {}; for (var k in r) if (k !== '_fila') o[k] = r[k]; if (!ver) delete o.costo_unitario; return o; });
  }
});

definir('obtenerReparaciones', {
  roles: [ROL_ADMIN, ROL_TECNICO, ROL_SOPORTE], lectura: true,
  leer: function (p, u) {
    var verTodo = Auth.tieneRol(u, [ROL_ADMIN, ROL_SOPORTE]);
    var hoy = Util.hoy(), umbral = Number(Config.valor('dias_alerta_tarifa_pendiente'));
    return Datos.leer('Reparaciones').filter(function (r) { return verTodo || r.tecnico_email === u.email; }).map(function (r) {
      var elegidos = Datos.filtrar('Reparacion_Trabajos', function (t) { return t.id_reparacion === r.id_reparacion; });
      var e = r.id_equipo ? Datos.buscar('Equipos', 'id_equipo', r.id_equipo) : null;
      var pendiente = r.estado_tarifa === 'Pendiente de aprobación' || r.estado_tarifa === 'Devuelta';
      var venta = r.id_equipo ? Contab.ventaVigente(FuenteDatos, r.id_equipo) : null;
      return { reparacion: r, equipo: e ? { id_equipo: e.id_equipo, marca: e.marca, modelo: e.modelo, estado: e.estado } : null, trabajos: elegidos, usos: Datos.filtrar('Repuestos_Usados', function (x) { return x.id_reparacion === r.id_reparacion; }), total_elegido: pendiente ? Taller.totalElegido(FuenteDatos, r.id_reparacion, r.ronda_tarifa) : null, dias_pendiente: pendiente && r.fecha_fin ? Util.diasEntre(r.fecha_fin, hoy) : 0, marcar_rojo: pendiente && r.fecha_fin && Util.diasEntre(r.fecha_fin, hoy) >= umbral, unidad_ya_vendida: !!venta, repeticiones: [] };
    });
  }
});
