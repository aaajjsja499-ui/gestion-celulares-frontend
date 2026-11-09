// GESTION_CELULARES - Equipos.gs (Fundamentos 3.1-3.2 y 4; Diseno Tecnico 3.1, 4.17, 4.27, 4.30)
// Ciclo de vida de las unidades, compras, costos y datos del equipo.

var TRANSICIONES = {
  'Detectado': ['En negociación', 'Baja definitiva'],
  'En negociación': ['Comprado', 'Detectado', 'Baja definitiva'],
  'Comprado': ['Recibido', 'Baja definitiva'],
  'Recibido': ['En diagnóstico', 'Listo para venta'],
  'En diagnóstico': ['Listo para venta', 'En reparación', 'Esperando repuestos', 'Desarmado para repuestos', 'Baja definitiva'],
  'En reparación': ['Reparado', 'Esperando repuestos', 'Desarmado para repuestos'],
  'Esperando repuestos': ['En reparación', 'Desarmado para repuestos'],
  'Reparado': ['En pruebas'],
  'En pruebas': ['Listo para venta', 'En reparación'],
  'Listo para venta': ['Publicado'],
  'Publicado': ['Reservado', 'Vendido', 'Listo para venta'],
  'Reservado': ['Vendido', 'Publicado'],
  'Vendido': ['Entregado', 'Publicado'],
  'Entregado': ['En garantía', 'Cerrado por venta'],
  'En garantía': ['Devuelto', 'Cerrado por venta'],
  'Devuelto': ['En diagnóstico', 'Desarmado para repuestos', 'Baja definitiva'],
  'Desarmado para repuestos': ['Baja definitiva'],
  'Baja definitiva': [],
  'Cerrado por venta': []
};
// Roles autorizados por transicion (Fundamentos, Seccion 4). El Administrador puede todas las validas.
var ROLES_TRANSICION = {
  'Detectado>En negociación': [ROL_COMPRADOR], 'Detectado>Baja definitiva': [ROL_COMPRADOR],
  'En negociación>Comprado': [ROL_COMPRADOR], 'En negociación>Detectado': [ROL_COMPRADOR], 'En negociación>Baja definitiva': [ROL_COMPRADOR],
  'Comprado>Recibido': [ROL_COMPRADOR], 'Comprado>Baja definitiva': [ROL_COMPRADOR],
  'Recibido>En diagnóstico': [ROL_TECNICO], 'Recibido>Listo para venta': [ROL_TECNICO],
  'En diagnóstico>Listo para venta': [ROL_TECNICO], 'En diagnóstico>En reparación': [ROL_TECNICO], 'En diagnóstico>Esperando repuestos': [ROL_TECNICO], 'En diagnóstico>Desarmado para repuestos': [ROL_TECNICO], 'En diagnóstico>Baja definitiva': [ROL_TECNICO],
  'En reparación>Reparado': [ROL_TECNICO], 'En reparación>Esperando repuestos': [ROL_TECNICO], 'En reparación>Desarmado para repuestos': [ROL_TECNICO],
  'Esperando repuestos>En reparación': [ROL_TECNICO], 'Esperando repuestos>Desarmado para repuestos': [ROL_TECNICO],
  'Reparado>En pruebas': [ROL_TECNICO], 'En pruebas>Listo para venta': [ROL_TECNICO], 'En pruebas>En reparación': [ROL_TECNICO],
  'Desarmado para repuestos>Baja definitiva': [ROL_TECNICO],
  'Entregado>En garantía': [ROL_SOPORTE], 'En garantía>Cerrado por venta': [ROL_SOPORTE], 'Entregado>Cerrado por venta': [ROL_SOPORTE],
  'Devuelto>En diagnóstico': [ROL_SOPORTE], 'Devuelto>Desarmado para repuestos': [ROL_SOPORTE], 'Devuelto>Baja definitiva': [ROL_SOPORTE]
};
// Destinos que solo se alcanzan con su operacion propia
var DESTINOS_EXCLUSIVOS = {
  'Comprado': 'cerrarCompra', 'En reparación': 'iniciarReparacion', 'Reparado': 'completarReparacion',
  'Vendido': 'registrarVenta', 'Entregado': 'entregarEquipo', 'En garantía': 'entregarEquipo', 'Devuelto': 'registrarDevolucion',
  'Cerrado por venta': 'cerrarPorVencimiento'
};

