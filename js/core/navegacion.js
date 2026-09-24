// GESTION_CELULARES - js/core/navegacion.js
// Fase 8, tercera pieza (Menu de Navegacion Principal - Especificacion
// de Interfaz Seccion 3, Diseno Tecnico Seccion 7.3). Dibuja y
// abre/cierra el panel del menu hamburguesa - responsabilidad
// separada de router.js, que solo resuelve que pantalla mostrar segun
// el hash de la URL (Diseno Tecnico 7.3: "router.js... navegacion.js
// dibuja y abre/cierra el panel del menu hamburguesa").
//
// Entrega elegida por Pedro (opcion 1 de las dos presentadas): pieza
// nueva, agregada, sin tocar ninguna de las 13 pantallas existentes.
// Cada pantalla sigue con sus propios links inline donde ya los tenia
// (ej. dashboard.js) - este menu es un mecanismo de navegacion
// GLOBAL adicional, visible en cualquier pantalla, no un reemplazo de
// esos links existentes.
//
// Verificado en vivo antes de escribir esto (RG-07): no existe hoy
// ningun elemento de "barra lateral de navegacion colapsable" en
// produccion (index.html, base.css, layout.css, componentes.css,
// router.js) para reemplazar - la Especificacion 3 y el Diseno
// Tecnico 7.3 describen el menu hamburguesa como reemplazo de una
// barra lateral que nunca llego a construirse. Señalado a Pedro
// (correccion aceptada antes de escribir este archivo). Esta pieza es
// la primera navegacion persistente y global de toda la aplicacion.
//
// Lista de pantallas y su orden: Especificacion de Interfaz Seccion
// 3.2, verbatim. "Usuarios" solo se pinta si el usuario logueado
// tiene Administrador entre sus roles reales (no entre el rolActivo
// de la sesion) - mismo criterio que usa el servidor para autorizar
// los endpoints de Usuarios.gs (Diseno Tecnico Seccion 5.3): son los
// roles reales de la persona los que dan el permiso, no el rol que
// eligio operar en esta sesion.

const Navegacion = (() => {
  const ENLACES = [
    { ruta: "dashboard", etiqueta: "Dashboard" },
    { ruta: "equipos", etiqueta: "Equipos" },
    { ruta: "viabilidad-consulta", etiqueta: "Viabilidad" },
    { ruta: "diagnosticos", etiqueta: "Diagnósticos" },
    { ruta: "reparaciones", etiqueta: "Reparaciones" },
    { ruta: "repuestos", etiqueta: "Repuestos" },
    { ruta: "ventas", etiqueta: "Ventas" },
    { ruta: "catalogo", etiqueta: "Catálogo" },
    { ruta: "decisiones", etiqueta: "Decisiones" },
    { ruta: "clientes", etiqueta: "Clientes" },
    { ruta: "vendedores", etiqueta: "Vendedores" },
    { ruta: "reportes", etiqueta: "Reportes" },
    { ruta: "usuarios", etiqueta: "Usuarios", soloAdministrador: true },
  ];

  let panelAbierto = false;
  let elementoBoton = null;
  let elementoFondo = null;
  let elementoPanel = null;

  function iniciar() {
    crearBoton();
    crearPanel();
    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape" && panelAbierto) cerrarPanel();
    });
  }

  function crearBoton() {
    const header = document.getElementById("app-header");
    if (!header) {
      console.error("No se encontro #app-header en index.html.");
      return;
    }

    elementoBoton = document.createElement("button");
    elementoBoton.id = "menu-hamburguesa";
    elementoBoton.type = "button";
    elementoBoton.setAttribute("aria-label", "Abrir menu de navegacion");
    elementoBoton.setAttribute("aria-expanded", "false");
    elementoBoton.textContent = "☰";
    elementoBoton.addEventListener("click", alternarPanel);

    header.insertBefore(elementoBoton, header.firstChild);
  }

  function crearPanel() {
    elementoFondo = document.createElement("div");
    elementoFondo.id = "menu-panel-fondo";
    elementoFondo.hidden = true;
    elementoFondo.addEventListener("click", cerrarPanel);

    elementoPanel = document.createElement("nav");
    elementoPanel.id = "menu-panel";
    elementoPanel.hidden = true;
    elementoPanel.setAttribute("aria-label", "Navegacion principal");

    const encabezado = document.createElement("div");
    encabezado.id = "menu-panel-encabezado";
    encabezado.innerHTML = `<strong>Menú</strong>`;

    const botonCerrar = document.createElement("button");
    botonCerrar.type = "button";
    botonCerrar.id = "menu-panel-cerrar";
    botonCerrar.setAttribute("aria-label", "Cerrar menu");
    botonCerrar.textContent = "✕";
    botonCerrar.addEventListener("click", cerrarPanel);
    encabezado.appendChild(botonCerrar);

    const lista = document.createElement("ul");
    lista.id = "menu-panel-lista";

    const { usuario } = Estado.get();
    const roles = (usuario && usuario.roles) || [];

    ENLACES.forEach((enlace) => {
      if (enlace.soloAdministrador && roles.indexOf("Administrador") < 0) return;

      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = "#" + enlace.ruta;
      link.textContent = enlace.etiqueta;
      link.addEventListener("click", cerrarPanel);
      item.appendChild(link);
      lista.appendChild(item);
    });

    elementoPanel.appendChild(encabezado);
    elementoPanel.appendChild(lista);

    document.body.appendChild(elementoFondo);
    document.body.appendChild(elementoPanel);
  }

  function alternarPanel() {
    if (panelAbierto) {
      cerrarPanel();
    } else {
      abrirPanel();
    }
  }

  function abrirPanel() {
    panelAbierto = true;
    elementoFondo.hidden = false;
    elementoPanel.hidden = false;
    elementoBoton.setAttribute("aria-expanded", "true");
  }

  function cerrarPanel() {
    panelAbierto = false;
    elementoFondo.hidden = true;
    elementoPanel.hidden = true;
    elementoBoton.setAttribute("aria-expanded", "false");
  }

  return { iniciar };
})();
