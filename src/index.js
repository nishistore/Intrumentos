/* ======================================================================
   Worker de SEO para chipaomusic.com

   El sitio es una sola página (index.html) que Cloudflare devuelve para
   TODAS las rutas. Sin este Worker, Google recibe exactamente el mismo HTML
   para la home, el catálogo, cada categoría y cada producto: mismo <title>,
   misma descripción, mismo canonical apuntando a la home y — dentro de
   <main id="app"> — el mismo texto de portada repetido 158 veces.

   Este Worker hace tres cosas antes de enviar el HTML:

     1. Reescribe el <head> según la URL (título, descripción, og:*, canonical
        y JSON-LD), con los mismos textos que setPageMeta() usa en el cliente.
     2. Rellena <main id="app"> con el contenido real de esa ruta, para que
        Google no tenga que ejecutar JavaScript ni esperar a la API. El JS del
        sitio lo reemplaza al cargar, así que para las personas no cambia nada.
     3. Genera /sitemap.xml al vuelo desde la API, para que no haya que
        regenerarlo a mano cada vez que se agrega un producto.
   ====================================================================== */

const SITE_ORIGIN = 'https://chipaomusic.com';
const PRODUCTS_API_URL = 'https://chipao-productos-api.nishistore.workers.dev';
const DEFAULT_OG_IMAGE = 'https://pub-52acb879922b427f958ddbe0c729bbfc.r2.dev/og-chipao-music-2.jpg';

const SITE_TITLE = 'Instrumentos Musicales en Lima | Chipao Music';
const DEFAULT_META_DESCRIPTION = 'Tienda de instrumentos musicales en San Juan de Miraflores, Lima. Guitarras, teclados, percusión, viento y accesorios. Envíos a todo el Perú y recojo en tienda.';

/* Copia de las categorías de index.html. Si agregas una categoría allá,
   agrégala también aquí para que su página tenga título propio. Los
   productos NO se duplican: se piden a la API en cada visita. */
/* `intro` es el texto propio de cada categoria, y NO es el meta description.
   Google marco /categoria/cuerda y /ofertas como duplicadas entre si: una vez
   renderizadas compartian el 70% de su vocabulario, porque las guitarras y
   los violines en oferta son justo los de cuerda, y todo lo que las rodea
   -cabecera, filtros, pie- es igual en las dos. Esto le da a cada pagina algo
   que solo dice ella. Si se cambia aqui hay que cambiarlo igual en
   index.html: las dos copias de CATEGORIES tienen que decir lo mismo. */
const CATEGORIES = [
  { key: 'cuerda', intro: "Guitarras acústicas, clásicas y eléctricas, ukeleles soprano y de concierto, violines 4/4, bajos y charangos, desde S/ 100. Puedes probarlos en la tienda antes de decidir. Las cuerdas de repuesto, las púas y los capotrastes están en Accesorios.", label: 'Instrumentos de Cuerda', desc: 'Guitarras acústicas y eléctricas, bajos, violines, ukeleles y charangos en Lima. Tienda en San Juan de Miraflores con envíos a todo el Perú.', subs: [{ key: 'guitarras', label: 'Guitarras Acústicas' }, { key: 'guitarrasElectricas', label: 'Guitarras Eléctricas' }, { key: 'bajos', label: 'Bajos' }, { key: 'violines', label: 'Violines' }, { key: 'ukeleles', label: 'Ukeleles' }, { key: 'charangos', label: 'Charangos' }] },
  { key: 'teclados', intro: "Teclados y pianos digitales para empezar y para tocar en vivo. Ahora mismo no hay stock cargado en la web: escríbenos por WhatsApp y te decimos qué tenemos en tienda y qué podemos conseguir.", label: 'Teclados', desc: 'Teclados y pianos digitales para estudiar y para tocar en vivo. Tienda de instrumentos en San Juan de Miraflores, Lima, con envíos a todo el Perú.', subs: [] },
  { key: 'percusion', intro: "Bombos andinos de cuero hechos a mano, bombos de banda, tarolas, panderetas, kalimbas de 17 teclas y metalófonos, entre S/ 12 y S/ 250. Las baquetas y los parches de repuesto están en Accesorios.", label: 'Percusión', desc: 'Cajones, bombos, tarolas, tambores, panderetas y kalimbas. Tienda de percusión en San Juan de Miraflores, Lima, con envíos a todo el país.', subs: [{ key: 'tambores', label: 'Tambores' }, { key: 'bombos', label: 'Bombos' }, { key: 'tarolas', label: 'Tarolas' }, { key: 'cajones', label: 'Cajones' }, { key: 'metalofono', label: 'Metalófono' }, { key: 'panderetas', label: 'Panderetas' }, { key: 'kalimbas', label: 'Kalimbas' }] },
  { key: 'viento', intro: "Flautas dulces soprano, melódicas de 32 y 37 teclas, quenas y zampoñas, entre S/ 20 y S/ 80. Si es para la lista del colegio, en Para Colegio está todo junto.", label: 'Viento', desc: 'Flautas dulces, melódicas, quenas y zampoñas, para el colegio y para tocar en serio. Tienda en San Juan de Miraflores, Lima, con envíos a todo el Perú.', subs: [{ key: 'flautas', label: 'Flautas' }, { key: 'melodicas', label: 'Melódicas' }, { key: 'quenas', label: 'Quenas' }, { key: 'zamponas', label: 'Zampoñas' }] },
  { key: 'audio', intro: "Micrófonos dinámicos, sistemas inalámbricos para micrófono y para guitarra, y amplificadores, desde S/ 100. Para grabar en casa o para tocar en vivo; si no sabes cuál te sirve, escríbenos y lo vemos contigo.", label: 'Micrófono y Audio', desc: 'Micrófonos, interfaces y amplificadores para grabar y para tocar en vivo. Tienda de audio en San Juan de Miraflores, Lima, con envíos a todo el Perú.', subs: [{ key: 'microfonos', label: 'Micrófonos' }, { key: 'interfaces', label: 'Interfaces' }, { key: 'amplificadores', label: 'Amplificadores' }] },
  { key: 'colegio', intro: "Todo lo de la lista escolar en un sitio: flautas dulces, melódicas, xilófonos, metalófonos, claves y panderetas, desde S/ 10. Mándanos la lista por WhatsApp y te la cotizamos completa.", label: 'Para Colegio', seo: 'Instrumentos para Colegio', desc: 'Instrumentos para la lista del colegio: flautas dulces, melódicas, xilófonos, liras, claves y panderetas. Tienda en Lima con envíos a todo el Perú.', subs: [{ key: 'colXilofonos', label: 'Xilófonos y metalófonos' }, { key: 'colPercusion', label: 'Claves, baquetas y percusión' }] },
  { key: 'accesorios', intro: "Cuerdas para acústica, clásica y eléctrica de D'Addario, Ernie Ball y Romeo, capotrastes, púas, afinadores, atriles, baquetas y repuestos, desde S/ 15. Si buscas un calibre concreto, pregúntanos antes de venir y te decimos si lo tenemos.", label: 'Accesorios', desc: 'Cuerdas, púas, capotrastes, afinadores, atriles, baquetas y repuestos para tu instrumento. Tienda en San Juan de Miraflores, Lima, con envíos a todo el Perú.', subs: [{ key: 'accCuerdasAcustica', label: 'Cuerdas (Acústica/Clásica)' }, { key: 'accCuerdasElectrica', label: 'Cuerdas (Eléctrica)' }, { key: 'accCapotrastes', label: 'Capotrastes' }, { key: 'accPuas', label: 'Púas y pines' }, { key: 'accAfinadores', label: 'Afinadores y metrónomos' }, { key: 'accAtriles', label: 'Atriles y parantes' }, { key: 'accBaquetas', label: 'Baquetas y parches' }, { key: 'accCanas', label: 'Cañas y boquillas' }, { key: 'accTeclados', label: 'Teclados' }, { key: 'accViolin', label: 'Violín (resina y puentes)' }, { key: 'accCuidado', label: 'Limpieza y repuestos' }] },
];