var Equipos = {
  obtener: function (src, id) {
    var e = src.get('Equipos', id);
    if (!e) throw Util.error('No existe el equipo ' + id);
    return e;
  },
  verificarVersion: function (e, version) {
    if (Util.entero(version) !== Util.num(e.version)) throw Util.error('El equipo cambió desde que lo abrió. Actualice la pantalla y vuelva a intentar.');
  },
  cambiarEstado: function (pl, e, nuevo, comentario) {
    var actual = pl.get('Equipos', e.id_equipo);
    pl.add('Historial_Estados', { id_equipo: e.id_equipo, fecha_hora: pl.ahora, estado_anterior: actual.estado, estado_nuevo: nuevo, responsable: pl.usuario.email, comentario: comentario });
    pl.upd('Equipos', e.id_equipo, { estado: nuevo }, true);
  },
  validarIdentificador: function (pl, tipo, imei, serie, idPropio, idOrigen) {
    imei = String(imei || '').replace(/[\s\-]/g, '');
    if (tipo === 'Celular' && imei && !/^\d{15,16}$/.test(imei)) throw Util.error('El IMEI debe tener 15 o 16 dígitos');
    if (imei) {
      pl.filas('Equipos').forEach(function (o) {
        if (o.id_equipo !== idPropio && String(o.imei) === imei && !(idOrigen && o.id_equipo === idOrigen) && !(o.id_unidad_origen && o.id_unidad_origen === idPropio)) throw Util.error('Ese IMEI ya pertenece al equipo ' + o.id_equipo);
      });
    }
    if (serie) {
      pl.filas('Equipos').forEach(function (o) {
        if (o.id_equipo !== idPropio && String(o.numero_serie) === String(serie) && !(idOrigen && o.id_equipo === idOrigen)) throw Util.error('Ese número de serie ya pertenece al equipo ' + o.id_equipo);
      });
    }
    return imei;
  },
  tipoValido: function (t) { return ['Celular', 'Artículo usado', 'Artículo nuevo'].indexOf(t) >= 0; },
  consultaVigente: function (src, e) {
    var imei = String(e.imei || '');
    var cs = src.filas('Consultas_IMEI').filter(function (c) { return c.id_equipo === e.id_equipo && String(c.imei_consultado) === imei; });
    return cs.length ? cs[cs.length - 1] : null;
  },
  responsableDe: function (rol) { return rol; }
};

// ---------- Alta ----------
definir('crearEquipo', {
  roles: [ROL_COMPRADOR, ROL_ADMIN],
  planificar: function (p, pl) {
    if (!Equipos.tipoValido(p.tipo_articulo)) throw Util.error('Indique el tipo de artículo');
    var marca = Util.texto(p.marca), modelo = Util.texto(p.modelo);
    if (!marca || !modelo) throw Util.error('Marca y modelo son obligatorios');
    var serie = Util.texto(p.numero_serie);
    var imei = Equipos.validarIdentificador(pl, p.tipo_articulo, p.imei, serie, '', '');
    if (p.id_proveedor && !pl.get('Proveedores', p.id_proveedor)) throw Util.error('El proveedor no existe');
    var e = pl.add('Equipos', { tipo_articulo: p.tipo_articulo, marca: marca, modelo: modelo, imei: imei, numero_serie: serie, id_proveedor: p.id_proveedor || '', proveedor: Util.texto(p.proveedor), garantia_proveedor_hasta: p.garantia_proveedor_hasta || '', estado: 'Detectado', fecha_deteccion: pl.ahora, notas: Util.texto(p.notas), version: 1 });
    pl.add('Historial_Estados', { id_equipo: e.id_equipo, fecha_hora: pl.ahora, estado_anterior: '', estado_nuevo: 'Detectado', responsable: pl.usuario.email, comentario: 'Equipo detectado' });
    pl.resultado = { id_equipo: e.id_equipo, version: 1 };
  }
});

