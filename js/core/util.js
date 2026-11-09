// GESTION_CELULARES - util.js : helpers de DOM y formato (sin dependencias)
const U = {
  h(tag, props, ...hijos) {
    const e = document.createElement(tag);
    for (const k in (props || {})) {
      const v = props[k];
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'value') e.value = v;
      else if (v === true) e.setAttribute(k, '');
      else e.setAttribute(k, v);
    }
    U.agregar(e, hijos);
    return e;
  },
  agregar(e, hijos) {
    for (const c of hijos.flat(Infinity)) {
      if (c === null || c === undefined || c === false) continue;
      e.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return e;
  },
  vaciar(e) { while (e.firstChild) e.removeChild(e.firstChild); return e; },
  // Guaranies: 1234567 -> "1.234.567"
  n(v) { const x = Number(v); if (v === '' || v === null || v === undefined || !isFinite(x)) return '–'; return x.toLocaleString('es-PY'); },
  gs(v) { const s = U.n(v); return s === '–' ? s : s + ' Gs.'; },
  // texto -> entero ("1.234.567" -> 1234567); NaN si no es entero
  entero(t) {
    if (typeof t === 'number') return Number.isInteger(t) ? t : NaN;
    const s = String(t === null || t === undefined ? '' : t).replace(/\./g, '').replace(/\s/g, '');
    if (!/^-?\d+$/.test(s)) return NaN;
    return Number(s);
  },
  fecha(s) {
    if (!s) return '–';
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
    if (!m) return String(s);
    return m[3] + '/' + m[2] + '/' + m[1] + (m[4] ? ' ' + m[4] + ':' + m[5] : '');
  },
  hoy() { const d = new Date(Date.now() - 3 * 3600 * 1000); return d.toISOString().substring(0, 10); },
  sumarDias(f, n) { const d = new Date(Date.parse(f + 'T00:00:00Z') + n * 86400000); return d.toISOString().substring(0, 10); },
  uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  },
  idOp() { return 'OP-' + U.uuid(); },
  guardar(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  leer(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
  borrar(k) { try { sessionStorage.removeItem(k); } catch (e) { } },
  csv(filas, columnas) {
    const esc = v => '"' + String(v === undefined || v === null ? '' : v).replace(/"/g, '""') + '"';
    return '﻿' + [columnas.join(';')].concat(filas.map(f => columnas.map(c => esc(f[c])).join(';'))).join('\n');
  },
  descargar(nombre, texto, mime) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: mime || 'text/csv;charset=utf-8' }));
    a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  },
};
