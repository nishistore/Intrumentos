/* ====================== SORTEO NAVIDEÑO: PÁGINA Y API =======================

   /sorteo            página pública: reglas, cuenta regresiva, "consulta tus
                      números" y, cuando se sortea, los ganadores.
   /api/sorteo        GET público. Sin parámetros da la información general y
                      los ganadores; con ?q=<correo o CH-XXXXXX> agrega los
                      cupones de esa persona.
   /api/sorteo-admin  con la clave de administrador (la de /pedidos): estado
                      del sorteo, sortear el siguiente premio y descartar a un
                      ganador que no apareció en el vivo.

   Un cliente (mismo correo O mismo celular) gana un solo premio: al sortear
   se excluyen los cupones de quien ya ganó. Los cupones los da cupones.js.

   El JavaScript de la página NO usa plantillas con comillas invertidas ni
   barras invertidas: va dentro de un template literal de este archivo y
   cualquiera de las dos se comería o rompería el código. */
import { json } from './pagos.js';
import { SORTEO, PREMIOS, codigoCupon, normalizaEmail } from './cupones.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* "Carlos Ramos Quispe" -> "Carlos R.": la página es pública. */
export function nombreCorto(nombre) {
  const t = String(nombre || '').trim().split(/\s+/);
  if (!t[0]) return '';
  return t.length > 1 ? t[0] + ' ' + t[1][0].toUpperCase() + '.' : t[0];
}

async function ganadoresVigentes(env) {
  const { results } = await env.DB.prepare(
    'SELECT id, premio, numero, nombre, email, telefono, sorteado_ms FROM ganadores WHERE descartado = 0 ORDER BY premio'
  ).all();
  return results;
}

/* Agrupa los cupones en personas: dos cupones son de la misma persona si
   comparten correo O celular, y eso se encadena (compró una vez con su correo
   y su celular, otra con otro correo y el mismo celular, otra con el primer
   correo y otro celular: es una sola persona). Unión-búsqueda sobre las
   claves 'e:correo' y 'p:celular'. */
function personas(filas) {
  const padre = new Map();
  const raiz = x => {
    if (!padre.has(x)) padre.set(x, x);
    while (padre.get(x) !== x) { padre.set(x, padre.get(padre.get(x))); x = padre.get(x); }
    return x;
  };
  const une = (a, b) => { padre.set(raiz(a), raiz(b)); };
  const claves = f => ['p:' + f.telefono].concat(f.email ? ['e:' + f.email] : []);
  for (const f of filas) { const k = claves(f); for (let i = 1; i < k.length; i++) une(k[0], k[i]); raiz(k[0]); }
  return { de: f => raiz(claves(f)[0]), raiz, claves };
}

/* Los cupones que pueden ganar: vivos, que no salieron ya, y de una persona
   que todavía no ganó un premio. También cuenta cuántas personas hay. */
async function elegibles(env) {
  const { results: vivos } = await env.DB.prepare(
    'SELECT numero, nombre, email, telefono FROM cupones WHERE anulado = 0'
  ).all();
  const { results: ganadores } = await env.DB.prepare('SELECT numero, email, telefono, descartado FROM ganadores').all();
  const grupos = personas(vivos.concat(ganadores.filter(g => !g.descartado)));
  const yaGanaron = new Set(ganadores.filter(g => !g.descartado).map(g => grupos.de(g)));
  const salieron = new Set(ganadores.map(g => g.numero));
  return {
    lista: vivos.filter(c => !salieron.has(c.numero) && !yaGanaron.has(grupos.de(c))),
    personas: new Set(vivos.map(c => grupos.de(c))).size,
    cupones: vivos.length,
  };
}

function azar(n) {
  const buf = new Uint32Array(1);
  const tope = Math.floor(0x100000000 / n) * n;     // sin sesgo
  do { crypto.getRandomValues(buf); } while (buf[0] >= tope);
  return buf[0] % n;
}

async function infoPublica(env, q) {
  const gan = await ganadoresVigentes(env);
  const salida = {
    ahora_ms: Date.now(), desde_ms: SORTEO.desde_ms, hasta_ms: SORTEO.hasta_ms,
    premios: SORTEO.premios, tiktok: SORTEO.tiktok,
    ganadores: gan.map(g => ({ premio: g.premio, codigo: codigoCupon(g.numero), nombre: nombreCorto(g.nombre) })),
  };
  const consulta = String(q || '').trim();
  if (consulta) {
    let filas = [];
    if (/^CH-[A-Z0-9]{6}$/i.test(consulta)) {
      filas = (await env.DB.prepare(
        'SELECT numero, pedido_id FROM cupones WHERE pedido_id = ? AND anulado = 0 ORDER BY numero'
      ).bind(consulta.toUpperCase()).all()).results;
    } else if (EMAIL_RE.test(consulta) && consulta.length <= 120) {
      filas = (await env.DB.prepare(
        'SELECT numero, pedido_id FROM cupones WHERE email = ? AND anulado = 0 ORDER BY numero'
      ).bind(normalizaEmail(consulta)).all()).results;
    } else {
      return { ...salida, error: 'Escribe tu correo o el código de tu pedido (CH-XXXXXX).' };
    }
    salida.buscado = true;
    salida.cupones = filas.map(f => ({ codigo: codigoCupon(f.numero), pedido: f.pedido_id }));
  }
  return salida;
}

