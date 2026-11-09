// GESTION_CELULARES - Operaciones.gs (Diseno Tecnico, Secciones 4.16, 5.2, 5.7)
// Marco comun de TODA operacion que escribe:
//   1. bloqueo unico (LockService), maximo 30 s
//   2. id_operacion: si esta Completa devuelve el resultado guardado; si esta
//      Iniciada reanuda con el plan guardado, sin revalidar
//   3. operacion nueva: valida y calcula TODO el plan sin escribir nada;
//      si algo se rechaza no queda ninguna fila
//   4. escribe la fila Iniciada (payload + plan + registros reservados)
//   5. aplica el plan en orden fijo (cada fila se identifica por su clave
//      primaria generada al planificar: reanudar no duplica), recalcula las
//      cachés desde los libros y marca Completa
// Los identificadores y los importes se calculan una sola vez, al planificar.

var PKS = { Equipos: 'id_equipo', Historial_Estados: 'id_historial', Diagnosticos: 'id_diagnostico', Reparaciones: 'id_reparacion', Repuestos_Usados: 'id_uso', Repuestos: 'id_repuesto', Ventas: 'id_venta', Clientes: 'id_cliente', Decisiones: 'id_decision', Movimientos_Repuestos: 'id_movimiento', Usuarios: 'email', Proveedores: 'id_proveedor', Gastos_Operativos: 'id_gasto', Costos_Unidad: 'id_costo', Asientos_Ganancia: 'id_asiento', Creditos: 'id_credito', Cuotas: 'id_cuota', Cobros: 'id_cobro', Aplicaciones_Cuota: 'id_aplicacion', Eventos_Credito: 'id_evento', Movimientos_Fondo: 'id_mov_fondo', Saldo_Cliente: 'id_mov_saldo', Devoluciones: 'id_devolucion', Ordenes_Servicio: 'id_orden', Historial_Ordenes: 'id_historial_orden', Tarifas_Trabajo: 'id_tarifa', Costos_Tecnico: 'id_costo_tecnico', Liquidaciones_Tecnico: 'id_liquidacion', Movimientos_Dinero: 'id_mov_dinero', Consultas_IMEI: 'id_consulta', Cierres_Mensuales: 'id_cierre', Precios_Equipo: 'id_precio', Cambios_Equipo: 'id_cambio', Reparacion_Trabajos: 'id_rt', Aprobaciones_Tarifa: 'id_aprobacion', Configuracion: 'clave', Registros_Bloqueados: 'registro' };
var IDPREF = { Equipos: ['EQ', 3], Diagnosticos: ['DIAG', 3], Reparaciones: ['REP', 3], Repuestos_Usados: ['USO', 6], Repuestos: ['RP', 3], Ventas: ['VTA', 3], Clientes: ['CLI', 3], Decisiones: ['DEC', 3], Proveedores: ['PRV', 3], Costos_Unidad: ['COS', 6], Asientos_Ganancia: ['ASI', 6], Creditos: ['CRE', 6], Cuotas: ['CUO', 6], Cobros: ['COB', 6], Aplicaciones_Cuota: ['APL', 6], Eventos_Credito: ['EVC', 6], Movimientos_Fondo: ['FON', 6], Saldo_Cliente: ['SAL', 6], Devoluciones: ['DEV', 6], Ordenes_Servicio: ['ORD', 6], Tarifas_Trabajo: ['TAR', 3], Costos_Tecnico: ['CTE', 6], Movimientos_Dinero: ['MOV', 6], Consultas_IMEI: ['IMEI', 6], Precios_Equipo: ['PRE', 6], Cambios_Equipo: ['CAM', 6], Reparacion_Trabajos: ['RT', 6], Aprobaciones_Tarifa: ['APT', 6] };
var PK_NUMERICAS = ['Historial_Estados', 'Historial_Ordenes', 'Gastos_Operativos', 'Movimientos_Repuestos'];

var OPS = {};
function definir(nombre, def) { def.nombre = nombre; OPS[nombre] = def; }

