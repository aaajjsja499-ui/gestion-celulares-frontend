// GESTION_CELULARES - js/utils.js
// Utilidades compartidas (formateo de PYG, fechas, etc.). Se va
// llenando a medida que las pantallas lo necesiten.

function formatearPYG(numero) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(numero || 0);
}