// ---------- Transicion generica ----------
definir('transicionarEquipo', {
  roles: [ROL_ADMIN, ROL_COMPRADOR, ROL_TECNICO, ROL_SOPORTE],
  registros: function (p) { return ['EQ:' + p.id_equipo]; },
  planificar: function (p, pl, u) {
    var e = Equipos.obtener(pl, p.id_equipo); Equipos.verificarVersion(e, p.version);
    var nuevo = p.estado_nuevo, desde = e.estado;
    if (!TRANSICIONES[desde] || TRANSICIONES[desde].indexOf(nuevo) < 0) throw Util.error('Transición no permitida: ' + desde + ' → ' + nuevo);
    if (desde === 'Vendido' && nuevo === 'Publicado') throw Util.error('El desistimiento se registra con registrarDevolucion');
    if (DESTINOS_EXCLUSIVOS[nuevo]) throw Util.error('Ese cambio se hace con la operación ' + DESTINOS_EXCLUSIVOS[nuevo]);
    if (!Auth.tieneRol(u, [ROL_ADMIN]) && !Auth.tieneRol(u, ROLES_TRANSICION[desde + '>' + nuevo] || [])) throw Util.error('Su rol no puede hacer ' + desde + ' → ' + nuevo);
    var com = Util.texto(p.comentario);
    if (com.length < 3) throw Util.error('El comentario es obligatorio');
    if (desde === 'Recibido' && nuevo === 'Listo para venta' && e.tipo_articulo !== 'Artículo nuevo') throw Util.error('Solo un artículo nuevo pasa de Recibido a Listo para venta sin diagnóstico');
    if (desde === 'Listo para venta' && nuevo === 'Publicado' && !Util.num(e.precio_fijado)) throw Util.error('Fije el precio del equipo antes de publicarlo');
    if (desde === 'Comprado' && nuevo === 'Baja definitiva') {
      // Retracto de compra (Seccion 4.27)
      var reembolso = p.reembolso === undefined || p.reembolso === '' ? 0 : Util.entero(p.reembolso);
      if (isNaN(reembolso) || reembolso < 0) throw Util.error('El reembolso debe ser un entero mayor o igual a 0');
      if (reembolso > 0) {
        if (reembolso > Contab.costoTotal(pl, e.id_equipo)) throw Util.error('El reembolso no puede superar el costo de la unidad');
        var medios = Contab.normalizarMedios(p, reembolso);
        Contab.dinero(pl, 'Ingreso', 'Reembolso recibido', medios, 'Equipos', e.id_equipo, 'Retracto de compra');
        Contab.agregarCosto(pl, { id_equipo: e.id_equipo, tipo: 'Corrección de costo', monto: -reembolso, motivo: 'Retracto de compra', ref_tabla: 'Equipos', ref_id: e.id_equipo, afecta_caja: 'No' });
      }
    }
    Equipos.cambiarEstado(pl, e, nuevo, com);
    if (nuevo === 'Baja definitiva') {
      var C = Contab.costoTotal(pl, e.id_equipo);
      if (!Contab.ventaVigente(pl, e.id_equipo) && C > 0) Contab.asiento(pl, 'Baja de inventario', C, 'Baja', ['Equipos', e.id_equipo], { id_equipo: e.id_equipo });
    }
    pl.resultado = { id_equipo: e.id_equipo, estado: nuevo, version: Util.num(e.version) + 1 };
  }
});

