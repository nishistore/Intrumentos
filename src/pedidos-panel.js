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
import { registrarVentaWhatsapp, anularVenta, enviarConfirmacion } from './ventas.js';
import { cuponesDelPedido, codigoCupon } from './cupones.js';

function json(datos, status = 200) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/* Los cupones no deben tumbar el panel si la tabla aún no existe. */
async function cuponesDe(env, id) {
  try { return await cuponesDelPedido(env, id); } catch { return []; }
}

function vista(p, ahora, cupones) {
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
    canal: p.canal || 'web',
    correo_ms: p.correo_ms || null,
    cupones: (cupones || []).map(c => ({ codigo: codigoCupon(c.numero), anulado: Boolean(c.anulado) })),
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
        'nombre, telefono, email, direccion, nota, operacion, intentos, comprobante, lectura, canal, correo_ms ' +
        'FROM pedidos ORDER BY creado_ms DESC LIMIT 500'
      ).all();
      const porPedido = new Map();
      try {
        const { results: cupones } = await env.DB.prepare('SELECT numero, pedido_id, anulado FROM cupones ORDER BY numero').all();
        for (const c of cupones) {
          if (!porPedido.has(c.pedido_id)) porPedido.set(c.pedido_id, []);
          porPedido.get(c.pedido_id).push(c);
        }
      } catch { /* sin tabla de cupones todavía */ }
      return json({ ahora_ms: ahora, pedidos: results.map(p => vista(p, ahora, porPedido.get(p.id))) });
    }

    /* Para el selector de productos del formulario de ventas por WhatsApp. */
    if (ruta === '/api/pedidos-admin/productos') {
      if (request.method !== 'GET') return json({ error: 'Método no permitido' }, 405);
      const { results } = await env.DB.prepare('SELECT id, name, price, stock FROM products ORDER BY name').all();
      return json({ productos: results });
    }

    if (ruta === '/api/pedidos-admin/whatsapp') {
      if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
      let cuerpo;
      try { cuerpo = await request.json(); } catch { return json({ error: 'Datos inválidos' }, 400); }
      const r = await registrarVentaWhatsapp(env, cuerpo || {});
      if (r.error) return json({ error: r.error }, r.status);
      return json({ ok: true, aviso: r.aviso, pedido: vista(r.pedido, Date.now(), r.cupones) }, 201);
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
      let cuerpo;
      try { cuerpo = await request.json(); } catch { return json({ error: 'Falta la acción' }, 400); }
      const accion = cuerpo && cuerpo.accion;
      let hecho = false;
      if (accion === 'aprobar') hecho = await marcarPagado(env, ctx, p.id, 'Aprobado a mano');
      else if (accion === 'rechazar') hecho = await rechazarPedido(env, ctx, p);
      else if (accion === 'anular') {
        const r = await anularVenta(env, p);
        if (r.error) return json({ error: r.error }, r.status);
        hecho = true;
      } else if (accion === 'correo') {
        const r = await enviarConfirmacion(env, p, cuerpo.email);
        if (r.error) return json({ error: r.error }, r.status);
        hecho = true;
      } else return json({ error: 'Acción desconocida' }, 400);
      const fresco = await leerPedido(env, p.id);
      return json({ ok: hecho, pedido: vista(fresco, Date.now(), await cuponesDe(env, p.id)) });
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
.e-anulado{background:var(--gris-f);color:var(--gris);text-decoration:line-through;}
.canal{font-size:11px;font-weight:700;color:var(--verde);background:var(--verde-f);border-radius:999px;padding:1px 7px;margin-left:6px;}
.cupon{display:inline-block;border:1px solid var(--azul);color:var(--azul);border-radius:6px;padding:2px 8px;margin:2px 4px 2px 0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;font-weight:700;}
.cupon.baja{text-decoration:line-through;opacity:.55;}
.caja-form,.caja-sorteo{background:var(--tarjeta);border:1px solid var(--linea);border-radius:12px;padding:14px;margin-bottom:14px;}
.cab-form{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;flex-wrap:wrap;}
.caja-form label{display:block;font-size:12px;color:var(--suave);margin:8px 0 0;}
.caja-form input,.caja-form select{width:100%;font:inherit;font-size:15px;padding:9px 10px;border-radius:9px;border:1px solid var(--linea);background:var(--fondo);color:var(--tinta);margin-top:3px;}
.dos{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.linea{display:grid;grid-template-columns:3fr 0.9fr 1.1fr 1.2fr auto;gap:6px;margin-top:8px;}
.linea input{margin-top:0;}
@media (max-width:560px){.linea{grid-template-columns:1fr 1fr;}.linea input:first-child{grid-column:1 / 3;}.dos{grid-template-columns:1fr;}}
.aviso{background:var(--verde-f);color:var(--verde);border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:14px;}
.resumen-wa{background:var(--azul-f);color:var(--azul);border-radius:10px;padding:10px 12px;margin-top:12px;font-size:14px;}
.gan-fila{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 0;border-top:1px solid var(--linea);font-size:14px;}
</style>
</head>
<body>
<div class="caja" id="raiz"></div>
<script>
var CLAVE = null;
try { CLAVE = sessionStorage.getItem('chipao-pedidos-clave'); } catch (e) {}
var DATOS = null, FILTRO = 'todos', ABIERTO = null, TIMER = null;
var SORTEO_D = null, PRODUCTOS = null, AVISO = '';
var FORM = nuevoForm();
function nuevoForm() {
  return { abierto: false, nombre: '', telefono: '', email: '', entrega: 'tienda', direccion: '', envio: '', error: '', guardando: false,
    lineas: [{ texto: '', id: null, qty: '1', price: '', color: '', tocado: false }] };
}
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
var NOMBRE_ESTADO = { pagado: 'Pagado', revision: 'Por revisar', pendiente: 'Esperando pago', expirado: 'Expirado', rechazado: 'Rechazado', anulado: 'Anulada' };

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
    /* Con el formulario abierto no se repinta: se perdería lo que se está escribiendo. */
    if (cambio && !FORM.abierto) pintar();
    cargarSorteo();
    clearInterval(TIMER);
    TIMER = setInterval(function () { if (!document.hidden) cargar(false); }, 30000);
  }).catch(function () {
    if (!DATOS) raiz.innerHTML = '<p class="error">Sin conexión. Recarga la página.</p>';
  });
}

