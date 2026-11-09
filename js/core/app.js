// GESTION_CELULARES - app.js : sesion, navegacion de cinco pestañas, registro de pantallas
const App = (() => {
  const pantallas = {}, h = U.h;
  let usuario = null, actual = { ruta: '', param: '' };
  const TABS = [
    { id: 'inicio', t: 'Inicio', i: '⌂', roles: null },
    { id: 'vender', t: 'Vender', i: '$', roles: ['Administrador', 'Soporte de garantía'] },
    { id: 'taller', t: 'Taller', i: '⚙', roles: ['Administrador', 'Técnico', 'Comprador', 'Soporte de garantía'] },
    { id: 'dinero', t: 'Dinero', i: '₲', roles: ['Administrador', 'Técnico'] },
    { id: 'mas', t: 'Más', i: '≡', roles: null },
  ];
  const A = {
    config: null,
    get usuario() { return usuario; },
    tieneRol(...roles) { return !!usuario && roles.some(r => usuario.roles.indexOf(r) >= 0); },
    esAdmin() { return A.tieneRol('Administrador'); },
    pantalla(ruta, def) { pantallas[ruta] = def; },
    ir(ruta, param) { location.hash = '#/' + ruta + (param ? '/' + encodeURIComponent(param) : ''); },
    recargar() { dibujar(); },
    titulo(t) { document.getElementById('titulo').textContent = t; },
    medios() { return String(A.config.medios_pago).split(',').map(s => s.trim()).filter(Boolean); },

    async iniciar() {
      document.getElementById('form-login').addEventListener('submit', entrar);
      window.addEventListener('hashchange', dibujar);
      document.getElementById('atras').addEventListener('click', () => { if (history.length > 1) history.back(); else A.ir(tabDe(actual.ruta)); });
      const t = U.leer('token');
      if (t) { Api.setToken(t); try { usuario = await Api.sesion(); await abrir(); return; } catch (e) { U.borrar('token'); } }
      mostrarLogin();
    },
    async salir() { await Api.logout(); U.borrar('token'); Api.setToken(null); usuario = null; location.hash = ''; mostrarLogin(); },
  };

  function mostrarLogin() {
    document.getElementById('app').hidden = true; document.getElementById('login').hidden = false;
    const av = document.getElementById('login-aviso');
    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL === 'PENDIENTE') { av.textContent = 'Este sistema todavía no está conectado a su hoja de cálculo (falta la URL en config.js).'; av.hidden = false; }
  }
  async function entrar(ev) {
    ev.preventDefault();
    const err = document.getElementById('login-error'); err.hidden = true;
    const btn = ev.target.querySelector('button'); btn.disabled = true;
    try {
      const r = await Api.login(document.getElementById('login-email').value.trim(), document.getElementById('login-pin').value.trim());
      Api.setToken(r.token); U.guardar('token', r.token); usuario = { email: r.email, nombre: r.nombre, roles: r.roles };
      document.getElementById('login-pin').value = '';
      await abrir();
    } catch (e) { err.textContent = e.message; err.hidden = false; }
    finally { btn.disabled = false; }
  }
  async function abrir() {
    try { A.config = await Api.leer('obtenerConfiguracion'); } catch (e) { A.config = { medios_pago: 'Efectivo' }; }
    document.getElementById('login').hidden = true; document.getElementById('app').hidden = false;
    document.getElementById('usuario').textContent = usuario.nombre.split(' ')[0];
    const nav = document.getElementById('tabs'); U.vaciar(nav);
    TABS.filter(t => !t.roles || A.tieneRol(...t.roles)).forEach(t => nav.appendChild(h('a', { href: '#/' + t.id, 'data-tab': t.id }, h('span', { class: 'ico' }, t.i), h('span', {}, t.t))));
    if (!location.hash || location.hash === '#') location.hash = '#/inicio';
    dibujar();
  }
  function tabDe(ruta) { const p = pantallas[ruta]; return p && p.tab ? p.tab : (TABS.some(t => t.id === ruta) ? ruta : 'inicio'); }

  async function dibujar() {
    if (!usuario) return;
    const partes = location.hash.replace(/^#\/?/, '').split('/');
    const ruta = partes[0] || 'inicio', param = partes.slice(1).map(decodeURIComponent).join('/');
    actual = { ruta, param };
    const def = pantallas[ruta], cont = document.getElementById('contenido');
    U.vaciar(cont); window.scrollTo(0, 0);
    document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('activa', a.dataset.tab === tabDe(ruta)));
    const esRaiz = TABS.some(t => t.id === ruta);
    document.getElementById('atras').hidden = esRaiz;
    if (!def) { A.titulo('No encontrado'); cont.appendChild(UI.vacio('Pantalla no encontrada.')); return; }
    if (def.roles && !A.tieneRol(...def.roles)) { A.titulo('Sin acceso'); cont.appendChild(UI.vacio('Su rol no tiene acceso a esta pantalla.')); return; }
    A.titulo(typeof def.titulo === 'function' ? def.titulo(param) : def.titulo);
    cont.appendChild(UI.cargando());
    const marca = ++dibujar.n;
    try {
      const nodo = h('div', { class: 'pantalla' });
      await def.render(nodo, param);
      if (marca !== dibujar.n) return;
      U.vaciar(cont); cont.appendChild(nodo);
    } catch (e) {
      if (marca !== dibujar.n) return;
      if (/Sesion|sesión|vencida|no valida/i.test(e.message)) { A.salir(); return; }
      U.vaciar(cont); cont.appendChild(UI.errorBox(e, dibujar));
    }
  }
  dibujar.n = 0;
  return A;
})();