/* Copia de CROSS_LISTED_CATS de index.html: productos que se listan en una
   categoría extra además de la suya. Si cambias uno allá, cámbialo aquí para
   que la página de la categoría muestre lo mismo que ve Google. */
const CROSS_LISTED_CATS = {
  23: ["colegio"],   // Flauta Dulce Soprano Yamaha
  57: ["colegio"],   // Tarolita de Niño (Percusión) también va en Para Colegio
  127: ["colegio"],  // Melódica California 37 Teclas (colores disponibles)
  140: ["colegio"],  // Melódica California 32 Teclas (colores disponibles)
  202: ["colegio"],  // Pandereta Media Luna (varios colores)
  203: ["colegio"],  // Pandereta Media Luna Doble Hilera
  208: ["colegio"],  // Xilófono Infantil de 8 Notas con Baquetas
  209: ["colegio"],  // Flauta Dulce Soprano Hohner Melody con Funda
  210: ["colegio"],  // Quena Lupaca con Funda
  211: ["colegio"],  // Zampoña Lupaca con Funda
};
function productInCat(p, catKey) {
  return p.cat === catKey || (CROSS_LISTED_CATS[p.id] || []).includes(catKey);
}

/* Copia de ACCESORIOS_FILTER_GROUPS de index.html. En Accesorios los chips que
   ve el visitante NO son los subs crudos ('accCapotrastes') sino grupos por
   instrumento, porque un mismo capo sirve para acústica y para eléctrica. Si
   cambias uno allá, cámbialo aquí: son las URLs que indexa Google. */
const ACCESORIOS_FILTER_GROUPS = [
  { key: 'accGrpGuitarraAcustica', label: 'Guitarra Acústica y Clásica', matches: ['accCuerdasAcustica', 'accCapotrastes', 'accPuas'] },
  { key: 'accGrpGuitarraElectrica', label: 'Guitarra Eléctrica', matches: ['accCuerdasElectrica', 'accCapotrastes', 'accPuas'] },
  { key: 'accGrpPercusion', label: 'Percusión', matches: ['accBaquetas'] },
  { key: 'accGrpViento', label: 'Viento', matches: ['accCanas'] },
  { key: 'accGrpTeclados', label: 'Teclado y Piano', matches: ['accTeclados'] },
  { key: 'accGrpViolin', label: 'Violín y cuerda frotada', matches: ['accViolin'] },
  { key: 'accGrpGenerales', label: 'Generales (cualquier instrumento)', matches: ['accAfinadores', 'accAtriles', 'accCuidado'] },
];

/* Copia de COLEGIO_FILTER_GROUPS de index.html: Para Colegio agrupa subs de
   varias categorías, porque casi todo lo que muestra vive en otra. */
const COLEGIO_FILTER_GROUPS = [
  { key: 'colGrpFlautas', label: 'Flautas dulces', matches: ['flautas'] },
  { key: 'colGrpMelodicas', label: 'Melódicas', matches: ['melodicas'] },
  { key: 'colGrpXilofonos', label: 'Xilófonos y metalófonos', matches: ['metalofono', 'colXilofonos'] },
  { key: 'colGrpPercusion', label: 'Claves, panderetas y percusión', matches: ['panderetas', 'tarolas', 'colPercusion'] },
  { key: 'colGrpAndinos', label: 'Quenas y zampoñas', matches: ['quenas', 'zamponas'] },
];

const FILTER_GROUPS = { accesorios: ACCESORIOS_FILTER_GROUPS, colegio: COLEGIO_FILTER_GROUPS };

/* Los filtros que se pueden recorrer dentro de una categoría y que por tanto
   tienen URL propia, como /categoria/cuerda/ukeleles. */
function subsNavegables(cat) {
  return FILTER_GROUPS[cat.key] || cat.subs;
}

/* El trozo de URL de una subcategoría sale de su ETIQUETA, no de su clave: las
   claves de Accesorios son camelCase ('accCuerdasAcustica') y no sirven de
   URL, mientras que la etiqueta da 'cuerdas-acustica-clasica'. */
function subSlug(sub) {
  return slugify(sub.label);
}

function findSub(cat, slug) {
  return subsNavegables(cat).find(s => subSlug(s) === slug) || null;
}

/* Un grupo (de accesorios o de Para Colegio) agrupa varios subs reales; el resto son uno a uno. */
function productInSub(p, sub) {
  return sub.matches ? sub.matches.includes(p.sub) : p.sub === sub.key;
}

/* La secuencia "<", escrita sin barra invertida literal. Sirve para
   escapar los "<" que pudiera traer la descripción de un producto y que
   cerrarían antes de tiempo la etiqueta <script> del JSON-LD. */
const LT_ESCAPE = String.fromCharCode(92) + 'u003c';

/* Mismo slug que usa el sitio para armar /producto/<id>-<slug>.
   El rango ̀-ͯ son las tildes que NFD separa de su letra. */
