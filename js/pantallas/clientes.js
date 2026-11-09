// GESTION_CELULARES - clientes.js : directorio, ficha, alta/edicion y fotos
(() => {
  const h = U.h;
  App.pantalla('clientes', {
    titulo: 'Clientes', tab: 'vender', roles: ['Administrador', 'Soporte de garantía'],
    render: async (c) => {
      let texto = '', todos = await Api.leer('obtenerClientes');
      const cuerpo = h('div', {});
      c.appendChild(h('input', { class: 'buscador', placeholder: 'Buscar por nombre, documento o teléfono', oninput: e => { texto = U.norm(e.target.value); pintar(); } }));
      c.appendChild(UI.boton('+ Nuevo cliente', () => App.ir('cliente-form'), 'primario')); c.appendChild(cuerpo);
      function pintar() {
        U.vaciar(cuerpo);
        const f = todos.filter(x => !texto || U.norm(x.nombre + (x.numero_documento || '') + (x.contacto || '')).indexOf(texto) >= 0).reverse();
        if (!f.length) cuerpo.appendChild(UI.vacio('No hay clientes.'));
        f.forEach(x => cuerpo.appendChild(UI.fila({ class: 'item clic', onclick: () => App.ir('cliente', x.id_cliente) }, h('div', {}, h('div', { class: 'princ' }, x.nombre), h('div', { class: 'sec' }, x.contacto + (x.numero_documento ? ' · ' + x.numero_documento : ''))), UI.badge(x.ficha_credito_completa === 'Sí' ? 'Ficha de crédito' : 'Ficha básica', x.ficha_credito_completa === 'Sí' ? 'ok' : ''))));
      }
      pintar();
    },
  });
  U.norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  App.pantalla('cliente', {
    titulo: 'Cliente', tab: 'vender', roles: ['Administrador', 'Soporte de garantía'],
    render: async (c, id) => {
      const r = await Api.leer('obtenerCliente', { id_cliente: id }), x = r.cliente;
      App.titulo(x.nombre);
      const lineas = [['Contacto', x.contacto], ['Documento', x.tipo_documento ? x.tipo_documento + ' ' + x.numero_documento : null], ['Nacimiento', x.fecha_nacimiento], ['Teléfono 2', x.telefono_secundario], ['Correo', x.correo], ['Domicilio', [x.domicilio_direccion, x.domicilio_barrio_ciudad].filter(Boolean).join(', ')], ['Referencia del domicilio', x.domicilio_referencias],
        ['Trabajo', [x.trabajo_lugar, x.trabajo_direccion].filter(Boolean).join(', ')], ['Antigüedad', x.trabajo_antiguedad], ['Referencia 1', x.referencia1_nombre ? x.referencia1_nombre + ' (' + x.referencia1_parentesco + ') ' + x.referencia1_telefono : null], ['Referencia 2', x.referencia2_nombre ? x.referencia2_nombre + ' (' + x.referencia2_parentesco + ') ' + x.referencia2_telefono : null], ['Notas', x.notas]];
      c.appendChild(UI.tarjeta({}, UI.badge(x.ficha_credito_completa === 'Sí' ? 'Ficha de crédito completa' : 'Ficha básica', x.ficha_credito_completa === 'Sí' ? 'ok' : 'aviso'), lineas.map(l => UI.kv(l[0], l[1])),
        ['foto_documento_frente', 'foto_documento_dorso', 'ingreso_comprobante', 'domicilio_foto_fachada'].filter(k => x[k]).map(k => h('div', {}, h('a', { href: x[k], target: '_blank', rel: 'noopener' }, 'Ver ' + k.replace(/_/g, ' '))))));
      if (App.esAdmin()) {
        c.appendChild(UI.boton('Editar cliente', () => App.ir('cliente-form', id)));
        if (r.saldo_a_favor) c.appendChild(UI.tarjeta({}, UI.kv('Saldo a favor', U.gs(r.saldo_a_favor)), UI.boton('Devolver saldo', () => UI.accion({ titulo: 'Devolver saldo a favor', op: 'devolverSaldoAFavor', alOk: App.recargar, campos: [{ n: 'monto', l: 'Monto (Gs.)', t: 'num', req: true, min: 1, def: r.saldo_a_favor }, { n: 'medios', l: 'Medio', t: 'medios', totalDe: 'monto' }], params: v => ({ id_cliente: id, monto: v.monto, medios: v.medios }) }))));
        if (r.creditos.length) c.appendChild(UI.seccion('Créditos', r.creditos.map(k => UI.fila({ class: 'item clic', onclick: () => App.ir('credito', k.id_credito) }, h('div', {}, h('div', { class: 'princ' }, k.id_credito), h('div', { class: 'sec' }, U.fecha(k.fecha_apertura) + ' · ' + U.gs(k.precio))), UI.badge(k.estado, k.estado === 'Abierto' ? 'aviso' : 'ok')))));
        if (r.ordenes.length) c.appendChild(UI.seccion('Órdenes de servicio', r.ordenes.map(o => UI.fila({ class: 'item clic', onclick: () => App.ir('orden', o.id_orden) }, h('div', {}, h('div', { class: 'princ' }, o.id_orden + ' · ' + o.equipo_descripcion), h('div', { class: 'sec' }, U.fecha(o.fecha_recepcion))), UI.badge(o.estado))))); }
      if (r.ventas.length) c.appendChild(UI.seccion('Compras', r.ventas.map(v => UI.fila({ class: 'item clic', onclick: () => App.ir('equipo', v.id_equipo) }, h('div', {}, h('div', { class: 'princ' }, v.id_equipo + ' · ' + v.tipo_venta), h('div', { class: 'sec' }, U.fecha(v.fecha_venta))), h('div', { class: 'der' }, U.gs(v.precio_venta))))));
    },
  });

  App.pantalla('cliente-form', {
    titulo: p => p ? 'Editar cliente' : 'Nuevo cliente', tab: 'vender', roles: ['Administrador', 'Soporte de garantía'],
    render: async (c, id) => {
      const x = id ? (await Api.leer('obtenerCliente', { id_cliente: id })).cliente : {}, adm = App.esAdmin();
      const T = (n, l, extra) => Object.assign({ n, l, def: x[n] || '' }, extra || {});
      const base = [T('nombre', 'Nombre completo', { req: true }), T('contacto', 'Teléfono / WhatsApp', { req: true, t: 'tel' }), T('notas', 'Notas', { t: 'area' })];
      const completa = !adm ? [] : [
        { t: 'info', l: 'Ficha de crédito: para vender a crédito hay que completar todos estos datos (referencias incluidas).' },
        T('tipo_documento', 'Tipo de documento', { t: 'select', opts: ['Cédula de identidad', 'Pasaporte', 'Otro'] }), T('numero_documento', 'Número de documento'), T('fecha_nacimiento', 'Fecha de nacimiento', { t: 'fecha' }),
        T('telefono_secundario', 'Teléfono secundario', { t: 'tel' }), T('correo', 'Correo'),
        T('domicilio_direccion', 'Domicilio (calle y número)'), T('domicilio_barrio_ciudad', 'Barrio y ciudad'), T('domicilio_referencias', 'Referencias del domicilio', { t: 'area' }), T('domicilio_mapa', 'Enlace de mapa (opcional)'),
        T('trabajo_lugar', 'Lugar de trabajo'), T('trabajo_direccion', 'Dirección del trabajo'), T('trabajo_sucursal', 'Sucursal / sector'), T('trabajo_telefono', 'Teléfono del trabajo', { t: 'tel' }), T('trabajo_antiguedad', 'Antigüedad en el trabajo'),
        T('referencia1_nombre', 'Referencia 1 · nombre'), T('referencia1_parentesco', 'Referencia 1 · parentesco'), T('referencia1_telefono', 'Referencia 1 · teléfono', { t: 'tel' }),
        T('referencia2_nombre', 'Referencia 2 · nombre'), T('referencia2_parentesco', 'Referencia 2 · parentesco'), T('referencia2_telefono', 'Referencia 2 · teléfono', { t: 'tel' }),
        T('foto_documento_frente', 'Foto del documento (frente) · enlace', { ayuda: 'Se completa con el botón de fotos de abajo' }), T('foto_documento_dorso', 'Foto del documento (dorso) · enlace'), T('ingreso_comprobante', 'Comprobante de ingresos · enlace'), T('domicilio_foto_fachada', 'Foto de la fachada · enlace')];
      const f = UI.formulario({
        enviar: 'Guardar cliente', campos: base.concat(completa),
        alEnviar: async (v, idOp) => { const p = Object.assign({}, v); if (id) p.id_cliente = id; const r = await UI.ejecutar('guardarCliente', p, idOp); UI.toast('Cliente guardado' + (r.ficha_credito_completa === 'Sí' ? ' · ficha de crédito completa' : ''), 'ok'); App.ir('cliente', r.id_cliente); },
      });
      c.appendChild(f.nodo);
      if (adm) {
        const sel = h('select', {}, ['foto_documento_frente', 'foto_documento_dorso', 'ingreso_comprobante', 'domicilio_foto_fachada'].map(k => h('option', { value: k }, k.replace(/_/g, ' '))));
        const arch = h('input', { type: 'file', accept: 'image/*' });
        c.appendChild(UI.seccion('Subir una foto a la carpeta privada', h('p', { class: 'info' }, 'Elegí qué foto es, sacala o elegila, y se completa el enlace en el formulario.'), sel, arch,
          UI.boton('Subir foto', async () => {
            if (!arch.files[0]) { UI.toast('Elegí una foto', 'error'); return; }
            try { const ft = await UI.leerFoto(arch.files[0]); const r = await Api.leer('subirArchivoCliente', { nombre: sel.value + '.jpg', base64: ft.base64, mime: ft.mime, id_cliente: id || 'nuevo' }); f.campos[sel.value].input.value = r.url; UI.toast('Foto subida', 'ok'); } catch (e) { UI.toast(e.message, 'error'); }
          })));
      }
    },
  });
})();
