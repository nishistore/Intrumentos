/* ====================== PAGOS CON YAPE ===================================

   El cliente yapea, sube la captura del comprobante y el Worker la lee con
   Gemini. Yape personal no tiene API para consultar pagos, así que lo que se
   valida es la captura, y eso se compensa con reglas que no dependen de la IA:
   monto exacto, destinatario, ventana de tiempo, y un número de operación que
   no se puede repetir (PRIMARY KEY en pagos_usados).

   Estados de un pedido:
     pendiente  creado, esperando la captura (o una captura que no pasó)
     revision   lo decide el dueño desde el correo: monto alto, IA dudosa o
                demasiados intentos
     pagado     validado: baja el stock y se avisa al cliente
     rechazado  el dueño lo rechazó
     expirado   se acabó el tiempo sin pago válido

   Lo que hace falta fuera del código: tablas (migrations/pedidos.sql), el
   bucket COMPROBANTES (privado, distinto de FOTOS, que sí es público por
   r2.dev) y los secretos GEMINI_API_KEY y RESEND_API_KEY. Ver wrangler.jsonc. */

/* ------------------------------ ajustes ------------------------------ */
export const YAPE = {
  numero: '921317384',
  /* Como lo muestra Yape al pagador: nombre cortado y con asterisco. */
  nombreVisible: 'Mhelisabel Ald*',
  /* Lo que se compara contra lo leído: sin tildes, sin asterisco. */
  nombrePrefijo: 'mhelisabel',
  ultimosDigitos: '384',
};
const MINUTOS_PARA_PAGAR = 10;
/* Después de que vence el pedido todavía se acepta una captura si el pago
   mismo se hizo a tiempo: yapear, volver a la página y subir la foto no es
   instantáneo. */
const GRACIA_SUBIDA_MS = 5 * 60 * 1000;
/* Tolerancia entre el reloj de Yape y el nuestro. La captura trae la hora
   solo hasta el minuto. */
const TOLERANCIA_RELOJ_MS = 60 * 1000;
const REVISION_DESDE = 200;       // soles: de aquí para arriba decide el dueño
const MAX_INTENTOS = 3;           // capturas por pedido antes de pasar a revisión
const MAX_PEDIDOS_POR_IP = 6;     // pedidos abiertos por IP en una ventana
const MAX_BYTES_CAPTURA = 1.5 * 1024 * 1024;

const FREE_SHIPPING_THRESHOLD = 100;   // iguales a las de index.html
const SHIPPING_FEE = 15;
const PROVINCE_SURCHARGE = 5;

const CORREO_DUENO = 'nishistore@gmail.com';
const SITE = 'https://chipaomusic.com';
/* gemini-2.5-flash ya no se da a cuentas nuevas (404). Flash-Lite lee bien los
   comprobantes (probado con capturas reales) y tiene plan gratuito. */
const MODELO_POR_DEFECTO = 'gemini-3.5-flash-lite';

/* ------------------------------ utilidades ------------------------------ */
function json(datos, status = 200) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function sinTildes(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function soles(n) {
  return 'S/ ' + (Math.round(n * 100) % 100 === 0 ? String(Math.round(n)) : n.toFixed(2));
}

function hex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(buffer) {
  return hex(await crypto.subtle.digest('SHA-256', buffer));
}

function base64(buffer) {
  const bytes = new Uint8Array(buffer);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

/* CH- y seis caracteres sin los que se confunden (0/O, 1/I). Se usa en la
   URL (/pedido/CH-XXXXXX), así que además de legible tiene que ser difícil
   de adivinar: son ~10^9 combinaciones. */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function nuevoId() {
  const b = crypto.getRandomValues(new Uint8Array(6));
  return 'CH-' + [...b].map(x => ALFABETO[x % ALFABETO.length]).join('');
}

function tipoDeImagen(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return 'image/webp';
  return null;
}

/* ------------------------------ secreto de los enlaces ------------------
   Los enlaces del correo (aprobar / rechazar) llevan una firma HMAC del id.
   El secreto vive en la tabla settings y se crea solo la primera vez, para
   que no haya otra clave que configurar. */
async function secretoDeEnlaces(env) {
  const fila = await env.DB.prepare("SELECT value FROM settings WHERE key = 'pagos_secret'").first();
  if (fila && fila.value) return fila.value;
  const nuevo = hex(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES ('pagos_secret', ?)"
  ).bind(nuevo).run();
  const otra = await env.DB.prepare("SELECT value FROM settings WHERE key = 'pagos_secret'").first();
  return otra.value;
}

async function firma(env, id) {
  const secreto = await secretoDeEnlaces(env);
  const llave = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', llave, new TextEncoder().encode('pedido:' + id)));
}

async function firmaValida(env, id, t) {
  if (!t || typeof t !== 'string') return false;
  const esperada = await firma(env, id);
  if (t.length !== esperada.length) return false;
  let diff = 0;
  for (let i = 0; i < t.length; i++) diff |= t.charCodeAt(i) ^ esperada.charCodeAt(i);
  return diff === 0;
}

/* ------------------------------ totales ------------------------------ */
export function calcularTotales(subtotal, entrega, conAgencia) {
  const envio = subtotal <= 0 || entrega === 'tienda' ? 0
    : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const provincia = subtotal > 0 && entrega === 'envio' && conAgencia ? PROVINCE_SURCHARGE : 0;
  return { subtotal, envio, provincia, total: subtotal + envio + provincia };
}

/* ------------------------------ validación ------------------------------
   Pura: recibe lo que leyó la IA y el pedido, y dice qué falla. No toca la
   base ni la red, para poder probarla con capturas de mentira. */

/* La captura trae fecha y hora de Lima (UTC-5, sin horario de verano). */
export function momentoDePago(fecha, hora) {
  const f = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fecha || '').trim());
  const h = /^(\d{1,2}):(\d{2})$/.exec(String(hora || '').trim());
  if (!f || !h) return null;
  const ms = Date.UTC(+f[1], +f[2] - 1, +f[3], +h[1] + 5, +h[2]);
  return Number.isFinite(ms) ? ms : null;
}