function slugify(str) {
  return String(str).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function productPath(p) {
  return '/producto/' + p.id + '-' + slugify(p.name);
}

function isOffer(p) {
  return Boolean(p.old && p.old > p.price);
}

/* Pide el catálogo a la API. Se cachea en el borde 5 minutos para no
   golpear la API en cada visita. Si falla devolvemos lista vacía: la página
   se sirve igual, solo sin el contenido específico de esa ruta. */
async function fetchProducts() {
  try {
    const res = await fetch(PRODUCTS_API_URL + '/products', {
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

/* ====================== BANNER DE PROMOCIÓN =========================

   La barra roja con el contador y los tres mayores descuentos se enciende y
   se apaga desde el panel de productos, con un botón. El interruptor vive en
   la tabla `settings` de D1 (clave `banner_promo`, '1' o '0') y no aquí, para
   que cambiarlo no obligue a desplegar.

   El estado viaja DENTRO del HTML, igual que el catálogo (ver HeadExtras):
   así el visitante no paga un viaje extra y la barra no aparece para
   desaparecer medio segundo después.

   La escritura la autoriza la API de productos, no este Worker: el panel
   manda la clave de administrador y aquí se comprueba contra su
   /admin/login, que es el único que sabe cuál es. Este Worker no la guarda.
   ==================================================================== */

const CLAVE_BANNER = 'banner_promo';
/* Petición ficticia que solo sirve de llave en el caché del borde: no se
   envía a ningún sitio, le da nombre a la entrada. */
const CACHE_BANNER = new Request('https://chipaomusic.com/__banner-promo');
const BANNER_TTL = 30;

/* Por defecto encendido: es como ha estado la barra desde que existe, así que
   si la base no contesta preferimos enseñarla a apagarla sin que nadie lo
   haya pedido. */
async function bannerActivo(env, ctx) {
  try {
    const cacheado = await caches.default.match(CACHE_BANNER);
    if (cacheado) return (await cacheado.text()) === '1';
  } catch { /* sin caché vamos a la base */ }

  let activo = true;
  try {
    const fila = await env.DB.prepare(
      'SELECT value FROM settings WHERE key = ?').bind(CLAVE_BANNER).first();
    if (fila) activo = fila.value === '1';
  } catch {
    /* Sin guardar en caché: un fallo de un momento no debe congelar el
       estado treinta segundos. */
    return activo;
  }

  const guardar = caches.default.put(CACHE_BANNER, new Response(activo ? '1' : '0', {
    headers: { 'cache-control': 'max-age=' + BANNER_TTL },
  })).catch(() => {});
  if (ctx) ctx.waitUntil(guardar); else await guardar;
  return activo;
}

function respuestaJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/* La clave de administrador la valida su dueña, la API de productos:
   /admin/login responde ok:true solo si coincide con su ADMIN_SECRET. Si esa
   llamada falla por cualquier motivo, aquí se dice no. */
async function claveDeAdminValida(clave) {
  if (!clave) return false;
  try {
    const res = await fetch(PRODUCTS_API_URL + '/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: clave }),
    });
    const data = await res.json();
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

async function apiBanner(request, env, ctx) {
  if (request.method === 'GET') {
    return respuestaJson({ activo: await bannerActivo(env, ctx) });
  }
  if (request.method !== 'PUT') {
    return respuestaJson({ error: 'Método no permitido' }, 405);
  }
  if (!await claveDeAdminValida(request.headers.get('X-Admin-Secret'))) {
    return respuestaJson({ error: 'No autorizado' }, 401);
  }

  let activo;
  try {
    activo = Boolean((await request.json()).activo);
  } catch {
    return respuestaJson({ error: 'Falta el campo activo' }, 400);
  }

  try {
    await env.DB.prepare(
      "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) " +
      'ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
    ).bind(CLAVE_BANNER, activo ? '1' : '0').run();
  } catch (err) {
    return respuestaJson({ error: String(err) }, 500);
  }

  /* Tira la copia del borde para que el cambio se vea en la siguiente
     recarga. Solo vacía la del centro de datos que atendió esta petición: en
     los demás la barra tarda hasta BANNER_TTL segundos en enterarse. */
  try { await caches.default.delete(CACHE_BANNER); } catch { /* da igual */ }

  return respuestaJson({ ok: true, activo });
}

/* ====================== PRECIOS DEL TALLER ==========================

   Se editan en la pestaña Taller del panel y viven en la misma tabla
   `settings`, clave `taller_precios`, como JSON. Mismo camino que el banner:
   se incrustan en el HTML para que /taller, el recuadro de la portada y el
   aviso de las fichas pinten ya con el precio bueno, y los escribe solo quien
   tenga la clave de administrador.

   Formato: [{ titulo, tipos, filas: [[servicio, precio, descripción]] }], con
   precio null para "a tratar". La descripción es la línea pequeña bajo cada
   servicio en la tabla de /taller. TALLER_POR_DEFECTO es la carta impresa del taller; se usa
   mientras nadie haya guardado nada, o si la base no contesta. La misma copia
   está en index.html. */
const CLAVE_TALLER = 'taller_precios';
const CACHE_TALLER = new Request('https://chipaomusic.com/__taller-precios');

const TALLER_POR_DEFECTO = [
  { titulo: 'Guitarras', tipos: 'Acústicas · eléctricas · electroacústicas', filas: [
    ['Calibración', 100, 'Altura de cuerdas, alma y octavación'],
    ['Calibración + cuerdas nuevas', 130, 'Incluye juego de cuerdas'],
    ['Calibración + cuerdas nuevas + mantenimiento', 160, 'Limpieza de trastes, diapasón y electrónica'],
    ['Reparación, pintura, otros', null, 'Cotización según el estado del instrumento'],
  ] },
  { titulo: 'Bajos', tipos: 'Acústicos · eléctricos · electroacústicos', filas: [
    ['Calibración', 100, 'Altura de cuerdas, alma y octavación'],
    ['Calibración + cuerdas nuevas', 200, 'Incluye juego de cuerdas'],
    ['Calibración + cuerdas nuevas + mantenimiento', 230, 'Limpieza de trastes, diapasón y electrónica'],
    ['Reparación, pintura, otros', null, 'Cotización según el estado del instrumento'],
  ] },
];

/* Devuelve la carta limpia o null si algo no tiene la forma esperada. Lo que
   llega del panel se guarda tal cual sale de aquí, así que es el único
   filtro: precios enteros y positivos, textos recortados. */
function validarTaller(data) {
  if (!Array.isArray(data) || !data.length || data.length > 6) return null;
  const limpio = [];
  for (const g of data) {
    if (!g || typeof g.titulo !== 'string' || !g.titulo.trim()) return null;
    if (!Array.isArray(g.filas) || !g.filas.length || g.filas.length > 12) return null;
    const filas = [];
    for (const f of g.filas) {
      if (!Array.isArray(f) || typeof f[0] !== 'string' || !f[0].trim()) return null;
      const precio = f[1] === null || f[1] === '' || f[1] === undefined ? null : Number(f[1]);
      if (precio !== null && !(Number.isInteger(precio) && precio > 0 && precio <= 100000)) return null;
      const detalle = typeof f[2] === 'string' ? f[2].trim().slice(0, 100) : '';
      filas.push([f[0].trim().slice(0, 80), precio, detalle]);
    }
    limpio.push({ titulo: g.titulo.trim().slice(0, 40), tipos: String(g.tipos || '').trim().slice(0, 80), filas });
  }
  return limpio;
}

async function preciosTaller(env, ctx) {
  try {
    const cacheado = await caches.default.match(CACHE_TALLER);
    if (cacheado) return await cacheado.json();
  } catch { /* sin caché vamos a la base */ }

  let precios = TALLER_POR_DEFECTO;
  try {
    const fila = await env.DB.prepare(
      'SELECT value FROM settings WHERE key = ?').bind(CLAVE_TALLER).first();
    if (fila) precios = validarTaller(JSON.parse(fila.value)) || TALLER_POR_DEFECTO;
  } catch {
    return precios;
  }

  const guardar = caches.default.put(CACHE_TALLER, new Response(JSON.stringify(precios), {
    headers: { 'cache-control': 'max-age=' + BANNER_TTL },
  })).catch(() => {});
  if (ctx) ctx.waitUntil(guardar); else await guardar;
  return precios;
}

async function apiTaller(request, env, ctx) {
  if (request.method === 'GET') {
    return respuestaJson({ precios: await preciosTaller(env, ctx) });
  }
  if (request.method !== 'PUT') {
    return respuestaJson({ error: 'Método no permitido' }, 405);
  }
  if (!await claveDeAdminValida(request.headers.get('X-Admin-Secret'))) {
    return respuestaJson({ error: 'No autorizado' }, 401);
  }

  let precios;
  try {
    precios = validarTaller((await request.json()).precios);
  } catch {
    precios = null;
  }
  if (!precios) return respuestaJson({ error: 'Precios con formato inválido' }, 400);

  try {
    await env.DB.prepare(
      "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) " +
      'ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
    ).bind(CLAVE_TALLER, JSON.stringify(precios)).run();
  } catch (err) {
    return respuestaJson({ error: String(err) }, 500);
  }

  try { await caches.default.delete(CACHE_TALLER); } catch { /* da igual */ }
  return respuestaJson({ ok: true, precios });
}

/* El texto de /taller para quien llega sin JavaScript o el rastreador. */
function tallerBodyHtml(precios) {
  return '<p>Repara tu guitarra con nosotros: calibración, cuerdas y mantenimiento en nuestro taller de San Juan de Miraflores.</p>'
    + precios.map(g => '<h2>' + escapeHtml(g.titulo) + (g.tipos ? ' (' + escapeHtml(g.tipos.toLowerCase()) + ')' : '') + '</h2><ul>'
      + g.filas.map(([servicio, precio, detalle]) => '<li>' + escapeHtml(servicio) + ': ' + (precio ? 'S/ ' + precio : 'a tratar')
        + (detalle ? ' (' + escapeHtml(detalle) + ')' : '') + '</li>').join('')
      + '</ul>').join('')
    + '<p>Precios referenciales en soles. Reparaciones y pintura se cotizan según el estado del instrumento.</p>';
}

/* ======================== METADATOS DEL <head> ======================== */

function breadcrumbSchema(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem', position: i + 1, name: t.name, item: SITE_ORIGIN + t.path,
    })),
  };
}

function withContext(schema) {
  return Object.assign({ '@context': 'https://schema.org' }, schema);
}

function homeMeta() {
  return { title: SITE_TITLE, description: DEFAULT_META_DESCRIPTION, path: '/' };
}

function shopMeta() {
  return {
    title: 'Catálogo de Instrumentos Musicales | Chipao Music',
    description: DEFAULT_META_DESCRIPTION,
    path: '/tienda',
    schema: withContext(breadcrumbSchema([
      { name: 'Inicio', path: '/' },
      { name: 'Catálogo', path: '/tienda' },
    ])),
  };
}

/* Precio más bajo con stock, para las descripciones. Sin catKey mira todo el
   catálogo. Devuelve 0 si no hay nada que vender, y quien llama lo omite. */
function minPrice(products, catKey, soloOfertas) {
  const hay = (products || []).filter(p =>
    (p.stock || 0) > 0
    && (!catKey || productInCat(p, catKey))
    && (!soloOfertas || isOffer(p)));
  return hay.length ? Math.min(...hay.map(p => p.price)) : 0;
}

function offersMeta(products) {
  const desde = minPrice(products, null, true);
  return {
    /* "Económicos" en el título y "baratos" en la descripción: el título es lo
       que define la marca en los resultados, la descripción pesa menos. */
    title: 'Instrumentos Musicales Económicos en Lima | Chipao Music',
    description: `Instrumentos musicales baratos en Lima${desde ? `, desde S/ ${desde}` : ''}: guitarras, flautas, panderetas y accesorios con descuento. Tienda en San Juan de Miraflores.`,
    path: '/ofertas',
    schema: withContext(breadcrumbSchema([
      { name: 'Inicio', path: '/' },
      { name: 'Ofertas', path: '/ofertas' },
    ])),
  };
}

/* El nombre con el que la categoría sale en <title> y <h1>. "Para Colegio en
   Lima" no contiene la frase que la gente busca ("instrumentos para colegio"),
   así que las categorías cuyo nombre de menú no funciona como término de
   búsqueda llevan un "seo" propio. El nombre corto sigue mandando en el menú. */
function catSeoLabel(cat) {
  return cat.seo || cat.label;
}

function categoryMeta(cat, products) {
  const subsList = cat.subs.map(s => s.label).join(', ');
  /* La descripción propia gana; la plantilla queda de respaldo para una
     categoría nueva a la que todavía no le hayan escrito la suya. */
  const description = cat.desc || (subsList
    ? `Compra ${cat.label.toLowerCase()} en Lima y todo el Perú: ${subsList}. Tienda en San Juan de Miraflores con envíos a todo el país.`
    : `Compra ${cat.label.toLowerCase()} en Lima y todo el Perú. Tienda en San Juan de Miraflores con envíos a todo el país.`);
  const path = `/categoria/${cat.key}`;
  /* El precio de entrada va DELANTE de la descripción, no detrás: Google corta
     por el final, y ahí es donde está el texto de tienda y envíos que se
     repite en todas las páginas. Sale del catálogo en cada visita, así que no
     se queda viejo si cambian los precios. */
  const desde = minPrice(products, cat.key);
  return {
    title: `${catSeoLabel(cat)} en Lima | Chipao Music`,
    description: desde ? `Desde S/ ${desde}. ${description}` : description,
    path,
    schema: withContext(breadcrumbSchema([
      { name: 'Inicio', path: '/' },
      { name: cat.label, path },
    ])),
  };
}

/* La página de una subcategoría. Existe sobre todo para los anuncios: quien
   busca "ukelele concierto" tiene que aterrizar entre ukeleles, no en una
   parrilla que empieza por guitarras. */
function subcategoryMeta(cat, sub, products) {
  const path = `/categoria/${cat.key}/${subSlug(sub)}`;
  const suyos = (products || []).filter(p => productInCat(p, cat.key) && productInSub(p, sub));
  const conStock = suyos.filter(p => (p.stock || 0) > 0);
  const desde = conStock.length ? Math.min(...conStock.map(p => p.price)) : 0;
  /* Mismo orden que en las categorías: el precio delante, porque Google corta
     la descripción por el final. */
  const description = `${sub.label} en Lima${desde ? `, desde S/ ${desde}` : ''}. ${cat.label} en Chipao Music: tienda en San Juan de Miraflores con envíos a todo el Perú.`;
  return {
    title: `${sub.label} en Lima | Chipao Music`,
    description,
    path,
    schema: withContext(breadcrumbSchema([
      { name: 'Inicio', path: '/' },
      { name: cat.label, path: `/categoria/${cat.key}` },
      { name: sub.label, path },
    ])),
  };
}

function productMeta(p) {
  const path = productPath(p);
  const cat = CATEGORIES.find(c => c.key === p.cat);
  const priceLine = `S/ ${p.price}${p.old ? ` (antes S/ ${p.old})` : ''}`;
  const trail = [{ name: 'Inicio', path: '/' }];
  if (cat) trail.push({ name: cat.label, path: `/categoria/${cat.key}` });
  trail.push({ name: p.name, path });

  return {
    title: `${p.name} | Chipao Music`,
    description: `${p.name} — ${priceLine}. Tienda de instrumentos musicales en San Juan de Miraflores, Lima, con envíos a todo el Perú.`,
    image: (p.images && p.images[0]) || DEFAULT_OG_IMAGE,
    type: 'product',
    path,
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Product',
          name: p.name,
          image: (p.images && p.images.length) ? p.images : [DEFAULT_OG_IMAGE],
          description: p.description || `${p.name} en Chipao Music, tienda de instrumentos musicales en San Juan de Miraflores, Lima.`,
          sku: String(p.id),
          category: cat ? cat.label : 'Instrumentos musicales',
          offers: {
            '@type': 'Offer',
            url: SITE_ORIGIN + path,
            priceCurrency: 'PEN',
            price: p.price,
            availability: (p.stock || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
            /* Google avisa de "falta priceValidUntil" si la oferta no dice
               hasta cuándo vale el precio. Damos 90 días desde hoy: como la
               página se genera en cada visita, la fecha nunca queda vencida. */
            priceValidUntil: new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10),
            seller: { '@id': SITE_ORIGIN + '/#tienda' },
          },
        },
        breadcrumbSchema(trail),
      ],
    },
  };
}

