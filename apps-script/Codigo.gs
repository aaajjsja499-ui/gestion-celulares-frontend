// GESTION_CELULARES - Codigo.gs (backend completo en un solo archivo, v4.0.0)
// Generado concatenando los modulos de /backend en este orden: Esquema, Util, Motor, Datos, Config, Auth, Operaciones, Contab, Equipos, Taller, Ventas, Creditos, Ordenes, Tecnico, Caja, Cierre, Invariantes, Maestros, Main, Setup, PruebasMotor


// ======== Esquema.gs ========
// GESTION_CELULARES - Esquema.gs (Diseno Tecnico v4.2, Seccion 3)
// Definicion unica de las hojas y sus columnas, y de los valores iniciales
// de Configuracion. Setup.gs crea las hojas desde aqui.
// Los libros (solo se agregan filas) llevan ademas la columna "secuencia":
// junto con id_operacion forma la clave determinista de la Seccion 5.7.

var ROL_ADMIN = 'Administrador', ROL_COMPRADOR = 'Comprador', ROL_TECNICO = 'Técnico', ROL_SOPORTE = 'Soporte de garantía';
var ROLES_VALIDOS = [ROL_ADMIN, ROL_COMPRADOR, ROL_TECNICO, ROL_SOPORTE];

var ESTADOS_EQUIPO = ['Detectado', 'En negociación', 'Comprado', 'Recibido', 'En diagnóstico', 'En reparación', 'Esperando repuestos', 'Reparado', 'En pruebas', 'Listo para venta', 'Publicado', 'Reservado', 'Vendido', 'Entregado', 'En garantía', 'Devuelto', 'Desarmado para repuestos', 'Baja definitiva', 'Cerrado por venta'];

// Libros: hojas de solo-agregar (Seccion 3.35)
var LIBROS = ['Historial_Estados', 'Historial_Ordenes', 'Costos_Unidad', 'Asientos_Ganancia', 'Cobros', 'Aplicaciones_Cuota', 'Eventos_Credito', 'Movimientos_Fondo', 'Saldo_Cliente', 'Movimientos_Dinero', 'Movimientos_Repuestos', 'Costos_Tecnico', 'Consultas_IMEI', 'Precios_Equipo', 'Cambios_Equipo', 'Reparacion_Trabajos', 'Aprobaciones_Tarifa', 'Devoluciones', 'Decisiones', 'Repuestos_Usados', 'Cuotas', 'Diagnosticos'];

var HOJAS = {
  Equipos: ['id_equipo', 'tipo_articulo', 'marca', 'modelo', 'imei', 'numero_serie', 'id_proveedor', 'proveedor', 'garantia_proveedor_hasta', 'id_unidad_origen', 'estado', 'fecha_deteccion', 'fecha_compra', 'precio_compra', 'costo_reparacion_total', 'costo_total', 'precio_venta', 'precio_fijado', 'valor_reventa_estimado', 'valor_reventa_responsable', 'valor_reventa_fecha', 'cliente', 'notas', 'version'],
  Historial_Estados: ['id_historial', 'id_equipo', 'fecha_hora', 'estado_anterior', 'estado_nuevo', 'responsable', 'comentario', 'id_operacion', 'secuencia'],
  Diagnosticos: ['id_diagnostico', 'id_equipo', 'fecha', 'tecnico', 'pantalla', 'tactil', 'bateria', 'camara_trasera', 'camara_frontal', 'altavoz', 'microfono', 'puerto_carga', 'botones', 'huella_faceid', 'wifi', 'bluetooth', 'red_movil', 'imei_verificado', 'estado_fisico', 'evidencia_humedad', 'comentario', 'id_operacion', 'secuencia'],
  Reparaciones: ['id_reparacion', 'id_equipo', 'fecha_inicio', 'fecha_fin', 'tecnico', 'tiempo_invertido_min', 'costo_mano_obra', 'tarifa_trabajo', 'id_tarifa', 'estado_tarifa', 'tarifa_migrada', 'tecnico_email', 'ronda_tarifa', 'id_orden', 'origen', 'id_reparacion_origen', 'resultado', 'motivo_resultado', 'id_reparacion_anterior', 'comentario', 'version'],
  Repuestos_Usados: ['id_uso', 'id_reparacion', 'id_repuesto', 'descripcion', 'cantidad', 'costo_unitario_aplicado', 'costo_total_aplicado', 'id_equipo', 'id_orden', 'estado', 'id_operacion', 'secuencia'],
  Repuestos: ['id_repuesto', 'nombre', 'compatibilidad', 'proveedor', 'costo_unitario', 'stock_actual', 'tiempo_reposicion_dias', 'notas', 'activo'],
  Ventas: ['id_venta', 'id_equipo', 'fecha_venta', 'cliente', 'precio_venta', 'canal_venta', 'garantia_dias', 'tipo_venta', 'entrega_inicial', 'id_credito', 'estado_venta', 'id_devolucion', 'estado_garantia', 'precio_fijado_vigente', 'responsable', 'fecha_entrega'],
  Clientes: ['id_cliente', 'nombre', 'contacto', 'notas', 'ficha_credito_completa', 'tipo_documento', 'numero_documento', 'foto_documento_frente', 'foto_documento_dorso', 'fecha_nacimiento', 'telefono_secundario', 'correo', 'domicilio_direccion', 'domicilio_barrio_ciudad', 'domicilio_referencias', 'domicilio_mapa', 'domicilio_foto_fachada', 'trabajo_lugar', 'trabajo_direccion', 'trabajo_sucursal', 'trabajo_telefono', 'trabajo_antiguedad', 'ingreso_comprobante', 'referencia1_nombre', 'referencia1_parentesco', 'referencia1_telefono', 'referencia2_nombre', 'referencia2_parentesco', 'referencia2_telefono', 'verificada_por', 'verificada_en'],
  Decisiones: ['id_decision', 'fecha', 'categoria', 'descripcion_contexto', 'decision_tomada', 'razon_principal', 'quien_decidio', 'impacto_esperado', 'estado', 'id_equipo', 'id_operacion', 'secuencia'],
  Configuracion: ['clave', 'valor'],
  Movimientos_Repuestos: ['id_movimiento', 'id_repuesto', 'fecha_hora', 'cantidad', 'motivo', 'responsable', 'monto_pagado', 'valor_unitario', 'id_equipo_origen', 'comentario', 'id_operacion', 'secuencia'],
  Usuarios: ['email', 'nombre', 'roles', 'activo', 'fecha_alta', 'pin_hash'],
  Sesiones_Activas: ['token', 'email', 'fecha_expiracion'],
  Proveedores: ['id_proveedor', 'nombre', 'contacto', 'canal_habitual', 'notas'],
  Gastos_Operativos: ['id_gasto', 'fecha', 'categoria', 'monto', 'medio', 'descripcion', 'responsable', 'anulado', 'motivo_anulacion', 'id_operacion'],
  Costos_Unidad: ['id_costo', 'id_equipo', 'fecha_hora', 'tipo', 'monto', 'motivo', 'posterior_a_venta', 'costo_total_anterior', 'costo_total_posterior', 'efecto_ganancia', 'ref_tabla', 'ref_id', 'afecta_caja', 'origen_sin_pago', 'descripcion', 'id_operacion', 'secuencia', 'responsable'],
  Asientos_Ganancia: ['id_asiento', 'fecha_hora', 'renglon', 'id_equipo', 'id_credito', 'id_orden', 'id_venta', 'delta', 'saldo_posterior', 'causa', 'ref_tabla', 'ref_id', 'id_operacion', 'secuencia', 'responsable'],
  Creditos: ['id_credito', 'id_venta', 'id_equipo', 'id_cliente', 'fecha_apertura', 'precio', 'entrega_inicial', 'capital_financiado', 'cuota_monto', 'cantidad_cuotas', 'frecuencia', 'fecha_primera_cuota', 'deuda_total', 'interes_bruto', 'tope_fondo', 'pct_capital_bps', 'pct_fondo_bps', 'estado', 'pendiente_capital', 'pendiente_fondo', 'pendiente_interes', 'cobrado_precio', 'interes_cobrado', 'fondo_aportado', 'descuento_total', 'version'],
  Cuotas: ['id_cuota', 'id_credito', 'nro', 'fecha_vencimiento', 'monto', 'cubierto', 'id_operacion', 'secuencia'],
  Cobros: ['id_cobro', 'id_credito', 'fecha_hora', 'tipo', 'id_cobro_revertido', 'id_devolucion', 'medio', 'monto_recibido', 'monto_aplicado', 'saldo_favor_generado', 'capital', 'fondo', 'interes', 'responsable', 'comentario', 'id_operacion', 'secuencia'],
  Aplicaciones_Cuota: ['id_aplicacion', 'id_cobro', 'id_cuota', 'monto', 'id_operacion', 'secuencia'],
  Eventos_Credito: ['id_evento', 'id_credito', 'fecha_hora', 'tipo', 'estado_anterior', 'estado_nuevo', 'motivo', 'autorizado_por', 'dias_atraso', 'deuda_perdonada', 'descuento', 'costo_no_cobrado', 'fondo_aplicado', 'resultado_neto', 'valor_ingreso', 'estimacion_venta', 'id_unidad_nueva', 'id_evento_origen', 'fondo_aplicado_previo', 'id_decision', 'id_operacion', 'secuencia'],
  Movimientos_Fondo: ['id_mov_fondo', 'fecha_hora', 'saldo_anterior', 'monto', 'saldo_posterior', 'motivo', 'id_credito', 'ref_tabla', 'ref_id', 'id_operacion', 'secuencia', 'responsable'],
  Saldo_Cliente: ['id_mov_saldo', 'id_cliente', 'id_credito', 'fecha_hora', 'tipo', 'monto', 'saldo_posterior', 'ref_tabla', 'ref_id', 'id_operacion', 'secuencia'],
  Devoluciones: ['id_devolucion', 'id_venta', 'id_equipo', 'id_credito', 'fecha_hora', 'tipo', 'causa', 'total_cobrado', 'monto_reembolsado', 'monto_retenido', 'motivo', 'id_decision', 'revertido_capital', 'revertido_entrega', 'revertido_interes', 'revertido_fondo', 'faltante_fondo', 'danos_retenidos', 'destino_saldo_favor', 'autorizado_por', 'id_operacion', 'secuencia'],
  Ordenes_Servicio: ['id_orden', 'id_cliente', 'equipo_descripcion', 'equipo_identificador', 'falla_reportada', 'estado', 'fecha_recepcion', 'fecha_cierre_trabajo', 'fecha_entrega', 'cobro_final', 'anticipos_recibidos', 'medio_cobro', 'id_orden_origen', 'garantia_hasta', 'id_decision', 'version'],
  Historial_Ordenes: ['id_historial_orden', 'id_orden', 'fecha_hora', 'estado_anterior', 'estado_nuevo', 'responsable', 'comentario', 'id_operacion', 'secuencia'],
  Tarifas_Trabajo: ['id_tarifa', 'id_trabajo', 'nombre_trabajo', 'monto', 'exige_detalle', 'exige_repuesto', 'activo', 'vigente_desde', 'motivo', 'responsable', 'id_operacion', 'version'],
  Costos_Tecnico: ['id_costo_tecnico', 'fecha_hora', 'tecnico', 'mes_costo', 'id_reparacion', 'id_equipo', 'id_orden', 'tipo', 'monto', 'motivo', 'id_liquidacion', 'mes_origen', 'ref_id', 'id_operacion', 'secuencia'],
  Liquidaciones_Tecnico: ['id_liquidacion', 'tecnico', 'mes_liquidado', 'fecha_creacion', 'total', 'estado', 'fecha_pago', 'id_mov_dinero', 'autorizado_por', 'version'],
  Movimientos_Dinero: ['id_mov_dinero', 'fecha_hora', 'tipo', 'concepto', 'monto', 'medio', 'ref_tabla', 'ref_id', 'comentario', 'id_operacion', 'secuencia', 'responsable'],
  Consultas_IMEI: ['id_consulta', 'id_equipo', 'fecha_hora', 'resultado', 'fuente', 'responsable', 'comentario', 'imei_consultado', 'id_operacion', 'secuencia'],
  Operaciones: ['id_operacion', 'endpoint', 'fecha_hora', 'fecha_inicio', 'responsable', 'resultado_resumen', 'estado', 'registro', 'motivo_resolucion', 'id_decision', 'payload', 'huella', 'plan'],
  Cierres_Mensuales: ['id_cierre', 'mes', 'fecha_hora', 'responsable', 'dinero_antes_ajuste', 'ajuste_caja', 'dinero_disponible', 'cuentas_por_cobrar', 'saldo_fondo', 'saldos_a_favor', 'tecnico_a_pagar', 'capital_libre', 'ganancia_equipos', 'ganancia_intereses', 'ganancia_servicio_tecnico', 'danos_retenidos', 'bajas_inventario', 'faltantes_fondo', 'recuperado_incobrables', 'dinero_contado', 'diferencias', 'revisado_por'],
  Cierres_Excepciones: ['id_cierre', 'tipo', 'ref_tabla', 'ref_id', 'importe', 'motivo', 'saldo_antes', 'saldo_despues'],
  Precios_Equipo: ['id_precio', 'id_equipo', 'fecha_hora', 'precio', 'responsable', 'motivo', 'id_operacion', 'secuencia'],
  Cambios_Equipo: ['id_cambio', 'id_equipo', 'campo', 'valor_anterior', 'valor_nuevo', 'motivo', 'responsable', 'fecha_hora', 'id_operacion', 'secuencia'],
  Reparacion_Trabajos: ['id_rt', 'id_reparacion', 'etapa', 'ronda', 'id_tarifa', 'id_trabajo', 'nombre_trabajo', 'monto', 'detalle', 'id_aprobacion', 'id_rt_origen', 'origen_linea', 'responsable', 'fecha_hora', 'id_operacion', 'secuencia'],
  Aprobaciones_Tarifa: ['id_aprobacion', 'id_reparacion', 'evento', 'ronda', 'total_elegido', 'total_aprobado', 'diferencia', 'motivo', 'repeticion', 'clasificacion_repeticion', 'id_costo_unidad', 'id_costo_tecnico', 'autoaprobada', 'responsable', 'fecha_hora', 'id_operacion', 'secuencia'],
  Registros_Bloqueados: ['registro', 'motivo', 'fecha_hora', 'activo']
};

var CONFIG_DEFAULTS = {
  margen_minimo: 20, tarifa_mano_obra: 0, dias_garantia_default: 10,
  peso_pantalla: 13, peso_bateria: 13, peso_carga: 13, peso_repuestos: 25, peso_demanda: 13, peso_antiguedad: 15, peso_rentabilidad: 8,
  saldo_inicial_caja: 0, pct_capital_bps: 8000, pct_fondo_bps: 1000, tope_fondo_bps: 1000,
  dias_incobrable: 180, max_cuotas: 60, dias_garantia_servicio: 10, dias_alerta_orden_sin_retirar: 30, dias_abandono_orden: 90,
  capital_minimo_alerta: 0,
  sla_detectado: 3, sla_negociacion: 5, sla_comprado: 3, sla_recibido: 1, sla_diagnostico: 1, sla_reparacion: 5, sla_esperando_repuestos: 7, sla_reparado: 1, sla_pruebas: 1,
  stock_minimo_repuestos: 2, dias_alerta_garantia: 7,
  medios_pago: 'Efectivo,Transferencia Itaú,Transferencia Ueno,Billetera electrónica',
  comision_transferencia_bps: 100, comision_extraccion_bps: 600,
  margen_sugerido_alto: 40, margen_sugerido_bajo: 30, trabajos_parciales_alerta: 3,
  tarifa_variacion_alerta_pct: 50, dias_alerta_tarifa_pendiente: 7,
  nombre_negocio: 'Sistema de Gestion de Celulares'
};

// Claves de Configuracion que solo el Administrador puede editar y que son numericas
var CONFIG_TEXTO = ['medios_pago', 'nombre_negocio'];

// Tarifa especial siempre presente (Seccion 3.28, regla 2)
var TRABAJO_OTRO = 'TRB-OTRO';


// ======== Util.gs ========
// GESTION_CELULARES - Util.gs
// Funciones auxiliares sin acceso a hojas. Zona horaria America/Asuncion
// (Diseno Tecnico, Seccion 5.9). Las fechas se guardan como texto
// AAAA-MM-DDTHH:mm:ss en hora de Asuncion, sin conversion implicita.

