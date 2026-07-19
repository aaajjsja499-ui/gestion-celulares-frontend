// GESTION_CELULARES - js/pantallas/diagnosticos.js
// Pantalla de Diagnostico (Especificacion de Interfaz Seccion 4.4,
// Fase 2 de la Hoja de Ruta). Muestra los diagnosticos previos de un
// equipo (modo lectura) y un formulario para registrar uno nuevo -
// nunca sobrescribe uno existente. Si algun item queda "Fallado",
// habilita dos campos manuales (PT-04 Fase 2, Diseno Tecnico v1.7:
// costo estimado de repuestos y minutos estimados) que alimentan el
// motor de valoracion (js/calculos/valoracion.js) SOLO si el equipo
// esta en fase de compra (Detectado o En negociacion) - igual que la
// Ficha de Equipo (Seccion 4.3). Esos dos valores nunca se envian al
// backend: son una ayuda en pantalla, no un registro permanente.
//
// Se accede como #diagnosticos/EQ-XXX (mismo patron de parametro que
// ficha-equipo.js).

const ITEMS_DIAGNOSTICO_UI = [
  ["pantalla", "Pantalla"],
  ["tactil", "Táctil"],
  ["bateria", "Batería"],
  ["camara_trasera", "Cámara trasera"],
  ["camara_frontal", "Cámara frontal"],
  ["altavoz", "Altavoz"],
  ["microfono", "Micrófono"],
  ["puerto_carga", "Puerto de carga"],
  ["botones", "Botones"],
  ["huella_faceid", "Huella / Face ID"],
  ["wifi", "WiFi"],
  ["bluetooth", "Bluetooth"],
  ["red_movil", "Red móvil"],
];

const ESTADOS_FASE_COMPRA = ["Detectado", "En negociación"];

