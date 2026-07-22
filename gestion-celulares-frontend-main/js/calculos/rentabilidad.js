// GESTION_CELULARES - js/calculos/rentabilidad.js
// Rentabilidad Real (PT-08, Diseno Tecnico Seccion 4.3), Fase 3
// Pieza 3.
//
// gananciaNeta = precioVenta - (precioCompra + costoReparacionTotal + otrosGastos)
// margen = (gananciaNeta / precioVenta) * 100
//
// otrosGastos de la formula del Diseno Tecnico no tiene fuente de
// datos por equipo individual todavia (la hoja Gastos_Operativos es
// a nivel negocio completo, para H-07 - ver Diseno Tecnico 3.15 y
// 4.9). Se recibe como parametro con default 0 en vez de asumirlo en
// silencio, para que quede explicito en el punto donde se llama y no
// escondido dentro de la formula. Igual que Valoracion, este modulo
// no lee ni escribe nada - recibe valores ya resueltos.

const Rentabilidad = (() => {
  function calcularRentabilidadReal({
    precioVenta,
    precioCompra,
    costoReparacionTotal,
    otrosGastos = 0,
  }) {
    const precioVentaNum = Number(precioVenta) || 0;
    const precioCompraNum = Number(precioCompra) || 0;
    const costoReparacionNum = Number(costoReparacionTotal) || 0;
    const otrosGastosNum = Number(otrosGastos) || 0;

    const costoTotal = precioCompraNum + costoReparacionNum + otrosGastosNum;
    const gananciaNeta = precioVentaNum - costoTotal;
    // Sin equipo vendido (precioVenta = 0) el margen no tiene
    // sentido matematico - se devuelve null, no 0 o Infinity, para
    // que la pantalla lo distinga de un margen real de 0%.
    const margen = precioVentaNum > 0 ? (gananciaNeta / precioVentaNum) * 100 : null;

    return {
      precioCompra: precioCompraNum,
      costoReparacionTotal: costoReparacionNum,
      otrosGastos: otrosGastosNum,
      costoTotal,
      // Sin redondear a 0: una ganancia negativa es informacion real
      // (esa venta dio perdida), no un error a esconder - mismo
      // criterio que Valoracion.calcularPrecioMaximoCompra.
      gananciaNeta,
      margen,
    };
  }

  return { calcularRentabilidadReal };
})();
