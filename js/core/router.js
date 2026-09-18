// GESTION_CELULARES - js/core/router.js
// Router minimo basado en el hash de la URL. Cada pantalla registra
// una funcion de render; el router solo decide cual mostrar.
// Soporta un parametro opcional despues de la ruta, formato
// "#ruta/parametro" (ej. "#ficha-equipo/EQ-001") - se lo pasa a la
// funcion de render como segundo argumento.
// Deliberadamente simple - no hay reactividad ni virtual DOM, es
// una SPA chica pensada para editarse a mano desde SPCK.
//
// Fase 8, primera pieza (Alertas completas - Especificacion de
// Interfaz Seccion 3.3, Diseno Tecnico Seccion 4.4 v2.2): se agrega
// actualizarContadorAlertas_(), llamada al final de cada render().
// Autocritica de frontera, senalada explicitamente: por
// responsabilidad (Diseno Tecnico Seccion 7.3), router.js deberia
// limitarse a navegar, sin llamar a Api. Se elige igual este punto
// porque es el unico lugar por el que pasa toda navegacion, y la
// decision de Pedro al elicitar esta pieza fue justamente que cada
// pantalla pida el resumen de alertas al entrar, sin duplicar la
// llamada en cada uno de los archivos de pantallas/. No bloqueante:
// si falla (sin conexion, backend caido), el badge no se actualiza y
// la navegacion sigue normal.

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
      contenedor.innerHTML = `<p>Pantalla "${ruta}" todavia no implementada.</p><p><a href="#dashboard">&larr; Volver al Dashboard</a></p>`;
      actualizarContadorAlertas_();
      return;
    }

    contenedor.innerHTML = "";
    funcionRender(contenedor, parametro);
    actualizarContadorAlertas_();
  }

  function actualizarContadorAlertas_() {
    if (typeof Api === "undefined" || !Api.obtenerResumenAlertas) return;

    Api.obtenerResumenAlertas()
      .then((resumen) => {
        const badge = document.getElementById("app-alertas-contador");
        if (!badge || !resumen) return;

        const total =
          (resumen.equiposEstancados || 0) + (resumen.stockBajo || 0) + (resumen.garantiasPorVencer || 0);

        if (total > 0) {
          badge.textContent = String(total);
          badge.hidden = false;
        } else {
          badge.hidden = true;
        }
      })
      .catch((err) => {
        console.warn("No se pudo actualizar el contador de alertas de la barra superior:", err);
      });
  }

  function iniciar() {
    window.addEventListener("hashchange", render);
    render();
  }

  return { registrar, navegar, iniciar };
})();
