/* ======================================================================
   Worker de SEO para chipaomusic.com

   El sitio es una sola página (index.html) que Cloudflare devuelve para
   TODAS las rutas. Sin este Worker, Google recibe el mismo <head> para la
   home, el catálogo, cada categoría y cada producto: el mismo <title>, la
   misma descripción y, lo más grave, un <link rel="canonical"> apuntando
   siempre a la home, que le dice a Google "esta página es una copia".

   Este Worker intercepta el HTML antes de enviarlo y reescribe el <head>
   según la URL pedida, con los mismos textos que setPageMeta() pone del
   lado del cliente en index.html. Así Google ve los datos correctos sin
   depender de que ejecute el JavaScript, y las vistas previas de WhatsApp,
   Facebook y X funcionan por categoría y por producto.
   ====================================================================== */

const SITE_ORIGIN = 'https://chipaomusic.com';
const PRODUCTS_API_URL = 'https://chipao-productos-api.nishistore.workers.dev';
const DEFAULT_OG_IMAGE = 'https://pub-52acb879922b427f958ddbe0c729bbfc.r2.dev/og-chipao-music.jpg';

const SITE_TITLE = 'Instrumentos Musicales en Lima | Chipao Music';
const DEFAULT_META_DESCRIPTION = 'Tienda de instrumentos musicales en San Juan de Miraflores, Lima. Guitarras, teclados, percusión, viento y accesorios. Envíos a todo el Perú y recojo en tienda.';

/* Copia de las categorías de index.html. Si agregas una categoría allá,
   agrégala también aquí para que su página tenga título propio. */
const CATEGORIES = [
  { key: 'cuerda', label: 'Instrumentos de Cuerda', subs: ['Guitarras', 'Violines', 'Ukeleles', 'Charangos'] },
  { key: 'teclados', label: 'Teclados', subs: [] },
  { key: 'percusion', label: 'Percusión', subs: ['Tambores', 'Bombos', 'Tarolas', 'Cajones', 'Metalófono'] },
  { key: 'viento', label: 'Viento', subs: ['Flautas', 'Melódicas', 'Quenas', 'Zampoñas'] },
  { key: 'audio', label: 'Micrófono y Audio', subs: ['Micrófonos', 'Interfaces'] },
  { key: 'colegio', label: 'Para Colegio', subs: [] },
  { key: 'accesorios', label: 'Accesorios', subs: ['Cuerdas (Acústica/Clásica)', 'Cuerdas (Eléctrica)', 'Capotrastes', 'Púas y pines', 'Afinadores y metrónomos', 'Atriles y parantes', 'Baquetas y parches', 'Cañas y boquillas'] },
];

/* Mismo slug que usa el sitio para armar /producto/<id>-<slug>.
   El rango ̀-ͯ son las tildes que NFD separa de su letra. */
function slugify(str) {
  return String(str).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/* Pide el catálogo a la API. Se cachea en el borde 5 minutos para no
   golpear la API en cada visita. Si falla devolvemos lista vacía: la página
   se sirve igual, solo pierde el <head> específico del producto. */
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

function breadcrumbSchema(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem', position: i + 1, name: t.name, item: SITE_ORIGIN + t.path,
    })),
  };
}

function homeMeta() {
  return { title: SITE_TITLE, description: DEFAULT_META_DESCRIPTION, path: '/' };
}

function categoryMeta(cat) {
  const subsList = cat.subs.join(', ');
  const description = subsList
    ? `Compra ${cat.label.toLowerCase()} en Lima y todo el Perú: ${subsList}. Tienda en San Juan de Miraflores con envíos a todo el país.`
    : `Compra ${cat.label.toLowerCase()} en Lima y todo el Perú. Tienda en San Juan de Miraflores con envíos a todo el país.`;
  const path = `/categoria/${cat.key}`;
  return {
    title: `${cat.label} en Lima | Chipao Music`,
    description,
    path,
    schema: Object.assign({ '@context': 'https://schema.org' }, breadcrumbSchema([
      { name: 'Inicio', path: '/' },
      { name: cat.label, path },
    ])),
  };
}

function productMeta(p) {
  const path = `/producto/${p.id}-${slugify(p.name)}`;
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
            seller: { '@id': SITE_ORIGIN + '/#tienda' },
          },
        },
        breadcrumbSchema(trail),
      ],
    },
  };
}

/* Traduce la ruta pedida al <head> que le corresponde.
   Devuelve null cuando la ruta no existe, para marcarla noindex. */
async function metaForPath(pathname) {
  if (pathname === '/') return homeMeta();

  if (pathname === '/tienda') {
    return {
      title: 'Catálogo de Instrumentos Musicales | Chipao Music',
      description: DEFAULT_META_DESCRIPTION,
      path: '/tienda',
      schema: Object.assign({ '@context': 'https://schema.org' }, breadcrumbSchema([
        { name: 'Inicio', path: '/' },
        { name: 'Catálogo', path: '/tienda' },
      ])),
    };
  }

  if (pathname === '/ofertas') {
    return {
      title: 'Ofertas en Instrumentos Musicales | Chipao Music',
      description: 'Instrumentos musicales en oferta en Lima y todo el Perú: descuentos en guitarras, teclados, percusión y accesorios. Tienda en San Juan de Miraflores.',
      path: '/ofertas',
      schema: Object.assign({ '@context': 'https://schema.org' }, breadcrumbSchema([
        { name: 'Inicio', path: '/' },
        { name: 'Ofertas', path: '/ofertas' },
      ])),
    };
  }

  const catMatch = pathname.match(/^\/categoria\/([a-z]+)$/);
  if (catMatch) {
    const cat = CATEGORIES.find(c => c.key === catMatch[1]);
    return cat ? categoryMeta(cat) : null;
  }

  const productMatch = pathname.match(/^\/producto\/(\d+)/);
  if (productMatch) {
    const products = await fetchProducts();
    const p = products.find(x => String(x.id) === productMatch[1]);
    if (p) return productMeta(p);
    /* Si la API no respondió no sabemos si el producto existe: dejamos el
       <head> por defecto en vez de marcar noindex por error. */
    return products.length ? null : homeMeta();
  }

  return null;
}

class SetAttr {
  constructor(attr, value) { this.attr = attr; this.value = value; }
  element(el) { el.setAttribute(this.attr, this.value); }
}

class SetText {
  constructor(value) { this.value = value; }
  element(el) { el.setInnerContent(this.value); }
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
      const json = JSON.stringify(this.schema).replace(/</g, '\\u003c');
      el.append('<script type="application/ld+json" id="pageSchema">' + json + '</scr' + 'ipt>', { html: true });
    }
  }
}

function rewriteHead(response, meta, pathname) {
  const noindex = !meta;
  const m = meta || homeMeta();
  const url = SITE_ORIGIN + (noindex ? pathname : m.path);
  const image = m.image || DEFAULT_OG_IMAGE;

  return new HTMLRewriter()
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
    .on('head', new HeadExtras(m.schema, noindex))
    .transform(response);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);

    /* Solo tocamos el HTML del SPA. Imágenes, sitemap.xml, robots.txt y la
       página del sorteo (/testeo) salen tal cual. */
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html')) return response;
    if (url.pathname.startsWith('/testeo')) return response;

    const meta = await metaForPath(url.pathname);
    return rewriteHead(response, meta, url.pathname);
  },
};