export function validarLectura(lectura, pedido, ahora) {
  const fallos = [];   // el cliente puede corregirlo con otra captura
  const dudas = [];    // no es culpa del cliente: lo decide el dueño

  if (!lectura || lectura.es_yape !== true) {
    fallos.push('La imagen no parece un comprobante de Yape ("¡Yapeaste!").');
    return { ok: false, fallos, dudas };
  }

  const monto = Number(lectura.monto);
  if (!Number.isFinite(monto)) {
    fallos.push('No se alcanza a leer el monto. Sube la captura completa y sin recortar.');
  } else if (Math.abs(monto - pedido.total) > 0.009) {
    fallos.push(`El comprobante es de ${soles(monto)} y tu pedido es de ${soles(pedido.total)}.`);
  }

  const nombre = sinTildes(lectura.destinatario).replace(/[^a-z ]/g, '').trim();
  const digitos = String(lectura.celular_ultimos || '').replace(/\D/g, '');
  const nombreOk = nombre.startsWith(YAPE.nombrePrefijo);
  const celularOk = digitos.endsWith(YAPE.ultimosDigitos);
  if (!nombreOk || !celularOk) {
    fallos.push(`El comprobante no es de un pago a ${YAPE.nombreVisible} (celular terminado en ${YAPE.ultimosDigitos}).`);
  }

  const operacion = String(lectura.operacion || '').replace(/\D/g, '');
  if (!/^\d{6,12}$/.test(operacion)) {
    fallos.push('No se alcanza a leer el número de operación.');
  }

  const pagoMs = momentoDePago(lectura.fecha, lectura.hora);
  if (pagoMs == null) {
    fallos.push('No se alcanza a leer la fecha y la hora del pago.');
  } else {
    /* La hora llega redondeada al minuto hacia abajo: un pago hecho a las
       17:17:50 dice 17:17. Por eso se compara contra el minuto del pedido. */
    const creadoMin = Math.floor(pedido.creado_ms / 60000) * 60000;
    if (pagoMs < creadoMin - TOLERANCIA_RELOJ_MS) {
      fallos.push('El pago es anterior a este pedido. Tienes que yapear después de crearlo.');
    } else if (pagoMs > pedido.expira_ms + TOLERANCIA_RELOJ_MS) {
      fallos.push('El pago se hizo después de que venciera el tiempo del pedido.');
    } else if (pagoMs > ahora + 2 * TOLERANCIA_RELOJ_MS) {
      fallos.push('La hora del comprobante está en el futuro.');
    }
  }

  if (lectura.sospecha && String(lectura.sospecha).trim()) {
    dudas.push('La IA vio algo raro en la imagen: ' + String(lectura.sospecha).trim());
  }
  if (pedido.total >= REVISION_DESDE) {
    dudas.push(`Monto desde ${soles(REVISION_DESDE)}: lo confirmas tú.`);
  }

  return { ok: fallos.length === 0, fallos, dudas, operacion, pagoMs };
}

/* ------------------------------ Gemini ------------------------------ */
/* Gemini cree que 2026 todavía no llega y marca las capturas de este año como
   "posible manipulación" o deja la fecha vacía. Por eso el prompt lleva la
   fecha de hoy y prohíbe juzgar fechas: solo transcribir. */
