// GESTION_CELULARES - inicio.js : pestaña Inicio (alertas y atajos por rol)
(() => {
  const h = U.h;
  const RUTA_ALERTA = { tarifas: 'tarifas', tarifas_devueltas: 'mis-trabajos', repuestos: 'repuestos', operaciones: 'pendientes', bloqueados: 'invariantes', cartera: 'cartera', ordenes: 'ordenes', capital: 'caja', cierre: 'cierre', parciales: 'taller' };
  function atajo(t, ruta, param) { return h('button', { class: 'btn', onclick: () => App.ir(ruta, param) }, t); }

  App.pantalla('inicio', {
    titulo: () => 'Hola, ' + App.usuario.nombre.split(' ')[0],
    render: async (c) => {
      const pedidos = [Api.leer('obtenerResumenAlertas')];
      if (App.esAdmin()) pedidos.push(Api.leer('obtenerCaja', { desde: U.hoy(), hasta: U.hoy() }));
      const [alertas, caja] = await Promise.all(pedidos);
      if (caja) {
        c.appendChild(UI.seccion('Dinero', h('div', { class: 'grid' },
          cifra('Dinero disponible', U.gs(caja.disponible)), cifra('Capital libre', U.gs(caja.capital_libre), caja.capital_libre < 0),
          cifra('Por cobrar (cartera)', U.gs(caja.cuentas_por_cobrar)), cifra('Fondo de incobrables', U.gs(caja.fondo)))));
      }
      c.appendChild(UI.seccion('Para atender', alertas.length ? alertas.map(a => h('div', { class: 'alerta', onclick: () => App.ir(RUTA_ALERTA[a.tipo] || 'inicio') }, h('span', {}, a.texto), h('strong', {}, a.cantidad > 1 || a.tipo !== 'cierre' ? a.cantidad : ''))) : UI.vacio('Todo en orden. No hay alertas.')));
      const at = [];
      if (App.tieneRol('Administrador', 'Comprador')) at.push(atajo('Nueva compra', 'nueva-compra'));
      if (App.tieneRol('Administrador', 'Comprador')) at.push(atajo('Equipos', 'equipos'));
      if (App.esAdmin()) { at.push(atajo('Vender', 'vender')); at.push(atajo('Cobrar cuotas', 'cartera')); at.push(atajo('Resumen del día', 'resumen-dia')); at.push(atajo('Gasto', 'gastos')); }
      if (App.tieneRol('Técnico')) { at.push(atajo('Mis trabajos', 'mis-trabajos')); at.push(atajo('Cola del taller', 'taller')); at.push(atajo('Mis pagos', 'pagos-tecnico')); }
      if (App.tieneRol('Soporte de garantía')) { at.push(atajo('Garantías', 'garantias')); at.push(atajo('Clientes', 'clientes')); at.push(atajo('Órdenes de servicio', 'ordenes')); }
      if (at.length) c.appendChild(UI.seccion('Atajos', h('div', { class: 'grid' }, at)));
    },
  });
  function cifra(t, n, mal) { return h('div', { class: 'cifra' + (mal ? ' mal' : '') }, h('div', { class: 'n' }, n), h('div', { class: 't' }, t)); }
})();
