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

  // Alta de equipo nuevo en estado Detectado.
  async function crearEquipoDetectado(marca, modelo, notas) {
    return llamar("crearEquipoDetectado", { marca, modelo, notas });
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
  // Tecnico Seccion 4.8). Operacion nueva, todavia no implementada en
  // el backend a la fecha de este archivo (ver Indice Maestro) - se
  // deja declarada aca para que catalogo.js la use apenas exista;
  // mientras tanto catalogo.js detecta su ausencia y sigue
  // funcionando sin el aviso H-05.
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

  return {
    llamar,
    obtenerEquiposYModelos,
    probarEscrituraEquipo,
    obtenerFichaEquipo,
    transicionarEquipo,
    obtenerDatosDashboard,
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
  };
})();
