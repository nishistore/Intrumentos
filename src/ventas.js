/* ====================== VENTAS POR WHATSAPP ===============================

   El dueño cierra ventas por WhatsApp y hasta ahora no quedaban registradas.
   Desde /pedidos las anota aquí: se guardan como un pedido más (canal
   'whatsapp', estado 'pagado'), bajan el stock y reciben sus cupones del
   sorteo al guardarse. La confirmación por correo NO sale sola: la manda el
   dueño con un botón, al correo que escriba. Una venta cancelada se anula,
   devuelve el stock y anula los cupones.

   Todas devuelven { error, status } o un resultado; quien las llama arma la
   respuesta HTTP. */
import { nuevoId, leerPedido, descontarStock, correoAlCliente } from './pagos.js';
import { asignarCupones, anularCuponesDelPedido, cuponesDelPedido, normalizaEmail } from './cupones.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ENTREGAS = ['tienda', 'lima', 'peru'];

/* "Producto tienda física": algo que se vende solo en la tienda y no está en el
   catálogo. Va con id 0: se cobra el precio que escriba el dueño, no baja ni
   devuelve stock (no hay de dónde) y cuenta para los cupones como cualquier otro.
   El campo "color" de la línea sirve de detalle libre ("cuerdas de arpa"). */
export const ID_TIENDA_FISICA = 0;
export const NOMBRE_TIENDA_FISICA = 'Producto tienda física';

function limpio(v, max) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
}

function redondea(n) {
  return Math.round(n * 100) / 100;
}

export async function devolverStock(env, items) {
  for (const i of items) {
    if (i.id === ID_TIENDA_FISICA) continue;
    await env.DB.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').bind(i.qty, i.id).run();
  }
}

export async function registrarVentaWhatsapp(env, cuerpo, ahora = Date.now()) {
  const nombre = limpio(cuerpo.nombre, 80);
  const telefono = String(cuerpo.telefono || '').replace(/\D/g, '');
  const email = normalizaEmail(cuerpo.email);
  const entrega = cuerpo.entrega;
  if (nombre.length < 2) return { error: 'Escribe el nombre del cliente.', status: 400 };
  if (!/^\d{9}$/.test(telefono)) return { error: 'El celular debe tener 9 dígitos.', status: 400 };
  /* El correo puede faltar al registrar: se pide al enviar la confirmación. */
  if (email && (email.length > 120 || !EMAIL_RE.test(email))) return { error: 'Revisa el correo.', status: 400 };
  if (!ENTREGAS.includes(entrega)) return { error: 'Elige cómo recibe el pedido.', status: 400 };
  let direccion = limpio(cuerpo.direccion, 300);
  if (entrega === 'tienda' && !direccion) direccion = 'Recojo en tienda';
  if (direccion.length < 3) return { error: 'Falta la dirección o quién recoge.', status: 400 };
  const envio = cuerpo.envio === undefined || cuerpo.envio === '' ? 0 : Number(cuerpo.envio);
  if (!Number.isFinite(envio) || envio < 0 || envio > 500) return { error: 'El envío no es válido.', status: 400 };

  const entrada = Array.isArray(cuerpo.items) ? cuerpo.items : [];
  if (!entrada.length || entrada.length > 30) return { error: 'Agrega al menos un producto.', status: 400 };
  const lineas = [];
  for (const x of entrada) {
    const id = Number(x && x.id), qty = Number(x && x.qty);
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1 || qty > 50) {
      return { error: 'Hay un producto o una cantidad inválida.', status: 400 };
    }
    let precio = null;
    if (x.price !== undefined && x.price !== null && x.price !== '') {
      precio = Number(x.price);
      if (!Number.isFinite(precio) || precio <= 0 || precio > 100000) return { error: 'Hay un precio inválido.', status: 400 };
      precio = redondea(precio);
    }
    if (id === ID_TIENDA_FISICA && precio == null) return { error: 'Escribe el precio del producto de tienda física.', status: 400 };
    lineas.push({ id, qty, precio, color: limpio(x.color, id === ID_TIENDA_FISICA ? 80 : 40) || null });
  }

  const ids = [...new Set(lineas.map(l => l.id).filter(id => id !== ID_TIENDA_FISICA))];
  const productos = new Map();
  if (ids.length) {
    const { results } = await env.DB.prepare(
      'SELECT id, name, price FROM products WHERE id IN (' + ids.map(() => '?').join(',') + ')'
    ).bind(...ids).all();
    for (const r of results) productos.set(r.id, r);
  }
  const items = [];
  for (const l of lineas) {
    if (l.id === ID_TIENDA_FISICA) {
      items.push({ id: ID_TIENDA_FISICA, name: NOMBRE_TIENDA_FISICA, price: l.precio, qty: l.qty, color: l.color });
      continue;
    }
    const p = productos.get(l.id);
    if (!p) return { error: 'Un producto ya no existe en el catálogo.', status: 409 };
    items.push({ id: l.id, name: p.name, price: l.precio == null ? p.price : l.precio, qty: l.qty, color: l.color });
  }
  const subtotal = redondea(items.reduce((s, i) => s + i.price * i.qty, 0));
  const total = redondea(subtotal + envio);

  const id = nuevoId();
  await env.DB.prepare(
    'INSERT INTO pedidos (id, estado, creado_ms, expira_ms, total, subtotal, envio, provincia, items, ' +
    'entrega, agencia, nombre, telefono, email, direccion, ip, pagado_ms, canal, nota) ' +
    "VALUES (?, 'pagado', ?, ?, ?, ?, ?, 0, ?, ?, NULL, ?, ?, ?, ?, NULL, ?, 'whatsapp', 'Venta por WhatsApp')"
  ).bind(id, ahora, ahora, total, subtotal, envio, JSON.stringify(items),
    entrega, nombre, telefono, email, direccion, ahora).run();

  const faltantes = await descontarStock(env, items.filter(i => i.id !== ID_TIENDA_FISICA));
  await env.DB.prepare(
    'UPDATE pedidos SET stock_descontado = 1, nota = ? WHERE id = ?'
  ).bind('Venta por WhatsApp' + (faltantes.length ? ' · Ojo: no alcanzó el stock de ' + faltantes.join(', ') : ''), id).run();

  let aviso = null;
  try { await asignarCupones(env, await leerPedido(env, id), ahora); }
  catch (err) {
    console.log('[sorteo] no se pudieron dar los cupones de ' + id, String(err));
    aviso = 'La venta se guardó pero no se pudieron dar los cupones.';
  }
  return { pedido: await leerPedido(env, id), cupones: await cuponesDelPedido(env, id).catch(() => []), aviso };
}

