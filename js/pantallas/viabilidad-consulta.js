// GESTION_CELULARES - js/pantallas/viabilidad-consulta.js
// Consulta de Viabilidad (Especificacion de Interfaz Seccion 4.11,
// PT-09). Pantalla propia e independiente del Listado de Equipos
// (decision D-PT09-02 de la Propuesta PT-09) - responde si conviene
// comprar un modelo antes de tener el equipo en mano y antes de crear
// cualquier registro en Equipos.
//
// Consulta pura: solo lee Modelos (via Api.obtenerEquiposYModelos,
// igual que Catalogo) y Configuracion. No escribe nada.
//
// Reutiliza el mismo mecanismo de alta que ya existe en otras
// pantallas en vez de crear uno nuevo (metodologia del proyecto):
// "Registrar equipo de este modelo" reabre el modal de
// abrirModalNuevoEquipo de dashboard.js con marca/modelo
// precargados; "Agregar modelo al catalogo" reabre el modal de
// abrirModalModelo de catalogo.js. El Router solo soporta un
// parametro despues de la ruta (router.js), asi que marca y modelo
// viajan codificados juntos como "marca|modelo" (ver
// codificarParametroViabilidad).
//
// Backlog item 19 (Indice Maestro v3.29): "Agregar modelo al
// catalogo" no tenia con que modelo prellenar el alta, porque el
// texto que el usuario escribio en el buscador no calzo con ningun
// modelo existente (a diferencia de "Registrar equipo de este
// modelo", que parte de un modelo ya encontrado en viabilidadEstado).
// Se resuelve partiendo el texto libre del buscador en la primera
// palabra (marca) y el resto (modelo) - mismo criterio implicito que
// ya usa el placeholder del buscador ("Marca y modelo (ej. Samsung
// A14)") y que la propia pantalla usa al mostrar "marca modelo" con
// un espacio. Los campos quedan editables en el modal de Catalogo,
// asi que un corte imperfecto (marca con mas de una palabra) lo
// corrige el usuario ahi mismo antes de guardar.

let viabilidadEstado = { modelos: [], configuracion: null, seleccionado: null };

