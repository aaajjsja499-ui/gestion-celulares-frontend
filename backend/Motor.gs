// GESTION_CELULARES - Motor.gs (Diseno Tecnico v4.2, Secciones 4.16 a 4.23)
// Unica copia del motor financiero: funciones puras sobre enteros en guaranies.
// No lee hojas. Portado del motor de referencia v6 (Anexo A), verificado por PruebasMotor.gs.
const BP = 10000;
const CFG = { capBps: 8000, fondoBps: 1000, topeFondoBps: 1000 };
const pct = (p, bps) => Math.floor((p * bps) / BP); // trunca (regla 11)

// ---- pagar(): reparto de un importe YA APLICADO a la deuda (A4 + remanente v3.0)
function pagar(p, pend, cfg = CFG) {
  let c = Math.min(pct(p, cfg.capBps), pend.capital);
  let f = Math.min(pct(p, cfg.fondoBps), pend.fondo);
  let i = Math.min(p - c - f, pend.interes);
  let exc = p - c - f - i;
  const mC = Math.min(exc, pend.capital - c); c += mC; exc -= mC;
  const mF = Math.min(exc, pend.fondo - f); f += mF; exc -= mF;
  const mI = Math.min(exc, pend.interes - i); i += mI; exc -= mI;
  return { c, f, i, sobrante: exc };
}

// ---- Credito
function abrirCredito({ precio, entrega, cuota, n, cfg = CFG }) {
  if (!(precio > 0) || !(entrega >= 0) || !(entrega < precio) || !(n >= 1) || !(cuota > 0)) throw new Error('carga invalida');
  const capitalFin = precio - entrega, deuda = cuota * n, interesBruto = deuda - capitalFin;
  if (interesBruto < 0) throw new Error('interes negativo: error de carga');
  const tope = pct(interesBruto, cfg.topeFondoBps);
  return {
    cfg, precio, entrega, cuota, n, capitalFin, deuda, interesBruto, tope,
    pend: { capital: capitalFin, fondo: tope, interes: interesBruto - tope },
    cuotas: Array.from({ length: n }, (_, k) => ({ nro: k + 1, monto: cuota, cubierto: 0 })),
    cobros: [], reversas: [], entregaRevertida: 0,
    estado: 'Abierto', saldoFavor: 0, descuento: 0,
    cobradoPrecio: entrega, interesCobrado: 0, fondoAportado: 0,
  };
}
const deudaPendiente = (cr) => cr.pend.capital + cr.pend.fondo + cr.pend.interes;

function cobrar(cr, id, monto, medio = 'Efectivo') {
  if (cr.cobros.some((x) => x.id === id)) throw new Error('cobro duplicado: ' + id);
  if (cr.estado !== 'Abierto') throw new Error('el credito no esta Abierto: ' + cr.estado);
  if (!(monto > 0)) throw new Error('monto invalido');
  const aplicado = Math.min(monto, deudaPendiente(cr));
  const sf = monto - aplicado;
  let resto = aplicado; const alloc = [];
  for (const q of cr.cuotas) { if (resto <= 0) break; const x = Math.min(resto, q.monto - q.cubierto); if (x > 0) { q.cubierto += x; resto -= x; alloc.push({ cuota: q.nro, monto: x }); } }
  const s = pagar(aplicado, cr.pend, cr.cfg);
  if (s.sobrante !== 0) throw new Error('sobrante inesperado ' + s.sobrante);
  cr.pend.capital -= s.c; cr.pend.fondo -= s.f; cr.pend.interes -= s.i;
  cr.cobradoPrecio += s.c; cr.interesCobrado += s.i; cr.fondoAportado += s.f; cr.saldoFavor += sf;
  const cobro = { id, monto, medio, aplicado, saldoFavor: sf, c: s.c, f: s.f, i: s.i, alloc, vigente: true };
  cr.cobros.push(cobro);
  if (deudaPendiente(cr) === 0) cr.estado = 'Pagado';
  return cobro;
}
// cancelacion anticipada: descuento <= interes pendiente (C-17)
function cancelarAnticipado(cr, id, descuento) {
  if (descuento > cr.pend.interes) throw new Error('descuento supera el interes pendiente');
  cr.pend.interes -= descuento; cr.descuento += descuento;
  const paga = deudaPendiente(cr);
  const cobro = cobrar(cr, id, paga);
  cr.estado = 'Cancelado anticipadamente';
  return { paga, cobro };
}

