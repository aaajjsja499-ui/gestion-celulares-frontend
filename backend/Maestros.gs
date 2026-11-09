// GESTION_CELULARES - Maestros.gs (Diseno Tecnico 3.8, 3.13, 4.14, 4.15)
// Clientes, proveedores, usuarios, configuracion y alertas.

var CAMPOS_CLIENTE = ['nombre', 'contacto', 'notas', 'tipo_documento', 'numero_documento', 'foto_documento_frente', 'foto_documento_dorso', 'fecha_nacimiento', 'telefono_secundario', 'correo', 'domicilio_direccion', 'domicilio_barrio_ciudad', 'domicilio_referencias', 'domicilio_mapa', 'domicilio_foto_fachada', 'trabajo_lugar', 'trabajo_direccion', 'trabajo_sucursal', 'trabajo_telefono', 'trabajo_antiguedad', 'ingreso_comprobante', 'referencia1_nombre', 'referencia1_parentesco', 'referencia1_telefono', 'referencia2_nombre', 'referencia2_parentesco', 'referencia2_telefono'];
var REQUERIDOS_FICHA = ['tipo_documento', 'numero_documento', 'foto_documento_frente', 'foto_documento_dorso', 'fecha_nacimiento', 'domicilio_direccion', 'domicilio_barrio_ciudad', 'trabajo_lugar', 'ingreso_comprobante', 'referencia1_nombre', 'referencia1_parentesco', 'referencia1_telefono', 'referencia2_nombre', 'referencia2_parentesco', 'referencia2_telefono'];
var TIPOS_DOCUMENTO = ['Cédula de identidad', 'Pasaporte', 'Otro'];

var Maestros = {
  fichaCompleta: function (c) { return REQUERIDOS_FICHA.every(function (k) { return Util.texto(c[k]) !== ''; }) ? 'Sí' : 'No'; }
};

definir('guardarCliente', {
  roles: [ROL_ADMIN, ROL_SOPORTE],
  registros: function (p) { return p.id_cliente ? ['CLI:' + p.id_cliente] : []; },
  planificar: function (p, pl, u) {
    var datos = {}, existente = p.id_cliente ? pl.get('Clientes', p.id_cliente) : null;
    if (p.id_cliente && !existente) throw Util.error('No existe el cliente');
    var esAdmin = Auth.tieneRol(u, [ROL_ADMIN]);
    if (existente && !esAdmin) throw Util.error('Solo el Administrador edita un cliente existente');
    CAMPOS_CLIENTE.forEach(function (k) { datos[k] = p[k] !== undefined ? Util.texto(p[k]) : (existente ? existente[k] : ''); });
    if (!esAdmin) CAMPOS_CLIENTE.forEach(function (k) { if (k !== 'nombre' && k !== 'contacto' && k !== 'notas') datos[k] = ''; });
    if (datos.nombre.length < 3) throw Util.error('El nombre es obligatorio (mínimo 3 caracteres)');
    datos.contacto = Util.normalizarTelefono(datos.contacto); if (datos.contacto.length < 6) throw Util.error('Ingrese un teléfono de contacto válido');
    ['telefono_secundario', 'trabajo_telefono', 'referencia1_telefono', 'referencia2_telefono'].forEach(function (k) { datos[k] = Util.normalizarTelefono(datos[k]); });
    if (datos.tipo_documento && TIPOS_DOCUMENTO.indexOf(datos.tipo_documento) < 0) throw Util.error('Tipo de documento inválido');
    datos.numero_documento = Util.normalizarDocumento(datos.numero_documento);
    if (datos.numero_documento) {
      var dup = pl.filas('Clientes').filter(function (c) { return c.id_cliente !== (existente && existente.id_cliente) && Util.normalizarDocumento(c.numero_documento) === datos.numero_documento && c.tipo_documento === datos.tipo_documento; });
      if (dup.length) throw Util.error('Ya existe un cliente con ese documento: ' + dup[0].id_cliente + ' ' + dup[0].nombre);
    }
    if (datos.fecha_nacimiento) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha_nacimiento)) throw Util.error('La fecha de nacimiento debe ser AAAA-MM-DD');
      if (Ventas.edad(datos.fecha_nacimiento, Util.hoy()) < 0) throw Util.error('La fecha de nacimiento es futura');
    }
    if (datos.correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(datos.correo)) throw Util.error('Correo inválido');
    datos.ficha_credito_completa = Maestros.fichaCompleta(datos);
    if (datos.ficha_credito_completa === 'Sí') { datos.verificada_por = u.email; datos.verificada_en = pl.ahora; }
    if (existente) { pl.upd('Clientes', existente.id_cliente, datos, false); pl.resultado = { id_cliente: existente.id_cliente, ficha_credito_completa: datos.ficha_credito_completa }; }
    else { var c = pl.add('Clientes', datos); pl.resultado = { id_cliente: c.id_cliente, ficha_credito_completa: datos.ficha_credito_completa }; }
  }
});