/* Productos retirados que Google sigue visitando, con el sitio más parecido
   que sí existe. Un 301 se lleva a quien llega desde Google o desde un enlace
   viejo de WhatsApp a algo que puede comprar, en vez de a un 404, y le pasa a
   esa página el crédito que tuviera la vieja.

   Van a la categoría y no a un producto suelto: un teclado concreto puede
   agotarse mañana y volveríamos a tener el mismo problema, y además así el
   visitante compara. Solo se aplican cuando el id NO está en el catálogo, así
   que si algún día se vuelve a dar de alta ese producto, el redirect se
   aparta solo. */
const PRODUCTOS_RETIRADOS = {
  '14': '/categoria/teclados',          // órgano Casio CT-S200
  '43': '/categoria/cuerda/guitarras-acusticas',  // guitarra acústica Fever
};

/* Subcategorías que cambiaron de URL. "Guitarras" se partió en acústicas y
   eléctricas (2026-09-24); la dirección vieja va a las acústicas, que son la
   mayoría de lo que había y lo que busca quien escribe "guitarra" a secas. */
const RUTAS_MOVIDAS = {
  '/categoria/cuerda/guitarras': '/categoria/cuerda/guitarras-acusticas',
};

/* <head> de un producto que ya no está en el catálogo. Va con noindex y la
   respuesta sale con estado 404, para que Google entienda que la página se
   retiró en vez de tomarla por una copia de la home. */
