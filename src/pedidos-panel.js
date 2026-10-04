/* ====================== PANEL DE PEDIDOS ================================

   /pedidos es una página privada para ver todos los pedidos de Yape, con su
   estado, y aprobar o rechazar los que esperan al dueño. Se entra con la misma
   clave de administrador del panel de productos: la página la guarda solo en
   sessionStorage (se borra al cerrar la pestaña) y la manda en cada llamada a
   /api/pedidos-admin, que la valida con claveValida().

   La página es HTML suelto, fuera del SPA, para no tocar el index.html. El
   JavaScript de la página NO usa plantillas con comillas invertidas ni
   barras invertidas: va dentro de un template literal de este archivo y
   cualquiera de las dos se comería o rompería el código. */
import { leerPedido, marcarPagado, rechazarPedido, estadoVisible, entregaTexto } from './pagos.js';

function json(datos, status = 200) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function vista(p, ahora) {
  let lectura = null;
  try { lectura = p.lectura ? JSON.parse(p.lectura) : null; } catch { /* queda en null */ }
  return {
    id: p.id,
    estado: estadoVisible(p, ahora),
    creado_ms: p.creado_ms,
    pagado_ms: p.pagado_ms,
    total: p.total,
    envio: p.envio,
    provincia: p.provincia,
    items: JSON.parse(p.items),
    entrega: entregaTexto(p),
    direccion: p.direccion,
    nombre: p.nombre,
    telefono: p.telefono,
    email: p.email,
    nota: p.nota,
    operacion: p.operacion,
    intentos: p.intentos,
    foto: Boolean(p.comprobante),
    lectura: lectura && {
      monto: lectura.monto, destinatario: lectura.destinatario,
      fecha: lectura.fecha, hora: lectura.hora, operacion: lectura.operacion,
      sospecha: lectura.sospecha,
    },
  };
}

export async function manejaPanelPedidos(request, env, ctx, claveValida) {
  const url = new URL(request.url);
  const ruta = url.pathname;

  if (ruta === '/pedidos') {
    return new Response(PAGINA, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, nofollow',
      },
    });
  }
  if (!ruta.startsWith('/api/pedidos-admin')) return null;

  if (!await claveValida(request.headers.get('X-Admin-Secret'))) {
    return json({ error: 'No autorizado' }, 401);
  }

  try {
    if (ruta === '/api/pedidos-admin') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido' }, 405);
      const ahora = Date.now();
      const { results } = await env.DB.prepare(
        'SELECT id, estado, creado_ms, expira_ms, pagado_ms, total, envio, provincia, items, entrega, agencia, ' +
        'nombre, telefono, email, direccion, nota, operacion, intentos, comprobante, lectura ' +
        'FROM pedidos ORDER BY creado_ms DESC LIMIT 500'
      ).all();
      return json({ ahora_ms: ahora, pedidos: results.map(p => vista(p, ahora)) });
    }

    if (ruta === '/api/pedidos-admin/foto') {
      const p = await leerPedido(env, url.searchParams.get('id') || '');
      if (!p || !p.comprobante || !env.COMPROBANTES) return json({ error: 'Sin captura' }, 404);
      const obj = await env.COMPROBANTES.get(p.comprobante);
      if (!obj) return json({ error: 'Sin captura' }, 404);
      return new Response(obj.body, {
        headers: {
          'content-type': (obj.httpMetadata && obj.httpMetadata.contentType) || 'image/jpeg',
          'cache-control': 'private, no-store',
        },
      });
    }

    const m = /^\/api\/pedidos-admin\/(CH-[A-Z0-9]{6})$/.exec(ruta);
    if (m) {
      if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
      const p = await leerPedido(env, m[1]);
      if (!p) return json({ error: 'No existe ese pedido' }, 404);
      let accion;
      try { accion = (await request.json()).accion; } catch { return json({ error: 'Falta la acción' }, 400); }
      let hecho = false;
      if (accion === 'aprobar') hecho = await marcarPagado(env, ctx, p.id, 'Aprobado a mano');
      else if (accion === 'rechazar') hecho = await rechazarPedido(env, ctx, p);
      else return json({ error: 'Acción desconocida' }, 400);
      const fresco = await leerPedido(env, p.id);
      return json({ ok: hecho, pedido: vista(fresco, Date.now()) });
    }
  } catch (err) {
    console.log('[pedidos] error', String(err && err.stack || err));
    return json({ error: 'Algo falló: ' + String(err).slice(0, 120) }, 500);
  }
  return json({ error: 'No existe' }, 404);
}