// ---------- Consulta de IMEI ----------
definir('registrarConsultaIMEI', {
  roles: [ROL_COMPRADOR, ROL_TECNICO, ROL_ADMIN],
  registros: function (p) { return ['EQ:' + p.id_equipo]; },
  planificar: function (p, pl) {
    var e = Equipos.obtener(pl, p.id_equipo);
    if (e.tipo_articulo !== 'Celular') throw Util.error('Solo los celulares tienen consulta de IMEI');
    if (!String(e.imei)) throw Util.error('Cargue primero el IMEI del equipo');
    if (['Limpio', 'Bloqueado', 'Reportado', 'No consultado'].indexOf(p.resultado) < 0) throw Util.error('Resultado de consulta no válido');
    if (p.resultado === 'No consultado' && Util.texto(p.comentario).length < 5) throw Util.error('Explique por qué no se consultó');
    var c = pl.add('Consultas_IMEI', { id_equipo: e.id_equipo, fecha_hora: pl.ahora, resultado: p.resultado, fuente: Util.texto(p.fuente), responsable: pl.usuario.email, comentario: Util.texto(p.comentario), imei_consultado: String(e.imei) });
    pl.resultado = { id_consulta: c.id_consulta, advertencia: (p.resultado === 'Bloqueado' || p.resultado === 'Reportado') ? 'El IMEI figura como ' + p.resultado + '. La decisión de comprar es suya.' : '' };
  }
});

// ---------- Cierre de compra ----------
definir('cerrarCompra', {
  roles: [ROL_COMPRADOR, ROL_ADMIN],
  registros: function (p) { return ['EQ:' + p.id_equipo]; },
  planificar: function (p, pl) {
    var e = Equipos.obtener(pl, p.id_equipo); Equipos.verificarVersion(e, p.version);
    if (e.estado !== 'En negociación') throw Util.error('La compra se cierra desde En negociación');
    var precio = Util.entero(p.precio_compra);
    if (isNaN(precio) || precio <= 0) throw Util.error('El precio de compra debe ser un entero mayor que 0');
    if (e.tipo_articulo === 'Celular' && !Equipos.consultaVigente(pl, e)) throw Util.error('Registre la consulta de IMEI antes de cerrar la compra');
    var idProv = p.id_proveedor || e.id_proveedor;
    if ((e.tipo_articulo === 'Celular' || e.tipo_articulo === 'Artículo usado') && !idProv) throw Util.error('Indique el proveedor (nombre y teléfono) antes de cerrar la compra');
    if (idProv && !pl.get('Proveedores', idProv)) throw Util.error('El proveedor no existe');
    var medios = Contab.normalizarMedios(p, precio);
    Contab.agregarCosto(pl, { id_equipo: e.id_equipo, tipo: 'Compra', monto: precio, ref_tabla: 'Equipos', ref_id: e.id_equipo, afecta_caja: 'Sí' });
    Contab.dinero(pl, 'Egreso', 'Compra de equipo', medios, 'Equipos', e.id_equipo, '');
    pl.upd('Equipos', e.id_equipo, { fecha_compra: pl.ahora, id_proveedor: idProv || '' }, false);
    Equipos.cambiarEstado(pl, e, 'Comprado', 'Compra cerrada, precio ' + precio + ' Gs.');
    pl.resultado = { id_equipo: e.id_equipo, estado: 'Comprado', precio_compra: precio, version: Util.num(e.version) + 1 };
  }
});

