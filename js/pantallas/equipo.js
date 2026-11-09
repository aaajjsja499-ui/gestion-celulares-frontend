// GESTION_CELULARES - equipo.js : listado y ficha de equipo (centro de acciones por estado y rol)
(() => {
  const h = U.h;
  const GRUPOS = {
    'Todos': null,
    'Compra': ['Detectado', 'En negociación', 'Comprado', 'Recibido'],
    'Taller': ['En diagnóstico', 'En reparación', 'Esperando repuestos', 'Reparado', 'En pruebas', 'Desarmado para repuestos'],
    'Para vender': ['Listo para venta', 'Publicado', 'Reservado'],
    'Vendidos': ['Vendido', 'Entregado', 'En garantía', 'Devuelto'],
    'Cerrados': ['Cerrado por venta', 'Baja definitiva'],
  };
  const TRANS = {
    'Detectado': ['En negociación', 'Baja definitiva'], 'En negociación': ['Detectado', 'Baja definitiva'], 'Comprado': ['Recibido', 'Baja definitiva'],
    'Recibido': ['En diagnóstico', 'Listo para venta'], 'En diagnóstico': ['Listo para venta', 'Esperando repuestos', 'Desarmado para repuestos', 'Baja definitiva'],
    'En reparación': ['Esperando repuestos', 'Desarmado para repuestos'], 'Esperando repuestos': ['Desarmado para repuestos'], 'Reparado': ['En pruebas'],
    'En pruebas': ['Listo para venta'], 'Listo para venta': ['Publicado'], 'Publicado': ['Reservado', 'Listo para venta'], 'Reservado': ['Publicado'], 'Vendido': [],
    'Entregado': ['Cerrado por venta'], 'En garantía': [], 'Devuelto': ['En diagnóstico', 'Desarmado para repuestos', 'Baja definitiva'], 'Desarmado para repuestos': ['Baja definitiva'],
  };
  const TIPOS = ['Celular', 'Artículo usado', 'Artículo nuevo'];
  const tono = e => ({ 'Publicado': 'ok', 'Listo para venta': 'ok', 'En garantía': 'aviso', 'Baja definitiva': 'mal', 'Devuelto': 'mal' }[e] || '');
  App.estadoTono = tono;

  App.pantalla('equipos', {
    titulo: 'Equipos', tab: 'mas', roles: ['Administrador', 'Comprador', 'Técnico', 'Soporte de garantía'],
    render: async (c, param) => {
      const lista = await Api.leer('obtenerEquipos');
      let grupo = param && GRUPOS[param] !== undefined ? param : 'Todos', texto = '';
      const chips = h('div', { class: 'chips' }), cuerpo = h('div', {});
      const busca = h('input', { class: 'buscador', placeholder: 'Buscar marca, modelo, IMEI o serie', oninput: e => { texto = e.target.value.toLowerCase(); pintar(); } });
      Object.keys(GRUPOS).forEach(g => chips.appendChild(h('button', { class: 'chip' + (g === grupo ? ' activo' : ''), onclick: ev => { grupo = g; chips.querySelectorAll('.chip').forEach(x => x.classList.toggle('activo', x === ev.target)); pintar(); } }, g)));
      function pintar() {
        U.vaciar(cuerpo);
        const f = lista.filter(e => (!GRUPOS[grupo] || GRUPOS[grupo].indexOf(e.estado) >= 0) && (!texto || (e.marca + ' ' + e.modelo + ' ' + e.imei + ' ' + e.numero_serie).toLowerCase().indexOf(texto) >= 0)).reverse();
        if (!f.length) { cuerpo.appendChild(UI.vacio('No hay equipos.')); return; }
        f.forEach(e => cuerpo.appendChild(UI.fila({ class: 'item clic', onclick: () => App.ir('equipo', e.id_equipo) },
          h('div', {}, h('div', { class: 'princ' }, e.marca + ' ' + e.modelo), h('div', { class: 'sec' }, e.id_equipo + ' · ' + (e.imei || e.numero_serie || e.tipo_articulo))),
          h('div', { class: 'der' }, UI.badge(e.estado, tono(e.estado)), e.costo_total !== undefined && e.costo_total !== '' ? h('div', { class: 'sec' }, 'Costo ' + U.n(e.costo_total)) : null, e.precio_fijado ? h('div', { class: 'sec' }, 'Precio ' + U.n(e.precio_fijado)) : null))));
      }
      c.appendChild(busca); c.appendChild(chips); c.appendChild(cuerpo); pintar();
    },
  });

  App.pantalla('nueva-compra', {
    titulo: 'Nueva compra', tab: 'mas', roles: ['Administrador', 'Comprador'],
    render: async (c) => {
      const provs = await Api.leer('obtenerProveedores');
      const f = UI.formulario({
        enviar: 'Registrar equipo detectado',
        campos: [
          { n: 'tipo_articulo', l: 'Tipo de artículo', t: 'select', opts: TIPOS, req: true },
          { n: 'marca', l: 'Marca', req: true }, { n: 'modelo', l: 'Modelo', req: true },
          { n: 'imei', l: 'IMEI (15 o 16 dígitos, solo celulares)', t: 'tel' }, { n: 'numero_serie', l: 'Número de serie (usados/nuevos)' },
          { n: 'id_proveedor', l: 'Proveedor / vendedor', t: 'select', opts: provs.map(p => ({ v: p.id_proveedor, l: p.nombre + (p.contacto ? ' · ' + p.contacto : '') })) },
          { n: 'notas', l: 'Notas', t: 'area' },
        ],
        alEnviar: async (v, idOp) => { const r = await UI.ejecutar('crearEquipo', v, idOp); UI.toast('Equipo registrado', 'ok'); App.ir('equipo', r.id_equipo); },
      });
      c.appendChild(f.nodo);
      c.appendChild(UI.boton('+ Nuevo proveedor', () => App.ir('proveedores')));
    },
  });

  // ---------- Ficha ----------
  App.pantalla('equipo', {
    titulo: 'Ficha del equipo', tab: 'mas',
    render: async (c, id) => {
      const f = await Api.leer('obtenerFichaEquipo', { id_equipo: id });
      const e = f.equipo; App.titulo(e.marca + ' ' + e.modelo);
      const verCostos = !!f.costos;
      const venta = (f.ventas || []).filter(v => v.estado_venta === 'Vigente').pop();
      c.appendChild(UI.tarjeta({}, h('div', { class: 'item', style: 'box-shadow:none;padding:0' }, h('div', {}, h('div', { class: 'princ' }, e.id_equipo + ' · ' + e.tipo_articulo), h('div', { class: 'sec' }, e.imei || e.numero_serie || '')), UI.badge(e.estado, tono(e.estado))),
        UI.kv('Proveedor', f.proveedor ? f.proveedor.nombre + (f.proveedor.contacto ? ' · ' + f.proveedor.contacto : '') : e.proveedor),
        verCostos ? UI.kv('Costo total', U.gs(e.costo_total)) : null, verCostos ? UI.kv('Compra', U.gs(e.precio_compra)) : null, verCostos ? UI.kv('Reparación y otros', U.gs(e.costo_reparacion_total)) : null,
        f.mano_obra_provisional ? UI.kv('Mano de obra provisional', U.gs(f.mano_obra_provisional)) : null,
        UI.kv('Precio fijado', e.precio_fijado ? U.gs(e.precio_fijado) : null), e.valor_reventa_estimado ? UI.kv('Valor de reventa estimado', U.gs(e.valor_reventa_estimado)) : null,
        venta ? UI.kv('Vendido a', U.gs(venta.precio_venta) + ' (' + venta.tipo_venta + ')') : null, verCostos && f.ganancia_equipos !== undefined ? UI.kv('Ganancia asentada', U.gs(f.ganancia_equipos)) : null,
        f.alerta_parciales ? h('p', { class: 'aviso' }, 'Hubo ' + f.trabajos_parciales_seguidos + ' trabajos parciales seguidos en esta unidad.') : null));
      const recargar = () => App.recargar();
      const acc = h('div', { class: 'acciones' });
      acciones(f, e, venta).forEach(a => acc.appendChild(UI.boton(a[0], () => a[1](recargar), a[2])));
      c.appendChild(UI.seccion('Acciones', acc.childNodes.length ? acc : UI.vacio('Sin acciones disponibles para su rol en este estado.')));
      if (f.reparaciones.length) c.appendChild(UI.seccion('Reparaciones', f.reparaciones.map(x => {
        const r = x.reparacion;
        return UI.tarjeta({}, h('div', { class: 'item', style: 'box-shadow:none;padding:0' }, h('div', {}, h('div', { class: 'princ' }, r.id_reparacion + ' · ' + (r.origen || '')), h('div', { class: 'sec' }, r.tecnico + ' · ' + U.fecha(r.fecha_inicio))), UI.badge(r.estado_tarifa || (r.fecha_fin ? r.resultado : 'En curso'), r.estado_tarifa === 'Aprobada' ? 'ok' : 'aviso')),
          x.trabajos.filter(t => t.etapa !== 'Elegido' || r.estado_tarifa !== 'Aprobada').map(t => UI.kv(t.etapa + ' · ' + t.nombre_trabajo, U.gs(t.monto))), x.usos.map(u => UI.kv('Repuesto · ' + u.descripcion + ' ×' + u.cantidad, U.gs(u.costo_total_aplicado))));
      })));
      if (verCostos && f.costos.length) c.appendChild(UI.seccion('Costos', UI.tabla([{ l: 'Fecha', f: x => U.fecha(x.fecha_hora) }, { l: 'Tipo', k: 'tipo' }, { l: 'Monto', num: true, f: x => U.n(x.monto) }], f.costos)));
      if (f.diagnosticos.length) { const d = f.diagnosticos[f.diagnosticos.length - 1]; c.appendChild(UI.seccion('Último diagnóstico', UI.tarjeta({}, UI.kv('Fecha', U.fecha(d.fecha) + ' · ' + d.tecnico), UI.kv('Estado físico', d.estado_fisico), UI.kv('Humedad', d.evidencia_humedad), UI.kv('Fallas', ['pantalla', 'tactil', 'bateria', 'camara_trasera', 'camara_frontal', 'altavoz', 'microfono', 'puerto_carga', 'botones', 'huella_faceid', 'wifi', 'bluetooth', 'red_movil'].filter(k => d[k] === 'Fallado').join(', ') || 'Ninguna'), d.comentario ? UI.kv('Comentario', d.comentario) : null))); }
      if (f.consultas_imei.length) c.appendChild(UI.seccion('Consultas de IMEI', f.consultas_imei.map(q => UI.tarjeta({}, UI.kv(U.fecha(q.fecha_hora), q.resultado + (q.fuente ? ' · ' + q.fuente : '') + ' · IMEI ' + q.imei_consultado)))));
      c.appendChild(UI.seccion('Historial', UI.tabla([{ l: 'Fecha', f: x => U.fecha(x.fecha_hora) }, { l: 'Estado', f: x => (x.estado_anterior ? x.estado_anterior + ' → ' : '') + x.estado_nuevo }, { l: 'Por', k: 'responsable' }, { l: 'Comentario', k: 'comentario' }], f.historial.slice().reverse())));
    },
  });

  function acciones(f, e, venta) {
    const r = [], st = e.estado, adm = App.esAdmin(), comp = App.tieneRol('Administrador', 'Comprador'), tec = App.tieneRol('Administrador', 'Técnico'), sop = App.tieneRol('Administrador', 'Soporte de garantía');
    const v = e.version;
    const abierta = f.reparaciones.map(x => x.reparacion).filter(x => !x.fecha_fin).pop();
    // avanzar estado
    const rolOk = d => adm || (App.tieneRol('Comprador') && ['Detectado>En negociación', 'Detectado>Baja definitiva', 'En negociación>Detectado', 'En negociación>Baja definitiva', 'Comprado>Recibido', 'Comprado>Baja definitiva'].indexOf(st + '>' + d) >= 0) ||
      (App.tieneRol('Técnico') && ['Recibido', 'En diagnóstico', 'En reparación', 'Esperando repuestos', 'Reparado', 'En pruebas', 'Desarmado para repuestos'].indexOf(st) >= 0) ||
      (App.tieneRol('Soporte de garantía') && ['Entregado', 'Devuelto'].indexOf(st) >= 0);
    const destinos = (TRANS[st] || []).filter(rolOk);
    if (destinos.length) r.push(['Cambiar estado', (rec) => UI.accion({ titulo: 'Cambiar estado', op: 'transicionarEquipo', exito: 'Estado cambiado', alOk: rec,
      campos: [{ n: 'estado_nuevo', l: 'Nuevo estado', t: 'select', opts: destinos, req: true }, { n: 'comentario', l: 'Comentario (obligatorio)', t: 'area', req: true }].concat(st === 'Comprado' ? [{ n: 'reembolso', l: 'Reembolso recibido, si es retracto (Gs.)', t: 'num' }, { n: 'medios', l: 'Medio del reembolso', t: 'medios', totalDe: 'reembolso', req: false }] : []),
      params: x => { const p = { id_equipo: e.id_equipo, version: v, estado_nuevo: x.estado_nuevo, comentario: x.comentario }; if (x.reembolso) { p.reembolso = x.reembolso; p.medios = x.medios; } return p; } })]);
    if (e.tipo_articulo === 'Celular' && comp && ['Detectado', 'En negociación'].indexOf(st) >= 0) r.push(['Registrar consulta de IMEI', rec => UI.accion({ titulo: 'Consulta de IMEI', op: 'registrarConsultaIMEI', alOk: rec,
      campos: [{ n: 'resultado', l: 'Resultado', t: 'select', opts: ['Limpio', 'Bloqueado', 'Reportado', 'No consultado'], req: true }, { n: 'fuente', l: 'Fuente (sitio o app usada)' }, { n: 'comentario', l: 'Comentario (obligatorio si no se consultó)', t: 'area' }], params: x => Object.assign({ id_equipo: e.id_equipo }, x) })]);
    if (st === 'En negociación' && comp) r.push(['Cerrar la compra', rec => Api.leer('obtenerProveedores').then(provs => UI.accion({ titulo: 'Cerrar la compra', op: 'cerrarCompra', alOk: rec, exito: 'Compra cerrada',
      campos: [{ n: 'precio_compra', l: 'Precio de compra (Gs.)', t: 'num', req: true, min: 1 }, { n: 'id_proveedor', l: 'Proveedor', t: 'select', opts: provs.map(p => ({ v: p.id_proveedor, l: p.nombre })), def: e.id_proveedor }, { n: 'medios', l: 'Cómo se pagó', t: 'medios', totalDe: 'precio_compra' }],
      params: x => ({ id_equipo: e.id_equipo, version: v, precio_compra: x.precio_compra, id_proveedor: x.id_proveedor, medios: x.medios }) })), 'primario']);
    if (comp && ['Cerrado por venta', 'Baja definitiva'].indexOf(st) < 0) r.push(['Corregir dato (marca, modelo, IMEI, serie)', rec => UI.accion({ titulo: 'Corregir dato', op: 'editarDatosEquipo', alOk: rec,
      campos: [{ n: 'campo', l: 'Campo', t: 'select', opts: [{ v: 'marca', l: 'Marca' }, { v: 'modelo', l: 'Modelo' }, { v: 'imei', l: 'IMEI' }, { v: 'numero_serie', l: 'Número de serie' }, { v: 'tipo_articulo', l: 'Tipo de artículo' }], req: true }, { n: 'valor_nuevo', l: 'Valor nuevo', req: true }, { n: 'motivo', l: 'Motivo', req: true }],
      params: x => Object.assign({ id_equipo: e.id_equipo, version: v }, x) })]);
    if (comp && ['Detectado', 'En negociación', 'Comprado', 'Recibido', 'En diagnóstico', 'En reparación', 'Esperando repuestos', 'Reparado', 'En pruebas', 'Listo para venta', 'Publicado'].indexOf(st) >= 0) r.push(['Registrar valor de reventa estimado', rec => UI.accion({ titulo: 'Valor de reventa estimado', op: 'fijarValorReventa', alOk: rec,
      campos: [{ n: 'valor', l: 'Valor estimado de reventa (Gs.)', t: 'num', req: true, min: 1 }], params: x => ({ id_equipo: e.id_equipo, version: v, valor: x.valor }) })]);
    if (comp && ['Recibido', 'En diagnóstico', 'En reparación', 'Esperando repuestos', 'Reparado', 'En pruebas', 'Listo para venta', 'Publicado', 'Reservado', 'Comprado'].indexOf(st) >= 0) r.push(['Registrar costo (transporte o repuesto directo)', rec => UI.accion({ titulo: 'Registrar costo', op: 'registrarCostoUnidad', alOk: rec,
      campos: [{ n: 'tipo', l: 'Tipo', t: 'select', opts: ['Transporte', 'Repuesto directo'], req: true }, { n: 'monto', l: 'Monto (Gs.)', t: 'num', req: true, min: 1 }, { n: 'descripcion', l: 'Descripción', req: true }, { n: 'pagado', l: 'Se pagó en el momento', t: 'check', def: true },
        { n: 'medios', l: 'Medio de pago', t: 'medios', totalDe: 'monto', req: false }, { n: 'origen_sin_pago', l: 'Si no se pagó: origen', t: 'select', opts: ['Stock propio', 'Deuda con proveedor', 'Aporte de terceros', 'Pendiente de pago'] }],
      params: x => ({ id_equipo: e.id_equipo, tipo: x.tipo, monto: x.monto, descripcion: x.descripcion, afecta_caja: x.pagado ? 'Sí' : 'No', medios: x.pagado ? x.medios : undefined, origen_sin_pago: x.pagado ? undefined : x.origen_sin_pago }) })]);
    if (adm && ['Cerrado por venta', 'Baja definitiva'].indexOf(st) < 0) r.push(['Ajuste de costo (corrección)', rec => UI.accion({ titulo: 'Ajuste de costo', op: 'ajustarCostoUnidad', alOk: rec, intro: 'Los costos no se borran: se corrigen con un ajuste (positivo suma, negativo resta).',
      campos: [{ n: 'tipo', l: 'Tipo', t: 'select', opts: ['Corrección de costo', 'Repuesto devuelto', 'Garantía o retrabajo'], req: true }, { n: 'monto', l: 'Monto (Gs., puede ser negativo)', t: 'num', req: true }, { n: 'motivo', l: 'Motivo', req: true }],
      params: x => ({ id_equipo: e.id_equipo, tipo: x.tipo, monto: x.monto, motivo: x.motivo, afecta_caja: 'No' }) })]);
    if (adm && ['Listo para venta', 'Publicado', 'Reservado', 'Recibido', 'En pruebas', 'Reparado'].indexOf(st) >= 0) r.push(['Fijar precio de venta', rec => UI.accion({ titulo: 'Precio de venta', op: 'fijarPrecio', alOk: rec,
      intro: e.costo_total ? 'Costo actual de la unidad: ' + U.gs(e.costo_total) : '', campos: [{ n: 'precio', l: 'Precio (Gs.)', t: 'num', req: true, min: 1, def: e.precio_fijado }, { n: 'motivo', l: 'Motivo del cambio' }],
      params: x => ({ id_equipo: e.id_equipo, version: v, precio: x.precio, motivo: x.motivo }) })]);
    if (adm && ['Publicado', 'Reservado'].indexOf(st) >= 0) { r.push(['Vender de contado', () => App.ir('vender-contado', e.id_equipo), 'primario']); r.push(['Vender a crédito', () => App.ir('vender-credito', e.id_equipo), 'primario']); }
    if (adm && st === 'Vendido') r.push(['Entregar al cliente', rec => UI.confirmar('¿Confirmás que el equipo fue entregado al cliente? Empieza a correr la garantía.').then(ok => ok && UI.ejecutar('entregarEquipo', { id_equipo: e.id_equipo, version: v }, U.idOp()).then(() => { UI.toast('Entregado', 'ok'); rec(); }).catch(er => UI.toast(er.message, 'error'))), 'primario']);
    if (adm && venta && (st === 'Vendido' || st === 'En garantía')) r.push([st === 'Vendido' ? 'Desistimiento del cliente (devolución)' : 'Devolución en garantía', rec => devolucion(e, venta, st, rec), 'peligro']);
    if (tec && st === 'En diagnóstico') r.push(['Registrar diagnóstico', () => App.ir('diagnostico', e.id_equipo), 'primario']);
    if (tec && ['En diagnóstico', 'Esperando repuestos', 'En pruebas', 'En reparación'].indexOf(st) >= 0 && !abierta) r.push(['Iniciar reparación', rec => UI.ejecutar('iniciarReparacion', { id_equipo: e.id_equipo, version: v }, U.idOp()).then(() => { UI.toast('Reparación iniciada', 'ok'); rec(); }).catch(er => UI.toast(er.message, 'error')), 'primario']);
    if (tec && abierta) r.push(['Completar reparación ' + abierta.id_reparacion, () => App.ir('completar-reparacion', abierta.id_reparacion), 'primario']);
    if (sop && st === 'En garantía') {
      if (!abierta) r.push(['Atender reclamo de garantía (iniciar trabajo)', rec => {
        const orig = f.reparaciones.map(x => x.reparacion).filter(x => x.fecha_fin);
        UI.accion({ titulo: 'Reclamo de garantía', op: 'iniciarReparacion', alOk: rec, campos: [{ n: 'id_reparacion_origen', l: 'Reparación original', t: 'select', opts: orig.map(o => ({ v: o.id_reparacion, l: o.id_reparacion + ' · ' + U.fecha(o.fecha_inicio) })), req: true }],
          params: x => ({ id_equipo: e.id_equipo, version: v, origen: 'Garantía o retrabajo', id_reparacion_origen: x.id_reparacion_origen }) });
      }]);
      r.push(['Rechazar reclamo', rec => UI.accion({ titulo: 'Rechazar reclamo', op: 'rechazarReclamo', alOk: rec, campos: [{ n: 'motivo', l: 'Motivo (mín. 10 caracteres)', t: 'area', req: true }], params: x => ({ id_equipo: e.id_equipo, motivo: x.motivo }) })]);
      r.push(['Cerrar por vencimiento de la garantía', rec => UI.ejecutar('cerrarPorVencimiento', { id_equipo: e.id_equipo, version: v }, U.idOp()).then(() => { UI.toast('Cerrado', 'ok'); rec(); }).catch(er => UI.toast(er.message, 'error'))]);
    }
    return r;
  }

  function devolucion(e, venta, st, rec) {
    const tipo = st === 'Vendido' ? 'Desistimiento' : 'Devolución en garantía';
    UI.accion({ titulo: tipo, op: 'registrarDevolucion', alOk: rec, exito: 'Devolución registrada', intro: 'Venta ' + venta.id_venta + ' por ' + U.gs(venta.precio_venta) + '. Con causa Negocio se devuelve todo lo cobrado; con causa Cliente se puede retener una parte.',
      campos: [{ n: 'causa', l: 'Causa', t: 'select', opts: ['Negocio', 'Cliente'], req: true }, { n: 'monto_reembolsado', l: 'Monto a reembolsar (Gs.)', t: 'num', req: true, min: 0, def: venta.tipo_venta === 'Contado' ? venta.precio_venta : '' }, { n: 'medios', l: 'Medio del reembolso', t: 'medios', totalDe: 'monto_reembolsado', req: false },
        { n: 'motivo', l: 'Motivo (mín. 10 caracteres)', t: 'area', req: true }],
      params: x => ({ id_venta: venta.id_venta, tipo, causa: x.causa, monto_reembolsado: x.monto_reembolsado, medios: x.monto_reembolsado > 0 ? x.medios : undefined, motivo: x.motivo }) });
  }

  // ---------- Diagnostico ----------
  App.pantalla('diagnostico', {
    titulo: 'Diagnóstico', tab: 'taller', roles: ['Administrador', 'Técnico'],
    render: async (c, id) => {
      const OK = ['OK', 'Fallado', 'No aplica'], CAMPOS = [['pantalla', 'Pantalla'], ['tactil', 'Táctil'], ['bateria', 'Batería'], ['camara_trasera', 'Cámara trasera'], ['camara_frontal', 'Cámara frontal'], ['altavoz', 'Altavoz'], ['microfono', 'Micrófono'], ['puerto_carga', 'Puerto de carga'], ['botones', 'Botones'], ['huella_faceid', 'Huella / Face ID'], ['wifi', 'Wi-Fi'], ['bluetooth', 'Bluetooth'], ['red_movil', 'Red móvil']];
      const f = UI.formulario({
        enviar: 'Guardar diagnóstico',
        campos: CAMPOS.map(([k, l]) => ({ n: k, l, t: 'select', opts: OK, req: true, def: 'OK' })).concat([
          { n: 'imei_verificado', l: 'IMEI verificado', t: 'select', opts: ['OK', 'No verificado', 'Reportado'], req: true, def: 'No verificado' },
          { n: 'estado_fisico', l: 'Estado físico', t: 'select', opts: ['Excelente', 'Bueno', 'Regular', 'Malo'], req: true }, { n: 'evidencia_humedad', l: 'Evidencia de humedad', t: 'select', opts: ['No', 'Sí'], req: true, def: 'No' }, { n: 'comentario', l: 'Comentario', t: 'area' }]),
        alEnviar: async (v, idOp) => { await UI.ejecutar('registrarDiagnostico', Object.assign({ id_equipo: id }, v), idOp); UI.toast('Diagnóstico guardado', 'ok'); App.ir('equipo', id); },
      });
      c.appendChild(f.nodo);
    },
  });
})();
