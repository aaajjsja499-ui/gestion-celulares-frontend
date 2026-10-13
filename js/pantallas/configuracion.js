// GESTION_CELULARES - js/pantallas/configuracion.js
// Fase 8, quinta pieza (Gestion de Configuracion - Especificacion de
// Interfaz Seccion 4.16, Diseno Tecnico Seccion 4.14). Pantalla
// completa dedicada, visible solo para el rol Administrador. Hueco
// encontrado al responder una pregunta operativa de Pedro sobre como
// cargar el capital de trabajo: toda la hoja Configuracion (~21
// parametros) se editaba a mano directamente en Sheets.
//
// Los parametros se agrupan en cuatro bloques tematicos (Compras,
// Viabilidad PT-09, SLA por estado, Alertas y retroalimentacion).
// Cada bloque se guarda por separado, con su propio comentario
// obligatorio - llama a actualizarConfiguracion solo con los campos
// de ese bloque (nunca reenvia los ~21 valores juntos). Un parametro
// vacio en la hoja real se muestra vacio, nunca como 0 (mismo
// criterio ya aplicado en el Dashboard ampliado y en Viabilidad).
//
// Lectura: no hay endpoint de lectura nuevo (Diseno Tecnico Seccion
// 4.14: "la pantalla reutiliza la configuración ya cacheada por el
// resto de la aplicación") - se usa Api.obtenerConfiguracion(), la
// misma llamada que ya usan Diagnosticos y Repuestos.

const BLOQUES_CONFIGURACION = [
  {
    id: "compras",
    titulo: "Compras",
    campos: [
      { clave: "margen_minimo", etiqueta: "Margen mínimo exigido (%)" },
      { clave: "tarifa_mano_obra", etiqueta: "Tarifa de mano de obra (Gs./min)" },
      { clave: "dias_garantia_default", etiqueta: "Días de garantía por defecto" },
      { clave: "capital_disponible", etiqueta: "Capital disponible (Gs.)" },
      { clave: "capital_minimo_alerta", etiqueta: "Capital mínimo de alerta (Gs.)" },
    ],
  },
  {
    id: "viabilidad",
    titulo: "Viabilidad (PT-09)",
    esPesos: true,
    campos: [
      { clave: "peso_pantalla", etiqueta: "Peso: disponibilidad de pantalla" },
      { clave: "peso_bateria", etiqueta: "Peso: disponibilidad de batería" },
      { clave: "peso_carga", etiqueta: "Peso: disponibilidad de módulo de carga" },
      { clave: "peso_repuestos", etiqueta: "Peso: facilidad de repuestos" },
      { clave: "peso_demanda", etiqueta: "Peso: demanda de reventa" },
      { clave: "peso_antiguedad", etiqueta: "Peso: antigüedad del modelo" },
      { clave: "peso_rentabilidad", etiqueta: "Peso: rentabilidad esperada" },
    ],
  },
  {
    id: "sla",
    titulo: "SLA por estado (días objetivo antes de alertar)",
    campos: [
      { clave: "sla_detectado", etiqueta: "Detectado" },
      { clave: "sla_negociacion", etiqueta: "En negociación" },
      { clave: "sla_comprado", etiqueta: "Comprado" },
      { clave: "sla_recibido", etiqueta: "Recibido" },
      { clave: "sla_diagnostico", etiqueta: "En diagnóstico" },
      { clave: "sla_reparacion", etiqueta: "En reparación" },
      { clave: "sla_esperando_repuestos", etiqueta: "Esperando repuestos" },
      { clave: "sla_reparado", etiqueta: "Reparado" },
      { clave: "sla_pruebas", etiqueta: "En pruebas" },
    ],
  },
  {
    id: "alertas",
    titulo: "Alertas y retroalimentación",
    campos: [
      { clave: "umbral_tasa_falla", etiqueta: "Umbral de tasa de falla (%)" },
      { clave: "ventas_minimas_evaluacion", etiqueta: "Ventas mínimas para evaluar un modelo" },
      { clave: "stock_minimo_repuestos", etiqueta: "Stock mínimo de repuestos (unidades)" },
      { clave: "dias_alerta_garantia", etiqueta: "Alerta de garantía por vencer (días antes)" },
    ],
  },
];

let configuracionActual = {};

