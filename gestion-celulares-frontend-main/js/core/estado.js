// GESTION_CELULARES - js/core/estado.js
// Estado global minimo de la aplicacion: quien esta logueado, que
// rol tiene activo, y si hay conexion. Sin frameworks - un objeto
// simple con un patron de suscripcion basico para que las pantallas
// se enteren de cambios.

const Estado = (() => {
  let datos = {
    usuario: null,        // { email, nombre, roles: [] } una vez logueado
    rolActivo: null,      // uno de usuario.roles
    online: navigator.onLine,
    cache: {
      equipos: [],
      modelos: [],
      ultimaActualizacion: null,
    },
  };

  const listeners = [];

  function get() {
    return datos;
  }

  function set(cambios) {
    datos = { ...datos, ...cambios };
    listeners.forEach((fn) => fn(datos));
  }

  function suscribir(fn) {
    listeners.push(fn);
    return () => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  window.addEventListener("online", () => set({ online: true }));
  window.addEventListener("offline", () => set({ online: false }));

  return { get, set, suscribir };
})();