/* ------------------------------ la página ------------------------------ */
const PAGINA = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Pedidos | Chipao Music</title>
<style>
:root{
  --fondo:#F6F5F2;--tarjeta:#fff;--tinta:#17140F;--suave:#6B655C;--linea:#E3E0D8;
  --verde:#1B7F3B;--verde-f:#E3F4E8;--naranja:#B45309;--naranja-f:#FEF0DC;
  --gris:#5B5B5B;--gris-f:#ECECEC;--rojo:#B3261E;--rojo-f:#FBE4E2;--azul:#1D4ED8;--azul-f:#E6EDFD;
}
@media (prefers-color-scheme:dark){
  :root{
    --fondo:#14120F;--tarjeta:#1E1B17;--tinta:#F3F0EA;--suave:#A39D92;--linea:#34302A;
    --verde:#6FD08A;--verde-f:#16301F;--naranja:#F5A55B;--naranja-f:#3A2812;
    --gris:#B8B4AC;--gris-f:#2C2924;--rojo:#FF8F86;--rojo-f:#3A1B18;--azul:#8FB0FF;--azul-f:#1B2744;
  }
}
*{box-sizing:border-box;}
body{margin:0;background:var(--fondo);color:var(--tinta);font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;}
.caja{max-width:860px;margin:0 auto;padding:16px;}
h1{font-size:20px;margin:0;}
.cabeza{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;}
.cabeza small{color:var(--suave);display:block;font-size:12px;}
button{font:inherit;cursor:pointer;}
.btn{border:1px solid var(--linea);background:var(--tarjeta);color:var(--tinta);border-radius:10px;padding:9px 14px;font-weight:600;font-size:14px;}
.btn.si{background:var(--verde);border-color:var(--verde);color:#fff;}
.btn.no{background:var(--tarjeta);border-color:var(--rojo);color:var(--rojo);}
.btn[disabled]{opacity:.5;}
.login{max-width:340px;margin:80px auto;background:var(--tarjeta);border:1px solid var(--linea);border-radius:14px;padding:22px;}
.login input{width:100%;font:inherit;padding:12px;border-radius:10px;border:1px solid var(--linea);background:var(--fondo);color:var(--tinta);margin:12px 0;}
.error{color:var(--rojo);font-size:13px;min-height:18px;}
.resumen{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px;}
@media (min-width:640px){.resumen{grid-template-columns:repeat(4,1fr);}}
.dato{background:var(--tarjeta);border:1px solid var(--linea);border-radius:12px;padding:12px;}
.dato b{display:block;font-size:22px;line-height:1.1;}
.dato span{font-size:12px;color:var(--suave);}
.dato.alerta{border-color:var(--naranja);}
.filtros{display:flex;gap:8px;overflow-x:auto;margin-bottom:12px;padding-bottom:4px;}
.filtro{flex:none;border:1px solid var(--linea);background:var(--tarjeta);color:var(--tinta);border-radius:999px;padding:7px 13px;font-size:13px;font-weight:600;}
.filtro.on{background:var(--tinta);color:var(--fondo);border-color:var(--tinta);}
.fila{background:var(--tarjeta);border:1px solid var(--linea);border-radius:12px;margin-bottom:8px;overflow:hidden;}
.resu{display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;width:100%;border:0;background:none;color:inherit;text-align:left;}
.resu .quien{flex:1;min-width:0;}
.resu .quien b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.resu .quien small{color:var(--suave);font-size:12px;}
.monto{font-weight:700;white-space:nowrap;}
.estado{font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:999px;white-space:nowrap;}
.e-pagado{background:var(--verde-f);color:var(--verde);}
.e-revision{background:var(--naranja-f);color:var(--naranja);}
.e-pendiente{background:var(--azul-f);color:var(--azul);}
.e-expirado{background:var(--gris-f);color:var(--gris);}
.e-rechazado{background:var(--rojo-f);color:var(--rojo);}
.detalle{padding:0 14px 14px;border-top:1px solid var(--linea);font-size:14px;}
.detalle p{margin:10px 0 0;}
.detalle ul{margin:8px 0 0;padding-left:18px;}
.detalle .gris{color:var(--suave);font-size:13px;}
.detalle .nota{background:var(--naranja-f);color:var(--naranja);border-radius:8px;padding:8px 10px;font-size:13px;}
.acciones{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}
.acciones a{text-decoration:none;display:inline-block;}
.captura{max-width:100%;margin-top:10px;border-radius:10px;border:1px solid var(--linea);}
.vacio{text-align:center;color:var(--suave);padding:40px 0;}
</style>
</head>
<body>
<div class="caja" id="raiz"></div>
<script>
var CLAVE = null;
try { CLAVE = sessionStorage.getItem('chipao-pedidos-clave'); } catch (e) {}
var DATOS = null, FILTRO = 'todos', ABIERTO = null, TIMER = null;
var raiz = document.getElementById('raiz');

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function soles(n) { return 'S/ ' + (Math.round(n * 100) % 100 === 0 ? Math.round(n) : Number(n).toFixed(2)); }
function lima(ms) {
  return new Date(ms).toLocaleString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function hoyLima(ms) {
  return new Date(ms).toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
}
var NOMBRE_ESTADO = { pagado: 'Pagado', revision: 'Por revisar', pendiente: 'Esperando pago', expirado: 'Expirado', rechazado: 'Rechazado' };

function pintarLogin(msg) {
  raiz.innerHTML = '<form class="login" id="fLogin"><h1>Pedidos</h1><p class="gris" style="color:var(--suave);margin:6px 0 0">Entra con tu clave de administrador.</p>'
    + '<input type="password" id="clave" placeholder="Clave" autocomplete="current-password" required>'
    + '<div class="error" id="err">' + esc(msg || '') + '</div>'
    + '<button class="btn si" style="width:100%">Entrar</button></form>';
  document.getElementById('fLogin').onsubmit = function (e) {
    e.preventDefault();
    CLAVE = document.getElementById('clave').value;
    cargar(true);
  };
}

function api(ruta, opciones) {
  opciones = opciones || {};
  opciones.headers = Object.assign({ 'X-Admin-Secret': CLAVE }, opciones.headers || {});
  return fetch(ruta, opciones);
}

function cargar(desdeLogin) {
  api('/api/pedidos-admin').then(function (r) {
    if (r.status === 401) { CLAVE = null; try { sessionStorage.removeItem('chipao-pedidos-clave'); } catch (e) {} pintarLogin(desdeLogin ? 'Clave incorrecta.' : ''); return null; }
    return r.json();
  }).then(function (d) {
    if (!d) return;
    if (d.error) { raiz.innerHTML = '<p class="error">' + esc(d.error) + '</p>'; return; }
    try { sessionStorage.setItem('chipao-pedidos-clave', CLAVE); } catch (e) {}
    /* Solo se repinta si algo cambió: así el refresco automático no cierra el
       pedido abierto ni borra la captura que se está mirando. */
    var cambio = !DATOS || JSON.stringify(d.pedidos) !== JSON.stringify(DATOS.pedidos);
    DATOS = d;
    if (cambio) pintar();
    clearInterval(TIMER);
    TIMER = setInterval(function () { if (!document.hidden) cargar(false); }, 30000);
  }).catch(function () {
    if (!DATOS) raiz.innerHTML = '<p class="error">Sin conexión. Recarga la página.</p>';
  });
}

function pintar() {
  var ps = DATOS.pedidos, ahora = DATOS.ahora_ms, hoy = hoyLima(ahora);
  var cuenta = { todos: ps.length, revision: 0, pagado: 0, pendiente: 0, expirado: 0, rechazado: 0 };
  var pagadosHoy = 0, montoHoy = 0;
  ps.forEach(function (p) {
    cuenta[p.estado] = (cuenta[p.estado] || 0) + 1;
    if (p.estado === 'pagado' && p.pagado_ms && hoyLima(p.pagado_ms) === hoy) { pagadosHoy++; montoHoy += p.total; }
  });
  var h = '<div class="cabeza"><div><h1>Pedidos</h1><small>Actualizado ' + esc(lima(ahora)) + ' · se refresca solo</small></div>'
    + '<div><button class="btn" id="bRef">Actualizar</button> <button class="btn" id="bSalir">Salir</button></div></div>';
  h += '<div class="resumen">'
    + '<div class="dato' + (cuenta.revision ? ' alerta' : '') + '"><b>' + cuenta.revision + '</b><span>Por revisar</span></div>'
    + '<div class="dato"><b>' + pagadosHoy + '</b><span>Pagados hoy · ' + esc(soles(montoHoy)) + '</span></div>'
    + '<div class="dato"><b>' + cuenta.pendiente + '</b><span>Esperando pago</span></div>'
    + '<div class="dato"><b>' + cuenta.todos + '</b><span>Pedidos en total</span></div></div>';
  h += '<div class="filtros">';
  [['todos', 'Todos'], ['revision', 'Por revisar'], ['pagado', 'Pagados'], ['pendiente', 'Esperando pago'], ['expirado', 'Expirados'], ['rechazado', 'Rechazados']].forEach(function (f) {
    h += '<button class="filtro' + (FILTRO === f[0] ? ' on' : '') + '" data-f="' + f[0] + '">' + f[1] + ' (' + (cuenta[f[0]] || 0) + ')</button>';
  });
  h += '</div>';
  var lista = ps.filter(function (p) { return FILTRO === 'todos' || p.estado === FILTRO; });
  if (!lista.length) h += '<div class="vacio">No hay pedidos en esta vista.</div>';
  lista.forEach(function (p) { h += fila(p); });
  raiz.innerHTML = h;

  document.getElementById('bRef').onclick = function () { cargar(false); };
  document.getElementById('bSalir').onclick = function () { CLAVE = null; DATOS = null; try { sessionStorage.removeItem('chipao-pedidos-clave'); } catch (e) {} clearInterval(TIMER); pintarLogin(''); };
  Array.prototype.forEach.call(document.querySelectorAll('.filtro'), function (b) {
    b.onclick = function () { FILTRO = b.getAttribute('data-f'); pintar(); };
  });
  Array.prototype.forEach.call(document.querySelectorAll('.resu'), function (b) {
    b.onclick = function () { var id = b.getAttribute('data-id'); ABIERTO = ABIERTO === id ? null : id; pintar(); };
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-accion]'), function (b) {
    b.onclick = function () { decidir(b.getAttribute('data-id'), b.getAttribute('data-accion'), b); };
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-foto]'), function (b) {
    b.onclick = function () { verFoto(b.getAttribute('data-foto'), b); };
  });
}