// Subida de foto/documento a una carpeta privada de Drive. Devuelve la URL para guardarla en la ficha.
definir('subirArchivoCliente', {
  roles: [ROL_ADMIN, ROL_SOPORTE], lectura: true,
  leer: function (p) {
    var nombre = Util.texto(p.nombre).replace(/[^\w.\-]/g, '_'); if (!nombre || !p.base64) throw Util.error('Falta el archivo');
    if (String(p.base64).length > 4000000) throw Util.error('El archivo es demasiado grande (máx. 3 MB)');
    var props = PropertiesService.getScriptProperties(), idCarpeta = props.getProperty('CARPETA_CLIENTES'), carpeta;
    if (idCarpeta) carpeta = DriveApp.getFolderById(idCarpeta); else { carpeta = DriveApp.createFolder('Clientes (privado)'); props.setProperty('CARPETA_CLIENTES', carpeta.getId()); }
    var blob = Utilities.newBlob(Utilities.base64Decode(p.base64), p.mime || 'image/jpeg', Util.hoy() + '_' + (p.id_cliente || 'nuevo') + '_' + nombre);
    var f = carpeta.createFile(blob); f.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    return { url: f.getUrl(), id_archivo: f.getId() };
  }
});

definir('obtenerClientes', {
  roles: [ROL_ADMIN, ROL_SOPORTE], lectura: true,
  leer: function (p, u) {
    var admin = Auth.tieneRol(u, [ROL_ADMIN]), q = Util.normalizarNombre(p && p.buscar);
    return Datos.leer('Clientes').filter(function (c) { return !q || Util.normalizarNombre(c.nombre + c.numero_documento + c.contacto).indexOf(q) >= 0; }).map(function (c) {
      if (admin) return Util.copiar(c);
      return { id_cliente: c.id_cliente, nombre: c.nombre, contacto: c.contacto, ficha_credito_completa: c.ficha_credito_completa };
    });
  }
});

definir('obtenerCliente', {
  roles: [ROL_ADMIN, ROL_SOPORTE], lectura: true,
  leer: function (p, u) {
    var c = Datos.buscar('Clientes', 'id_cliente', p.id_cliente); if (!c) throw Util.error('No existe el cliente');
    var admin = Auth.tieneRol(u, [ROL_ADMIN]);
    var r = { cliente: admin ? Util.copiar(c) : { id_cliente: c.id_cliente, nombre: c.nombre, contacto: c.contacto, ficha_credito_completa: c.ficha_credito_completa } };
    r.ventas = Datos.filtrar('Ventas', function (v) { return v.cliente === c.id_cliente; });
    if (admin) { r.saldo_a_favor = Contab.saldoCliente(FuenteDatos, c.id_cliente); r.creditos = Datos.filtrar('Creditos', function (x) { return x.id_cliente === c.id_cliente; }); r.ordenes = Datos.filtrar('Ordenes_Servicio', function (o) { return o.id_cliente === c.id_cliente; }); }
    return r;
  }
});

definir('obtenerVentas', {
  roles: [ROL_ADMIN, ROL_SOPORTE], lectura: true,
  leer: function () { return Datos.leer('Ventas').slice(-300).reverse(); }
});

// ---------- Proveedores ----------
definir('guardarProveedor', {
  roles: [ROL_ADMIN, ROL_COMPRADOR],
  planificar: function (p, pl) {
    var nombre = Util.texto(p.nombre); if (nombre.length < 2) throw Util.error('El nombre es obligatorio');
    var d = { nombre: nombre, contacto: Util.normalizarTelefono(p.contacto) || Util.texto(p.contacto), canal_habitual: Util.texto(p.canal_habitual), notas: Util.texto(p.notas) };
    if (p.id_proveedor) { if (!pl.get('Proveedores', p.id_proveedor)) throw Util.error('No existe el proveedor'); pl.upd('Proveedores', p.id_proveedor, d, false); pl.resultado = { id_proveedor: p.id_proveedor }; }
    else {
      var norm = Util.normalizarNombre(nombre);
      if (pl.filas('Proveedores').some(function (x) { return Util.normalizarNombre(x.nombre) === norm; })) throw Util.error('Ya existe un proveedor con ese nombre');
      pl.resultado = { id_proveedor: pl.add('Proveedores', d).id_proveedor };
    }
  }
});
definir('obtenerProveedores', {
  roles: [ROL_ADMIN, ROL_COMPRADOR], lectura: true,
  leer: function () {
    return Datos.leer('Proveedores').map(function (v) {
      var eq = Datos.filtrar('Equipos', function (e) { return e.id_proveedor === v.id_proveedor; });
      var o = Util.copiar(v); o.equipos_comprados = eq.length; return o;
    });
  }
});

