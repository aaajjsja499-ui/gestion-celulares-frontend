// GESTION_CELULARES - dinero.js : caja, resumen del dia, gastos, traslados, ajuste, cierre mensual, pagos al tecnico
(() => {
  const h = U.h, ADM = ['Administrador'];
  const mesActual = () => U.hoy().substring(0, 7);

  const pantallaCaja = {
    titulo: 'Dinero', tab: 'dinero', roles: ['Administrador', 'Técnico'],
    render: async (c) => {
      if (!App.esAdmin()) { App.ir('pagos-tecnico'); return; }
      const d = await Api.leer('obtenerCaja');
      c.appendChild(UI.tarjeta({}, h('div', { class: 'grande' }, U.gs(d.disponible)), h('div', { class: 'sec' }, 'Dinero disponible'),
        Object.keys(d.por_medio).map(m => UI.kv(m, U.gs(d.por_medio[m]))),
        UI.kv('Por cobrar (créditos)', U.gs(d.cuentas_por_cobrar)), UI.kv('Saldos a favor de clientes', U.gs(d.saldos_a_favor)), UI.kv('A pagar al técnico', U.gs(d.tecnico_a_pagar)),
        UI.kv('Fondo de incobrables', U.gs(d.fondo)), UI.kv('Capital libre', U.gs(d.capital_libre))));
      c.appendChild(h('div', { class: 'grid' }, [UI.boton('Resumen del día', () => App.ir('resumen-dia')), UI.boton('Gastos', () => App.ir('gastos')), UI.boton('Trasladar entre medios', () => traslado(d.medios), 'primario'),
        UI.boton('Pagos al técnico', () => App.ir('pagos-tecnico')), UI.boton('Cierre del mes', () => App.ir('cierre')), UI.boton('Fondo', () => App.ir('fondo')), UI.boton('Ajustar caja', () => ajuste(d.medios))]));
      c.appendChild(UI.seccion('Últimos movimientos', d.movimientos.length ? d.movimientos.slice(0, 40).map(m => UI.fila({ class: 'item' },
        h('div', {}, h('div', { class: 'princ' }, m.concepto), h('div', { class: 'sec' }, U.fecha(m.fecha_hora) + ' · ' + m.medio + (m.comentario ? ' · ' + m.comentario : ''))),
        h('div', { class: 'der ' + (m.tipo === 'Ingreso' ? 'pos' : 'neg') }, (m.tipo === 'Ingreso' ? '+' : '−') + U.gs(m.monto)))) : UI.vacio('Sin movimientos.')));
    },
  };
  App.pantalla('caja', pantallaCaja); App.pantalla('dinero', pantallaCaja);

  function ajuste(medios) {
    UI.accion({ titulo: 'Ajuste manual de caja', op: 'ajustarCaja', exito: 'Ajuste registrado', alOk: App.recargar, intro: 'Solo para corregir diferencias entre lo registrado y lo que realmente hay. Queda en la Bitácora de decisiones.',
      campos: [{ n: 'medio', l: 'Medio', t: 'select', req: true, opts: medios }, { n: 'tipo', l: 'Tipo', t: 'select', req: true, opts: [{ v: 'Ingreso', l: 'Hay más de lo registrado (ingreso)' }, { v: 'Egreso', l: 'Hay menos de lo registrado (egreso)' }] },
        { n: 'monto', l: 'Monto (Gs.)', t: 'num', req: true, min: 1 }, { n: 'motivo', l: 'Motivo (mín. 10 caracteres)', t: 'area', req: true }], params: v => v });
  }

  function traslado(medios) {
    let sug = null;
    const f = UI.accion({ titulo: 'Trasladar entre medios', op: 'trasladarEntreMedios', exito: 'Traslado registrado', alOk: App.recargar,
      campos: [{ n: 'medio_origen', l: 'Desde', t: 'select', req: true, opts: medios }, { n: 'medio_destino', l: 'Hacia', t: 'select', req: true, opts: medios }, { n: 'monto', l: 'Monto (Gs.)', t: 'num', req: true, min: 1 },
        { n: 'comision', l: 'Comisión cobrada (Gs.; se sugiere sola)', t: 'num', min: 0, def: 0, ayuda: 'Se registra como gasto. Podés cambiarla si el medio cobró otra cosa.' }],
      alCambiar: async (v, cs) => { try { if (v.medio_origen && v.monto > 0) { const r = await Api.leer('sugerirComisionTraslado', { medio_origen: v.medio_origen, monto: v.monto }); if (r.comision_sugerida !== sug) { sug = r.comision_sugerida; if (cs && cs.comision && cs.comision.input) cs.comision.input.value = sug; } } } catch (e) { /* sin sugerencia */ } },
      params: v => v });
    return f;
  }

  App.pantalla('resumen-dia', {
    titulo: 'Resumen del día', tab: 'dinero', roles: ADM,
    render: async (c, fecha) => {
      const d = await Api.leer('obtenerResumenDia', fecha ? { fecha } : {});
      c.appendChild(h('div', { class: 'tarjeta' }, h('input', { type: 'date', value: d.fecha, onchange: e => App.ir('resumen-dia', e.target.value) })));
      c.appendChild(UI.tarjeta({}, UI.kv('Ingresos', U.gs(d.ingresos)), UI.kv('Egresos', U.gs(d.egresos)), UI.kv('Neto del día', U.gs(d.neto)), UI.kv('Disponible ahora', U.gs(d.disponible))));
      const k = Object.keys(d.por_concepto);
      c.appendChild(UI.seccion('Por concepto', k.length ? k.map(x => UI.kv(x, U.gs(d.por_concepto[x]))) : UI.vacio('Sin movimientos ese día.')));
    },
  });

  App.pantalla('gastos', {
    titulo: 'Gastos', tab: 'dinero', roles: ADM,
    render: async (c) => {
      const d = await Api.leer('obtenerCaja');
      c.appendChild(UI.boton('+ Registrar gasto', () => UI.accion({ titulo: 'Nuevo gasto operativo', op: 'crearGastoOperativo', exito: 'Gasto registrado', alOk: App.recargar,
        campos: [{ n: 'categoria', l: 'Categoría', t: 'select', req: true, opts: d.categorias }, { n: 'monto', l: 'Monto (Gs.)', t: 'num', req: true, min: 1 }, { n: 'medios', l: 'Con qué se pagó', t: 'medios', totalDe: 'monto' },
          { n: 'descripcion', l: 'Descripción', req: true }, { n: 'fecha', l: 'Fecha', t: 'fecha', def: U.hoy() }], params: v => v }), 'primario'));
      c.appendChild(UI.seccion('Últimos gastos', d.gastos.length ? d.gastos.map(g => UI.fila({ class: 'item' },
        h('div', {}, h('div', { class: 'princ' }, g.categoria + (g.anulado === 'Sí' ? ' (anulado)' : '')), h('div', { class: 'sec' }, U.fecha(g.fecha) + ' · ' + g.descripcion)),
        h('div', { class: 'der' }, h('div', { class: 'princ' }, U.gs(g.monto)), g.anulado === 'Sí' || g.categoria === 'Comisión de medio de pago' ? null : UI.boton('Anular', () => UI.accion({ titulo: 'Anular gasto', op: 'anularGastoOperativo', exito: 'Gasto anulado', alOk: App.recargar, campos: [{ n: 'motivo', l: 'Motivo', req: true }], params: v => ({ id_gasto: g.id_gasto, motivo: v.motivo }) }), 'chico')))) : UI.vacio('No hay gastos.')));
    },
  });

  App.pantalla('pagos-tecnico', {
    titulo: 'Pagos al técnico', tab: 'dinero', roles: ['Administrador', 'Técnico'],
    render: async (c) => {
      const d = await Api.leer('obtenerPagosTecnicos'), caja = App.esAdmin() ? await Api.leer('obtenerCaja') : null;
      if (!d.tecnicos.length) c.appendChild(UI.vacio('Todavía no hay trabajos aprobados.'));
      d.tecnicos.forEach(t => {
        const b = [];
        if (App.esAdmin() && t.pendiente > 0) b.push(UI.boton('Liquidar un mes', () => {
          const meses = d.cierres.slice().reverse(); if (!meses.length) { UI.toast('Primero hay que cerrar un mes.', 'error'); return; }
          UI.accion({ titulo: 'Liquidar a ' + t.tecnico, op: 'liquidarTecnico', exito: 'Liquidación creada', alOk: App.recargar, intro: 'Solo se liquidan meses ya cerrados.', campos: [{ n: 'mes_liquidado', l: 'Mes', t: 'select', req: true, opts: meses }], params: v => ({ tecnico: t.tecnico, mes_liquidado: v.mes_liquidado }) });
        }));
        c.appendChild(UI.seccion(t.tecnico, UI.tarjeta({}, UI.kv('Pendiente de liquidar', U.gs(t.pendiente)), UI.kv('En liquidación sin pagar', U.gs(t.incluido)), UI.kv('Pagado', U.gs(t.pagado)), t.saldo_ajustes < 0 ? h('p', { class: 'aviso' }, 'Saldo negativo por ajustes: se descuenta en la próxima liquidación.') : null, b.length ? h('div', { class: 'grid' }, b) : null)));
        const liqs = d.liquidaciones.filter(l => l.tecnico === t.tecnico);
        if (liqs.length) c.appendChild(UI.seccion('Liquidaciones', liqs.map(l => UI.fila({ class: 'item' }, h('div', {}, h('div', { class: 'princ' }, l.id_liquidacion + ' · ' + l.mes_liquidado), h('div', { class: 'sec' }, l.estado === 'Pagada' ? 'Pagada ' + U.fecha(l.fecha_pago) : 'Sin pagar')),
          h('div', { class: 'der' }, h('div', { class: 'princ' }, U.gs(l.total)), l.estado !== 'Pagada' && App.esAdmin() ? UI.boton('Pagar', () => UI.accion({ titulo: 'Pagar ' + l.id_liquidacion, op: 'pagarLiquidacion', exito: 'Pago registrado', alOk: App.recargar,
            campos: Number(l.total) > 0 ? [{ n: 'medios', l: 'Con qué se paga', t: 'medios', total: Number(l.total) }] : [], params: v => Object.assign({ id_liquidacion: l.id_liquidacion }, v.medios ? { medios: v.medios } : {}) }), 'chico') : null)))));
        c.appendChild(UI.seccion('Detalle', t.filas.slice(-30).reverse().map(f => UI.fila({ class: 'item' }, h('div', {}, h('div', { class: 'princ' }, f.tipo + (f.id_reparacion ? ' · ' + f.id_reparacion : '')), h('div', { class: 'sec' }, f.mes_costo + ' · ' + f.estado + (f.motivo ? ' · ' + f.motivo : ''))), h('div', { class: 'der' }, U.gs(f.monto))))));
      });
    },
  });

  App.pantalla('cierre', {
    titulo: 'Cierre del mes', tab: 'dinero', roles: ADM,
    render: async (c) => {
      const [d, caja] = await Promise.all([Api.leer('obtenerCierres'), Api.leer('obtenerCaja')]);
      const sig = d.siguiente;
      const puede = sig && sig < mesActual();
      c.appendChild(UI.tarjeta({}, h('div', { class: 'princ' }, sig ? 'Próximo mes a cerrar: ' + sig : 'Todavía no se cerró ningún mes'), UI.kv('Dinero según el sistema', U.gs(caja.disponible)),
        h('p', { class: 'info' }, 'Contá el dinero real (efectivo, cuentas y billeteras) y cargalo. Si hay diferencia se registra como ajuste con su motivo.')));
      const mes = sig || mesAnterior();
      const f = UI.formulario({ enviar: 'Cerrar mes', campos: [{ n: 'mes', l: 'Mes a cerrar (AAAA-MM)', req: true, def: mes }, { n: 'dinero_contado', l: 'Dinero realmente contado (Gs.)', t: 'num', req: true, min: 0 },
        { n: 'medio_ajuste', l: 'Medio donde está la diferencia (si hay)', t: 'select', opts: [''].concat(caja.medios) }, { n: 'motivo_ajuste', l: 'Motivo de la diferencia (mín. 10 caracteres)', t: 'area' }],
        alEnviar: async (v, idOp) => { if (!(await UI.confirmar('Al cerrar el mes ya no se puede registrar nada con fecha de ese mes. ¿Cerrar ' + v.mes + '?', 'Cerrar'))) return; const r = await UI.ejecutar('cerrarMes', v, idOp); UI.toast('Mes ' + v.mes + ' cerrado', 'ok'); App.recargar(); } });
      c.appendChild(UI.seccion('Cerrar', f.nodo));
      c.appendChild(UI.seccion('Cierres anteriores', d.cierres.length ? d.cierres.slice().reverse().map(x => UI.tarjeta({}, h('div', { class: 'princ' }, x.mes), UI.kv('Dinero', U.gs(x.dinero_disponible)), UI.kv('Ajuste de caja', U.gs(x.ajuste_caja)), UI.kv('Ganancia equipos', U.gs(x.ganancia_equipos)), UI.kv('Ganancia intereses', U.gs(x.ganancia_intereses)), UI.kv('Ganancia servicio técnico', U.gs(x.ganancia_servicio_tecnico)), UI.kv('Capital libre', U.gs(x.capital_libre)))) : UI.vacio('Sin cierres.')));
    },
  });
  function mesAnterior() { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
})();