function fila(p) {
  var h = '<div class="fila"><button class="resu" data-id="' + esc(p.id) + '">'
    + '<div class="quien"><b>' + esc(p.nombre) + '</b><small>' + esc(p.id) + ' · ' + esc(lima(p.creado_ms)) + '</small></div>'
    + '<span class="monto">' + esc(soles(p.total)) + '</span>'
    + '<span class="estado e-' + esc(p.estado) + '">' + esc(NOMBRE_ESTADO[p.estado] || p.estado) + '</span></button>';
  if (ABIERTO === p.id) {
    h += '<div class="detalle">';
    if (p.nota) h += '<p class="nota">' + esc(p.nota) + '</p>';
    h += '<ul>';
    p.items.forEach(function (i) { h += '<li>' + esc(i.qty) + ' × ' + esc(i.name) + (i.color ? ' (' + esc(i.color) + ')' : '') + ' — ' + esc(soles(i.price * i.qty)) + '</li>'; });
    h += '</ul>';
    if (p.envio || p.provincia) h += '<p class="gris">Incluye envío ' + esc(soles(p.envio + p.provincia)) + '</p>';
    h += '<p><b>' + esc(p.entrega) + '</b><br>' + esc(p.direccion) + '</p>';
    h += '<p>' + esc(p.telefono) + ' · ' + esc(p.email) + '</p>';
    if (p.lectura) {
      h += '<p class="gris">La IA leyó: ' + esc(p.lectura.monto) + ' · ' + esc(p.lectura.destinatario) + ' · ' + esc(p.lectura.fecha) + ' ' + esc(p.lectura.hora) + ' · operación ' + esc(p.lectura.operacion) + '</p>';
    }
    if (p.operacion) h += '<p class="gris">Operación validada: ' + esc(p.operacion) + ' · capturas enviadas: ' + esc(p.intentos) + '</p>';
    if (p.pagado_ms) h += '<p class="gris">Pagado: ' + esc(lima(p.pagado_ms)) + '</p>';
    h += '<div class="acciones">';
    h += '<a class="btn" target="_blank" rel="noopener" href="https://wa.me/51' + esc(p.telefono) + '?text=' + encodeURIComponent('Hola ' + p.nombre + ', te escribimos de Chipao Music por tu pedido ' + p.id + '.') + '">WhatsApp</a>';
    if (p.foto) h += '<button class="btn" data-foto="' + esc(p.id) + '">Ver captura</button>';
    if (p.estado === 'revision' || p.estado === 'pendiente') {
      h += '<button class="btn si" data-id="' + esc(p.id) + '" data-accion="aprobar">Aprobar pago</button>';
      h += '<button class="btn no" data-id="' + esc(p.id) + '" data-accion="rechazar">Rechazar</button>';
    }
    h += '</div><div id="foto-' + esc(p.id) + '"></div></div>';
  }
  return h + '</div>';
}

