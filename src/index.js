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
const CATEGORIES = [
  { key: 'cuerda', label: 'Instrumentos de Cuerda', desc: 'Guitarras acústicas y eléctricas, bajos, violines, ukeleles y charangos en Lima. Tienda en San Juan de Miraflores con envíos a todo el Perú.', subs: ['Guitarras', 'Bajos', 'Violines', 'Ukeleles', 'Charangos'] },
  { key: 'teclados', label: 'Teclados', desc: 'Teclados y pianos digitales para estudiar y para tocar en vivo. Tienda de instrumentos en San Juan de Miraflores, Lima, con envíos a todo el Perú.', subs: [] },
  { key: 'percusion', label: 'Percusión', desc: 'Cajones, bombos, tarolas, tambores, panderetas y kalimbas. Tienda de percusión en San Juan de Miraflores, Lima, con envíos a todo el país.', subs: ['Tambores', 'Bombos', 'Tarolas', 'Cajones', 'Metalófono', 'Panderetas', 'Kalimbas'] },
  { key: 'viento', label: 'Viento', desc: 'Flautas dulces, melódicas, quenas y zampoñas, para el colegio y para tocar en serio. Tienda en San Juan de Miraflores, Lima, con envíos a todo el Perú.', subs: ['Flautas', 'Melódicas', 'Quenas', 'Zampoñas'] },
  { key: 'audio', label: 'Micrófono y Audio', desc: 'Micrófonos, interfaces y amplificadores para grabar y para tocar en vivo. Tienda de audio en San Juan de Miraflores, Lima, con envíos a todo el Perú.', subs: ['Micrófonos', 'Interfaces', 'Amplificadores'] },
  { key: 'colegio', label: 'Para Colegio', desc: 'Instrumentos para la lista del colegio: flautas dulces, melódicas, xilófonos, liras, claves y panderetas. Tienda en Lima con envíos a todo el Perú.', subs: [] },
  { key: 'accesorios', label: 'Accesorios', desc: 'Cuerdas, púas, capotrastes, afinadores, atriles, baquetas y repuestos para tu instrumento. Tienda en San Juan de Miraflores, Lima, con envíos a todo el Perú.', subs: ['Cuerdas (Acústica/Clásica)', 'Cuerdas (Eléctrica)', 'Capotrastes', 'Púas y pines', 'Afinadores y metrónomos', 'Atriles y parantes', 'Baquetas y parches', 'Cañas y boquillas', 'Violín (resina y puentes)', 'Limpieza y repuestos'] },
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

function offersMeta() {
  return {
    title: 'Ofertas en Instrumentos Musicales | Chipao Music',
    description: 'Instrumentos musicales en oferta en Lima y todo el Perú: descuentos en guitarras, teclados, percusión y accesorios. Tienda en San Juan de Miraflores.',
    path: '/ofertas',
    schema: withContext(breadcrumbSchema([
      { name: 'Inicio', path: '/' },
      { name: 'Ofertas', path: '/ofertas' },
    ])),
  };
}

function categoryMeta(cat) {
  const subsList = cat.subs.join(', ');
  /* La descripción propia gana; la plantilla queda de respaldo para una
     categoría nueva a la que todavía no le hayan escrito la suya. */
  const description = cat.desc || (subsList
    ? `Compra ${cat.label.toLowerCase()} en Lima y todo el Perú: ${subsList}. Tienda en San Juan de Miraflores con envíos a todo el país.`
    : `Compra ${cat.label.toLowerCase()} en Lima y todo el Perú. Tienda en San Juan de Miraflores con envíos a todo el país.`);
  const path = `/categoria/${cat.key}`;
  return {
    title: `${cat.label} en Lima | Chipao Music`,
    description,
    path,
    schema: withContext(breadcrumbSchema([
      { name: 'Inicio', path: '/' },
      { name: cat.label, path },
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
  if (pathname === '/ofertas') return { meta: offersMeta() };

  const sesion = sesionMeta(pathname);
  if (sesion) return { meta: sesion, noIndex: true };

  const catMatch = pathname.match(/^\/categoria\/([a-z]+)$/);
  if (catMatch) {
    const cat = CATEGORIES.find(c => c.key === catMatch[1]);
    return cat ? { meta: categoryMeta(cat), cat } : null;
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
    partes.push(`<img src="${escapeHtml(p.images[0])}" alt="${escapeHtml(p.name)}" style="max-width:100%;height:auto;">`);
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
function bodyFor(route, products) {
  if (!route) return null;

  if (route.noEncontrado) return notFoundBody();

  if (route.product) return productBody(route.product);

  if (route.cat) {
    const suyos = products.filter(p => productInCat(p, route.cat.key));
    return listBody(
      `${route.cat.label} en Lima`,
      route.meta.description,
      suyos,
      'Estamos actualizando esta categoría, disculpa las molestias.'
    );
  }

  if (route.meta.path === '/tienda') {
    return listBody('Catálogo de instrumentos musicales', DEFAULT_META_DESCRIPTION, products,
      'Estamos actualizando el catálogo.');
  }

  if (route.meta.path === '/ofertas') {
    return listBody('Ofertas', route.meta.description, products.filter(isOffer),
      'Ahora mismo no hay ofertas activas. Vuelve pronto.');
  }

  return null;
}

/* ============================= SITEMAP =============================

   Se genera desde la API en cada petición, así que un producto nuevo
   aparece solo, sin tener que regenerar ningún archivo a mano.
   ================================================================= */

function sitemapXml(products) {
  const rutas = ['/', '/tienda', '/ofertas'];
  for (const c of CATEGORIES) rutas.push(`/categoria/${c.key}`);

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
  constructor(schema, noindex) { this.schema = schema; this.noindex = noindex; }
  element(el) {
    if (this.noindex) {
      el.append('<meta name="robots" content="noindex,follow">', { html: true });
    }
    if (this.schema) {
      const json = JSON.stringify(this.schema).replace(/</g, LT_ESCAPE);
      el.append('<script type="application/ld+json" id="pageSchema">' + json + '</scr' + 'ipt>', { html: true });
    }
  }
}

function rewrite(response, route, body, pathname) {
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
    .on('head', new HeadExtras(m.schema, noindex));

  if (body) rewriter.on('main#app', new SetHtml(body));

  return rewriter.transform(response);
}

/* Añade el ItemList al esquema de la ruta, junto a las migas de pan que ya
   lleva. Solo en las rutas que enseñan una lista y solo si hay productos. */
function agregaListaDeProductos(route, products) {
  if (!route || !products.length) return;
  let lista = null;
  if (route.cat) {
    lista = itemListSchema(products.filter(p => productInCat(p, route.cat.key)), route.cat.label);
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

/* Rutas cuyo contenido depende del catálogo. La home no lo necesita: su
   bloque de portada ya está escrito en index.html. */
function necesitaProductos(pathname) {
  return pathname === '/tienda'
    || pathname === '/ofertas'
    || pathname.startsWith('/categoria/')
    || pathname.startsWith('/producto/');
}

export default {
  async fetch(request, env) {
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

    const response = await env.ASSETS.fetch(request);

    /* Solo tocamos el HTML del SPA. Imágenes, robots.txt y la página del
       sorteo (/testeo) salen tal cual. */
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html')) return response;
    if (url.pathname.startsWith('/testeo')) return response;

    const products = necesitaProductos(url.pathname) ? await fetchProducts() : [];
    const route = routeFor(url.pathname, products);
    agregaListaDeProductos(route, products);
    const salida = rewrite(response, route, bodyFor(route, products), url.pathname);

    /* Un producto que ya no está devuelve 404 de verdad. El cuerpo sigue siendo
       el del sitio, así que el visitante ve la tienda igual en cuanto carga el
       JS; el estado es solo para los buscadores. */
    if (route && route.noEncontrado) {
      return new Response(salida.body, { status: 404, headers: salida.headers });
    }
    return salida;
  },
};