// ---------- Planificador ----------
function Planificador(usuario, idOp, nombre) {
  this.usuario = usuario; this.idOp = idOp; this.nombre = nombre;
  this.ahora = Util.ahora();
  this.writes = []; this.caches = []; this.virtual = {}; this.parches = {}; this.tocados = {};
  this.registros = [];
}
Planificador.prototype.nuevoId = function (hoja) {
  if (PK_NUMERICAS.indexOf(hoja) >= 0) return Datos.siguienteNumero(hoja, PKS[hoja]);
  var p = IDPREF[hoja]; if (!p) throw Util.error('Sin prefijo de id para ' + hoja);
  return Datos.siguienteId(hoja, PKS[hoja], p[0], p[1]);
};
Planificador.prototype.filas = function (hoja) {
  var base = Datos.leer(hoja), v = this.virtual[hoja];
  var salida = base.map(function (f) { return this.parchear(hoja, f); }, this);
  return v ? salida.concat(v) : salida;
};
Planificador.prototype.parchear = function (hoja, fila) {
  var pk = PKS[hoja]; if (!pk) return fila;
  var p = this.parches[hoja + '|' + fila[pk]];
  if (!p) return fila;
  var o = {}, k; for (k in fila) o[k] = fila[k]; for (k in p) o[k] = p[k]; return o;
};
Planificador.prototype.get = function (hoja, pk) {
  var col = PKS[hoja];
  var f = Datos.buscar(hoja, col, pk);
  if (!f) { var v = this.virtual[hoja] || []; for (var i = 0; i < v.length; i++) if (String(v[i][col]) === String(pk)) { f = v[i]; break; } }
  return f ? this.parchear(hoja, f) : null;
};
Planificador.prototype.add = function (hoja, obj) {
  var cols = HOJAS[hoja], fila = {}, i;
  for (i = 0; i < cols.length; i++) fila[cols[i]] = (obj[cols[i]] === undefined || obj[cols[i]] === null) ? '' : obj[cols[i]];
  var pk = PKS[hoja];
  if (pk && (fila[pk] === '' || fila[pk] === undefined)) fila[pk] = this.nuevoId(hoja);
  if (HOJAS[hoja].indexOf('id_operacion') >= 0 && fila.id_operacion === '') fila.id_operacion = this.idOp;
  if (HOJAS[hoja].indexOf('secuencia') >= 0 && fila.secuencia === '') fila.secuencia = this.writes.length + 1;
  this.writes.push({ t: 'add', hoja: hoja, fila: fila });
  (this.virtual[hoja] = this.virtual[hoja] || []).push(fila);
  return fila;
};
// Cambia una fila existente (valores absolutos: reaplicar es inofensivo)
Planificador.prototype.upd = function (hoja, pk, cambios, conVersion) {
  var clave = hoja + '|' + pk, actual = this.get(hoja, pk);
  if (!actual) throw Util.error('No existe ' + hoja + ' ' + pk);
  var c = {}, k; for (k in cambios) c[k] = cambios[k];
  if (conVersion && !this.tocados[clave]) { c.version = Number(actual.version || 0) + 1; this.tocados[clave] = true; }
  this.parches[clave] = this.parches[clave] || {};
  for (k in c) this.parches[clave][k] = c[k];
  this.writes.push({ t: 'upd', hoja: hoja, pk: pk, cambios: c });
};
Planificador.prototype.cache = function (nombre) { if (this.caches.indexOf(nombre) < 0) this.caches.push(nombre); };
Planificador.prototype.registro = function (r) { if (this.registros.indexOf(r) < 0) this.registros.push(r); };
Planificador.prototype.decision = function (categoria, contexto, decision, razon, idEquipo) {
  var f = this.add('Decisiones', { fecha: Util.hoy(), categoria: categoria, descripcion_contexto: contexto, decision_tomada: decision, razon_principal: razon, quien_decidio: this.usuario.email, impacto_esperado: '', estado: 'Vigente', id_equipo: idEquipo || '' });
  return f.id_decision;
};