function notFoundMeta(pathname) {
  return {
    title: 'Producto no disponible | Chipao Music',
    description: 'Este producto ya no está en el catálogo. Mira los instrumentos disponibles ahora en Chipao Music.',
    path: pathname,
  };
}

/* Pantallas de sesión del rediseño móvil: buscar, carrito, pago y la
   confirmación del pedido. Tienen URL propia para que el botón atrás del
   teléfono funcione y para poder compartir el enlace, pero no son contenido
   que Google deba listar: lo que muestran depende de quién las abre y está
   vacío para un rastreador.

   Van con noindex,follow — que siga los enlaces que contienen, que no las
   indexe — y NO entran en el sitemap (ver sitemapXml, que lleva su propia
   lista fija). Aun así les damos título y descripción propios, porque es lo
   que se ve en la pestaña del navegador y al compartir el enlace. */
const RUTAS_DE_SESION = {
  '/buscar': {
    title: 'Buscar instrumentos | Chipao Music',
    description: 'Busca guitarras, ukeleles, cajones, teclados y accesorios en el catálogo de Chipao Music.',
  },
  '/carrito': {
    title: 'Tu carrito | Chipao Music',
    description: 'Revisa los instrumentos que agregaste antes de cerrar tu pedido.',
  },
  '/checkout': {
    title: 'Finalizar pedido | Chipao Music',
    description: 'Elige cómo recibes tu pedido y con qué medio de pago quieres cerrarlo.',
  },
};

/* Páginas de ayuda: texto fijo, con URL propia y sí indexables — al revés que
   las de sesión de arriba. "Cambios y devoluciones" era un modal del pie, sin
   dirección que dar ni que indexar, y es justo lo que alguien se pregunta
   ANTES de comprar un instrumento por internet.

   El texto está copiado de POLICIES en index.html, y las dos copias tienen que
   decir lo mismo, igual que pasa con CATEGORIES. Aquí se sirve entero dentro
   de <main id="app">: quien llega sin JavaScript —o el rastreador— lee la
   política completa, no una pantalla de carga. */
const PAGINAS_DE_AYUDA = {
  '/cambios-y-devoluciones': {
    title: 'Cambios y devoluciones | Chipao Music',
    h1: 'Cambios y devoluciones',
    description: 'Tienes 7 días para cambiar o devolver lo que compraste en Chipao Music, con su embalaje y sin señales de uso. Cómo solicitarlo y en cuánto tiempo te devolvemos el dinero.',
    body: [
      '<p>Tienes hasta 7 días calendario desde la recepción del producto para solicitar un cambio o devolución, siempre que el producto conserve su embalaje original, accesorios y no presente signos de uso.</p>',
      '<h2>¿Cómo solicitarlo?</h2>',
      '<ul><li>Escríbenos indicando tu número de pedido y motivo del cambio.</li><li>Coordinamos la recolección o el envío del producto.</li><li>Una vez verificado, procesamos el cambio o la devolución del dinero en un máximo de 10 días hábiles.</li></ul>',
      '<p>Los instrumentos de viento con boquilla usada y productos personalizados no aplican para devolución por higiene, salvo defecto de fábrica.</p>',
    ].join(''),
  },
  /* No es una política, pero funciona igual: una página de texto con su
     URL. El cuerpo lo arma tallerBodyHtml con los precios de la base. */
  '/taller': {
    title: 'Taller de reparación de guitarras y bajos en Lima | Chipao Music',
    h1: 'Taller de reparación',
    description: 'Calibración, cuerdas nuevas y mantenimiento de guitarras y bajos en San Juan de Miraflores. Mira los precios del taller y agenda por WhatsApp.',
    body: tallerBodyHtml,
  },
};

function ayudaMeta(pathname) {
  const pg = PAGINAS_DE_AYUDA[pathname];
  if (!pg) return null;
  return {
    title: pg.title,
    description: pg.description,
    path: pathname,
    schema: withContext(breadcrumbSchema([
      { name: 'Inicio', path: '/' },
      { name: pg.h1, path: pathname },
    ])),
  };
}

function ayudaBody(pathname, taller) {
  const pg = PAGINAS_DE_AYUDA[pathname];
  const cuerpo = typeof pg.body === 'function' ? pg.body(taller || TALLER_POR_DEFECTO) : pg.body;
  return '<nav aria-label="Ruta"><a href="/">Inicio</a> &rsaquo; ' + escapeHtml(pg.h1) + '</nav>'
    + '<h1>' + escapeHtml(pg.h1) + '</h1>'
    + cuerpo
    + '<p><a href="/tienda">Ver todo el catálogo</a></p>';
}

/* Número de pedido tal como lo arma el sitio: CH- y cuatro dígitos. */
const RUTA_PEDIDO = /^\/pedido\/[A-Za-z0-9-]{1,24}$/;

