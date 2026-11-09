// GESTION_CELULARES - vender.js : pestaña Vender, venta de contado y a crédito (simulador)
(() => {
  const h = U.h;
  const CANALES = ['Facebook Marketplace', 'WhatsApp', 'Tienda física', 'Otro'];
  const FREC = ['Mensual', 'Quincenal', 'Semanal'];

  App.pantalla('vender', {
    titulo: 'Vender', roles: ['Administrador', 'Soporte de garantía'],
    render: async (c) => {
      const lista = await Api.leer('obtenerEquipos');
      const venta = lista.filter(e => ['Publicado', 'Reservado'].indexOf(e.estado) >= 0).reverse();
      const prox = lista.filter(e => e.estado === 'Listo para venta').reverse();
      if (App.esAdmin()) c.appendChild(h('div', { class: 'grid' }, UI.boton('Cobrar cuotas (cartera)', () => App.ir('cartera')), UI.boton('Clientes', () => App.ir('clientes')), UI.boton('Ventas realizadas', () => App.ir('ventas')), UI.boton('Garantías', () => App.ir('garantias'))));
      else c.appendChild(h('div', { class: 'grid' }, UI.boton('Garantías', () => App.ir('garantias')), UI.boton('Clientes', () => App.ir('clientes'))));
      c.appendChild(UI.seccion('Publicados para vender', venta.length ? venta.map(item) : UI.vacio('No hay equipos publicados.')));
      if (prox.length) c.appendChild(UI.seccion('Listos (falta publicar)', prox.map(item)));
      function item(e) {
        return UI.fila({ class: 'item clic', onclick: () => App.ir('equipo', e.id_equipo) },
          h('div', {}, h('div', { class: 'princ' }, e.marca + ' ' + e.modelo), h('div', { class: 'sec' }, e.id_equipo + (e.costo_total ? ' · costo ' + U.n(e.costo_total) : ''))),
          h('div', { class: 'der' }, h('div', { class: 'princ' }, e.precio_fijado ? U.gs(e.precio_fijado) : 'Sin precio'), UI.badge(e.estado, App.estadoTono(e.estado))));
      }
    },
  });

  App.pantalla('ventas', {
    titulo: 'Ventas realizadas', tab: 'vender', roles: ['Administrador', 'Soporte de garantía'],
    render: async (c) => {
      const [ventas, equipos] = await Promise.all([Api.leer('obtenerVentas'), Api.leer('obtenerEquipos')]);
      const eq = {}; equipos.forEach(e => eq[e.id_equipo] = e);
      if (!ventas.length) { c.appendChild(UI.vacio('Todavía no hay ventas.')); return; }
      ventas.forEach(v => { const e = eq[v.id_equipo] || {}; c.appendChild(UI.fila({ class: 'item clic', onclick: () => App.ir('equipo', v.id_equipo) },
        h('div', {}, h('div', { class: 'princ' }, (e.marca || '') + ' ' + (e.modelo || v.id_equipo)), h('div', { class: 'sec' }, U.fecha(v.fecha_venta) + ' · ' + v.tipo_venta + ' · ' + v.canal_venta)), h('div', { class: 'der' }, h('div', { class: 'princ' }, U.gs(v.precio_venta)), UI.badge(v.estado_venta, v.estado_venta === 'Vigente' ? 'ok' : 'mal')))); });
    },
  });

  async function datosVenta(idEq) {
    const [f, clientes] = await Promise.all([Api.leer('obtenerFichaEquipo', { id_equipo: idEq }), Api.leer('obtenerClientes')]);
    return { f, e: f.equipo, clientes };
  }
  const opcClientes = cl => cl.map(c => ({ v: c.id_cliente, l: c.nombre + ' · ' + (c.contacto || '') + (c.ficha_credito_completa === 'Sí' ? ' · ficha de crédito ✓' : '') }));

  App.pantalla('vender-contado', {
    titulo: 'Venta de contado', tab: 'vender', roles: ['Administrador'],
    render: async (c, idEq) => {
      const { e, clientes } = await datosVenta(idEq);
      c.appendChild(UI.tarjeta({}, h('div', { class: 'princ' }, e.marca + ' ' + e.modelo), UI.kv('Costo total', U.gs(e.costo_total)), UI.kv('Precio fijado', U.gs(e.precio_fijado))));
      const dif = h('p', { class: 'info' });
      const f = UI.formulario({
        enviar: 'Registrar venta',
        alCambiar: v => { const p = v.precio_venta; if (p && e.precio_fijado) { const d = p - Number(e.precio_fijado); dif.textContent = 'Diferencia contra el precio fijado: ' + (d > 0 ? '+' : '') + U.n(d) + ' Gs.' + (e.costo_total ? ' · Ganancia estimada: ' + U.gs(p - Number(e.costo_total)) : ''); } else dif.textContent = ''; },
        campos: [
          { n: 'id_cliente', l: 'Cliente', t: 'select', opts: opcClientes(clientes), req: true, ayuda: 'Si no está en la lista, creá el cliente primero (Clientes).' },
          { n: 'precio_venta', l: 'Precio de venta (Gs.)', t: 'num', req: true, min: 1, def: e.precio_fijado },
          { n: 'medios', l: 'Cómo paga', t: 'medios', totalDe: 'precio_venta' },
          { n: 'canal_venta', l: 'Canal de venta', t: 'select', opts: CANALES, req: true },
          { n: 'garantia_dias', l: 'Días de garantía', t: 'num', def: App.config.dias_garantia_default },
        ],
        alEnviar: async (v, idOp) => { await UI.ejecutar('registrarVenta', Object.assign({ id_equipo: idEq, version: e.version }, v), idOp); UI.toast('Venta registrada', 'ok'); App.ir('equipo', idEq); },
      });
      c.appendChild(f.nodo); f.nodo.insertBefore(dif, f.nodo.querySelector('button'));
      c.appendChild(UI.boton('+ Nuevo cliente', () => App.ir('cliente-form')));
    },
  });

  App.pantalla('vender-credito', {
    titulo: 'Venta a crédito', tab: 'vender', roles: ['Administrador'],
    render: async (c, idEq) => {
      const { e, clientes } = await datosVenta(idEq);
      c.appendChild(UI.tarjeta({}, h('div', { class: 'princ' }, e.marca + ' ' + e.modelo), UI.kv('Costo total', U.gs(e.costo_total)), UI.kv('Precio fijado', U.gs(e.precio_fijado))));
      const sim = h('div', { class: 'tarjeta' }, h('p', { class: 'info' }, 'Completá precio, entrega, cuota y cantidad para ver la simulación. El servidor recalcula todo al confirmar.'));
      let tim;
      const f = UI.formulario({
        enviar: 'Abrir crédito',
        alCambiar: v => { clearTimeout(tim); tim = setTimeout(() => simular(v), 500); },
        campos: [
          { n: 'id_cliente', l: 'Cliente (con ficha de crédito completa)', t: 'select', opts: opcClientes(clientes), req: true },
          { n: 'precio', l: 'Precio de venta (Gs.)', t: 'num', req: true, min: 1, def: e.precio_fijado },
          { n: 'entrega_inicial', l: 'Entrega inicial (Gs.)', t: 'num', def: 0 },
          { n: 'medios', l: 'Cómo paga la entrega', t: 'medios', totalDe: 'entrega_inicial', req: false },
          { n: 'cantidad_cuotas', l: 'Cantidad de cuotas', t: 'num', req: true, min: 1 },
          { n: 'cuota_monto', l: 'Monto de cada cuota (Gs.)', t: 'num', req: true, min: 1 },
          { n: 'frecuencia', l: 'Frecuencia', t: 'select', opts: FREC, req: true, def: 'Mensual' },
          { n: 'fecha_primera_cuota', l: 'Vencimiento de la primera cuota', t: 'fecha', req: true, def: U.sumarDias(U.hoy(), 30) },
          { n: 'canal_venta', l: 'Canal de venta', t: 'select', opts: CANALES, req: true },
          { n: 'garantia_dias', l: 'Días de garantía', t: 'num', def: App.config.dias_garantia_default },
        ],
        alEnviar: async (v, idOp) => {
          const p = Object.assign({ id_equipo: idEq, version: e.version }, v); if (!(v.entrega_inicial > 0)) delete p.medios;
          await UI.ejecutar('registrarVentaCredito', p, idOp); UI.toast('Crédito abierto', 'ok'); App.ir('equipo', idEq);
        },
      });
      async function simular(v) {
        if (!(v.precio > 0 && v.cuota_monto > 0 && v.cantidad_cuotas > 0)) return;
        try {
          const s = await Api.leer('simularCredito', { id_equipo: idEq, precio: v.precio, entrega_inicial: v.entrega_inicial || 0, cuota_monto: v.cuota_monto, cantidad_cuotas: v.cantidad_cuotas });
          U.vaciar(sim); sim.appendChild(h('div', {}, UI.kv('Capital financiado', U.gs(s.capital_financiado)), UI.kv('Deuda total (cuota × cantidad)', U.gs(s.deuda_total)), UI.kv('Interés bruto', U.gs(s.interes_bruto)), UI.kv('Tope del fondo de incobrables', U.gs(s.tope_fondo)),
            UI.kv('Interés neto del fondo', U.gs(s.interes_neto_del_fondo)), s.recupera_con_entrega !== undefined ? UI.kv('Recupera el costo con la entrega', s.recupera_con_entrega ? 'Sí' : 'No') : null, s.aviso_interes_primera_cuota ? h('p', { class: 'aviso' }, 'Atención: el interés cae en la primera cuota.') : null));
        } catch (er) { U.vaciar(sim); sim.appendChild(h('p', { class: 'error' }, er.message)); }
      }
      c.appendChild(sim); c.appendChild(f.nodo);
    },
  });
})();