// ---- Fondo (saldo virtual unico)
class Fondo {
  constructor(saldo = 0) { this.saldo = saldo; this.mov = []; }
  mover(monto, motivo, ref) {
    if (this.saldo + monto < 0) throw new Error('FONDO NEGATIVO: ' + motivo);
    const ant = this.saldo; this.saldo += monto; this.mov.push({ ant, monto, post: this.saldo, motivo, ref });
  }
}
const exposicion = (C, P, V) => Math.max(0, C - P - V);

// ---- Unidad: costo unico y ganancia de equipos (C-28). El objetivo depende de
// la situacion (estado) y de F (fondo aplicado) y V (valor de ingreso) FIJADOS en el evento.
class Unidad {
  constructor(id, costoInicial = 0) {
    this.id = id; this.costos = []; this.C = 0; this.P = 0; this.G = 0; this.asientos = [];
    this.estado = 'inventario'; this.F = 0; this.V = 0; this.baja = null; this.eventos = new Set();
    if (costoInicial) this.costo('Compra', costoInicial, 'compra');
  }
  get vivo() { return this.estado === 'vivo'; }
  set vivo(v) { if (v) this.estado = 'vivo'; else if (this.estado === 'vivo') this.estado = 'cerrado'; }
  costo(tipo, monto, motivo) { const ant = this.C; this.C += monto; this.costos.push({ tipo, monto, ant, post: this.C, motivo }); return this.recalcular('costo ' + tipo); }
  cobradoPrecio(nuevoP, causa) { this.P = nuevoP; return this.recalcular(causa); }
  objetivo() {
    switch (this.estado) {
      case 'inventario': case 'anulada': return 0;
      case 'contado': case 'cerrado': return this.P - this.C;
      case 'vivo': return Math.max(0, this.P - this.C);
      case 'incobrable': return this.P + this.F - this.C;
      case 'recuperado': return this.P + this.V + this.F - this.C;
      default: throw new Error('estado de unidad desconocido ' + this.estado);
    }
  }
  recalcular(causa) { const d = this.objetivo() - this.G; if (d !== 0) { this.G += d; this.asientos.push({ causa, delta: d, saldo: this.G }); } return d; }
}

// ---- Cierres de credito sobre una unidad vendida
function cerrarSinRecuperar(u) { u.estado = 'cerrado'; return u.recalcular('cierre P-C'); }
function incobrable(u, fondo, ref) {
  if (u.eventos.has('INC:' + ref)) return { E: 0, F: u.F, delta: 0, neto: u.G, repetido: true };
  u.eventos.add('INC:' + ref);
  const E = exposicion(u.C, u.P, 0), F = Math.min(fondo.saldo, E);
  if (F > 0) fondo.mover(-F, 'incobrable', ref);
  u.F = F; u.V = 0; u.estado = 'incobrable';
  const d = u.recalcular('incobrable (neto)');
  return { E, F, delta: d, neto: u.G };
}
function recuperar(u, fondo, V, ref, previo = null) {
  if (V > u.C) throw new Error('valor de ingreso mayor al costo');
  if (u.eventos.has('REC:' + ref)) return { E: 0, F: u.F, delta: 0, total: u.G, repetido: true }; // el evento ya esta aplicado: no mueve el fondo ni la ganancia
  u.eventos.add('REC:' + ref);
  let F2, E;
  if (previo) {
    E = exposicion(u.C, u.P, V);
    F2 = Math.min(fondo.saldo + previo.F, E);
    const dif = previo.F - F2; if (dif !== 0) fondo.mover(dif, 'correccion por recuperacion', ref);
  } else {
    E = exposicion(u.C, u.P, V); F2 = Math.min(fondo.saldo, E);
    if (F2 > 0) fondo.mover(-F2, 'recuperacion', ref);
  }
  u.F = F2; u.V = V; u.estado = 'recuperado';
  const d = u.recalcular('recuperacion');
  return { E, F: F2, delta: d, total: u.G, unidadNuevaCosto: V };
}
// baja de unidad NO vendida: asiento informativo (renglon Baja de inventario), nunca suma a Equipos
function darDeBaja(u, { rescate = 0, reembolso = 0 } = {}) {
  if (u.estado !== 'inventario') throw new Error('solo una unidad sin vender se da de baja asi');
  u.baja = { perdida: Math.max(0, u.C - rescate - reembolso) };
  return u.baja.perdida;
}

// ---- Netos reconstruidos desde los libros (control 5.8, invariante 2)
function netos(cr) {
  const v = cr.cobros.filter((x) => x.vigente);
  const sum = (arr, k) => arr.reduce((s, x) => s + x[k], 0);
  return {
    cobradoPrecio: cr.entrega - cr.entregaRevertida + sum(v, 'c') - sum(cr.reversas, 'c'),
    interesCobrado: sum(v, 'i') - sum(cr.reversas, 'i'),
    fondoAportado: sum(v, 'f') - sum(cr.reversas, 'f'),
  };
}