function sesionMeta(pathname) {
  if (RUTAS_DE_SESION[pathname]) {
    return Object.assign({ path: pathname }, RUTAS_DE_SESION[pathname]);
  }
  if (RUTA_PEDIDO.test(pathname)) {
    return {
      title: 'Pedido enviado | Chipao Music',
      description: 'Tu pedido llegó al WhatsApp de la tienda. Te escribimos para confirmar stock y coordinar la entrega.',
      path: pathname,
    };
  }
  return null;
}

/* Reconoce la ruta pedida. Devuelve null si no existe ninguna página ahí,
   para marcarla noindex en vez de dejar que Google la tome por una copia
   de la home. `products` puede venir vacío si la API no respondió. */
function routeFor(pathname, products) {
  if (pathname === '/') return { meta: homeMeta() };
  if (pathname === '/tienda') return { meta: shopMeta() };
  if (pathname === '/ofertas') return { meta: offersMeta(products) };

  const ayuda = ayudaMeta(pathname);
  if (ayuda) return { meta: ayuda, ayuda: pathname };

  const sesion = sesionMeta(pathname);
  if (sesion) return { meta: sesion, noIndex: true };

  const catMatch = pathname.match(/^\/categoria\/([a-z]+)$/);
  if (catMatch) {
    const cat = CATEGORIES.find(c => c.key === catMatch[1]);
    return cat ? { meta: categoryMeta(cat, products), cat } : null;
  }

  const subMatch = pathname.match(/^\/categoria\/([a-z]+)\/([a-z0-9-]+)$/);
  if (subMatch) {
    const cat = CATEGORIES.find(c => c.key === subMatch[1]);
    const sub = cat ? findSub(cat, subMatch[2]) : null;
    return sub ? { meta: subcategoryMeta(cat, sub, products), cat, sub } : null;
  }

  const productMatch = pathname.match(/^\/producto\/(\d+)/);
  if (productMatch) {
    const p = products.find(x => String(x.id) === productMatch[1]);
    if (p) return { meta: productMeta(p), product: p };
    /* Sin datos de la API no sabemos si el producto existe: dejamos el
       <head> por defecto en vez de dar un 404 por error. */
    if (!products.length) return { meta: homeMeta() };
    return { meta: notFoundMeta(pathname), noIndex: true, noEncontrado: true };
  }

  return null;
}

/* Lista de productos en formato schema.org. En una página de categoría o del
   catálogo, le dice a Google qué productos hay y en qué orden, en vez de
   dejarle adivinarlo de los enlaces. */
function itemListSchema(products, nombre) {
  const items = products.slice(0, 30).map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: p.name,
    url: SITE_ORIGIN + productPath(p),
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: nombre,
    numberOfItems: products.length,
    itemListElement: items,
  };
}

/* Texto propio de la pagina de ofertas. Mismo motivo que el `intro` de
   cada categoria: ver la nota de CATEGORIES. */
const INTRO_OFERTAS = "Instrumentos y accesorios con descuento sobre el precio de tienda. El precio tachado es el de antes y el rebajado es el que pagas: no hay cupón que meter ni nada que activar en el carrito.";

/* ==================== CONTENIDO DE <main id="app"> ====================

   Esto es lo que ve Google (y cualquiera con JavaScript desactivado) antes
   de que arranque la app. El JS lo reemplaza en cuanto carga, así que es
   HTML simple a propósito: sin clases ni estilos, igual que el bloque de
   portada que ya venía escrito a mano en index.html.
   ==================================================================== */

function priceText(p) {
  return isOffer(p) ? `S/ ${p.price} (antes S/ ${p.old})` : `S/ ${p.price}`;
}

function productListHtml(products) {
  const items = products.map(p =>
    `<li><a href="${productPath(p)}">${escapeHtml(p.name)}</a> — ${escapeHtml(priceText(p))}</li>`
  ).join('');
  return `<ul>${items}</ul>`;
}

function listBody(heading, intro, products, vacio) {
  const lista = products.length
    ? `<p>${products.length} ${products.length === 1 ? 'producto' : 'productos'}.</p>${productListHtml(products)}`
    : `<p>${vacio}</p>`;
  return `<h1>${escapeHtml(heading)}</h1><p>${escapeHtml(intro)}</p>${lista}`;
}

function productBody(p) {
  const cat = CATEGORIES.find(c => c.key === p.cat);
  const partes = [];

  const migas = cat
    ? `<a href="/">Inicio</a> &rsaquo; <a href="/categoria/${cat.key}">${escapeHtml(cat.label)}</a>`
    : '<a href="/">Inicio</a>';
  partes.push(`<nav aria-label="Ruta">${migas}</nav>`);

  partes.push(`<h1>${escapeHtml(p.name)}</h1>`);
  partes.push(`<p>${escapeHtml(priceText(p))}</p>`);
  partes.push(`<p>${(p.stock || 0) > 0 ? 'Disponible en tienda y con envío a todo el Perú.' : 'Temporalmente agotado.'}</p>`);

  if (p.images && p.images[0]) {
    partes.push(`<img src="${escapeHtml(fotoUrl(p.images[0], ANCHO_FICHA))}" alt="${escapeHtml(p.name)}" style="max-width:100%;height:auto;">`);
  }

  if (p.description) {
    for (const parrafo of String(p.description).split(/\n+/)) {
      if (parrafo.trim()) partes.push(`<p>${escapeHtml(parrafo.trim())}</p>`);
    }
  }

  if (cat) {
    partes.push(`<p><a href="/categoria/${cat.key}">Ver más ${escapeHtml(cat.label.toLowerCase())}</a></p>`);
  }
  partes.push('<p><a href="/tienda">Ver todo el catálogo</a></p>');

  return partes.join('');
}

function notFoundBody() {
  return '<h1>Producto no disponible</h1>'
    + '<p>Este producto ya no está en el catálogo. Puede que lo hayamos retirado o que la dirección esté mal escrita.</p>'
    + '<p><a href="/tienda">Ver todo el catálogo</a></p>'
    + '<p><a href="/">Ir al inicio</a></p>';
}

/* Devuelve el HTML del cuerpo, o null para dejar el que ya trae index.html
   (es el caso de la home, cuyo bloque escrito a mano ya es correcto). */
function bodyFor(route, products, taller) {
  if (!route) return null;

  if (route.noEncontrado) return notFoundBody();

  if (route.ayuda) return ayudaBody(route.ayuda, taller);

  if (route.product) return productBody(route.product);

  if (route.cat) {
    const suyos = products.filter(p => productInCat(p, route.cat.key)
      && (!route.sub || productInSub(p, route.sub)));
    return listBody(
      route.sub ? `${route.sub.label} en Lima` : `${catSeoLabel(route.cat)} en Lima`,
      /* El `intro` está escrito para la categoría entera y hablaría de
         guitarras en la página de ukeleles: en una subcategoría manda su
         propia descripción. */
      route.sub ? route.meta.description : (route.cat.intro || route.meta.description),
      suyos,
      'Estamos actualizando esta categoría, disculpa las molestias.'
    );
  }

  if (route.meta.path === '/tienda') {
    return listBody('Catálogo de instrumentos musicales', DEFAULT_META_DESCRIPTION, products,
      'Estamos actualizando el catálogo.');
  }

  if (route.meta.path === '/ofertas') {
    return listBody('Ofertas en instrumentos musicales', INTRO_OFERTAS, products.filter(isOffer),
      'Ahora mismo no hay ofertas activas. Vuelve pronto.');
  }

  return null;
}

