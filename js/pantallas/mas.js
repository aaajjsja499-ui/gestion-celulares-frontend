// GESTION_CELULARES - mas.js : menu, garantias, proveedores, usuarios, configuracion, pendientes, invariantes, PIN
(() => {
  const h = U.h, ROLES = ['Administrador', 'Comprador', 'Técnico', 'Soporte de garantía'];

  App.pantalla('mas', {
    titulo: 'Más', tab: 'mas', roles: null,
    render: async (c) => {
      const u = App.usuario, b = [];
      c.appendChild(UI.tarjeta({}, h('div', { class: 'princ' }, u.nombre || u.email), h('div', { class: 'sec' }, u.email + ' · ' + u.roles.join(', '))));
      if (App.tieneRol('Administrador', 'Soporte de garantía')) b.push(UI.boton('Garantías', () => App.ir('garantias')), UI.boton('Clientes', () => App.ir('clientes')));
      if (App.tieneRol('Administrador', 'Comprador')) b.push(UI.boton('Proveedores', () => App.ir('proveedores')));
      if (App.esAdmin()) b.push(UI.boton('Usuarios', () => App.ir('usuarios')), UI.boton('Configuración', () => App.ir('configuracion')), UI.boton('Operaciones pendientes', () => App.ir('pendientes')), UI.boton('Verificar cuentas', () => App.ir('invariantes')));
      b.push(UI.boton('Cambiar mi PIN', cambiarPin), UI.boton('Salir', async () => { await Api.logout(); location.hash = ''; location.reload(); }, 'peligro'));
      c.appendChild(h('div', { class: 'grid' }, b));
    },
  });

  function cambiarPin() {
    UI.accion({ titulo: 'Cambiar mi PIN', op: 'cambiarPin', exito: 'PIN cambiado', campos: [{ n: 'pin_actual', l: 'PIN actual', t: 'pin', req: true }, { n: 'pin_nuevo', l: 'PIN nuevo (4 a 8 dígitos)', t: 'pin', req: true }], params: v => v });
  }

  App.pantalla('garantias', {
    titulo: 'Garantías', tab: 'mas', roles: ['Administrador', 'Soporte de garantía'],
    render: async (c) => {
      const [eq, ord] = await Promise.all([Api.leer('obtenerEquipos'), Api.leer('obtenerOrdenes')]);
      const e = eq.filter(x => x.estado === 'En garantía' || x.estado === 'Entregado'), o = ord.filter(x => x.orden.estado === 'Entregada' && x.orden.garantia_hasta && U.hoy() <= String(x.orden.garantia_hasta).substring(0, 10));
      c.appendChild(UI.seccion('Equipos vendidos con garantía (' + e.length + ')', e.length ? e.map(x => UI.fila({ class: 'item clic', onclick: () => App.ir('equipo', x.id_equipo) }, h('div', {}, h('div', { class: 'princ' }, x.marca + ' ' + x.modelo), h('div', { class: 'sec' }, x.id_equipo + (x.garantia_hasta ? ' · hasta ' + U.fecha(x.garantia_hasta) : ''))), UI.badge(x.estado))) : UI.vacio('No hay equipos en garantía.')));
      c.appendChild(UI.seccion('Órdenes de servicio con garantía (' + o.length + ')', o.length ? o.map(x => UI.fila({ class: 'item clic', onclick: () => App.ir('orden', x.orden.id_orden) }, h('div', {}, h('div', { class: 'princ' }, x.orden.id_orden + ' · ' + x.orden.equipo_descripcion), h('div', { class: 'sec' }, 'hasta ' + U.fecha(x.orden.garantia_hasta))), UI.badge('Garantía'))) : UI.vacio('No hay órdenes con garantía vigente.')));
    },
  });

  App.pantalla('proveedores', {
    titulo: 'Proveedores', tab: 'mas', roles: ['Administrador', 'Comprador'],
    render: async (c) => {
      const l = await Api.leer('obtenerProveedores');
      const form = p => UI.accion({ titulo: p ? 'Editar proveedor' : 'Nuevo proveedor', op: 'guardarProveedor', exito: 'Guardado', alOk: App.recargar,
        campos: [{ n: 'nombre', l: 'Nombre', req: true, def: p ? p.nombre : '' }, { n: 'contacto', l: 'Contacto', def: p ? p.contacto : '' }, { n: 'canal_habitual', l: 'Canal habitual', def: p ? p.canal_habitual : '' }, { n: 'notas', l: 'Notas', t: 'area', def: p ? p.notas : '' }],
        params: v => Object.assign({}, v, p ? { id_proveedor: p.id_proveedor } : {}) });
      c.appendChild(UI.boton('+ Nuevo proveedor', () => form(null), 'primario'));
      c.appendChild(UI.seccion('Proveedores (' + l.length + ')', l.length ? l.map(p => UI.fila({ class: 'item' }, h('div', {}, h('div', { class: 'princ' }, p.nombre), h('div', { class: 'sec' }, (p.contacto || '') + ' · ' + p.equipos_comprados + ' equipos comprados')), UI.boton('Editar', () => form(p), 'chico'))) : UI.vacio('Todavía no hay proveedores.')));
    },
  });

  App.pantalla('usuarios', {
    titulo: 'Usuarios', tab: 'mas', roles: ['Administrador'],
    render: async (c) => {
      const l = await Api.leer('obtenerUsuarios');
      const rolesCampo = def => ROLES.map(r => ({ n: 'rol_' + r, l: r, t: 'check', def: def ? def.indexOf(r) >= 0 : false }));
      const rolesDe = v => ROLES.filter(r => v['rol_' + r]);
      c.appendChild(UI.boton('+ Nuevo usuario', () => UI.accion({ titulo: 'Nuevo usuario', op: 'altaUsuario', exito: 'Usuario creado', alOk: App.recargar,
        campos: [{ n: 'email', l: 'Email (el de Google)', req: true }, { n: 'nombre', l: 'Nombre', req: true }, { n: 'pin', l: 'PIN inicial (4 a 8 dígitos)', t: 'pin', req: true }].concat(rolesCampo([])),
        params: v => ({ email: v.email, nombre: v.nombre, pin: v.pin, roles: rolesDe(v) }) }), 'primario'));
      c.appendChild(UI.seccion('Usuarios (' + l.length + ')', l.map(x => UI.fila({ class: 'item' }, h('div', {}, h('div', { class: 'princ' }, x.nombre + (x.activo === 'Sí' ? '' : ' (inactivo)')), h('div', { class: 'sec' }, x.email + ' · ' + x.roles.join(', '))),
        UI.boton('Editar', () => UI.accion({ titulo: 'Editar ' + x.email, op: 'editarUsuario', exito: 'Guardado', alOk: App.recargar,
          campos: [{ n: 'nombre', l: 'Nombre', def: x.nombre }, { n: 'activo', l: 'Activo', t: 'check', def: x.activo === 'Sí' }, { n: 'pin', l: 'Nuevo PIN (dejar vacío para no cambiarlo)', t: 'pin' }].concat(rolesCampo(x.roles)),
          params: v => { const p = { email: x.email, nombre: v.nombre, activo: v.activo ? 'Sí' : 'No', roles: rolesDe(v) }; if (v.pin) p.pin = v.pin; return p; } }), 'chico')))));
    },
  });

  App.pantalla('configuracion', {
    titulo: 'Configuración', tab: 'mas', roles: ['Administrador'],
    render: async (c) => {
      const cfg = await Api.leer('obtenerConfiguracion'), claves = Object.keys(cfg).sort();
      const campos = claves.map(k => ({ n: k, l: k.replace(/_/g, ' '), def: cfg[k] }));
      const f = UI.formulario({ enviar: 'Guardar cambios', campos: campos.concat([{ n: 'comentario', l: 'Motivo del cambio (mín. 5 caracteres)', t: 'area', req: true }]),
        alEnviar: async (v, idOp) => {
          const cambios = {}; claves.forEach(k => { if (String(v[k]) !== String(cfg[k])) cambios[k] = v[k]; });
          if (!Object.keys(cambios).length) throw new Error('No cambió ningún valor.');
          await UI.ejecutar('actualizarConfiguracion', { cambios, comentario: v.comentario }, idOp); UI.toast('Configuración guardada', 'ok'); App.recargar();
        } });
      c.appendChild(h('p', { class: 'info' }, 'Los porcentajes están en puntos base (100 = 1 %). Cada cambio queda en la Bitácora de decisiones.'));
      c.appendChild(f.nodo);
    },
  });

  App.pantalla('pendientes', {
    titulo: 'Operaciones pendientes', tab: 'mas', roles: ['Administrador'],
    render: async (c) => {
      const l = await Api.leer('listarOperacionesPendientes');
      if (!l.length) { c.appendChild(UI.vacio('No hay operaciones interrumpidas.')); return; }
      c.appendChild(h('p', { class: 'info' }, 'Una operación quedó a medias (por ejemplo, se cortó la conexión). Lo normal es reanudarla: se completa exactamente lo que faltaba.'));
      l.forEach(o => c.appendChild(UI.tarjeta({}, h('div', { class: 'princ' }, o.endpoint), UI.kv('Registros', o.registros.join(', ')), UI.kv('Hace', o.antiguedad_min + ' min'), UI.kv('Hecha por', o.responsable),
        h('div', { class: 'grid' }, [
          UI.boton('Reanudar', async () => { try { await UI.ejecutar('resolverOperacionInterrumpida', { id_operacion_pendiente: o.id_operacion, accion: 'reanudar' }, U.idOp()); UI.toast('Operación completada', 'ok'); App.recargar(); } catch (e) { UI.toast(e.message, 'error'); } }, 'primario'),
          UI.boton('Abandonar', () => UI.accion({ titulo: 'Abandonar operación', op: 'resolverOperacionInterrumpida', exito: 'Operación abandonada', alOk: App.recargar, intro: 'Se anula lo que no se llegó a escribir. Queda en Decisiones.', campos: [{ n: 'motivo', l: 'Motivo', req: true }], params: v => ({ id_operacion_pendiente: o.id_operacion, accion: 'abandonar', motivo: v.motivo }) }), 'peligro')]))));
    },
  });

  App.pantalla('invariantes', {
    titulo: 'Verificar cuentas', tab: 'mas', roles: ['Administrador'],
    render: async (c) => {
      const d = await Api.leer('verificarInvariantes');
      c.appendChild(d.ok ? h('p', { class: 'ok' }, 'Todo cuadra: los saldos coinciden con los registros.') : h('p', { class: 'aviso' }, 'Hay ' + d.diferencias.length + ' diferencia(s). Los registros afectados quedan bloqueados hasta revisarlos.'));
      d.diferencias.forEach(x => c.appendChild(UI.tarjeta({}, h('div', { class: 'princ' }, x.registro || x.invariante), h('div', { class: 'sec' }, x.detalle || JSON.stringify(x)))));
      if (d.bloqueados && d.bloqueados.length) c.appendChild(UI.seccion('Registros bloqueados', d.bloqueados.map(b => UI.kv(b.registro, b.detalle || ''))));
    },
  });
})();