function pintar() {
  var ps = DATOS.pedidos, ahora = DATOS.ahora_ms, hoy = hoyLima(ahora);
  var cuenta = { todos: ps.length, revision: 0, pagado: 0, pendiente: 0, expirado: 0, rechazado: 0, anulado: 0 };
  var pagadosHoy = 0, montoHoy = 0;
  ps.forEach(function (p) {
    cuenta[p.estado] = (cuenta[p.estado] || 0) + 1;
    if (p.estado === 'pagado' && p.pagado_ms && hoyLima(p.pagado_ms) === hoy) { pagadosHoy++; montoHoy += p.total; }
  });
  var h = '<div class="cabeza"><div><h1>Pedidos</h1><small>Actualizado ' + esc(lima(ahora)) + ' · se refresca solo</small></div>'
    + '<div><button class="btn si" id="bNueva">Venta por WhatsApp</button> <button class="btn" id="bRef">Actualizar</button> <button class="btn" id="bSalir">Salir</button></div></div>';
  h += '<div class="resumen">'
    + '<div class="dato' + (cuenta.revision ? ' alerta' : '') + '"><b>' + cuenta.revision + '</b><span>Por revisar</span></div>'
    + '<div class="dato"><b>' + pagadosHoy + '</b><span>Pagados hoy · ' + esc(soles(montoHoy)) + '</span></div>'
    + '<div class="dato"><b>' + cuenta.pendiente + '</b><span>Esperando pago</span></div>'
    + '<div class="dato"><b>' + cuenta.todos + '</b><span>Pedidos en total</span></div></div>';
  if (AVISO) h += '<div class="aviso">' + esc(AVISO) + '</div>';
  if (FORM.abierto) h += formWa();
  h += cajaSorteo();
  h += '<div class="filtros">';
  [['todos', 'Todos'], ['revision', 'Por revisar'], ['pagado', 'Pagados'], ['pendiente', 'Esperando pago'], ['expirado', 'Expirados'], ['rechazado', 'Rechazados'], ['anulado', 'Anuladas']].forEach(function (f) {
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
  document.getElementById('bNueva').onclick = function () { AVISO = ''; FORM.abierto = true; cargarProductos(); pintar(); window.scrollTo(0, 0); };
  enlazarForm();
  enlazarSorteo();
}

function fila(p) {
  var h = '<div class="fila"><button class="resu" data-id="' + esc(p.id) + '">'
    + '<div class="quien"><b>' + esc(p.nombre) + (p.canal === 'whatsapp' ? '<span class="canal">WhatsApp</span>' : '') + '</b><small>' + esc(p.id) + ' · ' + esc(lima(p.creado_ms)) + '</small></div>'
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
    if (p.pagado_ms) h += '<p class="gris">' + (p.canal === 'whatsapp' ? 'Registrada: ' : 'Pagado: ') + esc(lima(p.pagado_ms)) + '</p>';
    if (p.cupones && p.cupones.length) {
      h += '<p class="gris">Cupones del sorteo: ';
      p.cupones.forEach(function (c) { h += '<span class="cupon' + (c.anulado ? ' baja' : '') + '">' + esc(c.codigo) + '</span>'; });
      h += '</p>';
    }
    if (p.correo_ms) h += '<p class="gris">Confirmación enviada por correo: ' + esc(lima(p.correo_ms)) + '</p>';
    h += '<div class="acciones">';
    h += '<a class="btn" target="_blank" rel="noopener" href="https://wa.me/51' + esc(p.telefono) + '?text=' + encodeURIComponent('Hola ' + p.nombre + ', te escribimos de Chipao Music por tu pedido ' + p.id + '.') + '">WhatsApp</a>';
    if (p.foto) h += '<button class="btn" data-foto="' + esc(p.id) + '">Ver captura</button>';
    if (p.estado === 'revision' || p.estado === 'pendiente') {
      h += '<button class="btn si" data-id="' + esc(p.id) + '" data-accion="aprobar">Aprobar pago</button>';
      h += '<button class="btn no" data-id="' + esc(p.id) + '" data-accion="rechazar">Rechazar</button>';
    }
    if (p.estado === 'pagado') {
      h += '<button class="btn si" data-id="' + esc(p.id) + '" data-accion="correo">' + (p.correo_ms ? 'Reenviar confirmación por correo' : 'Enviar confirmación y cupones por correo') + '</button>';
      if (p.canal === 'whatsapp') h += '<button class="btn no" data-id="' + esc(p.id) + '" data-accion="anular">Anular venta</button>';
    }
    h += '</div><div id="foto-' + esc(p.id) + '"></div></div>';
  }
  return h + '</div>';
}

function decidir(id, accion, boton) {
  var p = DATOS.pedidos.filter(function (x) { return x.id === id; })[0];
  if (accion === 'correo' || accion === 'anular') return especial(p, accion, boton);
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

/* Enviar la confirmación por correo y anular una venta de WhatsApp. */
function especial(p, accion, boton) {
  var cuerpo = { accion: accion };
  if (accion === 'correo') {
    var correo = prompt('Correo del cliente. Se le envía la confirmación del pedido' + (p.cupones && p.cupones.length ? ' con sus cupones.' : '.'), p.email || '');
    if (correo === null) return;
    correo = correo.trim();
    if (!correo) { alert('Escribe un correo.'); return; }
    cuerpo.email = correo;
  } else if (!confirm('Anular la venta de ' + p.nombre + ' (' + soles(p.total) + ')? Vuelve el stock y se anulan sus cupones del sorteo.')) return;
  boton.disabled = true;
  api('/api/pedidos-admin/' + p.id, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      boton.disabled = false;
      if (d.error) { alert(d.error); return; }
      AVISO = accion === 'correo' ? 'Confirmación enviada a ' + cuerpo.email + '.' : 'Venta ' + p.id + ' anulada.';
      cargar(false);
    }).catch(function () { alert('Sin conexión.'); boton.disabled = false; });
}

/* ------------------------------ venta por WhatsApp ------------------------------ */
function cargarProductos() {
  if (PRODUCTOS) return;
  api('/api/pedidos-admin/productos').then(function (r) { return r.json(); }).then(function (d) {
    PRODUCTOS = d.productos || [];
    var dl = document.getElementById('dlProductos');
    if (dl) dl.innerHTML = opcionesProductos();
  }).catch(function () {});
}
function opcionesProductos() {
  return (PRODUCTOS || []).map(function (p) { return '<option value="' + esc(p.name) + '"></option>'; }).join('');
}
function productoPorNombre(texto) {
  var t = String(texto || '').trim().toLowerCase();
  var r = (PRODUCTOS || []).filter(function (p) { return p.name.trim().toLowerCase() === t; });
  return r.length ? r[0] : null;
}
function totalesForm() {
  var sub = 0;
  FORM.lineas.forEach(function (l) { sub += (Number(l.qty) || 0) * (Number(l.price) || 0); });
  var envio = Number(FORM.envio) || 0;
  var cupones = sub >= 100 ? 2 : (sub >= 20 ? 1 : 0);
  return { sub: sub, envio: envio, total: sub + envio, cupones: cupones };
}
function textoResumenForm() {
  var t = totalesForm();
  return 'Productos ' + soles(t.sub) + (t.envio ? ' + envío ' + soles(t.envio) : '') + ' = <b>' + soles(t.total) + '</b><br>'
    + (t.cupones ? 'Al guardar recibe <b>' + t.cupones + (t.cupones === 1 ? ' cupón' : ' cupones') + '</b> del sorteo.' : 'Con menos de S/ 20 en productos no recibe cupón.');
}
function formWa() {
  var f = FORM;
  var h = '<div class="caja-form"><div class="cab-form"><b>Registrar venta por WhatsApp</b><button class="btn" id="bCerrarForm">Cerrar</button></div>'
    + '<div class="dos"><label>Cliente<input data-campo="nombre" value="' + esc(f.nombre) + '" maxlength="80"></label>'
    + '<label>Celular (9 dígitos)<input data-campo="telefono" inputmode="numeric" maxlength="12" value="' + esc(f.telefono) + '"></label></div>'
    + '<label>Correo del cliente (puedes dejarlo vacío y escribirlo al enviar la confirmación)<input data-campo="email" type="email" value="' + esc(f.email) + '"></label>'
    + '<label style="margin-top:12px">Productos: escribe y elige de la lista. El precio se llena solo y lo puedes cambiar.</label>';
  f.lineas.forEach(function (l, i) {
    h += '<div class="linea"><input list="dlProductos" placeholder="Producto" data-l="' + i + '" data-c="texto" value="' + esc(l.texto) + '">'
      + '<input type="number" min="1" max="50" placeholder="Cant." data-l="' + i + '" data-c="qty" value="' + esc(l.qty) + '">'
      + '<input inputmode="decimal" placeholder="Precio" data-l="' + i + '" data-c="price" value="' + esc(l.price) + '">'
      + '<input placeholder="Color" data-l="' + i + '" data-c="color" value="' + esc(l.color) + '">'
      + '<button class="btn" data-quitar="' + i + '" aria-label="Quitar producto">×</button></div>';
  });
  h += '<datalist id="dlProductos">' + opcionesProductos() + '</datalist>'
    + '<div style="margin-top:8px"><button class="btn" id="bMasLinea">+ Agregar producto</button></div>'
    + '<div class="dos"><label>Entrega<select data-campo="entrega">'
    + '<option value="tienda"' + (f.entrega === 'tienda' ? ' selected' : '') + '>Recojo en tienda</option>'
    + '<option value="lima"' + (f.entrega === 'lima' ? ' selected' : '') + '>Envío en Lima</option>'
    + '<option value="peru"' + (f.entrega === 'peru' ? ' selected' : '') + '>Envío a provincia</option></select></label>'
    + '<label>Costo de envío (S/)<input data-campo="envio" inputmode="decimal" placeholder="0" value="' + esc(f.envio) + '"></label></div>'
    + '<label>Dirección o quién recoge<input data-campo="direccion" maxlength="300" placeholder="Si es recojo en tienda puedes dejarlo vacío" value="' + esc(f.direccion) + '"></label>'
    + '<div class="resumen-wa" id="resumenWa">' + textoResumenForm() + '</div>'
    + '<div class="error" id="errWa" style="margin-top:8px">' + esc(f.error) + '</div>'
    + '<div class="acciones"><button class="btn si" id="bGuardarWa"' + (f.guardando ? ' disabled' : '') + '>' + (f.guardando ? 'Guardando…' : 'Guardar venta') + '</button></div>'
    + '<p style="color:var(--suave);font-size:12px;margin:8px 0 0">Guardar baja el stock y da los cupones. El correo no sale solo: lo envías con el botón de la venta.</p></div>';
  return h;
}
function refrescarResumenForm() {
  var r = document.getElementById('resumenWa');
  if (r) r.innerHTML = textoResumenForm();
}
function enlazarForm() {
  var cerrar = document.getElementById('bCerrarForm');
  if (!cerrar) return;
  cerrar.onclick = function () { FORM = nuevoForm(); pintar(); };
  Array.prototype.forEach.call(document.querySelectorAll('[data-campo]'), function (el) {
    var guardar = function () { FORM[el.getAttribute('data-campo')] = el.value; refrescarResumenForm(); };
    el.oninput = guardar; el.onchange = guardar;
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-l]'), function (el) {
    var i = Number(el.getAttribute('data-l')), c = el.getAttribute('data-c');
    var guardar = function () {
      var l = FORM.lineas[i];
      l[c] = el.value;
      if (c === 'texto') {
        var p = productoPorNombre(el.value);
        l.id = p ? p.id : null;
        if (p && !l.tocado) {
          l.price = String(p.price);
          var cajaPrecio = document.querySelector('[data-l="' + i + '"][data-c="price"]');
          if (cajaPrecio) cajaPrecio.value = l.price;
        }
      }
      if (c === 'price') l.tocado = true;
      refrescarResumenForm();
    };
    el.oninput = guardar; el.onchange = guardar;
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-quitar]'), function (b) {
    b.onclick = function () {
      if (FORM.lineas.length > 1) FORM.lineas.splice(Number(b.getAttribute('data-quitar')), 1);
      pintar();
    };
  });
  document.getElementById('bMasLinea').onclick = function () {
    FORM.lineas.push({ texto: '', id: null, qty: '1', price: '', color: '', tocado: false });
    pintar();
  };
  document.getElementById('bGuardarWa').onclick = guardarVentaWa;
}
function guardarVentaWa() {
  var f = FORM;
  var fallo = function (m) { f.error = m; var e = document.getElementById('errWa'); if (e) e.textContent = m; };
  if (f.nombre.trim().length < 2) return fallo('Escribe el nombre del cliente.');
  if (f.telefono.replace(/[^0-9]/g, '').length !== 9) return fallo('El celular debe tener 9 dígitos.');
  var items = [];
  for (var i = 0; i < f.lineas.length; i++) {
    var l = f.lineas[i];
    if (!l.id) return fallo('Elige el producto de la lista en la línea ' + (i + 1) + '.');
    if (!(Number(l.qty) >= 1)) return fallo('Revisa la cantidad de la línea ' + (i + 1) + '.');
    if (!(Number(l.price) > 0)) return fallo('Falta el precio de la línea ' + (i + 1) + '.');
    items.push({ id: l.id, qty: Number(l.qty), price: Number(l.price), color: l.color });
  }
  f.error = ''; f.guardando = true;
  var boton = document.getElementById('bGuardarWa');
  if (boton) { boton.disabled = true; boton.textContent = 'Guardando…'; }
  api('/api/pedidos-admin/whatsapp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
    nombre: f.nombre, telefono: f.telefono, email: f.email, entrega: f.entrega, direccion: f.direccion, envio: f.envio, items: items }) })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      f.guardando = false;
      if (d.error) { fallo(d.error); if (boton) { boton.disabled = false; boton.textContent = 'Guardar venta'; } return; }
      var cs = (d.pedido.cupones || []).map(function (c) { return c.codigo; });
      AVISO = 'Venta ' + d.pedido.id + ' guardada' + (cs.length ? ' · cupones: ' + cs.join(', ') : ' · sin cupones (menos de S/ 20)') + '. Ábrela abajo para enviar la confirmación por correo.' + (d.aviso ? ' ' + d.aviso : '');
      FORM = nuevoForm(); FILTRO = 'todos'; ABIERTO = d.pedido.id;
      cargar(false);
      window.scrollTo(0, 0);
    }).catch(function () { f.guardando = false; fallo('Sin conexión. Revisa si la venta quedó guardada antes de repetirla.'); if (boton) { boton.disabled = false; boton.textContent = 'Guardar venta'; } });
}