/* Solo ventas de WhatsApp ya registradas. Idempotente: el segundo clic no
   devuelve el stock otra vez. */
export async function anularVenta(env, p) {
  if (p.canal !== 'whatsapp') return { error: 'Solo se anulan las ventas registradas por WhatsApp.', status: 409 };
  if (p.estado !== 'pagado') return { error: 'Esa venta ya no está activa.', status: 409 };
  const ganador = await env.DB.prepare(
    'SELECT g.premio FROM ganadores g JOIN cupones c ON c.numero = g.numero ' +
    'WHERE c.pedido_id = ? AND g.descartado = 0'
  ).bind(p.id).first().catch(() => null);
  if (ganador) {
    return { error: 'Uno de sus cupones ya salió ganador del premio ' + ganador.premio + '. Descarta al ganador primero.', status: 409 };
  }

  const r = await env.DB.prepare(
    "UPDATE pedidos SET estado = 'anulado', nota = COALESCE(nota,'') || ' · Anulada' " +
    "WHERE id = ? AND estado = 'pagado' AND canal = 'whatsapp'"
  ).bind(p.id).run();
  if (!r.meta || r.meta.changes !== 1) return { error: 'Esa venta ya no está activa.', status: 409 };
  if (p.stock_descontado) {
    await devolverStock(env, JSON.parse(p.items));
    await env.DB.prepare('UPDATE pedidos SET stock_descontado = 0 WHERE id = ?').bind(p.id).run();
  }
  await anularCuponesDelPedido(env, p.id);
  return { ok: true };
}

/* El botón "Enviar confirmación y cupones por correo". El correo se escribe
   en el momento (o se confirma el que ya había) y se guarda en el pedido y en
   sus cupones, para que el sorteo reconozca al cliente por él. */
export async function enviarConfirmacion(env, p, emailNuevo) {
  if (p.estado !== 'pagado') return { error: 'Solo se confirma un pedido pagado.', status: 409 };
  const email = normalizaEmail(emailNuevo || p.email);
  if (!email || email.length > 120 || !EMAIL_RE.test(email)) return { error: 'Escribe un correo válido.', status: 400 };
  if (email !== p.email) {
    await env.DB.prepare('UPDATE pedidos SET email = ? WHERE id = ?').bind(email, p.id).run();
    await env.DB.prepare('UPDATE cupones SET email = ? WHERE pedido_id = ?').bind(email, p.id).run().catch(() => {});
  }
  const enviado = await correoAlCliente(env, { ...p, email });
  if (!enviado) return { error: 'El correo no salió. Revisa la dirección e inténtalo otra vez.', status: 502 };
  await env.DB.prepare('UPDATE pedidos SET correo_ms = ? WHERE id = ?').bind(Date.now(), p.id).run();
  return { ok: true, email };
}