var ZONA = 'America/Asuncion';
var RELOJ_FIJO = null; // solo para pruebas: texto AAAA-MM-DDTHH:mm:ss

var Util = {
  ahora: function () {
    if (RELOJ_FIJO) return RELOJ_FIJO;
    return Utilities.formatDate(new Date(), ZONA, "yyyy-MM-dd'T'HH:mm:ss");
  },
  hoy: function () { return Util.ahora().substring(0, 10); },
  mes: function (fecha) { return String(fecha || Util.ahora()).substring(0, 7); },
  fechaDeDate: function (d) { return Utilities.formatDate(d, ZONA, "yyyy-MM-dd'T'HH:mm:ss"); },
  // Segundos desde una fecha de texto hasta ahora (ambas en hora de Asuncion)
  segundosEntre: function (desde, hasta) {
    var a = Util.aEpoch(desde), b = Util.aEpoch(hasta || Util.ahora());
    return Math.floor((b - a) / 1000);
  },
  aEpoch: function (f) {
    var s = String(f); var p = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2}))?/);
    if (!p) return NaN;
    return Date.UTC(+p[1], +p[2] - 1, +p[3], +(p[4] || 0), +(p[5] || 0), +(p[6] || 0));
  },
  diasEntre: function (desde, hasta) {
    return Math.floor((Util.aEpoch(String(hasta).substring(0, 10)) - Util.aEpoch(String(desde).substring(0, 10))) / 86400000);
  },
  sumarDias: function (fecha, n) {
    var t = Util.aEpoch(String(fecha).substring(0, 10)) + n * 86400000; return Util.isoFecha(new Date(t));
  },
  isoFecha: function (d) { return d.toISOString().substring(0, 10); },
  // Fecha de la cuota k (k desde 0) segun la frecuencia (Seccion 3.19)
  fechaCuota: function (primera, frecuencia, k) {
    if (frecuencia === 'Semanal') return Util.sumarDias(primera, 7 * k);
    if (frecuencia === 'Quincenal') return Util.sumarDias(primera, 15 * k);
    var p = String(primera).substring(0, 10).split('-'); var y = +p[0], m = +p[1] - 1 + k, dia = +p[2];
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    var ultimo = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return Util.isoFecha(new Date(Date.UTC(y, m, Math.min(dia, ultimo))));
  },
  esEntero: function (n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; },
  entero: function (v) { if (v === '' || v === null || v === undefined) return NaN; var n = Number(v); return (isFinite(n) && Math.floor(n) === n) ? n : NaN; },
  num: function (v) { var n = Number(v); return isFinite(n) ? n : 0; },
  texto: function (v) { return (v === null || v === undefined) ? '' : String(v).trim(); },
  uuid: function () { return Utilities.getUuid(); },
  // Hash del PIN: SHA-256 de email + ':' + pin, en hexadecimal (Seccion 3.13)
  hashPin: function (email, pin) {
    var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(email).toLowerCase() + ':' + pin, Utilities.Charset.UTF_8);
    return bytes.map(function (b) { var v = (b < 0 ? b + 256 : b).toString(16); return v.length === 1 ? '0' + v : v; }).join('');
  },
  normalizarDocumento: function (d) { return String(d || '').toUpperCase().replace(/[.\s\-]/g, ''); },
  normalizarTelefono: function (t) { return String(t || '').replace(/[^\d+]/g, ''); },
  normalizarNombre: function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, ''); },
  rellenar: function (n, ancho) { var s = String(n); while (s.length < ancho) s = '0' + s; return s; },
  pct: function (importe, bps) { return Math.floor((importe * bps) / 10000); },
  suma: function (arr, f) { var s = 0; for (var i = 0; i < arr.length; i++) s += f(arr[i]); return s; },
  copiar: function (o) { return JSON.parse(JSON.stringify(o)); },
  error: function (mensaje, extra) { var e = new Error(mensaje); if (extra) e.extra = extra; return e; }
};


// ======== Motor.gs ========
// GESTION_CELULARES - Motor.gs (Diseno Tecnico v4.2, Secciones 4.16 a 4.23)
// Unica copia del motor financiero: funciones puras sobre enteros en guaranies.
// No lee hojas. Portado del motor de referencia v6 (Anexo A), verificado por PruebasMotor.gs.
const BP = 10000;
const CFG = { capBps: 8000, fondoBps: 1000, topeFondoBps: 1000 };
const pct = (p, bps) => Math.floor((p * bps) / BP); // trunca (regla 11)

// ---- pagar(): reparto de un importe YA APLICADO a la deuda (A4 + remanente v3.0)
function pagar(p, pend, cfg = CFG) {
  let c = Math.min(pct(p, cfg.capBps), pend.capital);
  let f = Math.min(pct(p, cfg.fondoBps), pend.fondo);
  let i = Math.min(p - c - f, pend.interes);
  let exc = p - c - f - i;
  const mC = Math.min(exc, pend.capital - c); c += mC; exc -= mC;
  const mF = Math.min(exc, pend.fondo - f); f += mF; exc -= mF;
  const mI = Math.min(exc, pend.interes - i); i += mI; exc -= mI;
  return { c, f, i, sobrante: exc };
}

// ---- Credito
function abrirCredito({ precio, entrega, cuota, n, cfg = CFG }) {
  if (!(precio > 0) || !(entrega >= 0) || !(entrega < precio) || !(n >= 1) || !(cuota > 0)) throw new Error('carga invalida');
  const capitalFin = precio - entrega, deuda = cuota * n, interesBruto = deuda - capitalFin;
  if (interesBruto < 0) throw new Error('interes negativo: error de carga');
  const tope = pct(interesBruto, cfg.topeFondoBps);
  return {
    cfg, precio, entrega, cuota, n, capitalFin, deuda, interesBruto, tope,
    pend: { capital: capitalFin, fondo: tope, interes: interesBruto - tope },
    cuotas: Array.from({ length: n }, (_, k) => ({ nro: k + 1, monto: cuota, cubierto: 0 })),
    cobros: [], reversas: [], entregaRevertida: 0,
    estado: 'Abierto', saldoFavor: 0, descuento: 0,
    cobradoPrecio: entrega, interesCobrado: 0, fondoAportado: 0,
  };
}
const deudaPendiente = (cr) => cr.pend.capital + cr.pend.fondo + cr.pend.interes;

function cobrar(cr, id, monto, medio = 'Efectivo') {
  if (cr.cobros.some((x) => x.id === id)) throw new Error('cobro duplicado: ' + id);
  if (cr.estado !== 'Abierto') throw new Error('el credito no esta Abierto: ' + cr.estado);
  if (!(monto > 0)) throw new Error('monto invalido');
  const aplicado = Math.min(monto, deudaPendiente(cr));
  const sf = monto - aplicado;
  let resto = aplicado; const alloc = [];
  for (const q of cr.cuotas) { if (resto <= 0) break; const x = Math.min(resto, q.monto - q.cubierto); if (x > 0) { q.cubierto += x; resto -= x; alloc.push({ cuota: q.nro, monto: x }); } }
  const s = pagar(aplicado, cr.pend, cr.cfg);
  if (s.sobrante !== 0) throw new Error('sobrante inesperado ' + s.sobrante);
  cr.pend.capital -= s.c; cr.pend.fondo -= s.f; cr.pend.interes -= s.i;
  cr.cobradoPrecio += s.c; cr.interesCobrado += s.i; cr.fondoAportado += s.f; cr.saldoFavor += sf;
  const cobro = { id, monto, medio, aplicado, saldoFavor: sf, c: s.c, f: s.f, i: s.i, alloc, vigente: true };
  cr.cobros.push(cobro);
  if (deudaPendiente(cr) === 0) cr.estado = 'Pagado';
  return cobro;
}
// cancelacion anticipada: descuento <= interes pendiente (C-17)
function cancelarAnticipado(cr, id, descuento) {
  if (descuento > cr.pend.interes) throw new Error('descuento supera el interes pendiente');
  cr.pend.interes -= descuento; cr.descuento += descuento;
  const paga = deudaPendiente(cr);
  const cobro = cobrar(cr, id, paga);
  cr.estado = 'Cancelado anticipadamente';
  return { paga, cobro };
}

// ---- Fondo (saldo virtual unico)
class Fondo {
  constructor(saldo = 0) { this.saldo = saldo; this.mov = []; }
  mover(monto, motivo, ref) {
    if (this.saldo + monto < 0) throw new Error('FONDO NEGATIVO: ' + motivo);
    const ant = this.saldo; this.saldo += monto; this.mov.push({ ant, monto, post: this.saldo, motivo, ref });
  }
}
const exposicion = (C, P, V) => Math.max(0, C - P - V);

// ---- Unidad: costo unico y ganancia de equipos (C-28). El objetivo depende de
// la situacion (estado) y de F (fondo aplicado) y V (valor de ingreso) FIJADOS en el evento.
class Unidad {
  constructor(id, costoInicial = 0) {
    this.id = id; this.costos = []; this.C = 0; this.P = 0; this.G = 0; this.asientos = [];
    this.estado = 'inventario'; this.F = 0; this.V = 0; this.baja = null; this.eventos = new Set();
    if (costoInicial) this.costo('Compra', costoInicial, 'compra');
  }
  get vivo() { return this.estado === 'vivo'; }
  set vivo(v) { if (v) this.estado = 'vivo'; else if (this.estado === 'vivo') this.estado = 'cerrado'; }
  costo(tipo, monto, motivo) { const ant = this.C; this.C += monto; this.costos.push({ tipo, monto, ant, post: this.C, motivo }); return this.recalcular('costo ' + tipo); }
  cobradoPrecio(nuevoP, causa) { this.P = nuevoP; return this.recalcular(causa); }
  objetivo() {
    switch (this.estado) {
      case 'inventario': case 'anulada': return 0;
      case 'contado': case 'cerrado': return this.P - this.C;
      case 'vivo': return Math.max(0, this.P - this.C);
      case 'incobrable': return this.P + this.F - this.C;
      case 'recuperado': return this.P + this.V + this.F - this.C;
      default: throw new Error('estado de unidad desconocido ' + this.estado);
    }
  }
  recalcular(causa) { const d = this.objetivo() - this.G; if (d !== 0) { this.G += d; this.asientos.push({ causa, delta: d, saldo: this.G }); } return d; }
}

// ---- Cierres de credito sobre una unidad vendida
function cerrarSinRecuperar(u) { u.estado = 'cerrado'; return u.recalcular('cierre P-C'); }
function incobrable(u, fondo, ref) {
  if (u.eventos.has('INC:' + ref)) return { E: 0, F: u.F, delta: 0, neto: u.G, repetido: true };
  u.eventos.add('INC:' + ref);
  const E = exposicion(u.C, u.P, 0), F = Math.min(fondo.saldo, E);
  if (F > 0) fondo.mover(-F, 'incobrable', ref);
  u.F = F; u.V = 0; u.estado = 'incobrable';
  const d = u.recalcular('incobrable (neto)');
  return { E, F, delta: d, neto: u.G };
}
function recuperar(u, fondo, V, ref, previo = null) {
  if (V > u.C) throw new Error('valor de ingreso mayor al costo');
  if (u.eventos.has('REC:' + ref)) return { E: 0, F: u.F, delta: 0, total: u.G, repetido: true }; // el evento ya esta aplicado: no mueve el fondo ni la ganancia
  u.eventos.add('REC:' + ref);
  let F2, E;
  if (previo) {
    E = exposicion(u.C, u.P, V);
    F2 = Math.min(fondo.saldo + previo.F, E);
    const dif = previo.F - F2; if (dif !== 0) fondo.mover(dif, 'correccion por recuperacion', ref);
  } else {
    E = exposicion(u.C, u.P, V); F2 = Math.min(fondo.saldo, E);
    if (F2 > 0) fondo.mover(-F2, 'recuperacion', ref);
  }
  u.F = F2; u.V = V; u.estado = 'recuperado';
  const d = u.recalcular('recuperacion');
  return { E, F: F2, delta: d, total: u.G, unidadNuevaCosto: V };
}
// baja de unidad NO vendida: asiento informativo (renglon Baja de inventario), nunca suma a Equipos
function darDeBaja(u, { rescate = 0, reembolso = 0 } = {}) {
  if (u.estado !== 'inventario') throw new Error('solo una unidad sin vender se da de baja asi');
  u.baja = { perdida: Math.max(0, u.C - rescate - reembolso) };
  return u.baja.perdida;
}

// ---- Netos reconstruidos desde los libros (control 5.8, invariante 2)
function netos(cr) {
  const v = cr.cobros.filter((x) => x.vigente);
  const sum = (arr, k) => arr.reduce((s, x) => s + x[k], 0);
  return {
    cobradoPrecio: cr.entrega - cr.entregaRevertida + sum(v, 'c') - sum(cr.reversas, 'c'),
    interesCobrado: sum(v, 'i') - sum(cr.reversas, 'i'),
    fondoAportado: sum(v, 'f') - sum(cr.reversas, 'f'),
  };
}

// ---- Reversa de un cobro (solo el ultimo vigente) - Admin
function reversarCobro(cr, fondo, id, ref) {
  const vig = cr.cobros.filter((x) => x.vigente && !x.revertidoPorDevolucion);
  const x = vig[vig.length - 1];
  if (!x || x.id !== id) throw new Error('solo se puede reversar el ultimo cobro vigente');
  if (cr.reversas.some((r) => r.idCobro === id)) throw new Error('ya reversado');
  if (cr.saldoFavor < x.saldoFavor) throw new Error('el saldo a favor de este cobro ya se uso');
  x.vigente = false;
  cr.pend.capital += x.c; cr.pend.fondo += x.f; cr.pend.interes += x.i;
  cr.cobradoPrecio -= x.c; cr.interesCobrado -= x.i; cr.fondoAportado -= x.f; cr.saldoFavor -= x.saldoFavor;
  for (const a of x.alloc) cr.cuotas[a.cuota - 1].cubierto -= a.monto;
  const sale = Math.min(x.f, fondo.saldo), faltante = x.f - sale;
  if (sale > 0) fondo.mover(-sale, 'reversa de cobro', ref);
  if (cr.estado === 'Pagado') cr.estado = 'Abierto';
  return { faltanteFondo: faltante };
}

// ---- Devolucion: reembolso LIFO sobre cobros, reparto original (regla 12)
function devolver(cr, u, fondo, { reembolso, ref }) {
  const vig = cr.cobros.filter((x) => x.vigente);
  const total = cr.entrega - cr.entregaRevertida + vig.reduce((s, x) => s + x.aplicado - (cr.reversas.filter((r) => r.idCobro === x.id).reduce((a, r) => a + r.aplicado, 0)), 0);
  if (reembolso > total) throw new Error('reembolso mayor a lo cobrado');
  let resto = reembolso; const rev = { c: 0, f: 0, i: 0, entrega: 0 };
  for (const x of [...vig].reverse()) {
    if (resto <= 0) break;
    const yaRev = cr.reversas.filter((r) => r.idCobro === x.id).reduce((a, r) => a + r.aplicado, 0);
    const disp = x.aplicado - yaRev; if (disp <= 0) continue;
    const r = Math.min(resto, disp); resto -= r;
    const completo = r === x.aplicado;
    const crr = completo ? x.c : Math.floor((r * x.c) / x.aplicado);
    const fr = completo ? x.f : Math.floor((r * x.f) / x.aplicado);
    const ir = r - crr - fr;
    cr.reversas.push({ idCobro: x.id, idDevolucion: ref, aplicado: r, c: crr, f: fr, i: ir });
    rev.c += crr; rev.f += fr; rev.i += ir;
  }
  if (resto > 0) { rev.entrega = resto; cr.entregaRevertida += resto; }
  const fSale = Math.min(rev.f, fondo.saldo), faltanteFondo = rev.f - fSale;
  if (fSale > 0) fondo.mover(-fSale, 'devolucion ' + ref, ref);
  cr.interesCobrado -= rev.i; cr.fondoAportado -= rev.f; cr.cobradoPrecio -= rev.c + rev.entrega;
  u.P = u.P - rev.c - rev.entrega;
  const gAnt = u.G; u.estado = 'anulada'; u.recalcular('devolucion: revierte ganancia');
  cr.estado = 'Anulado';
  const retenido = total - reembolso;
  const danosRetenidos = retenido - cr.interesCobrado - cr.fondoAportado;
  return { rev, retenido, danosRetenidos, fSale, faltanteFondo, gananciaRevertida: gAnt, interesAunReconocido: cr.interesCobrado, fondoAunAportado: cr.fondoAportado };
}

