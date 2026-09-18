// GESTION_CELULARES - js/calculos/alertas.js
// Motor de calculo del Panel ampliado del Dashboard (Fase 6, segunda
// pieza - Diseno Tecnico Secciones 4.5 a 4.9, Especificacion de
// Interfaz Seccion 4.1 v1.9). Mismo patron que viabilidad.js y
// rentabilidad.js: solo calculo, no llama a Api, no lee Estado, no
// escribe nada. Quien lo use (dashboard.js) le pasa los datos ya
// cargados.
//
// Elicitacion guiada de esta pieza (18 de Septiembre de 2026,
// decisiones de Pedro, ver Indice Maestro):
// - Capital de Trabajo (H-01) se construye aca, aunque estaba
//   documentado desde antes como parte del Dashboard base de Fase 1
//   (nunca se implemento - hueco declarado, no resuelto en silencio).
// - "Periodo" para tasaConversion (H-03) y rentabilidadGlobal (H-07)
//   es el mes calendario en curso (obtenerRangoMesActual).
// - Los umbrales configurables que hoy estan vacios en la hoja real
//   (Configuracion.capital_minimo_alerta, umbral_tasa_falla,
//   ventas_minimas_evaluacion) usan el mismo patron ya probado en
//   viabilidad.js: nunca se inventa un numero, se avisa en pantalla
//   que el valor todavia no fue cargado.