// ---- Reversa de un cobro (solo el ultimo vigente) - Admin
function reversarCobro(cr, fondo, id, ref) {
  const vig = cr.cobros.filter((x) => x.vigente && !x.revertidoPorDevolucion);
  const x = vig[vig.length - 1];
  if (!x || x.id !== id) throw new Error('solo se puede reversar el ultimo cobro vigente');
  if (cr.reversas.some((r) => r.idCobro === id)) throw new Error('ya reversado');
  if (cr.saldoFavor < x.saldoFavor) throw new Error('el saldo a favor de este cobro ya se uso');
  x.vigente = false;
  cr.pend.capital += x.c; cr.pend.fondo += x.f; cr.pend.interes += x.i;
  cr.cobradoPrecio -= x.c; cr.interesCobrado -= x.i; cr.fondoAportado -= x.f; cr.saldoFavor -= x.saldoFavor;
  for (const a of x.alloc) cr.cuotas[a.cuota - 1].cubierto -= a.monto;
  const sale = Math.min(x.f, fondo.saldo), faltante = x.f - sale;
  if (sale > 0) fondo.mover(-sale, 'reversa de cobro', ref);
  if (cr.estado === 'Pagado') cr.estado = 'Abierto';
  return { faltanteFondo: faltante };
}

// ---- Devolucion: reembolso LIFO sobre cobros, reparto original (regla 12)
function devolver(cr, u, fondo, { reembolso, ref }) {
  const vig = cr.cobros.filter((x) => x.vigente);
  const total = cr.entrega - cr.entregaRevertida + vig.reduce((s, x) => s + x.aplicado - (cr.reversas.filter((r) => r.idCobro === x.id).reduce((a, r) => a + r.aplicado, 0)), 0);
  if (reembolso > total) throw new Error('reembolso mayor a lo cobrado');
  let resto = reembolso; const rev = { c: 0, f: 0, i: 0, entrega: 0 };
  for (const x of [...vig].reverse()) {
    if (resto <= 0) break;
    const yaRev = cr.reversas.filter((r) => r.idCobro === x.id).reduce((a, r) => a + r.aplicado, 0);
    const disp = x.aplicado - yaRev; if (disp <= 0) continue;
    const r = Math.min(resto, disp); resto -= r;
    const completo = r === x.aplicado;
    const crr = completo ? x.c : Math.floor((r * x.c) / x.aplicado);
    const fr = completo ? x.f : Math.floor((r * x.f) / x.aplicado);
    const ir = r - crr - fr;
    cr.reversas.push({ idCobro: x.id, idDevolucion: ref, aplicado: r, c: crr, f: fr, i: ir });
    rev.c += crr; rev.f += fr; rev.i += ir;
  }
  if (resto > 0) { rev.entrega = resto; cr.entregaRevertida += resto; }
  const fSale = Math.min(rev.f, fondo.saldo), faltanteFondo = rev.f - fSale;
  if (fSale > 0) fondo.mover(-fSale, 'devolucion ' + ref, ref);
  cr.interesCobrado -= rev.i; cr.fondoAportado -= rev.f; cr.cobradoPrecio -= rev.c + rev.entrega;
  u.P = u.P - rev.c - rev.entrega;
  const gAnt = u.G; u.estado = 'anulada'; u.recalcular('devolucion: revierte ganancia');
  cr.estado = 'Anulado';
  const retenido = total - reembolso;
  const danosRetenidos = retenido - cr.interesCobrado - cr.fondoAportado;
  return { rev, retenido, danosRetenidos, fSale, faltanteFondo, gananciaRevertida: gAnt, interesAunReconocido: cr.interesCobrado, fondoAunAportado: cr.fondoAportado };
}

