// GESTION_CELULARES - taller.js : cola, trabajos, tarifas del tecnico (eleccion, aprobacion, catalogo)
(() => {
  const h = U.h;
  const ESTADOS_TALLER = ['Recibido', 'En diagnóstico', 'En reparación', 'Esperando repuestos', 'Reparado', 'En pruebas', 'Desarmado para repuestos'];
  const OTRO = 'TRB-OTRO';

  App.pantalla('taller', {
    titulo: 'Taller', roles: ['Administrador', 'Técnico', 'Comprador', 'Soporte de garantía'],
    render: async (c) => {
      const menu = [];
      if (App.tieneRol('Administrador', 'Técnico')) menu.push(UI.boton('Mis trabajos', () => App.ir('mis-trabajos')));
      if (App.esAdmin()) menu.push(UI.boton('Tarifas por aprobar', () => App.ir('tarifas')), UI.boton('Catálogo de trabajos', () => App.ir('tarifas-catalogo')));
      if (App.tieneRol('Administrador', 'Técnico', 'Comprador')) menu.push(UI.boton('Repuestos', () => App.ir('repuestos')));
      if (App.tieneRol('Administrador', 'Técnico', 'Soporte de garantía')) menu.push(UI.boton('Órdenes de servicio', () => App.ir('ordenes')));
      if (menu.length) c.appendChild(h('div', { class: 'grid' }, menu));
      const lista = await Api.leer('obtenerEquipos');
      ESTADOS_TALLER.forEach(est => {
        const l = lista.filter(e => e.estado === est);
        if (!l.length) return;
        c.appendChild(UI.seccion(est + ' (' + l.length + ')', l.map(e => UI.fila({ class: 'item clic', onclick: () => App.ir('equipo', e.id_equipo) }, h('div', {}, h('div', { class: 'princ' }, e.marca + ' ' + e.modelo), h('div', { class: 'sec' }, e.id_equipo + ' · ' + (e.imei || e.numero_serie || ''))), UI.badge(est)))));
      });
      if (!lista.some(e => ESTADOS_TALLER.indexOf(e.estado) >= 0)) c.appendChild(UI.vacio('No hay equipos en el taller.'));
    },
  });

  // Selector de trabajos del catalogo (checkbox + detalle). inicial: [{id_trabajo, detalle}]
  function selectorTrabajos(tarifas, inicial) {
    const filas = [], cont = h('div', {});
    const act = tarifas.filter(t => t.activo === 'Sí');
    act.forEach(t => {
      const marcado = (inicial || []).find(x => x.id_trabajo === t.id_trabajo);
      const chk = h('input', { type: 'checkbox' }); chk.checked = !!marcado;
      const det = h('input', { type: 'text', placeholder: t.id_trabajo === OTRO ? 'Detalle del trabajo (obligatorio)' : (t.exige_detalle === 'Sí' ? 'Detalle (obligatorio)' : 'Detalle (opcional)'), value: marcado ? marcado.detalle || '' : '' });
      det.hidden = !chk.checked; chk.addEventListener('change', () => { det.hidden = !chk.checked; });
      cont.appendChild(h('div', { class: 'tarjeta' }, h('label', { style: 'display:flex;gap:8px;align-items:center' }, chk, h('span', {}, t.nombre_trabajo + (t.id_trabajo === OTRO ? '' : ' · ' + U.gs(t.monto)))), det));
      filas.push({ t, chk, det });
    });
    return { nodo: cont, valor: () => filas.filter(f => f.chk.checked).map(f => ({ id_tarifa: f.t.id_tarifa, detalle: f.det.value.trim() })) };
  }

  // Repuestos usados: stock propio (select) o comprados (solo Administrador)
  function selectorRepuestos(repuestos) {
    const filas = [], cont = h('div', {});
    function agregar() {
      const sel = h('select', {}, [h('option', { value: '' }, '— repuesto del stock —')].concat(repuestos.filter(r => r.activo !== 'No').map(r => h('option', { value: r.id_repuesto }, r.nombre + ' (stock ' + r.stock_actual + ')'))));
      const cant = h('input', { type: 'text', inputmode: 'numeric', placeholder: 'Cantidad', value: '1' });
      const est = h('select', {}, ['Usado', 'Descartado'].map(x => h('option', { value: x }, x === 'Descartado' ? 'Descartado (se rompió)' : x)));
      const r = h('div', { class: 'tarjeta' }, sel, h('div', { class: 'grid' }, cant, est), h('button', { type: 'button', class: 'btn chico', onclick: () => { filas.splice(filas.indexOf(f), 1); r.remove(); } }, 'Quitar'));
      const f = { sel, cant, est }; filas.push(f); cont.appendChild(r);
    }
    return { nodo: h('div', {}, cont, h('button', { type: 'button', class: 'btn chico', onclick: agregar }, '+ Agregar repuesto')), valor: () => filas.filter(f => f.sel.value).map(f => ({ id_repuesto: f.sel.value, cantidad: U.entero(f.cant.value), estado: f.est.value })) };
  }

  App.pantalla('mis-trabajos', {
    titulo: 'Mis trabajos', tab: 'taller', roles: ['Administrador', 'Técnico'],
    render: async (c) => {
      const reps = await Api.leer('obtenerReparaciones');
      const mias = reps.filter(x => App.esAdmin() || x.reparacion.tecnico_email === App.usuario.email);
      const abiertas = mias.filter(x => !x.reparacion.fecha_fin), devueltas = mias.filter(x => x.reparacion.estado_tarifa === 'Devuelta'), pend = mias.filter(x => x.reparacion.estado_tarifa === 'Pendiente de aprobación');
      const tarj = (x, boton) => { const r = x.reparacion; return UI.tarjeta({}, h('div', { class: 'princ' }, r.id_reparacion + ' · ' + (x.equipo ? x.equipo.marca + ' ' + x.equipo.modelo : 'Orden ' + r.id_orden)), h('div', { class: 'sec' }, r.tecnico + ' · inició ' + U.fecha(r.fecha_inicio)), boton); };
      c.appendChild(UI.seccion('En curso', abiertas.length ? abiertas.map(x => tarj(x, UI.boton('Completar', () => App.ir('completar-reparacion', x.reparacion.id_reparacion), 'primario'))) : UI.vacio('No hay trabajos en curso.')));
      if (devueltas.length) c.appendChild(UI.seccion('Devueltas para corregir', devueltas.map(x => tarj(x, h('div', {}, h('p', { class: 'aviso' }, x.motivo_devolucion || 'La Administración devolvió la tarifa.'), UI.boton('Corregir trabajos', () => App.ir('corregir-trabajos', x.reparacion.id_reparacion), 'primario'))))));
      c.appendChild(UI.seccion('Esperando aprobación', pend.length ? pend.map(x => tarj(x, UI.badge('Total provisional ' + U.gs(x.total_elegido), 'aviso'))) : UI.vacio('Nada pendiente de aprobación.')));
    },
  });

  App.pantalla('completar-reparacion', {
    titulo: 'Completar trabajo', tab: 'taller', roles: ['Administrador', 'Técnico'],
    render: async (c, id) => {
      const [reps, tarifas, repuestos] = await Promise.all([Api.leer('obtenerReparaciones'), Api.leer('obtenerTarifas'), Api.leer('obtenerRepuestos')]);
      const x = reps.find(y => y.reparacion.id_reparacion === id); if (!x) throw new Error('No se encontró el trabajo');
      const r = x.reparacion; App.titulo('Completar ' + r.id_reparacion);
      c.appendChild(UI.tarjeta({}, h('div', { class: 'princ' }, x.equipo ? x.equipo.marca + ' ' + x.equipo.modelo : 'Orden ' + r.id_orden), h('div', { class: 'sec' }, r.origen)));
      const selT = selectorTrabajos(tarifas, []), selR = selectorRepuestos(repuestos);
      const f = UI.formulario({
        enviar: 'Terminar trabajo',
        campos: [{ n: 'resultado', l: 'Resultado', t: 'select', opts: ['Exitoso', 'Reparado parcialmente', 'No reparado'], req: true, def: 'Exitoso' },
          { n: 'motivo_resultado', l: 'Motivo (obligatorio si no fue exitoso)', t: 'area' },
          { n: 'destino', l: 'Si no fue exitoso: a dónde va la unidad', t: 'select', opts: ['En reparación', 'Esperando repuestos', 'Desarmado para repuestos'] },
          { n: 'tiempo_invertido_min', l: 'Minutos invertidos', t: 'num' }, { n: 'comentario', l: 'Comentario', t: 'area' }],
        alEnviar: async (v, idOp) => {
          const trabajos = selT.valor(); if (!trabajos.length) throw new Error('Elegí al menos un trabajo hecho.');
          const p = { id_reparacion: id, version: r.version, resultado: v.resultado, motivo_resultado: v.motivo_resultado, tiempo_invertido_min: v.tiempo_invertido_min, comentario: v.comentario, trabajos, repuestos: selR.valor() };
          if (v.resultado !== 'Exitoso' && v.destino) p.destino = v.destino;
          const res = await UI.ejecutar('completarReparacion', p, idOp);
          UI.toast('Trabajo terminado. Total provisional ' + U.gs(res.total_provisional) + ' (pendiente de aprobación)', 'ok'); App.ir('mis-trabajos');
        },
      });
      c.appendChild(UI.seccion('Trabajos hechos', selT.nodo)); c.appendChild(UI.seccion('Repuestos usados', selR.nodo)); c.appendChild(UI.seccion('Cierre', f.nodo));
    },
  });

  App.pantalla('corregir-trabajos', {
    titulo: 'Corregir trabajos', tab: 'taller', roles: ['Administrador', 'Técnico'],
    render: async (c, id) => {
      const [reps, tarifas] = await Promise.all([Api.leer('obtenerReparaciones'), Api.leer('obtenerTarifas')]);
      const x = reps.find(y => y.reparacion.id_reparacion === id); if (!x) throw new Error('No se encontró el trabajo');
      c.appendChild(h('p', { class: 'aviso' }, 'La Administración devolvió esta tarifa. Elegí de nuevo los trabajos realmente hechos.'));
      const ult = x.trabajos.filter(t => t.etapa === 'Elegido' && String(t.ronda) === String(x.reparacion.ronda_tarifa));
      const sel = selectorTrabajos(tarifas, ult.map(t => ({ id_trabajo: t.id_trabajo, detalle: t.detalle })));
      c.appendChild(sel.nodo);
      c.appendChild(UI.boton('Enviar corrección', async () => {
        try { const t = sel.valor(); if (!t.length) throw new Error('Elegí al menos un trabajo'); await UI.ejecutar('corregirTrabajosReparacion', { id_reparacion: id, trabajos: t }, U.idOp()); UI.toast('Enviado a aprobación', 'ok'); App.ir('mis-trabajos'); } catch (e) { UI.toast(e.message, 'error'); }
      }, 'primario'));
    },
  });

  // ---------- Administracion: aprobar ----------
  App.pantalla('tarifas', {
    titulo: 'Tarifas por aprobar', tab: 'taller', roles: ['Administrador'],
    render: async (c) => {
      const reps = (await Api.leer('obtenerReparaciones')).filter(x => x.reparacion.estado_tarifa === 'Pendiente de aprobación');
      if (!reps.length) { c.appendChild(UI.vacio('No hay tarifas por aprobar.')); return; }
      reps.forEach(x => { const r = x.reparacion; c.appendChild(UI.fila({ class: 'item clic', onclick: () => App.ir('aprobar', r.id_reparacion) },
        h('div', {}, h('div', { class: 'princ' }, r.id_reparacion + ' · ' + (x.equipo ? x.equipo.marca + ' ' + x.equipo.modelo : 'Orden ' + r.id_orden)), h('div', { class: 'sec' }, r.tecnico + ' · terminó ' + U.fecha(r.fecha_fin) + (x.dias_pendiente ? ' · ' + x.dias_pendiente + ' días' : ''))),
        h('div', { class: 'der' }, h('div', { class: 'princ' }, U.gs(x.total_elegido)), UI.badge(r.resultado, r.resultado === 'Exitoso' ? 'ok' : 'aviso')))); });
    },
  });

  App.pantalla('aprobar', {
    titulo: 'Aprobar tarifa', tab: 'taller', roles: ['Administrador'],
    render: async (c, id) => {
      const [reps, tarifas] = await Promise.all([Api.leer('obtenerReparaciones'), Api.leer('obtenerTarifas')]);
      const x = reps.find(y => y.reparacion.id_reparacion === id); if (!x) throw new Error('No se encontró la reparación');
      const r = x.reparacion; App.titulo('Aprobar ' + r.id_reparacion);
      c.appendChild(UI.tarjeta({}, h('div', { class: 'princ' }, x.equipo ? x.equipo.marca + ' ' + x.equipo.modelo : 'Orden ' + r.id_orden), UI.kv('Técnico', r.tecnico), UI.kv('Resultado', r.resultado + (r.motivo_resultado ? ' · ' + r.motivo_resultado : '')), UI.kv('Minutos', r.tiempo_invertido_min), x.usos.map(u => UI.kv('Repuesto · ' + u.descripcion + ' ×' + u.cantidad, U.gs(u.costo_total_aplicado)))));
      if (r.tecnico_email === App.usuario.email) c.appendChild(h('p', { class: 'aviso' }, 'Es su propio trabajo: lo debe aprobar otro Administrador.'));
      const elegidas = x.trabajos.filter(t => t.etapa === 'Elegido' && String(t.ronda) === String(r.ronda_tarifa));
      const lineas = elegidas.map(t => { const chk = h('input', { type: 'checkbox' }); chk.checked = true; const det = h('input', { type: 'text', value: t.detalle || '', placeholder: 'Detalle' }); const monto = t.id_trabajo === OTRO ? h('input', { type: 'text', inputmode: 'numeric', value: U.n(t.monto), placeholder: 'Monto (Gs.)' }) : null; return { t, chk, det, monto }; });
      const listaEl = h('div', {}, lineas.map(l => h('div', { class: 'tarjeta' }, h('label', { style: 'display:flex;gap:8px;align-items:center' }, l.chk, h('strong', {}, l.t.nombre_trabajo), h('span', {}, l.t.id_trabajo === OTRO ? '' : ' · ' + U.gs(l.t.monto))), l.det, l.monto)));
      const extra = []; const extraCont = h('div', {});
      const selAdd = h('select', {}, [h('option', { value: '' }, '+ Agregar un trabajo que no se eligió…')].concat(tarifas.filter(t => t.activo === 'Sí' && !elegidas.some(e => e.id_trabajo === t.id_trabajo)).map(t => h('option', { value: t.id_tarifa }, t.nombre_trabajo + (t.id_trabajo === OTRO ? '' : ' · ' + U.gs(t.monto))))));
      selAdd.addEventListener('change', () => {
        const t = tarifas.find(y => y.id_tarifa === selAdd.value); if (!t) return;
        const det = h('input', { type: 'text', placeholder: 'Detalle' }), monto = t.id_trabajo === OTRO ? h('input', { type: 'text', inputmode: 'numeric', placeholder: 'Monto (Gs.)' }) : null;
        const fila = { t, det, monto }; extra.push(fila);
        const nodo = h('div', { class: 'tarjeta' }, h('strong', {}, 'Agregado: ' + t.nombre_trabajo), det, monto, h('button', { type: 'button', class: 'btn chico', onclick: () => { extra.splice(extra.indexOf(fila), 1); nodo.remove(); } }, 'Quitar'));
        extraCont.appendChild(nodo); selAdd.value = '';
      });
      const f = UI.formulario({
        enviar: 'Aprobar tarifa',
        campos: [{ n: 'motivo', l: 'Motivo (obligatorio si cambia lo elegido, o si es una repetición)', t: 'area' }, { n: 'clasificacion_repeticion', l: 'Si el trabajo se repite en esta unidad: clasificación', t: 'select', opts: ['Intervención nueva', 'Garantía o retrabajo', 'Corrección de registro'] }],
        alEnviar: async (v, idOp) => {
          const trabajos = lineas.filter(l => l.chk.checked).map(l => { const o = { id_rt_origen: l.t.id_rt, detalle: l.det.value.trim() }; if (l.monto) o.monto = U.entero(l.monto.value); return o; })
            .concat(extra.map(e => { const o = { id_tarifa: e.t.id_tarifa, detalle: e.det.value.trim() }; if (e.monto) o.monto = U.entero(e.monto.value); return o; }));
          const res = await UI.ejecutar('aprobarTarifaReparacion', { id_reparacion: id, version: r.version, trabajos_aprobados: trabajos, motivo: v.motivo, clasificacion_repeticion: v.clasificacion_repeticion }, idOp);
          UI.toast(res.aviso || 'Tarifa aprobada: ' + U.gs(res.total_aprobado), res.aviso ? 'error' : 'ok'); App.ir('tarifas');
        },
      });
      c.appendChild(UI.seccion('Trabajos que hizo el técnico', listaEl, selAdd, extraCont));
      c.appendChild(f.nodo);
      c.appendChild(UI.boton('Devolver al técnico para que corrija', () => UI.accion({ titulo: 'Devolver tarifa', op: 'devolverTarifaReparacion', alOk: () => App.ir('tarifas'), exito: 'Devuelta al técnico',
        campos: [{ n: 'motivo', l: 'Qué debe corregir (mín. 10 caracteres)', t: 'area', req: true }], params: v => ({ id_reparacion: id, motivo: v.motivo }) }), 'peligro'));
    },
  });

  App.pantalla('corregir-aprobada', {
    titulo: 'Corregir tarifa aprobada', tab: 'taller', roles: ['Administrador'],
    render: async (c, id) => {
      const [reps, tarifas] = await Promise.all([Api.leer('obtenerReparaciones'), Api.leer('obtenerTarifas')]);
      const x = reps.find(y => y.reparacion.id_reparacion === id); if (!x) throw new Error('No se encontró la reparación');
      c.appendChild(h('p', { class: 'info' }, 'Una tarifa aprobada no se edita: se registra un ajuste (positivo o negativo) en la unidad y en los costos del técnico, en el mes actual.'));
      const ap = x.trabajos.filter(t => t.etapa === 'Aprobado' || t.etapa === 'Corregido').slice(-20);
      c.appendChild(UI.tarjeta({}, ap.map(t => UI.kv(t.etapa + ' · ' + t.nombre_trabajo, U.gs(t.monto)))));
      const sel = selectorTrabajos(tarifas, []);
      c.appendChild(UI.seccion('Trabajos correctos (reemplazan a los aprobados)', sel.nodo));
      const f = UI.formulario({ enviar: 'Registrar corrección', campos: [{ n: 'motivo', l: 'Motivo (mín. 10 caracteres)', t: 'area', req: true }],
        alEnviar: async (v, idOp) => { const t = sel.valor(); if (!t.length) throw new Error('Elegí los trabajos correctos'); const res = await UI.ejecutar('corregirTarifaAprobada', { id_reparacion: id, motivo: v.motivo, trabajos: t }, idOp); UI.toast('Ajuste de ' + U.gs(res.diferencia) + ' registrado', 'ok'); App.ir('taller'); } });
      c.appendChild(f.nodo);
    },
  });

  App.pantalla('tarifas-catalogo', {
    titulo: 'Catálogo de trabajos', tab: 'taller', roles: ['Administrador'],
    render: async (c) => {
      const t = (await Api.leer('obtenerTarifas')).filter(x => x.activo === 'Sí' && x.id_trabajo !== OTRO);
      const form = (x) => UI.accion({ titulo: x ? 'Nueva versión de ' + x.nombre_trabajo : 'Nuevo trabajo', op: 'guardarTarifa', alOk: App.recargar,
        campos: [{ n: 'nombre_trabajo', l: 'Nombre del trabajo', req: true, def: x ? x.nombre_trabajo : '' }, { n: 'monto', l: 'Tarifa (Gs.)', t: 'num', req: true, min: 1, def: x ? x.monto : '' }, { n: 'exige_detalle', l: 'Exigir detalle al elegirlo', t: 'check', def: x ? x.exige_detalle === 'Sí' : false },
          { n: 'motivo', l: x ? 'Motivo del cambio' : 'Notas', req: !!x }], params: v => Object.assign({ id_trabajo: x ? x.id_trabajo : undefined }, v) });
      c.appendChild(UI.boton('+ Nuevo trabajo', () => form(null), 'primario'));
      c.appendChild(UI.seccion('Trabajos activos', t.length ? t.map(x => UI.fila({}, h('div', {}, h('div', { class: 'princ' }, x.nombre_trabajo), h('div', { class: 'sec' }, x.id_trabajo + ' · desde ' + U.fecha(x.vigente_desde))), h('div', { class: 'der' }, h('div', { class: 'princ' }, U.gs(x.monto)), h('div', {}, UI.boton('Cambiar', () => form(x), 'chico'), ' ', UI.boton('Quitar', () => UI.accion({ titulo: 'Quitar del catálogo', op: 'desactivarTarifa', alOk: App.recargar, campos: [{ n: 'motivo', l: 'Motivo', req: true }], params: v => ({ id_trabajo: x.id_trabajo, motivo: v.motivo }) }), 'chico'))))) : UI.vacio('El catálogo está vacío. Creá los trabajos que cobra el técnico.')));
    },
  });
})();