// ---------- Usuarios ----------
function validarPin(pin) { if (!/^\d{4,8}$/.test(String(pin))) throw Util.error('El PIN debe tener entre 4 y 8 dígitos'); }
function adminsActivos(pl, salvo) {
  return pl.filas('Usuarios').filter(function (x) { return x.activo === 'Sí' && Auth.listaRoles(x.roles).indexOf(ROL_ADMIN) >= 0 && x.email !== salvo; }).length;
}
definir('altaUsuario', {
  roles: [ROL_ADMIN],
  planificar: function (p, pl) {
    var email = Util.texto(p.email).toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw Util.error('Email inválido');
    if (pl.get('Usuarios', email)) throw Util.error('Ya existe ese usuario');
    var roles = (Array.isArray(p.roles) ? p.roles : String(p.roles || '').split(',')).map(function (r) { return r.trim(); }).filter(Boolean);
    if (!roles.length || roles.some(function (r) { return ROLES_VALIDOS.indexOf(r) < 0; })) throw Util.error('Roles inválidos');
    if (Util.texto(p.nombre).length < 2) throw Util.error('El nombre es obligatorio');
    validarPin(p.pin);
    pl.add('Usuarios', { email: email, nombre: Util.texto(p.nombre), roles: roles.join(','), activo: 'Sí', fecha_alta: Util.hoy(), pin_hash: Util.hashPin(email, String(p.pin)) });
    pl.resultado = { email: email };
  }
});
definir('editarUsuario', {
  roles: [ROL_ADMIN],
  planificar: function (p, pl, u) {
    var x = pl.get('Usuarios', Util.texto(p.email).toLowerCase()); if (!x) throw Util.error('No existe el usuario');
    var cambios = {};
    if (p.nombre !== undefined) { if (Util.texto(p.nombre).length < 2) throw Util.error('El nombre es obligatorio'); cambios.nombre = Util.texto(p.nombre); }
    if (p.roles !== undefined) {
      var roles = (Array.isArray(p.roles) ? p.roles : String(p.roles).split(',')).map(function (r) { return r.trim(); }).filter(Boolean);
      if (!roles.length || roles.some(function (r) { return ROLES_VALIDOS.indexOf(r) < 0; })) throw Util.error('Roles inválidos');
      if (roles.indexOf(ROL_ADMIN) < 0 && Auth.listaRoles(x.roles).indexOf(ROL_ADMIN) >= 0 && adminsActivos(pl, x.email) === 0) throw Util.error('Debe quedar al menos un Administrador activo');
      cambios.roles = roles.join(',');
    }
    if (p.activo !== undefined) {
      var act = (p.activo === true || p.activo === 'Sí') ? 'Sí' : 'No';
      if (act === 'No' && x.email === u.email) throw Util.error('No puede desactivarse a sí mismo');
      if (act === 'No' && Auth.listaRoles(x.roles).indexOf(ROL_ADMIN) >= 0 && adminsActivos(pl, x.email) === 0) throw Util.error('Debe quedar al menos un Administrador activo');
      cambios.activo = act;
    }
    if (p.pin !== undefined && p.pin !== '') { validarPin(p.pin); cambios.pin_hash = Util.hashPin(x.email, String(p.pin)); }
    pl.upd('Usuarios', x.email, cambios, false);
    pl.resultado = { email: x.email };
  }
});
definir('cambiarPin', {
  roles: ROLES_VALIDOS,
  planificar: function (p, pl, u) {
    var x = pl.get('Usuarios', u.email);
    if (x.pin_hash !== Util.hashPin(u.email, String(p.pin_actual))) throw Util.error('El PIN actual no es correcto');
    validarPin(p.pin_nuevo);
    pl.upd('Usuarios', u.email, { pin_hash: Util.hashPin(u.email, String(p.pin_nuevo)) }, false);
    pl.resultado = { ok: true };
  }
});
definir('obtenerUsuarios', {
  roles: [ROL_ADMIN], lectura: true,
  leer: function () { return Datos.leer('Usuarios').map(function (x) { return { email: x.email, nombre: x.nombre, roles: Auth.listaRoles(x.roles), activo: x.activo, fecha_alta: x.fecha_alta }; }); }
});

