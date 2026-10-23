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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lobster&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--rojo:#c4191f;--rojo2:#7d0d1c;--naranja:#e8452c;--oro:#ffd23f;--crema:#fff7ec;--tinta:#1b1320;--suave:#6b5f73;--linea:#ecd9c4;--wa:#25D366;--sans:Poppins,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;}
*{box-sizing:border-box;}
body{margin:0;color:var(--tinta);font:16px/1.5 var(--sans);background:var(--crema);}
a{color:inherit;}
/* Portada: el mismo degradado, puntos y tipografía que los banners de la tienda. */
.hero{position:relative;overflow:hidden;color:#fff;text-align:center;padding:22px 16px 62px;
  background:radial-gradient(circle at 18% 10%,rgba(255,190,60,.5),transparent 42%),radial-gradient(rgba(255,255,255,.08) 2px,transparent 2.5px) 0 0/22px 22px,linear-gradient(160deg,#e8452c 0%,#c4191f 50%,#7d0d1c 100%);}
.volver{position:absolute;left:16px;top:14px;font-size:13px;font-weight:600;color:#ffe9e4;text-decoration:none;z-index:3;}
.fecha{font-weight:800;font-size:13px;letter-spacing:.2em;margin:26px 0 0;}
h1.titulo{font:400 clamp(54px,17vw,76px)/1 Lobster,cursive;-webkit-text-stroke:8px #15120d;paint-order:stroke fill;transform:rotate(-3deg);margin:6px 0 0;}
h1.titulo b{display:block;font-weight:400;color:var(--oro);margin-top:-14px;font-size:.9em;}
.dos{font-weight:700;font-size:15px;margin:10px 0 0;color:#fff;}
.prem{position:relative;max-width:560px;width:100%;height:0;padding-top:50%;margin:10px auto 0;}
.prem img{position:absolute;filter:drop-shadow(0 16px 16px rgba(0,0,0,.45));}
.prem .v{height:94%;width:auto;left:6%;top:0;}
.prem .t{width:58%;height:auto;right:0;top:20%;transform:rotate(-6deg);}
.etq{position:absolute;background:var(--oro);color:#15120d;font-weight:800;font-size:12px;letter-spacing:.14em;padding:7px 12px;border-radius:7px;box-shadow:0 4px 0 rgba(0,0,0,.35);z-index:2;}
.etq.a{left:0;top:68%;transform:rotate(-6deg);}
.etq.b{right:4%;top:10%;transform:rotate(5deg);}
.vivo{font-weight:600;font-size:14px;margin:6px 0 0;color:#ffe9e4;}
.reloj{display:flex;gap:10px;justify-content:center;margin:16px 0 0;}
.reloj div{min-width:78px;padding:10px 0;border-radius:12px;background:rgba(60,0,10,.55);border:1.5px solid rgba(255,210,63,.6);}
.reloj b{display:block;font:800 30px/1.1 var(--sans);color:var(--oro);}
.reloj span{font-size:12px;color:#ffe9e4;}
.estado{font-size:13px;margin:10px 0 0;color:#ffe9e4;}
.btn{display:inline-block;border:0;border-radius:999px;padding:13px 26px;font:800 15px var(--sans);text-decoration:none;cursor:pointer;background:linear-gradient(#3a5bff,#1c2fa8);color:#fff;box-shadow:0 5px 0 #101c6b,0 10px 18px rgba(0,0,0,.3);}
#tiktok{margin:16px 0 0;}
.ola{position:absolute;left:0;right:0;bottom:-1px;height:34px;background:var(--crema);border-radius:34px 34px 0 0;}
main{max-width:720px;margin:0 auto;padding:0 16px 50px;}
h2{font:800 22px/1.2 var(--sans);margin:30px 0 14px;text-align:center;}
h2 em{font:400 32px Lobster,cursive;color:var(--rojo);font-style:normal;}
.premios{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
@media (max-width:560px){.premios{grid-template-columns:1fr;}}
.premio{position:relative;background:#fff;border:1px solid var(--linea);border-radius:18px;padding:10px 10px 16px;box-shadow:0 10px 24px rgba(125,13,28,.08);}
.premio img{width:100%;height:auto;border-radius:12px;display:block;}
.premio .n{position:absolute;left:-6px;top:-8px;z-index:2;background:var(--rojo);color:#fff;font:800 13px var(--sans);letter-spacing:.12em;padding:7px 14px;border-radius:8px;transform:rotate(-4deg);box-shadow:0 4px 0 var(--rojo2);}
.premio h3{font:800 16px/1.25 var(--sans);margin:12px 6px 4px;}
.premio p{font-size:13px;color:var(--suave);margin:0 6px;}
.pasos{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
@media (max-width:560px){.pasos{grid-template-columns:1fr;}}
.paso{background:#fff;border:1px solid var(--linea);border-radius:18px;padding:18px 14px;text-align:center;}
.paso i{display:inline-flex;width:44px;height:44px;border-radius:50%;align-items:center;justify-content:center;background:linear-gradient(160deg,var(--naranja),var(--rojo));color:#fff;font:400 26px Lobster,cursive;font-style:normal;box-shadow:0 4px 0 var(--rojo2);}
.paso b{display:block;margin-top:10px;font-weight:800;font-size:15px;line-height:1.3;}
.paso span{display:block;font-size:13px;color:var(--suave);margin-top:4px;}
.paso .grande{font:800 24px/1.15 var(--sans);color:var(--rojo);margin-top:6px;}
.reglas{margin:12px 0 0;font-size:13px;color:var(--suave);text-align:center;}
.busca{background:linear-gradient(160deg,#fff,#fff0e0);border:1.5px solid var(--linea);border-radius:20px;padding:22px 18px;text-align:center;}
.busca p.ayuda{font-size:14px;color:var(--suave);margin:0 0 12px;}
form{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}
input{flex:1;min-width:210px;max-width:340px;font:inherit;padding:13px 16px;border-radius:999px;border:1.5px solid var(--linea);background:#fff;color:var(--tinta);}
.num{display:inline-block;margin:12px 6px 0;padding:8px 14px;border-radius:10px;background:#fff;border:2px dashed var(--rojo);color:var(--rojo);font:800 18px ui-monospace,Menlo,Consolas,monospace;}
.msg{margin:12px 0 0;color:var(--suave);font-size:14px;}
.msg.err{color:#b3261e;}
.ganadores{background:#fff;border:1px solid var(--linea);border-radius:18px;padding:16px 18px;margin-top:14px;}
.ganadores h2{margin-top:0;}
.gan{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--linea);}
.gan:first-of-type{border-top:0;}
.gan b{color:var(--rojo);}
.wa{display:flex;align-items:center;justify-content:center;margin-top:26px;padding:16px;border-radius:16px;background:var(--wa);color:#06210f;font-weight:800;text-decoration:none;}
</style>
</head>
<body>
<header class="hero">
  <a class="volver" href="/">&larr; Volver a la tienda</a>
  <p class="fecha">24 DE DICIEMBRE &middot; 9:00 P.M.</p>
  <h1 class="titulo">Sorteo<b>Navideño</b></h1>
  <p class="dos">Dos premios: un teclado y un violín</p>
  <div class="prem">
    <img class="v" src="/sorteo/sorteo-violin.png" alt="Violín 4/4 completo" width="424" height="600" decoding="async"><span class="etq a">PREMIO 2</span>
    <img class="t" src="/sorteo/sorteo-teclado.png" alt="Teclado Vozzex completo" width="700" height="368" decoding="async"><span class="etq b">PREMIO 1</span>
  </div>
  <p class="vivo">En vivo por TikTok de Chipao Music</p>
  <div class="reloj" id="reloj" aria-live="off"></div>
  <p class="estado" id="estado"></p>
  <p id="tiktok"></p>
  <div class="ola"></div>
</header>
<main>
  <h2><em>Los premios</em></h2>
  <div class="premios">
${PREMIOS.map(p => `    <div class="premio">
      <span class="n">PREMIO ${p.n}</span>
      <img src="/cdn-cgi/image/width=800,format=auto,onerror=redirect${p.foto}" alt="Premio ${p.n}: ${p.titulo}" width="800" height="953" loading="lazy" decoding="async">
      <h3>${p.titulo}</h3>
      <p>Incluye: ${p.incluye.join(', ')}.</p>
    </div>`).join('\n')}
  </div>

  <h2><em>Cómo participar</em></h2>
  <div class="pasos">
    <div class="paso"><i>1</i><b>Compra en la web o por WhatsApp</b><span>Del 18 de octubre al 24 de diciembre de 2026, 9:00 pm.</span></div>
    <div class="paso"><i>2</i><b>Suma cupones</b><div class="grande">S/ 20 = 1 cupón</div><div class="grande">S/ 100 = 2 cupones</div><span>El envío no cuenta.</span></div>
    <div class="paso"><i>3</i><b>Recibe tu número</b><span>Un código como CHIPAO-01042, en tu correo de confirmación.</span></div>
  </div>
  <p class="reglas">De S/ 20 a S/ 99.99 en productos recibes 1 cupón; desde S/ 100, 2 cupones. Cada cliente puede ganar un solo premio.</p>

  <h2><em>Consulta tus números</em></h2>
  <div class="busca">
    <p class="ayuda">Escribe tu correo o el código de tu pedido.</p>
    <form id="f">
      <input id="q" type="text" placeholder="Tu correo o el código de tu pedido" autocomplete="email" required>
      <button class="btn" type="submit">Ver mis cupones</button>
    </form>
    <div id="res"></div>
  </div>

  <div class="ganadores" id="ganadores" hidden>
    <h2><em>Ganadores</em></h2>
    <div id="listaGan"></div>
  </div>

  <a class="wa" href="https://wa.me/51921317384" target="_blank" rel="noopener">¿Dudas? Escríbenos por WhatsApp</a>
</main>
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