async function renderViabilidadConsulta(contenedor, parametroRuta) {
  contenedor.innerHTML = `<p>Cargando viabilidad...</p>`;

  try {
    const [equiposYModelos, configuracion] = await Promise.all([
      Api.obtenerEquiposYModelos(),
      Api.obtenerConfiguracion(),
    ]);
    viabilidadEstado.modelos = equiposYModelos.modelos || [];
    viabilidadEstado.configuracion = configuracion;
    viabilidadEstado.seleccionado = null;

    pintarViabilidad(contenedor);

    if (parametroRuta) {
      const [marcaPre, modeloPre] = parametroRuta.split("|").map((valor) => decodeURIComponent(valor || ""));
      const texto = [marcaPre, modeloPre].filter(Boolean).join(" ").trim();
      if (texto) {
        document.getElementById("viabilidad-buscador").value = texto;
        buscarModeloViabilidad(texto);
      }
    }
  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p>Error al cargar viabilidad: ${err.message}</p>`;
  }
}

function pintarViabilidad(contenedor) {
  contenedor.innerHTML = `
    <p><a href="#dashboard">&larr; Volver</a></p>
    <h2>Consulta de Viabilidad</h2>
    <p>Buscá un modelo para saber si conviene comprarlo, antes de tener el equipo en mano.</p>

    <input type="text" id="viabilidad-buscador" placeholder="Marca y modelo (ej. Samsung A14)..." autocomplete="off" />
    <div id="viabilidad-sugerencias"></div>
    <div id="viabilidad-resultado"></div>
  `;

  document.getElementById("viabilidad-buscador").addEventListener("input", (ev) => {
    buscarModeloViabilidad(ev.target.value);
  });
}

function buscarModeloViabilidad(texto) {
  const contenedorSugerencias = document.getElementById("viabilidad-sugerencias");
  const contenedorResultado = document.getElementById("viabilidad-resultado");
  const textoNormalizado = (texto || "").trim().toLowerCase();

  if (!textoNormalizado) {
    contenedorSugerencias.innerHTML = "";
    contenedorResultado.innerHTML = "";
    viabilidadEstado.seleccionado = null;
    return;
  }

  const yaSeleccionado =
    viabilidadEstado.seleccionado &&
    `${viabilidadEstado.seleccionado.marca} ${viabilidadEstado.seleccionado.modelo}`.toLowerCase() === textoNormalizado;
  if (yaSeleccionado) {
    contenedorSugerencias.innerHTML = "";
    return;
  }

  const coincidencias = viabilidadEstado.modelos.filter((m) =>
    `${m.marca} ${m.modelo}`.toLowerCase().includes(textoNormalizado)
  );

  contenedorResultado.innerHTML = "";
  viabilidadEstado.seleccionado = null;

  if (!coincidencias.length) {
    contenedorSugerencias.innerHTML = "";
    pintarModeloNoEncontrado(texto);
    return;
  }

  contenedorSugerencias.innerHTML = `
    <ul class="viabilidad-lista-sugerencias">
      ${coincidencias
        .slice(0, 8)
        .map(
          (m) =>
            `<li data-marca="${escaparAtributoViabilidad(m.marca)}" data-modelo="${escaparAtributoViabilidad(m.modelo)}">${m.marca} ${m.modelo}</li>`
        )
        .join("")}
    </ul>
  `;

  contenedorSugerencias.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      const marca = li.getAttribute("data-marca");
      const modelo = li.getAttribute("data-modelo");
      const modeloEncontrado = viabilidadEstado.modelos.find((m) => m.marca === marca && m.modelo === modelo);
      document.getElementById("viabilidad-buscador").value = `${marca} ${modelo}`;
      contenedorSugerencias.innerHTML = "";
      viabilidadEstado.seleccionado = modeloEncontrado;
      pintarResultadoViabilidad(modeloEncontrado);
    });
  });
}

function pintarModeloNoEncontrado(texto) {
  const contenedorResultado = document.getElementById("viabilidad-resultado");
  contenedorResultado.innerHTML = `
    <p>Este modelo no está cargado todavía.</p>
    <button id="viabilidad-agregar-modelo">Agregar modelo al catálogo</button>
  `;
  document.getElementById("viabilidad-agregar-modelo").addEventListener("click", () => {
    const textoLimpio = (texto || "").trim();
    const indiceEspacio = textoLimpio.indexOf(" ");
    const marcaPre = indiceEspacio === -1 ? textoLimpio : textoLimpio.slice(0, indiceEspacio);
    const modeloPre = indiceEspacio === -1 ? "" : textoLimpio.slice(indiceEspacio + 1).trim();
    Router.navegar("catalogo", codificarParametroViabilidad(marcaPre, modeloPre));
  });
}

function pintarResultadoViabilidad(modelo) {
  const contenedorResultado = document.getElementById("viabilidad-resultado");
  const resultado = Viabilidad.evaluarModelo(modelo, viabilidadEstado.configuracion);

  const botonRegistrarEquipoHtml = `<p><button id="viabilidad-registrar-equipo">Registrar equipo de este modelo</button></p>`;

  if (resultado.noComprarDirecto) {
    contenedorResultado.innerHTML = `
      <div class="viabilidad-semaforo viabilidad-no-viable">
        <p class="viabilidad-recomendacion">No comprar</p>
        <p>Este modelo ya está marcado así en el Catálogo (estado comercial).</p>
      </div>
      ${botonRegistrarEquipoHtml}
    `;
    enlazarBotonRegistrarEquipo(modelo);
    return;
  }

  if (resultado.error === "pesos_incompletos") {
    contenedorResultado.innerHTML = `
      <p class="modal-error">
        No se puede calcular el riesgo todavía: faltan pesos por cargar
        en Configuración (${resultado.pesosFaltantes.join(", ")}).
        Avisale al Administrador para que los complete - los 7 pesos
        deben sumar 100.
      </p>
      ${botonRegistrarEquipoHtml}
    `;
    enlazarBotonRegistrarEquipo(modelo);
    return;
  }

  if (resultado.error === "pesos_no_suman_100") {
    contenedorResultado.innerHTML = `
      <p class="modal-error">
        Los pesos de Viabilidad en Configuración no suman 100 (suman
        ${resultado.sumaPesos}). Avisale al Administrador antes de
        confiar en este cálculo.
      </p>
      ${botonRegistrarEquipoHtml}
    `;
    enlazarBotonRegistrarEquipo(modelo);
    return;
  }

  if (resultado.error === "sin_datos_modelo") {
    contenedorResultado.innerHTML = `
      <p class="modal-error">
        Este modelo todavía no tiene ningún dato de Viabilidad cargado
        en el Catálogo (disponibilidad de pantalla/batería/carga,
        facilidad de repuestos, demanda, año, rentabilidad esperada).
        Completá su ficha en el Catálogo para poder calcular el riesgo.
      </p>
      ${botonRegistrarEquipoHtml}
    `;
    enlazarBotonRegistrarEquipo(modelo);
    return;
  }

  const claseSemaforo =
    resultado.recomendacion === "Viable"
      ? "viabilidad-viable"
      : resultado.recomendacion === "Viable con precaución"
      ? "viabilidad-precaucion"
      : "viabilidad-no-viable";

  contenedorResultado.innerHTML = `
    <div class="viabilidad-semaforo ${claseSemaforo}">
      <p class="viabilidad-recomendacion">${resultado.recomendacion}</p>
      <p class="viabilidad-porcentaje">${resultado.riesgoTotal.toFixed(1)}% de riesgo</p>
    </div>
    ${
      resultado.criteriosFaltantes.length
        ? `<p class="modal-error">Sin dato cargado para: ${resultado.criteriosFaltantes.join(", ")} (se calculó asumiendo el mejor caso en esos criterios).</p>`
        : ""
    }
    <details>
      <summary>Ver detalle de los 7 criterios</summary>
      <table class="tabla-simple">
        <thead>
          <tr><th>Criterio</th><th>Dato</th><th>Peso</th><th>Valor de riesgo</th></tr>
        </thead>
        <tbody>
          ${resultado.detalle
            .map(
              (d) =>
                `<tr><td>${d.criterio}</td><td>${d.dato ?? "-"}</td><td>${d.peso}</td><td>${d.valor === null ? "-" : d.valor}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </details>
    ${botonRegistrarEquipoHtml}
  `;

  enlazarBotonRegistrarEquipo(modelo);
}

function enlazarBotonRegistrarEquipo(modelo) {
  const boton = document.getElementById("viabilidad-registrar-equipo");
  if (!boton) return;
  boton.addEventListener("click", () => {
    Router.navegar("dashboard", codificarParametroViabilidad(modelo.marca, modelo.modelo));
  });
}

function codificarParametroViabilidad(marca, modelo) {
  return `${encodeURIComponent(marca || "")}|${encodeURIComponent(modelo || "")}`;
}

function escaparAtributoViabilidad(valor) {
  return String(valor || "").replace(/"/g, "&quot;");
}

Router.registrar("viabilidad-consulta", renderViabilidadConsulta);
