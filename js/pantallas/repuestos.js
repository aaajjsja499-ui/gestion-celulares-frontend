// GESTION_CELULARES - repuestos.js : inventario de repuestos
(() => {
  const h = U.h;
  App.pantalla('repuestos', {
    titulo: 'Repuestos', tab: 'taller', roles: ['Administrador', 'Técnico', 'Comprador'],
    render: async (c) => {
      const lista = await Api.leer('obtenerRepuestos'), ver = App.esAdmin();
      if (ver) c.appendChild(UI.boton('+ Nuevo repuesto', () => form(null), 'primario'));
      const minimo = Number((App.config || {}).stock_minimo_repuestos || 0);
      c.appendChild(UI.seccion('Inventario (' + lista.length + ')', lista.length ? lista.map(r => UI.fila({ class: 'item' },
        h('div', {}, h('div', { class: 'princ' }, r.nombre + (r.activo === 'No' ? ' (inactivo)' : '')), h('div', { class: 'sec' }, (r.compatibilidad || '') + (r.proveedor ? ' · ' + r.proveedor : '') + (ver ? ' · costo ' + U.gs(r.costo_unitario) : ''))),
        h('div', { class: 'der' }, UI.badge('Stock ' + r.stock_actual, Number(r.stock_actual) <= minimo ? 'aviso' : 'ok'),
          ver ? h('div', {}, UI.boton('Editar', () => form(r), 'chico'), ' ', UI.boton('Stock', () => ajuste(r), 'chico')) : null))) : UI.vacio('No hay repuestos cargados.')));
    },
  });

  function form(r) {
    const nuevo = !r;
    UI.accion({ titulo: nuevo ? 'Nuevo repuesto' : 'Editar ' + r.nombre, op: nuevo ? 'crearRepuesto' : 'editarRepuesto', exito: 'Guardado', alOk: App.recargar,
      campos: [{ n: 'nombre', l: 'Nombre', req: true, def: r ? r.nombre : '' }, { n: 'compatibilidad', l: 'Compatibilidad (modelos)', def: r ? r.compatibilidad : '' }, { n: 'proveedor', l: 'Proveedor', def: r ? r.proveedor : '' },
        { n: 'tiempo_reposicion_dias', l: 'Días de reposición', t: 'num', min: 0, def: r ? r.tiempo_reposicion_dias : '' }, { n: 'notas', l: 'Notas', t: 'area', def: r ? r.notas : '' }]
        .concat(nuevo ? [{ n: 'stock_inicial', l: 'Stock inicial', t: 'num', min: 0, def: 0 }, { n: 'costo_unitario', l: 'Costo unitario (Gs.)', t: 'num', min: 0, def: 0 }, { n: 'monto_pagado', l: 'Monto pagado por el stock inicial (Gs.; 0 si ya estaba)', t: 'num', min: 0, def: 0 }]
          : [{ n: 'activo', l: 'Activo', t: 'check', def: r.activo !== 'No' }]),
      params: v => Object.assign({}, v, nuevo ? {} : { id_repuesto: r.id_repuesto, activo: v.activo ? 'Sí' : 'No' }) });
  }

  function ajuste(r) {
    UI.accion({ titulo: 'Ajustar stock de ' + r.nombre, op: 'ajustarStock', exito: 'Stock ajustado', alOk: App.recargar, intro: 'Stock actual: ' + r.stock_actual + '. Use positivo para entradas y negativo para salidas.',
      campos: [{ n: 'cantidad', l: 'Cantidad (+ entra / − sale)', t: 'num', req: true, min: -100000 }, { n: 'motivo', l: 'Motivo', t: 'select', req: true, opts: ['Compra', 'Pérdida', 'Corrección', 'Pieza rescatada', 'Otro'] },
        { n: 'monto_pagado', l: 'Monto pagado (Gs., si fue compra)', t: 'num', min: 0, def: 0 }, { n: 'valor_unitario', l: 'Valor unitario (Gs., si salió de una unidad desarmada)', t: 'num', min: 0, def: 0 }, { n: 'medios', l: 'Cómo se pagó (si fue compra)', t: 'medios', totalDe: 'monto_pagado', req: false }, { n: 'id_equipo_origen', l: 'Unidad de origen (si aplica)' }, { n: 'comentario', l: 'Comentario' }],
      params: v => { const p = Object.assign({ id_repuesto: r.id_repuesto }, v); if (v.motivo !== 'Compra') delete p.medios; return p; } });
  }
})();