// ---------- Configuracion ----------
definir('obtenerConfiguracion', { roles: ROLES_VALIDOS, lectura: true, leer: function () { return Config.todo(); } });
definir('actualizarConfiguracion', {
  roles: [ROL_ADMIN],
  planificar: function (p, pl) {
    var com = Util.texto(p.comentario); if (com.length < 5) throw Util.error('El comentario es obligatorio');
    var cambios = Util.copiar(p.cambios || {}); if (!Object.keys(cambios).length) throw Util.error('No hay cambios');
    var errores = Config.validarCambios(cambios, Config.todo()); if (errores.length) throw Util.error(errores.join('. '));
    var antes = Config.todo(), partes = [];
    Object.keys(cambios).forEach(function (k) {
      if (String(antes[k]) === String(cambios[k])) return;
      partes.push(k + ': ' + antes[k] + ' → ' + cambios[k]);
      if (pl.get('Configuracion', k)) pl.upd('Configuracion', k, { valor: cambios[k] }, false); else pl.add('Configuracion', { clave: k, valor: cambios[k] });
    });
    if (!partes.length) throw Util.error('Los valores ya son los vigentes');
    pl.resultado = { id_decision: pl.decision('Configuración', 'Cambio de parámetros', partes.join('; '), com) };
  }
});

// ---------- Alertas ----------
definir('obtenerResumenAlertas', {
  roles: [ROL_ADMIN, ROL_TECNICO, ROL_COMPRADOR, ROL_SOPORTE], lectura: true,
  leer: function (p, u) {
    var hoy = Util.hoy(), cfg = Config.todo(), a = [], admin = Auth.tieneRol(u, [ROL_ADMIN]);
    function al(tipo, texto, n, ref) { if (n > 0) a.push({ tipo: tipo, texto: texto, cantidad: n, ref: ref || '' }); }
    var reps = Datos.leer('Reparaciones');
    var pend = reps.filter(function (r) { return r.estado_tarifa === 'Pendiente de aprobación'; });
    var dev = reps.filter(function (r) { return r.estado_tarifa === 'Devuelta' && (admin || r.tecnico_email === u.email); });
    if (admin) al('tarifas', 'Tarifas de técnico por aprobar', pend.length);
    // trabajos parciales seguidos en la misma unidad u orden (informativa)
    var seguidos = {}, aviso = 0;
    reps.filter(function (r) { return r.fecha_fin; }).forEach(function (r) {
      var k = r.id_equipo || r.id_orden;
      if (r.resultado === 'Reparado parcialmente') seguidos[k] = (seguidos[k] || 0) + 1; else seguidos[k] = 0;
      if (seguidos[k] >= cfg.trabajos_parciales_alerta) aviso++;
    });
    var unicos = {}; Object.keys(seguidos).forEach(function (k) { if (seguidos[k] >= cfg.trabajos_parciales_alerta) unicos[k] = true; });
    al('parciales', 'Unidades con trabajos parciales seguidos', Object.keys(unicos).length);
    al('tarifas_devueltas', 'Tarifas devueltas para corregir', dev.length);
    al('repuestos', 'Repuestos bajo el mínimo', Datos.leer('Repuestos').filter(function (r) { return r.activo !== 'No' && Util.num(r.stock_actual) <= cfg.stock_minimo_repuestos; }).length);
    if (admin) {
      al('operaciones', 'Operaciones interrumpidas', Datos.filtrar('Operaciones', function (o) { return o.estado === 'Iniciada'; }).length);
      al('bloqueados', 'Registros bloqueados por diferencia', Datos.filtrar('Registros_Bloqueados', function (b) { return b.activo === 'Sí'; }).length);
      var vencidos = 0; Datos.filtrar('Creditos', function (c) { return c.estado === 'Abierto'; }).forEach(function (c) { if (Contab.estadoDerivado(FuenteDatos, c.id_credito, hoy).estado === 'Vencido') vencidos++; });
      al('cartera', 'Créditos con cuotas vencidas', vencidos);
      al('ordenes', 'Órdenes listas sin retirar', Datos.leer('Ordenes_Servicio').filter(function (o) { return ESTADOS_CIERRE_ORDEN.indexOf(o.estado) >= 0 && o.fecha_cierre_trabajo && Util.diasEntre(o.fecha_cierre_trabajo, hoy) >= cfg.dias_alerta_orden_sin_retirar; }).length);
      var libre = Contab.capitalLibre(FuenteDatos); if (cfg.capital_minimo_alerta > 0 && libre < cfg.capital_minimo_alerta) a.push({ tipo: 'capital', texto: 'Capital libre bajo el mínimo', cantidad: 1, ref: String(libre) });
      var ult = Datos.leer('Cierres_Mensuales').map(function (c) { return c.mes; }).sort(), sig = ult.length ? mesSiguiente(ult[ult.length - 1]) : null;
      if (sig && sig < Util.mes(Util.ahora())) a.push({ tipo: 'cierre', texto: 'Falta cerrar el mes ' + sig, cantidad: 1, ref: sig });
    }
    return a;
  }
});
