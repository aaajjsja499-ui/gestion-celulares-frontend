// GESTION_CELULARES - js/core/router.js
// Router minimo basado en el hash de la URL. Cada pantalla registra
// una funcion de render; el router solo decide cual mostrar.
// Soporta un parametro opcional despues de la ruta, formato
// "#ruta/parametro" (ej. "#ficha-equipo/EQ-001") - se lo pasa a la
// funcion de render como segundo argumento.
// Deliberadamente simple - no hay reactividad ni virtual DOM, es
// una SPA chica pensada para editarse a mano desde SPCK.

const Router = (() => {
  const rutas = {};
  const contenedorId = "app-contenido";

  function registrar(ruta, funcionRender) {
    rutas[ruta] = funcionRender;
  }

  function navegar(ruta, parametro) {
    window.location.hash = parametro ? `${ruta}/${parametro}` : ruta;
  }

  function render() {
    const hash = window.location.hash.replace("#", "") || "dashboard";
    const [ruta, parametro] = hash.split("/");
    const contenedor = document.getElementById(contenedorId);
    const funcionRender = rutas[ruta];

    if (!contenedor) return;

    if (!funcionRender) {
      contenedor.innerHTML = `<p>Pantalla "${ruta}" todavia no implementada.</p>`;
      return;
    }

    contenedor.innerHTML = "";
    funcionRender(contenedor, parametro);
  }

  function iniciar() {
    window.addEventListener("hashchange", render);
    render();
  }

  return { registrar, navegar, iniciar };
})();