// ---- Servicio a terceros y tecnico
function ordenServicio({ cobro, repuestos, tarifa }) { return { cobro, repuestos, tarifa, ganancia: cobro - repuestos - tarifa }; }
// v3.6: servicio tecnico con anticipos. cobro_final es el precio total (o lo retenido en una cancelacion); el anticipo recibido antes ya es dinero de la caja.
// El asiento de Servicio tecnico es el cobro_final completo; al entregar entra solo el saldo; si el anticipo supera el cobro_final, el exceso se devuelve.
function cobroOrden({ cobro_final, anticipos }) {
  const saldo = Math.max(0, cobro_final - anticipos), devolucion = Math.max(0, anticipos - cobro_final);
  return { asiento: cobro_final, saldo, devolucion, dineroDeLaOrden: anticipos + saldo - devolucion };
}
class CostosTecnico {
  constructor() { this.filas = []; }
  devengar(mes, monto, origen) { this.filas.push({ mes, monto, origen, estado: 'Pendiente', liq: null }); }
  liquidar(liq) { this.filas.filter((x) => x.estado === 'Pendiente').forEach((x) => { x.estado = 'Incluido'; x.liq = liq; }); }
  pagar(liq) { this.filas.filter((x) => x.liq === liq).forEach((x) => { x.estado = 'Pagado'; }); }
  saldoAPagar() { return this.filas.filter((x) => x.estado !== 'Pagado').reduce((s, x) => s + x.monto, 0); }
}
const capitalLibre = ({ dineroDisponible, saldosAFavor, tecnicoDevengadoImpago }) => dineroDisponible - saldosAFavor - tecnicoDevengadoImpago;

// Costo de una linea de repuesto: el total de la linea manda (no unitario x cantidad truncado)
function costoLinea(montoPagado, cantidad) { return { total: montoPagado, unitarioInformativo: Math.floor(montoPagado / cantidad) }; }

// Cierre mensual: primero el ajuste de caja, despues se guardan los saldos finales
function cerrarMes({ dineroLibro, dineroContado }) {
  const ajuste = dineroContado === undefined ? 0 : dineroContado - dineroLibro;
  return { dineroAntesAjuste: dineroLibro, ajusteCaja: ajuste, dineroFinal: dineroLibro + ajuste };
}


// ---- Operaciones: validar primero, Iniciada con payload + reserva de TODOS los registros que la operacion escribe, reanudar sin revalidar (v3.2/v3.4)
// v3.3: guardia de doble toque DENTRO de ejecutar (despues de la idempotencia), resolucion de operaciones interrumpidas
//       (reanudar / abandonar, solo Administrador) y ajuste correctivo que exige id_decision y verifica el invariante.
// v3.4: la reserva abarca una lista de registros (credito, unidad, cliente, orden, liquidacion); revisar() desmarca un registro que vuelve a verde;
//       INVARIANTES_POR_REGISTRO fija que invariantes corre el ajuste correctivo.
const INVARIANTES_POR_REGISTRO = { credito: [1, 2, 3, 6, 7], unidad: [5, 6, 7], cliente: [7, 8], liquidacion: [7, 9], orden: [7, 11] };
class Operaciones {
  constructor() { this.filas = new Map(); this.reservas = new Map(); this.bloqueados = new Set(); this.libro = []; this.recientes = []; }
  bloquearRegistro(reg) { this.bloqueados.add(reg); }
  revisar(reg, verificar) { const dif = verificar(); if (dif.length === 0) this.bloqueados.delete(reg); return { desbloqueado: dif.length === 0, diferencias: dif }; }
  listarPendientes() { return [...this.filas].filter(([, f]) => f.estado === 'Iniciada').map(([id, f]) => ({ id, registro: f.registro, registros: f.registros, payload: f.payload })); }
  ejecutar({ id, registro, payload, validar, escribir, correctivo = false, idDecision = null, verificar = null, guardia = null }) {
    const regs = [].concat(registro);
    const f = this.filas.get(id);
    if (f && f.estado === 'Completa') return f.resultado;               // reintento de algo ya terminado: la guardia NO interviene
    if (!f) {                                                           // operacion nueva
      for (const r of regs) { const dueño = this.reservas.get(r); if (dueño && dueño !== id) throw new Error('operacion pendiente sobre ' + r); }
      for (const r of regs) if (this.bloqueados.has(r) && !correctivo) throw new Error('registro bloqueado por diferencia: ' + r);
      if (correctivo && !idDecision) throw new Error('el ajuste correctivo exige una entrada en Decisiones (id_decision)');
      if (guardia) {                                                    // doble toque con OTRO id: solo se comprueba, se anota despues de validar
        const dup = this.recientes.some((r) => r.huella === guardia.huella && guardia.ahoraSeg - r.t <= (guardia.ventana || 120));
        if (dup && !guardia.confirmar) throw new Error('posible duplicado: confirmar para registrar');
      }
      validar(payload);                                                 // si rechaza, NO queda fila Iniciada ni huella anotada
      this.filas.set(id, { estado: 'Iniciada', payload: JSON.parse(JSON.stringify(payload)), registro: regs.join(','), registros: regs });
      for (const r of regs) this.reservas.set(r, id);
      if (guardia) this.recientes.push({ huella: guardia.huella, t: guardia.ahoraSeg });
    }
    const fila = this.filas.get(id);                                    // reanudacion: payload guardado, sin revalidar estado
    const escribirFila = (clave, dato) => { const k = id + '#' + clave; if (!this.libro.some((x) => x.k === k)) this.libro.push({ k, dato }); };
    let resultado = escribir(fila.payload, escribirFila);
    if (correctivo) {                                                   // el bloqueo se levanta solo si TODOS los invariantes del registro vuelven a verde
      const dif = verificar ? verificar() : ['sin verificacion'];
      const resuelta = dif.length === 0;
      if (resuelta) for (const r of regs) this.bloqueados.delete(r);
      resultado = { resultado, diferenciaResuelta: resuelta, diferencias: dif };
    }
    fila.estado = 'Completa'; fila.resultado = resultado; for (const r of fila.registros) if (this.reservas.get(r) === id) this.reservas.delete(r);
    return resultado;
  }
  // Solo Administrador. 'reanudar' completa lo que falta con el payload guardado; 'abandonar' libera las reservas sin deshacer filas
  // y corre el invariante: si queda una diferencia, los registros pasan a bloqueados por diferencia (solo opera el ajuste correctivo).
  resolverInterrumpida({ id, accion, motivo, idDecision, validar = () => {}, escribir, verificar = null }) {
    const f = this.filas.get(id);
    if (!f || f.estado !== 'Iniciada') throw new Error('no hay una operacion pendiente con ese id');
    if (accion === 'reanudar') return this.ejecutar({ id, registro: f.registros, payload: f.payload, validar, escribir });
    if (accion !== 'abandonar') throw new Error('accion invalida: reanudar o abandonar');
    if (!motivo || !idDecision) throw new Error('abandonar exige motivo y entrada en Decisiones (id_decision)');
    f.estado = 'Completa'; f.resultado = 'abandonada por el Administrador'; f.motivo = motivo; f.idDecision = idDecision;
    for (const r of f.registros) if (this.reservas.get(r) === id) this.reservas.delete(r);
    const dif = verificar ? verificar() : [];
    if (dif.length) for (const r of f.registros) this.bloquearRegistro(r);
    return { abandonada: true, filasEscritasQuedan: this.libro.filter((x) => x.k.startsWith(id + '#')).length, diferencias: dif };
  }
}
// ---- Simulacion con huella del estado utilizado; la operacion real la comprueba (v3.2)
// v3.3: para simularIncobrable y simularRecuperacion la huella incluye tambien costo, cobrado del precio, ganancia, estado y fondo aplicado de la unidad.
const huellaUnidad = (u) => [u.C, u.P, u.G, u.estado, u.F].join(',');
const huellaEstado = (cr, fondo, u = null) => [cr.cobros.length, cr.reversas.length, cr.estado, deudaPendiente(cr), fondo.saldo].concat(u ? [huellaUnidad(u)] : []).join('|');
function confirmarConHuella(huellaSimulada, cr, fondo, u = null) { if (huellaSimulada !== huellaEstado(cr, fondo, u)) throw new Error('el estado cambio desde la simulacion: simular de nuevo'); }
// ---- Huella de negocio para el doble toque: el ajuste correctivo se distingue del ordinario, pero tambien pasa por la guardia (v3.3)
const huellaNegocio = ({ operacion, registro, tipo = '', monto, correctivo = false }) => [operacion, registro, tipo, monto, correctivo ? 'C' : 'O'].join('|');
// ---- Guardia contra el doble toque con otro id_operacion (cobros y ajustes), version autonoma
function guardiaDuplicado(recientes, huella, ahoraSeg, { ventana = 120, confirmar = false } = {}) {
  const dup = recientes.some((r) => r.huella === huella && ahoraSeg - r.t <= ventana);
  if (dup && !confirmar) throw new Error('posible duplicado: confirmar para registrar');
  recientes.push({ huella, t: ahoraSeg }); return true;
}

// Objeto unico con el que PruebasMotor.gs y el resto del backend llaman al motor.
var M = { Operaciones, INVARIANTES_POR_REGISTRO, huellaEstado, huellaUnidad, huellaNegocio, confirmarConHuella, guardiaDuplicado, CFG, pct, pagar, abrirCredito, cobrar, cancelarAnticipado, deudaPendiente, Fondo, exposicion, Unidad, cerrarSinRecuperar, incobrable, recuperar, darDeBaja, netos, reversarCobro, devolver, ordenServicio, cobroOrden, CostosTecnico, capitalLibre, costoLinea, cerrarMes };


// ======== Datos.gs ========
// GESTION_CELULARES - Datos.gs
// Capa de acceso a hojas. Cada hoja se lee una sola vez por ejecucion y se
// mantiene en memoria; toda escritura va a la hoja y a la copia en memoria.
// Ninguna otra parte del backend toca SpreadsheetApp directamente.

var TEXTO_RE = /^(fecha|vigente_desde|verificada_en|imei|numero_|contacto|telefono|trabajo_telefono|referencia\d_telefono|mes|equipo_identificador|payload|plan)/;

var Datos = (function () {
  var memoria = {};
  var libro = null;

  function abrirLibro() {
    if (libro) return libro;
    libro = SpreadsheetApp.getActiveSpreadsheet();
    if (!libro) {
      var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
      if (id) libro = SpreadsheetApp.openById(id);
    }
    if (!libro) throw Util.error('El script no esta vinculado a una hoja de calculo. Ejecute prepararSistema desde la hoja.');
    return libro;
  }

  function celda(v) {
    if (v instanceof Date) return Util.fechaDeDate(v);
    return v;
  }

  function cargar(nombre) {
    if (memoria[nombre]) return memoria[nombre];
    var cols = HOJAS[nombre];
    if (!cols) throw Util.error('Hoja desconocida: ' + nombre);
    var sh = abrirLibro().getSheetByName(nombre);
    if (!sh) throw Util.error('Falta la hoja ' + nombre + '. Ejecute prepararSistema.');
    var valores = sh.getDataRange().getValues();
    var enc = valores[0] || [];
    var idx = {};
    for (var i = 0; i < enc.length; i++) idx[enc[i]] = i;
    var filas = [];
    for (var r = 1; r < valores.length; r++) {
      var o = { _fila: r + 1 };
      for (var c = 0; c < cols.length; c++) {
        var pos = idx[cols[c]];
        o[cols[c]] = pos === undefined ? '' : celda(valores[r][pos]);
      }
      filas.push(o);
    }
    memoria[nombre] = { sh: sh, cols: cols, idx: idx, filas: filas, siguiente: valores.length + 1 };
    return memoria[nombre];
  }

  function aArray(h, obj) {
    var fila = new Array(h.sh.getLastColumn() || h.cols.length);
    for (var i = 0; i < fila.length; i++) fila[i] = '';
    for (var c = 0; c < h.cols.length; c++) {
      var pos = h.idx[h.cols[c]];
      if (pos !== undefined) fila[pos] = (obj[h.cols[c]] === undefined || obj[h.cols[c]] === null) ? '' : obj[h.cols[c]];
    }
    return fila;
  }

  return {
    leer: function (nombre) { return cargar(nombre).filas; },
    filtrar: function (nombre, f) { return cargar(nombre).filas.filter(f); },
    buscar: function (nombre, col, valor) {
      var fs = cargar(nombre).filas;
      for (var i = 0; i < fs.length; i++) if (String(fs[i][col]) === String(valor)) return fs[i];
      return null;
    },
    agregar: function (nombre, obj) {
      var h = cargar(nombre);
      var fila = {};
      for (var c = 0; c < h.cols.length; c++) {
        var v = obj[h.cols[c]];
        fila[h.cols[c]] = (v === undefined || v === null) ? '' : v;
      }
      var n = h.sh.getLastRow() + 1;
      h.sh.getRange(n, 1, 1, h.sh.getLastColumn() || h.cols.length).setValues([aArray(h, fila)]);
      fila._fila = n;
      h.filas.push(fila);
      return fila;
    },
    actualizar: function (nombre, fila, cambios) {
      var h = cargar(nombre);
      for (var k in cambios) {
        if (!Object.prototype.hasOwnProperty.call(cambios, k)) continue;
        if (h.idx[k] === undefined) throw Util.error('Columna inexistente ' + nombre + '.' + k);
        fila[k] = cambios[k];
      }
      h.sh.getRange(fila._fila, 1, 1, h.sh.getLastColumn()).setValues([aArray(h, fila)]);
      return fila;
    },
    // Identificador secuencial PREFIJO-000001 mirando el maximo existente
    siguienteId: function (nombre, col, prefijo, ancho) {
      var fs = cargar(nombre).filas, max = 0, re = new RegExp('^' + prefijo + '-(\\d+)$');
      for (var i = 0; i < fs.length; i++) { var m = re.exec(String(fs[i][col])); if (m) max = Math.max(max, +m[1]); }
      var reservados = Datos._reserva[nombre + '.' + col] || 0;
      var n = Math.max(max, reservados) + 1;
      Datos._reserva[nombre + '.' + col] = n;
      return prefijo + '-' + Util.rellenar(n, ancho || 6);
    },
    siguienteNumero: function (nombre, col) {
      var fs = cargar(nombre).filas, max = 0;
      for (var i = 0; i < fs.length; i++) max = Math.max(max, Number(fs[i][col]) || 0);
      var r = Datos._reserva[nombre + '.' + col] || 0; var n = Math.max(max, r) + 1; Datos._reserva[nombre + '.' + col] = n; return n;
    },
    _reserva: {},
    reiniciar: function () { memoria = {}; Datos._reserva = {}; libro = null; },
    abrirLibro: abrirLibro,
    columnasTexto: function (cols) { return cols.map(function (c) { return TEXTO_RE.test(c); }); }
  };
})();


// ======== Config.gs ========
// GESTION_CELULARES - Config.gs (Seccion 3.11 y 4.14)
// Configuracion en formato clave-valor. Toda modificacion exige comentario y
// deja una fila en Decisiones (lo hace Operaciones de Administracion).