// ---------- Aplicar un plan ----------
function aplicarPlan(plan) {
  var vistos = {};
  function existe(hoja, pk) {
    if (!vistos[hoja]) { vistos[hoja] = {}; Datos.leer(hoja).forEach(function (f) { vistos[hoja][String(f[PKS[hoja]])] = true; }); }
    return vistos[hoja][String(pk)];
  }
  for (var i = 0; i < plan.writes.length; i++) {
    var w = plan.writes[i];
    if (w.t === 'add') {
      var pk = PKS[w.hoja];
      if (pk && existe(w.hoja, w.fila[pk])) continue;
      Datos.agregar(w.hoja, w.fila);
      if (pk) vistos[w.hoja][String(w.fila[pk])] = true;
    } else {
      var f = Datos.buscar(w.hoja, PKS[w.hoja], w.pk);
      if (f) Datos.actualizar(w.hoja, f, w.cambios);
    }
  }
  for (var j = 0; j < plan.caches.length; j++) Contab.recalcular(plan.caches[j]);
}

// ---------- Ejecucion ----------
function ejecutarOperacion(nombre, params, usuario) {
  var def = OPS[nombre];
  if (!def) throw Util.error('Operacion desconocida: ' + nombre);
  params = params || {};
  if (!Auth.tieneRol(usuario, typeof def.roles === 'function' ? def.roles(params, usuario) : def.roles)) {
    throw Util.error('Su rol no permite esta operacion');
  }
  if (def.lectura) return def.leer(params, usuario);

  var idOp = Util.texto(params.id_operacion);
  if (idOp.length < 8) throw Util.error('Falta id_operacion (identificador de la operacion)');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw Util.error('Sistema ocupado, reintente en unos segundos');
  try {
    Datos.reiniciar();
    var fila = Datos.buscar('Operaciones', 'id_operacion', idOp);
    if (fila && fila.estado === 'Completa') return JSON.parse(fila.resultado_resumen || 'null');
    if (fila && fila.estado === 'Iniciada') return completarOperacion(fila, JSON.parse(fila.plan));

    var pl = new Planificador(usuario, idOp, nombre);
    var registros = def.registros ? def.registros(params) : [];
    // 1) reservas: otra operacion Iniciada sobre el mismo registro
    var pend = Datos.filtrar('Operaciones', function (o) { return o.estado === 'Iniciada'; });
    registros.forEach(function (r) {
      pend.forEach(function (o) { if (String(o.registro).split(',').indexOf(r) >= 0) throw Util.error('operacion pendiente sobre ' + r); });
    });
    // 2) registros bloqueados por diferencia (solo el ajuste correctivo pasa)
    var correctivo = params.correctivo === true || params.correctivo === 'Sí';
    registros.forEach(function (r) {
      var b = Datos.buscar('Registros_Bloqueados', 'registro', r);
      if (b && b.activo === 'Sí' && !correctivo) throw Util.error('registro bloqueado por diferencia: ' + r);
    });
    if (correctivo && !Util.texto(params.id_decision)) throw Util.error('el ajuste correctivo exige una entrada en Decisiones (id_decision)');
    // 3) guardia contra el doble toque con otro id_operacion
    var huella = def.huella ? def.huella(params) : '';
    if (huella) {
      var h2 = huella + '|' + (correctivo ? 'C' : 'O');
      var dup = Datos.filtrar('Operaciones', function (o) { return o.huella === h2 && o.id_operacion !== idOp && Util.segundosEntre(o.fecha_inicio, pl.ahora) <= 120; });
      var confirma = params.confirmar_duplicado === true || params.confirmar_duplicado === 'Sí';
      if (dup.length && !confirma) { var e = Util.error('posible duplicado: confirmar para registrar'); e.codigo = 'duplicado'; throw e; }
      huella = h2;
    }
    // 4) validar y planificar (aqui se rechaza sin escribir nada)
    def.planificar(params, pl, usuario);
    registros.forEach(function (r) { pl.registro(r); });
    var plan = { writes: pl.writes, caches: pl.caches, resultado: pl.resultado || {}, registros: pl.registros };
    var nueva = Datos.agregar('Operaciones', { id_operacion: idOp, endpoint: nombre, fecha_hora: '', fecha_inicio: pl.ahora, responsable: usuario.email, resultado_resumen: '', estado: 'Iniciada', registro: pl.registros.join(','), payload: JSON.stringify(params), huella: huella, plan: JSON.stringify(plan) });
    var res = completarOperacion(nueva, plan);
    if (correctivo) { var rojos = Invariantes.revisar(pl.registros); if (rojos.length) { res = JSON.parse(JSON.stringify(res || {})); res.diferencias = rojos.map(function (x) { return x.detalle; }); } }
    return res;
  } finally {
    lock.releaseLock();
  }
}