async function renderDiagnosticos(contenedor, idEquipo, mensajeExito) {
  if (!idEquipo) {
    contenedor.innerHTML = `
      <p><a href="#equipos">&larr; Volver al listado</a></p>
      <p>Para iniciar un diagnóstico, abrí la ficha del equipo y usá el botón "Nuevo diagnóstico".</p>
    `;
    return;
  }

  contenedor.innerHTML = `<p>Cargando datos de ${idEquipo}...</p>`;

  try {
    const [ficha, diagnosticosPrevios] = await Promise.all([
      Api.obtenerFichaEquipo(idEquipo),
      Api.obtenerDiagnosticosEquipo(idEquipo),
    ]);
    await pintarPantallaDiagnostico(contenedor, ficha, diagnosticosPrevios, mensajeExito);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar: ${err.message}</p>`;
  }
}

async function pintarPantallaDiagnostico(contenedor, ficha, diagnosticosPrevios, mensajeExito) {
  const e = ficha.equipo;

  contenedor.innerHTML = `
    <p><a href="#ficha-equipo/${e.id_equipo}">&larr; Volver a la ficha de ${e.id_equipo}</a></p>

    <h2>Diagnóstico - ${e.id_equipo} - ${e.marca} ${e.modelo}</h2>
    <p>Estado actual: <strong>${e.estado}</strong></p>

    ${mensajeExito ? `<p id="diagnostico-resultado" class="diagnostico-mensaje-exito">${mensajeExito}</p>` : ""}

    <details class="ficha-seccion" ${diagnosticosPrevios.length ? "" : "open"}>
      <summary>Diagnósticos previos (${diagnosticosPrevios.length})</summary>
      ${pintarDiagnosticosPrevios(diagnosticosPrevios)}
    </details>

    <h3>Nuevo diagnóstico</h3>
    <form id="form-diagnostico"></form>
  `;

  const form = document.getElementById("form-diagnostico");
  form.innerHTML = construirFormulario();
  vincularEventosFormulario(form, ficha);
}

function pintarDiagnosticosPrevios(previos) {
  if (!previos.length) {
    return "<p>Sin diagnósticos registrados todavía.</p>";
  }

  return previos
    .map((d) => {
      const itemsFallados = ITEMS_DIAGNOSTICO_UI.filter(([campo]) => d[campo] === "Fallado").map(([, etiqueta]) => etiqueta);
      const resumen = itemsFallados.length ? `Fallas: ${itemsFallados.join(", ")}` : "Sin fallas (todo OK)";

      return `
        <div class="diagnostico-previo">
          <p><strong>${d.id_diagnostico}</strong> - ${formatearFecha(d.fecha)} - ${d.tecnico}</p>
          <p>${resumen}</p>
          <p>Estado físico: ${d.estado_fisico} - Humedad: ${d.evidencia_humedad} - IMEI: ${d.imei_verificado}</p>
          <p>Comentario: ${d.comentario}</p>
        </div>
        <hr />
      `;
    })
    .join("");
}

function construirFormulario() {
  const filasItems = ITEMS_DIAGNOSTICO_UI.map(
    ([campo, etiqueta]) => `
      <div class="campo-diagnostico">
        <label for="item-${campo}">${etiqueta}</label>
        <select id="item-${campo}" data-campo="${campo}" class="selector-item-diagnostico">
          <option value="OK" selected>OK</option>
          <option value="Fallado">Fallado</option>
          <option value="No aplica">No aplica</option>
        </select>
      </div>
    `
  ).join("");

  return `
    ${filasItems}

    <label for="diag-imei">IMEI verificado</label>
    <select id="diag-imei">
      <option value="OK" selected>OK</option>
      <option value="No verificado">No verificado</option>
      <option value="Reportado">Reportado</option>
    </select>

    <label for="diag-estado-fisico">Estado físico</label>
    <select id="diag-estado-fisico">
      <option value="Excelente" selected>Excelente</option>
      <option value="Bueno">Bueno</option>
      <option value="Regular">Regular</option>
      <option value="Malo">Malo</option>
    </select>

    <label>
      <input type="checkbox" id="diag-humedad" />
      Evidencia de humedad
    </label>

    <div id="bloque-valoracion" hidden>
      <h4>Estimación para el motor de valoración (PT-04)</h4>
      <p>No se guarda en el diagnóstico - solo se usa para calcular el precio máximo de compra sugerido.</p>
      <label for="diag-costo-repuestos">Costo estimado de repuestos (Gs.)</label>
      <input type="number" id="diag-costo-repuestos" min="0" step="1" value="0" />
      <label for="diag-minutos">Minutos estimados de reparación</label>
      <input type="number" id="diag-minutos" min="0" step="1" value="0" />
      <div id="resultado-valoracion"></div>
    </div>

    <label for="diag-comentario">Comentario técnico (obligatorio)</label>
    <textarea id="diag-comentario" rows="3"></textarea>

    <p id="diag-error" class="modal-error" hidden></p>

    <button type="button" id="diag-guardar">Guardar diagnóstico</button>
  `;
}

function vincularEventosFormulario(form, ficha) {
  const selectoresItem = form.querySelectorAll(".selector-item-diagnostico");
  const bloqueValoracion = document.getElementById("bloque-valoracion");
  const mostrarValoracion = ESTADOS_FASE_COMPRA.indexOf(ficha.equipo.estado) >= 0;

  function actualizarVisibilidadValoracion() {
    const hayFallos = Array.from(selectoresItem).some((sel) => sel.value === "Fallado");
    bloqueValoracion.hidden = !(hayFallos && mostrarValoracion);
    if (bloqueValoracion.hidden) return;
    recalcularValoracion(ficha);
  }

  selectoresItem.forEach((sel) => sel.addEventListener("change", actualizarVisibilidadValoracion));

  const costoInput = document.getElementById("diag-costo-repuestos");
  const minutosInput = document.getElementById("diag-minutos");
  costoInput.addEventListener("input", () => recalcularValoracion(ficha));
  minutosInput.addEventListener("input", () => recalcularValoracion(ficha));

  document.getElementById("diag-guardar").addEventListener("click", () => guardarDiagnosticoDesdeFormulario(form, ficha));
}

let configuracionCacheada = null;
let modelosCacheados = null;

async function recalcularValoracion(ficha) {
  const contenedor = document.getElementById("resultado-valoracion");
  contenedor.innerHTML = "<p>Calculando...</p>";

  try {
    if (!configuracionCacheada) {
      configuracionCacheada = await Api.obtenerConfiguracion();
    }
    if (!modelosCacheados) {
      const datos = await Api.obtenerEquiposYModelos();
      modelosCacheados = datos.modelos;
    }

    const modelo = modelosCacheados.find(
      (m) => m.marca === ficha.equipo.marca && m.modelo === ficha.equipo.modelo
    );

    if (!modelo) {
      contenedor.innerHTML = `<p>Modelo "${ficha.equipo.marca} ${ficha.equipo.modelo}" no está en el Catálogo - no se puede calcular el precio máximo de compra.</p>`;
      return;
    }

    const costoEstimadoRepuestos = Number(document.getElementById("diag-costo-repuestos").value) || 0;
    const minutosEstimados = Number(document.getElementById("diag-minutos").value) || 0;

    const resultado = Valoracion.calcularPrecioMaximoCompra({
      valorMercado: modelo.valor_promedio_mercado,
      costoEstimadoRepuestos,
      minutosEstimados,
      tarifaManoObra: configuracionCacheada.tarifa_mano_obra,
      margenMinimoPorcentaje: configuracionCacheada.margen_minimo,
    });

    const noConviene = resultado.precioMaximoCompra <= 0;

    contenedor.innerHTML = `
      <p>Valor de mercado: ${formatearGuaranies(resultado.valorMercado)}</p>
      <p>Costo de reparaciones estimado: ${formatearGuaranies(resultado.costoReparaciones)} (mano de obra: ${formatearGuaranies(resultado.costoManoObra)})</p>
      <p>Margen mínimo: ${formatearGuaranies(resultado.margen)}</p>
      <p class="${noConviene ? "valoracion-no-conviene" : "valoracion-precio-maximo"}">
        <strong>Precio máximo de compra sugerido: ${formatearGuaranies(resultado.precioMaximoCompra)}</strong>
        ${noConviene ? " - con estos costos, no queda margen para comprar." : ""}
      </p>
    `;
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>No se pudo calcular la valoración: ${err.message}</p>`;
  }
}

