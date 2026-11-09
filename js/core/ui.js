// GESTION_CELULARES - ui.js : componentes (modal, formularios, medios de pago, listas)
const UI = (() => {
  const h = U.h;
  const capas = () => document.getElementById('capas');

  function toast(msg, tipo) {
    const t = h('div', { class: 'toast ' + (tipo || '') }, msg);
    capas().appendChild(t); setTimeout(() => t.classList.add('visible'), 10);
    setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, tipo === 'error' ? 5000 : 2500);
  }

  function modal(titulo, contenido, opciones) {
    const fondo = h('div', { class: 'fondo' });
    const hoja = h('div', { class: 'hoja' },
      h('div', { class: 'hoja-cab' }, h('strong', {}, titulo), h('button', { class: 'icono', onclick: cerrar, 'aria-label': 'Cerrar' }, '×')),
      h('div', { class: 'hoja-cuerpo' }, contenido));
    fondo.appendChild(hoja);
    fondo.addEventListener('click', e => { if (e.target === fondo) cerrar(); });
    capas().appendChild(fondo); document.body.classList.add('con-modal');
    function cerrar() { fondo.remove(); if (!capas().querySelector('.fondo')) document.body.classList.remove('con-modal'); if (opciones && opciones.alCerrar) opciones.alCerrar(); }
    return { cerrar, hoja };
  }

  function confirmar(msg, textoOk) {
    return new Promise(res => {
      let m;
      const cuerpo = h('div', {}, h('p', {}, msg), h('div', { class: 'fila-botones' },
        h('button', { class: 'btn', onclick: () => { m.cerrar(); res(false); } }, 'Cancelar'),
        h('button', { class: 'btn primario', onclick: () => { m.cerrar(); res(true); } }, textoOk || 'Confirmar')));
      m = modal('Confirmar', cuerpo, { alCerrar: () => res(false) });
    });
  }

  function badge(texto, tipo) { return h('span', { class: 'badge ' + (tipo || '') }, texto); }
  function kv(k, v) { return h('div', { class: 'kv' }, h('span', { class: 'k' }, k), h('span', { class: 'v' }, v === undefined || v === null || v === '' ? '–' : v)); }
  function cargando() { return h('p', { class: 'cargando' }, 'Cargando…'); }
  function vacio(t) { return h('p', { class: 'vacio' }, t || 'No hay datos.'); }
  function errorBox(e, reintentar) {
    return h('div', { class: 'errorbox' }, h('p', {}, e.message || String(e)), reintentar ? h('button', { class: 'btn', onclick: reintentar }, 'Reintentar') : null);
  }
  function seccion(titulo, ...hijos) { return h('section', { class: 'seccion' }, titulo ? h('h2', {}, titulo) : null, ...hijos); }
  function tarjeta(props, ...hijos) { return h('div', Object.assign({ class: 'tarjeta' }, props), ...hijos); }
  function fila(props, ...hijos) { return h('div', Object.assign({ class: 'item' }, props), ...hijos); }
  function botones(...bs) { return h('div', { class: 'fila-botones' }, ...bs); }
  function boton(texto, onclick, clase) { return h('button', { class: 'btn ' + (clase || ''), onclick, type: 'button' }, texto); }

  // ---------- Formularios ----------
  function opcionesDe(opts) { return (opts || []).map(o => typeof o === 'string' ? { v: o, l: o } : o); }

  function campoMedios(def, obtenerTotal) {
    const medios = (App.config && App.config.medios_pago ? String(App.config.medios_pago).split(',').map(s => s.trim()).filter(Boolean) : ['Efectivo']);
    const filas = [], cont = h('div', { class: 'medios' }), estado = h('div', { class: 'medios-estado' });
    function agregar(montoIni, medioIni) {
      const sel = h('select', {}, medios.map(m => h('option', { value: m }, m)));
      if (medioIni) sel.value = medioIni;
      const inp = h('input', { type: 'text', inputmode: 'numeric', placeholder: 'Monto', value: montoIni === undefined ? '' : U.n(montoIni) });
      inp.addEventListener('input', actualizar);
      const quitar = h('button', { type: 'button', class: 'icono', onclick: () => { if (filas.length > 1) { filas.splice(filas.indexOf(f), 1); r.remove(); actualizar(); } } }, '×');
      const r = h('div', { class: 'fila-medio' }, sel, inp, quitar), f = { sel, inp, r };
      filas.push(f); cont.appendChild(r); actualizar();
    }
    function suma() { return filas.reduce((s, f) => { const v = U.entero(f.inp.value || 0); return s + (isNaN(v) ? 0 : v); }, 0); }
    function actualizar() {
      const t = obtenerTotal ? obtenerTotal() : null;
      if (t === null || t === undefined || isNaN(t)) { estado.textContent = 'Total: ' + U.gs(suma()); estado.className = 'medios-estado'; return; }
      const d = t - suma();
      estado.textContent = d === 0 ? 'Total ' + U.gs(t) + ' ✓' : (d > 0 ? 'Falta repartir ' + U.gs(d) : 'Se pasa por ' + U.gs(-d));
      estado.className = 'medios-estado ' + (d === 0 ? 'ok' : 'mal');
    }
    function auto() { // con un solo medio, el monto sigue al total
      const t = obtenerTotal ? obtenerTotal() : null;
      if (filas.length === 1 && t !== null && !isNaN(t)) filas[0].inp.value = t ? U.n(t) : '';
      actualizar();
    }
    agregar();
    const mas = h('button', { type: 'button', class: 'btn chico', onclick: () => { const t = obtenerTotal ? obtenerTotal() : NaN; agregar(isNaN(t) ? undefined : Math.max(0, t - suma())); } }, '+ Dividir en otro medio');
    return {
      nodo: h('div', { class: 'campo' }, h('label', {}, def.l || 'Medio de pago'), cont, mas, estado),
      valor() { return filas.map(f => ({ medio: f.sel.value, monto: U.entero(f.inp.value || 0) })).filter(x => x.monto !== 0); },
      refrescar: auto, actualizar,
    };
  }

  function formulario(def) {
    const campos = {}, nodo = h('form', { class: 'form', novalidate: true }), idOp = U.idOp();
    const error = h('p', { class: 'error', hidden: true });
    const obtenerNum = nombre => () => { const c = campos[nombre]; if (!c) return NaN; const v = c.valor(); return v === '' ? NaN : v; };
    for (const d of def.campos) {
      let c;
      if (d.t === 'oculto') { campos[d.n] = { valor: () => d.def, nodo: null, d }; continue; }
      if (d.t === 'info') { nodo.appendChild(h('p', { class: 'info' }, d.l)); continue; }
      if (d.t === 'medios') {
        const total = d.totalDe ? obtenerNum(d.totalDe) : (typeof d.total === 'function' ? d.total : () => d.total);
        c = campoMedios(d, total); c.d = d; campos[d.n] = c; nodo.appendChild(c.nodo); continue;
      }
      let input;
      if (d.t === 'area') input = h('textarea', { rows: 3, placeholder: d.ph || '' });
      else if (d.t === 'select') input = h('select', {}, (d.req ? [] : [h('option', { value: '' }, '— elegir —')]).concat(opcionesDe(d.opts).map(o => h('option', { value: o.v }, o.l))));
      else if (d.t === 'check') input = h('input', { type: 'checkbox' });
      else if (d.t === 'fecha') input = h('input', { type: 'date' });
      else if (d.t === 'num') input = h('input', { type: 'text', inputmode: 'numeric', placeholder: d.ph || '0' });
      else if (d.t === 'archivo') input = h('input', { type: 'file', accept: 'image/*' });
      else input = h('input', { type: d.t === 'pin' ? 'password' : 'text', inputmode: d.t === 'pin' ? 'numeric' : (d.t === 'tel' ? 'tel' : null), placeholder: d.ph || '', autocomplete: 'off' });
      if (d.def !== undefined && d.def !== null && d.t !== 'check') input.value = d.t === 'num' && d.def !== '' ? U.n(d.def) : d.def;
      if (d.t === 'check' && d.def) input.checked = true;
      if (d.t === 'num') input.addEventListener('input', () => { const v = U.entero(input.value); if (!isNaN(v) && input.value.replace(/\./g, '') !== '' && input.value !== '-') { const pos = input.value.length; input.value = U.n(v); } });
      c = {
        d, input,
        valor() {
          if (d.t === 'check') return input.checked;
          if (d.t === 'num') { const t = input.value.trim(); return t === '' ? '' : U.entero(t); }
          return input.value.trim();
        },
        nodo: h('div', { class: 'campo' + (d.t === 'check' ? ' check' : '') }, d.t === 'check' ? h('label', {}, input, ' ' + d.l) : [h('label', {}, d.l + (d.req ? ' *' : '')), input], d.ayuda ? h('small', {}, d.ayuda) : null),
      };
      campos[d.n] = c; nodo.appendChild(c.nodo);
    }
    // los medios se recalculan cuando cambia el campo del que dependen
    for (const d of def.campos) if (d.t === 'medios' && d.totalDe && campos[d.totalDe] && campos[d.totalDe].input) {
      campos[d.totalDe].input.addEventListener('input', () => campos[d.n].refrescar());
      campos[d.n].refrescar();
    }
    if (def.alCambiar) nodo.addEventListener('input', () => def.alCambiar(valores(true), campos));
    function valores(sinValidar) {
      const v = {};
      for (const n in campos) v[n] = campos[n].valor();
      return v;
    }
    function validar(v) {
      for (const d of def.campos) {
        if (d.t === 'oculto' || d.t === 'info') continue;
        const x = v[d.n];
        if (d.t === 'medios') { if (d.req !== false && (!x || !x.length)) return 'Indique el medio de pago'; continue; }
        if (d.req && (x === '' || x === null || x === undefined)) return 'Complete: ' + d.l;
        if (d.t === 'num' && x !== '' && isNaN(x)) return d.l + ' debe ser un número entero';
        if (d.min !== undefined && x !== '' && x < d.min) return d.l + ' debe ser al menos ' + d.min;
      }
      return null;
    }
    const btn = h('button', { type: 'submit', class: 'btn primario' }, def.enviar || 'Guardar');
    nodo.appendChild(error); nodo.appendChild(btn);
    nodo.addEventListener('submit', async ev => {
      ev.preventDefault();
      const v = valores(); const e = validar(v);
      if (e) { error.textContent = e; error.hidden = false; return; }
      error.hidden = true; btn.disabled = true; const t0 = btn.textContent; btn.textContent = 'Guardando…';
      try { await def.alEnviar(v, idOp); }
      catch (err) { error.textContent = err.message || String(err); error.hidden = false; }
      finally { btn.disabled = false; btn.textContent = t0; }
    });
    return { nodo, valores, campos, idOp };
  }

  // Escritura con manejo del aviso de duplicado
  async function ejecutar(op, params, idOp) {
    try { return await Api.escribir(op, params, idOp); }
    catch (e) {
      if (e.codigo === 'duplicado' || /posible duplicado/i.test(e.message)) {
        const si = await confirmar(e.message + ' ¿Es otro movimiento distinto y querés registrarlo igual?', 'Registrar igual');
        if (si) return Api.escribir(op, Object.assign({}, params, { confirmar_duplicado: true }), idOp);
        throw new Error('Cancelado: no se registró.');
      }
      if (e.codigo === 'confirmar') {
        const si = await confirmar(e.message, 'Confirmar');
        if (si) return Api.escribir(op, Object.assign({}, params, { confirmar_similar: true, confirmar_variacion: true }), idOp);
        throw new Error('Cancelado: no se guardó.');
      }
      throw e;
    }
  }

  // Abre un modal con un formulario que ejecuta una operacion
  function accion(cfg) {
    let m;
    const f = formulario({
      campos: cfg.campos || [], enviar: cfg.enviar || 'Confirmar', alCambiar: cfg.alCambiar,
      alEnviar: async (v, idOp) => {
        const p = cfg.params ? cfg.params(v) : v;
        const res = await ejecutar(cfg.op, p, idOp);
        m.cerrar(); toast(cfg.exito || 'Listo', 'ok');
        if (cfg.alOk) cfg.alOk(res, v);
      },
    });
    const cuerpo = h('div', {}, cfg.intro ? h('p', { class: 'info' }, cfg.intro) : null, f.nodo);
    m = modal(cfg.titulo, cuerpo);
    return f;
  }

  function tabla(columnas, filas) {
    return h('div', { class: 'tabla-cont' }, h('table', { class: 'tabla' },
      h('thead', {}, h('tr', {}, columnas.map(c => h('th', { class: c.num ? 'num' : '' }, c.l)))),
      h('tbody', {}, filas.map(f => h('tr', {}, columnas.map(c => h('td', { class: c.num ? 'num' : '' }, c.f ? c.f(f) : f[c.k])))))));
  }

  // Foto -> reduce a ~1200px y devuelve base64 (JPEG)
  function leerFoto(archivo) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onerror = () => rej(new Error('No se pudo leer la foto'));
      r.onload = () => {
        const img = new Image();
        img.onerror = () => rej(new Error('La foto no es una imagen válida'));
        img.onload = () => {
          const k = Math.min(1, 1200 / Math.max(img.width, img.height)), c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          res({ base64: c.toDataURL('image/jpeg', 0.75).split(',')[1], mime: 'image/jpeg' });
        };
        img.src = r.result;
      };
      r.readAsDataURL(archivo);
    });
  }

  return { toast, modal, confirmar, badge, kv, cargando, vacio, errorBox, seccion, tarjeta, fila, botones, boton, formulario, ejecutar, accion, tabla, leerFoto };
})();