// ---------- Datos del equipo, precio fijado, valor de reventa ----------
definir('editarDatosEquipo', {
  roles: [ROL_COMPRADOR, ROL_ADMIN],
  registros: function (p) { return ['EQ:' + p.id_equipo]; },
  planificar: function (p, pl, u) {
    var e = Equipos.obtener(pl, p.id_equipo); Equipos.verificarVersion(e, p.version);
    var campo = p.campo; if (['marca', 'modelo', 'imei', 'numero_serie', 'tipo_articulo'].indexOf(campo) < 0) throw Util.error('Campo no editable');
    var motivo = Util.texto(p.motivo); if (motivo.length < 5) throw Util.error('El motivo es obligatorio');
    var temprano = ['Detectado', 'En negociación', 'Comprado', 'Recibido'].indexOf(e.estado) >= 0;
    if (!temprano && !Auth.tieneRol(u, [ROL_ADMIN])) throw Util.error('Después de Recibido solo el Administrador corrige estos datos');
    var nuevo = Util.texto(p.valor_nuevo);
    if (campo === 'tipo_articulo' && !Equipos.tipoValido(nuevo)) throw Util.error('Tipo de artículo no válido');
    if (!nuevo && (campo === 'marca' || campo === 'modelo' || campo === 'tipo_articulo')) throw Util.error('El valor no puede quedar vacío');
    var cambios = {}, advertencia = '';
    if (campo === 'imei') { nuevo = Equipos.validarIdentificador(pl, e.tipo_articulo, nuevo, '', e.id_equipo, e.id_unidad_origen); }
    if (campo === 'numero_serie') Equipos.validarIdentificador(pl, e.tipo_articulo, '', nuevo, e.id_equipo, e.id_unidad_origen);
    if (campo === 'imei') {
      var ult = Equipos.consultaVigente(pl, e);
      if (ult && (ult.resultado === 'Reportado' || ult.resultado === 'Bloqueado') && !Auth.tieneRol(u, [ROL_ADMIN])) throw Util.error('Solo el Administrador puede cambiar el IMEI de un equipo reportado o bloqueado');
      if (ult && (ult.resultado === 'Reportado' || ult.resultado === 'Bloqueado')) advertencia = 'El IMEI anterior figuraba como ' + ult.resultado;
    }
    var anterior = String(e[campo]);
    if (anterior === nuevo) throw Util.error('El valor nuevo es igual al actual');
    cambios[campo] = nuevo;
    pl.add('Cambios_Equipo', { id_equipo: e.id_equipo, campo: campo, valor_anterior: anterior, valor_nuevo: nuevo, motivo: motivo, responsable: u.email, fecha_hora: pl.ahora });
    pl.upd('Equipos', e.id_equipo, cambios, true);
    pl.resultado = { id_equipo: e.id_equipo, campo: campo, advertencia: advertencia, requiere_nueva_consulta_imei: campo === 'imei' && e.tipo_articulo === 'Celular', version: Util.num(e.version) + 1 };
  }
});

definir('fijarPrecio', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['EQ:' + p.id_equipo]; },
  planificar: function (p, pl) {
    var e = Equipos.obtener(pl, p.id_equipo); Equipos.verificarVersion(e, p.version);
    var precio = Util.entero(p.precio); if (isNaN(precio) || precio <= 0) throw Util.error('El precio debe ser un entero mayor que 0');
    pl.add('Precios_Equipo', { id_equipo: e.id_equipo, fecha_hora: pl.ahora, precio: precio, responsable: pl.usuario.email, motivo: Util.texto(p.motivo) });
    pl.upd('Equipos', e.id_equipo, { precio_fijado: precio }, true);
    pl.cache('equipo:' + e.id_equipo);
    pl.resultado = { id_equipo: e.id_equipo, precio_fijado: precio, version: Util.num(e.version) + 1 };
  }
});

definir('fijarValorReventa', {
  roles: [ROL_COMPRADOR, ROL_ADMIN],
  registros: function (p) { return ['EQ:' + p.id_equipo]; },
  planificar: function (p, pl) {
    var e = Equipos.obtener(pl, p.id_equipo); Equipos.verificarVersion(e, p.version);
    var v = Util.entero(p.valor); if (isNaN(v) || v <= 0) throw Util.error('El valor de reventa debe ser un entero mayor que 0');
    pl.upd('Equipos', e.id_equipo, { valor_reventa_estimado: v, valor_reventa_responsable: pl.usuario.email, valor_reventa_fecha: pl.ahora }, true);
    pl.resultado = { id_equipo: e.id_equipo, valor_reventa_estimado: v, version: Util.num(e.version) + 1 };
  }
});