function promptLectura(ahora) {
  const hoy = new Date(ahora - 5 * 3600000).toISOString().slice(0, 10);
  return `Hoy es ${hoy} (hora de Lima). Las fechas de este año y del anterior son normales: NO las juzgues, solo transcríbelas.
Esta imagen debería ser la captura de un comprobante de la app Yape (Perú), la pantalla morada que dice "¡Yapeaste!".
Lee SOLO lo que se ve y devuelve JSON. No inventes nada: si un dato no se ve, déjalo vacío.
- es_yape: true solo si es la pantalla de comprobante de Yape (no una foto de otra pantalla, ni otra app, ni un montaje).
- monto: el número grande tras "S/" (puede tener decimales).
- destinatario: el nombre que aparece debajo del monto, tal cual (suele terminar en *).
- celular_ultimos: los dígitos visibles de "Nro. de celular" (por ejemplo 384).
- fecha: en formato YYYY-MM-DD. Los meses vienen abreviados en español: ene, feb, mar, abr, may, jun, jul, ago, set, oct, nov, dic.
- hora: en 24 horas HH:MM. "05:17 p. m." es 17:17 y "12:22 p. m." es 12:22; "12:05 a. m." es 00:05.
- operacion: el número de "Nro. de operación".
- codigo_seguridad: los tres dígitos de "Código de seguridad".
- mensaje: el texto del mensaje que escribió quien pagó, si hay una caja con mensaje.
- sospecha: SOLO si ves señales visuales de edición (tipografías distintas, números desalineados, recortes raros, bordes de pegado), explica en una frase corta qué ves. Nunca la uses para comentar la fecha, el año ni el monto. Si todo se ve normal, deja este campo vacío.`;
}

const ESQUEMA_LECTURA = {
  type: 'OBJECT',
  properties: {
    es_yape: { type: 'BOOLEAN' },
    monto: { type: 'NUMBER' },
    destinatario: { type: 'STRING' },
    celular_ultimos: { type: 'STRING' },
    fecha: { type: 'STRING' },
    hora: { type: 'STRING' },
    operacion: { type: 'STRING' },
    codigo_seguridad: { type: 'STRING' },
    mensaje: { type: 'STRING' },
    sospecha: { type: 'STRING' },
  },
  /* Con solo es_yape obligatorio, Flash-Lite a veces devolvía tres campos y se
     saltaba destinatario, fecha y hora (con un comentario sobre que "2026 es
     un año inusual"). Obligatorios todos, y sospecha al final para que el
     modelo transcriba primero y opine después. */
  required: ['es_yape', 'monto', 'destinatario', 'celular_ultimos', 'fecha', 'hora',
    'operacion', 'codigo_seguridad', 'mensaje', 'sospecha'],
  propertyOrdering: ['es_yape', 'monto', 'destinatario', 'celular_ultimos', 'fecha', 'hora',
    'operacion', 'codigo_seguridad', 'mensaje', 'sospecha'],
};

/* Devuelve el objeto leído. Lanza si Gemini no responde o responde algo que
   no es JSON: quien llama manda el pedido a revisión del dueño. */
export async function leerComprobante(env, bytes, mime) {
  if (!env.GEMINI_API_KEY) throw new Error('Falta GEMINI_API_KEY');
  const modelo = env.GEMINI_MODEL || MODELO_POR_DEFECTO;
  const cuerpo = JSON.stringify({
    contents: [{ parts: [
      { text: promptLectura(Date.now()) },
      { inline_data: { mime_type: mime, data: base64(bytes) } },
    ] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: ESQUEMA_LECTURA,
    },
  });
  const pedir = () => fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: cuerpo,
      signal: AbortSignal.timeout(20000),
    });
  /* Un 429/5xx suele ser un pico de demanda ("high demand"): se reintenta
     una vez. Si sigue, quien llama manda el pedido a revisión. */
  let respuesta = await pedir();
  if (respuesta.status === 429 || respuesta.status >= 500) {
    await new Promise(r => setTimeout(r, 1200));
    respuesta = await pedir();
  }
  if (!respuesta.ok) {
    throw new Error('Gemini ' + respuesta.status + ': ' + (await respuesta.text()).slice(0, 300));
  }
  const datos = await respuesta.json();
  const texto = datos.candidates && datos.candidates[0] && datos.candidates[0].content
    && datos.candidates[0].content.parts && datos.candidates[0].content.parts.map(p => p.text || '').join('');
  if (!texto) throw new Error('Gemini no devolvió texto');
  return JSON.parse(texto);
}

/* Dice que es un comprobante de Yape pero le faltan datos que siempre trae. */
export function lecturaIncompleta(l) {
  return Boolean(l && l.es_yape === true && (
    !String(l.destinatario || '').trim() || !l.fecha || !l.hora
    || !/\d{6,}/.test(String(l.operacion || '')) || !(Number(l.monto) > 0)));
}

/* ------------------------------ correo ------------------------------ */
async function enviarCorreo(env, { para, asunto, html }) {
  if (!env.RESEND_API_KEY) {
    console.log('[pagos] sin RESEND_API_KEY, no se envía:', asunto, '->', para);
    return false;
  }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + env.RESEND_API_KEY },
      body: JSON.stringify({
        from: env.CORREO_DE || 'Chipao Music <onboarding@resend.dev>',
        to: [para], subject: asunto, html,
      }),
    });
    if (!r.ok) console.log('[pagos] Resend', r.status, (await r.text()).slice(0, 300));
    return r.ok;
  } catch (err) {
    console.log('[pagos] Resend falló', String(err));
    return false;
  }
}

