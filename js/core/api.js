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
  };
})();
