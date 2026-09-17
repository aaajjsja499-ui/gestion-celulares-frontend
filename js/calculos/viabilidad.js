// GESTION_CELULARES - js/calculos/viabilidad.js
// Motor de Viabilidad y Riesgo de Compra por Modelo (PT-09, Propuesta
// PT-09 DOC-009, Diseno Tecnico Seccion 4.2). Separado de la pantalla
// (viabilidad-consulta.js) para que cualquier otra pantalla lo pueda
// reutilizar sin duplicar la formula (ej. Ficha de Equipo, mas
// adelante), mismo patron que valoracion.js y rentabilidad.js.
//
// Es un motor de solo calculo: no llama a Api, no lee Estado, no
// escribe nada. Recibe el modelo y la configuracion ya cargados por
// quien lo use.

const Viabilidad = (() => {
  // Disponible/Facil/Alta = 0, intermedio = 50, Descontinuado/
  // Dificil/Baja = 100 (Propuesta PT-09). Devuelve null si el dato
  // todavia no esta cargado en el modelo, para que quien llame decida
  // como mostrarlo - nunca se inventa un valor.
  function valorDisponibilidad(valor) {
    if (valor === "Disponible") return 0;
    if (valor === "Escasa") return 50;
    if (valor === "Descontinuada" || valor === "Descontinuado") return 100;
    return null;
  }

  function valorFacilidadRepuestos(valor) {
    if (valor === "Fácil" || valor === "Facil") return 0;
    if (valor === "Media") return 50;
    if (valor === "Difícil" || valor === "Dificil") return 100;
    return null;
  }

  function valorDemanda(valor) {
    if (valor === "Alta") return 0;
    if (valor === "Media") return 50;
    if (valor === "Baja") return 100;
    return null;
  }

  // 0-2 anios = 0, 3-4 anios = 50, mas de 4 anios = 100 (Propuesta
  // PT-09). anioModelo es el campo Modelos.año.
  function valorAntiguedad(anioModelo) {
    if (!anioModelo) return null;
    const anioActual = new Date().getFullYear();
    const antiguedad = anioActual - Number(anioModelo);
    if (antiguedad <= 2) return 0;
    if (antiguedad <= 4) return 50;
    return 100;
  }

  // Igual o por encima del margen minimo = 0, dentro de 5 puntos por
  // debajo = 50, mas de 5 puntos por debajo = 100 (Propuesta PT-09).
  function valorRentabilidad(rentabilidadEsperada, margenMinimo) {
    if (rentabilidadEsperada === undefined || rentabilidadEsperada === null || rentabilidadEsperada === "") return null;
    if (margenMinimo === undefined || margenMinimo === null || margenMinimo === "") return null;
    const rentabilidad = Number(rentabilidadEsperada);
    const margen = Number(margenMinimo);
    if (rentabilidad >= margen) return 0;
    if (rentabilidad >= margen - 5) return 50;
    return 100;
  }

  // Calcula riesgoTotal (Diseno Tecnico Seccion 4.2). Antes de
  // calcular nada, valida que los 7 pesos de Configuracion existan y
  // sumen 100 (regla de Diseno Tecnico Seccion 3.11 y validacion de
  // Seccion 5.6) - sin esto, un numero de riesgo seria una respuesta
  // falsa, no una degradacion aceptable (a diferencia de un criterio
  // individual sin dato, que si se puede asumir en el mejor caso y
  // declarar explicitamente, ver criteriosFaltantes mas abajo).
  function calcularRiesgo(modelo, configuracion) {
    const pesosCrudos = {
      pantalla: configuracion.peso_pantalla,
      bateria: configuracion.peso_bateria,
      carga: configuracion.peso_carga,
      repuestos: configuracion.peso_repuestos,
      demanda: configuracion.peso_demanda,
      antiguedad: configuracion.peso_antiguedad,
      rentabilidad: configuracion.peso_rentabilidad,
    };

    // Se distingue "todavia no se cargo" (celda vacia en Configuracion,
    // el caso real mas probable) de "se cargo algo invalido", para que
    // el mensaje en pantalla sea preciso en vez de decir simplemente
    // "no suman 100" cuando en realidad nunca se cargaron.
    const pesosFaltantes = Object.entries(pesosCrudos)
      .filter(([, valor]) => valor === "" || valor === null || valor === undefined)
      .map(([clave]) => clave);
    if (pesosFaltantes.length) {
      return { error: "pesos_incompletos", pesosFaltantes };
    }

    const pesos = {};
    Object.keys(pesosCrudos).forEach((clave) => { pesos[clave] = Number(pesosCrudos[clave]); });

    const pesosInvalidos = Object.entries(pesos)
      .filter(([, valor]) => !Number.isFinite(valor))
      .map(([clave]) => clave);
    if (pesosInvalidos.length) {
      return { error: "pesos_incompletos", pesosFaltantes: pesosInvalidos };
    }

    const sumaPesos = Object.values(pesos).reduce((acumulado, valor) => acumulado + valor, 0);
    if (Math.round(sumaPesos) !== 100) {
      return { error: "pesos_no_suman_100", sumaPesos };
    }

    const valores = {
      pantalla: valorDisponibilidad(modelo.disponibilidad_pantalla),
      bateria: valorDisponibilidad(modelo.disponibilidad_bateria),
      carga: valorDisponibilidad(modelo.disponibilidad_modulo_carga),
      repuestos: valorFacilidadRepuestos(modelo.facilidad_repuestos),
      demanda: valorDemanda(modelo.demanda),
      antiguedad: valorAntiguedad(modelo.año),
      rentabilidad: valorRentabilidad(modelo.rentabilidad_esperada, configuracion.margen_minimo),
    };

    const criteriosFaltantes = Object.entries(valores)
      .filter(([, valor]) => valor === null)
      .map(([clave]) => clave);

    // Si el modelo no tiene NINGUN dato de PT-09 cargado todavia (caso
    // tipico: modelo recien agregado al catalogo antes de completar su
    // ficha), mostrar "Viable 0%" seria una respuesta falsa, no una
    // degradacion aceptable - a diferencia de que falte uno o dos
    // criterios sueltos. Se avisa en cambio que faltan datos, sin
    // numero.
    if (criteriosFaltantes.length === Object.keys(valores).length) {
      return { error: "sin_datos_modelo" };
    }

    // Con uno o varios criterios sueltos sin dato cargado (no todos),
    // se calcula igual
    // asumiendo el mejor caso (0) para no bloquear la consulta, pero
    // se informa cuales criterios faltan - nunca en silencio
    // (metodologia del proyecto: brechas declaradas explicitamente).
    const valoresParaCalculo = {};
    Object.keys(valores).forEach((clave) => {
      valoresParaCalculo[clave] = valores[clave] === null ? 0 : valores[clave];
    });

    const riesgoTotal =
      (pesos.pantalla * valoresParaCalculo.pantalla +
        pesos.bateria * valoresParaCalculo.bateria +
        pesos.carga * valoresParaCalculo.carga +
        pesos.repuestos * valoresParaCalculo.repuestos +
        pesos.demanda * valoresParaCalculo.demanda +
        pesos.antiguedad * valoresParaCalculo.antiguedad +
        pesos.rentabilidad * valoresParaCalculo.rentabilidad) /
      100;

    let recomendacion;
    if (riesgoTotal <= 30) recomendacion = "Viable";
    else if (riesgoTotal <= 60) recomendacion = "Viable con precaución";
    else recomendacion = "No viable";

    const detalle = [
      { criterio: "Disponibilidad de pantalla", peso: pesos.pantalla, valor: valores.pantalla, dato: modelo.disponibilidad_pantalla },
      { criterio: "Disponibilidad de batería", peso: pesos.bateria, valor: valores.bateria, dato: modelo.disponibilidad_bateria },
      { criterio: "Disponibilidad de módulo de carga", peso: pesos.carga, valor: valores.carga, dato: modelo.disponibilidad_modulo_carga },
      { criterio: "Facilidad de repuestos", peso: pesos.repuestos, valor: valores.repuestos, dato: modelo.facilidad_repuestos },
      { criterio: "Demanda de reventa", peso: pesos.demanda, valor: valores.demanda, dato: modelo.demanda },
      { criterio: "Antigüedad del modelo", peso: pesos.antiguedad, valor: valores.antiguedad, dato: modelo.año },
      { criterio: "Rentabilidad esperada vs margen mínimo", peso: pesos.rentabilidad, valor: valores.rentabilidad, dato: modelo.rentabilidad_esperada },
    ].sort((a, b) => b.peso * (b.valor || 0) - a.peso * (a.valor || 0));

    return { riesgoTotal, recomendacion, criteriosFaltantes, detalle };
  }

  // Punto de entrada para la pantalla: aplica la regla de "No
  // comprar" directo (D-PT09-03 / Propuesta PT-09) antes de calcular
  // nada.
  function evaluarModelo(modelo, configuracion) {
    if (!modelo) return null;
    if (modelo.estado_comercial === "No comprar") {
      return { noComprarDirecto: true };
    }
    return calcularRiesgo(modelo, configuracion);
  }

  return {
    valorDisponibilidad,
    valorFacilidadRepuestos,
    valorDemanda,
    valorAntiguedad,
    valorRentabilidad,
    calcularRiesgo,
    evaluarModelo,
  };
})();