// ---------- Costos de la unidad ----------
definir('registrarCostoUnidad', {
  roles: [ROL_COMPRADOR, ROL_ADMIN],
  registros: function (p) { return ['EQ:' + p.id_equipo]; },
  huella: function (p) { return ['registrarCostoUnidad', p.id_equipo, p.tipo, p.monto].join('|'); },
  planificar: function (p, pl) {
    var e = Equipos.obtener(pl, p.id_equipo);
    if (['Transporte', 'Repuesto directo'].indexOf(p.tipo) < 0) throw Util.error('El tipo debe ser Transporte o Repuesto directo');
    var monto = Util.entero(p.monto); if (isNaN(monto) || monto <= 0) throw Util.error('El monto debe ser un entero mayor que 0');
    var sin = (p.afecta_caja === 'No' || p.afecta_caja === false);
    if (sin && ['Stock propio', 'Deuda con proveedor', 'Aporte de terceros', 'Pendiente de pago'].indexOf(p.origen_sin_pago) < 0) throw Util.error('Indique el origen del costo sin pago real');
    var medios = sin ? null : Contab.normalizarMedios(p, monto);
    var confirma = p.confirmar_duplicado === true || p.confirmar_duplicado === 'Sí';
    if (!confirma) {
      var limite = Util.fechaDeDate(new Date(Date.now() - 24 * 3600 * 1000));
      var prev = pl.filas('Costos_Unidad').filter(function (c) { return c.id_equipo === e.id_equipo && Util.num(c.monto) === monto && c.fecha_hora >= limite && c.tipo !== 'Compra'; });
      if (RELOJ_FIJO) prev = pl.filas('Costos_Unidad').filter(function (c) { return c.id_equipo === e.id_equipo && Util.num(c.monto) === monto && Util.segundosEntre(c.fecha_hora, pl.ahora) <= 86400 && c.tipo !== 'Compra'; });
      if (prev.length) { var er = Util.error('Ya hay un costo de ' + monto + ' Gs en las últimas 24 horas (' + prev[0].tipo + ': ' + prev[0].descripcion + '). Confirme si es otro costo distinto.'); er.codigo = 'duplicado'; throw er; }
    }
    var c = Contab.agregarCosto(pl, { id_equipo: e.id_equipo, tipo: p.tipo, monto: monto, descripcion: Util.texto(p.descripcion), ref_tabla: 'Equipos', ref_id: e.id_equipo, afecta_caja: sin ? 'No' : 'Sí', origen_sin_pago: sin ? p.origen_sin_pago : '' });
    if (!sin) Contab.dinero(pl, 'Egreso', p.tipo === 'Transporte' ? 'Transporte' : 'Repuesto directo', medios, 'Costos_Unidad', c.id_costo, Util.texto(p.descripcion));
    pl.resultado = { id_costo: c.id_costo, costo_total: Contab.costoTotal(pl, e.id_equipo), efecto_ganancia: c.efecto_ganancia };
  }
});

definir('ajustarCostoUnidad', {
  roles: [ROL_ADMIN],
  registros: function (p) { return ['EQ:' + p.id_equipo]; },
  huella: function (p) { return ['ajustarCostoUnidad', p.id_equipo, p.tipo, p.monto].join('|'); },
  planificar: function (p, pl) {
    var e = Equipos.obtener(pl, p.id_equipo);
    if (['Garantía o retrabajo', 'Repuesto devuelto', 'Corrección de costo'].indexOf(p.tipo) < 0) throw Util.error('Tipo de ajuste no válido');
    var monto = Util.entero(p.monto); if (isNaN(monto) || monto === 0) throw Util.error('El monto debe ser un entero distinto de 0');
    if (p.tipo === 'Repuesto devuelto' && monto > 0) throw Util.error('Un repuesto devuelto baja el costo (monto negativo)');
    if (p.tipo === 'Garantía o retrabajo' && monto < 0) throw Util.error('Un costo de garantía o retrabajo suma (monto positivo)');
    var motivo = Util.texto(p.motivo); if (motivo.length < 5) throw Util.error('El motivo es obligatorio');
    var caja = (p.afecta_caja === 'Sí' || p.afecta_caja === true);
    var medios = caja ? Contab.normalizarMedios(p, Math.abs(monto)) : null;
    var c = Contab.agregarCosto(pl, { id_equipo: e.id_equipo, tipo: p.tipo, monto: monto, motivo: motivo, ref_tabla: 'Equipos', ref_id: e.id_equipo, afecta_caja: caja ? 'Sí' : 'No' });
    if (caja) Contab.dinero(pl, monto > 0 ? 'Egreso' : 'Ingreso', monto > 0 ? 'Corrección de costo' : 'Reembolso recibido', medios, 'Costos_Unidad', c.id_costo, motivo);
    pl.resultado = { id_costo: c.id_costo, costo_total: Contab.costoTotal(pl, e.id_equipo), efecto_ganancia: c.efecto_ganancia };
  }
});

