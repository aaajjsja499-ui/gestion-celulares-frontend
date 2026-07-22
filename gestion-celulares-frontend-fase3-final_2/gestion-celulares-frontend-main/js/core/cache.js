// GESTION_CELULARES - js/core/cache.js
// Cache local simple con localStorage, para lectura offline
// (Especificacion de Interfaz, modo offline - Fase 5, pero la
// estructura se deja lista desde Fase 0 para no reescribir despues).

const Cache = (() => {
  const PREFIJO = "gestion_celulares_";

  function guardar(clave, valor) {
    try {
      localStorage.setItem(PREFIJO + clave, JSON.stringify({
        valor,
        guardadoEn: new Date().toISOString(),
      }));
    } catch (err) {
      console.warn("No se pudo guardar en cache local:", err);
    }
  }

  function leer(clave) {
    try {
      const crudo = localStorage.getItem(PREFIJO + clave);
      if (!crudo) return null;
      return JSON.parse(crudo);
    } catch (err) {
      console.warn("No se pudo leer de cache local:", err);
      return null;
    }
  }

  return { guardar, leer };
})();
