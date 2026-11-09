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