const Alertas = (() => {
  function valorVacio_(valor) {
    return valor === "" || valor === null || valor === undefined;
  }

  // --- H-02: Antiguedad de Inventario (Aging) ---
  // Mismo calculo de "dias en estado actual" que ya usa dashboard.js
  // para las alertas de SLA de Fase 1, pero con foco en Listo para
  // venta / Publicado (Especificacion de Interfaz, Dashboard y
  // Listado de Equipos), sin limite de SLA - es continuo.
  function calcularAging(equipos, historial) {
    const ultimaEntradaPorEquipo = {};
    historial.forEach((h) => {
      const fecha = new Date(h.fecha_hora);
      if (!ultimaEntradaPorEquipo[h.id_equipo] || fecha > ultimaEntradaPorEquipo[h.id_equipo]) {
        ultimaEntradaPorEquipo[h.id_equipo] = fecha;
      }
    });

    const ahora = new Date();

    return equipos
      .filter((e) => e.estado === "Listo para venta" || e.estado === "Publicado")
      .map((e) => {
        const fechaEntrada =
          ultimaEntradaPorEquipo[e.id_equipo] || (e.fecha_deteccion ? new Date(e.fecha_deteccion) : null);
        const dias =
          fechaEntrada && !isNaN(fechaEntrada.getTime())
            ? Math.floor((ahora - fechaEntrada) / (1000 * 60 * 60 * 24))
            : null;
        return { idEquipo: e.id_equipo, marca: e.marca, modelo: e.modelo, estado: e.estado, dias: dias };
      })
      .sort((a, b) => (b.dias === null ? -1 : b.dias) - (a.dias === null ? -1 : a.dias));
  }

  // --- H-01: Capital de Trabajo ---
  // "Comprado hasta antes de Vendido, inclusive Publicado y
  // Reservado" (Diseno Tecnico Seccion 4.5), contra la lista
  // completa de 18 estados de Fundamentos Seccion 3.1.
  const ESTADOS_CAPITAL_INMOVILIZADO = [
    "Comprado",
    "Recibido",
    "En diagnóstico",
    "En reparación",
    "Esperando repuestos",
    "Reparado",
    "En pruebas",
    "Listo para venta",
    "Publicado",
    "Reservado",
  ];

  function calcularCapitalDeTrabajo(equipos, configuracion) {
    const capitalInmovilizado = equipos
      .filter((e) => ESTADOS_CAPITAL_INMOVILIZADO.indexOf(e.estado) >= 0)
      .reduce((acc, e) => acc + Number(e.precio_compra || 0) + Number(e.costo_reparacion_total || 0), 0);

    const capitalDisponibleConfigurado = !valorVacio_(configuracion.capital_disponible);
    const capitalDisponible = capitalDisponibleConfigurado ? Number(configuracion.capital_disponible) : 0;
    const capitalLibre = capitalDisponible - capitalInmovilizado;

    const umbralConfigurado = !valorVacio_(configuracion.capital_minimo_alerta);
    const umbral = umbralConfigurado ? Number(configuracion.capital_minimo_alerta) : null;

    // Mientras capital_disponible no este configurado, no hay nada
    // que alertar todavia (no hay base contra la cual medir el
    // capital libre). Con capital_disponible cargado pero sin
    // capital_minimo_alerta, se avisa igual por debajo de cero -
    // ese umbral no depende de ninguna configuracion adicional.
    const alerta =
      capitalDisponibleConfigurado && (capitalLibre < 0 || (umbralConfigurado && capitalLibre < umbral));

    return {
      capitalInmovilizado: capitalInmovilizado,
      capitalDisponibleConfigurado: capitalDisponibleConfigurado,
      capitalDisponible: capitalDisponible,
      capitalLibre: capitalLibre,
      umbralConfigurado: umbralConfigurado,
      umbral: umbral,
      alerta: alerta,
    };
  }

  // --- Periodo comun a H-03 y H-07: mes calendario en curso ---
  function obtenerRangoMesActual(ahora) {
    const ref = ahora || new Date();
    const inicio = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
    return { inicio: inicio, fin: ref };
  }

  // --- H-03: Tasa de Conversion por Etapa ---
  // Formula literal de Diseno Tecnico Seccion 4.7: dos conteos
  // independientes en el mismo periodo, no una cohorte estricta (un
  // equipo puede haber alcanzado EstadoB este mes habiendo pasado
  // por EstadoA en un mes anterior). Por eso se devuelven tambien
  // los dos conteos crudos, para que la pantalla nunca muestre un
  // porcentaje sin el contexto de cuantos equipos hay detras.
  function calcularTasaConversion(historial, estadoA, estadoB, rango) {
    const idsPasaronPorA = new Set();
    const idsLlegaronAB = new Set();

    historial.forEach((h) => {
      const fecha = new Date(h.fecha_hora);
      if (fecha < rango.inicio || fecha > rango.fin) return;
      if (h.estado_nuevo === estadoA) idsPasaronPorA.add(h.id_equipo);
      if (h.estado_nuevo === estadoB) idsLlegaronAB.add(h.id_equipo);
    });

    const cantidadA = idsPasaronPorA.size;
    const cantidadB = idsLlegaronAB.size;

    return {
      estadoA: estadoA,
      estadoB: estadoB,
      cantidadA: cantidadA,
      cantidadB: cantidadB,
      tasa: cantidadA > 0 ? (cantidadB / cantidadA) * 100 : null,
    };
  }

  // --- H-07: Rentabilidad Global del Negocio ---
  // gananciaNeta por venta = precioVenta - (precioCompra +
  // costoReparacionTotal) - mismo criterio ya verificado en
  // produccion para PT-08 (Indice Maestro v3.12: costo_reparacion_
  // total ya bundlea repuestos + mano de obra, ver Diseno Tecnico
  // Seccion 3.1). Una venta cuyo equipo ya no se encuentra en la
  // hoja Equipos (dato inconsistente) se excluye del calculo en vez
  // de inventarle un costo de cero.
  function calcularRentabilidadGlobal(ventas, equipos, gastosOperativos, rango) {
    const equipoPorId = {};
    equipos.forEach((e) => {
      equipoPorId[e.id_equipo] = e;
    });

    const ventasDelPeriodo = ventas.filter((v) => {
      const fecha = new Date(v.fecha_venta);
      return fecha >= rango.inicio && fecha <= rango.fin;
    });

    let ventasConsideradas = 0;
    const gananciaPorEquipos = ventasDelPeriodo.reduce((acc, v) => {
      const equipo = equipoPorId[v.id_equipo];
      if (!equipo) return acc;
      ventasConsideradas++;
      const costoTotal = Number(equipo.precio_compra || 0) + Number(equipo.costo_reparacion_total || 0);
      return acc + (Number(v.precio_venta || 0) - costoTotal);
    }, 0);

    const gastosDelPeriodo = gastosOperativos
      .filter((g) => {
        const fecha = new Date(g.fecha);
        return fecha >= rango.inicio && fecha <= rango.fin;
      })
      .reduce((acc, g) => acc + Number(g.monto || 0), 0);

    return {
      cantidadVentas: ventasDelPeriodo.length,
      ventasConsideradas: ventasConsideradas,
      gananciaPorEquipos: gananciaPorEquipos,
      gastosOperativos: gastosDelPeriodo,
      rentabilidadGlobal: gananciaPorEquipos - gastosDelPeriodo,
    };
  }

  // --- H-05: Retroalimentacion al Catalogo, para el Dashboard ---
  // Mismo calculo por modelo (tasaFalla, rentabilidadReal) que ya
  // usa catalogo.js de forma local a esa pantalla - se reimplementa
  // aca en vez de importar esa funcion porque catalogo.js no expone
  // sus funciones internas a otras pantallas todavia (deuda tecnica
  // menor, declarada, no resuelta en silencio: ambas pantallas
  // calculan lo mismo con la misma formula, duplicado en dos
  // archivos en vez de compartido desde aca - candidato a unificar
  // en una proxima pieza sin apuro, catalogo.js ya esta cerrado y no
  // se toca en esta entrega).
  const ITEMS_DIAGNOSTICO_ALERTAS = [
    "pantalla",
    "tactil",
    "bateria",
    "camara_trasera",
    "camara_frontal",
    "altavoz",
    "microfono",
    "puerto_carga",
    "botones",
    "huella_faceid",
    "wifi",
    "bluetooth",
    "red_movil",
  ];

  function listarAlertasCatalogo(modelos, equipos, diagnosticos, configuracion) {
    const umbralesConfigurados =
      !valorVacio_(configuracion.umbral_tasa_falla) && !valorVacio_(configuracion.ventas_minimas_evaluacion);

    if (!umbralesConfigurados) {
      return { umbralesConfigurados: false, sinDatos: false, alertas: [] };
    }

    const umbralTasaFalla = Number(configuracion.umbral_tasa_falla);
    const ventasMinimas = Number(configuracion.ventas_minimas_evaluacion);
    const margenMinimo = Number(configuracion.margen_minimo || 0);

    const alertas = modelos
      .filter((m) => m.estado_comercial !== "No comprar")
      .map((m) => {
        const idsDelModelo = new Set(
          equipos.filter((e) => e.marca === m.marca && e.modelo === m.modelo).map((e) => e.id_equipo)
        );
        const diagsDelModelo = diagnosticos.filter((d) => idsDelModelo.has(d.id_equipo));

        let tasaFalla = null;
        if (diagsDelModelo.length) {
          const conFallo = diagsDelModelo.filter((d) =>
            ITEMS_DIAGNOSTICO_ALERTAS.some((item) => d[item] === "Fallado")
          );
          tasaFalla = (conFallo.length / diagsDelModelo.length) * 100;
        }

        const ventasConCosto = equipos.filter(
          (e) => e.marca === m.marca && e.modelo === m.modelo && e.precio_venta && e.precio_compra
        );
        let rentabilidadReal = null;
        if (ventasConCosto.length) {
          const suma = ventasConCosto.reduce((acc, e) => {
            const costoTotal = Number(e.precio_compra || 0) + Number(e.costo_reparacion_total || 0);
            return acc + ((e.precio_venta - costoTotal) / e.precio_venta) * 100;
          }, 0);
          rentabilidadReal = suma / ventasConCosto.length;
        }

        const motivos = [];
        if (tasaFalla !== null && tasaFalla > umbralTasaFalla) {
          motivos.push("tasa de falla " + tasaFalla.toFixed(1) + "% (umbral " + umbralTasaFalla + "%)");
        }
        if (
          rentabilidadReal !== null &&
          ventasConCosto.length >= ventasMinimas &&
          rentabilidadReal < margenMinimo
        ) {
          motivos.push("rentabilidad real " + rentabilidadReal.toFixed(1) + "% (mínimo " + margenMinimo + "%)");
        }

        return motivos.length ? { marca: m.marca, modelo: m.modelo, motivos: motivos } : null;
      })
      .filter(Boolean);

    return { umbralesConfigurados: true, sinDatos: false, alertas: alertas };
  }

  return {
    ESTADOS_CAPITAL_INMOVILIZADO: ESTADOS_CAPITAL_INMOVILIZADO,
    calcularAging: calcularAging,
    calcularCapitalDeTrabajo: calcularCapitalDeTrabajo,
    obtenerRangoMesActual: obtenerRangoMesActual,
    calcularTasaConversion: calcularTasaConversion,
    calcularRentabilidadGlobal: calcularRentabilidadGlobal,
    listarAlertasCatalogo: listarAlertasCatalogo,
  };
})();