async function guardarDiagnosticoDesdeFormulario(form, ficha) {
  const errorEl = document.getElementById("diag-error");
  errorEl.hidden = true;

  const items = {};
  form.querySelectorAll(".selector-item-diagnostico").forEach((sel) => {
    items[sel.dataset.campo] = sel.value;
  });

  const imeiVerificado = document.getElementById("diag-imei").value;
  const estadoFisico = document.getElementById("diag-estado-fisico").value;
  const evidenciaHumedad = document.getElementById("diag-humedad").checked ? "Sí" : "No";
  const comentario = document.getElementById("diag-comentario").value.trim();

  if (!comentario) {
    errorEl.textContent = "El comentario es obligatorio.";
    errorEl.hidden = false;
    return;
  }

  try {
    const resultado = await Api.guardarDiagnostico(
      ficha.equipo.id_equipo,
      items,
      imeiVerificado,
      estadoFisico,
      evidenciaHumedad,
      comentario
    );

    const mensajeExito = `
      Diagnóstico ${resultado.idDiagnostico} guardado.
      Sugerencia: pasar a "<strong>${resultado.sugerenciaEstado}</strong>".
      <a href="#ficha-equipo/${ficha.equipo.id_equipo}">Ir a la ficha para confirmar la transición &rarr;</a>
    `;

    // Recarga la pantalla para que el diagnostico recien guardado
    // aparezca en "Diagnosticos previos" y el formulario quede
    // limpio para uno nuevo si hiciera falta. El mensaje de exito
    // viaja como parametro para no perderse en el re-render (bug
    // encontrado en pruebas de Pedro: el mensaje se escribia y al
    // toque se borraba con el innerHTML del recargado).
    const contenedor = document.getElementById("app-contenido");
    await renderDiagnosticos(contenedor, ficha.equipo.id_equipo, mensajeExito);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
  }
}

function formatearFecha(valor) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString("es-PY");
}

function formatearGuaranies(valor) {
  if (!valor && valor !== 0) return "-";
  return "Gs. " + Math.round(Number(valor)).toLocaleString("es-PY");
}

Router.registrar("diagnosticos", renderDiagnosticos);