var Config = {
  todo: function () {
    var salida = {}, k;
    for (k in CONFIG_DEFAULTS) salida[k] = CONFIG_DEFAULTS[k];
    Datos.leer('Configuracion').forEach(function (f) {
      if (f.clave === '') return;
      salida[f.clave] = (CONFIG_TEXTO.indexOf(f.clave) >= 0) ? String(f.valor) : (f.valor === '' ? CONFIG_DEFAULTS[f.clave] : Number(f.valor));
    });
    return salida;
  },
  valor: function (clave) {
    var c = Config.todo();
    if (!(clave in c)) throw Util.error('Parametro de configuracion desconocido: ' + clave);
    return c[clave];
  },
  medios: function () {
    return String(Config.valor('medios_pago')).split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s !== ''; });
  },
  // Cambia un parametro (la fila de Decisiones la escribe quien llama)
  fijar: function (clave, valor) {
    var f = Datos.buscar('Configuracion', 'clave', clave);
    if (f) Datos.actualizar('Configuracion', f, { valor: valor });
    else Datos.agregar('Configuracion', { clave: clave, valor: valor });
  },
  validarCambios: function (cambios, actual) {
    var errores = [], k;
    var nuevo = {};
    for (k in actual) nuevo[k] = actual[k];
    for (k in cambios) {
      if (!(k in CONFIG_DEFAULTS)) { errores.push('Parametro desconocido: ' + k); continue; }
      if (CONFIG_TEXTO.indexOf(k) < 0) {
        var n = Util.entero(cambios[k]);
        if (isNaN(n) || n < 0) { errores.push(k + ' debe ser un numero entero mayor o igual a 0'); continue; }
        cambios[k] = n;
      }
      nuevo[k] = cambios[k];
    }
    var pesos = ['peso_pantalla', 'peso_bateria', 'peso_carga', 'peso_repuestos', 'peso_demanda', 'peso_antiguedad', 'peso_rentabilidad'];
    var s = 0; pesos.forEach(function (p) { s += Number(nuevo[p]); });
    if (s !== 100) errores.push('Los siete pesos deben sumar 100 (suman ' + s + ')');
    if (Number(nuevo.pct_capital_bps) + Number(nuevo.pct_fondo_bps) > 10000) errores.push('pct_capital_bps + pct_fondo_bps no puede superar 10000');
    if (Number(nuevo.max_cuotas) < 1) errores.push('max_cuotas debe ser al menos 1');
    if (cambios.medios_pago !== undefined) {
      var m = String(cambios.medios_pago).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      if (!m.length) errores.push('medios_pago no puede quedar vacio');
    }
    if (cambios.saldo_inicial_caja !== undefined && Datos.leer('Movimientos_Dinero').length > 0) errores.push('saldo_inicial_caja solo se puede editar mientras Movimientos_Dinero no tenga filas');
    return errores;
  }
};


// ======== Auth.gs ========
// GESTION_CELULARES - Auth.gs (Seccion 3.13 y 5.3)
// Login propio email + PIN. El token se valida en cada llamada contra
// Sesiones_Activas; el rol sale siempre de la hoja Usuarios, nunca del cliente.

var DURACION_SESION_HORAS = 12;
var MAX_INTENTOS = 5;

var Auth = {
  login: function (email, pin) {
    email = Util.texto(email).toLowerCase(); pin = Util.texto(pin);
    if (!email || !pin) throw Util.error('Ingrese email y PIN');
    var cache = CacheService.getScriptCache();
    var clave = 'intentos_' + email;
    var intentos = Number(cache.get(clave) || 0);
    if (intentos >= MAX_INTENTOS) throw Util.error('Demasiados intentos fallidos. Espere 10 minutos y vuelva a intentar.');
    var u = Datos.buscar('Usuarios', 'email', email);
    var ok = u && u.activo === 'Sí' && String(u.pin_hash) === Util.hashPin(email, pin);
    if (!ok) { cache.put(clave, String(intentos + 1), 600); throw Util.error('Email o PIN incorrecto'); }
    cache.remove(clave);
    var ahora = Util.ahora();
    Datos.filtrar('Sesiones_Activas', function (s) { return s.fecha_expiracion < ahora; }).forEach(function (s) {
      Datos.actualizar('Sesiones_Activas', s, { token: '', email: '', fecha_expiracion: '' });
    });
    var token = Util.uuid() + Util.uuid().replace(/-/g, '');
    var vence = Util.fechaDeDate(new Date(Date.now() + DURACION_SESION_HORAS * 3600 * 1000));
    Datos.agregar('Sesiones_Activas', { token: token, email: email, fecha_expiracion: vence });
    return { token: token, email: email, nombre: u.nombre, roles: Auth.listaRoles(u.roles) };
  },
  listaRoles: function (texto) {
    return String(texto || '').split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s !== ''; });
  },
  // Devuelve {email, nombre, roles} o lanza error si el token no vale
  sesion: function (token) {
    if (!token) throw Util.error('Sesion no valida. Vuelva a ingresar.');
    var s = Datos.buscar('Sesiones_Activas', 'token', token);
    if (!s || s.fecha_expiracion < Util.ahora()) throw Util.error('Sesion vencida. Vuelva a ingresar.');
    var u = Datos.buscar('Usuarios', 'email', s.email);
    if (!u || u.activo !== 'Sí') throw Util.error('Usuario inactivo');
    return { email: u.email, nombre: u.nombre, roles: Auth.listaRoles(u.roles) };
  },
  cerrarSesion: function (token) {
    var s = Datos.buscar('Sesiones_Activas', 'token', token);
    if (s) Datos.actualizar('Sesiones_Activas', s, { token: '', email: '', fecha_expiracion: '' });
  },
  tieneRol: function (usuario, roles) {
    for (var i = 0; i < roles.length; i++) if (usuario.roles.indexOf(roles[i]) >= 0) return true;
    return false;
  }
};


// ======== Operaciones.gs ========
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
    if (fila && fila.estado === 'Iniciada') return completarOperacion(fila, reubicarPlan(JSON.parse(fila.plan)));

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
    var plan = { ahora: pl.ahora, writes: pl.writes, caches: pl.caches, resultado: pl.resultado || {}, registros: pl.registros };
    var nueva = Datos.agregar('Operaciones', { id_operacion: idOp, endpoint: nombre, fecha_hora: '', fecha_inicio: pl.ahora, responsable: usuario.email, resultado_resumen: '', estado: 'Iniciada', registro: pl.registros.join(','), payload: JSON.stringify(params), huella: huella, plan: JSON.stringify(plan) });
    var res = completarOperacion(nueva, plan);
    if (correctivo) { var rojos = Invariantes.revisar(pl.registros); if (rojos.length) { res = JSON.parse(JSON.stringify(res || {})); res.diferencias = rojos.map(function (x) { return x.detalle; }); } }
    return res;
  } finally {
    lock.releaseLock();
  }
}

// Una operacion que se completa en otro mes que el de su inicio escribe en el mes de finalizacion (Seccion 5.7, N49)
function reubicarPlan(plan) {
  var ahora = Util.ahora();
  if (!plan.ahora || Util.mes(plan.ahora) === Util.mes(ahora)) return plan;
  var mesViejo = Util.mes(plan.ahora), mesNuevo = Util.mes(ahora);
  function fix(o) { for (var k in o) { if (o[k] === plan.ahora) o[k] = ahora; else if (k === 'mes_costo' && o[k] === mesViejo) o[k] = mesNuevo; } }
  plan.writes.forEach(function (w) { fix(w.t === 'add' ? w.fila : w.cambios); });
  plan.ahora = ahora;
  return plan;
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
    if (p.accion === 'reanudar') return completarOperacion(f, reubicarPlan(JSON.parse(f.plan)));
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


// ======== Contab.gs ========
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


// ======== Equipos.gs ========
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


// ======== Taller.gs ========
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
      if (tar.activo !== 'Sí') {
        // una version reemplazada por otra mas nueva sigue valiendo para quien la eligio antes del cambio (N59)
        var rep0 = pl.get('Reparaciones', idRep);
        var reemplazada = pl.filas('Tarifas_Trabajo').some(function (x) { return x.id_trabajo === tar.id_trabajo && x.id_tarifa !== tar.id_tarifa && x.activo === 'Sí' && String(x.vigente_desde) >= String(tar.vigente_desde); });
        if (!(reemplazada && rep0 && String(tar.vigente_desde) <= String(rep0.fecha_inicio))) throw Util.error('El trabajo "' + tar.nombre_trabajo + '" ya no está activo en el catálogo');
      }
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
      return { reparacion: r, equipo: e ? { id_equipo: e.id_equipo, marca: e.marca, modelo: e.modelo, estado: e.estado } : null, trabajos: elegidos, usos: Datos.filtrar('Repuestos_Usados', function (x) { return x.id_reparacion === r.id_reparacion; }), total_elegido: pendiente ? Taller.totalElegido(FuenteDatos, r.id_reparacion, r.ronda_tarifa) : null, dias_pendiente: pendiente && r.fecha_fin ? Util.diasEntre(r.fecha_fin, hoy) : 0, marcar_rojo: pendiente && r.fecha_fin && Util.diasEntre(r.fecha_fin, hoy) >= umbral, unidad_ya_vendida: !!venta, motivo_devolucion: r.estado_tarifa === 'Devuelta' ? String((Datos.filtrar('Aprobaciones_Tarifa', function (a) { return a.id_reparacion === r.id_reparacion && a.evento === 'Devuelta'; }).pop() || {}).motivo || '') : '', repeticiones: [] };
    });
  }
});


// ======== Ventas.gs ========
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


// ======== Creditos.gs ========
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


// ======== Ordenes.gs ========
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


// ======== Tecnico.gs ========
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


// ======== Caja.gs ========
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


// ======== Cierre.gs ========
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


// ======== Invariantes.gs ========
// GESTION_CELULARES - Invariantes.gs (Diseno Tecnico 4.31 / 5.8)
// Comprobaciones que recalculan desde los libros y comparan con las cachés.
// 1 credito: pendientes y cobrado == libros | 2 credito: cuotas cubiertas == aplicaciones
// 3 credito: cuota cubierta <= monto | 5 unidad: costo_total == libro de costos
// 6 unidad: ganancia asentada == objetivo | 7 saldos no negativos (fondo, cliente, medios, stock)
// 8 cliente: cadena de saldo_posterior | 9 liquidacion: total == costos incluidos
// 11 orden: anticipos == libro de dinero | 12 dinero: suma por medios == disponible | 13 repuestos: stock == libro

var Invariantes = {
  credito: function (src, id) {
    var d = [], cr = src.get('Creditos', id); if (!cr) return d;
    var a = Contab.agregadosCredito(src, id);
    ['pendiente_capital', 'pendiente_fondo', 'pendiente_interes', 'cobrado_precio', 'interes_cobrado', 'fondo_aportado', 'descuento_total'].forEach(function (k) {
      if (Util.num(cr[k]) !== a[k]) d.push({ registro: 'CRE:' + id, inv: 1, detalle: 'invariante 1: ' + k + ' de ' + id + ' es ' + cr[k] + ' y los libros dan ' + a[k] });
    });
    var apl = {}; src.filas('Aplicaciones_Cuota').forEach(function (x) { apl[x.id_cuota] = (apl[x.id_cuota] || 0) + Util.num(x.monto); });
    src.filas('Cuotas').filter(function (q) { return q.id_credito === id; }).forEach(function (q) {
      if (Util.num(q.cubierto) !== (apl[q.id_cuota] || 0)) d.push({ registro: 'CRE:' + id, inv: 2, detalle: 'invariante 2: la cuota ' + q.id_cuota + ' tiene cubierto ' + q.cubierto + ' y las aplicaciones suman ' + (apl[q.id_cuota] || 0) });
      if (Util.num(q.cubierto) > Util.num(q.monto)) d.push({ registro: 'CRE:' + id, inv: 3, detalle: 'invariante 3: la cuota ' + q.id_cuota + ' está cubierta por encima de su monto' });
    });
    return d;
  },
  unidad: function (src, id) {
    var d = [], e = src.get('Equipos', id); if (!e) return d;
    var costos = src.filas('Costos_Unidad').filter(function (c) { return c.id_equipo === id; });
    if (costos.length && Util.num(e.costo_total) !== Contab.costoTotal(src, id)) d.push({ registro: 'EQ:' + id, inv: 5, detalle: 'invariante 5: costo_total de ' + id + ' es ' + e.costo_total + ' y el libro da ' + Contab.costoTotal(src, id) });
    var s = Contab.situacion(src, id), obj = Contab.objetivo(s);
    if (s.G !== obj) d.push({ registro: 'EQ:' + id, inv: 6, detalle: 'invariante 6: ganancia asentada de ' + id + ' es ' + s.G + ' y el objetivo es ' + obj });
    return d;
  },
  cliente: function (src, id) {
    var d = [], saldo = 0;
    src.filas('Saldo_Cliente').filter(function (m) { return m.id_cliente === id; }).forEach(function (m) {
      saldo += Util.num(m.monto);
      if (Util.num(m.saldo_posterior) !== saldo) d.push({ registro: 'CLI:' + id, inv: 8, detalle: 'invariante 8: saldo_posterior de ' + m.id_mov_saldo + ' es ' + m.saldo_posterior + ' y la cadena da ' + saldo });
      if (saldo < 0) d.push({ registro: 'CLI:' + id, inv: 7, detalle: 'invariante 7: saldo a favor negativo de ' + id });
    });
    return d;
  },
  liquidacion: function (src, id) {
    var d = [], l = src.get('Liquidaciones_Tecnico', id); if (!l) return d;
    var s = Util.suma(src.filas('Costos_Tecnico').filter(function (c) { return c.id_liquidacion === id; }), function (c) { return Util.num(c.monto); });
    if (Math.max(0, s) !== Util.num(l.total)) d.push({ registro: 'LIQ:' + id, inv: 9, detalle: 'invariante 9: total de ' + id + ' es ' + l.total + ' y los costos incluidos dan ' + Math.max(0, s) });
    return d;
  },
  orden: function (src, id) {
    var d = [], o = src.get('Ordenes_Servicio', id); if (!o) return d;
    var a = Contab.anticiposOrden(src, id);
    if (Util.num(o.anticipos_recibidos) !== a) d.push({ registro: 'ORD:' + id, inv: 11, detalle: 'invariante 11: anticipos_recibidos de ' + id + ' es ' + o.anticipos_recibidos + ' y el libro da ' + a });
    return d;
  },
  repuesto: function (src, id) {
    var d = [], r = src.get('Repuestos', id); if (!r) return d;
    var s = Contab.stockRepuesto(src, id);
    if (Util.num(r.stock_actual) !== s) d.push({ registro: 'RP:' + id, inv: 13, detalle: 'invariante 13: stock_actual de ' + id + ' es ' + r.stock_actual + ' y el libro da ' + s });
    if (s < 0) d.push({ registro: 'RP:' + id, inv: 7, detalle: 'invariante 7: stock negativo de ' + id });
    return d;
  },
  global: function (src) {
    var d = [];
    if (Contab.saldoFondo(src) < 0) d.push({ registro: 'FONDO', inv: 7, detalle: 'invariante 7: el fondo está negativo' });
    var s = Contab.saldosPorMedio(src), tot = 0, k;
    for (k in s) { tot += s[k]; if (s[k] < 0) d.push({ registro: 'CAJA', inv: 7, detalle: 'invariante 7: el medio ' + k + ' está negativo (' + s[k] + ')' }); }
    if (tot !== Contab.dineroDisponible(src)) d.push({ registro: 'CAJA', inv: 12, detalle: 'invariante 12: la suma por medios no coincide con el disponible' });
    return d;
  },
  verificarRegistros: function (regs, src) {
    src = src || FuenteDatos; var d = [];
    regs.forEach(function (r) {
      var p = r.split(':'), t = p[0], id = p.slice(1).join(':');
      var f = { CRE: Invariantes.credito, EQ: Invariantes.unidad, CLI: Invariantes.cliente, LIQ: Invariantes.liquidacion, ORD: Invariantes.orden, RP: Invariantes.repuesto }[t];
      if (f) d = d.concat(f(src, id));
    });
    return d;
  },
  verificarTodo: function (src) {
    src = src || FuenteDatos; var d = Invariantes.global(src);
    src.filas('Creditos').forEach(function (c) { d = d.concat(Invariantes.credito(src, c.id_credito)); });
    src.filas('Equipos').forEach(function (e) { d = d.concat(Invariantes.unidad(src, e.id_equipo)); });
    src.filas('Clientes').forEach(function (c) { d = d.concat(Invariantes.cliente(src, c.id_cliente)); });
    src.filas('Liquidaciones_Tecnico').forEach(function (l) { d = d.concat(Invariantes.liquidacion(src, l.id_liquidacion)); });
    src.filas('Ordenes_Servicio').forEach(function (o) { d = d.concat(Invariantes.orden(src, o.id_orden)); });
    src.filas('Repuestos').forEach(function (r) { d = d.concat(Invariantes.repuesto(src, r.id_repuesto)); });
    return d;
  },
  bloquear: function (registro, motivo) {
    var b = Datos.buscar('Registros_Bloqueados', 'registro', registro);
    if (b) Datos.actualizar('Registros_Bloqueados', b, { motivo: motivo, fecha_hora: Util.ahora(), activo: 'Sí' });
    else Datos.agregar('Registros_Bloqueados', { registro: registro, motivo: motivo, fecha_hora: Util.ahora(), activo: 'Sí' });
  },
  // Tras un ajuste correctivo: si el registro vuelve a verde se desbloquea
  revisar: function (registros) {
    var res = [];
    registros.forEach(function (r) {
      var d = Invariantes.verificarRegistros([r]);
      var b = Datos.buscar('Registros_Bloqueados', 'registro', r);
      if (d.length === 0 && b && b.activo === 'Sí') Datos.actualizar('Registros_Bloqueados', b, { activo: 'No' });
      if (d.length) res.push(d[0]);
    });
    return res;
  }
};