async function estadoAdmin(env) {
  const gan = await ganadoresVigentes(env);
  const descartados = (await env.DB.prepare('SELECT id, premio, numero, nombre FROM ganadores WHERE descartado = 1 ORDER BY id').all()).results;
  const el = await elegibles(env);
  return {
    ahora_ms: Date.now(), hasta_ms: SORTEO.hasta_ms, premios: SORTEO.premios,
    cupones: el.cupones, clientes: el.personas, elegibles: el.lista.length,
    ganadores: gan.map(g => ({ id: g.id, premio: g.premio, codigo: codigoCupon(g.numero), nombre: g.nombre, telefono: g.telefono, email: g.email })),
    descartados: descartados.map(g => ({ id: g.id, premio: g.premio, codigo: codigoCupon(g.numero), nombre: g.nombre })),
  };
}

async function sortear(env) {
  const vigentes = await ganadoresVigentes(env);
  if (vigentes.length >= SORTEO.premios) return json({ error: 'Ya se sortearon los ' + SORTEO.premios + ' premios.' }, 409);
  const { lista } = await elegibles(env);
  if (!lista.length) return json({ error: 'No quedan cupones elegibles.' }, 409);
  const gana = lista[azar(lista.length)];
  /* El premio libre más bajo: si se descartó al del premio 2, el siguiente
     sorteo vuelve a ser el 2. */
  const ocupados = new Set(vigentes.map(g => g.premio));
  let premio = 1;
  while (ocupados.has(premio)) premio++;
  await env.DB.prepare(
    'INSERT INTO ganadores (premio, numero, nombre, email, telefono, sorteado_ms) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(premio, gana.numero, gana.nombre, gana.email, gana.telefono, Date.now()).run();
  return json({ ok: true, ganador: { premio, codigo: codigoCupon(gana.numero), nombre: gana.nombre, telefono: gana.telefono, email: gana.email } });
}

async function descartar(env, id) {
  const r = await env.DB.prepare('UPDATE ganadores SET descartado = 1 WHERE id = ? AND descartado = 0').bind(id).run();
  return json({ ok: Boolean(r.meta && r.meta.changes === 1) });
}

export async function manejaSorteo(request, env, ctx, claveValida) {
  const url = new URL(request.url);
  const ruta = url.pathname;

  if (ruta === '/sorteo') {
    return new Response(PAGINA, {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' },
    });
  }

  try {
    if (ruta === '/api/sorteo') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido' }, 405);
      return json(await infoPublica(env, url.searchParams.get('q')));
    }
    if (!ruta.startsWith('/api/sorteo-admin')) return null;

    if (!await claveValida(request.headers.get('X-Admin-Secret'))) return json({ error: 'No autorizado' }, 401);
    if (ruta === '/api/sorteo-admin') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido' }, 405);
      return json(await estadoAdmin(env));
    }
    if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
    if (ruta === '/api/sorteo-admin/sortear') return await sortear(env);
    if (ruta === '/api/sorteo-admin/descartar') {
      let cuerpo;
      try { cuerpo = await request.json(); } catch { return json({ error: 'Falta el ganador' }, 400); }
      return await descartar(env, Number(cuerpo.id));
    }
  } catch (err) {
    console.log('[sorteo] error', String(err && err.stack || err));
    return json({ error: 'Algo falló de nuestro lado. Inténtalo otra vez.' }, 500);
  }
  return json({ error: 'No existe' }, 404);
}