/* ------------------------------ sorteo ------------------------------ */
function cargarSorteo() {
  api('/api/sorteo-admin').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (!d || d.error) return;
    var cambio = !SORTEO_D || JSON.stringify(d.ganadores) !== JSON.stringify(SORTEO_D.ganadores)
      || d.cupones !== SORTEO_D.cupones || d.elegibles !== SORTEO_D.elegibles;
    SORTEO_D = d;
    if (cambio && DATOS && !FORM.abierto) pintar();
  }).catch(function () {});
}
function premioLibre() {
  var usados = {};
  SORTEO_D.ganadores.forEach(function (g) { usados[g.premio] = true; });
  var n = 1;
  while (usados[n]) n++;
  return n;
}
function cajaSorteo() {
  var s = SORTEO_D;
  if (!s) return '';
  var h = '<div class="caja-sorteo"><div class="cab-form"><b>Sorteo navideño</b><span style="color:var(--suave);font-size:13px">'
    + s.cupones + ' cupones · ' + s.clientes + ' clientes · ' + s.elegibles + ' pueden ganar</span></div>';
  s.ganadores.forEach(function (g) {
    h += '<div class="gan-fila"><span><b>Premio ' + esc(g.premio) + '</b> · ' + esc(g.codigo) + ' · ' + esc(g.nombre) + ' · ' + esc(g.telefono) + '</span><span>'
      + '<a class="btn" target="_blank" rel="noopener" href="https://wa.me/51' + esc(g.telefono) + '">WhatsApp</a> '
      + '<button class="btn no" data-descartar="' + esc(g.id) + '">Descartar</button></span></div>';
  });
  if (s.ganadores.length < s.premios) {
    h += '<div class="acciones"><button class="btn si" id="bSortear"' + (s.elegibles ? '' : ' disabled') + '>Sortear premio ' + premioLibre() + '</button></div>';
  } else {
    h += '<p style="color:var(--suave);font-size:13px;margin:10px 0 0">Ya están los ' + s.premios + ' ganadores. Si alguno no aparece en el vivo, descártalo y sortea otro.</p>';
  }
  return h + '</div>';
}
function enlazarSorteo() {
  var b = document.getElementById('bSortear');
  if (b) b.onclick = function () {
    if (!confirm('Sortear el premio ' + premioLibre() + ' ahora?')) return;
    b.disabled = true;
    api('/api/sorteo-admin/sortear', { method: 'POST' }).then(function (r) { return r.json(); }).then(function (d) {
      if (d.error) { alert(d.error); b.disabled = false; return; }
      var g = d.ganador;
      alert('Premio ' + g.premio + ': ' + g.codigo + ' — ' + g.nombre + ' · ' + g.telefono);
      cargarSorteo();
    }).catch(function () { alert('Sin conexión.'); b.disabled = false; });
  };
  Array.prototype.forEach.call(document.querySelectorAll('[data-descartar]'), function (x) {
    x.onclick = function () {
      if (!confirm('Descartar a este ganador? Su cupón sale del sorteo y puedes sortear otro.')) return;
      api('/api/sorteo-admin/descartar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: Number(x.getAttribute('data-descartar')) }) })
        .then(function (r) { return r.json(); }).then(function () { cargarSorteo(); });
    };
  });
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