function decidir(id, accion, boton) {
  var p = DATOS.pedidos.filter(function (x) { return x.id === id; })[0];
  var texto = accion === 'aprobar'
    ? 'Aprobar el pago de ' + soles(p.total) + ' de ' + p.nombre + '? Se descuenta el stock y se avisa al cliente por correo.'
    : 'Rechazar el pedido de ' + p.nombre + '? Se avisa al cliente por correo.';
  if (!confirm(texto)) return;
  boton.disabled = true;
  api('/api/pedidos-admin/' + id, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ accion: accion }) })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.error) { alert(d.error); boton.disabled = false; return; }
      if (!d.ok) alert('Ese pedido ya no estaba pendiente de decisión.');
      cargar(false);
    }).catch(function () { alert('Sin conexión.'); boton.disabled = false; });
}

function verFoto(id, boton) {
  boton.disabled = true;
  api('/api/pedidos-admin/foto?id=' + encodeURIComponent(id)).then(function (r) {
    if (!r.ok) throw new Error('sin captura');
    return r.blob();
  }).then(function (b) {
    var cont = document.getElementById('foto-' + id);
    cont.innerHTML = '';
    var img = document.createElement('img');
    img.className = 'captura';
    img.alt = 'Captura del comprobante';
    img.src = URL.createObjectURL(b);
    cont.appendChild(img);
    boton.disabled = false;
  }).catch(function () { alert('No se pudo cargar la captura.'); boton.disabled = false; });
}

if (CLAVE) cargar(false); else pintarLogin('');
</script>
</body>
</html>`;
