// GESTION_CELULARES - js/core/api.js
// Unico punto de contacto con Apps Script. Cada operacion de
// negocio es UNA sola llamada (Diseno Tecnico, Seccion 5.2) - nunca
// se encadenan varias escrituras sueltas desde el frontend.
// Toda llamada (salvo "login") manda el token de sesion propio;
// Apps Script lo verifica siempre del lado servidor contra
// Sesiones_Activas (Seccion 5.3 y 6.1).

const Api = (() => {
  async function llamar(operacion, payload = {}) {
    const cuerpo = {
      operacion,
      token: Auth.getToken ? Auth.getToken() : null,
      datos: payload,
    };

    const respuesta = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      // Apps Script Web Apps no siempre negocian bien
      // application/json en el preflight; text/plain evita CORS
      // preflight y el propio script parsea el JSON del body.
      body: JSON.stringify(cuerpo),
    });

    if (!respuesta.ok) {
      throw new Error(`Apps Script respondio ${respuesta.status}`);
    }

    const resultado = await respuesta.json();

    if (resultado.error) {
      throw new Error(resultado.error);
    }

    return resultado.datos;
  }

  async function obtenerEquiposYModelos() {
    return llamar("obtenerEquiposYModelos");
  }

  async function probarEscrituraEquipo(idEquipo, version, nota) {
    return llamar("probarEscrituraEquipo", { idEquipo, version, nota });
  }

  async function obtenerFichaEquipo(idEquipo) {
    return llamar("obtenerFichaEquipo", { idEquipo });
  }

  async function transicionarEquipo(idEquipo, version, estadoNuevo, comentario) {
    return llamar("transicionarEquipo", { idEquipo, version, estadoNuevo, comentario });
  }

  // Dashboard real (Fase 1): equipos, historial y config de SLA.
  async function obtenerDatosDashboard() {
    return llamar("obtenerDatosDashboard");
  }

  // Panel ampliado del Dashboard (Fase 6, segunda pieza -
  // Especificacion de Interfaz Seccion 4.1 v1.9): ventas y gastos
  // operativos, para la rentabilidad global (H-07). Equipos,
  // historial y configuracion ya llegan por obtenerDatosDashboard y
  // obtenerConfiguracion - esta llamada solo agrega lo que faltaba.
  async function obtenerDatosDashboardAmpliado() {
    return llamar("obtenerDatosDashboardAmpliado");
  }

  // Alta de equipo nuevo en estado Detectado. idVendedor es opcional
  // (Fase 7, Especificacion 4.12): selector de fuente de compra en el
  // modal de alta del Dashboard.
  async function crearEquipoDetectado(marca, modelo, notas, idVendedor) {
    return llamar("crearEquipoDetectado", { marca, modelo, notas, idVendedor });
  }

  // --- Fase 2 (Diagnostico y Reparaciones) ---

  // Guarda un nuevo diagnostico. No transiciona el equipo - el
  // backend solo devuelve una sugerencia (hayFallos, sugerenciaEstado).
  async function guardarDiagnostico(idEquipo, items, imeiVerificado, estadoFisico, evidenciaHumedad, comentario) {
    return llamar("guardarDiagnostico", {
      idEquipo,
      items,
      imeiVerificado,
      estadoFisico,
      evidenciaHumedad,
      comentario,
    });
  }

  async function obtenerDiagnosticosEquipo(idEquipo) {
    return llamar("obtenerDiagnosticosEquipo", { idEquipo });
  }

  // Fila unica de Configuracion (tarifa_mano_obra, margen_minimo,
  // etc. - Diseno Tecnico Seccion 3.11). Usado por el motor de
  // valoracion PT-04 en la Pantalla de Diagnostico.
  async function obtenerConfiguracion() {
    return llamar("obtenerConfiguracion");
  }

  // --- Fase 2 (Reparaciones) ---

  // Cola de equipos en "En reparacion" o "Esperando repuestos", con
  // su reparacion abierta asociada (si ya se tomo) y los repuestos
  // disponibles para el formulario de completar.
  async function obtenerColaReparaciones() {
    return llamar("obtenerColaReparaciones");
  }

  // Crea la fila de Reparaciones (fecha_inicio, tecnico = sesion
  // actual). No transiciona el equipo.
  async function iniciarReparacion(idEquipo) {
    return llamar("iniciarReparacion", { idEquipo });
  }

  // Cierra la reparacion: descuenta stock de Repuestos, calcula
  // costo_mano_obra, y transiciona el equipo segun el resultado.
  async function completarReparacion(idReparacion, version, tiempoInvertidoMin, repuestosUsados, resultado, comentario) {
    return llamar("completarReparacion", {
      idReparacion,
      version,
      tiempoInvertidoMin,
      repuestosUsados,
      resultado,
      comentario,
    });
  }

  // Transiciona el equipo a "Esperando repuestos" sin cerrar la
  // reparacion.
  async function pausarPorRepuesto(idReparacion, versionEquipo, comentario) {
    return llamar("pausarPorRepuesto", { idReparacion, versionEquipo, comentario });
  }

  // --- Fase 3 (Ventas, Clientes y Garantias) ---

  async function obtenerClientes() {
    return llamar("obtenerClientes");
  }

  // Fase 3, Directorio de Clientes (Especificacion 4.10).
  async function obtenerFichaCliente(idCliente) {
    return llamar("obtenerFichaCliente", { idCliente });
  }

  async function crearCliente(nombre, contacto, notas) {
    return llamar("crearCliente", { nombre, contacto, notas });
  }

  async function actualizarCliente(idCliente, nombre, contacto, notas) {
    return llamar("actualizarCliente", { idCliente, nombre, contacto, notas });
  }

  // Referencias de precio (Diseno Tecnico 4.11): valor de mercado y
  // costo total, sin forzar una sola formula.
  async function obtenerDatosVenta(idEquipo) {
    return llamar("obtenerDatosVenta", { idEquipo });
  }

  async function registrarVenta(idEquipo, versionEquipo, idClienteExistente, clienteNuevo, precioVenta, garantiaDias, fechaVenta, canalVenta) {
    return llamar("registrarVenta", {
      idEquipo,
      versionEquipo,
      idClienteExistente,
      clienteNuevo,
      precioVenta,
      garantiaDias,
      fechaVenta,
      canalVenta,
    });
  }

  // Vendido -> Entregado -> En garantia (automatico), en una sola
  // llamada.
  async function entregarEquipo(idEquipo, versionEquipo) {
    return llamar("entregarEquipo", { idEquipo, versionEquipo });
  }

  // Fase 3, Pieza 2: Panel de Garantias. Solo lectura - dias
  // restantes ya vienen calculados desde el servidor.
  async function obtenerEquiposEnGarantia() {
    return llamar("obtenerEquiposEnGarantia");
  }

  // --- Catalogo de Modelos (Especificacion 4.8) ---

  // Alta de modelo. Cada campo de datos ademas de comentario (Diseno
  // Tecnico 3.9). El backend registra la entrada en Decisiones con
  // categoria "Modelos" (Especificacion 4.8).
  async function crearModelo(datos) {
    return llamar("crearModelo", datos);
  }

  // Edicion de un modelo existente, identificado por marca+modelo (la
  // hoja Modelos no tiene columna id propia - Diseno Tecnico 3.9).
  // Solo los campos que el Administrador puede tocar desde la app
  // (Especificacion 4.8). comentario es obligatorio y genera la
  // entrada en Decisiones.
  async function actualizarModelo(marca, modelo, cambios, comentario) {
    return llamar("actualizarModelo", { marca, modelo, cambios, comentario });
  }

  // Diagnosticos de TODOS los equipos, sin filtrar por id_equipo -
  // necesario para calcular tasaFalla por modelo (H-05, Diseno
  // Tecnico Seccion 4.8). Usado por Catalogo de Modelos y, desde
  // Fase 6 (Panel ampliado), tambien por el Dashboard.
  async function obtenerDiagnosticosTodos() {
    return llamar("obtenerDiagnosticosTodos");
  }

  // --- Bitacora de Decisiones (Especificacion 4.9, Fase 6) ---

  // Lectura completa de la hoja Decisiones, solo lectura (Especificacion
  // 4.9 v1.8: listado cronologico, filtro por categoria, buscador de
  // texto libre, sin alta manual ni marcado de obsoleta). Las escrituras
  // siguen originandose unicamente desde las pantallas que ya escriben
  // en esta hoja (hoy, Catalogo de Modelos via insertarDecision_).
  async function obtenerDecisiones() {
    return llamar("obtenerDecisiones");
  }

  // --- Inventario de Repuestos (Especificacion 4.6) ---

  async function obtenerRepuestos() {
    return llamar("obtenerRepuestos");
  }

  async function crearRepuesto(datos) {
    return llamar("crearRepuesto", datos);
  }

  // No borra filas (Especificacion 4.6): tambien se usa para marcar
  // un repuesto como Inactivo en vez de eliminarlo.
  async function actualizarRepuesto(idRepuesto, cambios) {
    return llamar("actualizarRepuesto", { idRepuesto, cambios });
  }

  // Ajuste manual de stock con motivo (compra / perdida / correccion).
  // El backend registra el movimiento en Movimientos_Repuestos y
  // actualiza stock_actual en la misma operacion (Especificacion 4.6).
  async function ajustarStockRepuesto(idRepuesto, cantidad, motivo, comentario) {
    return llamar("ajustarStockRepuesto", { idRepuesto, cantidad, motivo, comentario });
  }

  // --- Reportes Exportables (Especificacion 4.13, Diseno Tecnico
  // 4.12, Fase 6 - tercera pieza) ---

  // Lectura completa de la hoja Reparaciones, sin filtrar por estado
  // (a diferencia de obtenerColaReparaciones, que solo trae la cola
  // en curso). Endpoint nuevo, agregado especificamente para este
  // reporte - los otros tres reportes reutilizan endpoints existentes
  // (obtenerEquiposYModelos, obtenerDatosDashboardAmpliado).
  async function obtenerReparacionesTodas() {
    return llamar("obtenerReparacionesTodas");
  }

  // --- Vendedores (Especificacion 4.12, Diseno Tecnico 3.14, Fase 7) ---
  // Directorio de fuentes de compra. No confundir con Clientes
  // (compradores) ni con el rol "Vendedor" de Usuarios.

  async function obtenerVendedores() {
    return llamar("obtenerVendedores");
  }

  async function obtenerFichaVendedor(idVendedor) {
    return llamar("obtenerFichaVendedor", { idVendedor });
  }

  async function crearVendedor(datos) {
    return llamar("crearVendedor", datos);
  }

  async function actualizarVendedor(idVendedor, cambios) {
    return llamar("actualizarVendedor", { idVendedor, cambios });
  }

  // --- Alertas completas (Especificacion de Interfaz Secciones 3.3 y
  // 4.1, Diseno Tecnico Seccion 4.4, Fase 8 - primera pieza) ---
  // Resumen liviano de conteos (equipos estancados, stock bajo,
  // garantias por vencer), pensado para pedirse en cada navegacion
  // sin descargar Equipos, Repuestos ni Ventas completos - mismo
  // patron que obtenerReparacionesTodas().

  async function obtenerResumenAlertas() {
    return llamar("obtenerResumenAlertas");
  }

  // --- Gestion de Usuarios (Especificacion de Interfaz Seccion 4.14,
  // Diseno Tecnico Seccion 4.13, Fase 8 - segunda pieza) ---
  // Los tres endpoints de escritura exigen rol Administrador,
  // validado en el servidor (Seccion 5.3). obtenerUsuarios es lectura,
  // tambien restringida a Administrador del lado servidor - no es uno
  // de los tres endpoints de la Seccion 4.13, se agrega para poder
  // pintar el listado de la pantalla (mismo patron que
  // obtenerVendedores para Vendedores).

  async function obtenerUsuarios() {
    return llamar("obtenerUsuarios");
  }

  async function altaUsuario(email, nombre, roles, pin) {
    return llamar("altaUsuario", { email, nombre, roles, pin });
  }

  async function reiniciarPinUsuario(email, pinNuevo) {
    return llamar("reiniciarPinUsuario", { email, pinNuevo });
  }

  async function desactivarUsuario(email) {
    return llamar("desactivarUsuario", { email });
  }

  return {
    llamar,
    obtenerEquiposYModelos,
    probarEscrituraEquipo,
    obtenerFichaEquipo,
    transicionarEquipo,
    obtenerDatosDashboard,
    obtenerDatosDashboardAmpliado,
    crearEquipoDetectado,
    guardarDiagnostico,
    obtenerDiagnosticosEquipo,
    obtenerConfiguracion,
    obtenerColaReparaciones,
    iniciarReparacion,
    completarReparacion,
    pausarPorRepuesto,
    obtenerClientes,
    obtenerFichaCliente,
    crearCliente,
    actualizarCliente,
    obtenerDatosVenta,
    registrarVenta,
    entregarEquipo,
    obtenerEquiposEnGarantia,
    crearModelo,
    actualizarModelo,
    obtenerDiagnosticosTodos,
    obtenerDecisiones,
    obtenerRepuestos,
    crearRepuesto,
    actualizarRepuesto,
    ajustarStockRepuesto,
    obtenerReparacionesTodas,
    obtenerVendedores,
    obtenerFichaVendedor,
    crearVendedor,
    actualizarVendedor,
    obtenerResumenAlertas,
    obtenerUsuarios,
    altaUsuario,
    reiniciarPinUsuario,
    desactivarUsuario,
  };
})();