// ---- Servicio a terceros y tecnico
function ordenServicio({ cobro, repuestos, tarifa }) { return { cobro, repuestos, tarifa, ganancia: cobro - repuestos - tarifa }; }
// v3.6: servicio tecnico con anticipos. cobro_final es el precio total (o lo retenido en una cancelacion); el anticipo recibido antes ya es dinero de la caja.
// El asiento de Servicio tecnico es el cobro_final completo; al entregar entra solo el saldo; si el anticipo supera el cobro_final, el exceso se devuelve.
function cobroOrden({ cobro_final, anticipos }) {
  const saldo = Math.max(0, cobro_final - anticipos), devolucion = Math.max(0, anticipos - cobro_final);
  return { asiento: cobro_final, saldo, devolucion, dineroDeLaOrden: anticipos + saldo - devolucion };
}
class CostosTecnico {
  constructor() { this.filas = []; }
  devengar(mes, monto, origen) { this.filas.push({ mes, monto, origen, estado: 'Pendiente', liq: null }); }
  liquidar(liq) { this.filas.filter((x) => x.estado === 'Pendiente').forEach((x) => { x.estado = 'Incluido'; x.liq = liq; }); }
  pagar(liq) { this.filas.filter((x) => x.liq === liq).forEach((x) => { x.estado = 'Pagado'; }); }
  saldoAPagar() { return this.filas.filter((x) => x.estado !== 'Pagado').reduce((s, x) => s + x.monto, 0); }
}
const capitalLibre = ({ dineroDisponible, saldosAFavor, tecnicoDevengadoImpago }) => dineroDisponible - saldosAFavor - tecnicoDevengadoImpago;

// Costo de una linea de repuesto: el total de la linea manda (no unitario x cantidad truncado)
function costoLinea(montoPagado, cantidad) { return { total: montoPagado, unitarioInformativo: Math.floor(montoPagado / cantidad) }; }

// Cierre mensual: primero el ajuste de caja, despues se guardan los saldos finales
function cerrarMes({ dineroLibro, dineroContado }) {
  const ajuste = dineroContado === undefined ? 0 : dineroContado - dineroLibro;
  return { dineroAntesAjuste: dineroLibro, ajusteCaja: ajuste, dineroFinal: dineroLibro + ajuste };
}