/* ============================= SITEMAP =============================

   Se genera desde la API en cada petición, así que un producto nuevo
   aparece solo, sin tener que regenerar ningún archivo a mano.
   ================================================================= */

function sitemapXml(products) {
  const rutas = ['/', '/tienda', '/ofertas', ...Object.keys(PAGINAS_DE_AYUDA)];
  for (const c of CATEGORIES) {
    rutas.push(`/categoria/${c.key}`);
    /* Una subcategoría vacía es una página delgada: solo entra en el sitemap
       si de verdad tiene productos con stock. */
    for (const s of subsNavegables(c)) {
      const hay = products.some(p => (p.stock || 0) > 0 && productInCat(p, c.key) && productInSub(p, s));
      if (hay) rutas.push(`/categoria/${c.key}/${subSlug(s)}`);
    }
  }

  const fijas = rutas.map(r => `  <url><loc>${escapeHtml(SITE_ORIGIN + r)}</loc></url>`);

  /* Cada producto declara además sus fotos, para que puedan salir en la
     búsqueda de imágenes de Google — que en una tienda trae visitas. */
  const fichas = products.map(p => {
    const imgs = (p.images || []).slice(0, 5).map(src =>
      `\n    <image:image><image:loc>${escapeHtml(src)}</image:loc><image:title>${escapeHtml(p.name)}</image:title></image:image>`
    ).join('');
    return `  <url><loc>${escapeHtml(SITE_ORIGIN + productPath(p))}</loc>${imgs}\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${fijas.concat(fichas).join('\n')}\n</urlset>\n`;
}

/* ============================ LAS FOTOS ============================== */

/* Las fotos viven en R2 y la base de datos guarda su URL pública de r2.dev.
   Servirlas desde ahí le costaba al visitante un dominio entero de más
   (DNS+TCP+TLS en serie, 200-400ms en un 4G) justo para el elemento que marca
   el LCP, y encima r2.dev no manda ningún Cache-Control: quien volvía se
   rebajaba las mismas fotos. Ahora las sirve este Worker desde /img/, en el
   mismo origen que la página y con caché de verdad.

   La URL solo se traduce al pintar. Los datos del catálogo se quedan con la
   URL de r2.dev tal cual, porque el formulario de administración se llena con
   ellos y los vuelve a guardar. */
const R2_PUBLICO = 'https://pub-52acb879922b427f958ddbe0c729bbfc.r2.dev/';

/* Igual que en index.html: además de traer la foto a nuestro dominio, le
   pedimos a Cloudflare que la reescale y la sirva en AVIF o WebP según lo que
   acepte quien la pide. Ver el comentario largo de index.html para los anchos
   y lo que cuesta cada uno. */
const ANCHO_FICHA = 800;

function fotoUrl(u, ancho) {
  const ruta = (typeof u === 'string' && u.startsWith(R2_PUBLICO))
    ? '/img/' + u.slice(R2_PUBLICO.length)
    : u;
  if (!ancho || typeof ruta !== 'string' || !ruta.startsWith('/img/')) return ruta;
  return `/cdn-cgi/image/width=${ancho},format=auto,onerror=redirect${ruta}`;
}

const TIPO_POR_EXTENSION = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  gif: 'image/gif', avif: 'image/avif', svg: 'image/svg+xml',
};

async function sirveFoto(request, env, ctx) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Método no permitido', { status: 405 });
  }
  const url = new URL(request.url);
  let clave;
  try {
    clave = decodeURIComponent(url.pathname.slice('/img/'.length));
  } catch {
    return new Response('Nombre de foto inválido', { status: 400 });
  }
  if (!clave) return new Response('No encontrada', { status: 404 });

  const cache = caches.default;
  const guardada = await cache.match(request);
  if (guardada) return guardada;

  const objeto = await env.FOTOS.get(clave);
  if (!objeto) return new Response('No encontrada', { status: 404 });

  const cabeceras = new Headers();
  objeto.writeHttpMetadata(cabeceras);
  if (!cabeceras.get('content-type')) {
    const ext = clave.split('.').pop().toLowerCase();
    cabeceras.set('content-type', TIPO_POR_EXTENSION[ext] || 'application/octet-stream');
  }
  cabeceras.set('etag', objeto.httpEtag);
  /* Sin esto la respuesta sale troceada y el navegador no sabe cuánto pesa la
     foto hasta que termina de bajarla. */
  cabeceras.set('content-length', String(objeto.size));
  /* Un día en el navegador, y un mes sirviendo la copia vieja mientras se
     refresca por detrás. Ni "immutable" ni un año: los nombres no llevan hash,
     así que si desde el panel reemplazan una foto por otra con el mismo
     nombre, con un año de caché no la vería nadie. */
  cabeceras.set('cache-control', 'public, max-age=86400, stale-while-revalidate=2592000');

  const respuesta = new Response(objeto.body, { headers: cabeceras });
  ctx.waitUntil(cache.put(request, respuesta.clone()).catch(() => {}));
  return respuesta;
}

/* ========================= REESCRITURA DEL HTML ====================== */

class SetAttr {
  constructor(attr, value) { this.attr = attr; this.value = value; }
  element(el) { el.setAttribute(this.attr, this.value); }
}

class SetText {
  constructor(value) { this.value = value; }
  element(el) { el.setInnerContent(this.value); }
}

class SetHtml {
  constructor(html) { this.html = html; }
  element(el) { el.setInnerContent(this.html, { html: true }); }
}

/* Inyecta el JSON-LD y, en rutas inexistentes, el noindex. El id "pageSchema"
   es el mismo que usa setPageSchema() en index.html, así que cuando arranca
   el JS reutiliza este bloque en vez de duplicarlo. */
class HeadExtras {
  constructor(schema, noindex, products, bannerPromo, taller) {
    this.schema = schema;
    this.noindex = noindex;
    this.products = products;
    this.bannerPromo = bannerPromo;
    this.taller = taller;
  }
  element(el) {
    if (this.noindex) {
      el.append('<meta name="robots" content="noindex,follow">', { html: true });
    }
    if (this.schema) {
      const json = JSON.stringify(this.schema).replace(/</g, LT_ESCAPE);
      el.append('<script type="application/ld+json" id="pageSchema">' + json + '</scr' + 'ipt>', { html: true });
    }
    /* El catálogo, ya listo, dentro del propio HTML. Antes el navegador tenía
       que pedírselo a la API en otro dominio DESPUÉS de parsear la página, y
       hasta que no llegaba no había nada que pintar: FCP y LCP caían en el
       mismo milisegundo porque la pantalla seguía en blanco hasta entonces.
       Sale del caché del borde (5 min, en fetchProducts), así que no encarece
       esta respuesta. Si viene vacío no ponemos nada y el cliente cae a la
       API: mejor el viaje extra que pintar una tienda vacía. */
    if (this.products && this.products.length) {
      const catalogo = JSON.stringify(this.products).replace(/</g, LT_ESCAPE);
      el.append('<script type="application/json" id="productos-iniciales">' + catalogo + '</scr' + 'ipt>', { html: true });
    }
    /* El interruptor de la barra roja de ofertas, que se maneja desde el
       panel de productos. Va aquí y no en una llamada aparte para que el
       cliente sepa a qué atenerse antes de la primera pintada: pedido por
       separado, la barra se vería aparecer o desaparecer a medio camino. */
    el.append('<script type="application/json" id="banner-promo">{"activo":'
      + (this.bannerPromo === false ? 'false' : 'true') + '}</scr' + 'ipt>', { html: true });
    /* Los precios del taller, que también se editan desde el panel. */
    if (this.taller) {
      el.append('<script type="application/json" id="taller-precios">'
        + JSON.stringify(this.taller).replace(/</g, LT_ESCAPE) + '</scr' + 'ipt>', { html: true });
    }
  }
}