function lineasHtml(items) {
  return items.map(i =>
    `<li>${i.qty} × ${escapeHtml(i.name)}${i.color ? ` (${escapeHtml(i.color)})` : ''} — ${soles(i.price * i.qty)}</li>`
  ).join('');
}

export function entregaTexto(p) {
  if (p.entrega === 'tienda') return 'Recojo en tienda (Av. Los Héroes 382)';
  const a = p.agencia ? JSON.parse(p.agencia) : null;
  return a ? `Envío a agencia Shalom ${a[1]} (${a[0]}): ${a[2]}` : 'Envío a domicilio';
}

function marco(titulo, cuerpo) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#222">
<h2 style="margin:0 0 12px">${escapeHtml(titulo)}</h2>${cuerpo}
<p style="color:#888;font-size:12px;margin-top:24px">Chipao Music · Av. Los Héroes 382, San Juan de Miraflores</p></div>`;
}

async function correoAlCliente(env, p) {
  const items = JSON.parse(p.items);
  await enviarCorreo(env, {
    para: p.email,
    asunto: `Pago confirmado — pedido ${p.id}`,
    html: marco('¡Pago confirmado!', `
      <p>Hola ${escapeHtml(p.nombre)}, recibimos tu Yape de <b>${soles(p.total)}</b>. Tu pedido <b>${p.id}</b> está confirmado.</p>
      <ul>${lineasHtml(items)}</ul>
      <p><b>Entrega:</b> ${escapeHtml(entregaTexto(p))}</p>
      <p>Cualquier consulta, escríbenos por WhatsApp al +51 921 317 384 con tu código <b>${p.id}</b>.</p>`),
  });
}

async function correoRechazoAlCliente(env, p) {
  await enviarCorreo(env, {
    para: p.email,
    asunto: `No pudimos validar tu pago — pedido ${p.id}`,
    html: marco('No pudimos validar tu pago', `
      <p>Hola ${escapeHtml(p.nombre)}, no pudimos confirmar el Yape del pedido <b>${p.id}</b>.</p>
      <p>Escríbenos por WhatsApp al +51 921 317 384 con tu código <b>${p.id}</b> y lo resolvemos al toque.</p>`),
  });
}

async function correoAlDueno(env, p, motivo, lectura) {
  const items = JSON.parse(p.items);
  const t = await firma(env, p.id);
  const enlace = `${SITE}/pedido-admin?id=${encodeURIComponent(p.id)}&t=${t}`;
  const leido = lectura
    ? `<p style="background:#f4f4f4;padding:8px;border-radius:6px;font-size:13px">La IA leyó: monto ${escapeHtml(lectura.monto)}, `
      + `destinatario ${escapeHtml(lectura.destinatario)}, ${escapeHtml(lectura.fecha)} ${escapeHtml(lectura.hora)}, `
      + `operación ${escapeHtml(lectura.operacion)}</p>` : '';
  await enviarCorreo(env, {
    para: env.CORREO_DUENO || CORREO_DUENO,
    asunto: `Revisar pago ${soles(p.total)} — pedido ${p.id}`,
    html: marco('Hay un pago por revisar', `
      <p><b>${escapeHtml(motivo)}</b></p>
      <p><b>${p.id}</b> — ${escapeHtml(p.nombre)} · ${escapeHtml(p.telefono)} · ${escapeHtml(p.email)}</p>
      <ul>${lineasHtml(items)}</ul>
      <p><b>Total: ${soles(p.total)}</b><br>${escapeHtml(entregaTexto(p))}<br>${escapeHtml(p.direccion)}</p>
      ${leido}
      <p><a href="${enlace}" style="background:#6b0f8a;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">
      Ver la captura y decidir</a></p>
      <p style="color:#888;font-size:12px">Compara con tu app de Yape antes de aprobar.</p>`),
  });
}

async function avisoPagadoAlDueno(env, p) {
  const items = JSON.parse(p.items);
  await enviarCorreo(env, {
    para: env.CORREO_DUENO || CORREO_DUENO,
    asunto: `Pago validado ${soles(p.total)} — pedido ${p.id}`,
    html: marco('Pago validado', `
      <p><b>${p.id}</b> — ${escapeHtml(p.nombre)} · ${escapeHtml(p.telefono)} · ${escapeHtml(p.email)}</p>
      <ul>${lineasHtml(items)}</ul>
      <p><b>Total: ${soles(p.total)}</b> · operación ${escapeHtml(p.operacion || '')}<br>
      ${escapeHtml(entregaTexto(p))}<br>${escapeHtml(p.direccion)}</p>
      <p style="color:#888;font-size:12px">El stock ya se descontó. Revisa tu Yape de vez en cuando contra estos avisos.</p>`),
  });
}

/* ------------------------------ pedidos ------------------------------ */
export async function leerPedido(env, id) {
  return env.DB.prepare('SELECT * FROM pedidos WHERE id = ?').bind(id).first();
}

/* Marca como pagado y descuenta el stock. Idempotente: el UPDATE solo
   prospera una vez, así que un doble clic en "aprobar" no descuenta dos
   veces. */
export async function marcarPagado(env, ctx, id, extra) {
  const ahora = Date.now();
  const r = await env.DB.prepare(
    "UPDATE pedidos SET estado = 'pagado', pagado_ms = ?, nota = COALESCE(?, nota) " +
    "WHERE id = ? AND estado IN ('pendiente','revision')"
  ).bind(ahora, extra || null, id).run();
  if (!r.meta || r.meta.changes !== 1) return false;

  const p = await leerPedido(env, id);
  const items = JSON.parse(p.items);
  const faltantes = [];
  for (const i of items) {
    const d = await env.DB.prepare(
      'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?'
    ).bind(i.qty, i.id, i.qty).run();
    if (!d.meta || d.meta.changes !== 1) faltantes.push(i.name);
  }
  await env.DB.prepare(
    'UPDATE pedidos SET stock_descontado = 1, nota = COALESCE(nota, ?) WHERE id = ?'
  ).bind(faltantes.length ? 'Ojo: no alcanzó el stock de ' + faltantes.join(', ') : null, id).run();

  const final = await leerPedido(env, id);
  const trabajo = Promise.all([correoAlCliente(env, final), avisoPagadoAlDueno(env, final)]);
  if (ctx && ctx.waitUntil) ctx.waitUntil(trabajo); else await trabajo;
  return true;
}

/* POST /api/pedido */
async function crearPedido(request, env) {
  let cuerpo;
  try { cuerpo = await request.json(); } catch { return json({ error: 'Datos inválidos.' }, 400); }

  const datos = cuerpo && cuerpo.datos || {};
  const nombre = String(datos.nombre || '').trim();
  const telefono = String(datos.telefono || '').trim();
  const email = String(datos.email || '').trim();
  const direccion = String(datos.direccion || '').trim();
  if (nombre.length < 2 || nombre.length > 80) return json({ error: 'Escribe tu nombre y apellido.' }, 400);
  if (!/^\d{9}$/.test(telefono)) return json({ error: 'El teléfono debe tener 9 dígitos.' }, 400);
  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json({ error: 'Escribe un correo válido: ahí te llega la confirmación.' }, 400);
  }
  if (direccion.length < 3 || direccion.length > 300) return json({ error: 'Falta la dirección o quién recoge.' }, 400);

  const entrega = cuerpo.entrega === 'tienda' ? 'tienda' : cuerpo.entrega === 'envio' ? 'envio' : null;
  if (!entrega) return json({ error: 'Elige cómo recibes tu pedido.' }, 400);
  let agencia = null;
  if (entrega === 'envio' && Array.isArray(cuerpo.agencia) && cuerpo.agencia.length === 3) {
    agencia = cuerpo.agencia.map(x => String(x).slice(0, 160));
  }

  const entrada = Array.isArray(cuerpo.items) ? cuerpo.items : [];
  if (!entrada.length || entrada.length > 30) return json({ error: 'El carrito está vacío.' }, 400);
  const lineas = [];
  for (const x of entrada) {
    const id = Number(x && x.id), qty = Number(x && x.qty);
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1 || qty > 20) {
      return json({ error: 'Hay un producto inválido en el carrito.' }, 400);
    }
    lineas.push({ id, qty, color: x.color ? String(x.color).slice(0, 40) : null });
  }

  /* Precios y stock salen de la base, nunca del navegador. */
  const ids = [...new Set(lineas.map(l => l.id))];
  const marcas = ids.map(() => '?').join(',');
  const { results } = await env.DB.prepare(
    `SELECT id, name, price, stock FROM products WHERE id IN (${marcas})`
  ).bind(...ids).all();
  const productos = new Map(results.map(r => [r.id, r]));
  const pedidoPorProducto = new Map();
  const items = [];
  for (const l of lineas) {
    const p = productos.get(l.id);
    if (!p) return json({ error: 'Un producto del carrito ya no está disponible.' }, 409);
    pedidoPorProducto.set(l.id, (pedidoPorProducto.get(l.id) || 0) + l.qty);
    items.push({ id: l.id, name: p.name, price: p.price, qty: l.qty, color: l.color });
  }
  for (const [id, qty] of pedidoPorProducto) {
    const p = productos.get(id);
    if (p.stock < qty) {
      return json({ error: p.stock > 0
        ? `De "${p.name}" solo quedan ${p.stock}.` : `"${p.name}" se agotó.` }, 409);
    }
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const t = calcularTotales(subtotal, entrega, Boolean(agencia));

  const ip = request.headers.get('cf-connecting-ip') || '';
  const ahora = Date.now();
  if (ip) {
    const abiertos = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM pedidos WHERE ip = ? AND creado_ms > ? AND estado IN ('pendiente','expirado')"
    ).bind(ip, ahora - MINUTOS_PARA_PAGAR * 60000).first();
    if (abiertos && abiertos.n >= MAX_PEDIDOS_POR_IP) {
      return json({ error: 'Demasiados pedidos seguidos. Espera unos minutos.' }, 429);
    }
  }

  const id = nuevoId();
  const expira = ahora + MINUTOS_PARA_PAGAR * 60000;
  await env.DB.prepare(
    'INSERT INTO pedidos (id, estado, creado_ms, expira_ms, total, subtotal, envio, provincia, items, ' +
    'entrega, agencia, nombre, telefono, email, direccion, ip) ' +
    "VALUES (?, 'pendiente', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, ahora, expira, t.total, t.subtotal, t.envio, t.provincia, JSON.stringify(items),
    entrega, agencia ? JSON.stringify(agencia) : null, nombre, telefono, email, direccion, ip).run();

  return json({
    id, estado: 'pendiente', total: t.total, subtotal: t.subtotal, envio: t.envio, provincia: t.provincia,
    expira_ms: expira, ahora_ms: ahora,
    yape: { numero: YAPE.numero, nombre: YAPE.nombreVisible },
  }, 201);
}

function vistaPublica(p, ahora) {
  return {
    id: p.id, estado: p.estado, total: p.total, subtotal: p.subtotal, envio: p.envio, provincia: p.provincia,
    expira_ms: p.expira_ms, ahora_ms: ahora, intentos: p.intentos,
    items: JSON.parse(p.items).map(i => ({ name: i.name, qty: i.qty, color: i.color })),
    yape: { numero: YAPE.numero, nombre: YAPE.nombreVisible },
  };
}

/* Un pedido pendiente cuyo plazo (con la gracia de la subida) ya pasó se
   cierra al consultarlo: no hace falta un cron. */
async function vencerSiToca(env, p, ahora) {
  if (p.estado === 'pendiente' && ahora > p.expira_ms + GRACIA_SUBIDA_MS) {
    await env.DB.prepare("UPDATE pedidos SET estado = 'expirado' WHERE id = ? AND estado = 'pendiente'").bind(p.id).run();
    p.estado = 'expirado';
  }
  return p;
}

/* GET /api/pedido/:id */
async function estadoPedido(env, id) {
  const p = await leerPedido(env, id);
  if (!p) return json({ error: 'No existe ese pedido.' }, 404);
  const ahora = Date.now();
  await vencerSiToca(env, p, ahora);
  return json(vistaPublica(p, ahora));
}

/* Reserva la operación y la imagen. Devuelve el motivo si ya estaban usadas
   por OTRO pedido. */
async function reservarClaves(env, pedidoId, claves) {
  const hechas = [];
  for (const clave of claves) {
    try {
      await env.DB.prepare('INSERT INTO pagos_usados (clave, pedido_id, creado_ms) VALUES (?, ?, ?)')
        .bind(clave, pedidoId, Date.now()).run();
      hechas.push(clave);
    } catch {
      const fila = await env.DB.prepare('SELECT pedido_id FROM pagos_usados WHERE clave = ?').bind(clave).first();
      if (fila && fila.pedido_id === pedidoId) { hechas.push(clave); continue; }
      for (const h of hechas) {
        await env.DB.prepare('DELETE FROM pagos_usados WHERE clave = ? AND pedido_id = ?').bind(h, pedidoId).run();
      }
      return clave;
    }
  }
  return null;
}

/* POST /api/pedido/:id/comprobante  (cuerpo: la imagen) */
async function subirComprobante(request, env, ctx, id) {
  const p = await leerPedido(env, id);
  if (!p) return json({ error: 'No existe ese pedido.' }, 404);
  const ahora = Date.now();
  await vencerSiToca(env, p, ahora);
  if (p.estado !== 'pendiente') return json(vistaPublica(p, ahora));

  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength) return json({ error: 'No llegó ninguna imagen.' }, 400);
  if (bytes.byteLength > MAX_BYTES_CAPTURA) return json({ error: 'La imagen pesa demasiado.' }, 413);
  const mime = tipoDeImagen(new Uint8Array(bytes, 0, 4));
  if (!mime) return json({ error: 'Sube la captura como imagen (JPG, PNG o WebP).' }, 415);

  const intento = p.intentos + 1;
  const clave = `comprobantes/${id}-${intento}.${mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'}`;
  if (env.COMPROBANTES) {
    await env.COMPROBANTES.put(clave, bytes, { httpMetadata: { contentType: mime } });
  }
  await env.DB.prepare('UPDATE pedidos SET intentos = ?, comprobante = ? WHERE id = ?').bind(intento, clave, id).run();
  p.intentos = intento; p.comprobante = clave;

  const aRevision = async (nota, lectura) => {
    await env.DB.prepare(
      "UPDATE pedidos SET estado = 'revision', nota = ?, lectura = ? WHERE id = ? AND estado = 'pendiente'"
    ).bind(nota, lectura ? JSON.stringify(lectura) : null, id).run();
    const fresco = await leerPedido(env, id);
    const mail = correoAlDueno(env, fresco, nota, lectura);
    if (ctx && ctx.waitUntil) ctx.waitUntil(mail); else await mail;
    return json(vistaPublica(fresco, Date.now()));
  };

  /* Misma imagen que ya se usó en otro pedido. */
  const hash = await sha256(bytes);
  const hashUsado = await env.DB.prepare('SELECT pedido_id FROM pagos_usados WHERE clave = ?').bind('img:' + hash).first();
  if (hashUsado && hashUsado.pedido_id !== id) {
    return json({ ...vistaPublica(p, ahora), rechazo: ['Esa captura ya se usó en otro pedido. Sube la de tu pago de este pedido.'] });
  }

  let lectura;
  try {
    lectura = await leerComprobante(env, bytes, mime);
    /* A veces Gemini devuelve una lectura a medias de una captura buena
       (sin destinatario o sin fecha). Se vuelve a leer hasta dos veces
       (Flash-Lite falla una de cada seis) antes de pedirle al cliente que suba otra. */
    for (let i = 0; i < 2 && lecturaIncompleta(lectura); i++) {
      try {
        const otra = await leerComprobante(env, bytes, mime);
        if (!lecturaIncompleta(otra)) lectura = otra;
      } catch { break; /* nos quedamos con lo que hay */ }
    }
  } catch (err) {
    console.log('[pagos] lectura falló', String(err));
    return aRevision('No se pudo leer la captura con la IA (' + String(err).slice(0, 120) + ').', null);
  }
  await env.DB.prepare('UPDATE pedidos SET lectura = ? WHERE id = ?').bind(JSON.stringify(lectura), id).run();

  const v = validarLectura(lectura, p, ahora);
  if (!v.ok) {
    if (intento >= MAX_INTENTOS) {
      return aRevision(`Tras ${intento} capturas no pasó la validación: ${v.fallos.join(' ')}`, lectura);
    }
    return json({ ...vistaPublica(p, Date.now()), rechazo: v.fallos });
  }

  /* Pasó las reglas de contenido: ahora, que la operación y la imagen no
     sean de otro pedido. */
  const fechaOp = String(lectura.fecha || '');
  const repetida = await reservarClaves(env, id, [`op:${v.operacion}|${fechaOp}`, 'img:' + hash]);
  if (repetida) {
    return json({ ...vistaPublica(p, Date.now()), rechazo: [repetida.startsWith('op:')
      ? 'Ese número de operación ya se usó en otro pedido.' : 'Esa captura ya se usó en otro pedido.'] });
  }
  await env.DB.prepare('UPDATE pedidos SET operacion = ? WHERE id = ?').bind(v.operacion, id).run();
  p.operacion = v.operacion;

  if (v.dudas.length) return aRevision(v.dudas.join(' '), lectura);

  await marcarPagado(env, ctx, id, null);
  return json(vistaPublica(await leerPedido(env, id), Date.now()));
}

