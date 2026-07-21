// GESTION_CELULARES - js/pantallas/ficha-equipo.js
// Ficha de Equipo (Especificacion de Interfaz Seccion 4.3, alcance
// de Fase 1): encabezado, panel de acciones de transicion, datos de
// compra, historial de estados. Diagnosticos, Reparaciones y Ventas
// son de Fase 2 y Fase 3 (Hoja de Ruta) - se muestran como secciones
// deshabilitadas, no vacias sin explicacion.

async function renderFichaEquipo(contenedor, idEquipo) {
  if (!idEquipo) {
    contenedor.innerHTML = "<p>Falta el ID de equipo en la URL.</p>";
    return;
  }

  contenedor.innerHTML = `<p>Cargando ficha de ${idEquipo}...</p>`;

  try {
    const [ficha, diagnosticosPrevios] = await Promise.all([
      Api.obtenerFichaEquipo(idEquipo),
      Api.obtenerDiagnosticosEquipo(idEquipo),
    ]);
    pintarFicha(contenedor, ficha, diagnosticosPrevios);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar la ficha: ${err.message}</p>`;
  }
}

function pintarFicha(contenedor, ficha, diagnosticosPrevios) {
  const e = ficha.equipo;

  contenedor.innerHTML = `
    <p><a href="#dashboard">&larr; Volver</a></p>

    <div class="ficha-encabezado">
      <h2>${e.id_equipo} - ${e.marca} ${e.modelo}</h2>
      <p>IMEI: ${e.imei || "sin registrar"}</p>
      <p class="ficha-estado-actual">Estado: <strong>${e.estado}</strong></p>
    </div>

    <div class="ficha-panel-acciones" id="ficha-panel-acciones"></div>

    <details class="ficha-seccion" open>
      <summary>Datos de compra</summary>
      <p>Fecha detección: ${formatearFecha(e.fecha_deteccion)}</p>
      <p>Fecha compra: ${formatearFecha(e.fecha_compra)}</p>
      <p>Precio compra: ${formatearGuaranies(e.precio_compra)}</p>
      <p>Notas: ${e.notas || "-"}</p>
    </details>

    <details class="ficha-seccion" ${diagnosticosPrevios.length ? "" : "open"}>
      <summary>Diagnósticos (${diagnosticosPrevios.length})</summary>
      <p><a href="#diagnosticos/${e.id_equipo}">Nuevo diagnóstico &rarr;</a></p>
      ${pintarDiagnosticosPrevios(diagnosticosPrevios)}
    </details>

    <details class="ficha-seccion">
      <summary>Reparaciones</summary>
      <p><a href="#reparaciones">Ver cola de reparaciones &rarr;</a></p>
      <p class="ficha-seccion-deshabilitada">Historial de reparaciones de este equipo especifico: pendiente, todavia no hay endpoint para listarlo por equipo.</p>
    </details>

    <details class="ficha-seccion" open>
      <summary>Historial de Estados</summary>
      ${pintarHistorial(ficha.historial)}
    </details>

    <details class="ficha-seccion" ${ficha.venta ? "open" : ""}>
      <summary>Venta y Garantía</summary>
      ${pintarVenta(ficha.venta)}
    </details>
  `;

  pintarPanelAcciones(ficha);
}

function pintarVenta(venta) {
  if (!venta) {
    return '<p class="ficha-seccion-deshabilitada">Este equipo todavía no se vendió.</p>';
  }
  return `
    <p>Venta ${venta.id_venta} - Fecha: ${formatearFecha(venta.fecha_venta)}</p>
    <p>Precio: ${formatearGuaranies(venta.precio_venta)}</p>
    <p>Cliente: ${venta.cliente}</p>
    <p>Canal: ${venta.canal_venta || "-"}</p>
    <p>Garantía: ${venta.garantia_dias} días - Estado: ${venta.estado_garantia || "Aún no entregado"}</p>
  `;
}

function pintarPanelAcciones(ficha) {
  const cont = document.getElementById("ficha-panel-acciones");
  const disponibles = ficha.transicionesDisponibles;

  if (!disponibles.length) {
    cont.innerHTML = "<p>No hay transiciones disponibles para tu rol actual desde este estado.</p>";
    return;
  }

  cont.innerHTML = disponibles
    .map((estadoNuevo) => `<button class="boton-transicion" data-estado="${estadoNuevo}">${estadoNuevo}</button>`)
    .join(" ");

  cont.querySelectorAll(".boton-transicion").forEach((boton) => {
    boton.addEventListener("click", () => {
      const estado = boton.dataset.estado;
      if (estado === "Vendido") {
        abrirModalVenta(ficha);
      } else if (estado === "Entregado") {
        abrirModalEntregar(ficha);
      } else {
        abrirModalTransicion(ficha, estado);
      }
    });
  });
}

function abrirModalTransicion(ficha, estadoNuevo) {
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>Cambiar a "${estadoNuevo}"</h3>
      <p>Equipo: ${ficha.equipo.id_equipo} (estado actual: ${ficha.equipo.estado})</p>
      <label for="modal-comentario">Comentario (obligatorio)</label>
      <textarea id="modal-comentario" rows="3"></textarea>
      <p id="modal-error" class="modal-error" hidden></p>
      <div class="modal-botones">
        <button id="modal-cancelar">Cancelar</button>
        <button id="modal-confirmar">Confirmar</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  document.getElementById("modal-cancelar").addEventListener("click", () => fondo.remove());

  document.getElementById("modal-confirmar").addEventListener("click", async () => {
    const comentario = document.getElementById("modal-comentario").value.trim();
    const errorEl = document.getElementById("modal-error");

    if (!comentario) {
      errorEl.textContent = "El comentario es obligatorio.";
      errorEl.hidden = false;
      return;
    }

    try {
      await Api.transicionarEquipo(ficha.equipo.id_equipo, ficha.equipo.version, estadoNuevo, comentario);
      fondo.remove();
      Router.navegar("ficha-equipo", ficha.equipo.id_equipo);
      renderFichaEquipo(document.getElementById("app-contenido"), ficha.equipo.id_equipo);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}

async function abrirModalVenta(ficha) {
  const e = ficha.equipo;
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>Registrar venta - ${e.id_equipo}</h3>
      <p id="venta-referencias">Cargando referencias de precio...</p>

      <label for="venta-cliente-select">Cliente</label>
      <select id="venta-cliente-select">
        <option value="">Cargando clientes...</option>
        <option value="__nuevo__">+ Cliente nuevo</option>
      </select>
      <div id="venta-cliente-nuevo" hidden>
        <label for="venta-cliente-nombre">Nombre</label>
        <input type="text" id="venta-cliente-nombre" />
        <label for="venta-cliente-contacto">Contacto</label>
        <input type="text" id="venta-cliente-contacto" />
      </div>

      <label for="venta-precio">Precio de venta (Gs.)</label>
      <input type="number" id="venta-precio" min="1" />

      <label for="venta-garantia">Días de garantía</label>
      <input type="number" id="venta-garantia" min="0" />

      <label for="venta-fecha">Fecha de venta</label>
      <input type="date" id="venta-fecha" />

      <label for="venta-canal">Canal de venta</label>
      <select id="venta-canal">
        <option value="Facebook Marketplace">Facebook Marketplace</option>
        <option value="WhatsApp">WhatsApp</option>
        <option value="Tienda física">Tienda física</option>
        <option value="Otro">Otro</option>
      </select>

      <p id="venta-error" class="modal-error" hidden></p>
      <div class="modal-botones">
        <button id="venta-cancelar">Cancelar</button>
        <button id="venta-confirmar">Confirmar venta</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  document.getElementById("venta-fecha").value = new Date().toISOString().slice(0, 10);
  document.getElementById("venta-cancelar").addEventListener("click", () => fondo.remove());

  const selectCliente = document.getElementById("venta-cliente-select");
  const bloqueClienteNuevo = document.getElementById("venta-cliente-nuevo");
  selectCliente.addEventListener("change", () => {
    bloqueClienteNuevo.hidden = selectCliente.value !== "__nuevo__";
  });

  try {
    const [datosVenta, clientes] = await Promise.all([Api.obtenerDatosVenta(e.id_equipo), Api.obtenerClientes()]);

    document.getElementById("venta-garantia").value = datosVenta.diasGarantiaDefault || "";

    const refEl = document.getElementById("venta-referencias");
    if (datosVenta.modeloEnCatalogo) {
      const alerta = datosVenta.alertaMargenBajo
        ? `<p class="modal-error" style="display:block">Este precio de mercado deja menos margen del mínimo configurado (${datosVenta.margenMinimo}%).</p>`
        : "";
      refEl.innerHTML = `
        Precio de mercado: ${formatearGuaranies(datosVenta.valorMercado)} ·
        Costo total: ${formatearGuaranies(datosVenta.costoTotal)} ·
        Ganancia con precio de mercado: ${formatearGuaranies(datosVenta.gananciaConPrecioSugerido)}
        (${datosVenta.margenConPrecioSugerido.toFixed(1)}%)
        ${alerta}
      `;
      document.getElementById("venta-precio").value = Math.round(datosVenta.valorMercado);
    } else {
      refEl.innerHTML = `Modelo no está en el Catálogo todavía - sin precio de mercado de referencia. Costo total: ${formatearGuaranies(datosVenta.costoTotal)}.`;
    }

    selectCliente.innerHTML =
      '<option value="">Selecciona un cliente</option>' +
      clientes.map((c) => `<option value="${c.id_cliente}">${c.nombre} (${c.contacto || "sin contacto"})</option>`).join("") +
      '<option value="__nuevo__">+ Cliente nuevo</option>';
  } catch (err) {
    document.getElementById("venta-referencias").textContent = "No se pudieron cargar las referencias: " + err.message;
  }

  document.getElementById("venta-confirmar").addEventListener("click", async () => {
    const errorEl = document.getElementById("venta-error");
    const idClienteExistente = selectCliente.value && selectCliente.value !== "__nuevo__" ? selectCliente.value : null;
    const clienteNuevo =
      selectCliente.value === "__nuevo__"
        ? {
            nombre: document.getElementById("venta-cliente-nombre").value.trim(),
            contacto: document.getElementById("venta-cliente-contacto").value.trim(),
          }
        : null;
    const precioVenta = Number(document.getElementById("venta-precio").value);
    const garantiaDias = Number(document.getElementById("venta-garantia").value);
    const fechaVenta = document.getElementById("venta-fecha").value;
    const canalVenta = document.getElementById("venta-canal").value;

    if (!idClienteExistente && (!clienteNuevo || !clienteNuevo.nombre)) {
      errorEl.textContent = "Selecciona un cliente o cargá uno nuevo con nombre.";
      errorEl.hidden = false;
      return;
    }
    if (!precioVenta || precioVenta <= 0) {
      errorEl.textContent = "Ingresá un precio de venta valido.";
      errorEl.hidden = false;
      return;
    }

    try {
      await Api.registrarVenta(e.id_equipo, e.version, idClienteExistente, clienteNuevo, precioVenta, garantiaDias, fechaVenta, canalVenta);
      fondo.remove();
      renderFichaEquipo(document.getElementById("app-contenido"), e.id_equipo);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}

function abrirModalEntregar(ficha) {
  const e = ficha.equipo;
  const fondo = document.createElement("div");
  fondo.className = "modal-fondo";
  fondo.innerHTML = `
    <div class="modal-caja">
      <h3>Entregar equipo - ${e.id_equipo}</h3>
      <p>Confirma que el cliente ya recibió el equipo. El período de garantía arranca automáticamente en este momento.</p>
      <p id="entregar-error" class="modal-error" hidden></p>
      <div class="modal-botones">
        <button id="entregar-cancelar">Cancelar</button>
        <button id="entregar-confirmar">Confirmar entrega</button>
      </div>
    </div>
  `;
  document.body.appendChild(fondo);

  document.getElementById("entregar-cancelar").addEventListener("click", () => fondo.remove());

  document.getElementById("entregar-confirmar").addEventListener("click", async () => {
    const errorEl = document.getElementById("entregar-error");
    try {
      await Api.entregarEquipo(e.id_equipo, e.version);
      fondo.remove();
      renderFichaEquipo(document.getElementById("app-contenido"), e.id_equipo);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}

function pintarHistorial(historial) {
  if (!historial.length) return "<p>Sin cambios de estado todavia.</p>";

  const filas = historial
    .map(
      (h) =>
        `<tr><td>${formatearFecha(h.fecha_hora)}</td><td>${h.estado_anterior}</td><td>${h.estado_nuevo}</td><td>${h.responsable}</td><td>${h.comentario}</td></tr>`
    )
    .join("");

  return `
    <table class="tabla-simple">
      <thead><tr><th>Fecha</th><th>De</th><th>A</th><th>Responsable</th><th>Comentario</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

function formatearFecha(valor) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString("es-PY");
}

function formatearGuaranies(valor) {
  if (!valor && valor !== 0) return "-";
  return "Gs. " + Number(valor).toLocaleString("es-PY");
}

Router.registrar("ficha-equipo", renderFichaEquipo);