definir('verificarInvariantes', {
  roles: [ROL_ADMIN], lectura: true,
  leer: function () { var d = Invariantes.verificarTodo(FuenteDatos); return { ok: d.length === 0, diferencias: d, bloqueados: Datos.leer('Registros_Bloqueados').filter(function (b) { return b.activo === 'Sí'; }) }; }
});


// ======== Maestros.gs ========
// GESTION_CELULARES - Maestros.gs (Diseno Tecnico 3.8, 3.13, 4.14, 4.15)
// Clientes, proveedores, usuarios, configuracion y alertas.

var CAMPOS_CLIENTE = ['nombre', 'contacto', 'notas', 'tipo_documento', 'numero_documento', 'foto_documento_frente', 'foto_documento_dorso', 'fecha_nacimiento', 'telefono_secundario', 'correo', 'domicilio_direccion', 'domicilio_barrio_ciudad', 'domicilio_referencias', 'domicilio_mapa', 'domicilio_foto_fachada', 'trabajo_lugar', 'trabajo_direccion', 'trabajo_sucursal', 'trabajo_telefono', 'trabajo_antiguedad', 'ingreso_comprobante', 'referencia1_nombre', 'referencia1_parentesco', 'referencia1_telefono', 'referencia2_nombre', 'referencia2_parentesco', 'referencia2_telefono'];
var REQUERIDOS_FICHA = ['tipo_documento', 'numero_documento', 'foto_documento_frente', 'foto_documento_dorso', 'fecha_nacimiento', 'domicilio_direccion', 'domicilio_barrio_ciudad', 'trabajo_lugar', 'ingreso_comprobante', 'referencia1_nombre', 'referencia1_parentesco', 'referencia1_telefono', 'referencia2_nombre', 'referencia2_parentesco', 'referencia2_telefono'];
var TIPOS_DOCUMENTO = ['Cédula de identidad', 'Pasaporte', 'Otro'];

var Maestros = {
  fichaCompleta: function (c) { return REQUERIDOS_FICHA.every(function (k) { return Util.texto(c[k]) !== ''; }) ? 'Sí' : 'No'; }
};

definir('guardarCliente', {
  roles: [ROL_ADMIN, ROL_SOPORTE],
  registros: function (p) { return p.id_cliente ? ['CLI:' + p.id_cliente] : []; },
  planificar: function (p, pl, u) {
    var datos = {}, existente = p.id_cliente ? pl.get('Clientes', p.id_cliente) : null;
    if (p.id_cliente && !existente) throw Util.error('No existe el cliente');
    var esAdmin = Auth.tieneRol(u, [ROL_ADMIN]);
    if (existente && !esAdmin) throw Util.error('Solo el Administrador edita un cliente existente');
    CAMPOS_CLIENTE.forEach(function (k) { datos[k] = p[k] !== undefined ? Util.texto(p[k]) : (existente ? existente[k] : ''); });
    if (!esAdmin) CAMPOS_CLIENTE.forEach(function (k) { if (k !== 'nombre' && k !== 'contacto' && k !== 'notas') datos[k] = ''; });
    if (datos.nombre.length < 3) throw Util.error('El nombre es obligatorio (mínimo 3 caracteres)');
    datos.contacto = Util.normalizarTelefono(datos.contacto); if (datos.contacto.length < 6) throw Util.error('Ingrese un teléfono de contacto válido');
    ['telefono_secundario', 'trabajo_telefono', 'referencia1_telefono', 'referencia2_telefono'].forEach(function (k) { datos[k] = Util.normalizarTelefono(datos[k]); });
    if (datos.tipo_documento && TIPOS_DOCUMENTO.indexOf(datos.tipo_documento) < 0) throw Util.error('Tipo de documento inválido');
    datos.numero_documento = Util.normalizarDocumento(datos.numero_documento);
    if (datos.numero_documento) {
      var dup = pl.filas('Clientes').filter(function (c) { return c.id_cliente !== (existente && existente.id_cliente) && Util.normalizarDocumento(c.numero_documento) === datos.numero_documento && c.tipo_documento === datos.tipo_documento; });
      if (dup.length) throw Util.error('Ya existe un cliente con ese documento: ' + dup[0].id_cliente + ' ' + dup[0].nombre);
    }
    if (datos.fecha_nacimiento) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha_nacimiento)) throw Util.error('La fecha de nacimiento debe ser AAAA-MM-DD');
      if (Ventas.edad(datos.fecha_nacimiento, Util.hoy()) < 0) throw Util.error('La fecha de nacimiento es futura');
    }
    if (datos.correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(datos.correo)) throw Util.error('Correo inválido');
    datos.ficha_credito_completa = Maestros.fichaCompleta(datos);
    if (datos.ficha_credito_completa === 'Sí') { datos.verificada_por = u.email; datos.verificada_en = pl.ahora; }
    if (existente) { pl.upd('Clientes', existente.id_cliente, datos, false); pl.resultado = { id_cliente: existente.id_cliente, ficha_credito_completa: datos.ficha_credito_completa }; }
    else { var c = pl.add('Clientes', datos); pl.resultado = { id_cliente: c.id_cliente, ficha_credito_completa: datos.ficha_credito_completa }; }
  }
});

// Subida de foto/documento a una carpeta privada de Drive. Devuelve la URL para guardarla en la ficha.
definir('subirArchivoCliente', {
  roles: [ROL_ADMIN, ROL_SOPORTE], lectura: true,
  leer: function (p) {
    var nombre = Util.texto(p.nombre).replace(/[^\w.\-]/g, '_'); if (!nombre || !p.base64) throw Util.error('Falta el archivo');
    if (String(p.base64).length > 4000000) throw Util.error('El archivo es demasiado grande (máx. 3 MB)');
    var props = PropertiesService.getScriptProperties(), idCarpeta = props.getProperty('CARPETA_CLIENTES'), carpeta;
    if (idCarpeta) carpeta = DriveApp.getFolderById(idCarpeta); else { carpeta = DriveApp.createFolder('Clientes (privado)'); props.setProperty('CARPETA_CLIENTES', carpeta.getId()); }
    var blob = Utilities.newBlob(Utilities.base64Decode(p.base64), p.mime || 'image/jpeg', Util.hoy() + '_' + (p.id_cliente || 'nuevo') + '_' + nombre);
    var f = carpeta.createFile(blob); f.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    return { url: f.getUrl(), id_archivo: f.getId() };
  }
});

definir('obtenerClientes', {
  roles: [ROL_ADMIN, ROL_SOPORTE], lectura: true,
  leer: function (p, u) {
    var admin = Auth.tieneRol(u, [ROL_ADMIN]), q = Util.normalizarNombre(p && p.buscar);
    return Datos.leer('Clientes').filter(function (c) { return !q || Util.normalizarNombre(c.nombre + c.numero_documento + c.contacto).indexOf(q) >= 0; }).map(function (c) {
      if (admin) return Util.copiar(c);
      return { id_cliente: c.id_cliente, nombre: c.nombre, contacto: c.contacto, ficha_credito_completa: c.ficha_credito_completa };
    });
  }
});

definir('obtenerCliente', {
  roles: [ROL_ADMIN, ROL_SOPORTE], lectura: true,
  leer: function (p, u) {
    var c = Datos.buscar('Clientes', 'id_cliente', p.id_cliente); if (!c) throw Util.error('No existe el cliente');
    var admin = Auth.tieneRol(u, [ROL_ADMIN]);
    var r = { cliente: admin ? Util.copiar(c) : { id_cliente: c.id_cliente, nombre: c.nombre, contacto: c.contacto, ficha_credito_completa: c.ficha_credito_completa } };
    r.ventas = Datos.filtrar('Ventas', function (v) { return v.cliente === c.id_cliente; });
    if (admin) { r.saldo_a_favor = Contab.saldoCliente(FuenteDatos, c.id_cliente); r.creditos = Datos.filtrar('Creditos', function (x) { return x.id_cliente === c.id_cliente; }); r.ordenes = Datos.filtrar('Ordenes_Servicio', function (o) { return o.id_cliente === c.id_cliente; }); }
    return r;
  }
});

definir('obtenerVentas', {
  roles: [ROL_ADMIN, ROL_SOPORTE], lectura: true,
  leer: function () { return Datos.leer('Ventas').slice(-300).reverse(); }
});

// ---------- Proveedores ----------
definir('guardarProveedor', {
  roles: [ROL_ADMIN, ROL_COMPRADOR],
  planificar: function (p, pl) {
    var nombre = Util.texto(p.nombre); if (nombre.length < 2) throw Util.error('El nombre es obligatorio');
    var d = { nombre: nombre, contacto: Util.normalizarTelefono(p.contacto) || Util.texto(p.contacto), canal_habitual: Util.texto(p.canal_habitual), notas: Util.texto(p.notas) };
    if (p.id_proveedor) { if (!pl.get('Proveedores', p.id_proveedor)) throw Util.error('No existe el proveedor'); pl.upd('Proveedores', p.id_proveedor, d, false); pl.resultado = { id_proveedor: p.id_proveedor }; }
    else {
      var norm = Util.normalizarNombre(nombre);
      if (pl.filas('Proveedores').some(function (x) { return Util.normalizarNombre(x.nombre) === norm; })) throw Util.error('Ya existe un proveedor con ese nombre');
      pl.resultado = { id_proveedor: pl.add('Proveedores', d).id_proveedor };
    }
  }
});
definir('obtenerProveedores', {
  roles: [ROL_ADMIN, ROL_COMPRADOR], lectura: true,
  leer: function () {
    return Datos.leer('Proveedores').map(function (v) {
      var eq = Datos.filtrar('Equipos', function (e) { return e.id_proveedor === v.id_proveedor; });
      var o = Util.copiar(v); o.equipos_comprados = eq.length; return o;
    });
  }
});

// ---------- Usuarios ----------
function validarPin(pin) { if (!/^\d{4,8}$/.test(String(pin))) throw Util.error('El PIN debe tener entre 4 y 8 dígitos'); }
function adminsActivos(pl, salvo) {
  return pl.filas('Usuarios').filter(function (x) { return x.activo === 'Sí' && Auth.listaRoles(x.roles).indexOf(ROL_ADMIN) >= 0 && x.email !== salvo; }).length;
}
definir('altaUsuario', {
  roles: [ROL_ADMIN],
  planificar: function (p, pl) {
    var email = Util.texto(p.email).toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw Util.error('Email inválido');
    if (pl.get('Usuarios', email)) throw Util.error('Ya existe ese usuario');
    var roles = (Array.isArray(p.roles) ? p.roles : String(p.roles || '').split(',')).map(function (r) { return r.trim(); }).filter(Boolean);
    if (!roles.length || roles.some(function (r) { return ROLES_VALIDOS.indexOf(r) < 0; })) throw Util.error('Roles inválidos');
    if (Util.texto(p.nombre).length < 2) throw Util.error('El nombre es obligatorio');
    validarPin(p.pin);
    pl.add('Usuarios', { email: email, nombre: Util.texto(p.nombre), roles: roles.join(','), activo: 'Sí', fecha_alta: Util.hoy(), pin_hash: Util.hashPin(email, String(p.pin)) });
    pl.resultado = { email: email };
  }
});
definir('editarUsuario', {
  roles: [ROL_ADMIN],
  planificar: function (p, pl, u) {
    var x = pl.get('Usuarios', Util.texto(p.email).toLowerCase()); if (!x) throw Util.error('No existe el usuario');
    var cambios = {};
    if (p.nombre !== undefined) { if (Util.texto(p.nombre).length < 2) throw Util.error('El nombre es obligatorio'); cambios.nombre = Util.texto(p.nombre); }
    if (p.roles !== undefined) {
      var roles = (Array.isArray(p.roles) ? p.roles : String(p.roles).split(',')).map(function (r) { return r.trim(); }).filter(Boolean);
      if (!roles.length || roles.some(function (r) { return ROLES_VALIDOS.indexOf(r) < 0; })) throw Util.error('Roles inválidos');
      if (roles.indexOf(ROL_ADMIN) < 0 && Auth.listaRoles(x.roles).indexOf(ROL_ADMIN) >= 0 && adminsActivos(pl, x.email) === 0) throw Util.error('Debe quedar al menos un Administrador activo');
      cambios.roles = roles.join(',');
    }
    if (p.activo !== undefined) {
      var act = (p.activo === true || p.activo === 'Sí') ? 'Sí' : 'No';
      if (act === 'No' && x.email === u.email) throw Util.error('No puede desactivarse a sí mismo');
      if (act === 'No' && Auth.listaRoles(x.roles).indexOf(ROL_ADMIN) >= 0 && adminsActivos(pl, x.email) === 0) throw Util.error('Debe quedar al menos un Administrador activo');
      cambios.activo = act;
    }
    if (p.pin !== undefined && p.pin !== '') { validarPin(p.pin); cambios.pin_hash = Util.hashPin(x.email, String(p.pin)); }
    pl.upd('Usuarios', x.email, cambios, false);
    pl.resultado = { email: x.email };
  }
});
definir('cambiarPin', {
  roles: ROLES_VALIDOS,
  planificar: function (p, pl, u) {
    var x = pl.get('Usuarios', u.email);
    if (x.pin_hash !== Util.hashPin(u.email, String(p.pin_actual))) throw Util.error('El PIN actual no es correcto');
    validarPin(p.pin_nuevo);
    pl.upd('Usuarios', u.email, { pin_hash: Util.hashPin(u.email, String(p.pin_nuevo)) }, false);
    pl.resultado = { ok: true };
  }
});
definir('obtenerUsuarios', {
  roles: [ROL_ADMIN], lectura: true,
  leer: function () { return Datos.leer('Usuarios').map(function (x) { return { email: x.email, nombre: x.nombre, roles: Auth.listaRoles(x.roles), activo: x.activo, fecha_alta: x.fecha_alta }; }); }
});

// ---------- Configuracion ----------
definir('obtenerConfiguracion', { roles: ROLES_VALIDOS, lectura: true, leer: function () { return Config.todo(); } });
definir('actualizarConfiguracion', {
  roles: [ROL_ADMIN],
  planificar: function (p, pl) {
    var com = Util.texto(p.comentario); if (com.length < 5) throw Util.error('El comentario es obligatorio');
    var cambios = Util.copiar(p.cambios || {}); if (!Object.keys(cambios).length) throw Util.error('No hay cambios');
    var errores = Config.validarCambios(cambios, Config.todo()); if (errores.length) throw Util.error(errores.join('. '));
    var antes = Config.todo(), partes = [];
    Object.keys(cambios).forEach(function (k) {
      if (String(antes[k]) === String(cambios[k])) return;
      partes.push(k + ': ' + antes[k] + ' → ' + cambios[k]);
      if (pl.get('Configuracion', k)) pl.upd('Configuracion', k, { valor: cambios[k] }, false); else pl.add('Configuracion', { clave: k, valor: cambios[k] });
    });
    if (!partes.length) throw Util.error('Los valores ya son los vigentes');
    pl.resultado = { id_decision: pl.decision('Configuración', 'Cambio de parámetros', partes.join('; '), com) };
  }
});

