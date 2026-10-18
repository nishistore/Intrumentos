/* ====================== CUPONES DEL SORTEO NAVIDEÑO =======================

   Cada compra de la web (al validarse el pago) y cada venta por WhatsApp (al
   registrarla en /pedidos) recibe uno o dos cupones numerados, según lo que
   suman los PRODUCTOS (el envío no cuenta):
     de S/ 20 a S/ 99.99  -> 1 cupón
     desde S/ 100         -> 2 cupones
     menos de S/ 20       -> ninguno
   Solo cuentan las compras hechas dentro de la ventana del sorteo.

   Este archivo no importa nada de pagos.js a propósito: pagos.js lo importa a
   él (para dar los cupones al aprobar un pago), y un ciclo entre los dos sería
   frágil. Tablas en migrations/sorteo.sql. */

export const SORTEO = {
  /* 18-oct-2026 00:00 hora de Lima (UTC-5) hasta el momento del sorteo, 24-dic
     21:00 de Lima: una compra después de que empieza el vivo ya no entra. */
  desde_ms: Date.UTC(2026, 9, 18, 5, 0),
  hasta_ms: Date.UTC(2026, 11, 25, 2, 0),
  premios: 2,
  minimo: 20,
  doble_desde: 100,
  fecha_texto: '24 de diciembre de 2026, 9:00 pm',
  /* El link de la cuenta de TikTok de Chipao Music. Vacío = no se muestra el
     botón ni el enlace. */
  tiktok: 'https://www.tiktok.com/@instrumentosmusicale',
};

/* Los premios que se anuncian en /sorteo y en el correo. Las fotos viven en el
   repo (sorteo/), no en R2. 'resumen' va en el correo; 'incluye' en la página. */
export const PREMIOS = [
  {
    n: 1, titulo: 'Teclado Vozzex completo', foto: '/sorteo/premio-1.jpg',
    resumen: 'un teclado Vozzex con atril, micrófono, adaptador, método y estuche',
    incluye: ['Teclado Vozzex', 'Atril en X', 'Método básico de música para órgano electrónico "Papayita"',
      'Adaptador de corriente', 'Micrófono', 'Soporte para partituras', 'Estuche'],
  },
  {
    n: 2, titulo: 'Violín 4/4 completo', foto: '/sorteo/premio-2.jpg',
    resumen: 'un violín 4/4 con arco, estuche, cuerdas, resina, hombrera, afinador y guía de dedos',
    incluye: ['Violín 4/4', 'Arco', 'Estuche rígido', 'Juego de cuerdas', 'Resina', 'Hombrera',
      'Afinador de clip', 'Guía de posición de dedos'],
  },
];

const SITE = 'https://chipaomusic.com';
const MAX_REINTENTOS = 6;

export function cuponesPorSubtotal(subtotal) {
  const s = Number(subtotal);
  if (!Number.isFinite(s) || s < SORTEO.minimo) return 0;
  return s >= SORTEO.doble_desde ? 2 : 1;
}

export function dentroDelSorteo(ms) {
  return ms >= SORTEO.desde_ms && ms < SORTEO.hasta_ms;
}

export function codigoCupon(numero) {
  return 'CHIPAO-' + String(numero).padStart(5, '0');
}

/* Acepta "CHIPAO-01042", "chipao 1042" o "1042". Devuelve el número o null. */
export function numeroDeCodigo(texto) {
  const m = /^(?:chipao[-\s]*)?(\d{1,7})$/i.exec(String(texto || '').trim());
  return m ? Number(m[1]) : null;
}

export function normalizaEmail(e) {
  return String(e || '').trim().toLowerCase();
}

export async function cuponesDelPedido(env, pedidoId) {
  const { results } = await env.DB.prepare(
    'SELECT numero, orden, anulado FROM cupones WHERE pedido_id = ? ORDER BY orden'
  ).bind(pedidoId).all();
  return results;
}

/* Da los cupones que le tocan al pedido. Idempotente: si ya los tiene, no da
   más (UNIQUE pedido_id+orden), así que aprobar dos veces o reintentar no
   duplica. El número es el siguiente al más alto, empezando en 1001; la fila
   anulada conserva su número, así que nunca se reutiliza. */
export async function asignarCupones(env, pedido, ahora = Date.now()) {
  const cuantos = cuponesPorSubtotal(pedido.subtotal);
  if (!cuantos || !dentroDelSorteo(ahora)) return cuponesDelPedido(env, pedido.id);

  for (let orden = 1; orden <= cuantos; orden++) {
    for (let intento = 0; intento < MAX_REINTENTOS; intento++) {
      try {
        await env.DB.prepare(
          'INSERT INTO cupones (numero, pedido_id, orden, nombre, email, telefono, creado_ms) ' +
          'SELECT COALESCE(MAX(numero), 1000) + 1, ?, ?, ?, ?, ?, ? FROM cupones'
        ).bind(pedido.id, orden, pedido.nombre, normalizaEmail(pedido.email), pedido.telefono, ahora).run();
        break;
      } catch (err) {
        const ya = await env.DB.prepare(
          'SELECT 1 AS x FROM cupones WHERE pedido_id = ? AND orden = ?'
        ).bind(pedido.id, orden).first();
        if (ya) break;                                   // ya lo tenía: nada que hacer
        if (intento === MAX_REINTENTOS - 1) throw err;   // otra venta ganó el número, y otra, y otra
      }
    }
  }
  return cuponesDelPedido(env, pedido.id);
}

export async function anularCuponesDelPedido(env, pedidoId) {
  await env.DB.prepare('UPDATE cupones SET anulado = 1 WHERE pedido_id = ?').bind(pedidoId).run();
}

/* El recuadro del correo. Vacío si el pedido no tiene cupones. */
export function ticketHtml(cupones) {
  const vivos = (cupones || []).filter(c => !c.anulado);
  if (!vivos.length) return '';
  /* Sobrio a propósito: un recuadro de colores, mayúsculas y un botón grande
     hacen que el correo parezca publicidad y los filtros lo mandan a spam. */
  const numeros = vivos.map(c => `<b>${codigoCupon(c.numero)}</b>`).join(' &nbsp; ');
  const tiktok = SORTEO.tiktok ? ` por TikTok (${SORTEO.tiktok})` : ' por TikTok';
  return `<div style="border:1px solid #ddd;border-radius:8px;padding:12px 14px;margin:16px 0">
  <p style="margin:0 0 6px;font-size:14px">Sorteo navideño de Chipao Music. ${vivos.length === 1 ? 'Tu número' : 'Tus números'}:</p>
  <p style="margin:0 0 8px;font-size:18px;font-family:monospace">${numeros}</p>
  <p style="margin:0 0 6px;font-size:13px;color:#555">${PREMIOS.map(p => `Premio ${p.n}: ${p.resumen}.`).join(' ')} Un premio por cliente.</p>
  <p style="margin:0;font-size:13px;color:#555">Sorteo en vivo el ${SORTEO.fecha_texto}${tiktok}. Puedes consultar tus números y ver los premios en ${SITE}/sorteo</p>
</div>`;
}