/* ------------------------------ la página ------------------------------ */
const PAGINA = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sorteo navideño | Chipao Music</title>
<meta name="description" content="Compra en Chipao Music hasta el 24 de diciembre de 2026 y participa en el sorteo navideño: un teclado Vozzex completo y un violín 4/4 completo, en vivo por TikTok.">
<link rel="canonical" href="https://chipaomusic.com/sorteo">
<style>
:root{
  --fondo:#F6EFE4;--tarjeta:#fff;--tinta:#1B1320;--suave:#6B5F73;--linea:#E6DCCB;
  --verde:#0F5C33;--verde-f:#E4F2E9;--rojo-nav:#B0142B;--on:#fff;--rojo:#B3261E;--nieve:#fff;
}
@media (prefers-color-scheme:dark){
  :root{--fondo:#10241A;--tarjeta:#17382A;--tinta:#F3EEE4;--suave:#B9C7BD;--linea:#2A4A39;--verde:#7FD49C;--verde-f:#1F4A33;--rojo-nav:#D8324A;--on:#fff;--rojo:#FF8F86;--nieve:rgba(255,255,255,.16);}
}
*{box-sizing:border-box;}
body{margin:0;color:var(--tinta);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
  background-color:var(--fondo);
  background-image:radial-gradient(circle at 20px 30px,var(--nieve) 3px,transparent 4px),radial-gradient(circle at 120px 90px,var(--nieve) 2px,transparent 3px),radial-gradient(circle at 200px 160px,var(--nieve) 4px,transparent 5px),radial-gradient(circle at 70px 200px,var(--nieve) 2.5px,transparent 3.5px);
  background-size:240px 240px;}
/* Franja roja y verde arriba, como un lazo de regalo. */
body::before{content:"";display:block;height:9px;background:linear-gradient(var(--rojo-nav) 0,var(--rojo-nav) 6px,var(--verde) 6px,var(--verde) 9px);}
.caja{max-width:640px;margin:0 auto;padding:18px 16px 48px;}
.volver{display:inline-block;color:var(--suave);text-decoration:none;font-size:14px;margin-bottom:14px;}
.portada{background:var(--tarjeta);border:1px solid var(--linea);border-radius:16px;padding:22px 18px;text-align:center;}
.etiqueta{font-size:12px;letter-spacing:2px;font-weight:700;color:var(--verde);}
h1{font-size:26px;line-height:1.15;margin:6px 0 8px;}
.fecha{font-weight:700;margin:0;}
.sub{color:var(--suave);font-size:14px;margin:4px 0 0;}
.reloj{display:flex;gap:8px;justify-content:center;margin:16px 0 4px;}
.reloj div{background:var(--verde-f);border-radius:12px;padding:10px 0;min-width:70px;}
.reloj b{display:block;font-size:26px;line-height:1.1;color:var(--verde);}
.reloj span{font-size:12px;color:var(--suave);}
.btn{display:inline-block;border:0;border-radius:10px;background:var(--rojo-nav);color:var(--on);font:inherit;font-weight:700;padding:12px 18px;cursor:pointer;text-decoration:none;}
.seccion{background:var(--tarjeta);border:1px solid var(--linea);border-radius:16px;padding:18px;margin-top:14px;}
h2{font-size:18px;margin:0 0 10px;}
.premios{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
@media (max-width:560px){.premios{grid-template-columns:1fr;}}
.premio img{width:100%;height:auto;border-radius:10px;background:#fff;border:1px solid var(--linea);}
.premio h3{font-size:15px;margin:8px 0 2px;}
.premio p{margin:0;font-size:13px;color:var(--suave);}
.seccion ul{margin:0;padding-left:20px;}
.seccion li{margin:5px 0;}
form{display:flex;gap:8px;flex-wrap:wrap;}
input{flex:1;min-width:200px;font:inherit;padding:12px;border-radius:10px;border:1px solid var(--linea);background:var(--fondo);color:var(--tinta);}
.num{display:inline-block;border:1.5px solid var(--rojo-nav);color:var(--rojo-nav);border-radius:8px;padding:6px 12px;margin:4px 6px 4px 0;font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700;font-size:18px;}
.msg{margin:12px 0 0;color:var(--suave);font-size:14px;}
.msg.err{color:var(--rojo);}
.gan{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--linea);}
.gan:first-of-type{border-top:0;}
.gan b{color:var(--verde);}
</style>
</head>
<body>
<div class="caja">
<a class="volver" href="/">&larr; Volver a la tienda</a>
<div class="portada">
  <div class="etiqueta">SORTEO NAVIDEÑO</div>
  <h1>Dos premios: un teclado y un violín</h1>
  <p class="fecha">24 de diciembre de 2026, 9:00 pm</p>
  <p class="sub">En vivo por TikTok de Chipao Music</p>
  <div class="reloj" id="reloj" aria-live="off"></div>
  <p class="sub" id="estado"></p>
  <p style="margin:14px 0 0" id="tiktok"></p>
</div>

<div class="seccion">
  <h2>Los premios</h2>
  <div class="premios">
${PREMIOS.map(p => `    <div class="premio">
      <img src="/cdn-cgi/image/width=800,format=auto,onerror=redirect${p.foto}" alt="Premio ${p.n}: ${p.titulo}" width="800" height="953" loading="lazy" decoding="async">
      <h3>Premio ${p.n}: ${p.titulo}</h3>
      <p>Incluye: ${p.incluye.join(', ')}.</p>
    </div>`).join('\n')}
  </div>
</div>

<div class="seccion">
  <h2>Cómo participar</h2>
  <ul>
    <li>Compra en la web o por WhatsApp desde el 18 de octubre hasta el 24 de diciembre de 2026, 9:00 pm.</li>
    <li>De S/ 20 a S/ 99.99 en productos recibes <b>1 cupón</b>. Desde S/ 100, <b>2 cupones</b>. El envío no cuenta.</li>
    <li>Tu cupón es un número (por ejemplo CHIPAO-01042) y te llega en el correo de confirmación.</li>
    <li>Cada cliente puede ganar un solo premio.</li>
  </ul>
</div>

<div class="seccion">
  <h2>Consulta tus números</h2>
  <form id="f">
    <input id="q" type="text" placeholder="Tu correo o el código de tu pedido" autocomplete="email" required>
    <button class="btn" type="submit">Ver mis cupones</button>
  </form>
  <div id="res"></div>
</div>

<div class="seccion" id="ganadores" hidden>
  <h2>Ganadores</h2>
  <div id="listaGan"></div>
</div>
</div>
<script>
var INFO = null, T0 = Date.now();
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function dos(n) { return n < 10 ? '0' + n : String(n); }

function reloj() {
  if (!INFO) return;
  var falta = INFO.hasta_ms - (INFO.ahora_ms + (Date.now() - T0));
  var caja = document.getElementById('reloj'), est = document.getElementById('estado');
  if (falta <= 0) {
    caja.innerHTML = '';
    est.textContent = INFO.ganadores.length ? 'El sorteo ya se realizó.' : 'Las compras para el sorteo ya cerraron.';
    return;
  }
  var min = Math.floor(falta / 60000), d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  caja.innerHTML = '<div><b>' + d + '</b><span>días</span></div><div><b>' + dos(h) + '</b><span>horas</span></div><div><b>' + dos(m) + '</b><span>minutos</span></div>';
  est.textContent = INFO.ahora_ms < Date.UTC(2026, 9, 18, 5, 0) ? 'Las compras cuentan desde el 18 de octubre.' : 'Cada compra suma. Todavía estás a tiempo.';
}

function pintarGanadores() {
  var caja = document.getElementById('ganadores');
  if (!INFO.ganadores.length) { caja.hidden = true; return; }
  caja.hidden = false;
  var h = '';
  INFO.ganadores.forEach(function (g) {
    h += '<div class="gan"><span>Premio ' + esc(g.premio) + '</span><span><b>' + esc(g.codigo) + '</b> · ' + esc(g.nombre) + '</span></div>';
  });
  document.getElementById('listaGan').innerHTML = h;
}

function cargar() {
  fetch('/api/sorteo').then(function (r) { return r.json(); }).then(function (d) {
    INFO = d; T0 = Date.now();
    if (d.tiktok) {
      document.getElementById('tiktok').innerHTML = '<a class="btn" target="_blank" rel="noopener" href="' + esc(d.tiktok) + '">Ir al TikTok de Chipao Music</a>';
    }
    reloj(); pintarGanadores();
    setInterval(reloj, 30000);
  }).catch(function () {});
}

document.getElementById('f').onsubmit = function (e) {
  e.preventDefault();
  var q = document.getElementById('q').value.trim();
  var res = document.getElementById('res');
  res.innerHTML = '<p class="msg">Buscando…</p>';
  fetch('/api/sorteo?q=' + encodeURIComponent(q)).then(function (r) { return r.json(); }).then(function (d) {
    if (d.error) { res.innerHTML = '<p class="msg err">' + esc(d.error) + '</p>'; return; }
    if (!d.cupones || !d.cupones.length) {
      res.innerHTML = '<p class="msg">No encontramos cupones con ese dato. Si compraste hace poco, revisa el correo con el que pediste o escríbenos por WhatsApp.</p>';
      return;
    }
    var h = '<p class="msg" style="margin-bottom:6px">Tus números:</p>';
    d.cupones.forEach(function (c) { h += '<span class="num">' + esc(c.codigo) + '</span>'; });
    h += '<p class="msg">Mucha suerte el 24 de diciembre.</p>';
    res.innerHTML = h;
  }).catch(function () { res.innerHTML = '<p class="msg err">Sin conexión. Inténtalo otra vez.</p>'; });
};
cargar();
</script>
</body>
</html>`;