// ---------- Alertas ----------
definir('obtenerResumenAlertas', {
  roles: [ROL_ADMIN, ROL_TECNICO, ROL_COMPRADOR, ROL_SOPORTE], lectura: true,
  leer: function (p, u) {
    var hoy = Util.hoy(), cfg = Config.todo(), a = [], admin = Auth.tieneRol(u, [ROL_ADMIN]);
    function al(tipo, texto, n, ref) { if (n > 0) a.push({ tipo: tipo, texto: texto, cantidad: n, ref: ref || '' }); }
    var reps = Datos.leer('Reparaciones');
    var pend = reps.filter(function (r) { return r.estado_tarifa === 'Pendiente de aprobación'; });
    var dev = reps.filter(function (r) { return r.estado_tarifa === 'Devuelta' && (admin || r.tecnico_email === u.email); });
    if (admin) al('tarifas', 'Tarifas de técnico por aprobar', pend.length);
    // trabajos parciales seguidos en la misma unidad u orden (informativa)
    var seguidos = {}, aviso = 0;
    reps.filter(function (r) { return r.fecha_fin; }).forEach(function (r) {
      var k = r.id_equipo || r.id_orden;
      if (r.resultado === 'Reparado parcialmente') seguidos[k] = (seguidos[k] || 0) + 1; else seguidos[k] = 0;
      if (seguidos[k] >= cfg.trabajos_parciales_alerta) aviso++;
    });
    var unicos = {}; Object.keys(seguidos).forEach(function (k) { if (seguidos[k] >= cfg.trabajos_parciales_alerta) unicos[k] = true; });
    al('parciales', 'Unidades con trabajos parciales seguidos', Object.keys(unicos).length);
    al('tarifas_devueltas', 'Tarifas devueltas para corregir', dev.length);
    al('repuestos', 'Repuestos bajo el mínimo', Datos.leer('Repuestos').filter(function (r) { return r.activo !== 'No' && Util.num(r.stock_actual) <= cfg.stock_minimo_repuestos; }).length);
    if (admin) {
      al('operaciones', 'Operaciones interrumpidas', Datos.filtrar('Operaciones', function (o) { return o.estado === 'Iniciada'; }).length);
      al('bloqueados', 'Registros bloqueados por diferencia', Datos.filtrar('Registros_Bloqueados', function (b) { return b.activo === 'Sí'; }).length);
      var vencidos = 0; Datos.filtrar('Creditos', function (c) { return c.estado === 'Abierto'; }).forEach(function (c) { if (Contab.estadoDerivado(FuenteDatos, c.id_credito, hoy).estado === 'Vencido') vencidos++; });
      al('cartera', 'Créditos con cuotas vencidas', vencidos);
      al('ordenes', 'Órdenes listas sin retirar', Datos.leer('Ordenes_Servicio').filter(function (o) { return ESTADOS_CIERRE_ORDEN.indexOf(o.estado) >= 0 && o.fecha_cierre_trabajo && Util.diasEntre(o.fecha_cierre_trabajo, hoy) >= cfg.dias_alerta_orden_sin_retirar; }).length);
      var libre = Contab.capitalLibre(FuenteDatos); if (cfg.capital_minimo_alerta > 0 && libre < cfg.capital_minimo_alerta) a.push({ tipo: 'capital', texto: 'Capital libre bajo el mínimo', cantidad: 1, ref: String(libre) });
      var ult = Datos.leer('Cierres_Mensuales').map(function (c) { return c.mes; }).sort(), sig = ult.length ? mesSiguiente(ult[ult.length - 1]) : null;
      if (sig && sig < Util.mes(Util.ahora())) a.push({ tipo: 'cierre', texto: 'Falta cerrar el mes ' + sig, cantidad: 1, ref: sig });
    }
    return a;
  }
});


// ======== Main.gs ========
// GESTION_CELULARES - Main.gs : punto de entrada web (doPost / doGet)
// Cuerpo: {accion, token, operacion, params}. Respuesta: {ok:true, datos} o {ok:false, error, codigo}.

function salida(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

function doGet() { return salida({ ok: true, servicio: 'Sistema de Gestion de Celulares', hora: Util.ahora() }); }

function doPost(e) {
  try {
    var cuerpo = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    return salida({ ok: true, datos: despachar(cuerpo) });
  } catch (err) {
    return salida({ ok: false, error: String(err && err.message || err), codigo: (err && err.codigo) || 'error' });
  }
}

function despachar(c) {
  Datos.reiniciar();
  var accion = c.accion || 'operacion';
  if (accion === 'login') return Auth.login(c.email, c.pin);
  var u = Auth.sesion(c.token);
  if (accion === 'logout') { Auth.cerrarSesion(c.token); return { ok: true }; }
  if (accion === 'sesion') return u;
  var params = c.params || {};
  if (c.operacion === 'resolverOperacionInterrumpida') {
    if (!Auth.tieneRol(u, [ROL_ADMIN])) throw Util.error('Su rol no permite esta operacion');
    params.__usuario_email = u.email;
    return resolverOperacionInterrumpida(params, u);
  }
  if (c.operacion === 'ejecutarCasosAceptacion') {
    if (!Auth.tieneRol(u, [ROL_ADMIN])) throw Util.error('Su rol no permite esta operacion');
    return ejecutarCasosAceptacion();
  }
  return ejecutarOperacion(c.operacion, params, u);
}


// ======== Setup.gs ========
// GESTION_CELULARES - Setup.gs : preparacion inicial del Sheet (se ejecuta una vez desde el editor)

function prepararSistema() {
  var libro = Datos.abrirLibro(), creadas = [], nombres = Object.keys(HOJAS);
  nombres.forEach(function (n) {
    var cols = HOJAS[n], sh = libro.getSheetByName(n);
    if (!sh) { sh = libro.insertSheet(n); creadas.push(n); }
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
      sh.setFrozenRows(1);
      cols.forEach(function (c, i) { if (TEXTO_RE.test(c)) sh.getRange(2, i + 1, Math.max(sh.getMaxRows() - 1, 1), 1).setNumberFormat('@'); });
    }
  });
  var vacia = libro.getSheetByName('Hoja 1') || libro.getSheetByName('Sheet1');
  if (vacia && libro.getSheets().length > 1 && vacia.getLastRow() <= 1) libro.deleteSheet(vacia);
  Datos.reiniciar();
  var conf = Datos.leer('Configuracion').map(function (f) { return f.clave; });
  Object.keys(CONFIG_DEFAULTS).forEach(function (k) { if (conf.indexOf(k) < 0) Datos.agregar('Configuracion', { clave: k, valor: CONFIG_DEFAULTS[k] }); });
  if (!Datos.buscar('Tarifas_Trabajo', 'id_trabajo', TRABAJO_OTRO)) {
    Datos.agregar('Tarifas_Trabajo', { id_tarifa: 'TAR-000', id_trabajo: TRABAJO_OTRO, nombre_trabajo: 'Otro trabajo', monto: 0, exige_detalle: 'Sí', exige_repuesto: 'No', activo: 'Sí', vigente_desde: Util.hoy(), motivo: 'Tarifa especial del sistema', responsable: 'sistema', version: 1 });
  }
  return { hojas_creadas: creadas, total_hojas: nombres.length };
}

function crearPrimerAdministrador(email, nombre, pin) {
  Datos.reiniciar();
  email = String(email).toLowerCase().trim();
  if (Datos.leer('Usuarios').length) throw new Error('Ya existen usuarios. Use la pantalla de Usuarios.');
  if (!/^\d{4,8}$/.test(String(pin))) throw new Error('El PIN debe tener 4 a 8 digitos');
  Datos.agregar('Usuarios', { email: email, nombre: nombre, roles: ROL_ADMIN, activo: 'Sí', fecha_alta: Util.hoy(), pin_hash: Util.hashPin(email, String(pin)) });
  return 'Administrador creado: ' + email;
}

// Edite estos tres valores y ejecute esta funcion una sola vez
function crearAdministradorInicial() {
  return crearPrimerAdministrador('CORREO_AQUI@gmail.com', 'Pedro Martin Villalba', '0000');
}


