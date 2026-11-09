// GESTION_CELULARES - ordenes.js : servicio tecnico a terceros
(() => {
  const h = U.h;
  const SIG = { 'Recibida': ['En diagnóstico', 'Cancelada'], 'En diagnóstico': ['En reparación', 'Esperando repuestos', 'Lista', 'No reparada', 'Cancelada'], 'En reparación': ['Esperando repuestos', 'Lista', 'No reparada', 'Cancelada'], 'Esperando repuestos': ['En reparación', 'No reparada', 'Cancelada'] };
  const CIERRE = ['Lista', 'No reparada', 'Cancelada'];
  const R = ['Administrador', 'Técnico', 'Soporte de garantía'];

  App.pantalla('ordenes', {
    titulo: 'Órdenes de servicio', tab: 'taller', roles: R,
    render: async (c) => {
      const lista = await Api.leer('obtenerOrdenes');
      if (App.tieneRol('Administrador', 'Soporte de garantía')) c.appendChild(UI.boton(App.esAdmin() ? '+ Nueva orden' : '+ Reclamo de garantía', () => nueva(), 'primario'));
      const grupos = [['Abiertas', o => !CIERRE.concat(['Entregada']).includes(o.orden.estado)], ['Para entregar', o => CIERRE.includes(o.orden.estado)], ['Entregadas', o => o.orden.estado === 'Entregada']];
      grupos.forEach(([t, f]) => {
        const l = lista.filter(f).slice(t === 'Entregadas' ? -30 : 0); if (!l.length) return;
        c.appendChild(UI.seccion(t + ' (' + l.length + ')', l.map(o => UI.fila({ class: 'item clic', onclick: () => App.ir('orden', o.orden.id_orden) },
          h('div', {}, h('div', { class: 'princ' }, o.orden.id_orden + ' · ' + o.orden.equipo_descripcion), h('div', { class: 'sec' }, (o.cliente ? o.cliente.nombre : '') + (o.dias_sin_retirar ? ' · ' + o.dias_sin_retirar + ' días sin retirar' : ''))), UI.badge(o.orden.estado)))));
      });
      if (!lista.length) c.appendChild(UI.vacio('No hay órdenes.'));
    },
  });

  async function nueva(origen) {
    const clientes = await Api.leer('obtenerClientes');
    UI.accion({ titulo: origen ? 'Reclamo de garantía de ' + origen.id_orden : 'Nueva orden de servicio', op: 'crearOrden', exito: 'Orden creada', alOk: r => App.ir('orden', r.id_orden),
      campos: [{ n: 'id_cliente', l: 'Cliente', t: 'select', req: true, def: origen ? origen.id_cliente : '', opts: clientes.map(c => ({ v: c.id_cliente, l: c.nombre + ' · ' + (c.contacto || '') })) },
        { n: 'equipo_descripcion', l: 'Equipo (marca, modelo, color, accesorios)', req: true, def: origen ? origen.equipo_descripcion : '' },
        { n: 'equipo_identificador', l: 'IMEI o serie', def: origen ? origen.equipo_identificador : '' }, { n: 'falla_reportada', l: 'Falla reportada', t: 'area', req: true }],
      params: v => Object.assign({}, v, origen ? { id_orden_origen: origen.id_orden } : {}) });
  }

  App.pantalla('orden', {
    titulo: 'Orden', tab: 'taller', roles: R,
    render: async (c, id) => {
      const [lista, repuestos] = await Promise.all([Api.leer('obtenerOrdenes'), App.tieneRol('Administrador', 'Técnico') ? Api.leer('obtenerRepuestos') : Promise.resolve([])]);
      const x = lista.find(o => o.orden.id_orden === id); if (!x) throw new Error('No se encontró la orden');
      const o = x.orden; App.titulo(o.id_orden);
      c.appendChild(UI.tarjeta({}, h('div', { class: 'princ' }, o.equipo_descripcion), UI.badge(o.estado),
        UI.kv('Cliente', x.cliente ? x.cliente.nombre + ' · ' + (x.cliente.contacto || '') : ''), UI.kv('Identificador', o.equipo_identificador || '—'), UI.kv('Falla', o.falla_reportada),
        UI.kv('Recibida', U.fecha(o.fecha_recepcion)), o.id_orden_origen ? UI.kv('Garantía de', o.id_orden_origen) : null,
        o.garantia_hasta ? UI.kv('Garantía hasta', U.fecha(o.garantia_hasta)) : null,
        App.esAdmin() ? UI.kv('Anticipos recibidos', U.gs(o.anticipos_recibidos || 0)) : null, o.estado === 'Entregada' ? UI.kv('Cobro final', U.gs(o.cobro_final)) : null,
        x.costo && App.esAdmin() ? UI.kv('Costo hasta ahora', U.gs(x.costo.total)) : null));
      if (x.reparaciones.length) c.appendChild(UI.seccion('Trabajos', x.reparaciones.map(r => UI.fila({ class: 'item' + (r.fecha_fin ? '' : ' clic'), onclick: () => { if (!r.fecha_fin) App.ir('completar-reparacion', r.id_reparacion); } }, h('div', {}, h('div', { class: 'princ' }, r.id_reparacion + ' · ' + r.tecnico), h('div', { class: 'sec' }, r.fecha_fin ? 'Terminado · ' + (r.resultado || '') : 'En curso (tocar para completar)')), UI.badge(r.estado_tarifa || 'En curso')))));
      const acc = [];
      const abierta = !!SIG[o.estado];
      if (abierta && App.tieneRol('Administrador', 'Técnico') && !x.reparaciones.some(r => !r.fecha_fin)) acc.push(UI.boton('Iniciar trabajo', () => UI.accion({ titulo: 'Iniciar trabajo', op: 'iniciarReparacion', exito: 'Trabajo iniciado', alOk: () => App.recargar(), intro: 'Queda registrado a su nombre.', campos: [], params: () => ({ id_orden: id, origen: o.id_orden_origen ? 'Garantía o retrabajo' : 'Servicio a tercero' }) }), 'primario'));
      if (abierta && App.tieneRol('Administrador', 'Técnico') && repuestos.length) acc.push(UI.boton('Cargar repuesto', () => {
        const rep = x.reparaciones.find(r => !r.fecha_fin);
        UI.accion({ titulo: 'Repuesto para la orden', op: 'registrarRepuestoDeOrden', exito: 'Repuesto cargado', alOk: () => App.recargar(),
          campos: [{ n: 'id_repuesto', l: 'Repuesto', t: 'select', req: true, opts: repuestos.filter(r => r.activo !== 'No').map(r => ({ v: r.id_repuesto, l: r.nombre + ' (stock ' + r.stock_actual + ')' })) }, { n: 'cantidad', l: 'Cantidad', t: 'num', req: true, min: 1, def: 1 }],
          params: v => ({ id_orden: id, id_reparacion: rep ? rep.id_reparacion : undefined, id_repuesto: v.id_repuesto, cantidad: v.cantidad }) });
      }));
      if (abierta && App.esAdmin()) acc.push(UI.boton('Registrar anticipo', () => UI.accion({ titulo: 'Anticipo del cliente', op: 'registrarAnticipoOrden', exito: 'Anticipo registrado', alOk: () => App.recargar(),
        campos: [{ n: 'monto', l: 'Monto (Gs.)', t: 'num', req: true, min: 1 }, { n: 'medios', l: 'Medio de pago', t: 'medios', totalDe: 'monto' }], params: v => v })));
      if (abierta) acc.push(UI.boton('Cambiar estado', () => UI.accion({ titulo: 'Cambiar estado', op: 'transicionarOrden', exito: 'Estado actualizado', alOk: () => App.recargar(),
        campos: [{ n: 'estado_nuevo', l: 'Nuevo estado', t: 'select', req: true, opts: SIG[o.estado] }, { n: 'comentario', l: 'Comentario (mín. 3 caracteres)', t: 'area', req: true }], params: v => Object.assign({ id_orden: id, version: o.version }, v) })));
      if (CIERRE.includes(o.estado) && App.esAdmin()) acc.push(UI.boton('Entregar al cliente', () => entregar(o), 'primario'));
      if (o.estado === 'Entregada' && o.garantia_hasta && App.tieneRol('Administrador', 'Soporte de garantía') && U.hoy() <= String(o.garantia_hasta).substring(0, 10)) acc.push(UI.boton('Reclamo de garantía', () => nueva(o)));
      if (acc.length) c.appendChild(UI.seccion('Acciones', h('div', { class: 'grid' }, acc)));
      if (CIERRE.includes(o.estado) && x.reparaciones.some(r => r.estado_tarifa === 'Pendiente de aprobación' || r.estado_tarifa === 'Devuelta')) c.appendChild(h('p', { class: 'aviso' }, 'Hay una tarifa del técnico sin aprobar: no se puede entregar hasta resolverla.'));
    },
  });

  function entregar(o) {
    const ant = Number(o.anticipos_recibidos || 0);
    const f = UI.accion({ titulo: 'Entregar ' + o.id_orden, op: 'entregarOrden', exito: 'Orden entregada', alOk: r => { UI.toast('Garantía hasta ' + (r.garantia_hasta || '—')); App.recargar(); },
      intro: 'Anticipos recibidos: ' + U.gs(ant) + '. Si el cobro final es menor, se devuelve la diferencia.',
      campos: [{ n: 'cobro_final', l: 'Cobro final total (Gs.; 0 si no se cobra)', t: 'num', req: true, min: 0, def: o.id_orden_origen ? 0 : '' },
        { n: 'medios', l: 'Cómo paga el saldo / sale la devolución', t: 'medios', totalDe: 'cobro_final', req: false },
        { n: 'motivo', l: 'Motivo (obligatorio si no quedó Lista y hay cobro o anticipo)', t: 'area' }],
      params: v => { const p = { id_orden: o.id_orden, version: o.version, cobro_final: v.cobro_final, motivo: v.motivo }; if (v.medios) p.medios = v.medios; return p; } });
    return f;
  }
})();