async function renderConfiguracion(contenedor) {
  contenedor.innerHTML = `<p>Cargando configuración...</p>`;

  try {
    configuracionActual = (await Api.obtenerConfiguracion()) || {};
    pintarConfiguracion(contenedor);
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar la configuración: ${err.message}</p>`;
  }
}

function pintarConfiguracion(contenedor) {
  contenedor.innerHTML = `
    <p><a href="#dashboard">&larr; Volver</a></p>
    <h2>Configuración</h2>
    <p>Cada bloque se guarda por separado y exige un comentario. Un campo vacío significa que todavía no fue cargado - no se sobreescribe con cero.</p>

    ${BLOQUES_CONFIGURACION.map((b) => `<section id="config-bloque-${b.id}" class="config-bloque"></section>`).join("")}
  `;

  BLOQUES_CONFIGURACION.forEach((bloque) => pintarBloqueConfiguracion(bloque));
}

function valorCampoConfiguracion(clave) {
  const valor = configuracionActual[clave];
  return valor === undefined || valor === null || valor === "" ? "" : valor;
}

function pintarBloqueConfiguracion(bloque) {
  const cont = document.getElementById(`config-bloque-${bloque.id}`);

  cont.innerHTML = `
    <h3>${bloque.titulo}</h3>
    ${bloque.campos
      .map(
        (campo) => `
      <div class="config-campo">
        <label for="config-${campo.clave}">${campo.etiqueta}</label>
        <input type="number" id="config-${campo.clave}" step="any" value="${valorCampoConfiguracion(campo.clave)}" />
      </div>
    `
      )
      .join("")}
    ${bloque.esPesos ? `<p class="config-suma-pesos" id="config-suma-${bloque.id}"></p>` : ""}

    <label for="config-comentario-${bloque.id}">Comentario (obligatorio)</label>
    <textarea id="config-comentario-${bloque.id}" rows="2"></textarea>

    <p class="modal-error" id="config-error-${bloque.id}" hidden></p>

    <div class="modal-botones">
      <button type="button" id="config-guardar-${bloque.id}">Guardar</button>
    </div>
  `;

  if (bloque.esPesos) {
    bloque.campos.forEach((campo) => {
      document.getElementById(`config-${campo.clave}`).addEventListener("input", () => actualizarSumaPesos(bloque));
    });
    actualizarSumaPesos(bloque);
  }

  document.getElementById(`config-guardar-${bloque.id}`).addEventListener("click", () => guardarBloqueConfiguracion(bloque));
}

// Indicador en vivo de la suma de los 7 pesos (Diseno Tecnico Seccion
// 5.6, aplicado tambien del lado servidor - este indicador es solo
// para que la persona no tenga que esperar el error del servidor).
function actualizarSumaPesos(bloque) {
  const el = document.getElementById(`config-suma-${bloque.id}`);
  const boton = document.getElementById(`config-guardar-${bloque.id}`);
  if (!el) return;

  const suma = bloque.campos.reduce((acc, campo) => {
    const valor = Number(document.getElementById(`config-${campo.clave}`).value);
    return acc + (isNaN(valor) ? 0 : valor);
  }, 0);

  const esExacto = suma === 100;
  el.textContent = `Suma actual de los 7 pesos: ${suma} ${esExacto ? "(correcto)" : "(debe ser exactamente 100)"}`;
  el.className = "config-suma-pesos " + (esExacto ? "ok" : "error");
  if (boton) boton.disabled = !esExacto;
}

async function guardarBloqueConfiguracion(bloque) {
  const boton = document.getElementById(`config-guardar-${bloque.id}`);
  if (boton.disabled) return;

  const errorEl = document.getElementById(`config-error-${bloque.id}`);
  errorEl.hidden = true;

  const comentario = document.getElementById(`config-comentario-${bloque.id}`).value.trim();
  if (!comentario) {
    errorEl.textContent = "El comentario es obligatorio.";
    errorEl.hidden = false;
    return;
  }

  const cambios = {};
  for (const campo of bloque.campos) {
    const valorCrudo = document.getElementById(`config-${campo.clave}`).value;
    if (valorCrudo === "") continue; // vacio: no se envia, no se pisa con 0
    const valor = Number(valorCrudo);
    if (isNaN(valor)) {
      errorEl.textContent = `El valor de "${campo.etiqueta}" no es un número válido.`;
      errorEl.hidden = false;
      return;
    }
    cambios[campo.clave] = valor;
  }

  if (Object.keys(cambios).length === 0) {
    errorEl.textContent = "No hay ningún valor cargado en este bloque para guardar.";
    errorEl.hidden = false;
    return;
  }

  const textoOriginal = boton.textContent;
  boton.disabled = true;
  boton.textContent = "Guardando...";

  try {
    await Api.actualizarConfiguracion(cambios, comentario);
    Object.assign(configuracionActual, cambios);
    mostrarMensajeConfiguracion(bloque.id, "Cambios guardados.");
    document.getElementById(`config-comentario-${bloque.id}`).value = "";
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
  } finally {
    boton.textContent = textoOriginal;
    boton.disabled = false;
    if (bloque.esPesos) actualizarSumaPesos(bloque);
  }
}

// Mismo patron ya en produccion que usuarios.js: sin sistema de
// toasts real todavia en la app, mensaje en linea con auto-dismiss.
function mostrarMensajeConfiguracion(bloqueId, texto) {
  const cont = document.getElementById(`config-bloque-${bloqueId}`);
  if (!cont) return;
  const aviso = document.createElement("p");
  aviso.textContent = texto;
  cont.appendChild(aviso);
  setTimeout(() => aviso.remove(), 4000);
}

Router.registrar("configuracion", renderConfiguracion);