// ---- Operaciones: validar primero, Iniciada con payload + reserva de TODOS los registros que la operacion escribe, reanudar sin revalidar (v3.2/v3.4)
// v3.3: guardia de doble toque DENTRO de ejecutar (despues de la idempotencia), resolucion de operaciones interrumpidas
//       (reanudar / abandonar, solo Administrador) y ajuste correctivo que exige id_decision y verifica el invariante.
// v3.4: la reserva abarca una lista de registros (credito, unidad, cliente, orden, liquidacion); revisar() desmarca un registro que vuelve a verde;
//       INVARIANTES_POR_REGISTRO fija que invariantes corre el ajuste correctivo.
const INVARIANTES_POR_REGISTRO = { credito: [1, 2, 3, 6, 7], unidad: [5, 6, 7], cliente: [7, 8], liquidacion: [7, 9], orden: [7, 11] };
class Operaciones {
  constructor() { this.filas = new Map(); this.reservas = new Map(); this.bloqueados = new Set(); this.libro = []; this.recientes = []; }
  bloquearRegistro(reg) { this.bloqueados.add(reg); }
  revisar(reg, verificar) { const dif = verificar(); if (dif.length === 0) this.bloqueados.delete(reg); return { desbloqueado: dif.length === 0, diferencias: dif }; }
  listarPendientes() { return [...this.filas].filter(([, f]) => f.estado === 'Iniciada').map(([id, f]) => ({ id, registro: f.registro, registros: f.registros, payload: f.payload })); }
  ejecutar({ id, registro, payload, validar, escribir, correctivo = false, idDecision = null, verificar = null, guardia = null }) {
    const regs = [].concat(registro);
    const f = this.filas.get(id);
    if (f && f.estado === 'Completa') return f.resultado;               // reintento de algo ya terminado: la guardia NO interviene
    if (!f) {                                                           // operacion nueva
      for (const r of regs) { const dueño = this.reservas.get(r); if (dueño && dueño !== id) throw new Error('operacion pendiente sobre ' + r); }
      for (const r of regs) if (this.bloqueados.has(r) && !correctivo) throw new Error('registro bloqueado por diferencia: ' + r);
      if (correctivo && !idDecision) throw new Error('el ajuste correctivo exige una entrada en Decisiones (id_decision)');
      if (guardia) {                                                    // doble toque con OTRO id: solo se comprueba, se anota despues de validar
        const dup = this.recientes.some((r) => r.huella === guardia.huella && guardia.ahoraSeg - r.t <= (guardia.ventana || 120));
        if (dup && !guardia.confirmar) throw new Error('posible duplicado: confirmar para registrar');
      }
      validar(payload);                                                 // si rechaza, NO queda fila Iniciada ni huella anotada
      this.filas.set(id, { estado: 'Iniciada', payload: JSON.parse(JSON.stringify(payload)), registro: regs.join(','), registros: regs });
      for (const r of regs) this.reservas.set(r, id);
      if (guardia) this.recientes.push({ huella: guardia.huella, t: guardia.ahoraSeg });
    }
    const fila = this.filas.get(id);                                    // reanudacion: payload guardado, sin revalidar estado
    const escribirFila = (clave, dato) => { const k = id + '#' + clave; if (!this.libro.some((x) => x.k === k)) this.libro.push({ k, dato }); };
    let resultado = escribir(fila.payload, escribirFila);
    if (correctivo) {                                                   // el bloqueo se levanta solo si TODOS los invariantes del registro vuelven a verde
      const dif = verificar ? verificar() : ['sin verificacion'];
      const resuelta = dif.length === 0;
      if (resuelta) for (const r of regs) this.bloqueados.delete(r);
      resultado = { resultado, diferenciaResuelta: resuelta, diferencias: dif };
    }
    fila.estado = 'Completa'; fila.resultado = resultado; for (const r of fila.registros) if (this.reservas.get(r) === id) this.reservas.delete(r);
    return resultado;
  }
  // Solo Administrador. 'reanudar' completa lo que falta con el payload guardado; 'abandonar' libera las reservas sin deshacer filas
  // y corre el invariante: si queda una diferencia, los registros pasan a bloqueados por diferencia (solo opera el ajuste correctivo).
  resolverInterrumpida({ id, accion, motivo, idDecision, validar = () => {}, escribir, verificar = null }) {
    const f = this.filas.get(id);
    if (!f || f.estado !== 'Iniciada') throw new Error('no hay una operacion pendiente con ese id');
    if (accion === 'reanudar') return this.ejecutar({ id, registro: f.registros, payload: f.payload, validar, escribir });
    if (accion !== 'abandonar') throw new Error('accion invalida: reanudar o abandonar');
    if (!motivo || !idDecision) throw new Error('abandonar exige motivo y entrada en Decisiones (id_decision)');
    f.estado = 'Completa'; f.resultado = 'abandonada por el Administrador'; f.motivo = motivo; f.idDecision = idDecision;
    for (const r of f.registros) if (this.reservas.get(r) === id) this.reservas.delete(r);
    const dif = verificar ? verificar() : [];
    if (dif.length) for (const r of f.registros) this.bloquearRegistro(r);
    return { abandonada: true, filasEscritasQuedan: this.libro.filter((x) => x.k.startsWith(id + '#')).length, diferencias: dif };
  }
}
// ---- Simulacion con huella del estado utilizado; la operacion real la comprueba (v3.2)
// v3.3: para simularIncobrable y simularRecuperacion la huella incluye tambien costo, cobrado del precio, ganancia, estado y fondo aplicado de la unidad.
const huellaUnidad = (u) => [u.C, u.P, u.G, u.estado, u.F].join(',');
const huellaEstado = (cr, fondo, u = null) => [cr.cobros.length, cr.reversas.length, cr.estado, deudaPendiente(cr), fondo.saldo].concat(u ? [huellaUnidad(u)] : []).join('|');
function confirmarConHuella(huellaSimulada, cr, fondo, u = null) { if (huellaSimulada !== huellaEstado(cr, fondo, u)) throw new Error('el estado cambio desde la simulacion: simular de nuevo'); }
// ---- Huella de negocio para el doble toque: el ajuste correctivo se distingue del ordinario, pero tambien pasa por la guardia (v3.3)
const huellaNegocio = ({ operacion, registro, tipo = '', monto, correctivo = false }) => [operacion, registro, tipo, monto, correctivo ? 'C' : 'O'].join('|');
// ---- Guardia contra el doble toque con otro id_operacion (cobros y ajustes), version autonoma
function guardiaDuplicado(recientes, huella, ahoraSeg, { ventana = 120, confirmar = false } = {}) {
  const dup = recientes.some((r) => r.huella === huella && ahoraSeg - r.t <= ventana);
  if (dup && !confirmar) throw new Error('posible duplicado: confirmar para registrar');
  recientes.push({ huella, t: ahoraSeg }); return true;
}

// Objeto unico con el que PruebasMotor.gs y el resto del backend llaman al motor.
var M = { Operaciones, INVARIANTES_POR_REGISTRO, huellaEstado, huellaUnidad, huellaNegocio, confirmarConHuella, guardiaDuplicado, CFG, pct, pagar, abrirCredito, cobrar, cancelarAnticipado, deudaPendiente, Fondo, exposicion, Unidad, cerrarSinRecuperar, incobrable, recuperar, darDeBaja, netos, reversarCobro, devolver, ordenServicio, cobroOrden, CostosTecnico, capitalLibre, costoLinea, cerrarMes };