function completarOperacion(fila, plan) {
  aplicarPlan(plan);
  Datos.actualizar('Operaciones', fila, { estado: 'Completa', fecha_hora: Util.ahora(), resultado_resumen: JSON.stringify(plan.resultado), plan: '' });
  return plan.resultado;
}

// ---------- Administracion de operaciones interrumpidas (Seccion 5.7) ----------
definir('listarOperacionesPendientes', { roles: [ROL_ADMIN], lectura: true, leer: function () {
  var ahora = Util.ahora();
  return Datos.filtrar('Operaciones', function (o) { return o.estado === 'Iniciada'; }).map(function (o) {
    return { id_operacion: o.id_operacion, endpoint: o.endpoint, registros: String(o.registro).split(',').filter(Boolean), antiguedad_min: Math.floor(Util.segundosEntre(o.fecha_inicio, ahora) / 60), payload: o.payload, responsable: o.responsable };
  });
} });

// resolverOperacionInterrumpida tiene su propio camino (no usa el marco: opera sobre otra operacion);
// Main.gs la despacha aparte.
function resolverOperacionInterrumpida(p, usuario) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw Util.error('Sistema ocupado, reintente en unos segundos');
  try {
    Datos.reiniciar();
    var f = Datos.buscar('Operaciones', 'id_operacion', p.id_operacion_pendiente);
    if (!f || f.estado !== 'Iniciada') throw Util.error('no hay una operacion pendiente con ese id');
    if (p.accion === 'reanudar') return completarOperacion(f, JSON.parse(f.plan));
    if (p.accion !== 'abandonar') throw Util.error('accion invalida: reanudar o abandonar');
    if (f.endpoint === 'aprobarTarifaReparacion' || f.endpoint === 'corregirTarifaAprobada') throw Util.error('esta operacion no se abandona: se reanuda hasta completarla');
    var motivo = Util.texto(p.motivo);
    if (motivo.length < 5) throw Util.error('abandonar exige un motivo');
    var dec = Datos.agregar('Decisiones', { id_decision: Datos.siguienteId('Decisiones', 'id_decision', 'DEC', 3), fecha: Util.hoy(), categoria: 'Procesos', descripcion_contexto: 'Operacion interrumpida ' + f.id_operacion + ' (' + f.endpoint + ')', decision_tomada: 'Abandonada por el Administrador', razon_principal: motivo, quien_decidio: p.__usuario_email, impacto_esperado: 'Las filas ya escritas no se deshacen', estado: 'Vigente' });
    Datos.actualizar('Operaciones', f, { estado: 'Completa', fecha_hora: Util.ahora(), resultado_resumen: JSON.stringify('abandonada por el Administrador'), motivo_resolucion: motivo, id_decision: dec.id_decision, plan: '' });
    var difs = Invariantes.verificarRegistros(String(f.registro).split(',').filter(Boolean));
    if (difs.length) difs.forEach(function (d) { Invariantes.bloquear(d.registro, d.detalle); });
    return { abandonada: true, id_decision: dec.id_decision, diferencias: difs };
  } finally { lock.releaseLock(); }
}