// ======== PruebasMotor.gs ========
// GESTION_CELULARES - PruebasMotor.gs (Diseno Tecnico v4.2, Seccion 7.5 y Anexo A)
// Casos de aceptacion del motor financiero como pruebas automaticas.
// ejecutarCasosAceptacion() es de solo lectura: no toca ninguna hoja.
// Regla de entrega: ninguna entrega que toque Motor.gs se da por buena si verde != true.
function ejecutarCasosAceptacion() {
  const LOG = [];
  const consola = { log: function () { LOG.push(Array.prototype.slice.call(arguments).join(' ')); } };
  const IDS = ['1','2','3','4','5','6','6bis','7','8a','8b','9','10','11','12','13',
 'N1','N1b','N2','N3','N4','N5','N6','N7','N8','N9','N10','N11','N12',
 'N13','N14','N15','N16','N17','N18','N19','N20','N21','N22','N23','N24','N25','N26','N27','N28','N29','N30','N31','N32','N33','N34','N35','N36','N37'];
  let ok = 0, bad = 0; const cubiertos = new Set(); let actual = null;
  const caso = (id, f) => { if (!IDS.includes(id)) throw new Error('ID fuera de lista: ' + id); cubiertos.add(id); actual = id; f(); };
  const eq = (n, a, b) => { const A = JSON.stringify(a), B = JSON.stringify(b); if (A === B) { ok++; consola.log('OK  ', actual, n); } else { bad++; consola.log('FALLA', actual, n, '\n  obtenido', A, '\n  esperado', B); } };
  const thr = (n, f) => { try { f(); bad++; consola.log('FALLA', actual, n, '(no lanzo)'); } catch (e) { ok++; consola.log('OK  ', actual, n, '->', e.message); } };
  const nuevo = (precio, entrega, cuota, n) => M.abrirCredito({ precio, entrega, cuota, n });
  const vend = (id, C, P) => { const u = new M.Unidad(id, C); u.estado = 'vivo'; u.cobradoPrecio(P, 'cobros'); return u; };
  const mk = () => { const c = nuevo(100000, 20000, 30000, 3); M.cobrar(c, 'a', 30000); M.cobrar(c, 'b', 30000); return c; };
  let cr, u, f;

  caso('1', () => { cr = nuevo(100000, 0, 50000, 3); eq('inicial', [cr.interesBruto, cr.tope], [50000, 5000]);
    eq('tabla', [1, 2, 3].map((k) => { const c = M.cobrar(cr, 'c1-' + k, 50000); return [c.c, c.f, c.i]; }), [[40000, 5000, 5000], [40000, 0, 10000], [20000, 0, 30000]]);
    eq('cierra', [cr.estado, M.deudaPendiente(cr)], ['Pagado', 0]); });
  caso('2', () => { cr = nuevo(100000, 0, 35000, 3); eq('inicial', [cr.interesBruto, cr.tope], [5000, 500]);
    eq('tabla', [1, 2, 3].map((k) => { const c = M.cobrar(cr, 'c2-' + k, 35000); return [c.c, c.f, c.i]; }), [[30000, 500, 4500], [35000, 0, 0], [35000, 0, 0]]); });
  caso('3', () => { cr = nuevo(100000, 0, 50000, 3); const c = M.cobrar(cr, 'p', 10000); eq('parcial', [c.c, c.f, c.i], [8000, 1000, 1000]); });
  caso('4', () => {
    for (const [d, paga, intNeto] of [[0, 100000, 45000], [20000, 80000, 25000], [40000, 60000, 5000]]) {
      cr = nuevo(100000, 0, 50000, 3); M.cobrar(cr, 'a', 50000); const r = M.cancelarAnticipado(cr, 'b', d);
      eq('desc ' + d, [r.paga, cr.interesCobrado, cr.fondoAportado, cr.estado], [paga, intNeto, 5000, 'Cancelado anticipadamente']); }
    cr = nuevo(100000, 0, 50000, 3); M.cobrar(cr, 'a', 50000); thr('descuento > interes pendiente', () => M.cancelarAnticipado(cr, 'b', 40001));
    cr = nuevo(100000, 0, 50000, 3); M.cobrar(cr, 'a', 50000); const r = M.cancelarAnticipado(cr, 'b', 20000); eq('reparto', [r.cobro.c, r.cobro.f, r.cobro.i], [60000, 0, 20000]); });
  caso('5', () => { cr = nuevo(100000, 0, 50000, 3); M.cobrar(cr, 'a', 50000); M.cobrar(cr, 'b', 50000);
    eq('acumulado', [cr.cobradoPrecio, cr.fondoAportado, cr.interesCobrado, cr.pend.capital], [80000, 5000, 15000, 20000]);
    thr('cobro duplicado', () => M.cobrar(cr, 'a', 1));
    cr = nuevo(100000, 0, 50000, 3); const cx = M.cobrar(cr, 'x', 200000); eq('pago de mas', [cx.aplicado, cx.saldoFavor, cr.saldoFavor, cr.estado], [150000, 50000, 50000, 'Pagado']); });
  caso('6', () => { u = vend('u6', 90000, 80000); f = new M.Fondo(5000); const r = M.incobrable(u, f, 'cr6');
    eq('incobrable', [r.E, r.F, r.delta, u.G, f.saldo], [10000, 5000, -5000, -5000, 0]); });
  caso('6bis', () => { u = vend('u6b', 70000, 130000); f = new M.Fondo(5000); const r = M.incobrable(u, f, 'x'); eq('cobro>costo', [r.E, r.F, u.G, f.saldo], [0, 0, 60000, 5000]); });
  caso('7', () => { u = new M.Unidad('u7', 100000); u.estado = 'vivo'; u.cobradoPrecio(40000, 'p'); eq('vive', u.G, 0); u.cobradoPrecio(80000, 'fin'); eq('vive 80k', u.G, 0);
    const d = M.cerrarSinRecuperar(u); eq('cierre', [u.G, d], [-20000, -20000]); });
  caso('8a', () => { u = vend('u8', 90000, 80000); eq('sano', M.recuperar(u, new M.Fondo(0), 90000, 'x').total, 80000); });
  caso('8b', () => { u = vend('u8b', 90000, 80000); eq('roto', M.recuperar(u, new M.Fondo(0), 30000, 'x').total, 20000);
    thr('valor de ingreso > costo', () => { const q = vend('q', 90000, 80000); M.recuperar(q, new M.Fondo(0), 90001, 'x'); }); });
  caso('9', () => { u = new M.Unidad('u9', 70000); u.estado = 'vivo'; const as = [50000, 90000, 130000].map((p) => u.cobradoPrecio(p, 'cobro')); eq('deltas', [as, u.G], [[0, 20000, 40000], 60000]);
    M.cerrarSinRecuperar(u); eq('sin duplicar', u.G, 60000); });
  caso('10', () => { u = vend('u10', 90000, 80000); const d = u.costo('Repuesto garantia', 25000, 'g'); eq('dia gasto', [d, u.G, u.C], [0, 0, 115000]);
    M.incobrable(u, new M.Fondo(0), 'x'); eq('incobrable', u.G, -35000); });
  caso('11', () => { u = vend('u11', 90000, 120000); eq('previo', u.G, 30000); const d = u.costo('Gasto', 40000, 'g'); eq('gasto', [d, u.G], [-30000, 0]);
    M.cerrarSinRecuperar(u); eq('cierre', u.G, -10000); });
  caso('12', () => { u = vend('u12', 90000, 120000); u.costo('Gasto', 40000, 'g'); const d = u.costo('Devolucion repuesto', -25000, 'dev'); eq('dev repuesto', [d, u.C, u.G], [15000, 105000, 15000]); });
  caso('13', () => { u = vend('u13', 90000, 80000); u.costo('Repuesto', 25000, 'p'); eq('antes', [u.C, u.G], [115000, 0]); eq('recuperar', M.recuperar(u, new M.Fondo(0), 90000, 'x').total, 55000); });

  caso('N1', () => { u = vend('n1', 90000, 80000); f = new M.Fondo(5000); const i = M.incobrable(u, f, 'cr'); eq('incobrable', [i.F, u.G, f.saldo], [5000, -5000, 0]);
    const rr = M.recuperar(u, f, 60000, 'cr', { F: 5000 }); eq('recuperado', [rr.E, rr.F, u.G, f.saldo], [0, 0, 50000, 5000]); eq('P+V-C+F', u.G, 80000 + 60000 - 90000); });
  caso('N1b', () => { u = vend('n1b', 90000, 40000); f = new M.Fondo(8000); const j = M.incobrable(u, f, 'cr'); eq('incobrable', [j.E, j.F, u.G, f.saldo], [50000, 8000, -42000, 0]);
    const k = M.recuperar(u, f, 30000, 'cr', { F: 8000 }); eq('recuperado', [k.E, k.F, u.G, f.saldo], [20000, 8000, -12000, 0]); eq('P+V-C+F', u.G, 40000 + 30000 - 90000 + 8000); });
  // Devolucion total (N2): valores ABSOLUTOS fijados a mano, no autorreferentes
  caso('N2', () => { cr = mk(); eq('inicial', [cr.capitalFin, cr.interesBruto, cr.tope], [80000, 10000, 1000]);
    f = new M.Fondo(cr.fondoAportado); u = vend('n2', 50000, cr.cobradoPrecio); eq('ganancia antes', u.G, 20000);
    const d = M.devolver(cr, u, f, { reembolso: 80000, ref: 'dev1' });
    eq('revierte', [d.rev.c + d.rev.entrega, d.rev.f, d.rev.i], [70000, 1000, 9000]);
    eq('retenido y daños', [d.retenido, d.danosRetenidos, u.G, cr.estado, f.saldo], [0, 0, 0, 'Anulado', 0]);
    eq('caches netos', [cr.interesCobrado, cr.fondoAportado, cr.cobradoPrecio], [0, 0, 0]);
    eq('netos desde libros = caches', M.netos(cr), { cobradoPrecio: cr.cobradoPrecio, interesCobrado: cr.interesCobrado, fondoAportado: cr.fondoAportado }); });
  caso('N3', () => { cr = mk(); f = new M.Fondo(cr.fondoAportado); u = vend('n3', 50000, cr.cobradoPrecio);
    const d = M.devolver(cr, u, f, { reembolso: 50000, ref: 'dev3' });
    eq('revierte', [d.rev.c, d.rev.f, d.rev.i, d.rev.entrega], [42000, 666, 7334, 0]);
    eq('retenido', d.retenido, 30000); eq('daños', d.danosRetenidos, 28000);
    eq('caja = fondo+interes+danos', d.danosRetenidos + cr.interesCobrado + cr.fondoAportado, d.retenido);
    eq('netos = caches', M.netos(cr), { cobradoPrecio: cr.cobradoPrecio, interesCobrado: cr.interesCobrado, fondoAportado: cr.fondoAportado }); });
  caso('N4', () => { cr = nuevo(100000, 20000, 30000, 3); ['a', 'b', 'c'].forEach((k) => M.cobrar(cr, k, 30000));
    eq('pagado', [cr.estado, cr.cobradoPrecio, cr.interesCobrado, cr.fondoAportado], ['Pagado', 100000, 9000, 1000]);
    f = new M.Fondo(1000); u = vend('n4', 60000, cr.cobradoPrecio); eq('ganancia antes', u.G, 40000);
    const d = M.devolver(cr, u, f, { reembolso: 110000, ref: 'dev12' });
    eq('devolucion', [d.rev.c + d.rev.entrega, d.rev.f, d.rev.i, d.danosRetenidos, u.G, f.saldo, cr.estado, cr.interesCobrado], [100000, 1000, 9000, 0, 0, 0, 'Anulado', 0]); });
  // N5: faltante de fondo NO va a Equipos
  caso('N5', () => { cr = mk(); f = new M.Fondo(0); u = vend('n5', 50000, cr.cobradoPrecio);
    const d = M.devolver(cr, u, f, { reembolso: 80000, ref: 'd5' });
    eq('fondo no negativo; faltante informativo; Equipos 0', [f.saldo, d.fSale, d.faltanteFondo, u.G], [0, 0, 1000, 0]); });
  caso('N6', () => { cr = nuevo(100000, 0, 50000, 3); M.cobrar(cr, 'a', 50000); u = vend('n6', 70000, cr.cobradoPrecio); f = new M.Fondo(cr.fondoAportado);
    cr.estado = 'Condonado'; M.cerrarSinRecuperar(u); eq('condonado', u.G, -30000);
    M.devolver(cr, u, f, { reembolso: 50000, ref: 'd6' }); eq('anulado', [u.G, cr.estado, f.saldo, cr.interesCobrado], [0, 'Anulado', 0, 0]); });
  caso('N7', () => { u = new M.Unidad('n7', 60000); eq('costo sobre unidad sin vender', [u.costo('Repuesto', 5000, 'r'), u.C, u.G], [0, 65000, 0]); });
  caso('N8', () => { const os = M.ordenServicio({ cobro: 0, repuestos: 15000, tarifa: 30000 }); eq('cancelada con tarifa', os.ganancia, -45000);
    const o2 = M.ordenServicio({ cobro: 0, repuestos: 15000, tarifa: 0 }); eq('cancelada tarifa parcial 0', o2.ganancia, -15000); });
  caso('N9', () => { eq('entregada', M.ordenServicio({ cobro: 120000, repuestos: 30000, tarifa: 40000 }).ganancia, 50000); });
  caso('N10', () => { const ct = new M.CostosTecnico(); ct.devengar('2026-10', 40000, 'o1'); ct.devengar('2026-10', 30000, 'o2');
    eq('devengado', ct.saldoAPagar(), 70000); ct.liquidar('L1'); eq('incluido', ct.saldoAPagar(), 70000); ct.pagar('L1'); eq('pagado', ct.saldoAPagar(), 0);
    eq('capital libre', M.capitalLibre({ dineroDisponible: 1000000, saldosAFavor: 50000, tecnicoDevengadoImpago: 70000 }), 880000); });
  caso('N11', () => { const p1 = M.pagar(1, { capital: 1e6, fondo: 5000, interes: 45000 }), p2 = M.pagar(49999, { capital: 1e6, fondo: 5000 - p1.f, interes: 45000 }), p3 = M.pagar(50000, { capital: 1e6, fondo: 5000, interes: 45000 });
    eq('truncado', [p1.f + p2.f, p3.f], [4999, 5000]); });
  caso('N12', () => { eq('remanente fondo', M.pagar(90, { capital: 0, fondo: 30, interes: 60 }), { c: 0, f: 30, i: 60, sobrante: 0 });
    // barrido exhaustivo de pendientes chicos (uno, dos o tres componentes) y todos los pagos hasta la deuda
    let malos = 0, total = 0;
    for (let c = 0; c <= 12; c++) for (let f = 0; f <= 6; f++) for (let i = 0; i <= 12; i++) { const deuda = c + f + i; for (let p = 1; p <= deuda; p++) { total++; const r = M.pagar(p, { capital: c, fondo: f, interes: i });
      if (r.c < 0 || r.f < 0 || r.i < 0 || r.c > c || r.f > f || r.i > i || r.c + r.f + r.i + r.sobrante !== p || r.sobrante !== 0) malos++; } }
    eq('barrido pagar() (' + total + ' combinaciones)', malos, 0); });
  // ---- Casos agregados en v3.1
  caso('N13', () => { u = vend('n13', 90000, 80000); f = new M.Fondo(5000); M.incobrable(u, f, 'cr'); eq('antes', u.G, -5000);
    const d = u.costo('Ajuste', 1, 'x'); eq('un costo posterior conserva el fondo', [d, u.G], [-1, -5001]); });
  caso('N14', () => { u = vend('n14', 90000, 80000); f = new M.Fondo(5000); M.incobrable(u, f, 'cr'); M.recuperar(u, f, 60000, 'cr', { F: 5000 }); eq('antes', u.G, 50000);
    eq('costo posterior a recuperado', [u.costo('Ajuste', 1000, 'x'), u.G], [-1000, 49000]); });
  caso('N15', () => { u = new M.Unidad('n15', 100000); eq('perdida de baja con rescate', M.darDeBaja(u, { rescate: 30000 }), 70000); eq('Equipos no se toca', u.G, 0);
    thr('no se da de baja una unidad vendida', () => { const v = vend('v', 100000, 50000); M.darDeBaja(v); }); });
  caso('N16', () => { cr = nuevo(100000, 0, 50000, 3); M.cobrar(cr, 'a', 50000); M.cobrar(cr, 'b', 50000); f = new M.Fondo(cr.fondoAportado);
    thr('solo el ultimo cobro', () => M.reversarCobro(cr, f, 'a', 'rev'));
    const r = M.reversarCobro(cr, f, 'b', 'rev'); eq('revierte', [cr.pend.capital, cr.pend.fondo, cr.pend.interes, cr.estado, r.faltanteFondo], [60000, 0, 40000, 'Abierto', 0]);
    eq('netos = caches', M.netos(cr), { cobradoPrecio: cr.cobradoPrecio, interesCobrado: cr.interesCobrado, fondoAportado: cr.fondoAportado }); });
  caso('N17', () => { cr = nuevo(100000, 0, 50000, 3); M.cobrar(cr, 'x', 200000); f = new M.Fondo(cr.fondoAportado);
    eq('saldo a favor', cr.saldoFavor, 50000); const sf = cr.saldoFavor; M.reversarCobro(cr, f, 'x', 'rev'); eq('reversa baja el saldo a favor', [cr.saldoFavor, sf - cr.saldoFavor], [0, 50000]); });
  caso('N18', () => { cr = mk(); f = new M.Fondo(cr.fondoAportado); u = vend('n18', 50000, cr.cobradoPrecio); M.devolver(cr, u, f, { reembolso: 80000, ref: 'd' });
    thr('cobro en credito Anulado', () => M.cobrar(cr, 'z', 30000));
    const c2 = nuevo(100000, 0, 50000, 3); c2.estado = 'Incobrable'; thr('cobro en credito Incobrable', () => M.cobrar(c2, 'z', 1)); });
  caso('N19', () => { eq('ajuste de caja primero', M.cerrarMes({ dineroLibro: 1000000, dineroContado: 990000 }), { dineroAntesAjuste: 1000000, ajusteCaja: -10000, dineroFinal: 990000 });
    eq('sin conteo', M.cerrarMes({ dineroLibro: 1000000 }), { dineroAntesAjuste: 1000000, ajusteCaja: 0, dineroFinal: 1000000 }); });
  caso('N20', () => { const l = M.costoLinea(100000, 3); eq('total manda', [l.total, l.unitarioInformativo, l.unitarioInformativo * 3], [100000, 33333, 99999]); });
  // N21: recuperacion reintentada con el PAYLOAD ORIGINAL (mismo evento, mismo F1): el fondo no se repone dos veces
  caso('N21', () => { u = vend('n21', 90000, 80000); f = new M.Fondo(5000); M.incobrable(u, f, 'cr'); eq('tras incobrable', [f.saldo, u.G], [0, -5000]);
    M.recuperar(u, f, 60000, 'rec1', { F: 5000 }); eq('primera ejecucion', [f.saldo, u.F, u.G], [5000, 0, 50000]);
    const r2 = M.recuperar(u, f, 60000, 'rec1', { F: 5000 }); /* identico payload: reintento real */
    eq('reintento identico no mueve fondo ni ganancia', [f.saldo, u.G, r2.delta, r2.repetido], [5000, 50000, 0, true]);
    const r3 = M.incobrable(vend('n21b', 90000, 80000), new M.Fondo(5000), 'x'); eq('incobrable tambien es idempotente', r3.F, 5000);
    const uu = vend('n21c', 90000, 80000), ff = new M.Fondo(5000); M.incobrable(uu, ff, 'y'); const rep = M.incobrable(uu, ff, 'y'); eq('incobrable repetido', [ff.saldo, uu.G, rep.repetido], [0, -5000, true]); });
  // N22: ejecutar devolucion y luego conciliar: ganancia, fondo, netos coherentes con libro
  caso('N22', () => { cr = mk(); f = new M.Fondo(cr.fondoAportado); u = vend('n22', 50000, cr.cobradoPrecio);
    M.devolver(cr, u, f, { reembolso: 50000, ref: 'd' }); const n = M.netos(cr);
    eq('invariante 2 (netos = caches)', n, { cobradoPrecio: cr.cobradoPrecio, interesCobrado: cr.interesCobrado, fondoAportado: cr.fondoAportado });
    eq('fondo = aportado neto - usado', f.saldo, cr.fondoAportado - 0); });

  const OP = () => new M.Operaciones();
  caso('N23', () => { const o = OP(); cr = nuevo(100000, 0, 50000, 3); cr.estado = 'Anulado';
    thr('validacion rechaza', () => o.ejecutar({ id: 'a', registro: 'CRE1', payload: { monto: 50000 }, validar: () => M.cobrar(cr, 'zz', 1), escribir: () => 'x' }));
    eq('no queda fila Iniciada ni reserva', [o.filas.size, o.reservas.size], [0, 0]);
    cr.estado = 'Abierto';
    eq('el reintento con el mismo id se valida como operacion nueva y entra', o.ejecutar({ id: 'a', registro: 'CRE1', payload: { monto: 50000 }, validar: () => {}, escribir: (p, w) => { w(1, p.monto); return 'ok'; } }), 'ok'); });
  caso('N24', () => { const o = OP(); let corte = true; const run = (payload) => o.ejecutar({ id: 'b', registro: 'CRE2', payload, validar: () => {}, escribir: (p, w) => { w(1, 'cobro ' + p.monto); if (corte) throw new Error('corte'); w(2, 'cuota'); w(3, 'fondo'); return 'ok'; } });
    thr('primera ejecucion se corta', () => run({ monto: 50000 }));
    eq('queda Iniciada con 1 fila y el registro reservado', [o.filas.get('b').estado, o.libro.length, o.reservas.get('CRE2')], ['Iniciada', 1, 'b']);
    corte = false; const r = run({ monto: 99999 }); /* el cliente reintenta con un payload cualquiera: manda el guardado */
    eq('reanuda con el payload guardado, sin duplicar', [r, o.libro.length, o.libro[0].dato, o.filas.get('b').estado, o.reservas.size], ['ok', 3, 'cobro 50000', 'Completa', 0]);
    eq('tercer intento devuelve el resultado guardado', run({ monto: 1 }), 'ok'); });
  caso('N25', () => { const o = OP(); let corte = true;
    thr('corte', () => o.ejecutar({ id: 'c', registro: 'CRE3', payload: {}, validar: () => {}, escribir: (p, w) => { w(1, 'x'); throw new Error('corte'); } }));
    thr('otra operacion sobre el mismo registro mientras hay una pendiente', () => o.ejecutar({ id: 'd', registro: 'CRE3', payload: {}, validar: () => {}, escribir: () => 'y' }));
    eq('otro registro no se afecta', o.ejecutar({ id: 'e', registro: 'CRE9', payload: {}, validar: () => {}, escribir: () => 'z' }), 'z'); });
  caso('N26', () => { const o = OP(); o.bloquearRegistro('CRE4');
    thr('una operacion financiera comun queda bloqueada', () => o.ejecutar({ id: 'f', registro: 'CRE4', payload: {}, validar: () => {}, escribir: () => 'x' }));
    const r = o.ejecutar({ id: 'g', registro: 'CRE4', payload: {}, validar: () => {}, escribir: () => 'ajuste', correctivo: true, idDecision: 'DEC-1', verificar: () => [] });
    eq('el ajuste que corrige la diferencia SI pasa y, con el invariante en verde, levanta el bloqueo', [r.resultado, r.diferenciaResuelta, o.bloqueados.size], ['ajuste', true, 0]);
    eq('resuelta la diferencia, se opera normal', o.ejecutar({ id: 'h', registro: 'CRE4', payload: {}, validar: () => {}, escribir: () => 'ok' }), 'ok'); });
  caso('N27', () => { cr = nuevo(100000, 0, 50000, 3); f = new M.Fondo(0); M.cobrar(cr, 'a', 50000); const h = M.huellaEstado(cr, f);
    eq('sin cambios, la confirmacion pasa', (() => { M.confirmarConHuella(h, cr, f); return 'ok'; })(), 'ok');
    M.cobrar(cr, 'b', 50000); thr('otro cobro cambio el estado: hay que simular de nuevo', () => M.confirmarConHuella(h, cr, f)); });
  caso('N28', () => { const rec = []; const hu = 'ajuste|U1|25000';
    eq('primer ajuste', M.guardiaDuplicado(rec, hu, 0), true);
    thr('mismo ajuste en 60 s con otro id: posible duplicado', () => M.guardiaDuplicado(rec, hu, 60));
    eq('confirmado por la persona', M.guardiaDuplicado(rec, hu, 61, { confirmar: true }), true);
    eq('pasados los 2 minutos no molesta', M.guardiaDuplicado([{ huella: hu, t: 0 }], hu, 500), true);
    eq('otro importe no molesta', M.guardiaDuplicado(rec, 'ajuste|U1|30000', 62), true); });


  // ---- v3.3 (ronda 3): casos N29 a N33
  // N29: recuperacion DIRECTA (sin incobrable previo) tambien es idempotente por evento
  caso('N29', () => { u = vend('n29', 90000, 80000); f = new M.Fondo(5000);
    const r1 = M.recuperar(u, f, 60000, 'rec-directa'); eq('primera ejecucion', [r1.E, r1.F, f.saldo, u.G], [0, 0, 5000, 50000]);
    const u2 = vend('n29b', 90000, 80000), f2 = new M.Fondo(5000); const a = M.recuperar(u2, f2, 20000, 'rd'); /* E=0 -> F=0 */
    const u3 = vend('n29c', 100000, 80000), f3 = new M.Fondo(5000); const c1 = M.recuperar(u3, f3, 10000, 'rd'); eq('con exposicion: toma del fondo', [c1.E, c1.F, f3.saldo, u3.G], [10000, 5000, 0, -5000]); /* G = P+V+F-C = 80.000+10.000+5.000-100.000 */
    const c2 = M.recuperar(u3, f3, 10000, 'rd'); eq('reintento con el mismo ref no mueve nada', [f3.saldo, u3.G, c2.delta, c2.repetido], [0, c1.total, 0, true]);
    eq('sin efecto colateral en la otra unidad', [a.F, f2.saldo], [0, 5000]); });
  // N30: la huella de incobrable/recuperacion incluye costo, cobrado, ganancia, estado y fondo aplicado de la unidad
  caso('N30', () => { cr = nuevo(100000, 0, 50000, 3); const mkU = () => { const x = vend('n30', 90000, 80000); return x; };
    // sin la huella de la unidad: simulacion = 10.000 y, tras un repuesto de 25.000, el asiento real seria 25.000 y el fondo quedaria en 25.000
    const sim = (extra) => { const x = mkU(), ff = new M.Fondo(40000); M.incobrable(x, ff, 'inc'); if (extra) x.costo('Repuesto garantia', extra, 'g'); const r = M.recuperar(x, ff, 20000, 'rec', { F: 10000 }); return [r.delta, ff.saldo]; };
    eq('simulado sin repuesto', sim(0), [10000, 40000]); eq('real con repuesto cargado en el medio (lo que se evita)', sim(25000), [25000, 25000]);
    const x = mkU(), ff = new M.Fondo(40000); M.incobrable(x, ff, 'inc'); const h = M.huellaEstado(cr, ff, x);
    eq('sin cambios la confirmacion pasa', (() => { M.confirmarConHuella(h, cr, ff, x); return 'ok'; })(), 'ok');
    x.costo('Repuesto garantia', 25000, 'g'); thr('un costo nuevo cambia la huella: hay que simular de nuevo', () => M.confirmarConHuella(h, cr, ff, x));
    const y = mkU(), fy = new M.Fondo(40000); M.incobrable(y, fy, 'inc'); const h2 = M.huellaEstado(cr, fy, y); y.cobradoPrecio(85000, 'cobro tardio'); thr('un cambio del cobrado tambien', () => M.confirmarConHuella(h2, cr, fy, y)); });
  // N31: operacion interrumpida: listar, reanudar, abandonar (sin deshacer filas) y diferencia posterior
  caso('N31', () => { const o = OP(); const corta = (id, reg) => thr('corte ' + id, () => o.ejecutar({ id, registro: reg, payload: { monto: 50000 }, validar: () => {}, escribir: (p, w) => { w(1, 'cobro'); throw new Error('corte'); } }));
    corta('p1', 'CRE7'); eq('aparece en la lista de pendientes', o.listarPendientes().map((x) => [x.id, x.registro]), [['p1', 'CRE7']]);
    thr('abandonar sin motivo', () => o.resolverInterrumpida({ id: 'p1', accion: 'abandonar', idDecision: 'D' }));
    thr('abandonar sin id_decision', () => o.resolverInterrumpida({ id: 'p1', accion: 'abandonar', motivo: 'x' }));
    const rs = o.resolverInterrumpida({ id: 'p1', accion: 'abandonar', motivo: 'perdi el id en el telefono', idDecision: 'D-9', verificar: () => ['invariante 2: cobrado sin aplicar a cuotas'] });
    eq('abandonar: no deshace la fila escrita, libera la reserva y deja el registro bloqueado por la diferencia', [rs.abandonada, rs.filasEscritasQuedan, o.reservas.size, o.bloqueados.has('CRE7'), o.listarPendientes().length], [true, 1, 0, true, 0]);
    thr('una operacion comun sigue bloqueada por la diferencia', () => o.ejecutar({ id: 'q', registro: 'CRE7', payload: {}, validar: () => {}, escribir: () => 'x' }));
    const ra = o.ejecutar({ id: 'aj', registro: 'CRE7', payload: {}, validar: () => {}, escribir: () => 'ajuste', correctivo: true, idDecision: 'D-10', verificar: () => [] });
    eq('el ajuste correctivo en verde la libera', [ra.diferenciaResuelta, o.bloqueados.has('CRE7')], [true, false]);
    thr('la operacion abandonada ya no se puede resolver otra vez', () => o.resolverInterrumpida({ id: 'p1', accion: 'reanudar', escribir: () => 'x' }));
    corta('p2', 'CRE8'); const rr = o.resolverInterrumpida({ id: 'p2', accion: 'reanudar', escribir: (p, w) => { w(1, 'cobro'); w(2, 'cuota'); return 'ok'; } });
    eq('reanudar: completa con el payload guardado, sin duplicar la fila 1', [rr, o.libro.filter((x) => x.k.startsWith('p2#')).length, o.reservas.size, o.filas.get('p2').estado], ['ok', 2, 0, 'Completa']);
    corta('p3', 'CRE9'); const ver = o.resolverInterrumpida({ id: 'p3', accion: 'abandonar', motivo: 'lo cobre a mano y lo ajuste', idDecision: 'D-11', verificar: () => [] });
    eq('abandonar con el invariante en verde: no bloquea el registro', [ver.diferencias.length, o.bloqueados.has('CRE9'), o.reservas.size], [0, false, 0]); });
  // N32: ajuste correctivo: exige id_decision y solo levanta el bloqueo si el invariante vuelve a verde
  caso('N32', () => { const o = OP(); o.bloquearRegistro('CRE5');
    thr('sin id_decision no entra', () => o.ejecutar({ id: 'c1', registro: 'CRE5', payload: {}, validar: () => {}, escribir: () => 'a', correctivo: true, verificar: () => [] }));
    eq('no quedo fila ni reserva', [o.filas.size, o.reservas.size], [0, 0]);
    const r = o.ejecutar({ id: 'c2', registro: 'CRE5', payload: {}, validar: () => {}, escribir: (p, w) => { w(1, 'ajuste de 1 Gs'); return 'a'; }, correctivo: true, idDecision: 'DEC-2', verificar: () => ['invariante 2: diferencia 50000'] });
    eq('ajuste inutil: la fila se escribe pero la diferencia no se resolvio', [r.diferenciaResuelta, r.diferencias.length, o.bloqueados.has('CRE5'), o.libro.length], [false, 1, true, 1]);
    thr('el registro sigue bloqueado para operaciones comunes', () => o.ejecutar({ id: 'c3', registro: 'CRE5', payload: {}, validar: () => {}, escribir: () => 'x' }));
    const r2 = o.ejecutar({ id: 'c4', registro: 'CRE5', payload: {}, validar: () => {}, escribir: () => 'a2', correctivo: true, idDecision: 'DEC-3', verificar: () => [] });
    eq('el segundo ajuste deja el invariante en verde y levanta el bloqueo', [r2.diferenciaResuelta, o.bloqueados.has('CRE5')], [true, false]); });
  // N33: la guardia de doble toque va DESPUES de la idempotencia; el correctivo se distingue en la huella pero tambien pasa por la guardia
  caso('N33', () => { const o = OP(); const hu = M.huellaNegocio({ operacion: 'ajuste', registro: 'U1', tipo: 'Repuesto', monto: 25000 });
    const run = (id, ahora, extra = {}) => o.ejecutar({ id, registro: 'U1', payload: {}, validar: () => {}, escribir: () => 'ok-' + id, guardia: { huella: hu, ahoraSeg: ahora, ...extra } });
    eq('primer ajuste', run('a1', 0), 'ok-a1');
    eq('reintento con el MISMO id (mala senal) devuelve el resultado guardado sin pasar por la guardia', run('a1', 10), 'ok-a1');
    thr('otro id, misma huella, 60 s despues: posible duplicado', () => run('a2', 60));
    eq('confirmado por la persona', run('a2', 61, { confirmar: true }), 'ok-a2');
    eq('pasados los 2 minutos no molesta', run('a3', 400), 'ok-a3');
    const hc = M.huellaNegocio({ operacion: 'ajuste', registro: 'U1', tipo: 'Repuesto', monto: 25000, correctivo: true });
    eq('un correctivo no se confunde con un ajuste ordinario', hc !== hu, true);
    const o2 = OP(); const rc = (id, t, conf) => o2.ejecutar({ id, registro: 'CRE6', payload: {}, validar: () => {}, escribir: () => 'ok', correctivo: true, idDecision: 'D', verificar: () => [], guardia: { huella: hc, ahoraSeg: t, confirmar: conf } });
    rc('k1', 0); thr('dos correctivos iguales en 30 s tambien piden confirmacion', () => rc('k2', 30));
    const o3 = OP(); thr('la validacion falla: no se anota la huella', () => o3.ejecutar({ id: 'v1', registro: 'U2', payload: {}, validar: () => { throw new Error('no'); }, escribir: () => 'x', guardia: { huella: hu, ahoraSeg: 0 } }));
    eq('y el reintento legitimo no se toma por duplicado', o3.ejecutar({ id: 'v2', registro: 'U2', payload: {}, validar: () => {}, escribir: () => 'ok', guardia: { huella: hu, ahoraSeg: 5 } }), 'ok'); });


  // ---- v3.4 (ronda 4): casos N34 y N35
  // N34: el ajuste correctivo corre TODOS los invariantes del tipo de registro; verificarInvariantes desmarca un registro que vuelve a verde
  caso('N34', () => { const INV = M.INVARIANTES_POR_REGISTRO;
    eq('todo tipo de registro incluye el control de dinero (7)', Object.values(INV).every((l) => l.includes(7)), true);
    eq('credito: 1, 2, 3, 6 y 7; unidad: 5, 6 y 7', [INV.credito, INV.unidad], [[1, 2, 3, 6, 7], [5, 6, 7]]);
    const rojos = new Set([2, 7]); const verifCred = () => INV.credito.filter((i) => rojos.has(i)).map((i) => 'invariante ' + i);
    const o = OP(); o.bloquearRegistro('CRE1');
    rojos.delete(2); const r1 = o.ejecutar({ id: 'k1', registro: 'CRE1', payload: {}, validar: () => {}, escribir: () => 'a', correctivo: true, idDecision: 'D1', verificar: verifCred });
    eq('el ajuste corrigio el 2 pero el 7 sigue en rojo: el bloqueo persiste', [r1.diferenciaResuelta, r1.diferencias, o.bloqueados.has('CRE1')], [false, ['invariante 7'], true]);
    rojos.delete(7); const r2 = o.ejecutar({ id: 'k2', registro: 'CRE1', payload: {}, validar: () => {}, escribir: () => 'b', correctivo: true, idDecision: 'D2', verificar: verifCred });
    eq('con todos en verde se levanta', [r2.diferenciaResuelta, o.bloqueados.has('CRE1')], [true, false]);
    const o2 = OP(); o2.bloquearRegistro('CRE2');
    eq('verificarInvariantes con una diferencia: sigue bloqueado', o2.revisar('CRE2', () => ['invariante 2']).desbloqueado, false);
    eq('verificarInvariantes con todo en verde (se corrigio la hoja a mano): se desmarca', [o2.revisar('CRE2', () => []).desbloqueado, o2.bloqueados.has('CRE2')], [true, false]); });
  // N35: la reserva abarca todos los registros que la operacion escribe (credito, unidad, cliente)
  caso('N35', () => { const o = OP(); const regs = ['CRE1', 'U1', 'CLI1'];
    thr('devolucion cortada', () => o.ejecutar({ id: 'dv', registro: regs, payload: { reembolso: 80000 }, validar: () => {}, escribir: (p, w) => { w(1, 'cobro reversa'); throw new Error('corte'); } }));
    thr('un ajuste de costo sobre la UNIDAD mientras la devolucion esta a medias', () => o.ejecutar({ id: 'aj', registro: 'U1', payload: {}, validar: () => {}, escribir: () => 'x' }));
    eq('otra unidad no se afecta', o.ejecutar({ id: 'aj2', registro: 'U2', payload: {}, validar: () => {}, escribir: () => 'y' }), 'y');
    eq('la lista de pendientes muestra los tres registros', o.listarPendientes()[0].registros, regs);
    const rr = o.resolverInterrumpida({ id: 'dv', accion: 'reanudar', escribir: (p, w) => { w(1, 'cobro reversa'); w(2, 'devolucion'); return 'ok'; } });
    eq('reanudar completa y libera los tres registros', [rr, o.reservas.size, o.libro.filter((x) => x.k.startsWith('dv#')).length], ['ok', 0, 2]);
    thr('otra devolucion cortada', () => o.ejecutar({ id: 'dv2', registro: ['CRE5', 'U5', 'CLI5'], payload: {}, validar: () => {}, escribir: (p, w) => { w(1, 'x'); throw new Error('corte'); } }));
    const ab = o.resolverInterrumpida({ id: 'dv2', accion: 'abandonar', motivo: 'lo repito', idDecision: 'D-7', verificar: () => ['invariante 6'] });
    eq('abandonar con diferencia bloquea los tres registros', [ab.abandonada, ['CRE5', 'U5', 'CLI5'].every((r) => o.bloqueados.has(r)), o.reservas.size], [true, true, 0]); });

  // ---- v3.6: servicio tecnico con anticipos
  // N36: orden entregada con anticipo: el cobro_final es el precio total; entra solo el saldo; la ganancia no se duplica
  caso('N36', () => { const o = M.ordenServicio({ cobro: 120000, repuestos: 30000, tarifa: 40000 }); const c = M.cobroOrden({ cobro_final: 120000, anticipos: 50000 });
    eq('asiento de Servicio tecnico = precio total; saldo que entra al entregar; sin devolucion', [c.asiento, c.saldo, c.devolucion], [120000, 70000, 0]);
    eq('el dinero de la orden (anticipo + saldo) es el precio total, no 170.000', c.dineroDeLaOrden, 120000);
    eq('la ganancia de la orden es la misma que sin anticipo (N9)', o.ganancia, 50000);
    eq('sin anticipo el comportamiento anterior no cambia', M.cobroOrden({ cobro_final: 120000, anticipos: 0 }).saldo, 120000); });
  // N37: orden cancelada con anticipo: se retiene lo fijado por el Administrador y se devuelve el resto
  caso('N37', () => { const c = M.cobroOrden({ cobro_final: 20000, anticipos: 50000 }); const o = M.ordenServicio({ cobro: 20000, repuestos: 15000, tarifa: 30000 });
    eq('se retienen 20.000: asiento 20.000, no entra saldo, se devuelven 30.000', [c.asiento, c.saldo, c.devolucion], [20000, 0, 30000]);
    eq('el dinero que se queda es lo retenido', c.dineroDeLaOrden, 20000);
    eq('renglon de servicio: retenido 20.000 menos el costo 45.000 de N8', o.ganancia, -25000);
    const c0 = M.cobroOrden({ cobro_final: 0, anticipos: 50000 }); eq('sin retencion se devuelve todo el anticipo', [c0.asiento, c0.devolucion, c0.dineroDeLaOrden], [0, 50000, 0]); });

  const faltan = IDS.filter((x) => !cubiertos.has(x)); eq('META: todos los IDs cubiertos', faltan, []);
  consola.log(`\nRESULTADO: ${ok} OK, ${bad} FALLA`);
  return { ok: ok, falla: bad, verde: bad === 0, ids_cubiertos: cubiertos.size, log: LOG };

}