// ---------- Lecturas ----------
definir('obtenerEquipos', {
  roles: [ROL_ADMIN, ROL_COMPRADOR, ROL_TECNICO, ROL_SOPORTE], lectura: true,
  leer: function (p, u) {
    var verCostos = Auth.tieneRol(u, [ROL_ADMIN, ROL_COMPRADOR]);
    return Datos.leer('Equipos').map(function (e) {
      var o = { id_equipo: e.id_equipo, tipo_articulo: e.tipo_articulo, marca: e.marca, modelo: e.modelo, imei: e.imei, numero_serie: e.numero_serie, estado: e.estado, fecha_deteccion: e.fecha_deteccion, fecha_compra: e.fecha_compra, precio_fijado: e.precio_fijado, precio_venta: e.precio_venta, version: e.version, id_proveedor: e.id_proveedor, valor_reventa_estimado: e.valor_reventa_estimado };
      if (verCostos) { o.costo_total = e.costo_total; o.precio_compra = e.precio_compra; o.costo_reparacion_total = e.costo_reparacion_total; }
      return o;
    });
  }
});

definir('obtenerFichaEquipo', {
  roles: [ROL_ADMIN, ROL_COMPRADOR, ROL_TECNICO, ROL_SOPORTE], lectura: true,
  leer: function (p, u) {
    var e = Datos.buscar('Equipos', 'id_equipo', p.id_equipo);
    if (!e) throw Util.error('No existe el equipo');
    var id = e.id_equipo, ver = Auth.tieneRol(u, [ROL_ADMIN, ROL_COMPRADOR]);
    var por = function (h) { return Datos.filtrar(h, function (x) { return x.id_equipo === id; }); };
    var reps = por('Reparaciones');
    var ficha = {
      equipo: e, historial: por('Historial_Estados'), diagnosticos: por('Diagnosticos'), consultas_imei: por('Consultas_IMEI'),
      reparaciones: reps.map(function (r) { return { reparacion: r, trabajos: Datos.filtrar('Reparacion_Trabajos', function (t) { return t.id_reparacion === r.id_reparacion; }), usos: Datos.filtrar('Repuestos_Usados', function (x) { return x.id_reparacion === r.id_reparacion; }) }; }),
      ventas: por('Ventas'), cambios: por('Cambios_Equipo'),
      rechazos_garantia: Datos.filtrar('Decisiones', function (d) { return d.id_equipo === id && d.categoria === 'Garantía'; })
    };
    if (ver) { ficha.costos = por('Costos_Unidad'); ficha.precios = por('Precios_Equipo'); ficha.ganancia_equipos = Contab.gananciaEquipos(FuenteDatos, id); }
    var prov = e.id_proveedor ? Datos.buscar('Proveedores', 'id_proveedor', e.id_proveedor) : null;
    ficha.proveedor = prov;
    // mano de obra provisional (tarifas pendientes)
    ficha.mano_obra_provisional = Util.suma(reps.filter(function (r) { return r.estado_tarifa === 'Pendiente de aprobación' || r.estado_tarifa === 'Devuelta'; }), function (r) { return Taller.totalElegido(FuenteDatos, r.id_reparacion, r.ronda_tarifa); });
    var parc = 0; reps.slice().reverse().some(function (r) { if (r.resultado === 'Reparado parcialmente') { parc++; return false; } return true; });
    ficha.trabajos_parciales_seguidos = parc;
    ficha.alerta_parciales = parc >= Config.valor('trabajos_parciales_alerta');
    return ficha;
  }
});
