// GESTION_CELULARES - js/calculos/valoracion.js
// Motor de Valoracion de Compra (PT-04, Diseno Tecnico Seccion 4.1).
//
// precioMaximoCompra = valorMercado - costoReparaciones - (valorMercado * margenMinimo)
// costoReparaciones = costoEstimadoRepuestos + (minutosEstimados * tarifaManoObra)
//
// Fase 2 (decision de Pedro, Diseno Tecnico v1.7): costo de
// repuestos y minutos de reparacion se ingresan a mano en el
// formulario de diagnostico, no se seleccionan del catalogo de
// Repuestos. Este modulo no lee ni escribe nada - recibe los
// valores ya resueltos y devuelve el calculo, para que cualquier
// pantalla (Diagnostico, Ficha de Equipo) lo reutilice sin duplicar
// la formula.

const Valoracion = (() => {
  function calcularPrecioMaximoCompra({
    valorMercado,
    costoEstimadoRepuestos,
    minutosEstimados,
    tarifaManoObra,
    margenMinimoPorcentaje,
  }) {
    const valorMercadoNum = Number(valorMercado) || 0;
    const costoRepuestosNum = Number(costoEstimadoRepuestos) || 0;
    const minutosNum = Number(minutosEstimados) || 0;
    const tarifaNum = Number(tarifaManoObra) || 0;
    const margenNum = Number(margenMinimoPorcentaje) || 0;

    const costoManoObra = minutosNum * tarifaNum;
    const costoReparaciones = costoRepuestosNum + costoManoObra;
    const margen = valorMercadoNum * (margenNum / 100);
    const precioMaximoCompra = valorMercadoNum - costoReparaciones - margen;

    return {
      valorMercado: valorMercadoNum,
      costoManoObra,
      costoReparaciones,
      margen,
      // Sin redondear a 0: un resultado negativo es información
      // real (no conviene comprar a ningún precio con esos
      // costos), no un error a esconder. La pantalla decide cómo
      // mostrarlo.
      precioMaximoCompra: Math.round(precioMaximoCompra),
    };
  }

  return { calcularPrecioMaximoCompra };
})();
