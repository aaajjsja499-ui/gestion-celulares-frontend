// GESTION_CELULARES - cartera.js : cartera de creditos, cobros y operaciones excepcionales
(() => {
  const h = U.h;
  const etiqueta = k => k.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
  const MONEDA = /(monto|deuda|capital|fondo|interes|paga|descuento|exposicion|resultado|saldo|valor|ganancia|total|reembols|retenid|perdonada|ingreso)/i;

  // Muestra la simulacion (mismo calculo del servidor, sin escribir) y recien despues confirma
  function simularLuegoEjecutar(cfg) {
    let m, huella = '';
    const f = UI.formulario({
      enviar: 'Simular antes de confirmar', campos: cfg.campos,
      alEnviar: async (v) => {
        const p = cfg.params(v);
        const sim = await Api.leer(cfg.simOp, p);
        huella = sim.huella || '';
        const filas = Object.keys(sim).filter(k => k !== 'huella' && sim[k] !== '' && sim[k] !== null && typeof sim[k] !== 'object').map(k => UI.kv(etiqueta(k), typeof sim[k] === 'number' && MONEDA.test(k) ? U.gs(sim[k]) : String(sim[k])));
        U.vaciar(cuerpo);
        let extra = null;
        const extras = cfg.pasoFinal ? cfg.pasoFinal(sim) : [];
        const f2 = UI.formulario({
          enviar: cfg.textoOk || 'Confirmar', campos: extras,
          alEnviar: async (v2, idOp) => {
            const res = await UI.ejecutar(cfg.op, Object.assign({}, p, v2, { huella_simulada: huella }), idOp);
            m.cerrar(); UI.toast(cfg.exito || 'Listo', 'ok'); App.recargar();
          },
        });
        cuerpo.appendChild(h('div', {}, h('h3', {}, 'Resultado de la simulación'), UI.tarjeta({}, filas), extras.length ? null : null, f2.nodo));
      },
    });
    const cuerpo = h('div', {}, cfg.intro ? h('p', { class: 'info' }, cfg.intro) : null, f.nodo);
    m = UI.modal(cfg.titulo, cuerpo);
  }

  App.pantalla('cartera', {
    titulo: 'Cartera de créditos', tab: 'dinero', roles: ['Administrador'],
    render: async (c) => {
      const lista = await Api.leer('obtenerCartera');
      let f = 'Todos';
      const tot = lista.reduce((s, x) => s + x.deuda, 0), venc = lista.reduce((s, x) => s + x.vencido, 0);
      c.appendChild(h('div', { class: 'grid' }, h('div', { class: 'cifra' }, h('div', { class: 'n' }, U.gs(tot)), h('div', { class: 't' }, 'Deuda total (' + lista.length + ' créditos)')), h('div', { class: 'cifra ' + (venc ? 'mal' : '') }, h('div', { class: 'n' }, U.gs(venc)), h('div', { class: 't' }, 'Vencido hoy'))));
      const chips = h('div', { class: 'chips' }), cuerpo = h('div', {});
      ['Todos', 'Vencidos', 'Al día'].forEach(g => chips.appendChild(h('button', { class: 'chip' + (g === f ? ' activo' : ''), onclick: ev => { f = g; chips.querySelectorAll('.chip').forEach(x => x.classList.toggle('activo', x === ev.target)); pintar(); } }, g)));
      function pintar() {
        U.vaciar(cuerpo);
        const l = lista.filter(x => f === 'Todos' || (f === 'Vencidos') === (x.estado_derivado === 'Vencido'));
        if (!l.length) cuerpo.appendChild(UI.vacio('No hay créditos en esta vista.'));
        l.forEach(x => cuerpo.appendChild(UI.fila({ class: 'item clic', onclick: () => App.ir('credito', x.id_credito) },
          h('div', {}, h('div', { class: 'princ' }, x.cliente), h('div', { class: 'sec' }, x.equipo + ' · ' + (x.contacto || '')), h('div', { class: 'sec' }, x.proxima_cuota ? 'Próxima: cuota ' + x.proxima_cuota.nro + ' · ' + U.fecha(x.proxima_cuota.fecha) + ' · ' + U.gs(x.proxima_cuota.saldo) : 'Sin cuotas pendientes')),
          h('div', { class: 'der' }, h('div', { class: 'princ' }, U.gs(x.deuda)), x.estado_derivado === 'Vencido' ? UI.badge('Vencido ' + x.dias_atraso + ' d', 'mal') : UI.badge('Al día', 'ok')))));
      }
      c.appendChild(chips); c.appendChild(cuerpo); pintar();
      const otro = h('div', { class: 'fila-botones' }, UI.boton('Fondo de incobrables', () => App.ir('fondo')), UI.boton('Ingreso excepcional', () => ingresoExcepcional(null)));
      c.appendChild(otro);
    },
  });

  function ingresoExcepcional(idCredito) {
    UI.accion({ titulo: idCredito ? 'Cobro posterior a incobrable' : 'Ingreso excepcional', op: 'registrarIngresoExcepcional', alOk: App.recargar, exito: 'Ingreso registrado',
      intro: idCredito ? 'Dinero recibido después de haber marcado el crédito como incobrable. No reabre el crédito.' : 'Ingreso que no corresponde a una venta ni a un cobro de cuota.',
      campos: [{ n: 'monto', l: 'Monto (Gs.)', t: 'num', req: true, min: 1 }, { n: 'medios', l: 'Medio', t: 'medios', totalDe: 'monto' }, { n: 'motivo', l: 'Motivo (mín. 10 caracteres)', t: 'area', req: true }],
      params: v => Object.assign({ concepto: idCredito ? 'Cobro posterior a incobrable' : 'Ingreso excepcional', id_credito: idCredito || undefined }, v) });
  }

  App.pantalla('credito', {
    titulo: 'Crédito', tab: 'dinero', roles: ['Administrador'],
    render: async (c, id) => {
      const d = await Api.leer('obtenerCredito', { id_credito: id }), k = d.credito;
      App.titulo(k.id_credito + ' · ' + (d.cliente ? d.cliente.nombre : ''));
      const abierto = k.estado === 'Abierto';
      c.appendChild(UI.tarjeta({}, h('div', { class: 'item', style: 'box-shadow:none;padding:0' }, h('div', {}, h('div', { class: 'princ' }, d.cliente ? d.cliente.nombre : ''), h('div', { class: 'sec' }, d.cliente ? d.cliente.contacto : '')), UI.badge(k.estado + (abierto && d.derivado.estado === 'Vencido' ? ' · vencido ' + d.derivado.dias_atraso + ' d' : ''), abierto ? (d.derivado.estado === 'Vencido' ? 'mal' : 'aviso') : 'ok')),
        UI.kv('Precio', U.gs(k.precio)), UI.kv('Entrega inicial', U.gs(k.entrega_inicial)), UI.kv('Cuota', U.gs(k.cuota_monto) + ' × ' + k.cantidad_cuotas + ' (' + k.frecuencia + ')'), UI.kv('Deuda pendiente', U.gs(d.deuda)),
        d.derivado.vencido ? UI.kv('Vencido', U.gs(d.derivado.vencido)) : null, d.saldo_a_favor ? UI.kv('Saldo a favor del cliente', U.gs(d.saldo_a_favor)) : null, UI.kv('Costo de la unidad', U.gs(d.costo_unidad)), UI.kv('Exposición (costo no recuperado)', U.gs(d.exposicion)), UI.kv('Ganancia de equipos asentada', U.gs(d.ganancia_equipos)),
        h('a', { href: '#/equipo/' + k.id_equipo }, 'Ver el equipo ' + k.id_equipo)));
      const acc = [];
      if (abierto) {
        acc.push(UI.boton('Registrar cobro', () => UI.accion({ titulo: 'Registrar cobro', op: 'registrarCobro', alOk: (r) => { App.recargar(); }, exito: 'Cobro registrado',
          intro: d.derivado.vencido ? 'Vencido hoy: ' + U.gs(d.derivado.vencido) + '. Deuda total: ' + U.gs(d.deuda) : 'Deuda total: ' + U.gs(d.deuda),
          campos: [{ n: 'monto_recibido', l: 'Monto recibido (Gs.)', t: 'num', req: true, min: 1 }, { n: 'medios', l: 'Medio de pago', t: 'medios', totalDe: 'monto_recibido' }, { n: 'comentario', l: 'Comentario' }],
          params: v => Object.assign({ id_credito: id, version: k.version, huella_simulada: d.huella }, v) }), 'primario'));
        acc.push(UI.boton('Cancelación anticipada', () => simularLuegoEjecutar({ titulo: 'Cancelación anticipada', simOp: 'simularCancelacion', op: 'cancelarAnticipado', exito: 'Crédito cancelado',
          intro: 'El cliente paga todo lo pendiente de una vez. Podés descontar parte del interés pendiente.',
          campos: [{ n: 'descuento', l: 'Descuento sobre el interés (Gs.)', t: 'num', def: 0 }, { n: 'motivo', l: 'Motivo del descuento (si hay)' }],
          params: v => ({ id_credito: id, version: k.version, descuento: v.descuento || 0, motivo: v.motivo }),
          pasoFinal: sim => [{ n: 'medios', l: 'Cómo paga', t: 'medios', total: sim.paga }] })));
        acc.push(UI.boton('Condonar deuda', () => simularLuegoEjecutar({ titulo: 'Condonar deuda', simOp: 'simularCondonacion', op: 'condonarCredito', exito: 'Deuda condonada', intro: 'Se perdona lo que queda por cobrar. La ganancia de la unidad se ajusta.',
          campos: [{ n: 'motivo', l: 'Motivo (mín. 10 caracteres)', t: 'area', req: true }], params: v => ({ id_credito: id, version: k.version, motivo: v.motivo }) }), 'peligro'));
        acc.push(UI.boton('Marcar como incobrable', () => simularLuegoEjecutar({ titulo: 'Marcar incobrable', simOp: 'simularIncobrable', op: 'marcarIncobrable', exito: 'Marcado incobrable', intro: 'El fondo de incobrables cubre parte de la pérdida.',
          campos: [{ n: 'motivo', l: 'Motivo (mín. 10 caracteres)', t: 'area', req: true }], params: v => ({ id_credito: id, version: k.version, motivo: v.motivo }) }), 'peligro'));
      }
      if (abierto || k.estado === 'Incobrable') acc.push(UI.boton('Recuperar el equipo', () => simularLuegoEjecutar({ titulo: 'Recuperar el equipo', simOp: 'simularRecuperacion', op: 'recuperarEquipo', exito: 'Equipo recuperado', intro: 'El equipo vuelve al inventario como unidad nueva.',
        campos: [{ n: 'motivo', l: 'Motivo (mín. 10 caracteres)', t: 'area', req: true }, { n: 'estimacion_venta', l: 'Estimación de venta del equipo (Gs.)', t: 'num', req: true, min: 1 }, { n: 'motivo_valoracion', l: 'Cómo se estimó el valor', req: true }],
        params: v => ({ id_credito: id, version: k.version, motivo: v.motivo, estimacion_venta: v.estimacion_venta, motivo_valoracion: v.motivo_valoracion }) }), 'peligro'));
      if (k.estado === 'Incobrable') acc.push(UI.boton('Registrar cobro posterior', () => ingresoExcepcional(id)));
      if (d.saldo_a_favor > 0) {
        acc.push(UI.boton('Usar saldo a favor', () => UI.accion({ titulo: 'Usar saldo a favor', op: 'usarSaldoAFavor', alOk: App.recargar, campos: [{ n: 'monto', l: 'Monto (Gs.)', t: 'num', req: true, min: 1, def: d.saldo_a_favor }], params: v => ({ id_credito: id, version: k.version, monto: v.monto }) })));
        acc.push(UI.boton('Dejar saldo a favor (con motivo)', () => UI.accion({ titulo: 'Dejar saldo a favor', op: 'dejarSaldoAFavor', alOk: App.recargar, campos: [{ n: 'motivo', l: 'Motivo (mín. 10 caracteres)', t: 'area', req: true }], params: v => ({ id_credito: id, motivo: v.motivo }) })));
      }
      if (acc.length) c.appendChild(UI.seccion('Acciones', h('div', { class: 'acciones' }, acc)));
      c.appendChild(UI.seccion('Cuotas', UI.tabla([{ l: 'N°', k: 'nro' }, { l: 'Vence', f: q => U.fecha(q.fecha_vencimiento) }, { l: 'Monto', num: true, f: q => U.n(q.monto) }, { l: 'Cubierto', num: true, f: q => U.n(q.cubierto) }], d.cuotas)));
      const revertidos = {}; d.cobros.forEach(x => { if (x.id_cobro_revertido) revertidos[x.id_cobro_revertido] = true; });
      c.appendChild(UI.seccion('Cobros', d.cobros.length ? d.cobros.slice().reverse().map(x => UI.tarjeta({}, h('div', { class: 'item', style: 'box-shadow:none;padding:0' }, h('div', {}, h('div', { class: 'princ' }, U.gs(x.monto_recibido) + (x.tipo && x.tipo !== 'Cobro' ? ' · ' + x.tipo : '')), h('div', { class: 'sec' }, U.fecha(x.fecha_hora) + ' · ' + x.medio + ' · ' + x.responsable)),
        abierto && x.tipo === 'Cobro' && !revertidos[x.id_cobro] ? UI.boton('Reversar', () => simularLuegoEjecutar({ titulo: 'Reversar cobro ' + x.id_cobro, simOp: 'simularReversa', op: 'reversarCobro', exito: 'Cobro reversado', intro: 'Anula este cobro con un movimiento inverso. Solo para errores de carga.',
          campos: [{ n: 'motivo', l: 'Motivo (obligatorio)', t: 'area', req: true }], params: v => ({ id_cobro: x.id_cobro, motivo: v.motivo }), pasoFinal: () => [] }), 'chico') : (revertidos[x.id_cobro] ? UI.badge('Reversado', 'mal') : null)))) : UI.vacio('Sin cobros todavía.')));
      if (d.eventos && d.eventos.length) c.appendChild(UI.seccion('Eventos', UI.tabla([{ l: 'Fecha', f: x => U.fecha(x.fecha_hora) }, { l: 'Evento', k: 'tipo' }, { l: 'Motivo', k: 'motivo' }], d.eventos)));
    },
  });

  App.pantalla('fondo', {
    titulo: 'Fondo de incobrables', tab: 'dinero', roles: ['Administrador'],
    render: async (c) => {
      const f = await Api.leer('obtenerFondo');
      c.appendChild(h('div', { class: 'grid' }, h('div', { class: 'cifra' }, h('div', { class: 'n' }, U.gs(f.saldo)), h('div', { class: 't' }, 'Saldo del fondo')), h('div', { class: 'cifra' }, h('div', { class: 'n' }, U.gs(f.exposicion)), h('div', { class: 't' }, 'Exposición de la cartera')), h('div', { class: 'cifra' }, h('div', { class: 'n' }, f.cobertura_pct === null ? '–' : f.cobertura_pct + ' %'), h('div', { class: 't' }, 'Cobertura'))));
      c.appendChild(UI.seccion('Movimientos', UI.tabla([{ l: 'Fecha', f: x => U.fecha(x.fecha_hora) }, { l: 'Motivo', k: 'motivo' }, { l: 'Monto', num: true, f: x => U.n(x.monto) }, { l: 'Saldo', num: true, f: x => U.n(x.saldo_posterior) }], f.movimientos)));
    },
  });
})();
