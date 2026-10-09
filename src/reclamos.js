/* ====================== LIBRO DE RECLAMACIONES ===========================

   POST /api/reclamo guarda la hoja en la tabla `reclamos` (migrations/
   reclamos.sql) y manda dos correos por Resend: la copia al consumidor y el
   aviso al dueño con todos los datos. El número de la hoja es el id de la
   fila, con el año: R-2026-000001. Si el correo falla el reclamo igual queda
   guardado, y eso es lo que importa legalmente. */
import { json, escapeHtml, enviarCorreo, marco, CORREO_DUENO } from './pagos.js';

const PROVEEDOR = {
  nombre: 'Chipao Music',
  ruc: '10772011348',
  direccion: 'Av. Los Héroes 382, San Juan de Miraflores, Lima 15801, Perú',
};
const MAX_POR_IP = 5;                 // reclamos por IP en una hora
const VENTANA_MS = 60 * 60 * 1000;
const TIPOS_DOC = ['DNI', 'CE', 'Pasaporte', 'RUC'];

function limpio(v, max) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
}

/* Devuelve { datos } o { error }. Es lo mismo que valida el formulario, pero
   aquí no se confía en él. */
export function validarReclamo(b) {
  const d = {
    nombre: limpio(b.nombre, 120),
    tipo_doc: limpio(b.tipo_doc, 12),
    doc: limpio(b.doc, 12),
    domicilio: limpio(b.domicilio, 160),
    telefono: limpio(b.telefono, 9),
    email: limpio(b.email, 120),
    bien: limpio(b.bien, 10),
    monto: limpio(b.monto, 9),
    bien_desc: limpio(b.bien_desc, 300),
    tipo: limpio(b.tipo, 10),
    detalle: limpio(b.detalle, 1500),
    pedido: limpio(b.pedido, 800),
  };
  if (!d.nombre || !d.doc || !d.domicilio || !d.bien_desc || !d.detalle || !d.pedido) {
    return { error: 'Completa todos los campos obligatorios.' };
  }
  if (!TIPOS_DOC.includes(d.tipo_doc)) return { error: 'Tipo de documento no válido.' };
  if (!/^[0-9A-Za-z]{6,12}$/.test(d.doc)) return { error: 'Revisa el número de documento.' };
  if (!/^[0-9]{9}$/.test(d.telefono)) return { error: 'El teléfono son nueve dígitos.' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) return { error: 'Revisa el correo.' };
  if (!['Producto', 'Servicio'].includes(d.bien)) return { error: 'Elige producto o servicio.' };
  if (!['Reclamo', 'Queja'].includes(d.tipo)) return { error: 'Elige reclamo o queja.' };
  if (d.monto && !/^[0-9]+([.,][0-9]{1,2})?$/.test(d.monto)) return { error: 'El monto debe ser un número.' };
  return { datos: d };
}

export function numeroDeHoja(id, ms) {
  return 'R-' + new Date(ms).getUTCFullYear() + '-' + String(id).padStart(6, '0');
}

function fechaLima(ms) {
  return new Date(ms).toLocaleString('es-PE', {
    timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function filas(r, numero) {
  const f = (k, v) => `<tr><td style="padding:4px 10px 4px 0;color:#666;vertical-align:top">${k}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`;
  return `<table style="font-size:14px;border-collapse:collapse">
${f('Hoja N.º', numero)}${f('Fecha', fechaLima(r.creado_ms))}
${f('Proveedor', PROVEEDOR.nombre + ' · RUC ' + PROVEEDOR.ruc)}${f('Establecimiento', PROVEEDOR.direccion)}
${f('Consumidor', r.nombre)}${f(r.tipo_doc, r.doc)}${f('Domicilio', r.domicilio)}
${f('Teléfono', r.telefono)}${f('Correo', r.email)}
${f('Bien contratado', r.bien + (r.monto ? ' · monto reclamado S/ ' + r.monto : ''))}${f('Descripción', r.bien_desc)}
${f('Tipo', r.tipo)}${f('Detalle', r.detalle)}${f('Pedido del consumidor', r.pedido)}</table>`;
}

async function crearReclamo(request, env, ctx) {
  let cuerpo;
  try { cuerpo = await request.json(); } catch { return json({ error: 'Datos no válidos.' }, 400); }
  /* Campo señuelo: lo llenan los robots, las personas no lo ven. Se responde
     como si hubiera salido bien para no darles pista. */
  if (cuerpo && cuerpo.web) return json({ ok: true, numero: 'R-0000-000000' });

  const v = validarReclamo(cuerpo || {});
  if (v.error) return json({ error: v.error }, 400);
  const d = v.datos;

  const ip = request.headers.get('cf-connecting-ip') || '';
  const ahora = Date.now();
  if (ip) {
    const recientes = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM reclamos WHERE ip = ? AND creado_ms > ?'
    ).bind(ip, ahora - VENTANA_MS).first();
    if (recientes && recientes.n >= MAX_POR_IP) {
      return json({ error: 'Registraste varios reclamos hace poco. Escríbenos por WhatsApp y lo atendemos.' }, 429);
    }
  }

  const ins = await env.DB.prepare(
    'INSERT INTO reclamos (creado_ms, nombre, tipo_doc, doc, domicilio, telefono, email, bien, monto, bien_desc, tipo, detalle, pedido, ip) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(ahora, d.nombre, d.tipo_doc, d.doc, d.domicilio, d.telefono, d.email, d.bien,
    d.monto || null, d.bien_desc, d.tipo, d.detalle, d.pedido, ip || null).run();
  const numero = numeroDeHoja(ins.meta.last_row_id, ahora);
  const fila = { ...d, creado_ms: ahora };

  const correos = Promise.all([
    enviarCorreo(env, {
      para: d.email,
      asunto: `Tu hoja de reclamación ${numero} · Chipao Music`,
      html: marco('Recibimos tu ' + d.tipo.toLowerCase(),
        `<p>Hola ${escapeHtml(d.nombre)}, esta es la copia de tu hoja de reclamación. Te responderemos en un máximo de 15 días hábiles.</p>${filas(fila, numero)}
<p style="color:#666;font-size:12px">La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.</p>`),
    }),
    enviarCorreo(env, {
      para: CORREO_DUENO,
      asunto: `${d.tipo} ${numero} de ${d.nombre}`,
      html: marco('Nuevo ' + d.tipo.toLowerCase() + ' en el libro de reclamaciones',
        `${filas(fila, numero)}<p>Responde al cliente (${escapeHtml(d.email)} o ${escapeHtml(d.telefono)}) antes de 15 días hábiles.</p>`),
    }),
  ]);
  if (ctx && ctx.waitUntil) ctx.waitUntil(correos); else await correos;

  return json({ ok: true, numero });
}

export async function manejaReclamos(request, env, ctx) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/reclamo') return null;
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  try {
    return await crearReclamo(request, env, ctx);
  } catch (err) {
    console.log('[reclamos] error', String(err && err.stack || err));
    return json({ error: 'Algo falló de nuestro lado. Escríbenos por WhatsApp y lo registramos.' }, 500);
  }
}