function rewrite(response, route, body, pathname, products, bannerPromo, taller) {
  const noindex = !route || Boolean(route.noIndex);
  const m = route ? route.meta : homeMeta();
  const url = SITE_ORIGIN + (noindex ? pathname : m.path);
  const image = m.image || DEFAULT_OG_IMAGE;

  const rewriter = new HTMLRewriter()
    .on('title', new SetText(m.title))
    .on('meta[name="description"]', new SetAttr('content', m.description))
    .on('meta[property="og:title"]', new SetAttr('content', m.title))
    .on('meta[property="og:description"]', new SetAttr('content', m.description))
    .on('meta[property="og:url"]', new SetAttr('content', url))
    .on('meta[property="og:image"]', new SetAttr('content', image))
    .on('meta[property="og:type"]', new SetAttr('content', m.type || 'website'))
    .on('meta[name="twitter:title"]', new SetAttr('content', m.title))
    .on('meta[name="twitter:description"]', new SetAttr('content', m.description))
    .on('meta[name="twitter:image"]', new SetAttr('content', image))
    .on('link[rel="canonical"]', new SetAttr('href', url))
    .on('head', new HeadExtras(m.schema, noindex, products, bannerPromo, taller));

  if (body) rewriter.on('main#app', new SetHtml(body));

  return rewriter.transform(response);
}

/* Añade el ItemList al esquema de la ruta, junto a las migas de pan que ya
   lleva. Solo en las rutas que enseñan una lista y solo si hay productos. */
function agregaListaDeProductos(route, products) {
  if (!route || !products.length) return;
  let lista = null;
  if (route.cat) {
    lista = itemListSchema(
      products.filter(p => productInCat(p, route.cat.key)
        && (!route.sub || productInSub(p, route.sub))),
      route.sub ? route.sub.label : route.cat.label);
  } else if (route.meta.path === '/tienda') {
    lista = itemListSchema(products, 'Catálogo de instrumentos musicales');
  } else if (route.meta.path === '/ofertas') {
    lista = itemListSchema(products.filter(isOffer), 'Ofertas');
  }
  if (!lista || !lista.numberOfItems) return;
  const previo = route.meta.schema;
  route.meta = Object.assign({}, route.meta, {
    schema: { '@context': 'https://schema.org', '@graph': [previo, lista] },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/sitemap.xml') {
      const products = await fetchProducts();
      /* Sin catálogo preferimos que Google reintente más tarde antes que
         darle una lista incompleta que le haga olvidar productos. */
      if (!products.length) {
        return new Response('Catálogo no disponible, reintenta más tarde.', { status: 503 });
      }
      return new Response(sitemapXml(products), {
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'cache-control': 'public, max-age=3600',
        },
      });
    }

    /* El interruptor del banner de promoción: lo lee cualquiera, lo cambia
       solo el panel con la clave de administrador. */
    if (url.pathname === '/api/banner-promo') return apiBanner(request, env, ctx);
    if (url.pathname === '/api/taller') return apiTaller(request, env, ctx);

    if (url.pathname.startsWith('/img/')) return sirveFoto(request, env, ctx);

    const response = await env.ASSETS.fetch(request);

    /* Solo tocamos el HTML del SPA. Imágenes, robots.txt y la página del
       sorteo (/testeo) salen tal cual. */
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html')) return response;
    if (url.pathname.startsWith('/testeo')) return response;

    /* Antes solo lo pedían las rutas que pintan listas. Ahora lo pide todo, la
       home incluida, porque el catálogo va incrustado en el HTML de cualquier
       ruta (ver HeadExtras) y así el navegador no tiene que ir a buscarlo a
       otro dominio antes de pintar. Viene del caché del borde. */
    /* Las dos cosas que se incrustan en el HTML se piden a la vez -el
       catálogo a la API, el interruptor del banner a la base-: en fila una
       detrás de otra sumaban sus dos esperas al TTFB. */
    const [products, bannerPromo, taller] = await Promise.all([
      fetchProducts(),
      bannerActivo(env, ctx),
      preciosTaller(env, ctx),
    ]);
    const route = routeFor(url.pathname, products);

    /* Una ficha responde a CUALQUIER texto después del id: /producto/2-loquesea
       daba 200 con el contenido de la guitarra. Son URLs duplicadas infinitas
       del mismo producto, y de ahí salen las que Google rastrea y luego no
       indexa. La etiqueta canónica ya apuntaba al bueno, pero un 301 es más
       claro y le ahorra el viaje.

       Importa desde que los nombres se corrigen: al renombrar un producto
       cambia su slug, así que la dirección vieja sigue viva y compitiendo con
       la nueva. Aquí se consolidan las dos en una. */
    if (route && route.product) {
      const canonico = productPath(route.product);
      if (url.pathname !== canonico) {
        return Response.redirect(SITE_ORIGIN + canonico + url.search, 301);
      }
    }
    agregaListaDeProductos(route, products);
    const salida = rewrite(response, route, bodyFor(route, products, taller), url.pathname, products, bannerPromo, taller);

    /* 404 de verdad para lo que no existe: un producto retirado del catálogo,
       una categoría inventada o una ruta que no es ninguna pantalla (route en
       null). Antes salían con estado 200 y Google las trata como "soft 404":
       basura indexable que diluye el sitio. El cuerpo sigue siendo el del
       sitio, así que el visitante ve la tienda igual en cuanto carga el JS; el
       estado es solo para los buscadores.

       Todas las pantallas reales tienen ruta aquí -/, /tienda, /ofertas,
       /buscar, /carrito, /checkout, /pedido/<id>, /categoria/<key>,
       /producto/<id>- y las de PAGINAS_DE_AYUDA-, y /testeo sale antes sin
       pasar por aquí, así que no hay nada legítimo que pueda caer en este
       404. */
    if (!route || route.noEncontrado) {
      /* Salvo que sea uno de los retirados a mano, que se manda a su sitio. */
      const retirado = url.pathname.match(/^\/producto\/(\d+)/);
      const destino = retirado && PRODUCTOS_RETIRADOS[retirado[1]];
      if (destino) return Response.redirect(SITE_ORIGIN + destino, 301);
      const movida = RUTAS_MOVIDAS[url.pathname];
      if (movida) return Response.redirect(SITE_ORIGIN + movida + url.search, 301);
      return new Response(salida.body, { status: 404, headers: salida.headers });
    }
    return salida;
  },
};