/* ------------------------------ panel por correo ------------------------------ */
function paginaAdmin(titulo, cuerpo) {
  return new Response(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${escapeHtml(titulo)}</title>
<style>body{font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:24px auto;padding:0 16px;color:#222}
img{max-width:100%;border-radius:10px;border:1px solid #ddd}button{font-size:16px;padding:12px 20px;border:0;border-radius:8px;color:#fff;margin:6px 6px 0 0}
.si{background:#1a8f3c}.no{background:#b3261e}.dato{background:#f4f4f4;padding:10px;border-radius:8px;margin:12px 0;font-size:14px}</style></head>
<body>${cuerpo}</body></html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
}

/* Rechazo a mano. Libera la operación y la imagen: si el pago era real, el
   cliente puede resolverlo con un pedido nuevo. Idempotente. */
export async function rechazarPedido(env, ctx, p) {
  const r = await env.DB.prepare(
    "UPDATE pedidos SET estado = 'rechazado', nota = COALESCE(nota,'') || ' · Rechazado a mano' " +
    "WHERE id = ? AND estado IN ('pendiente','revision')"
  ).bind(p.id).run();
  if (!r.meta || r.meta.changes !== 1) return false;
  await env.DB.prepare('DELETE FROM pagos_usados WHERE pedido_id = ?').bind(p.id).run();
  const mail = correoRechazoAlCliente(env, p);
  if (ctx && ctx.waitUntil) ctx.waitUntil(mail); else await mail;
  return true;
}

/* Un pendiente al que ya se le pasó el plazo (con la gracia de la subida) se
   muestra como expirado aunque nadie lo haya consultado todavía. */
export function estadoVisible(p, ahora) {
  return p.estado === 'pendiente' && ahora > p.expira_ms + GRACIA_SUBIDA_MS ? 'expirado' : p.estado;
}

async function adminPedido(request, env, ctx, url) {
  const id = url.searchParams.get('id') || '';
  const t = url.searchParams.get('t') || '';
  if (!await firmaValida(env, id, t)) return paginaAdmin('Enlace inválido', '<h2>Enlace inválido</h2>');
  const p = await leerPedido(env, id);
  if (!p) return paginaAdmin('No existe', '<h2>No existe ese pedido</h2>');

  if (request.method === 'POST') {
    const form = await request.formData();
    const accion = form.get('accion');
    if (accion === 'aprobar') {
      const ok = await marcarPagado(env, ctx, id, 'Aprobado a mano');
      return paginaAdmin('Listo', ok
        ? `<h2>Aprobado ✓</h2><p>El pedido ${escapeHtml(id)} quedó pagado, bajó el stock y se avisó al cliente.</p>`
        : `<h2>Nada que hacer</h2><p>El pedido ${escapeHtml(id)} ya estaba en estado <b>${escapeHtml(p.estado)}</b>.</p>`);
    }
    if (accion === 'rechazar') {
      await rechazarPedido(env, ctx, p);
      return paginaAdmin('Listo', `<h2>Rechazado</h2><p>Se avisó al cliente para que te escriba por WhatsApp.</p>`);
    }
    return paginaAdmin('Error', '<h2>Acción desconocida</h2>');
  }

  const items = JSON.parse(p.items);
  const lectura = p.lectura ? JSON.parse(p.lectura) : null;
  const foto = p.comprobante ? `<p><img alt="Captura del comprobante" src="/pedido-admin/foto?id=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}"></p>` : '<p>Sin captura.</p>';
  const botones = p.estado === 'revision' || p.estado === 'pendiente' ? `
    <form method="post" action="/pedido-admin?id=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}">
      <button class="si" name="accion" value="aprobar">Aprobar pago</button>
      <button class="no" name="accion" value="rechazar">Rechazar</button>
    </form>` : `<p>Estado actual: <b>${escapeHtml(p.estado)}</b></p>`;
  return paginaAdmin('Pedido ' + id, `
    <h2>Pedido ${escapeHtml(id)} — ${soles(p.total)}</h2>
    <div class="dato"><b>${escapeHtml(p.nombre)}</b> · ${escapeHtml(p.telefono)} · ${escapeHtml(p.email)}<br>
    ${escapeHtml(entregaTexto(p))}<br>${escapeHtml(p.direccion)}</div>
    <ul>${lineasHtml(items)}</ul>
    ${p.nota ? `<div class="dato">${escapeHtml(p.nota)}</div>` : ''}
    ${lectura ? `<div class="dato">La IA leyó: monto ${escapeHtml(lectura.monto)} · ${escapeHtml(lectura.destinatario)} · ${escapeHtml(lectura.fecha)} ${escapeHtml(lectura.hora)} · operación ${escapeHtml(lectura.operacion)}</div>` : ''}
    ${foto}${botones}`);
}

async function adminFoto(env, url) {
  const id = url.searchParams.get('id') || '';
  if (!await firmaValida(env, id, url.searchParams.get('t') || '')) return new Response('No autorizado', { status: 401 });
  const p = await leerPedido(env, id);
  if (!p || !p.comprobante || !env.COMPROBANTES) return new Response('Sin captura', { status: 404 });
  const obj = await env.COMPROBANTES.get(p.comprobante);
  if (!obj) return new Response('Sin captura', { status: 404 });
  return new Response(obj.body, {
    headers: { 'content-type': (obj.httpMetadata && obj.httpMetadata.contentType) || 'image/jpeg', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' },
  });
}

/* ------------------------------ enrutador ------------------------------
   Devuelve una Response si la ruta es de pagos y null si no, para que
   src/index.js siga con lo suyo. */
export async function manejaPagos(request, env, ctx) {
  const url = new URL(request.url);
  const ruta = url.pathname;

  try {
    if (ruta === '/pedido-admin') return await adminPedido(request, env, ctx, url);
    if (ruta === '/pedido-admin/foto') return await adminFoto(env, url);
    if (ruta === '/api/pedido') {
      if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
      return await crearPedido(request, env);
    }
    const m = /^\/api\/pedido\/(CH-[A-Z0-9]{6})(\/comprobante)?$/.exec(ruta);
    if (m) {
      if (!m[2]) {
        if (request.method !== 'GET') return json({ error: 'Método no permitido' }, 405);
        return await estadoPedido(env, m[1]);
      }
      if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
      return await subirComprobante(request, env, ctx, m[1]);
    }
  } catch (err) {
    console.log('[pagos] error', String(err && err.stack || err));
    return json({ error: 'Algo falló de nuestro lado. Inténtalo otra vez o escríbenos por WhatsApp.' }, 500);
  }
  return null;
}
