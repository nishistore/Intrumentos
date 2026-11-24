/* Chipao Music: el código de la tienda (SPA).
   Hasta el 24-11-2026 iba dentro de index.html; ahora es un archivo aparte
   para que el navegador lo guarde. El Worker (src/index.js, versionApp) le
   añade ?v=<etag> en cada HTML y lo sirve con un caché de un año: cambia el
   archivo, cambia el etag, cambia la URL. Se carga al final del <body>, sin
   defer, en el mismo sitio donde estaba el <script> en línea, así que corre
   en el mismo momento que antes. */
/* ======================================================================
   DATA
   ====================================================================== */
/* `intro` es el texto propio que se enseña en la página de cada categoría,
   distinto del `desc`, que va al meta description. Ver la nota larga en
   src/index.js: existe porque Google daba /categoria/cuerda y /ofertas por
   duplicadas entre sí. Las dos copias de CATEGORIES tienen que decir lo
   mismo. */
const CATEGORIES = [
  {key:'cuerda', label:'Instrumentos de Cuerda',
    intro: "Guitarras acústicas, clásicas y eléctricas, ukeleles soprano y de concierto, violines 4/4, bajos y charangos, desde S/ 100. Puedes probarlos en la tienda antes de decidir. Las cuerdas de repuesto, las púas y los capotrastes están en Accesorios.", icon:'string', desc:'Guitarras acústicas y eléctricas, bajos, violines, ukeleles y charangos en Lima. Tienda en San Juan de Miraflores con envíos a todo el Perú.',
    subs:[{key:'guitarras',label:'Guitarras Acústicas'},{key:'guitarrasElectricas',label:'Guitarras Eléctricas'},{key:'electroacusticos',label:'Electroacústicos'},{key:'bajos',label:'Bajos'},{key:'charangos',label:'Andinos'},{key:'violines',label:'Violines'},{key:'ukeleles',label:'Ukeleles'}]},
  {key:'teclados', label:'Teclados',
    intro: "Teclados y pianos digitales para empezar y para tocar en vivo. Ahora mismo no hay stock cargado en la web: escríbenos por WhatsApp y te decimos qué tenemos en tienda y qué podemos conseguir.", icon:'keyboard', desc:'Teclados y pianos digitales para estudiar y para tocar en vivo. Tienda de instrumentos en San Juan de Miraflores, Lima, con envíos a todo el Perú.',
    subs:[]},
  {key:'percusion', label:'Percusión',
    intro: "Bombos andinos de cuero hechos a mano, bombos de banda, tarolas, panderetas, kalimbas de 17 teclas y metalófonos, entre S/ 12 y S/ 250. Las baquetas y los parches de repuesto están en Accesorios.", icon:'drum', desc:'Cajones, bombos, tarolas, tambores, panderetas y kalimbas. Tienda de percusión en San Juan de Miraflores, Lima, con envíos a todo el país.',
    subs:[{key:'tambores',label:'Tambores'},{key:'bombos',label:'Bombos'},{key:'tarolas',label:'Tarolas'},{key:'cajones',label:'Cajones'},{key:'metalofono',label:'Metalófono'},{key:'panderetas',label:'Panderetas'},{key:'kalimbas',label:'Kalimbas'},{key:'timbales',label:'Timbales'}]},
  {key:'viento', label:'Viento',
    intro: "Flautas dulces soprano, melódicas de 32 y 37 teclas, quenas y zampoñas, entre S/ 20 y S/ 80. Si es para la lista del colegio, en Para Colegio está todo junto.", icon:'wind', desc:'Flautas dulces, melódicas, quenas y zampoñas, para el colegio y para tocar en serio. Tienda en San Juan de Miraflores, Lima, con envíos a todo el Perú.',
    subs:[{key:'flautas',label:'Flautas'},{key:'melodicas',label:'Melódicas'},{key:'quenas',label:'Quenas'},{key:'zamponas',label:'Zampoñas'},{key:'cututos',label:'Cututos y pututus'},{key:'trompetas',label:'Trompetas'},{key:'clarinetes',label:'Clarinetes'}]},
  {key:'audio', label:'Micrófono y Audio',
    intro: "Micrófonos dinámicos, sistemas inalámbricos para micrófono y para guitarra, y amplificadores, desde S/ 100. Para grabar en casa o para tocar en vivo; si no sabes cuál te sirve, escríbenos y lo vemos contigo.", icon:'mic', desc:'Micrófonos, interfaces y amplificadores para grabar y para tocar en vivo. Tienda de audio en San Juan de Miraflores, Lima, con envíos a todo el Perú.',
    subs:[{key:'microfonos',label:'Micrófonos'},{key:'interfaces',label:'Interfaces'},{key:'amplificadores',label:'Amplificadores'}]},
  {key:'colegio', label:'Para Colegio', seo:'Instrumentos para Colegio',
    intro: "Todo lo de la lista escolar en un sitio: flautas dulces, melódicas, xilófonos, metalófonos, claves y panderetas, desde S/ 10. Mándanos la lista por WhatsApp y te la cotizamos completa.", icon:'school', desc:'Instrumentos para la lista del colegio: flautas dulces, melódicas, xilófonos, liras, claves y panderetas. Tienda en Lima con envíos a todo el Perú.',
    subs:[
      {key:'colXilofonos',label:'Xilófonos y metalófonos'},
      {key:'colPercusion',label:'Claves, baquetas y percusión'},
    ]},
  {key:'accesorios', label:'Accesorios',
    intro: "Cuerdas para acústica, clásica y eléctrica de D'Addario, Ernie Ball y Romeo, capotrastes, púas, afinadores, atriles, baquetas y repuestos, desde S/ 15. Si buscas un calibre concreto, pregúntanos antes de venir y te decimos si lo tenemos.", icon:'accessory', desc:'Cuerdas, púas, capotrastes, afinadores, atriles, baquetas y repuestos para tu instrumento. Tienda en San Juan de Miraflores, Lima, con envíos a todo el Perú.',
    subs:[
      {key:'accCuerdasAcustica',label:'Cuerdas (Acústica/Clásica)'},
      {key:'accCuerdasElectrica',label:'Cuerdas (Eléctrica)'},
      {key:'accCapotrastes',label:'Capotrastes'},
      {key:'accPuas',label:'Púas y pines'},
      {key:'accAfinadores',label:'Afinadores y metrónomos'},
      {key:'accAtriles',label:'Atriles y parantes'},
      {key:'accBaquetas',label:'Baquetas y parches'},
      {key:'accCanas',label:'Cañas y boquillas'},
      {key:'accTeclados',label:'Teclados'},
      {key:'accViolin',label:'Violín (resina y puentes)'},
      {key:'accCuidado',label:'Limpieza y repuestos'},
      {key:'accFundas',label:'Fundas'},
    ]},
  {key:'packs', label:'Packs',
    intro: "Instrumento y accesorios juntos en un solo precio, listos para empezar: guitarra con funda y afinador, ukelele con funda, y más. Estamos armando los packs; si quieres uno a tu medida, escríbenos por WhatsApp y te lo cotizamos.", icon:'pack', desc:'Packs de instrumento más accesorios en un solo precio: guitarra, ukelele y más, listos para empezar. Tienda en San Juan de Miraflores, Lima, con envíos a todo el Perú.',
    subs:[]},
];

/* Productos que, además de su categoría real, se listan en otra categoría.
   La "Tarolita de Niño" es de Percusión › Tarolas, pero también se usa en
   colegios, así que aparece en "Para Colegio" sin duplicar el producto: sigue
   siendo una sola ficha, con una sola URL, un solo stock y su breadcrumb de
   Percusión. La clave es el id del producto en la base de datos. */
const CROSS_LISTED_CATS = {
  23: ["colegio"],   // Flauta Dulce Soprano Yamaha
  57: ["colegio"],   // Tarolita de Niño
  127: ["colegio"],  // Melódica California 37 Teclas (colores disponibles)
  140: ["colegio"],  // Melódica California 32 Teclas (colores disponibles)
  202: ["colegio"],  // Pandereta Media Luna (varios colores)
  203: ["colegio"],  // Pandereta Media Luna Doble Hilera
  208: ["colegio"],  // Xilófono Infantil de 8 Notas con Baquetas
  209: ["colegio"],  // Flauta Dulce Soprano Hohner Melody con Funda
  210: ["colegio"],  // Quena Lupaca con Funda
  211: ["colegio"],  // Zampoña Lupaca con Funda
};
/* Además de la lista fija de arriba, cada producto puede traer `extraCats`
   (lo marca el administrador en el panel: "También mostrar en"). */
function productInCat(p, catKey){
  return p.cat === catKey
    || (CROSS_LISTED_CATS[p.id] || []).includes(catKey)
    || (p.extraCats || []).includes(catKey);
}

/* La barra lateral de Accesorios agrupa por TIPO de producto (cuerdas de guitarra,
   capotrastes, afinadores...), que es como busca la gente. "matches" lista las
   subcategorías reales (las que usa el panel de administrador) bajo ese grupo: las
   cuerdas acústicas y eléctricas comparten el grupo "Cuerdas de guitarra". */
const ACCESORIOS_FILTER_GROUPS = [
  {key:'accGrpCuerdasGuitarra', seo:'Cuerdas de guitarra', label:'Cuerdas de guitarra', fotoId:185, matches:['accCuerdasAcustica','accCuerdasElectrica']},
  {key:'accGrpCapotrastes', seo:'Capotrastes para guitarra', label:'Capotrastes', matches:['accCapotrastes']},
  {key:'accGrpPuas', seo:'Púas para guitarra', label:'Púas y pines', matches:['accPuas']},
  {key:'accGrpAfinadores', seo:'Afinadores de guitarra', label:'Afinadores', matches:['accAfinadores']},
  {key:'accGrpAtriles', seo:'Atriles y pedestales', label:'Atriles y pedestales', matches:['accAtriles']},
  {key:'accGrpPercusion', seo:'Accesorios de percusión', label:'Percusión', matches:['accBaquetas']},
  {key:'accGrpViento', seo:'Accesorios para instrumentos de viento', label:'Viento', matches:['accCanas']},
  {key:'accGrpTeclados', seo:'Accesorios para teclado y piano', label:'Teclado y Piano', matches:['accTeclados']},
  {key:'accGrpViolin', seo:'Accesorios para violín', label:'Violín y cuerda frotada', matches:['accViolin']},
  {key:'accGrpCuidado', seo:'Limpieza y repuestos para instrumentos', label:'Limpieza y repuestos', matches:['accCuidado']},
  {key:'accGrpFundas', seo:'Fundas para instrumentos', label:'Fundas', matches:['accFundas']},
];

/* Para Colegio funciona igual: casi todo lo que muestra es de otra categoría
   (la flauta Yamaha es de Viento › Flautas, ver CROSS_LISTED_CATS), así que
   sus filtros agrupan subs reales de varias categorías, más los dos propios
   de Para Colegio para lo que solo vive aquí (xilófonos, claves). */
const COLEGIO_FILTER_GROUPS = [
  {key:'colGrpFlautas', seo:'Flautas dulces para el colegio', label:'Flautas dulces', matches:['flautas']},
  {key:'colGrpMelodicas', seo:'Melódicas para el colegio', label:'Melódicas', matches:['melodicas']},
  {key:'colGrpXilofonos', seo:'Xilófonos y metalófonos para el colegio', label:'Xilófonos y metalófonos', matches:['metalofono','colXilofonos']},
  {key:'colGrpPercusion', seo:'Claves, panderetas y percusión para el colegio', label:'Claves, panderetas y percusión', matches:['panderetas','tarolas','cajones','colPercusion']},
  {key:'colGrpAndinos', seo:'Quenas y zampoñas para el colegio', label:'Quenas y zampoñas', matches:['quenas','zamponas']},
];

/* Las categorías cuyos filtros son grupos en vez de sus subs crudos. */
const FILTER_GROUPS = {accesorios: ACCESORIOS_FILTER_GROUPS, colegio: COLEGIO_FILTER_GROUPS};

/* ----------------------------------------------------------------------
   SUBCATEGORÍAS CON URL PROPIA: /categoria/cuerda/ukeleles

   Existen por los anuncios: quien busca "ukelele concierto" tiene que caer
   entre ukeleles, no en una parrilla de cuerda que empieza por guitarras.
   src/index.js tiene las mismas tres funciones — si tocas una, toca la otra,
   porque esa es la versión que ve Google.
   ---------------------------------------------------------------------- */

/* Los filtros que se pueden recorrer dentro de una categoría. Accesorios es la
   excepción: sus chips son los grupos por instrumento, no los subs crudos. */
function subsNavegables(cat){
  return FILTER_GROUPS[cat.key] || cat.subs;
}

/* El trozo de URL sale de la ETIQUETA, no de la clave: las de Accesorios son
   camelCase ('accCuerdasAcustica') y no sirven de URL, pero su etiqueta da
   'cuerdas-acustica-clasica'. */
function subSlug(sub){ return slugify(sub.label); }

function findSubBySlug(cat, slug){
  return subsNavegables(cat).find(x=>subSlug(x)===slug) || null;
}
function findSubByKey(cat, key){
  return subsNavegables(cat).find(x=>x.key===key) || null;
}

/* La URL que le corresponde a lo que se está viendo ahora en el catálogo. El
   tramo de subcategoría solo aparece con UN filtro puesto: con dos no hay una
   sola página que nombrar, y con ninguno estamos en la categoría entera. */
function rutaDeCatalogo(){
  if(!state.activeCat) return '/tienda';
  const cat = CATEGORIES.find(c=>c.key===state.activeCat);
  if(!cat) return '/tienda';
  if(state.activeSubs.size===1){
    const sub = findSubByKey(cat, [...state.activeSubs][0]);
    if(sub) return hrefSubcategoria(cat.key, sub);
  }
  return hrefCategoria(cat.key);
}

/* ======================================================================
   PRODUCTOS — se cargan automáticamente desde tu Google Sheet.
   Ya no viven escritos aquí: para cambiar precios, ofertas, stock,
   fotos o video, edita directamente la hoja de cálculo. Este archivo
   solo pide los datos al abrir la tienda.
   ====================================================================== */

/* ⚠️ Pega aquí la URL de tu Worker de Cloudflare (ver productos-worker.js) */
const PRODUCTS_API_URL = 'https://chipao-productos-api.nishistore.workers.dev';

/* Las fotos se guardan en R2 con su URL publica de r2.dev, y asi vienen de la
   base de datos. Pero servirlas desde ahi le costaba al visitante un dominio
   extra (DNS+TCP+TLS otra vez) y ademas r2.dev no manda ni un Cache-Control,
   asi que quien volvia se rebajaba las mismas fotos. Ahora las sirve nuestro
   propio Worker en /img/ (ver src/index.js): mismo origen y cache de verdad.

   La conversion se hace SOLO al pintar, nunca sobre PRODUCTS: el formulario de
   administracion se llena con p.images y lo que escriba ahi se guarda tal cual
   en la base. Si normalizaramos los datos, editar un producto reescribiria sus
   URLs a rutas relativas sin que nadie lo pidiera. */
const R2_PUBLICO = 'https://pub-52acb879922b427f958ddbe0c729bbfc.r2.dev/';
/* Cloudflare reescala la foto al vuelo y la sirve en AVIF o WebP segun lo que
   acepte el navegador. Medido sobre Yamaha.jpeg: 90 KB el original, 18 KB en
   JPEG a 400px, 13 KB en AVIF.

   El ancho se pide en cada sitio porque cada uno la muestra a un tamano
   distinto, y no es gratis: cada par (foto, ancho) gasta una de las 5.000
   transformaciones unicas del mes. Con tres anchos y 152 fotos son 456, asi
   que sobra sitio; anadir un cuarto ancho cuesta otras 152.

   Los anchos salen de medir la pagina de verdad, no de adivinar: las tarjetas
   ocupan 272px en escritorio y 142 en movil, y la galeria de la ficha va a
   ancho completo (375 en movil). 700 y 1200 los cubren de sobra: el heroe, que es el
   elemento LCP, se muestra a 279px y con 700 sigue nitido a 2x en un movil.
   Medido: a 800 la foto de portada pesaba 41 KB y a 700 pesa 34, contra los
   88 del original.

   onerror=redirect es el seguro: si la transformacion falla, Cloudflare sirve
   la original en vez de devolver un error y dejar el hueco vacio. */
/* OJO con estos dos anchos. Las fotos de 1254x1254 (casi todo lo subido desde el
   producto 244 en adelante) salen del reescalador de Cloudflare con la ULTIMA
   COLUMNA de pixeles corrupta -una linea verdosa en el borde derecho- cuando se
   piden entre ~200 y ~520 de ancho (menos 240-300). Medido el 2026-10-18 con
   canvas sobre 34 productos: con 200, 320-520 la columna sale 60-100 niveles
   fuera de tono; con 240-300 y desde 550 sale limpia. Por eso la miniatura es
   256 (no 200) y la tarjeta del movil 560 (no 400). Si cambias un ancho, mide el
   borde derecho de una foto de 1254px antes de desplegar. */
const ANCHO_MINIATURA = 256;   // miniaturas del carrito, buscador y galeria
/* En el telefono la tarjeta mide ~170px (~340 reales con pantalla retina). 560 es
   mas de lo que hace falta pero es el ancho mas pequeno por encima de 340 que no
   da la linea en el borde (ver arriba). En escritorio se queda en 700. */
const ANCHO_TARJETA_MOVIL = 560;
const ANCHO_TARJETA   = 700;   // tarjetas del catalogo y portada
const ANCHO_GALERIA   = 1200;  // la foto grande de la ficha
const ANCHO_ZOOM       = 1600; // la foto ampliada a pantalla completa

function fotoUrl(u, ancho){
  const ruta = (typeof u === 'string' && u.startsWith(R2_PUBLICO))
    ? '/img/' + u.slice(R2_PUBLICO.length)
    : u;
  if(!ancho || typeof ruta !== 'string' || !ruta.startsWith('/img/')) return ruta;
  if(ancho === ANCHO_TARJETA && !esEscritorio()) ancho = ANCHO_TARJETA_MOVIL;
  return `/cdn-cgi/image/width=${ancho},format=auto,onerror=redirect${ruta}`;
}

let PRODUCTS = [];
/* La API trae los productos de DOS tiendas en la misma tabla: los de Chipao
   Music y los de Chipao Tendencia (columna tienda = 'tendencia'), que solo se
   ven en /tendencia, una página a la que se llega por enlace directo.
   PRODUCTS son solo los de Chipao -todas las listas, la portada, la búsqueda y
   las ofertas leen de ahí y no se enteran de que existe la otra tienda-, y
   TODOS son los de las dos, para lo que busca por id: el carrito, el checkout
   y el panel. */
let TODOS = [];
function esTendencia(p){ return p && p.tienda === 'tendencia'; }
function productosTendencia(){ return TODOS.filter(esTendencia); }
function productoPorId(id){ return TODOS.find(x => x.id === id); }
/* Ajustes escondidos en la descripción de un producto de Tendencia: las
   líneas que empiezan con "#" no se muestran nunca.
     #solo-imagenes  -> la ficha es una tira de imágenes con un solo botón
     #pack 2 149     -> 2 unidades por S/ 149 (se pueden poner varios)
   El cobro lo hace src/pagos.js con la MISMA cuenta (totalLinea): si cambias
   una, cambia la otra. */
function lineasDescripcion(p){
  return String((p && p.description) || '').split(/\n+/).map(t => t.trim()).filter(Boolean);
}
function descripcionVisible(p){ return lineasDescripcion(p).filter(t => t.charAt(0) !== '#').join('\n'); }
function soloImagenes(p){ return esTendencia(p) && lineasDescripcion(p).some(t => /^#solo-imagenes$/i.test(t)); }
/* #video <nº de foto> <archivo.mp4> <izq> <arriba> <ancho> <alto> (en % de
   la foto): pone un video mudo en bucle encima del hueco de esa foto. El mp4
   va directo de r2.dev y no por /img/, porque el iPhone pide el video por
   trozos (Range) y /img/ no los sirve. */
function videosDe(p){
  const vids = {};
  if(!esTendencia(p)) return vids;
  lineasDescripcion(p).forEach(t => {
    const m = /^#video\s+(\d+)\s+([\w.-]+\.mp4)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/i.exec(t);
    if(m) vids[Number(m[1]) - 1] = { src: R2_PUBLICO + m[2], poster: R2_PUBLICO + m[2].replace(/\.mp4$/i, '-poster.webp'),
      izq: m[3], arriba: m[4], ancho: m[5], alto: m[6] };
  });
  return vids;
}
function packsDe(p){
  const packs = {};
  if(!esTendencia(p)) return packs;
  lineasDescripcion(p).forEach(t => {
    const m = /^#pack\s+(\d+)\s+(\d+(?:\.\d+)?)$/i.exec(t);
    if(m && Number(m[1]) >= 2) packs[Number(m[1])] = Number(m[2]);
  });
  return packs;
}
/* Total de una línea del carrito: la combinación más barata de packs y
   unidades sueltas (4 = pack de 3 + 1). Sin packs, precio × cantidad. */
function totalLinea(p, qty){
  const packs = packsDe(p);
  const tamanos = Object.keys(packs).map(Number);
  if(!tamanos.length) return p.price * qty;
  const mejor = [0];
  for(let n = 1; n <= qty; n++){
    let m = mejor[n - 1] + p.price;
    tamanos.forEach(k => { if(k <= n) m = Math.min(m, mejor[n - k] + packs[k]); });
    mejor[n] = m;
  }
  return Math.round(mejor[qty] * 100) / 100;
}
function separarTiendas(lista){
  TODOS = lista;
  PRODUCTS = lista.filter(p => !esTendencia(p));
}
let PRICE_MAX = 3000; // valor por defecto mientras cargan los productos reales
const MAX_PRODUCT_IMAGES = 7;

/* Ícono decorativo por defecto según la categoría */
const ICON_BY_CAT = {
  cuerda:'string', teclados:'keyboard', percusion:'drum', viento:'wind',
  audio:'mic', colegio:'school', accesorios:'accessory', packs:'pack'
};
function iconFor(p){ return ICON_BY_CAT[p.cat] || 'accessory'; }

/* Lee el <script type="application/json"> que incrusta el Worker. Devuelve null
   si no esta o viene vacio, y entonces fetchProducts cae a la API como toda la
   vida: si el borde no pudo traer el catalogo, preferimos pagar el viaje extra
   antes que pintar una tienda vacia. */
function leerCatalogoEmbebido(){
  const bloque = document.getElementById('productos-iniciales');
  if(!bloque) return null;
  try{
    const lista = JSON.parse(bloque.textContent);
    return Array.isArray(lista) && lista.length ? lista : null;
  }catch(err){
    return null;
  }
}

/* ¿Va puesta la barra roja de ofertas? Se enciende y se apaga con un boton del
   panel de productos; el estado vive en la base (tabla settings, clave
   banner_promo) y el Worker lo incrusta aqui, igual que el catalogo, para que
   la barra no aparezca y desaparezca a medio cargar.

   Por defecto puesta: es como ha estado desde que existe, y sin bloque que
   leer -en el servidor local, o si el Worker no pudo leer la base- preferimos
   dejarla como estaba antes de que esto se pudiera apagar. */
let BANNER_PROMO = true;

function leerBannerPromo(){
  const bloque = document.getElementById('banner-promo');
  if(!bloque) return true;
  try{
    return JSON.parse(bloque.textContent).activo !== false;
  }catch(err){
    return true;
  }
}

/* 22-11-2026: el pago con tarjeta (Mercado Pago) se enciende y apaga desde
   el panel, pestaña "Tienda y apariencia". El Worker lo deja en el bloque
   #pago-tarjeta (ver tarjetaActiva en src/index.js). Por defecto apagado:
   sin bloque -servidor local- no aparece. */
let PAGO_TARJETA = false;
function leerPagoTarjeta(){
  const bloque = document.getElementById('pago-tarjeta');
  if(!bloque) return false;
  try{
    return JSON.parse(bloque.textContent).activo === true;
  }catch(err){
    return false;
  }
}

/* El arranque, compartido por las dos vias (catalogo incrustado o API). */
function arrancarConProductos(lista){
  BANNER_PROMO = leerBannerPromo();
  PAGO_TARJETA = leerPagoTarjeta();
  TALLER_PRECIOS = leerTallerPrecios();
  separarTiendas(lista);
  PRICE_MAX = PRODUCTS.length ? Math.max(...PRODUCTS.map(p=>p.price)) : 3000;
  state.priceMax = PRICE_MAX;
  loadCart();
  render();
  checkPaymentReturnStatus();
  checkAdminUrlTrigger();
  checkProductUrlTrigger();
}

async function fetchProducts(){
  if(!PRODUCTS_API_URL || PRODUCTS_API_URL.startsWith('PEGA_AQUI')){
    document.getElementById('app').innerHTML = `
      <div class="empty-state" style="padding-top:120px;">
        ${iconSvg('accessory')}
        <p>Falta configurar PRODUCTS_API_URL en el código.<br>Revisa las instrucciones para conectar tu base de datos.</p>
      </div>`;
    return;
  }
  /* El Worker ya dejo el catalogo dentro del HTML (ver src/index.js). Si esta,
     arrancamos sin tocar la red: ese viaje a un tercer dominio era lo que dejaba
     la pantalla en blanco hasta el primer pixel. */
  const embebidos = leerCatalogoEmbebido();
  if(embebidos){
    arrancarConProductos(embebidos);
    return;
  }
  try{
    const res = await fetch(`${PRODUCTS_API_URL}/products`);
    const data = await res.json();
    if(data.error) throw new Error(data.error);
    arrancarConProductos(data.products || []);
  }catch(err){
    document.getElementById('app').innerHTML = `
      <div class="empty-state" style="padding-top:120px;">
        ${iconSvg('accessory')}
        <p>No se pudieron cargar los productos.<br>Revisa tu conexión o intenta de nuevo en un momento.</p>
        <button class="btn-outline" style="margin-top:14px;" onclick="fetchProducts()">Reintentar</button>
      </div>`;
  }
}

/* Convierte una URL de YouTube en un link embebible; si no es YouTube, la deja igual */
function toEmbedUrl(url){
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

/* ======================================================================
   ICONS (family-level line art, consistent brand style)
   ====================================================================== */
const ICONS = {
  pin:'<path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.4"/>',
  string:'<path d="M15 4l5 5M15 4c-3 0-9 6-9 9a4 4 0 1 0 4 4c3 0 9-6 9-9M6 18l-3 3"/><circle cx="9" cy="15" r="0.6" fill="currentColor"/>',
  keyboard:'<rect x="3" y="7" width="18" height="10" rx="1.5"/><path d="M7 7v6M11 7v6M15 7v6M19 7v6"/>',
  drum:'<ellipse cx="12" cy="7" rx="8" ry="3"/><path d="M4 7v9a8 3 0 0 0 16 0V7"/><path d="M4 12a8 3 0 0 0 16 0"/>',
  wind:'<path d="M3 12h16a2.5 2.5 0 1 0-2.5-2.5"/><circle cx="8" cy="12" r=".6" fill="currentColor"/><circle cx="11" cy="12" r=".6" fill="currentColor"/><circle cx="14" cy="12" r=".6" fill="currentColor"/>',
  mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M9 22h6"/>',
  school:'<path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z"/><path d="M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5"/>',
  pack:'<path d="M3 8l9-4 9 4-9 4-9-4z"/><path d="M3 8v8l9 4 9-4V8M12 12v8"/>',
  accessory:'<path d="M12 3c4 0 6 4 6 7.5S14 21 12 21s-6-4.5-6-10.5S8 3 12 3z"/><circle cx="12" cy="9" r="1.4" fill="currentColor"/>',
  home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
  tag:'<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="8" cy="8.5" r="1.3" fill="currentColor"/>',
  /* Los tres de la barra inferior del rediseño. El handoff los deja como
     cuadrados y círculos de relleno y pide usar el set del proyecto, así que
     van dibujados con el mismo trazo de 1.6 que los demás. */
  search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  cart:'<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h3l2.4 11.3a1.8 1.8 0 0 0 1.8 1.4h8a1.8 1.8 0 0 0 1.8-1.4L21 7H6.2"/>',
  store:'<path d="M4 9.5V20h16V9.5"/><path d="M3 4h18l1.2 4.2a3 3 0 0 1-5.9.8 3 3 0 0 1-5.9 0 3 3 0 0 1-5.9-.8L3 4z"/><path d="M10 20v-5h4v5"/>',
  /* Los dos de la franja de beneficios de la portada del teléfono. */
  truck:'<path d="M2 6h12v10H2zM14 9.5h4l3.5 3.5v3H14"/><circle cx="6" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/>',
  card:'<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19M6 14.5h4"/>'
};

/* El logo de WhatsApp es de relleno, no de trazo, así que no entra en ICONS
   (que dibuja todo con stroke). Va aparte para el botón verde de la ficha. */
const iconWhatsapp = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.97L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.06c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.95-.3-1.63-.6-2.87-1.24-4.74-4.14-4.88-4.33-.14-.19-1.17-1.55-1.17-2.96 0-1.4.74-2.09 1-2.38.26-.28.57-.35.76-.35.19 0 .38 0 .54.01.17.01.4-.07.63.48.24.57.81 1.98.88 2.12.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.3.36-.42.49-.14.14-.29.3-.13.58.17.28.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.29 1.41.28.14.44.12.6-.07.17-.19.71-.83.9-1.11.19-.28.38-.24.63-.14.26.09 1.65.78 1.93.92.28.14.47.21.54.33.07.12.07.68-.17 1.35z"/></svg>';
function iconSvg(type, extra){
  return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" '+(extra||'')+'>'+(ICONS[type]||ICONS.accessory)+'</svg>';
}
const chevron='<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
function storeLocationHTML(mapHeight){
  const mapQuery = encodeURIComponent('Instrumentos Chipao, ' + STORE_ADDRESS);
  return `
    <div class="store-location">
      <p class="store-address">
        ${iconSvg('pin','style="width:15px;height:15px;flex-shrink:0"')}
        <span>${STORE_ADDRESS}</span>
      </p>
      <p class="store-hours">${STORE_HOURS}</p>
      <a href="${STORE_MAPS_LINK}" target="_blank" rel="noopener" class="store-maps-btn"><span>Ver en Google Maps</span></a>
      <div class="store-map-embed" style="height:${mapHeight}px;">
        <iframe src="https://www.google.com/maps?q=${mapQuery}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
      </div>
    </div>`;
}

/* ======================================================================
   ESTADO

   Vive en memoria y se pierde al recargar, salvo el carrito, que se guarda
   en localStorage (ver CART_STORAGE_KEY) para que no se vacíe solo.
   ====================================================================== */
const state = {
  view:'home',
  activeCat:null,
  activeSubs:new Set(),
  /* Dos banderas parecidas pero distintas, y conviene no mezclarlas:
     offersOnly es la RUTA /ofertas (currentViewPath la lee para saber en qué
     URL estamos), y soloOfertas es el CHIP "En oferta" dentro de cualquier
     categoría. Si el chip escribiera en offersOnly, ponerlo dentro de
     Percusión mandaría la barra de direcciones a /ofertas. */
  offersOnly:false,
  soloOfertas:false, // chip "En oferta"
  soloStock:false,   // chip "Recojo hoy": solo lo que hay ahora en tienda
  etiqueta:null,     // opción de la guía de guitarras (ETIQUETAS_GUITARRA)
  priceMin:0,
  priceMax:PRICE_MAX,
  /* Rangos marcados en el panel lateral de escritorio (claves de
     RANGOS_PRECIO). Vacío en el teléfono, que filtra por chips. */
  rangosPrecio:new Set(),
  sort:'relevancia',
  search:'',
  cart:[],           // {id, qty, color}
  entrega:'peru',    // 'lima' | 'peru' (agencia Shalom, la predeterminada) | 'tienda'
  motoPropio:false,  // con 'tienda': true si manda su propio motorizado a recoger
  /* Literal a propósito: MEDIOS_PAGO y PAGO_INICIAL se declaran más abajo
     con const, y leerlos aquí reventaría con ReferenceError al cargar. */
  pago:'yape',       // clave de MEDIOS_PAGO
  datos:{nombre:'', telefono:'', email:'', direccion:''},
  agencia:null,      // agencia Shalom elegida para envío a provincia: [departamento, nombre, dirección]
  buscandoAgencia:false,
  agenciaSeccion:'lima', // pestaña del buscador de agencias: 'lima' (Lima y Callao) o 'provincia'
  orderPlaced:false,
  orderId:null,      // número del último pedido enviado, para /pedido/<id>
  pedidoEnviado:null,// {total, entrega} congelado al cerrar, para la confirmación
  pedidoYape:null,   // pedido de Yape que vive en el servidor (ver PAGO CON YAPE)
  searchQuery:'',    // texto de la pantalla /buscar (independiente del filtro de la tienda)
  searchRango:null,  // rango de precio elegido en /buscar: 'bajo' | 'medio' | 'alto'
  politica:null      // clave de POLICIES que se está viendo como página
};

const fmt = n => 'S/ ' + n.toLocaleString('es-PE',{minimumFractionDigits:0});

/* Escapa texto antes de insertarlo como HTML — evita que alguien meta
   código (XSS) escribiendo algo raro en, por ejemplo, el buscador. */
function escapeHtml(str){
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ======================================================================
   ENRUTAMIENTO CON URLS REALES (SEO)
   Cada categoría y producto tiene su propia URL (/categoria/x,
   /producto/id-nombre) en vez de vivir todo bajo "/". Así Google puede
   indexar "guitarras" y "teclados" como páginas distintas.
   ====================================================================== */
const DEFAULT_META_DESCRIPTION = 'Tienda de instrumentos musicales en San Juan de Miraflores, Lima. Guitarras, teclados, percusión, viento y accesorios. Envíos a todo el Perú y recojo en tienda.';
const SITE_TITLE = 'Instrumentos Musicales en Lima | Chipao Music';

function slugify(str){
  return String(str).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

/* Cambia la URL de la barra de direcciones sin recargar la página.
   push=true agrega una entrada nueva al historial (clic normal);
   push=false la reemplaza (carga inicial o navegación atrás/adelante). */
function navigateTo(path, push){
  if(push === false){ history.replaceState({}, '', path); return; }
  if(window.location.pathname === path) return;
  history.pushState({}, '', path);
}

/* Actualiza <title>, meta description, og:* y canonical para la vista actual */
const SITE_ORIGIN = 'https://chipaomusic.com';
const DEFAULT_OG_IMAGE = 'https://pub-52acb879922b427f958ddbe0c729bbfc.r2.dev/og-chipao-music-3.jpg';

/* Actualiza título, descripción, canonical y las etiquetas que usan WhatsApp,
   Facebook y X para armar la vista previa al compartir un enlace. */
function setPageMeta(title, description, opts){
  opts = opts || {};
  document.title = title;
  const url = window.location.origin + window.location.pathname;
  const image = opts.image || DEFAULT_OG_IMAGE;
  const set = (sel, val)=>{ const el = document.querySelector(sel); if(el) el.setAttribute('content', val); };
  set('meta[name="description"]', description);
  set('meta[property="og:title"]', title);
  set('meta[property="og:description"]', description);
  set('meta[property="og:url"]', url);
  set('meta[property="og:image"]', image);
  set('meta[property="og:type"]', opts.type || 'website');
  set('meta[name="twitter:title"]', title);
  set('meta[name="twitter:description"]', description);
  set('meta[name="twitter:image"]', image);
  const canon = document.querySelector('link[rel="canonical"]');
  if(canon) canon.setAttribute('href', url);
}

/* Datos estructurados de la vista actual. En una ficha de producto Google los usa
   para mostrar precio y disponibilidad en los resultados de búsqueda; en las
   categorías, para dibujar la ruta de migas ("Inicio > Accesorios"). */
function setPageSchema(data){
  let el = document.getElementById('pageSchema');
  if(!data){ if(el) el.remove(); return; }
  if(!el){
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'pageSchema';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function breadcrumbSchema(trail){
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t,i)=>({
      '@type': 'ListItem', position: i+1, name: t.name, item: SITE_ORIGIN + t.path
    }))
  };
}

function setBreadcrumbSchema(trail){
  if(!trail || trail.length < 2){ setPageSchema(null); return; }
  setPageSchema(Object.assign({ '@context': 'https://schema.org' }, breadcrumbSchema(trail)));
}

function productSchema(p){
  const productPath = hrefProducto(p);
  const cat = CATEGORIES.find(c=>c.key===p.cat);
  const trail = [{name:'Inicio', path:'/'}];
  if(cat) trail.push({name:cat.label, path:hrefCategoria(cat.key)});
  trail.push({name:p.name, path:productPath});
  return {
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
          url: SITE_ORIGIN + productPath,
          priceCurrency: 'PEN',
          price: p.price,
          availability: (p.stock||0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@id': SITE_ORIGIN + '/#tienda' }
        }
      },
      breadcrumbSchema(trail)
    ]
  };
}

/* Reconstruye la URL/meta de la página que queda "debajo" de un modal
   de producto cerrado (según el estado actual: inicio, categoría u ofertas) */
function currentViewPath(){
  if(state.view==='tendencia') return '/tendencia';
  if(state.view==='tendenciaProducto'){ const p = productoPorId(tendFicha.id); return p ? hrefTendencia(p) : '/tendencia'; }
  if(state.view!=='shop') return '/';
  if(state.offersOnly) return '/ofertas';
  if(state.activeCat){
    const c = CATEGORIES.find(x=>x.key===state.activeCat);
    if(c) return hrefCategoria(c.key);
  }
  return '/tienda';
}
function applyCurrentViewMeta(){
  if(state.view!=='shop'){
    setPageMeta(SITE_TITLE, DEFAULT_META_DESCRIPTION);
    setBreadcrumbSchema(null);
    return;
  }
  if(state.offersOnly){
    const enOf = PRODUCTS.filter(p => enOferta(p) && (p.stock||0) > 0);
    const desdeOf = enOf.length ? Math.min(...enOf.map(p=>p.price)) : 0;
    setPageMeta('Instrumentos Musicales Económicos en Lima | Chipao Music',
      `Instrumentos musicales baratos en Lima${desdeOf ? `, desde ${fmt(desdeOf)}` : ''}: guitarras, flautas, panderetas y accesorios con descuento. Tienda en San Juan de Miraflores.`);
    setBreadcrumbSchema([{name:'Inicio',path:'/'},{name:'Ofertas',path:'/ofertas'}]);
    return;
  }
  if(state.activeCat){
    const c = CATEGORIES.find(x=>x.key===state.activeCat);
    if(c){
      /* Con un solo filtro puesto la página es la de esa subcategoría y lleva
         su propio título. Mismo texto que sirve el Worker. */
      if(state.activeSubs.size===1){
        const sub = findSubByKey(c, [...state.activeSubs][0]);
        if(sub){
          const conStock = productosDeCategoria(c.key)
            .filter(x => subMatchesActiveFilter(x.sub) && (x.stock||0) > 0);
          const desdeSub = conStock.length ? Math.min(...conStock.map(x=>x.price)) : 0;
          const rutaSub = hrefSubcategoria(c.key, sub);
          setPageMeta(`${sub.seo || sub.label} en Lima | Chipao Music`,
            `${sub.seo || sub.label} en Lima${desdeSub ? `, desde ${fmt(desdeSub)}` : ''}. ${c.label} en Chipao Music: tienda en San Juan de Miraflores con envíos a todo el Perú.`);
          setBreadcrumbSchema([
            {name:'Inicio',path:'/'},
            {name:c.label,path:hrefCategoria(c.key)},
            {name:sub.label,path:rutaSub},
          ]);
          return;
        }
      }
      const subsList = c.subs.map(s=>s.label).join(', ');
      /* Misma descripción que sirve el Worker (ver src/index.js): la propia de
         la categoría, y la plantilla solo como respaldo. */
      const desc = c.desc || (subsList
        ? `Compra ${c.label.toLowerCase()} en Lima y todo el Perú: ${subsList}. Tienda en San Juan de Miraflores con envíos a todo el país.`
        : `Compra ${c.label.toLowerCase()} en Lima y todo el Perú. Tienda en San Juan de Miraflores con envíos a todo el país.`);
      /* El precio de entrada delante, como en el Worker: Google corta la
         descripción por el final. */
      const vendibles = productosDeCategoria(c.key).filter(x => (x.stock||0) > 0);
      const desde = vendibles.length ? Math.min(...vendibles.map(x=>x.price)) : 0;
      setPageMeta(`${c.seo || c.label} en Lima | Chipao Music`,
        desde ? `Desde ${fmt(desde)}. ${desc}` : desc);
      setBreadcrumbSchema([{name:'Inicio',path:'/'},{name:c.label,path:hrefCategoria(c.key)}]);
      return;
    }
  }
  /* Distinta de la portada: con la misma, Google no sabe cuál de las dos enseñar. */
  setPageMeta('Catálogo de Instrumentos Musicales | Chipao Music',
    'Catálogo completo de Chipao Music: guitarras, ukeleles, teclados, percusión, viento, audio y accesorios con precio y stock real. Envíos a todo el Perú.');
  setBreadcrumbSchema([{name:'Inicio',path:'/'},{name:'Catálogo',path:'/tienda'}]);
}

/* Lee la URL actual y muestra la categoría/producto/oferta que le
   corresponde. Se usa al cargar la página y al usar atrás/adelante. */
function routeFromPath(push){
  const path = window.location.pathname;
  const productMatch = path.match(/^\/producto\/(\d+)/);
  if(productMatch){
    const id = Number(productMatch[1]);
    if(PRODUCTS.some(p=>p.id===id)){
      openProductDetail(id, push);
      return true;
    }
    /* El id es válido pero ya no está en el catálogo: lo retiraste. */
    avisoProductoRetirado = true;
  }
  document.getElementById('modalOverlay').classList.remove('show');

  /* Pantallas de sesión. Van antes que las demás para que, al volver atrás
     desde una de ellas, se abra el panel en el estado correcto en vez de
     caer en el catálogo. */
  /* La política vive fuera del catálogo: ni categoría, ni producto, ni
     pantalla de sesión. Se resuelve aquí, antes que nada que filtre. */
  const politica = politicaDeRuta(path);
  if(politica){ goPolicy(politica, push); return true; }
  if(path === '/taller'){ goTaller(push); return true; }

  if(path === '/buscar'){ goSearch(push); return true; }
  if(path === '/carrito'){ goCart(push); return true; }
  if(path === '/checkout'){ goCheckout(push); return true; }
  const pedidoMatch = path.match(/^\/pedido\/([A-Za-z0-9-]{1,24})$/);
  if(pedidoMatch){ goPedido(pedidoMatch[1], push); return true; }
  const catMatch = path.match(/^\/categoria\/([a-z]+)$/);
  if(catMatch && CATEGORIES.some(c=>c.key===catMatch[1])){
    goShop(catMatch[1], null, push);
    return true;
  }
  const subMatch = path.match(/^\/categoria\/([a-z]+)\/([a-z0-9-]+)$/);
  if(subMatch){
    const catSub = CATEGORIES.find(c=>c.key===subMatch[1]);
    const sub = catSub ? findSubBySlug(catSub, subMatch[2]) : null;
    if(sub){ goShop(catSub.key, sub.key, push); return true; }
  }
  if(path === '/ofertas'){ goOffers(push); return true; }
  if(path === '/tendencia'){ goTendencia(push); return true; }
  const tendMatch = path.match(/^\/tendencia\/(\d+)/);
  if(tendMatch){ goTendenciaProducto(Number(tendMatch[1]), push); return true; }
  if(path === '/tienda'){ goShop(null, null, push); return true; }
  if(path === '/'){ goHome(push); return true; }
  // URL desconocida (por ejemplo un producto que ya se eliminó): mostramos el
  // catálogo en vez de dejar la pantalla de carga girando para siempre.
  goShop(null, null, push);
  return false;
}

/* Quien entra a la ficha de un producto retirado acababa en el catálogo
   entero sin que nadie le dijera por qué: parece que la tienda le ignoró la
   búsqueda. Se levanta la bandera al no encontrar la ficha y el catálogo la
   baja en cuanto la enseña una vez. */
let avisoProductoRetirado = false;

/* ======================================================================
   NAVEGACIÓN

   Solo quedan los enlaces del pie y la barra inferior. La barra superior
   de categorías y el menú lateral desaparecieron con el rediseño: la
   portada trae el carrusel de categorías y la barra inferior lleva al
   catálogo.
   ====================================================================== */
function buildNavLists(){
  document.getElementById('footerCats').innerHTML = CATEGORIES.map(c=>
    `<a class="link" href="${hrefCategoria(c.key)}" onclick="goShop('${c.key}');return false;">${c.label}</a>`
  ).join('');
  buildBottomNav();
  renderPieMovil();
}

/* Pie del teléfono. Arriba lo que sirve para comprar —si la tienda está
   abierta, WhatsApp y cómo llegar— y las listas de enlaces plegadas en
   acordeón, como en Mercado Libre: abiertas eran una pantalla entera de
   texto. Con <details> los enlaces siguen en la página aunque estén
   cerrados, y no hace falta JavaScript para abrirlos. */
function renderPieMovil(){
  const el = document.getElementById('pieMovil');
  if(!el) return;
  if(esEscritorio()){ el.innerHTML = ''; return; }

  const estado = estadoTienda();
  const abierto = estado.startsWith('abierto');
  const pol = (clave, texto) =>
    `<a class="pm-link" href="${POLICIES[clave].path}" onclick="goPolicy('${clave}');return false;">${texto}</a>`;

  /* En Chipao Tendencia el pie lleva su nombre y no la tienda física: ni
     dirección, ni horario, ni "Cómo llegar". Queda el WhatsApp. */
  const tend = modoTendencia();
  el.innerHTML = `
    ${tend ? `
    <a class="pm-marca" href="/tendencia" onclick="goTendencia();return false;">
      <logo-gorro><img src="/img/logo-redondo.webp" alt="Chipao Tendencia" width="44" height="44" loading="lazy"></logo-gorro>
      <div><b>Chipao Tendencia</b><span>Productos en tendencia · envío a todo el Perú</span></div>
    </a>

    <div class="pm-tienda">
      <div class="pm-botones">
        <a class="pm-btn wa" target="_blank" rel="noopener"
           href="${waHref(MENSAJE_WA_TENDENCIA)}"
           onclick="trackAdsConversion('whatsapp')"><span class="ico-wa">${iconWhatsapp}</span>WhatsApp</a>
      </div>
    </div>` : `
    <a class="pm-marca" href="/" onclick="goHome();return false;">
      <logo-gorro><img src="/img/logo-redondo.webp" alt="Chipao Music" width="44" height="44" loading="lazy"></logo-gorro>
      <div><b>Chipao Music</b><span>Instrumentos musicales en Lima · +12 años</span></div>
    </a>

    <div class="pm-tienda">
      <span class="pm-estado${abierto ? '' : ' cerrado'}"><i></i>${abierto ? 'Abierto hoy hasta las 9:00 p.m.' : 'Cerrado · abrimos a las 9:30 a.m.'}</span>
      <p>Av. Los Héroes 382, San Juan de Miraflores</p>
      <div class="pm-botones">
        <a class="pm-btn wa" target="_blank" rel="noopener"
           href="${waHref('Hola, tengo una consulta.')}"
           onclick="trackAdsConversion('whatsapp')"><span class="ico-wa">${iconWhatsapp}</span>WhatsApp</a>
        <a class="pm-btn" target="_blank" rel="noopener" href="${STORE_MAPS_LINK}">${iconSvg('pin', 'aria-hidden="true"')}Cómo llegar</a>
      </div>
    </div>`}

    <div class="pm-acordeon">
      <details class="solo-chipao">
        <summary>Categorías</summary>
        <div class="pm-dentro">${CATEGORIES.map(c =>
          `<a class="pm-link" href="${hrefCategoria(c.key)}" onclick="goShop('${c.key}');return false;">${escapeHtml(c.label)}</a>`
        ).join('')}</div>
      </details>
      <details>
        <summary>Compras y envíos</summary>
        <div class="pm-dentro">
          ${pol('envios', 'Política de envíos')}
          ${pol('pagos', 'Medios de pago')}
          <a class="pm-link" href="/cambios-y-devoluciones" onclick="goPolicy('cambios');return false;">Cambios y devoluciones</a>
          ${pol('garantia', 'Garantía de productos')}
          <a class="pm-link solo-chipao" href="/taller" onclick="goTaller();return false;">Taller de reparación</a>
        </div>
      </details>
      <details>
        <summary>Legal y contacto</summary>
        <div class="pm-dentro">
          ${pol('terminos', 'Términos y condiciones')}
          ${pol('privacidad', 'Política de privacidad')}
          <a class="pm-link" href="/libro-de-reclamaciones" onclick="goPolicy('reclamaciones');return false;">Libro de reclamaciones</a>
          ${pol('contacto', 'Contáctanos')}
        </div>
      </details>
    </div>

    <div class="pm-redes">${document.querySelector('footer.site .footer-social').innerHTML}</div>
    <p class="pm-copy">© 2026 ${tend ? 'Chipao Tendencia' : 'Chipao Music'}</p>`;
}

/* Barra inferior del celular. El handoff la deja en cuatro destinos — las
   tareas de una tienda en el teléfono: volver al principio, buscar, ver lo
   que llevas y recorrer el catálogo. Antes eran seis atajos de categoría,
   que ya viven en la portada y en el menú, y que dejaban la barra sin
   ninguna forma de llegar al buscador ni al carrito. */
const BOTTOM_NAV = [
  {label:'Inicio',  icon:'home',   href:'/',        action:'goHome()',     activa:()=> state.view==='home'},
  {label:'Buscar',  icon:'search', href:'/buscar',  action:'goSearch()',   activa:()=> state.view==='search'},
  {label:'Carrito', icon:'cart',   href:'/carrito', action:'goCart()',     activa:()=> ['carrito','checkout','pedido'].includes(state.view), badge:true},
  {label:'Tienda',  icon:'store',  href:'/tienda',  action:'goShop(null)', activa:()=> state.view==='shop'},
];
/* En Chipao Tendencia la barra no lleva al catálogo de Chipao. */
const BOTTOM_NAV_TENDENCIA = [
  {label:'Inicio',  icon:'home',   href:'/tendencia', action:'inicioTendencia()', activa:()=> state.view==='tendencia'},
  {label:'Buscar',  icon:'search', href:'/tendencia', action:'buscarEnTendencia()', activa:()=> false},
  {label:'Carrito', icon:'cart',   href:'/carrito',   action:'goCart()', activa:()=> ['carrito','checkout','pedido'].includes(state.view), badge:true},
];
function buildBottomNav(){
  const el = document.getElementById('bottomNav');
  if(!el) return;
  const enCarrito = state.cart.reduce((s,c)=>s+c.qty,0);
  /* Enlaces de verdad, no botones: así se pueden abrir en otra pestaña y el
     rastreador ve a dónde llevan. El onclick evita la recarga. */
  const items = modoTendencia()
    ? BOTTOM_NAV_TENDENCIA.filter(x => BUSCADOR_TENDENCIA || x.icon !== 'search')
    : BOTTOM_NAV;
  el.innerHTML = items.map(item=>{
    const badge = (item.badge && enCarrito>0)
      ? `<span class="tab-badge">${enCarrito}</span>` : '';
    return `<a class="tab-item${item.activa()?' active':''}" href="${item.href}"
      onclick="${item.action};return false;"${item.activa()?' aria-current="page"':''}>
      <span class="tab-icon">${iconSvg(item.icon)}${badge}</span>
      <span class="tab-label">${item.label}</span>
    </a>`;
  }).join('');
}

/* ======================================================================
   ROUTING
   ====================================================================== */
function goHome(push){
  state.view='home';
  navigateTo('/', push);
  setPageMeta(SITE_TITLE, DEFAULT_META_DESCRIPTION);
  render();
  if(push !== false) window.scrollTo({top:0,behavior:'smooth'});
}
function goShop(catKey, subKey, push){
  /* Los chips se quedan puestos mientras no cambies de categoría: si vuelves
     atrás a Percusión, sigue filtrada como la dejaste. Al cambiar de
     categoría se limpian, porque un "Hasta S/ 200" heredado de Accesorios
     esconde media sección sin que se entienda por qué. */
  const mismaCat = state.view==='shop' && !state.offersOnly && state.activeCat === (catKey || null);
  state.view='shop';
  state.activeCat = catKey || null;
  if(subKey){
    state.activeSubs = new Set([subKey]);
  }else if(!mismaCat){
    state.activeSubs = new Set();
    state.soloOfertas = false;
    state.soloStock = false;
    state.sort = 'relevancia';
    state.priceMin=0; state.priceMax=PRICE_MAX;
  }
  state.offersOnly = false;
  state.search='';
  state.etiqueta = null;
  const catObj = catKey ? CATEGORIES.find(c=>c.key===catKey) : null;
  navigateTo(rutaDeCatalogo(), push);
  applyCurrentViewMeta();
  render();
  if(push !== false) window.scrollTo({top:0,behavior:'smooth'});
}
function goOffers(push){
  state.view='shop';
  state.activeCat=null; state.activeSubs=new Set();
  state.offersOnly=true;
  state.soloOfertas=false; state.soloStock=false; state.sort='relevancia';
  state.priceMin=0; state.priceMax=PRICE_MAX; state.search='';
  navigateTo('/ofertas', push);
  applyCurrentViewMeta();
  render();
  if(push !== false) window.scrollTo({top:0,behavior:'smooth'});
}
/* ======================================================================
   CHIPAO TENDENCIA: /tendencia
   Una tienda aparte que solo se abre con el enlace directo: no está en el
   menú, ni en el sitemap, y el Worker la sirve con noindex. Sus productos no
   tienen ficha (la ficha tiene URL indexable): se agregan al carrito desde la
   tarjeta, y de ahí siguen el camino de siempre -carrito, checkout, Shalom,
   Yape-. Se editan en el panel, eligiendo "Chipao Tendencia" arriba.
   ====================================================================== */
function goTendencia(push){
  state.view = 'tendencia';
  navigateTo('/tendencia', push);
  setPageMeta('Chipao Tendencia | Chipao Music',
    'Productos en tendencia de Chipao Music, con envío gratis por Shalom y pago con Yape.');
  setBreadcrumbSchema(null);
  render();
  if(push !== false) window.scrollTo({top:0,behavior:'smooth'});
}
function tarjetaTendenciaHtml(p){
  const foto = (p.images || [])[0];
  const agotado = (p.stock || 0) <= 0;
  const ir = `href="${hrefTendencia(p)}" onclick="goTendenciaProducto(${p.id});return false;"`;
  return `<article class="tend-card">
    <a class="tend-foto" ${ir} aria-label="Ver ${escapeHtml(p.name)}">${foto
      ? `<img src="${escapeHtml(fotoUrl(foto, ANCHO_TARJETA))}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async">`
      : '<span class="tend-sinfoto" aria-hidden="true"></span>'}${p.video ? '<span class="tend-video" aria-hidden="true">▶ Video</span>' : ''}</a>
    <div class="tend-info">
      <h2 class="tend-nombre"><a ${ir}>${escapeHtml(p.name)}</a></h2>
      ${descripcionVisible(p) ? `<p class="tend-desc">${escapeHtml(descripcionVisible(p))}</p>` : ''}
      <div class="tend-precio">
        <b>${fmt(p.price)}</b>${enOferta(p) ? ` <s>${fmt(p.old)}</s>` : ''}
      </div>
      <button type="button" class="tend-agregar" ${agotado ? 'disabled' : ''}
        onclick="addToCart(${p.id}, this)">${agotado ? 'Agotado' : 'Agregar'}</button>
    </div>
  </article>`;
}
/* La cabecera cambia de marca -nombre, buscador y barra de abajo- mientras se
   está en /tendencia, o en el carrito y el checkout con productos de ahí. Las
   categorías de Chipao no se enseñan: esta tienda vende pocos productos. */
/* El mismo WhatsApp de Chipao, con un mensaje que dice de dónde viene. */
const MENSAJE_WA_TENDENCIA = 'Quisiera ayuda con este producto en tendencia';
function modoTendencia(){
  return state.view === 'tendencia' || state.view === 'tendenciaProducto'
    || (VISTAS_DE_COMPRA.includes(state.view) && (carritoTendencia() || ultimaTienda === 'tendencia'));
}
/* De qué tienda viene el visitante, para que el carrito, el pago y el pedido
   lo devuelvan a esa tienda (y no a Chipao Music) aunque vacíe el carrito o
   recargue. Se apunta en cada render (ver render()) y dura la pestaña. */
const VISTAS_DE_COMPRA = ['carrito','checkout','pedido','politica'];
let ultimaTienda = (() => { try{ return sessionStorage.getItem('chipao-ultima-tienda') || 'chipao'; }catch(e){ return 'chipao'; } })();
function apuntarTienda(){
  let t = null;
  if(state.view === 'tendencia' || state.view === 'tendenciaProducto') t = 'tendencia';
  else if(!VISTAS_DE_COMPRA.includes(state.view) && state.view !== 'admin' && state.view !== 'adminLogin') t = 'chipao';
  if(!t || t === ultimaTienda) return;
  ultimaTienda = t;
  try{ sessionStorage.setItem('chipao-ultima-tienda', t); }catch(e){}
}
/* "Inicio" y "Seguir viendo el catálogo" llevan a la tienda de la que se viene. */
function irInicioTienda(){ if(modoTendencia()) inicioTendencia(); else goHome(); }
/* La flecha de "Tu carrito" en Tendencia (21-11-2026): vuelve a la ficha del
   último producto de Tendencia que se vio (o al primero del carrito), no a la
   lista de /tendencia. En Chipao Music hace lo de siempre. */
function volverDelCarrito(){
  if(!modoTendencia()){ goHome(); return; }
  let id = null;
  try{ id = Number(sessionStorage.getItem('chipao-ultima-ficha-tendencia')) || null; }catch(e){}
  if(!esTendencia(productoPorId(id))){
    const c = state.cart.find(x => esTendencia(productoPorId(x.id)));
    id = c ? c.id : null;
  }
  if(id) goTendenciaProducto(id); else inicioTendencia();
}
function irCatalogoTienda(){ if(modoTendencia()) inicioTendencia(); else goShop(null); }
/* El buscador de la cabecera, en modo Tendencia, filtra las tarjetas de esta
   página en vez de buscar en el catálogo de Chipao. */
let tendQuery = '';
/* Apagado mientras haya pocos productos (pedido del dueño, 18-11-2026). Para
   volver a enseñarlo en la cabecera y en la barra de abajo: true. */
const BUSCADOR_TENDENCIA = false;
function normalizaBusqueda(t){
  return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function tendenciaFiltrada(){
  const q = normalizaBusqueda(tendQuery).trim();
  const lista = productosTendencia();
  if(!q) return lista;
  return lista.filter(p => normalizaBusqueda(p.name + ' ' + (p.description || '')).includes(q));
}
function tendGridHtml(){
  const lista = tendenciaFiltrada();
  if(lista.length) return lista.map(tarjetaTendenciaHtml).join('');
  return tendQuery.trim()
    ? '<p class="tend-vacio">No encontramos nada con esa búsqueda.</p>'
    : '<p class="tend-vacio">Muy pronto, nuevos productos.</p>';
}
function onTendBuscar(val, input){
  tendQuery = val;
  if(state.view !== 'tendencia'){
    const id = input && input.id;
    goTendencia();
    const nuevo = id && document.getElementById(id);
    if(nuevo){ nuevo.focus(); nuevo.setSelectionRange(nuevo.value.length, nuevo.value.length); }
    return;
  }
  const grid = document.getElementById('tendGrid');
  if(grid) grid.innerHTML = tendGridHtml();
}
function inicioTendencia(){ tendQuery = ''; goTendencia(); }
function buscarEnTendencia(){
  if(state.view !== 'tendencia') goTendencia();
  const input = document.getElementById('tendBuscarMovil') || document.getElementById('tendBuscarInput');
  if(input) input.focus();
}
/* ---- Ficha de un producto de Tendencia: /tendencia/<id>-<nombre> ----
   Es aparte de la ficha de Chipao (esa tiene reseñas, categorías, taller,
   recomendados de Chipao y una URL que Google indexa). Esta vive bajo
   /tendencia, que el Worker sirve con noindex. */
function hrefTendencia(p){ return '/tendencia/' + p.id + '-' + slugify(p.name); }
let tendFicha = { id: null, slide: 0 };
function goTendenciaProducto(id, push){
  const p = productoPorId(id);
  if(!esTendencia(p)){ goTendencia(push); return; }
  tendFicha = { id, slide: 0 };
  try{ sessionStorage.setItem('chipao-ultima-ficha-tendencia', String(id)); }catch(e){}
  state.view = 'tendenciaProducto';
  navigateTo(hrefTendencia(p), push);
  setPageMeta(p.name + ' | Chipao Tendencia',
    (descripcionVisible(p) || 'Producto en tendencia').slice(0, 150) + ' · Envío gratis por Shalom y pago con Yape.');
  setBreadcrumbSchema(null);
  render();
  if(push !== false) window.scrollTo({top:0});
}
function tendSlide(i){
  tendFicha.slide = i;
  render();
}
function renderTendenciaProducto(){
  const p = productoPorId(tendFicha.id);
  if(!esTendencia(p)) return renderTendencia();
  if(soloImagenes(p)) return renderTendenciaImagenes(p);
  const slides = [...(p.images || []).map(url => ({type:'image', url})), ...(p.video ? [{type:'video', url:p.video}] : [])];
  if(tendFicha.slide >= slides.length) tendFicha.slide = 0;
  const activo = slides[tendFicha.slide];
  let principal;
  if(!activo) principal = '<span class="tend-sinfoto" aria-hidden="true"></span>';
  else if(activo.type === 'image') principal = `<img src="${escapeHtml(fotoUrl(activo.url, ANCHO_GALERIA))}" alt="${escapeHtml(p.name)}" decoding="async">`;
  else {
    const embed = toEmbedUrl(activo.url);
    principal = embed
      ? `<iframe src="${escapeHtml(embed)}" title="${escapeHtml(p.name)}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`
      : `<video src="${escapeHtml(activo.url)}" controls playsinline autoplay muted></video>`;
  }
  const miniaturas = slides.length > 1 ? `<div class="tf-thumbs">${slides.map((s, i) => `
      <button type="button" class="tf-thumb${i === tendFicha.slide ? ' sel' : ''}" onclick="tendSlide(${i})"
        aria-label="${s.type === 'image' ? 'Ver foto ' + (i + 1) : 'Ver el video'}">
        ${s.type === 'image'
          ? `<img src="${escapeHtml(fotoUrl(s.url, ANCHO_MINIATURA))}" alt="" loading="lazy" decoding="async">`
          : '<span class="tf-thumb-video">▶<small>Video</small></span>'}
      </button>`).join('')}</div>` : '';
  const agotado = (p.stock || 0) <= 0;
  const oferta = enOferta(p);
  /* La descripción del panel se reparte: la primera línea es la bajada bajo
     el nombre; las que empiezan con "-" o "•" salen como lista con check; el
     resto, como párrafos en "Detalles". */
  const lineas = lineasDescripcion(p).filter(t => t.charAt(0) !== '#');
  const bajada = lineas[0] && lineas[0].toLowerCase() !== p.name.toLowerCase() ? lineas[0] : '';
  const resto = lineas.slice(1);
  const vinetas = resto.filter(t => /^[-•*]\s*/.test(t)).map(t => t.replace(/^[-•*]\s*/, ''));
  const parrafos = resto.filter(t => !/^[-•*]\s*/.test(t));
  /* Cantidades: 1, 2 y 3 (o menos si no hay stock). Cada tarjeta enseña el
     total y lo que se ahorra frente al precio anterior. */
  const maxCant = Math.max(1, Math.min(3, p.stock || 1));
  if(!tendFicha.cant || tendFicha.cant > maxCant) tendFicha.cant = 1;
  const cant = tendFicha.cant;
  const total = totalLinea(p, cant);
  const ahorro = oferta ? p.old * cant - total : 0;
  const envioGratis = total >= ENVIO_GRATIS_TENDENCIA;
  const tarjetasCant = Array.from({length: maxCant}, (_, i) => i + 1).map(n => {
    const t = totalLinea(p, n);
    const etiqueta = n === 1 ? '1 unidad' : n + ' unidades';
    const extra = t >= ENVIO_GRATIS_TENDENCIA ? 'Envío gratis' : (oferta ? 'Ahorras ' + fmt(p.old * n - t) : '');
    return `<button type="button" class="tf-cant${n === cant ? ' sel' : ''}" onclick="tendCant(${n})" aria-pressed="${n === cant}">
        ${n === 2 && maxCant > 2 ? '<span class="tf-cant-pop">Más pedido</span>' : ''}
        <span class="tf-cant-radio" aria-hidden="true"></span>
        <span class="tf-cant-txt"><b>${etiqueta}</b><small>${fmt(p.price)} c/u</small></span>
        <span class="tf-cant-precio"><b>${fmt(t)}</b>${extra ? `<small>${extra}</small>` : ''}</span>
      </button>`;
  }).join('');
  const faltaEnvio = ENVIO_GRATIS_TENDENCIA - total;
  const botonTxt = agotado ? 'Agotado' : 'Agregar al carrito' + (ahorro ? ' · Ahorras ' + fmt(ahorro) : '');
  const check = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const preguntas = [
    ['¿Cómo pago?', 'Con Yape. Al finalizar el pedido te mostramos el número y el monto exacto; subes la captura del pago y lo validamos.'],
    ['¿A dónde me llega?', 'Enviamos por Shalom a la agencia que elijas, en Lima o en provincia. Recoges tu pedido en esa agencia con tu DNI.'],
    ['¿Cuánto cuesta el envío?', 'Nada: el envío por Shalom es gratis a Lima, Callao y provincia.'],
    ['¿Puedo pedir más de 3?', 'Sí. Agrega el producto y sube la cantidad en el carrito, o escríbenos por WhatsApp y te ayudamos.'],
    ['¿Tengo dudas sobre el producto?', 'Escríbenos por WhatsApp desde el botón de esta página y te respondemos con fotos o más detalles.'],
  ];
  return `<div class="app-shell tendencia tend-ficha">
    <a class="tf-volver" href="/tendencia" onclick="goTendencia();return false;"><span aria-hidden="true">‹</span> Ver más productos</a>
    <div class="tf-layout">
      <div class="tf-galeria">
        <div class="tf-principal${activo && activo.type === 'video' ? ' es-video' : ''}">
          ${principal}
          ${oferta ? `<span class="tf-sello">-${Math.round((1 - p.price / p.old) * 100)}%</span>` : ''}
        </div>
        ${miniaturas}
      </div>
      <div class="tf-info">
        <p class="tf-aviso">${oferta ? 'Oferta por tiempo limitado' : 'Producto en tendencia'} · Envío gratis</p>
        <h1 class="tf-nombre">${escapeHtml(p.name)}</h1>
        ${bajada ? `<p class="tf-bajada">${escapeHtml(bajada)}</p>` : ''}
        <div class="tf-datos">
          <div><b>${agotado ? '0' : (p.stock > 20 ? '20+' : p.stock)}</b><span>En stock</span></div>
          <div><b>Yape</b><span>Pago</span></div>
          <div><b>Shalom</b><span>Envío</span></div>
        </div>
        ${agotado ? '' : `<p class="tf-etiqueta">Elige la cantidad</p>
        <div class="tf-cants">${tarjetasCant}</div>`}
        <div class="tf-total">
          <div class="tf-total-fila"><span>Total de hoy</span><span>${ahorro ? `<s>${fmt(p.old * cant)}</s> ` : ''}<b>${fmt(total)}</b></span></div>
          <div class="tf-total-fila"><span>Envío por Shalom</span><span>${envioGratis ? '<b class="tf-gratis">GRATIS</b>' : 'S/ 10 Lima · S/ 15 provincia'}</span></div>
          ${ahorro ? `<p class="tf-ahorro-hoy">Estás ahorrando ${fmt(ahorro)} hoy</p>` : ''}
          ${!envioGratis && !agotado ? `<p class="tf-falta">Te faltan ${fmt(faltaEnvio)} para el envío gratis.</p>` : ''}
        </div>
        <button type="button" class="tend-agregar tf-cta" id="tfCta" ${agotado ? 'disabled' : ''} onclick="tendAgregar(${p.id}, this)">${botonTxt}</button>
        <ul class="tf-garantias">
          <li>${check} Pago con Yape</li>
          <li>${check} Envío a todo el Perú</li>
          <li>${check} Atención por WhatsApp</li>
        </ul>
        <a class="tf-wa" target="_blank" rel="noopener" href="${waHref(MENSAJE_WA_TENDENCIA + ': ' + p.name)}">${iconWhatsapp} Consultar por WhatsApp</a>
      </div>
    </div>

    <nav class="tf-anclas" aria-label="Secciones">
      ${parrafos.length || vinetas.length ? '<a href="#tf-detalles">Detalles</a>' : ''}
      <a href="#tf-como">Cómo comprar</a>
      <a href="#tf-envio">Envío</a>
      <a href="#tf-preguntas">Preguntas</a>
    </nav>

    ${parrafos.length || vinetas.length ? `<section class="tf-seccion" id="tf-detalles">
      <p class="tf-kicker">Detalles</p>
      <h2>Lo que tienes que saber</h2>
      ${parrafos.map(t => `<p>${escapeHtml(t)}</p>`).join('')}
      ${vinetas.length ? `<ul class="tf-lista">${vinetas.map(t => `<li>${check}<span>${escapeHtml(t)}</span></li>`).join('')}</ul>` : ''}
    </section>` : ''}

    <section class="tf-seccion" id="tf-como">
      <p class="tf-kicker">Cómo comprar</p>
      <h2>Tres pasos y listo</h2>
      <ol class="tf-pasos">
        <li><span>01</span><b>Agrégalo al carrito</b><p>Elige cuántas unidades quieres y agrega el producto.</p></li>
        <li><span>02</span><b>Paga con Yape</b><p>Te mostramos el monto exacto y subes la captura del pago.</p></li>
        <li><span>03</span><b>Recoge en Shalom</b><p>Lo enviamos a la agencia Shalom que elijas y lo recoges con tu DNI.</p></li>
      </ol>
    </section>

    <section class="tf-seccion" id="tf-envio">
      <p class="tf-kicker">Envío</p>
      <h2>Cuánto cuesta que te llegue</h2>
      <div class="tf-tabla">
        <div class="tf-tabla-fila tf-tabla-cab"><span>Destino</span><span>Envío</span><span>Recojo</span></div>
        <div class="tf-tabla-fila"><span>Lima y Callao</span><span class="tf-gratis">Gratis</span><span>En agencia Shalom</span></div>
        <div class="tf-tabla-fila"><span>Provincia</span><span class="tf-gratis">Gratis</span><span>En agencia Shalom</span></div>
      </div>
      <p class="tf-nota">El envío gratis vale cuando todo el carrito es de Chipao Tendencia.</p>
    </section>

    <section class="tf-seccion" id="tf-preguntas">
      <p class="tf-kicker">Preguntas</p>
      <h2>Lo que más nos preguntan</h2>
      <div class="tf-faq">${preguntas.map(([q, r], i) => `<details${i === 0 ? ' open' : ''}><summary>${q}</summary><p>${r}</p></details>`).join('')}</div>
    </section>

    <section class="tf-cierre">
      <h2>${escapeHtml(p.name)}</h2>
      <p>${oferta ? `Hoy a ${fmt(p.price)} en vez de ${fmt(p.old)}.` : `A ${fmt(p.price)}.`} Envío gratis por Shalom.</p>
      <button type="button" class="tf-cierre-btn" ${agotado ? 'disabled' : ''} onclick="tendAgregar(${p.id}, this)">${agotado ? 'Agotado' : 'Agregar al carrito'}</button>
    </section>

    ${agotado ? '' : `<div class="tf-barra" id="tfBarra">
      <div class="tf-barra-precio"><b>${fmt(total)}</b>${ahorro ? `<s>${fmt(p.old * cant)}</s>` : ''}</div>
      <button type="button" class="tend-agregar" onclick="tendAgregar(${p.id}, this)">Agregar al carrito</button>
    </div>`}
  </div>`;
}
/* Ficha "solo imágenes" (#solo-imagenes en la descripción, 21-11-2026): las
   fotos del producto una debajo de otra, a todo el ancho, y un único botón
   fijo abajo. El botón abre una hoja con los packs (#pack) y de ahí va al
   carrito; si el producto no tiene packs, va directo al carrito. */
function packsFicha(p){
  const maxCant = Math.max(1, Math.min(p.stock || 1, 20));
  return [1].concat(Object.keys(packsDe(p)).map(Number).sort((a, b) => a - b)).filter(n => n <= maxCant);
}
function renderTendenciaImagenes(p){
  const fotos = p.images || [];
  const videos = videosDe(p);
  const agotado = (p.stock || 0) <= 0;
  const cants = packsFicha(p);
  if(cants.indexOf(tendFicha.cant) < 0) tendFicha.cant = cants[1] || 1;
  const sello = n => cants.length < 3 ? '' : n === cants[1] ? 'Más vendido' : n === cants[cants.length - 1] ? 'Mayor ahorro' : '';
  const tarjetas = cants.map(n => {
    const t = totalLinea(p, n);
    const antes = Math.max(p.old || 0, p.price) * n;
    const s = sello(n);
    const nota = [antes > t ? 'Ahorras ' + fmt(antes - t) : '', t >= ENVIO_GRATIS_TENDENCIA ? 'Envío gratis' : ''].filter(Boolean).join(' · ');
    return `<button type="button" class="ti-pack${n === tendFicha.cant ? ' sel' : ''}" data-n="${n}" data-total="${fmt(t)}"
        aria-pressed="${n === tendFicha.cant}" onclick="tiPack(${n})">
        ${s ? `<span class="ti-sello">${s}</span>` : ''}
        <span class="ti-radio" aria-hidden="true"></span>
        <span class="ti-pack-txt"><b>${n === 1 ? '1 unidad' : n + ' unidades'}</b>${nota ? `<small>${nota}</small>` : ''}</span>
        <span class="ti-pack-precio"><b>${fmt(t)}</b>${antes > t ? `<s>${fmt(antes)}</s>` : ''}</span>
      </button>`;
  }).join('');
  return `<div class="app-shell tendencia ti-pagina">
    <h1 class="oculto-visual">${escapeHtml(p.name)}</h1>
    <div class="ti-tira">
      ${fotos.length ? fotos.map((u, i) => {
        const img = `<img src="${escapeHtml(fotoUrl(u, ANCHO_GALERIA))}" alt="${escapeHtml(p.name)} · imagen ${i + 1}"
        ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
        const v = videos[i];
        if(!v) return img;
        return `<div class="ti-marco">${img}<video class="ti-video" src="${escapeHtml(v.src)}" poster="${escapeHtml(v.poster)}"
          style="left:${v.izq}%;top:${v.arriba}%;width:${v.ancho}%;height:${v.alto}%"
          autoplay muted loop playsinline preload="metadata" aria-label="Video de envíos"></video></div>`;
      }).join('')
        : '<span class="tend-sinfoto" aria-hidden="true"></span>'}
    </div>
    <div class="ti-barra">
      <button type="button" class="ti-cta" ${agotado ? 'disabled' : ''} onclick="tiAbrir(${p.id})">${agotado ? 'Agotado' : '¡Pide el tuyo hoy!'}</button>
      <p>Pago con Yape · Envío por Shalom a todo el Perú</p>
    </div>
    ${agotado || cants.length < 2 ? '' : `<div class="ti-hoja" id="tiHoja" aria-hidden="true">
      <div class="ti-fondo" onclick="tiCerrar()"></div>
      <div class="ti-panel" role="dialog" aria-modal="true" aria-labelledby="tiTitulo">
        <button type="button" class="ti-x" onclick="tiCerrar()" aria-label="Cerrar">×</button>
        <p class="ti-kicker">Elige tu oferta</p>
        <h2 id="tiTitulo">${escapeHtml(p.name)}</h2>
        <div class="ti-packs">${tarjetas}</div>
        <button type="button" class="ti-seguir" id="tiSeguir" onclick="tiComprar(${p.id})">Continuar · ${fmt(totalLinea(p, tendFicha.cant))}</button>
        <p class="ti-pie">Pagas con Yape al finalizar · Recoges en la agencia Shalom que elijas</p>
      </div>
    </div>`}
  </div>`;
}
function tiAbrir(id){
  const hoja = document.getElementById('tiHoja');
  if(!hoja){ tendFicha.cant = 1; tiComprar(id); return; }
  hoja.classList.add('abierta');
  hoja.setAttribute('aria-hidden', 'false');
  document.body.classList.add('ti-sin-scroll');
  const sel = hoja.querySelector('.ti-pack.sel');
  if(sel) sel.focus();
}
function tiCerrar(){
  const hoja = document.getElementById('tiHoja');
  document.body.classList.remove('ti-sin-scroll');
  if(!hoja) return;
  hoja.classList.remove('abierta');
  hoja.setAttribute('aria-hidden', 'true');
}
/* Cambiar de pack no vuelve a pintar la página: solo marca la tarjeta y
   cambia el total del botón. */
function tiPack(n){
  tendFicha.cant = n;
  document.querySelectorAll('.ti-pack').forEach(b => {
    const si = Number(b.dataset.n) === n;
    b.classList.toggle('sel', si);
    b.setAttribute('aria-pressed', String(si));
    if(si){ const s = document.getElementById('tiSeguir'); if(s) s.textContent = 'Continuar · ' + b.dataset.total; }
  });
}
function tiComprar(id){
  const n = tendFicha.cant || 1;
  let ok = false;
  for(let i = 0; i < n; i++){ if(addToCart(id, null, null, true)) ok = true; else break; }
  tiCerrar();
  if(ok) goCart();
}
document.addEventListener('keydown', e => { if(e.key === 'Escape') tiCerrar(); });
function tendCant(n){
  tendFicha.cant = n;
  const y = window.scrollY;
  render();
  window.scrollTo(0, y);
}
/* Agrega la cantidad elegida de una vez y va al carrito. addToCart ya frena
   si se pasa del stock. */
function tendAgregar(id, btn){
  const n = tendFicha.cant || 1;
  let ok = false;
  for(let i = 0; i < n; i++){ if(addToCart(id, btn, null, true)) ok = true; else break; }
  if(ok) goCart();
}
/* La barra fija de abajo solo aparece cuando el botón principal ya no se ve. */
function vigilarBarraTendencia(){
  const cta = document.getElementById('tfCta');
  const barra = document.getElementById('tfBarra');
  if(!cta || !barra || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([e]) => {
    barra.classList.toggle('visible', !e.isIntersecting && e.boundingClientRect.top < 0);
  }).observe(cta);
}

function renderTendencia(){
  return `<div class="app-shell tendencia">
    <header class="tend-head">
      <h1>Chipao Tendencia</h1>
      <p>Envío gratis por Shalom y pago con Yape.</p>
    </header>
    <div class="tend-grid" id="tendGrid">${tendGridHtml()}</div>
  </div>`;
}

/* ======================================================================
   PANTALLAS DEL REDISEÑO MÓVIL: /buscar, /carrito, /checkout, /pedido/<id>

   Aquí solo se montan las rutas: cada una tiene su URL, responde al botón
   atrás y se puede compartir. El diseño definitivo de cada pantalla llega
   en su propia fase; mientras tanto el carrito sigue siendo el panel lateral
   de siempre y estas rutas lo abren en el estado que toca, para que la web
   nunca quede a medias durante la migración.

   Ninguna de las cuatro se indexa: el Worker las marca noindex,follow y no
   entran en el sitemap (ver RUTAS_DE_SESION en src/index.js).
   ====================================================================== */

const META_SESION = {
  buscar:   ['Buscar instrumentos | Chipao Music', 'Busca guitarras, ukeleles, cajones, teclados y accesorios en el catálogo de Chipao Music.'],
  carrito:  ['Tu carrito | Chipao Music', 'Revisa los instrumentos que agregaste antes de cerrar tu pedido.'],
  checkout: ['Finalizar pedido | Chipao Music', 'Elige cómo recibes tu pedido y con qué medio de pago quieres cerrarlo.'],
  pedido:   ['Tu pedido | Chipao Music', 'Sigue el estado de tu pedido en Chipao Music.'],
};
function aplicarMetaSesion(clave){
  const [titulo, desc] = META_SESION[clave];
  setPageMeta(titulo, desc);
  setBreadcrumbSchema(null);
}

function goSearch(push){
  state.view = 'search';
  navigateTo('/buscar', push);
  aplicarMetaSesion('buscar');
  render();
  /* El teclado debe salir solo: la pantalla existe para escribir. */
  const input = document.getElementById('buscarInput');
  if(input) input.focus();
}

/* Abre el panel del carrito sin tocar la URL (de eso se encargan las rutas). */
function goCart(push){
  state.view = 'carrito';
  state.orderPlaced = false;
  navigateTo('/carrito', push);
  aplicarMetaSesion('carrito');
  render();
  if(push !== false) window.scrollTo({top:0});
}

/* "Inició el pago" se mide UNA vez por pedido. Ir y volver entre el carrito y
   el pago es normal —se cambia el medio de pago, se corrige la dirección— y
   contar cada vuelta como una conversión le daría a Google un número inflado.
   El flag se reinicia al cerrar un pedido (ver cerrarPedido), para que la
   siguiente compra de la misma visita sí cuente. */
let pagoMedido = false;

function goCheckout(push){
  /* A pagar no se llega con el carrito vacío: sería un formulario sin nada
     que cobrar. Se manda al carrito, que ya sabe mostrar su estado vacío. */
  if(!state.cart.length){ goCart(push); return; }
  if(!pagoMedido){
    pagoMedido = true;
    trackAdsConversion('inicioPago', cartTotal());
  }
  state.view = 'checkout';
  state.orderPlaced = false;
  navigateTo('/checkout', push);
  aplicarMetaSesion('checkout');
  render();
  if(push !== false) window.scrollTo({top:0});
}

function goPedido(id, push){
  state.view = 'pedido';
  state.orderId = id;
  state.orderPlaced = true;
  navigateTo('/pedido/' + id, push);
  aplicarMetaSesion('pedido');
  /* Un pedido de Yape vive en el servidor: al entrar por la URL (recarga,
     atrás, enlace) se pregunta cómo va. Los de WhatsApp no existen allá. */
  if(RE_PEDIDO_YAPE.test(id) && !(state.pedidoYape && state.pedidoYape.id === id)){
    state.pedidoYape = { id, estado:'cargando' };
    render();
    cargarPedidoYape(id);
  } else {
    render();
    iniciarRelojYape();
  }
  if(push !== false) window.scrollTo({top:0});
}

/* Número de pedido que ve el cliente. No es un identificador de base de
   datos: el pedido de verdad se arma en la conversación de WhatsApp, y este
   código solo sirve para nombrarla de un lado y del otro. */
function nuevoNumeroPedido(){
  return 'CH-' + Math.floor(1000 + Math.random()*9000);
}

/* ---------------------------- /buscar ----------------------------
   Tres estados, como el handoff: en reposo (sugerencias y rangos de precio),
   con resultados (filas de 62px) y sin resultados (salida por WhatsApp).
   Filtra por nombre y por categoría, sin distinguir mayúsculas ni tildes, y
   en vivo con cada tecla. */
function sinTildes(str){
  return String(str).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
}
/* Busca por nombre, por categoría y por subcategoría. Lo tercero es lo que
   hace que "cuerda" encuentre las Ernie Ball y las D'Addario: sus nombres
   reales —"Super Slinky", "Nickel Wound EXL120", "XS Acustica 11-52"— no
   llevan esa palabra por ningún lado, pero todas están clasificadas en
   "Cuerdas (Eléctrica)" o "Cuerdas (Acústica/Clásica)".

   No se añade un campo de etiquetas al producto a propósito: la
   subcategoría ya dice lo mismo, se elige en el panel al dar de alta y no
   hay que acordarse de nada. Una etiqueta aparte sería un segundo sitio que
   mantener, y el día que se olvide, el producto desaparece del buscador sin
   que nadie lo note. Mismo motivo para no meter aquí la descripción: es
   texto libre y largo, y mete resultados que no vienen a cuento.

   De regalo, esto arregla búsquedas que antes no devolvían NADA aunque el
   producto estuviera en tienda: "capotraste", "metrónomo" y "caña". */
/* Palabras de unión. Se ignoran mientras quede algo más escrito, porque el
   cliente escribe "ukelele de concierto" y el producto puede llamarse
   "Ukelele Concierto" —o al revés— y un "de" de más no puede dejar la
   búsqueda en cero. */
const PALABRAS_VACIAS = new Set(['de','del','la','el','los','las','un','una','unos','unas','con','para','por','y','o','en','a','al']);

function palabrasDeBusqueda(q){
  const partes = sinTildes(q).trim().split(/\s+/).filter(Boolean);
  const utiles = partes.filter(w => !PALABRAS_VACIAS.has(w));
  /* Si alguien busca solo "para", se busca "para". */
  return utiles.length ? utiles : partes;
}

/* Todo el texto por el que se puede llegar a un producto: su nombre, su
   categoría, su subcategoría y los colores que traen sus fotos. Lo tercero es
   lo que hace que "cuerda" encuentre las Ernie Ball, cuyo nombre real no
   lleva esa palabra; lo último, que "guitarra roja" encuentre la que tiene
   una foto en rojo. */
function textoBuscable(p){
  const cat = CATEGORIES.find(c=>c.key===p.cat);
  const sub = cat && cat.subs.find(s=>s.key===p.sub);
  return sinTildes([p.name, cat && cat.label, sub && sub.label, ...coloresDeProducto(p)]
    .filter(Boolean).join(' '));
}

/* Cómo lo escribe la gente → cómo se llama en el catálogo.

   Cada línea existe porque la tienda TIENE eso con otro nombre. Mandar una
   palabra a algo que no hay sería peor que devolver cero: el cero al menos
   ofrece preguntar por WhatsApp, y un resultado equivocado hace quedar tonta
   a la tienda. Por eso no están "batería", "cajón" ni "trompeta", que hoy no
   hay: esas tienen que seguir dando cero.

   - vossex/menphis: así estuvieron escritas en esta web durante meses, y
     Google puede tenerlas indexadas así.
   - ukulele: es la grafía inglesa y la usa muchísima gente.
   - piano/órgano/keyboard: quien busca eso quiere el teclado.
   - plumilla/pick: la púa, fuera de Perú.
   - aceite: el limpiador de diapasón se llama "Lemon Oil" en la caja. */
const EQUIVALENCIAS = {
  vossex:'vozzex', menphis:'memphis', ukulele:'ukelele',
  piano:'teclado', organo:'teclado', keyboard:'teclado',
  plumilla:'pua', pick:'pua', aceite:'oil',
  guitar:'guitarra', tuner:'afinador', strings:'cuerda',
};

/* "roja" y "rojo" son el mismo color, y en el catálogo está guardado con una
   sola de las dos formas. COLOR_WORDS ya conoce las dos. */
function variantesDePalabra(w){
  const salida = [w];
  const color = COLOR_WORDS[w];
  if(color) salida.push(sinTildes(color));
  const equivalente = EQUIVALENCIAS[w];
  if(equivalente) salida.push(equivalente);
  return salida;
}

function coincide(texto, w){
  return variantesDePalabra(w).some(v => texto.includes(v));
}

/* Cuántos retoques hacen falta para convertir una palabra en otra: cambiar
   una letra, quitarla o añadirla cuenta uno. Se corta en cuanto pasa del
   máximo, que es lo único que interesa saber. Es Levenshtein de toda la
   vida, con una sola fila en memoria. */
function distanciaPalabra(a, b, max){
  if(Math.abs(a.length - b.length) > max) return max + 1;
  let fila = Array.from({length: b.length + 1}, (_, i) => i);
  for(let i = 1; i <= a.length; i++){
    let anterior = fila[0];
    fila[0] = i;
    let mejorDeLaFila = fila[0];
    for(let j = 1; j <= b.length; j++){
      const guardado = fila[j];
      fila[j] = a[i-1] === b[j-1]
        ? anterior
        : 1 + Math.min(anterior, fila[j], fila[j-1]);
      anterior = guardado;
      if(fila[j] < mejorDeLaFila) mejorDeLaFila = fila[j];
    }
    if(mejorDeLaFila > max) return max + 1;
  }
  return fila[b.length];
}

/* Cuánto se le perdona a un par de palabras, medido por la más larga de las
   dos: "gitarra" contra "guitarras" son dos retoques -falta una letra y sobra
   la del plural- y midiendo solo lo escrito se quedaba en uno, con lo que las
   guitarras de verdad no ganaban a los accesorios "para guitarra".

   Por debajo de cinco letras no se perdona nada: entre "mazo" y "bajo" hay un
   solo retoque y son dos productos distintos.

   Y los dos retoques solo se dan a partir de nueve letras. Con ocho ya se
   llegaba de una palabra a otra que no tiene nada que ver: buscar "parlante"
   devolvía un soporte de pared, un atril y un pedestal, porque su
   subcategoría se llama "parantes" y de una a otra hay exactamente dos
   cambios. Cuanto más larga es la palabra, menos probable es ese salto. */
function erratasPermitidas(a, b){
  const largo = Math.max(a.length, b.length);
  if(largo < 5) return 0;
  return largo <= 8 ? 1 : 2;
}

/* La misma comparación, pero perdonando erratas. Se prueba palabra a palabra
   del texto del producto, no contra el texto entero: "gitarra" tiene que
   parecerse a "guitarra", no al párrafo completo. */
/* Las etiquetas del catalogo van en plural -"Violines", "Guitarras"- y el
   cliente escribe en singular. Con una errata encima, la distancia se dispara:
   de "biolin" a "violines" hay tres retoques. Se prueba tambien la forma sin
   la terminacion de plural. */
function formasDePalabra(t){
  const singular = t.replace(/(es|s)$/, "");
  return singular !== t && singular.length >= 4 ? [t, singular] : [t];
}

function coincideConErratas(palabrasTexto, w){
  return variantesDePalabra(w).some(v =>
    palabrasTexto.some(t => formasDePalabra(t).some(f => {
      const max = erratasPermitidas(v, f);
      return max > 0 && distanciaPalabra(v, f, max) <= max;
    })));
}

/* Si una búsqueda no encuentra NADA, se repite perdonando erratas: "gitarra",
   "bonbo" o "ukulele" —que es como lo escribe media Lima— acababan en "Nada
   con eso" y en el botón de WhatsApp.

   Solo cuando no hay nada exacto, nunca antes: mezclar aproximados con
   exactos ensucia una búsqueda que ya funcionaba. */
let busquedaAproximada = false;

/* Qué tan de lleno es el producto lo que se busca. Cuanto más bajo, más
   arriba sale.

   Existe porque "guitarra" devolvía veinte cosas en el orden del catálogo, y
   ahí arriba caían la cejilla, dos juegos de cuerdas y un sistema inalámbrico
   "para Guitarra": de las cinco filas del desplegable, una sola era una
   guitarra. Un accesorio se llama "para X" y el instrumento ES X, y eso es
   justo lo que se mide aquí. */
function relevanciaBusqueda(p, palabras, frase, aprox){
  const cat = CATEGORIES.find(c=>c.key===p.cat);
  const sub = cat && cat.subs.find(s=>s.key===p.sub);
  const etiquetas = sinTildes([cat && cat.label, sub && sub.label].filter(Boolean).join(' '));
  /* Con errata hay que comparar como se filtró, o el orden no aplica a nada:
     "gitarra" no nombra exactamente la subcategoría "Guitarras" y todas las
     guitarras caían al montón del final, con los accesorios por delante. */
  const enTexto = (texto, w) => aprox
    ? coincideConErratas(texto.split(/[^a-z0-9]+/).filter(Boolean), w)
    : coincide(texto, w);
  /* 0 — ES eso: alguna de las palabras nombra su categoría o su subcategoría. */
  if(palabras.some(w => enTexto(etiquetas, w))) return 0;
  const nombre = sinTildes(p.name);
  /* Con errata no hay frase que buscar entera: se salta a mirar si están
     todas las palabras en el nombre. */
  if(aprox) return palabras.every(w => enTexto(nombre, w)) ? 3 : 4;
  const i = nombre.indexOf(frase);
  /* 1 — el nombre empieza por lo que se escribió ("Guitarra Acustica Vozzex"). */
  if(i === 0) return 1;
  /* 2 — lo lleva entero más adelante, como palabra suelta. Se mira el
     carácter de antes en vez de usar una expresión regular porque el término
     lo escribe el cliente y puede traer barras, puntos o paréntesis. */
  if(i > 0 && /[^a-z0-9]/.test(nombre[i-1])) return 2;
  /* 3 — están todas las palabras en el nombre, aunque separadas. */
  if(palabras.every(w => coincide(nombre, w))) return 3;
  /* 4 — coinciden, pero repartidas entre el nombre, la categoría y el color. */
  return 4;
}

/* Se busca por palabras sueltas y tienen que estar TODAS, no la frase entera
   de una pieza: escrito así, "ukelele concierto" no encontraba el "Ukelele de
   Concierto con Funda" —sobraba un "de"— y cualquier búsqueda de dos palabras
   caía en "Nada con eso" y en el botón de WhatsApp. */
function buscarProductos(q){
  const frase = sinTildes(q).trim();
  busquedaAproximada = false;
  if(!frase) return [];
  const palabras = palabrasDeBusqueda(q);
  let encontrados = PRODUCTS.filter(p=>{
    const texto = textoBuscable(p);
    return palabras.every(w => coincide(texto, w));
  });
  if(!encontrados.length){
    encontrados = PRODUCTS.filter(p=>{
      const palabrasTexto = textoBuscable(p).split(/[^a-z0-9]+/).filter(Boolean);
      return palabras.every(w => coincideConErratas(palabrasTexto, w));
    });
    busquedaAproximada = encontrados.length > 0;
  }
  /* A igual relevancia, lo que hay en tienda antes que lo agotado, y a igual
     stock se respeta el orden del catálogo. */
  return encontrados
    .map((p, orden) => ({ p, orden, r: relevanciaBusqueda(p, palabras, frase, busquedaAproximada) }))
    .sort((a, b) => a.r - b.r
                 || ((b.p.stock||0) > 0) - ((a.p.stock||0) > 0)
                 || a.orden - b.orden)
    .map(x => x.p);
}

/* Escribir el nombre de un instrumento y dar Enter lleva a su sección: "guitarras"
   abre las guitarras, "cajón" los cajones, "percusión" toda Percusión. Solo
   cuando lo escrito ES una categoría o subcategoría; "guitarra vozzex" o
   cualquier otra cosa sigue yendo al producto. Devuelve {cat, subs} o null.

   Se compara por palabra, con singular y plural indistintos ("cajon" =
   "cajones", "ukelele" = "ukeleles"). Primero se miran las categorías y luego
   las subcategorías; si lo escrito cae en varias categorías (violín está en
   Cuerda y en Accesorios) gana la que tiene más subcategorías coincidentes y,
   a igualdad, la que va primero en CATEGORIES. */
const ALIAS_SECCION = {
  electroacusticos: ['guitarra', 'guitarras'],
  charangos: ['charango', 'charangos'],
  interfaces: ['interfaz'],
};
function formasSeccion(w){
  const f = new Set([w]);
  if(w.length > 3 && w.endsWith('s')) f.add(w.slice(0, -1));
  if(w.length > 4 && w.endsWith('es')) f.add(w.slice(0, -2));
  return f;
}
function seccionDeBusqueda(q){
  const palabras = palabrasDeBusqueda(q).filter(w => !/^instrumentos?$/.test(w));
  if(!palabras.length) return null;
  const tokens = texto => sinTildes(texto).split(/[^a-z0-9]+/).filter(Boolean);
  const todasEn = (listaTokens) => {
    const formas = new Set();
    listaTokens.forEach(t => formasSeccion(t).forEach(x => formas.add(x)));
    return palabras.every(w => [...formasSeccion(w)].some(x => formas.has(x)));
  };
  const porCat = CATEGORIES.find(c => todasEn(tokens(c.seo ? c.label + ' ' + c.seo : c.label)));
  if(porCat) return { cat: porCat, subs: [] };
  let mejor = null;
  for(const c of CATEGORIES){
    const subs = c.subs.filter(s => todasEn(tokens(s.label).concat(ALIAS_SECCION[s.key] || [])));
    if(!subs.length) continue;
    /* A igualdad, la subcategoría más concreta: "baquetas" es "Baquetas y
       parches" (Accesorios) antes que "Claves, baquetas y percusión". */
    const largo = subs.reduce((n, s) => n + tokens(s.label).length, 0);
    if(!mejor || subs.length > mejor.subs.length || (subs.length === mejor.subs.length && largo < mejor.largo)) mejor = { cat: c, subs, largo };
  }
  return mejor && { cat: mejor.cat, subs: mejor.subs.map(s => s.key) };
}
function irASeccionDeBusqueda(q){
  const s = seccionDeBusqueda(q);
  if(!s) return false;
  goShop(s.cat.key, s.subs.length === 1 ? s.subs[0] : undefined);
  if(s.subs.length > 1){ state.activeSubs = new Set(s.subs); render(); }
  return true;
}

/* Rangos de precio del handoff. Los conteos salen del catálogo en cada
   render, así que no se quedan viejos cuando cambian los precios. */
/* Texto propio de la pantalla de ofertas, hermano del `intro` de cada
   categoría. */
const INTRO_OFERTAS = "Instrumentos y accesorios con descuento sobre el precio de tienda. El precio tachado es el de antes y el rebajado es el que pagas: no hay cupón que meter ni nada que activar en el carrito.";

const RANGOS_PRECIO = [
  { key:'bajo',  label:'Menos de S/ 100', min:0,   max:100 },
  { key:'medio', label:'S/ 100 a S/ 300', min:100, max:300 },
  { key:'alto',  label:'Más de S/ 300',   min:300, max:Infinity },
];
function productosDelRango(key){
  const r = RANGOS_PRECIO.find(x=>x.key===key);
  if(!r) return [];
  return PRODUCTS.filter(p => p.price >= r.min && p.price < r.max);
}

/* "Lo más buscado" no sale de ninguna analítica —no la hay—, así que es una
   lista escrita a mano... pero filtrada contra el catálogo real: un chip que
   lleva a "no hay nada" es peor que no ponerlo. De los seis del handoff,
   "cajón" se cae porque hoy no hay cajones cargados; detrás van términos de
   reserva para que la fila no quede coja. */
const BUSQUEDAS_CANDIDATAS = [
  'ukelele', 'cajón', 'kalimba', 'violín', 'flauta dulce', 'pandereta',
  'guitarra', 'micrófono', 'cuerdas', 'afinador',
];
function sugerenciasDeBusqueda(){
  const vivas = [];
  for(const t of BUSQUEDAS_CANDIDATAS){
    if(vivas.length >= 6) break;
    if(buscarProductos(t).length) vivas.push(t);
  }
  return vivas;
}

/* Fila de resultado: 62px de alto, como pide el handoff. */
function filaResultado(p){
  const href = hrefProducto(p);
  const foto = (p.images || [])[0];
  const stock = p.stock || 0;
  return `
  <a class="fila-res" href="${href}" onclick="openProductDetail(${p.id});return false;">
    <span class="fila-thumb">
      ${foto
        ? `<img src="${fotoUrl(foto, ANCHO_MINIATURA)}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async">`
        : iconSvg(iconFor(p))}
    </span>
    <span class="fila-texto">
      <span class="fila-nombre">${escapeHtml(p.name)}</span>
      <span class="fila-linea">
        <span class="fila-precio">${fmt(p.price)}</span>
        <span class="fila-stock${stock>0?'':' agotado'}">${stock>0?'En tienda':'Agotado'}</span>
      </span>
    </span>
    <span class="fila-chevron">›</span>
  </a>`;
}

function resultadosBusquedaHtml(){
  const q = state.searchQuery.trim();

  /* Un rango de precio elegido se comporta como una búsqueda más: enseña sus
     productos con el mismo listado. */
  if(!q && state.searchRango){
    const r = RANGOS_PRECIO.find(x=>x.key===state.searchRango);
    const res = productosDelRango(state.searchRango).sort((a,b)=>a.price-b.price);
    return `
      <div class="res-cabecera">
        <span class="search-count">${res.length} ${res.length===1?'resultado':'resultados'}</span>
        <button type="button" class="res-quitar" onclick="limpiarRango()">${escapeHtml(r.label)} ✕</button>
      </div>
      <div class="lista-res">${res.map(filaResultado).join('')}</div>`;
  }

  /* En reposo: sugerencias y rangos. */
  if(!q){
    const sugerencias = sugerenciasDeBusqueda();
    return `
      <div class="buscar-eyebrow">Lo más buscado</div>
      <div class="sugerencias">
        ${sugerencias.map(t=>`<button type="button" class="sugerencia" onclick="usarSugerencia('${escapeHtml(t)}')">${escapeHtml(t)}</button>`).join('')}
      </div>
      <div class="buscar-eyebrow" style="margin-top:26px;">Por precio</div>
      <div class="rangos">
        ${RANGOS_PRECIO.map(r=>{
          const n = productosDelRango(r.key).length;
          return `<button type="button" class="rango" onclick="usarRango('${r.key}')">
            <span class="rango-label">${escapeHtml(r.label)}</span>
            <span class="rango-n">${n} producto${n!==1?'s':''}</span>
          </button>`;
        }).join('')}
      </div>`;
  }

  const res = buscarProductos(q);

  /* Sin resultados. */
  if(!res.length){
    return `
      <div class="buscar-vacio">
        <div class="vacio-titulo">Nada con “${escapeHtml(q)}”</div>
        <p>Puede que lo tengamos en tienda sin publicar. Pregúntale al asesor.</p>
        <a class="btn-app verde" target="_blank" rel="noopener"
           href="${waHref('Hola, busco ' + q + '. ¿Lo tienen en tienda?')}"
           onclick="trackAdsConversion('whatsapp')">Preguntar por WhatsApp</a>
      </div>`;
  }

  /* Cuando lo que se enseña son parecidos y no coincidencias, hay que
     decirlo: si no, parece que la tienda entendió otra cosa. */
  const conteo = busquedaAproximada
    ? `Nada exacto con "${escapeHtml(q)}" · ${res.length} parecido${res.length===1?'':'s'}`
    : `${res.length} ${res.length===1?'resultado':'resultados'}`;
  return `
    <span class="search-count">${conteo}</span>
    <div class="lista-res">${res.map(filaResultado).join('')}</div>`;
}

/* Solo se repinta la lista: si se repintara la pantalla entera, el input
   perdería el foco y el teclado se cerraría en cada tecla. */
function pintarResultados(){
  const cont = document.getElementById('buscarResultados');
  if(cont) cont.innerHTML = resultadosBusquedaHtml();
}

function onBuscarInput(val){
  state.searchQuery = val;
  /* Escribir manda sobre el rango elegido: son dos formas de filtrar lo
     mismo y tener las dos puestas a la vez confunde. */
  if(val.trim()) state.searchRango = null;
  pintarResultados();
}

function usarSugerencia(texto){
  state.searchQuery = texto;
  state.searchRango = null;
  const input = document.getElementById('buscarInput');
  if(input){ input.value = texto; input.focus(); }
  pintarResultados();
}

function usarRango(key){
  state.searchRango = key;
  state.searchQuery = '';
  const input = document.getElementById('buscarInput');
  if(input) input.value = '';
  pintarResultados();
  window.scrollTo({top:0, behavior:'smooth'});
}

function limpiarRango(){
  state.searchRango = null;
  pintarResultados();
}

function renderSearch(){
  return `
  <div class="app-shell">
    <header class="app-head buscar">
      <div class="buscar-fila">
        <span class="buscar-caja">
          ${iconSvg('search')}
          <input id="buscarInput" type="search" autocomplete="off" enterkeyhint="search"
                 placeholder="Buscar instrumento o marca"
                 value="${escapeHtml(state.searchQuery)}"
                 oninput="onBuscarInput(this.value)"
                 onkeydown="if(event.key==='Enter' && irASeccionDeBusqueda(this.value)){ event.preventDefault(); this.blur(); }">
        </span>
        <button type="button" class="buscar-cerrar" onclick="goHome()">Cerrar</button>
      </div>
    </header>
    <div id="buscarResultados">${resultadosBusquedaHtml()}</div>
  </div>`;
}

function enOferta(p){ return Boolean(p.old && p.old > p.price); }
function pctDescuento(p){ return Math.round((1 - p.price/p.old) * 100); }

function productosDeCategoria(catKey){
  return PRODUCTS.filter(p => productInCat(p, catKey));
}


/* La tienda abre todos los días de 9:30 a 21:00. Decirlo en tiempo real evita
   el "abierto hasta las 9:00 p.m." a las dos de la mañana. Se calcula sobre
   la hora de Lima (UTC-5, sin horario de verano) para que no dependa de cómo
   tenga configurado el reloj el teléfono de quien mira. */
function estadoTienda(){
  const ahora = new Date();
  const lima = new Date(ahora.getTime() + (ahora.getTimezoneOffset() - 300) * 60000);
  const minutos = lima.getHours()*60 + lima.getMinutes();
  return (minutos >= 570 && minutos < 1260) ? 'abierto hasta 9:00 p.m.' : 'abrimos 9:30 a.m.';
}

function waHref(texto){
  return `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

/* Cabecera del asesor: el mismo pill verde en la portada y en el catálogo,
   para que WhatsApp esté siempre a un toque sin necesidad del botón flotante
   que antes tapaba el contenido. */
function pillAsesorHtml(){
  return `<a class="pill-asesor" target="_blank" rel="noopener"
    href="${waHref('Hola, quiero hablar con un asesor.')}"
    onclick="trackAdsConversion('whatsapp')">
    <span class="ico-wa">${iconWhatsapp}</span>Asesor</a>`;
}

/* --------------------------- tarjeta de producto ---------------------------
   Una sola tarjeta para las tres listas (ofertas, recién llegados y el grid
   del catálogo); lo único que cambia entre ellas es el alto de la foto, que
   el handoff fija en 124, 116 y 118px. */
/* Los colores de un producto salen del nombre de archivo de sus fotos (ver
   colorFromImageUrl), así que no hay nada que cargar a mano: el que tiene
   seis fotos con color tiene seis colores. Se quitan los repetidos porque
   algún producto sube dos veces el mismo color. */
function coloresDeProducto(p){
  return [...new Set((p.images || []).map(colorFromImageUrl).filter(Boolean))];
}

const MAX_PUNTOS_COLOR = 5;

/* Una variante es "color" si tiene tono conocido; si no (Diseño 1...), es otra cosa. */
function esDiseno(label){ return /^Diseño /.test(label || ''); }
function palabraVariante(labels){ return labels.some(esDiseno) ? 'Diseño' : 'Color'; }

/* Que el producto viene en varios colores no se decía en ninguna parte de la
   tarjeta: había que entrar a la ficha para enterarse, y ocho productos del
   catálogo no lo dicen ni siquiera en el nombre. Con un solo color no se
   pinta: un punto suelto no informa de nada. */
function puntosColorHtml(p){
  const colores = coloresDeProducto(p);
  if(colores.length < 2) return '';
  return `
    <div class="pcard-colores">
      ${colores.filter(c => !esDiseno(c)).slice(0, MAX_PUNTOS_COLOR).map(c => `<span class="pcolor" style="background:${COLOR_HEX[c] || '#ccc'}" title="${escapeHtml(c)}"></span>`).join('')}
      <span class="pcolor-texto">${colores.length} ${colores.some(esDiseno) ? 'diseños' : 'colores'}</span>
    </div>`;
}

/* Etiquetas de las guitarras, escritas a mano por id: el catálogo no trae el
   tipo de cuerda ni el nivel como campo, y adivinarlo del texto dejaría
   guitarras sin etiqueta o con la equivocada. El estuche no va aquí porque ya
   sale en la tarjeta ("Incluye estuche"). Una guitarra que no está en la
   tabla simplemente no lleva etiqueta; para sumar o corregir una, se edita
   su línea. 'destacada' pinta la etiqueta en verde. */
const ETIQUETAS_GUITARRA = {
  2:   ['Para empezar', 'Cuerdas de nylon'],
  234: ['Cuerdas de nylon', 'Profesional'],
  237: ['Cuerdas de metal', 'Jumbo'],
  238: ['Para empezar'],
  239: ['Para empezar'],
  240: ['Cuerdas de metal', 'Jumbo'],
  241: ['Para empezar'],
  242: ['Para empezar', 'Cuerdas de nylon'],
  243: ['Para empezar'],
  252: ['Floyd Rose'],
};
/* Las dos opciones de la guía. 'Para empezar' es una etiqueta de la tabla;
   'Con más experiencia' no lo es: son las guitarras que NO llevan 'Para
   empezar' (ver pasaFiltros), así que no hay que etiquetarlas una por una. */
const ETIQUETA_EXPERIENCIA = 'Con más experiencia';
const GUIA_GUITARRAS = [
  { etiqueta:'Para empezar',          texto:'Fáciles de tocar y con precio accesible' },
  { etiqueta:ETIQUETA_EXPERIENCIA,    texto:'Si ya tocas y quieres más sonido' },
];
const SUBS_GUITARRA = ['guitarras', 'guitarrasElectricas', 'electroacusticos'];
function etiquetasDeGuitarra(p){ return ETIQUETAS_GUITARRA[p.id] || []; }
function etiquetasHtml(p){
  const et = etiquetasDeGuitarra(p).slice(0, 2);
  if(!et.length) return '';
  return `<div class="pcard-etiquetas">${et.map(t =>
    `<span class="pcard-etiqueta${t==='Para empezar'?' destacada':''}">${escapeHtml(t)}</span>`).join('')}</div>`;
}
/* La guía solo aparece en las pantallas de guitarras. */
function guiaGuitarrasHtml(){
  if(state.activeCat !== 'cuerda' || !state.activeSubs.size) return '';
  if(![...state.activeSubs].every(k => SUBS_GUITARRA.includes(k))) return '';
  return `
  <section class="guia-guitarras" aria-label="Cuál guitarra elegir">
    <div class="guia-titulo">¿Cuál guitarra elegir?</div>
    <div class="guia-sub">Toca una opción y te enseñamos solo esas. Si dudas, escríbenos y te recomendamos.</div>
    <div class="guia-opciones">
      ${GUIA_GUITARRAS.map(o => `
      <button type="button" class="guia-op${state.etiqueta===o.etiqueta?' activo':''}"
        aria-pressed="${state.etiqueta===o.etiqueta?'true':'false'}"
        onclick="toggleEtiqueta('${o.etiqueta}')"><b>${o.etiqueta}</b><span>${o.texto}</span></button>`).join('')}
    </div>
  </section>`;
}
function toggleEtiqueta(t){ state.etiqueta = state.etiqueta === t ? null : t; render(); }

/* Al entrar el ratón en una tarjeta se baja su segunda foto; cuando carga se
   le pone .lista y el CSS la funde sobre la primera. */
document.addEventListener('mouseover', e => {
  const t = e.target.closest && e.target.closest('.pcard');
  const img = t && t.querySelector('img.pcard-foto2[data-src]');
  if(!img) return;
  img.addEventListener('load', () => img.classList.add('lista'), {once:true});
  img.src = img.getAttribute('data-src');
  img.removeAttribute('data-src');
});

/* Las primeras tarjetas de una categoría se ven sin hacer scroll: van sin
   loading="lazy" (que las hacía esperar a que el navegador calculara la
   página) y las dos primeras con prioridad alta. El Worker les pone además un
   <link rel="preload"> en el <head> con la MISMA URL (ver primerasTarjetas y
   scriptPrecarga en src/index.js): si cambias este número, cámbialo también allí. */
const TARJETAS_PRIORITARIAS = 4;
function atributosFotoTarjeta(i){
  if(i == null || i >= TARJETAS_PRIORITARIAS) return 'loading="lazy"';
  return i < 2 ? 'fetchpriority="high"' : '';
}

function appProductCard(p, altoFoto, conAgregar, posicion){
  const href = hrefProducto(p);
  const foto = (p.images || [])[0];
  const stock = p.stock || 0;
  const puntos = puntosColorHtml(p);
  const tarjeta = `
  <a class="pcard" href="${href}" onclick="openProductDetail(${p.id});return false;">
    <div class="pcard-foto" style="height:${altoFoto}px">
      ${foto
        ? `<img src="${fotoUrl(foto, ANCHO_TARJETA)}" alt="${escapeHtml(p.name)}" ${atributosFotoTarjeta(posicion)} decoding="async">`
        : `<span class="pcard-sinfoto">${iconSvg(iconFor(p))}</span>`}
      ${foto && (p.images || [])[1] ? `<img class="pcard-foto2" data-src="${fotoUrl(p.images[1], ANCHO_TARJETA)}" alt="" decoding="async">` : ''}
      ${enOferta(p) ? `<span class="pcard-off">-${pctDescuento(p)}%</span>` : ''}
    </div>
    <div class="pcard-nombre">${escapeHtml(p.name)}</div>
    ${etiquetasHtml(p)}
    ${puntos}
    <div class="pcard-precios">
      <span class="pcard-precio">${fmt(p.price)}</span>
      ${enOferta(p) ? `<span class="pcard-antes">${fmt(p.old)}</span>` : ''}
    </div>
    <div class="pcard-stock${stock>0?'':' agotado'}">${stock>0 ? 'En stock' + (incluyeEstuche(p) ? ' · Incluye estuche' : '') : 'Agotado'}</div>
  </a>`;

  /* El botón "Agregar" de la grilla de categoría (escritorio) va FUERA del
     enlace: un <button> dentro de un <a> es marcado inválido y rompe la
     navegación por teclado. Se posiciona sobre la esquina de la tarjeta, que
     es donde lo dibuja el handoff, y el envoltorio le da el `position`. */
  if(!conAgregar) return tarjeta;
  return `
  <div class="pcard-wrap">
    ${tarjeta}
    <button type="button" class="pcard-agregar"${stock>0?'':' disabled'}
      onclick="addToCart(${p.id}, this)">${stock>0 ? 'Agregar' : 'Agotado'}</button>
  </div>`;
}

/* ------------------------------ portada ------------------------------ */

/* Tile del carrusel de categorías. El handoff los dibuja como un bloque de
   color con una etiqueta monoespaciada que dice "foto: guitarras" — es un
   hueco para una foto de categoría que la tienda no tiene. En vez de
   inventarla, el bloque conserva su color (que sí es un token del diseño) y
   lleva el icono de la categoría del propio proyecto.

   El nombre y el subtítulo van debajo del bloque en las dos versiones: el
   handoff de escritorio dibuja la grilla 4×2 con el texto fuera, igual que
   el móvil, así que no hay razón para tener dos marcados. */
/* Producto que representa a la categoría en la portada de escritorio: el
   marcado como destacado y, si no hay ninguno, el más caro con stock, que
   suele ser también el más reconocible (la guitarra, el bombo, el Marshall).
   `usados` lleva la cuenta de los ya repartidos para que dos categorías que
   comparten producto —la melódica está en Viento y en Para Colegio— no
   acaben enseñando la misma foto una al lado de la otra. */
/* ======================================================================
   PORTADA ORIENTADA A VENTA  (handoff "Home full ventas")

   El diseño llegaba con productos inventados —cajón, teclado de 61 teclas,
   batería— que no están en el catálogo. Aquí cada bloque elige de lo que sí
   hay, con stock y con foto, así que la portada se mantiene sola cuando
   cambia el inventario. Ningún precio se escribe a mano: todos salen de D1.
   ====================================================================== */

/* Palancas para probar sin tocar código, como pide el handoff. El diseño
   trae líneas de cuotas en todas las tarjetas; la tienda no las ofrece
   todavía, así que nacen apagadas. Las de escasez sí, porque el stock es
   real y sale de la base. */
const FLAGS = { showCuotas: false, showStock: true, fichaPago: true };

/* Reseñas de Google pegadas al precio. Son de la tienda, no del producto, y
   por eso lo dice: el enlace lleva a la ficha de Maps para comprobarlas. */
function resenasFichaHtml(){
  return `
      <a class="ficha-resenas" href="${STORE_MAPS_LINK}" target="_blank" rel="noopener">
        <span class="ficha-resenas-estrellas" aria-hidden="true">★★★★★</span>
        <b>${String(STORE_RATING).replace('.', ',')}</b>
        <span>· ${STORE_REVIEW_COUNT} reseñas de la tienda en Google ›</span>
      </a>`;
}

/* Formas de pago bajo el precio de la ficha: las mismas que ofrece el checkout. */
function pagoFichaHtml(p){
  if(!FLAGS.fichaPago || !(p.price > 0)) return '';
  return `
      <div class="ficha-pago">
        <div class="ficha-pago-fila"><img class="ficha-pago-ico" src="/pagos/yape.png" alt="" width="26" height="26" loading="lazy">
          <span><strong>Paga con Yape</strong> en 2 minutos, sin salir de la web</span></div>
        <div class="ficha-pago-fila"><span class="ficha-pago-ico tarjeta">&#9645;</span>
          <span>También con <strong>Plin o transferencia</strong> por WhatsApp</span></div>
        <div class="ficha-pago-fila"><span class="ficha-pago-ico mp">MP</span>
          <span><strong>Paga con Mercado Pago</strong> con tarjeta Visa o Mastercard</span></div>
      </div>`;
}

/* Los accesorios quedan fuera de la portada a propósito: el rediseño existe
   justo para que la home deje de abrir con cuerdas y púas de S/ 10. */
function candidatosPortada(){
  return PRODUCTS.filter(x => (x.stock||0) > 0 && x.cat !== 'accesorios' && (x.images||[]).length);
}

/* El gancho: el destacado que esté en oferta; si no hay, el destacado a
   secas; y si tampoco, el de mayor ticket. */
function heroProducto(){
  const c = [...candidatosPortada()].sort((a,b) => b.price - a.price);
  return c.find(x => x.featured && enOferta(x)) || c.find(x => x.featured) || c[0] || null;
}

/* Las dos tarjetas junto al gancho cambian en cada visita. El sorteo se hace una
   vez por carga y se recuerda: con Math.random en cada repintado saltarían al
   agregar algo al carrito. */
let _secundariasIds = null;
function ofertasSecundarias(){
  const hero = heroProducto();
  const c = candidatosPortada().filter(x => !hero || x.id !== hero.id);
  if(!_secundariasIds || _secundariasIds.some(id => !c.some(x => x.id === id))){
    _secundariasIds = [...c].sort(() => Math.random() - .5).slice(0, 2).map(x => x.id);
  }
  return _secundariasIds.map(id => c.find(x => x.id === id));
}

/* Barajado estable: cambia cada día pero no en cada repintado. Con Math.random
   los cuatro productos saltarían al agregar algo al carrito. */
function barajaDelDia(lista){
  const dia = Math.floor(Date.now() / 864e5);
  return [...lista]
    .map(x => ({ x, k: Math.sin(x.id * 9301 + dia * 49297) }))
    .sort((a,b) => a.k - b.k)
    .map(o => o.x);
}

/* TODO: "Los más vendidos" es ahora mismo una selección al azar entre los
   instrumentos con stock — el sitio no guarda pedidos, así que no hay datos
   de ventas que ordenar. Reemplazar por los de verdad cuando existan. */
function vitrinaDestacados(){
  const fuera = new Set([heroProducto(), ...ofertasSecundarias()].filter(Boolean).map(x => x.id));
  return barajaDelDia(candidatosPortada().filter(x => !fuera.has(x.id))).slice(0, 4);
}

function topDescuentos(n){
  return PRODUCTS.filter(x => enOferta(x) && (x.stock||0) > 0)
    .sort((a,b) => pctDescuento(b) - pctDescuento(a))
    .slice(0, n);
}

/* Las rutas se arman sumando trozos y NO con una plantilla, aunque con
   plantilla se lea mejor.

   El motivo es de SEO: este sitio lleva su JavaScript dentro del HTML, y
   Google se lee ese script buscando enlaces. Una plantilla como
   "/producto/" + "${x.id}-${slugify(x.name)}" escrita de una pieza tiene
   forma de URL completa, así que la copia tal cual y la intenta rastrear:
   en Search Console aparecieron rastreadas rutas de ficha con la plantilla
   sin ejecutar dentro (la de p.id y una vieja de destacado.id), que dan 404.
   Ni siquiera se pueden escribir de ejemplo en este comentario: tendrian la
   misma forma y Google las copiaria igual.

   Partida en trozos, en el código no queda ninguna cadena con pinta de
   dirección, y lo único rastreable es el prefijo /producto/, que es una ruta
   de verdad. Si vuelves a escribir una ruta entera entre comillas, el error
   vuelve. */
function hrefProducto(x){ return '/producto/' + x.id + '-' + slugify(x.name); }
/* Todas las guitarras, acústicas y eléctricas, se entregan con estuche. */
const SUBS_CON_ESTUCHE = ['guitarras', 'guitarrasElectricas'];
function incluyeEstuche(p){ return SUBS_CON_ESTUCHE.includes(p.sub); }

function hrefCategoria(key){ return '/categoria/' + key; }
function hrefSubcategoria(key, sub){ return '/categoria/' + key + '/' + subSlug(sub); }
function fotoDe(x){ return (x.images||[])[0] || ''; }
function waProducto(x){ return waHref(`Hola, me interesa ${x.name} (${fmt(x.price)}). ¿Tienen stock?`); }

function imgProducto(x, extra){
  const f = fotoDe(x);
  return f
    ? `<img src="${fotoUrl(f, ANCHO_TARJETA)}" alt="${escapeHtml(x.name)}" ${extra||'loading="lazy"'} decoding="async">`
    : `<span class="sinfoto">${escapeHtml(x.name)}</span>`;
}

/* Línea de escasez o de beneficio. Roja bajo 5 unidades, verde cuando lo que
   hay que decir es bueno. Solo con stock real: nunca se inventa el número. */
function lineaStock(x){
  if(!FLAGS.showStock) return '';
  const n = x.stock || 0;
  if(n <= 0) return '';
  if(n <= 5) return `<span class="stock-linea escasez">Quedan ${n} en tienda</span>`;
  return `<span class="stock-linea bien">En stock · listo para recojo</span>`;
}

function badgeDescuento(x, clase){
  return enOferta(x) ? `<span class="badge-dto ${clase||''}">&minus;${pctDescuento(x)}%</span>` : '';
}

function catLabel(x){
  const c = CATEGORIES.find(k => k.key === x.cat);
  return c ? c.label : 'Instrumentos';
}

/* ---------------- barra de urgencia · chips ---------------- */
function chipsUrgenciaHtml(){
  return topDescuentos(3).map(x => `
    <a class="urg-chip" href="${hrefProducto(x)}" onclick="cerrarNavBuscar();openProductDetail(${x.id});return false;">
      <span class="urg-chip-foto">${imgProducto(x)}</span>
      <span class="urg-chip-nombre">${escapeHtml(x.name)}</span>
      <span class="urg-chip-precio">${fmt(x.price)}</span>
      <span class="urg-chip-dto">&minus;${pctDescuento(x)}%</span>
    </a>`).join('');
}

/* ---------------- hero de producto ---------------- */
/* ---------------- vitrina: la caja grande de la portada rota ----------------
   Arranca siempre en heroProducto() -el destacado en oferta-, que es lo que
   pinta la primera carga y lo que ve Google. Después, cada VITRINA_MS, pasa a
   otro instrumento con stock y foto, barajados y sin repetir hasta dar la
   vuelta. Las dos ofertas de al lado no se mueven y no entran en la ronda.

   Se para mientras el ratón está encima, un rato después de tocarla en el
   teléfono (para no cambiarle el producto justo cuando va a pulsar
   "Agregar"), cuando no se ve en pantalla o la pestaña está oculta, y no
   arranca con "reducir movimiento" activado. Solo cambia la caja, no
   repinta la página. */
const VITRINA_MS = 8000;
const VITRINA_TICK = 100;
const VITRINA_PAUSA_TOQUE = 8000;
const vitrina = { id:null, cola:[], transcurrido:0, encima:false, tocadaHasta:0, visible:true, timer:null, observador:null, precargada:null };

function vitrinaActual(){
  const c = candidatosPortada();
  return (vitrina.id && c.find(x => x.id === vitrina.id)) || heroProducto();
}

function colaVitrina(){
  const fijas = new Set(ofertasSecundarias().map(x => x.id));
  const actual = vitrinaActual();
  const lista = candidatosPortada().filter(x => !fijas.has(x.id) && (!actual || x.id !== actual.id));
  for(let i = lista.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista.map(x => x.id);
}

function siguienteVitrina(){
  if(!vitrina.cola.length) vitrina.cola = colaVitrina();
  const c = candidatosPortada();
  while(vitrina.cola.length){
    const x = c.find(p => p.id === vitrina.cola[0]);
    if(x) return x;
    vitrina.cola.shift();
  }
  return null;
}

function pausarVitrina(encima){ vitrina.encima = encima; }
function tocarVitrina(){ vitrina.tocadaHasta = Date.now() + VITRINA_PAUSA_TOQUE; }

function vitrinaPausada(){
  return vitrina.encima || Date.now() < vitrina.tocadaHasta || !vitrina.visible || document.hidden;
}

/* Se llama después de cada render(). Si la portada no está a la vista
   para el reloj; si está, lo arranca (una sola vez) y vigila si la caja se
   ve en pantalla. */
function montarVitrina(){
  const caja = document.getElementById('vitrina');
  if(!caja){
    clearInterval(vitrina.timer); vitrina.timer = null;
    return;
  }
  if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if(candidatosPortada().length < 4) return;
  if('IntersectionObserver' in window){
    if(vitrina.observador) vitrina.observador.disconnect();
    vitrina.observador = new IntersectionObserver(e => { vitrina.visible = e[0].isIntersecting; }, { threshold:0.3 });
    vitrina.observador.observe(caja);
  }
  pintarBarraVitrina();
  if(!vitrina.timer) vitrina.timer = setInterval(tickVitrina, VITRINA_TICK);
}

function pintarBarraVitrina(){
  const barra = document.getElementById('vitrinaBarra');
  if(barra) barra.style.width = Math.min(100, vitrina.transcurrido / VITRINA_MS * 100) + '%';
}

function tickVitrina(){
  if(vitrinaPausada()) return;
  vitrina.transcurrido += VITRINA_TICK;
  pintarBarraVitrina();
  /* La foto siguiente se baja un poco antes de su turno, para que aparezca
     de golpe y no con un hueco en blanco. */
  const falta = VITRINA_MS - vitrina.transcurrido;
  const sig = siguienteVitrina();
  if(sig && falta <= 2000 && vitrina.precargada !== sig.id){
    const f = fotoDe(sig);
    if(f){ const im = new Image(); im.src = fotoUrl(f, ANCHO_TARJETA); }
    vitrina.precargada = sig.id;
  }
  if(vitrina.transcurrido >= VITRINA_MS) cambiarVitrina();
}

function cambiarVitrina(){
  const caja = document.getElementById('vitrina');
  const sig = siguienteVitrina();
  vitrina.transcurrido = 0;
  if(!caja || !sig) return;
  vitrina.cola.shift();
  caja.classList.add('cambiando');
  setTimeout(() => {
    /* Cada producto ocupa un alto distinto (título de una o dos líneas,
       con o sin colores). La caja se queda con el mayor que ha tenido, para
       que lo de abajo no salte cada vez que cambia. */
    caja.style.minHeight = Math.max(caja.offsetHeight, parseFloat(caja.style.minHeight) || 0) + 'px';
    vitrina.id = sig.id;
    caja.innerHTML = ganchoHtml(sig, false);
    pintarBarraVitrina();
    caja.classList.remove('cambiando');
  }, 250);
}

/* En el teléfono la caja grande es una tarjeta horizontal (foto a la
   izquierda, datos a la derecha) y las dos ofertas de al lado bajan debajo
   de los más vendidos: la caja de antes ocupaba la primera pantalla entera y
   no se llegaba a ver ni una categoría. El marcado es el mismo; lo que cambia
   es la clase .compacta, que solo pone el CSS del teléfono. */
function heroVentasHtml(){
  const x = vitrinaActual();
  if(!x) return '';
  const movil = !esEscritorio();
  return `
  <section class="hero-venta${movil ? ' compacta' : ''}">
    <div class="hv-gancho" id="vitrina" onmouseenter="pausarVitrina(true)" onmouseleave="pausarVitrina(false)"
         ontouchstart="tocarVitrina()">
      ${ganchoHtml(x, true)}
    </div>
    ${movil ? '' : secundariasHtml()}
  </section>`;
}

/* Las dos ofertas fijas, en el teléfono, van solas y más abajo. */
function secundariasMovilHtml(){
  if(!ofertasSecundarias().length) return '';
  return `
  <section class="hero-venta secundarias-movil">
    <h2 class="sec-movil-titulo">Ofertas de la semana</h2>
    ${secundariasHtml()}
  </section>`;
}

/* ---------------- categorías de la portada (teléfono) ----------------
   Cuadrícula de 4 × 2 con la foto de un producto de cada categoría, al estilo
   de los círculos de Mercado Libre. Sustituye a los chips de texto de la
   cabecera: con ocho entradas caben todas a la vista, sin deslizar. La foto
   es la del destacado de la categoría o, si no hay, la del más caro con
   stock. `usados` evita repetir foto entre Viento y Para Colegio, que
   comparten la melódica. */
function fotoDeCategoria(catKey, usados){
  const lista = productosDeCategoria(catKey)
    .filter(p => (p.images||[]).length && !usados.has(p.id))
    .sort((a,b) => (b.featured?1:0) - (a.featured?1:0)
                || ((b.stock||0) > 0) - ((a.stock||0) > 0)
                || b.price - a.price);
  const p = lista[0];
  if(!p) return '';
  usados.add(p.id);
  return fotoUrl(fotoDe(p), ANCHO_MINIATURA);
}

/* Las fotos de la barra de categorías de escritorio, una por categoría.
   `usados` sale con los productos elegidos, para que la cuadrícula de la
   portada, que va debajo, enseñe OTRA foto de la misma categoría y no se
   vea la misma guitarra dos veces en la pantalla. */
function fotosBarraCategorias(usados){
  const fotos = {};
  CATEGORIES.forEach(c => { fotos[c.key] = fotoDeCategoria(c.key, usados); });
  return fotos;
}

/* Lo que hay dentro de cada categoría, en dos o tres palabras: el `desc`
   de CATEGORIES es para Google y no cabe debajo de un cuadro. */
const RESUMEN_CATEGORIA = {
  cuerda:'Guitarras, ukeleles', teclados:'Teclados y pianos', percusion:'Bombos, cajones',
  viento:'Flautas, melódicas', audio:'Micrófonos, amplis', colegio:'Lista escolar',
  accesorios:'Cuerdas, púas', packs:'Todo en uno'
};

/* La misma cuadrícula en el teléfono (4 × 2, nombres cortos) y en
   escritorio (una fila de 8, con el nombre completo y lo que hay dentro). */
function categoriasPortadaHtml(){
  const escritorio = esEscritorio();
  const cortos = {cuerda:'Cuerda', teclados:'Teclados', percusion:'Percusión',
                  viento:'Viento', audio:'Audio', colegio:'Colegio', accesorios:'Accesorios', packs:'Packs'};
  const ofertas = PRODUCTS.filter(x => enOferta(x) && (x.stock||0) > 0);
  const maxDto = ofertas.length ? Math.max(...ofertas.map(pctDescuento)) : 0;
  const usados = new Set();
  const fotosBarra = escritorio ? fotosBarraCategorias(usados) : {};

  const tiles = CATEGORIES
    .filter(c => productosDeCategoria(c.key).length)
    .map(c => {
      /* Si la categoría solo tiene un producto con foto, repite el de la barra. */
      const foto = fotoDeCategoria(c.key, usados) || fotosBarra[c.key];
      return `
      <a class="pc-tile" href="${hrefCategoria(c.key)}" onclick="goShop('${c.key}');return false;">
        <span class="pc-cuadro">${foto
          ? `<img src="${foto}" alt="" loading="lazy" decoding="async">`
          : iconSvg(ICON_BY_CAT[c.key] || 'tag')}</span>
        <span class="pc-nombre">${escapeHtml(escritorio ? c.label : (cortos[c.key] || c.label))}</span>
        ${escritorio && RESUMEN_CATEGORIA[c.key] ? `<span class="pc-resumen">${RESUMEN_CATEGORIA[c.key]}</span>` : ''}
      </a>`;
    }).join('');

  const tileOfertas = maxDto > 0 ? `
      <a class="pc-tile" href="/ofertas" onclick="goOffers();return false;">
        <span class="pc-cuadro oferta">−${maxDto}%</span>
        <span class="pc-nombre">Ofertas</span>
        ${escritorio ? `<span class="pc-resumen">${ofertas.length} productos</span>` : ''}
      </a>` : '';

  return `
  <section class="portada-cats">
    <header class="pc-head">
      <h2>${escritorio ? 'Compra por categoría' : 'Categorías'}</h2>
      <a href="/tienda" onclick="goShop(null);return false;">${escritorio ? 'Ver todo el catálogo ›' : 'Ver todo ›'}</a>
    </header>
    <div class="pc-grid">${tileOfertas}${tiles}</div>
  </section>`;
}

/* La franja de confianza del teléfono: tres ventajas en una sola fila. La
   de cinco celdas de escritorio ocupaba tres filas en la pantalla chica. */
function beneficiosMovilHtml(){
  const celdas = [
    ['store', 'Recojo en 1 hora'],
    ['truck', 'Envío a todo el Perú'],
    ['card',  'Yape y tarjeta'],
  ];
  return `<div class="beneficios-movil">${celdas.map(c => `
    <span>${iconSvg(c[0], 'aria-hidden="true"')}${escapeHtml(c[1])}</span>`).join('')}</div>`;
}

/* El contenido de la caja grande. 'primera' solo en la carga: esa foto es
   la más grande de la portada y va con prioridad alta; las que llegan
   después rotando ya están precargadas. */
function ganchoHtml(x, primera){
  const cuotas = FLAGS.showCuotas
    ? `<p class="hv-cuotas">o 3 cuotas sin interés de <strong>${fmt(Math.round(x.price/3))}</strong></p>` : '';
  const alerta = (FLAGS.showStock && (x.stock||0) > 0 && (x.stock||0) <= 5)
    ? `<p class="hv-alerta"><span class="punto-alerta"></span>Últimas ${x.stock} unidades en tienda</p>` : '';

  return `
      <span class="hv-badges">
        ${badgeDescuento(x)}
        ${x.featured ? '<span class="badge-negro">Más vendida</span>' : ''}
      </span>
      <a class="hv-foto" href="${hrefProducto(x)}" onclick="openProductDetail(${x.id});return false;">
        ${imgProducto(x, primera ? 'fetchpriority="high"' : '')}
      </a>
      <div class="hv-detalle">
        <span class="hv-eyebrow">${escapeHtml(catLabel(x))}</span>
        <h2 class="hv-titulo"><a href="${hrefProducto(x)}" onclick="openProductDetail(${x.id});return false;">${escapeHtml(x.name)}</a></h2>
        ${puntosColorHtml(x)}
        <div class="hv-precios">
          <span class="hv-precio">${fmt(x.price)}</span>
          ${enOferta(x) ? `<s class="hv-antes">${fmt(x.old)}</s>` : ''}
        </div>
        ${cuotas}
        ${alerta}
        <div class="hv-ctas">
          <button type="button" class="btn-comprar" onclick="addToCart(${x.id}, this)">Agregar al carrito</button>
          <a class="btn-wa-contorno" target="_blank" rel="noopener" href="${waProducto(x)}"
             onclick="trackAdsConversion('whatsapp')"><span class="ico-wa">${iconWhatsapp}</span>Comprar por WhatsApp</a>
        </div>
        <p class="hv-micro">Pedidos antes de las 4:00 p.m. salen hoy · Recojo en San Juan de Miraflores en 1 hora</p>
      </div>
      <span class="hv-progreso" aria-hidden="true"><span id="vitrinaBarra"></span></span>`;
}

function secundariasHtml(){
  return `
    <div class="hv-secundarias">
      ${ofertasSecundarias().map((o,i) => `
      <article class="hv-of ${i===0 ? 'oscura' : 'verde'}">
        <i class="hv-fx"></i>
        ${badgeDescuento(o, 'esquina')}
        <a class="hv-of-foto" href="${hrefProducto(o)}" onclick="openProductDetail(${o.id});return false;">${imgProducto(o)}</a>
        <div class="hv-of-texto">
          <span class="hv-of-eyebrow">${escapeHtml(catLabel(o))}</span>
          <a class="hv-of-titulo" href="${hrefProducto(o)}" onclick="openProductDetail(${o.id});return false;">${escapeHtml(o.name)}</a>
          <div class="hv-of-precios">
            <span class="hv-of-precio">${fmt(o.price)}</span>
            ${enOferta(o) ? `<s>${fmt(o.old)}</s>` : ''}
          </div>
          <span class="hv-of-linea">${(o.stock||0) > 5 ? 'En stock' : 'Quedan ' + (o.stock||0)}</span>
          <button type="button" class="hv-of-btn" onclick="addToCart(${o.id}, this)">Agregar</button>
        </div>
      </article>`).join('')}
    </div>`;
}

/* ---------------- franja de confianza ----------------
   El diseño ponía "Pago contra entrega" como ventaja principal; la tienda no
   lo ofrece, así que esa celda dice los medios de pago que sí existen. */
function franjaConfianzaHtml(){
  const celdas = [
    ['Envío a todo el Perú', 'por agencia Shalom, 1 a 3 días'],
    ['Yape o tarjeta', 'paga como te quede mejor'],
    ['Garantía de 6 meses', 'contra defectos de fábrica'],
    ['Recojo en 1 hora', 'Av. Los Héroes 382, S.J.M.'],
    ['+12 años atendiendo', 'a músicos y colegios de Lima'],
  ];
  return `<div class="confianza">${celdas.map(c => `
    <div class="conf-celda">
      <span class="conf-titulo">${escapeHtml(c[0])}</span>
      <span class="conf-sub">${escapeHtml(c[1])}</span>
    </div>`).join('')}</div>`;
}

/* ---------------- vitrina ---------------- */
function tarjetaVentaHtml(x){
  const cuotas = FLAGS.showCuotas
    ? `<span class="tv-cuotas">o 3 × ${fmt(Math.round(x.price/3))}</span>` : '';
  return `
  <article class="tv">
    <a class="tv-foto" href="${hrefProducto(x)}" onclick="openProductDetail(${x.id});return false;">
      ${imgProducto(x)}${badgeDescuento(x, 'esquina')}
    </a>
    <a class="tv-titulo" href="${hrefProducto(x)}" onclick="openProductDetail(${x.id});return false;">${escapeHtml(x.name)}</a>
    ${puntosColorHtml(x)}
    <div class="tv-precios">
      <span class="tv-precio">${fmt(x.price)}</span>
      ${enOferta(x) ? `<s>${fmt(x.old)}</s>` : ''}
    </div>
    ${cuotas}
    ${lineaStock(x)}
    <button type="button" class="btn-comprar tv-btn" onclick="addToCart(${x.id}, this)">Agregar al carrito</button>
  </article>`;
}

/* ---------------- recomendados de la ficha ----------------
   Lo que hay al lado en la misma balda. Primero la subcategoría, que es lo
   que de verdad se parece: quien está mirando unas cuerdas de nylon quiere
   ver otras cuerdas, no un atril. Si no llega a cuatro, se completa con el
   resto de la categoría.

   Dentro de cada grupo mandan los precios cercanos al que se está mirando.
   Unas cuerdas de S/ 18 tienen al lado otras de S/ 16 y S/ 20, no las de
   S/ 900: se trata de enseñar alternativas comparables, no el catálogo.

   Solo productos con stock: recomendar algo agotado es mandar al cliente
   contra una pared. */
const RECO_MAX = 4;
function recomendadosDeFicha(p){
  const cerca = (a,b) => Math.abs(a.price - p.price) - Math.abs(b.price - p.price);
  const vivos = PRODUCTS.filter(x => x.id !== p.id && (x.stock||0) > 0);
  const deSub = p.sub ? vivos.filter(x => x.sub === p.sub).sort(cerca) : [];
  const yaEsta = new Set(deSub.map(x => x.id));
  const deCat  = vivos.filter(x => x.cat === p.cat && !yaEsta.has(x.id)).sort(cerca);
  return [...deSub, ...deCat].slice(0, RECO_MAX);
}

/* "Cuerdas (Acústica/Clásica)" da "Más cuerdas en la tienda": el paréntesis
   sobra en un título y en minúscula entra en la frase.

   Pero solo si TODO lo que se enseña es de esa subcategoría. Cuando no hay
   cuatro y hay que rellenar con el resto de la categoría, el título baja a
   ella: "Más bombos en la tienda" encima de dos kalimbas es mentira, y quien
   la lea deja de fiarse del resto de la página. */
function recoTituloHtml(p, lista){
  const cat = CATEGORIES.find(c=>c.key===p.cat);
  const sub = cat && cat.subs.find(s=>s.key===p.sub);
  if(sub && lista.every(x => x.sub === p.sub)){
    return `Más ${sub.label.split('(')[0].trim().toLowerCase()} en la tienda`;
  }
  return cat ? `Más en ${cat.label}` : 'También te puede interesar';
}

function recomendadosHtml(p){
  const lista = recomendadosDeFicha(p);
  if(!lista.length) return '';
  const cat = CATEGORIES.find(c=>c.key===p.cat);
  return `
  <section class="reco">
    <div class="reco-head">
      <h2>${escapeHtml(recoTituloHtml(p, lista))}</h2>
      ${cat ? `<a class="enlace-sub" href="${hrefCategoria(cat.key)}"
           onclick="goShop('${cat.key}');return false;">Ver todo en ${escapeHtml(cat.label)} ›</a>` : ''}
    </div>
    <div class="reco-grid">${lista.map(tarjetaVentaHtml).join('')}</div>
  </section>`;
}

/* "Completa tu compra": accesorios que le sirven a ESTE instrumento, para
   llevarlos en el mismo pedido. Distinto de "Más en…", que enseña alternativas
   del mismo tipo.

   Cada regla es una subcategoría de Accesorios y, si hace falta, una
   expresión sobre el nombre para no mezclar (unas cuerdas de nylon en una
   guitarra eléctrica son un error caro). De cada regla sale un producto, el
   más barato con stock, y las reglas van por orden de importancia. */
const COMPLEMENTOS = {
  guitarras:          ['cuerdasGuitarra', {sub:'accCapotrastes'}, {sub:'accAfinadores'}, {sub:'accPuas', re:/p[uú]as/i}, {sub:'accAtriles', re:/colgador/i}],
  electroacusticos:   ['cuerdasGuitarra', {sub:'accCapotrastes'}, {sub:'accAfinadores'}, {sub:'accPuas', re:/p[uú]as/i}],
  guitarrasElectricas:[{sub:'accCuerdasElectrica'}, {sub:'accPuas', re:/p[uú]as/i}, {sub:'accAfinadores'}, {sub:'accAtriles', re:/colgador/i}],
  bajos:              [{sub:'accAfinadores'}, {sub:'accAtriles', re:/colgador/i}],
  ukeleles:           [{sub:'accAfinadores'}, {sub:'accAtriles', re:/colgador/i}],
  charangos:          [{sub:'accAfinadores'}, {sub:'accPuas', re:/p[uú]as/i}],
  violines:           [{sub:'accViolin', re:/resina/i}, {sub:'accAfinadores'}, {sub:'accAtriles', re:/atril/i}, {sub:'accViolin', re:/sticker/i}],
  bombos:             [{sub:'accBaquetas', re:/mazo/i}, {sub:'accBaquetas', re:/baqueta/i}],
  tambores:           [{sub:'accBaquetas'}],
  tarolas:            [{sub:'accBaquetas', re:/baqueta/i}],
  timbales:           [{sub:'accBaquetas', re:/baqueta/i}],
  zamponas:           [{sub:'accCanas', re:/zampo/i}],
  microfonos:         [{sub:'accAtriles', re:/pedestal/i}, {sub:'accCuidado', re:/cable/i}],
  interfaces:         [{sub:'accCuidado', re:/cable/i}],
  amplificadores:     [{sub:'accCuidado', re:/cable/i}],
  teclados:           [{sub:'accAtriles', re:/teclado/i}, {sub:'accCuidado', re:/teclado/i}],
  colXilofonos:       [{sub:'accBaquetas', re:/baqueta/i}],
  colPercusion:       [{sub:'accBaquetas', re:/baqueta/i}],
};

function complementosDeFicha(p){
  if(p.cat === 'accesorios') return [];
  const reglas = COMPLEMENTOS[p.sub];
  if(!reglas) return [];
  const clasica = /cl[aá]sica/i.test(p.name);
  const vivos = PRODUCTS.filter(x => x.cat === 'accesorios' && (x.stock||0) > 0 && (x.images||[]).length);
  const usados = new Set(), lista = [];
  for(const r0 of reglas){
    const r = r0 === 'cuerdasGuitarra'
      ? {sub:'accCuerdasAcustica', re: clasica ? /cl[aá]sica|nylon/i : /bronce|bronze|ac[uú]stica/i, no: clasica ? null : /cl[aá]sica|nylon|arpa/i}
      : r0;
    const x = vivos
      .filter(y => y.sub === r.sub && (!r.re || r.re.test(y.name)) && !(r.no && r.no.test(y.name)) && !usados.has(y.id))
      .sort((a,b) => a.price - b.price)[0];
    if(x){ usados.add(x.id); lista.push(x); }
    if(lista.length === RECO_MAX) break;
  }
  return lista;
}

function complementosHtml(p){
  const lista = complementosDeFicha(p);
  if(!lista.length) return '';
  return `
  <section class="reco reco-comp">
    <div class="reco-head">
      <h2>Completa tu compra</h2>
      <span class="reco-sub">Accesorios que le sirven, en el mismo pedido.</span>
    </div>
    <div class="reco-grid">${lista.map(tarjetaVentaHtml).join('')}</div>
  </section>`;
}

/* "Para empezar": un instrumento de cada familia que un principiante puede
   tocar sin saber nada. Los ids son fijos a propósito (los elige el dueño, no
   el azar); si uno se agota o pierde la foto, simplemente no sale. */
const IDS_PARA_EMPEZAR = [2, 44, 245, 209]; // guitarra Vozzex, ukelele, teclado Vozzex 54 teclas, flauta dulce Hohner
function empezarHtml(){
  const lista = IDS_PARA_EMPEZAR
    .map(id => productoPorId(id))
    .filter(x => x && (x.stock||0) > 0 && (x.images||[]).length);
  if(lista.length < 2) return '';
  const desde = Math.min(...lista.map(x => x.price));
  return `
  <section class="empezar">
    <header class="vitrina-head">
      <div>
        <h2>Para empezar a tocar</h2>
        <p>Instrumentos fáciles para principiantes, desde ${fmt(desde)}</p>
      </div>
      <a class="enlace-sub" href="/tienda" onclick="goShop(null);return false;">Ver catálogo completo ›</a>
    </header>
    <div class="vitrina-grid">${lista.map(tarjetaVentaHtml).join('')}</div>
  </section>`;
}

function vitrinaHtml(){
  const lista = vitrinaDestacados();
  if(!lista.length) return '';
  const enOfertaTotal = PRODUCTS.filter(x => enOferta(x) && (x.stock||0) > 0).length;
  return `
  <section class="vitrina">
    <header class="vitrina-head">
      <div>
        <h2>Los más vendidos esta semana</h2>
        <p>Todos con stock real en tienda y listos para recojo hoy</p>
      </div>
      <a class="enlace-sub" href="/tienda" onclick="goShop(null);return false;">Ver catálogo completo ›</a>
    </header>
    <div class="vitrina-grid">${lista.map(tarjetaVentaHtml).join('')}</div>
    <a class="vitrina-vertodo" href="/ofertas" onclick="goOffers();return false;">Ver los ${enOfertaTotal} productos en oferta ›</a>
  </section>`;
}

/* ---------------- prueba social ----------------
   El rating, el número de reseñas y los tres testimonios son los reales de
   la ficha de Google Maps de la tienda, citados tal cual y con enlace a la
   ficha para que cualquiera los compruebe. Se firman con el nombre y la
   inicial del apellido: en Google salen completos, pero en una portada no
   hace falta exponerlos enteros. */
const RESENAS_GOOGLE = [
  {
    texto: 'La atención fue excelente, fueron muy amables y me ayudaron a elegir lo que necesitaba. Tienen buena variedad de instrumentos y accesorios, y los precios son accesibles.',
    firma: 'Katy S.'
  },
  {
    texto: 'Excelente lugar para adquirir equipos e instrumentos. Mi primera compra fue una guitarra eléctrica Jackson, un bajo Vozzex y un amplificador, todos de buena calidad.',
    firma: 'Christian E.'
  },
  {
    texto: 'Ya llevo como 3 instrumentos que voy comprando de esa tienda y es de lo mejor, no solo por la calidad sino también por la atención muy profesional y excelente. 10/10',
    firma: 'Francisco P.'
  }
];

function pruebaSocialHtml(){
  const citas = RESENAS_GOOGLE.map(r => `
      <figure class="cita">
        <blockquote>“${r.texto}”</blockquote>
        <figcaption><b>${r.firma}</b> · Reseña en Google</figcaption>
      </figure>`).join('');
  return `
  <section class="prueba">
    <div class="prueba-cabecera">
      <span class="prueba-cifra">${STORE_RATING}</span>
      <span class="prueba-de">/ 5</span>
      <p class="prueba-texto">
        Promedio de <strong>${STORE_REVIEW_COUNT} reseñas</strong> de clientes en Google.
        <a href="${STORE_MAPS_LINK}" target="_blank" rel="noopener">Léelas ›</a>
      </p>
    </div>
    <div class="prueba-citas">${citas}</div>
  </section>`;
}

/* ---------------- kit escolar ---------------- */
function kitEscolarHtml(){
  const suyos = productosDeCategoria('colegio').filter(x => (x.stock||0) > 0 && (x.images||[]).length);
  if(!suyos.length) return '';
  const desde = Math.min(...suyos.map(x => x.price));
  const fotos = [...suyos].sort((a,b) => (b.featured?1:0)-(a.featured?1:0) || b.price-a.price).slice(0,3);
  return `
  <section class="kit">
    <div class="kit-fotos">${fotos.map(x => `
      <a class="kit-foto" href="${hrefProducto(x)}" onclick="openProductDetail(${x.id});return false;">
        <span class="kit-foto-img">${imgProducto(x)}</span>
        <span class="kit-foto-nombre">${escapeHtml(x.name)}</span>
        <span class="kit-foto-precio">${fmt(x.price)}</span>
      </a>`).join('')}</div>
    <div class="kit-texto">
      <span class="kit-eyebrow">Para colegio · lista escolar</span>
      <h2 class="kit-titulo">Mándanos la lista y te devolvemos el kit cotizado en 1 hora</h2>
      <p class="kit-copy">Flauta, melódica, xilófono, claves y pandereta en un solo pedido, con stock en tienda.</p>
      <div class="kit-ctas">
        <a class="btn-comprar" target="_blank" rel="noopener"
           href="${waHref('Hola, les mando la lista de útiles musicales del colegio para cotizar.')}"
           onclick="trackAdsConversion('whatsapp')"><span class="ico-wa">${iconWhatsapp}</span>Mándanos tu lista</a>
        <a class="enlace-sub verde" href="/categoria/colegio" onclick="goShop('colegio');return false;">Ver todo desde ${fmt(desde)} ›</a>
      </div>
    </div>
  </section>`;
}

/* ---------------- cierre de tienda física ---------------- */
function cierreTiendaHtml(){
  return `
  <section class="cierre">
    <div class="cierre-texto">
      <h2>¿Lo necesitas hoy? Recógelo en San Juan de Miraflores en 1 hora</h2>
      <p>${escapeHtml(STORE_ADDRESS.replace(', Lima 15801, Perú',''))} · ${escapeHtml(STORE_HOURS)} · Pedidos antes de las 4:00 p.m. salen el mismo día</p>
    </div>
    <div class="cierre-botones">
      <a class="btn-comprar" href="/tienda" onclick="goShop(null);return false;">Ver stock en tienda</a>
      <a class="btn-contorno" href="${STORE_MAPS_LINK}" target="_blank" rel="noopener">Cómo llegar</a>
    </div>
  </section>`;
}

/* ---------------- barra de compra fija (teléfono) ----------------
   Lo de mayor impacto del handoff: el precio y el CTA no salen de pantalla.
   Solo en la portada y solo si hay producto gancho. */
function barraCompraHtml(){
  const x = heroProducto();
  if(!x) return '';
  return `
  <div class="barra-compra">
    <span class="bc-precios">
      <span class="bc-precio">${fmt(x.price)}</span>
      ${enOferta(x) ? `<s>${fmt(x.old)}</s>` : ''}
    </span>
    <button type="button" class="btn-comprar bc-cta" onclick="addToCart(${x.id}, this)">Agregar al carrito</button>
    <a class="bc-wa" target="_blank" rel="noopener" aria-label="Comprar por WhatsApp"
       href="${waProducto(x)}" onclick="trackAdsConversion('whatsapp')">${iconWhatsapp}</a>
  </div>`;
}

/* La barra de compra se asoma cuando los CTA del hero salen de pantalla, y
   se esconde si el usuario vuelve arriba. Con IntersectionObserver para no
   colgarse de un listener de scroll. */
let vigiaBarraCompra = null;
function prepararBarraCompra(){
  if(vigiaBarraCompra){ vigiaBarraCompra.disconnect(); vigiaBarraCompra = null; }
  const nav = document.getElementById('bottomNav');
  if(nav) document.documentElement.style.setProperty('--nav-real', nav.offsetHeight + 'px');
  const barra = document.querySelector('.barra-compra');
  const ctas  = document.querySelector('.hv-ctas');
  /* Marca el body para que reserve el hueco de la barra (ver
     .con-barra-compra). Se pone antes del return: cuando la barra no está
     —cualquier pantalla que no sea la portada en teléfono— hay que quitarla,
     o el hueco se queda puesto donde no hace falta. */
  document.body.classList.toggle('con-barra-compra', Boolean(barra));
  if(!barra) document.body.classList.remove('barra-activa');
  if(!barra || !ctas) return;
  vigiaBarraCompra = new IntersectionObserver(([e]) => {
    const ver = !e.isIntersecting && e.boundingClientRect.top < 0;
    barra.classList.toggle('visible', ver);
    document.body.classList.toggle('barra-activa', ver);
  }, { threshold: 0 });
  vigiaBarraCompra.observe(ctas);
}

const H1_PORTADA = '<h1 class="oculto-visual">Instrumentos Musicales en Lima &mdash; Chipao Music</h1>';

function renderHome(){
  if(!esEscritorio()) return `
  <div class="app-shell portada">
    ${H1_PORTADA}
    ${heroVentasHtml()}
    ${categoriasPortadaHtml()}
    ${bannerSorteoHtml()}
    ${beneficiosMovilHtml()}
    ${bannerTallerHtml()}
    ${empezarHtml()}
    ${vitrinaHtml()}
    ${secundariasMovilHtml()}
    ${pruebaSocialHtml()}
    ${kitEscolarHtml()}
    ${cierreTiendaHtml()}
  </div>
  ${barraCompraHtml()}`;

  return `
  <div class="app-shell portada">
    ${H1_PORTADA}
    ${heroVentasHtml()}
    ${bannerSorteoHtml()}
    ${categoriasPortadaHtml()}
    ${franjaConfianzaHtml()}
    ${bannerTallerHtml()}
    ${empezarHtml()}
    ${vitrinaHtml()}
    ${pruebaSocialHtml()}
    ${kitEscolarHtml()}
    ${cierreTiendaHtml()}
  </div>
  ${esEscritorio() ? '' : barraCompraHtml()}`;
}

/* Un producto de accesorios (o de Para Colegio) cae bajo un grupo por instrumento si su sub real
   (el que edita el panel de administrador) aparece en la lista 'matches' del
   grupo — así un mismo capo puede listarse en Guitarra Acústica y Eléctrica
   sin necesidad de que el producto tenga dos subcategorías. */
function subMatchesActiveFilter(sub){
  for(const activeKey of state.activeSubs){
    if(activeKey === sub) return true;
    const grp = (FILTER_GROUPS[state.activeCat] || []).find(g=>g.key===activeKey);
    if(grp && grp.matches.includes(sub)) return true;
  }
  return false;
}

/* La condición de cada filtro vive AQUÍ y en ningún otro sitio: la grilla de
   la derecha y los números del panel tienen que decir lo mismo, o el panel
   promete ocho guitarras y la lista enseña tres.

   'omitir' deja fuera una dimensión para poder contar DENTRO de ella: cuántos
   ukeleles se verían es "todo lo demás puesto, menos las subcategorías". */
function pasaFiltros(p, omitir){
  if(state.activeCat && !productInCat(p, state.activeCat)) return false;
  if(omitir!=='subs' && state.activeSubs.size && !subMatchesActiveFilter(p.sub)) return false;
  if((state.offersOnly || state.soloOfertas) && !enOferta(p)) return false;
  if(omitir!=='stock' && state.soloStock && (p.stock||0) <= 0) return false;
  if(p.price < state.priceMin || p.price > state.priceMax) return false;
  /* Rangos de precio del panel lateral de escritorio. Se suman entre sí:
     marcar dos deja pasar lo que caiga en cualquiera de los dos. En el
     teléfono el conjunto va siempre vacío y esta línea no filtra nada. */
  if(omitir!=='precio' && state.rangosPrecio.size && !RANGOS_PRECIO.some(r =>
      state.rangosPrecio.has(r.key) && p.price >= r.min && p.price < r.max)) return false;
  if(state.search && !p.name.toLowerCase().includes(state.search.toLowerCase())) return false;
  if(state.etiqueta === ETIQUETA_EXPERIENCIA){
    if(etiquetasDeGuitarra(p).includes('Para empezar')) return false;
  }else if(state.etiqueta && !etiquetasDeGuitarra(p).includes(state.etiqueta)) return false;
  return true;
}

/* Cuántos productos quedarían a la vista si se pulsara ese filtro ahora
   mismo, con todo lo demás como está. Es el número que va a su derecha. */
function cuentaFiltro(omitir, cumple){
  return PRODUCTS.filter(p => pasaFiltros(p, omitir) && cumple(p)).length;
}

function getFilteredProducts(){
  return PRODUCTS.filter(p => pasaFiltros(p)).sort((a,b)=>{
    if(state.sort==='price-asc') return a.price-b.price;
    if(state.sort==='price-desc') return b.price-a.price;
    return 0;
  });
}

/* Vuelve a la pantalla anterior. Si no hay historial (alguien abrió el enlace
   de una categoría directamente) el botón lleva a la portada, que es lo que
   espera quien lo pulsa: no quedarse encerrado. */
function volverAtras(){
  if(window.history.length > 1) history.back();
  else goHome();
}

const LIMITE_CHIP_PRECIO = 200;

function chipHtml(texto, activo, accion){
  return `<button type="button" class="chip${activo?' activo':''}"
    aria-pressed="${activo?'true':'false'}" onclick="${accion}">${escapeHtml(texto)}</button>`;
}

/* Los chips del handoff, más uno por subcategoría cuando la categoría las
   tiene. Sin esos últimos, Accesorios sería una lista de 47 productos sin
   forma de acotarla: el panel lateral que hacía ese trabajo ya no existe.
   Todos se combinan entre sí y se quedan puestos al volver atrás. */
function chipsFiltroHtml(){
  const chips = [
    chipHtml('Ordenar: menor precio', state.sort==='price-asc', 'toggleOrdenPrecio()'),
    /* En /ofertas el chip sobra: ahí todo tiene descuento. */
    ...(state.offersOnly ? [] : [chipHtml('En oferta', state.soloOfertas, 'toggleSoloOfertas()')]),
    chipHtml('Recojo hoy', state.soloStock, 'toggleSoloStock()'),
    chipHtml(`Hasta ${fmt(LIMITE_CHIP_PRECIO)}`, state.priceMax <= LIMITE_CHIP_PRECIO, 'toggleTope()'),
  ];
  /* Las subcategorías ya no van aquí, al final de una fila que había que
     desplazar para encontrarlas: tienen su propio bloque, ver subsMovilHtml. */
  const algunoPuesto = state.sort==='price-asc' || state.soloOfertas || state.soloStock
    || state.priceMax <= LIMITE_CHIP_PRECIO || state.activeSubs.size;
  if(algunoPuesto) chips.push(`<button type="button" class="chip limpiar" onclick="clearFilters()">Limpiar</button>`);
  return `<div class="chips-fila">${chips.join('')}</div>`;
}

/* Las subcategorías en el teléfono: mosaicos con la foto de un producto de
   cada tipo, en un bloque propio encima de los filtros. Antes iban al final de
   la fila de chips y había que desplazar para encontrarlas. */

function quitarSubs(){ state.activeSubs = new Set(); trasFiltrar(); }

function subsMovilHtml(){
  const cat = CATEGORIES.find(c=>c.key===state.activeCat);
  const subs = cat ? subsNavegables(cat) : [];
  if(subs.length < 2) return '';
  const cuantos = s => PRODUCTS.filter(p => productInCat(p, cat.key) && (p.sub === s.key || (s.matches||[]).includes(p.sub)));
  const todo = productosDeCategoria(cat.key).length;
  const ningunaPuesta = !state.activeSubs.size;

  /* Con un tipo ya elegido los mosaicos sobran: ocupaban media pantalla antes
     de llegar al primer producto. Queda una sola fila con lo elegido y la salida
     para cambiar de tipo. */
  if(!ningunaPuesta){
    const elegidos = subs.filter(s => state.activeSubs.has(s.key)).map(s => s.label).join(', ');
    return `
  <div class="subs-bloque">
    <div class="sub-elegido">
      <span class="se-texto"><em>Tipo</em><b>${escapeHtml(elegidos)}</b></span>
      <button type="button" class="se-cambiar" onclick="quitarSubs()">Cambiar tipo</button>
    </div>
  </div>`;
  }

  const mosaicos = subs.map(s=>{
    const lista = cuantos(s);
    const n = lista.length;
    const conFoto = lista.find(p=>p.id === s.fotoId && fotoDe(p)) || lista.find(p=>fotoDe(p));
    const foto = conFoto ? `<img src="${fotoUrl(fotoDe(conFoto), ANCHO_MINIATURA)}" alt="" loading="lazy" decoding="async">` : '';
    const activo = state.activeSubs.has(s.key);
    if(!n){
      return `
      <a class="sub-mosaico vacia" target="_blank" rel="noopener"
         href="${waHref('Hola, quiero consultar por ' + s.label.toLowerCase() + '.')}" onclick="trackAdsConversion('whatsapp')">
        <span class="sm-foto"></span>
        <span class="sm-texto"><b>${escapeHtml(s.label)}</b><em>Consúltanos ›</em></span>
      </a>`;
    }
    return `
    <button type="button" class="sub-mosaico${activo?' activo':''}" aria-pressed="${activo?'true':'false'}" onclick="toggleChipSub('${s.key}')">
      <span class="sm-foto">${foto}</span>
      <span class="sm-texto"><b>${escapeHtml(s.label)}</b><em>${n} modelo${n!==1?'s':''}</em></span>
    </button>`;
  }).join('');
  return `
  <div class="subs-bloque">
    <div class="subs-eyebrow">Elige el tipo</div>
    <div class="subs-mosaicos">
      <button type="button" class="sub-mosaico todo${ningunaPuesta?' activo':''}" aria-pressed="${ningunaPuesta?'true':'false'}" onclick="quitarSubs()">
        <span class="sm-texto"><b>Ver todo</b><em>${todo} productos</em></span>
      </button>
      ${mosaicos}
    </div>
  </div>`;
}

/* ---------------- panel lateral de categoría (escritorio) ----------------
   Lo que en el teléfono es una fila de chips aquí es una columna fija: las
   siete categorías con su conteo, los rangos de precio, las subcategorías de
   la que esté abierta y la tarjeta verde del asesor. */
/* La categoría de la ficha lleva a su sección. Quien cae aquí desde Google,
   en un producto suelto, no tiene otra forma de seguir viendo lo demás que
   darle a atrás. En el teléfono, además, no hay migas de pan arriba: esto es
   lo único que le dice dónde está. El "›" es el mismo gesto que "Léelas ›" o
   "Ver todo ›" del resto del sitio, para que se note que se puede tocar. */
function fichaCategoriaHtml(cat){
  if(!cat) return '<div class="eyebrow-terracota">Instrumentos</div>';
  return `<a class="eyebrow-terracota" href="${hrefCategoria(cat.key)}"
             onclick="goShop('${cat.key}');return false;">${escapeHtml(cat.label)} ›</a>`;
}

/* Una fila del panel: el nombre, cuántos productos deja ver y la barra de la
   izquierda cuando está puesta. Sigue siendo un <button aria-pressed> y no un
   <input type="checkbox"> porque filtra al instante y no envía ningún
   formulario.

   Si el filtro no deja nada a la vista va apagado y no se puede pulsar, salvo
   que YA esté puesto: entonces hay que poder quitarlo. */
function filaFiltroHtml(texto, marcada, accion, conteo, foto){
  const muerta = !marcada && conteo === 0;
  return `
  <button type="button" class="fila-filtro${marcada?' marcada':''}${foto?' con-foto':''}"
          aria-pressed="${marcada?'true':'false'}"${muerta?' disabled':''} onclick="${accion}">
    ${foto ? `<em class="ff-foto">${foto}</em>` : ''}
    <span>${escapeHtml(texto)}</span>
    ${conteo != null ? `<i>${conteo}</i>` : ''}
  </button>`;
}

/* La foto de un producto cualquiera que cumpla la condición, de la categoría
   abierta: es solo una referencia, no el producto exacto. */
function fotoDeFiltro(cumple, fotoId){
  /* `fotoId` fija el producto de la foto cuando el grupo la quiere distinta de
     la primera que salga: Guitarra Eléctrica enseña un juego de cuerdas y no el
     capotraste que cae primero en la lista. */
  const p = PRODUCTS.find(x => x.id === fotoId && fotoDe(x))
    || PRODUCTS.find(x => (!state.activeCat || productInCat(x, state.activeCat)) && cumple(x) && fotoDe(x));
  return p ? `<img src="${fotoUrl(fotoDe(p), ANCHO_MINIATURA)}" alt="" loading="lazy" decoding="async">` : '';
}

/* El título de un bloque dice QUÉ se elige, no dónde se está: el <h1> ya dijo
   que esto es Instrumentos de Cuerda y repetirlo aquí no le servía a nadie.
   "Quitar" solo sale cuando ese bloque tiene algo puesto. */
function tituloBloqueHtml(texto, accionQuitar){
  return `
    <div class="side-titulo">
      <span>${escapeHtml(texto)}</span>
      ${accionQuitar ? `<button type="button" onclick="${accionQuitar}">Quitar</button>` : ''}
    </div>`;
}

function sidebarCategoriaHtml(){
  const cat = CATEGORIES.find(c=>c.key===state.activeCat);
  const subs = cat ? subsNavegables(cat) : [];

  const categorias = CATEGORIES.map(c=>{
    const n = productosDeCategoria(c.key).length;
    return `
      <a class="side-cat${state.activeCat===c.key?' activa':''}" href="${hrefCategoria(c.key)}"
         onclick="goShop('${c.key}');return false;">
        <span>${escapeHtml(c.label)}</span><i>${n || '—'}</i>
      </a>`;
  }).join('');

  const rangos = RANGOS_PRECIO.map(r=>
    filaFiltroHtml(r.label, state.rangosPrecio.has(r.key), `toggleRangoPrecio('${r.key}')`,
      cuentaFiltro('precio', p => p.price >= r.min && p.price < r.max),
      fotoDeFiltro(p => p.price >= r.min && p.price < r.max))
  ).join('');

  const limpiables = state.rangosPrecio.size || state.activeSubs.size
    || state.soloStock || state.soloOfertas || state.sort!=='relevancia';

  const bloqueCategorias = `
    <div class="side-bloque">
      ${tituloBloqueHtml('Categorías', '')}
      ${categorias}
    </div>`;

  const bloquePrecio = `
    <div class="side-bloque">
      ${tituloBloqueHtml('Precio', (state.rangosPrecio.size || state.soloStock) ? 'limpiarPrecio()' : '')}
      ${rangos}
      ${filaFiltroHtml('Solo lo que hay en tienda', state.soloStock, 'toggleSoloStock()',
          cuentaFiltro('stock', p => (p.stock||0) > 0))}
    </div>`;

  /* En Accesorios las filas son tipos de accesorio (cuerdas, capotrastes,
     afinadores...), que es como los busca la gente. */
  const bloqueSubs = subs.length ? `
    <div class="side-bloque">
      ${tituloBloqueHtml(cat.key==='accesorios' ? 'Tipo de accesorio' : 'Tipo de instrumento',
          state.activeSubs.size ? 'limpiarSubs()' : '')}
      ${subs.map(s=>filaFiltroHtml(s.label, state.activeSubs.has(s.key), `toggleChipSub('${s.key}')`,
          cuentaFiltro('subs', p => s.matches ? s.matches.includes(p.sub) : p.sub===s.key),
          fotoDeFiltro(p => s.matches ? s.matches.includes(p.sub) : p.sub===s.key, s.fotoId))).join('')}
    </div>` : '';

  /* Dentro de una categoría con subcategorías la lista de categorías no va:
     la barra de arriba ya las muestra todas y repetirla debajo del precio
     se veía redundante. En "Todo el catálogo", en las ofertas o en una
     búsqueda no hay subcategorías y esa lista sí es lo principal, así que
     ahí se queda arriba. */
  const bloques = bloqueSubs
    ? bloqueSubs + bloquePrecio
    : bloqueCategorias + bloquePrecio;

  return `
  <aside class="cat-sidebar">
    ${bloques}

    ${limpiables ? `<button type="button" class="side-limpiar" onclick="clearFilters()">Limpiar filtros</button>` : ''}

    <div class="side-asesor">
      <div class="side-asesor-titulo">¿No sabes cuál elegir?</div>
      <p>Cuéntanos para quién es y qué nivel tiene. Te recomendamos el que le conviene y te decimos si está en tienda hoy.</p>
      <a class="btn-app verde" target="_blank" rel="noopener"
         href="${waHref('Hola, necesito ayuda para elegir un instrumento.')}"
         onclick="trackAdsConversion('whatsapp')"><span class="ico-wa">${iconWhatsapp}</span>Hablar con un asesor</a>
    </div>
  </aside>`;
}

/* Los tres chips de orden del handoff, a la derecha del título. */
function chipsOrdenHtml(){
  const chip = (texto, activo, accion) =>
    `<button type="button" class="chip-orden${activo?' activo':''}"
       aria-pressed="${activo?'true':'false'}" onclick="${accion}">${texto}</button>`;
  return `
    <div class="cat-orden">
      ${chip('Destacados', state.sort==='relevancia', "setOrden('relevancia')")}
      ${chip('Menor precio', state.sort==='price-asc', "setOrden('price-asc')")}
      ${state.offersOnly ? '' : chip('Solo en oferta', state.soloOfertas, 'toggleSoloOfertas()')}
    </div>`;
}

/* Anuncios verticales dentro de la grilla de su categoría: una imagen en
   /banners/ con destello y flote en CSS. Cada uno lleva al producto `id` y solo
   sale si ese producto está en la lista ya filtrada y con stock, así que si se
   agota o se retira desaparece solo. Para sumar uno: subir la imagen a banners/
   y agregar una línea aquí. */
const ANUNCIOS_GRILLA = [
  { id:216, cat:'audio',  img:'/banners/marshall-mg15g.jpg' },
  { id:249, cat:'cuerda', img:'/banners/ltd-blanca.jpg' },
  { id:234, cat:'cuerda', img:'/banners/yamaha-c40.jpg' },
  { id:260, cat:'cuerda', img:'/banners/violin-fever.jpg' },
];
function anunciosGrillaHtml(list){
  if(state.search || state.offersOnly) return [];
  return ANUNCIOS_GRILLA.filter(a=>a.cat===state.activeCat).map(a=>{
    const p = list.find(x=>x.id===a.id);
    if(!p || !(p.stock>0)) return null;
    return { id:p.id, html:`
  <a class="anuncio-grid" href="${hrefProducto(p)}" onclick="openProductDetail(${p.id});return false;" aria-label="Anuncio: ${escapeHtml(p.name)}">
    <span class="anuncio-marco"><img src="${a.img}" width="864" height="1080" alt="${escapeHtml(p.name)}, ${fmt(p.price)}" loading="lazy" decoding="async"></span>
  </a>` };
  }).filter(Boolean);
}

function renderShop(){
  const list = getFilteredProducts();
  const cat = CATEGORIES.find(c=>c.key===state.activeCat);
  /* Con UN solo filtro puesto la pantalla es la de esa subcategoría y lleva su
     nombre, no el de la categoría: quien llega desde el anuncio de "ukelele
     concierto" tiene que leer "Ukeleles" y no "Instrumentos de Cuerda", o no
     sabe si ha llegado a donde quería. Es el mismo <h1> que sirve el Worker
     en /categoria/cuerda/ukeleles. */
  const subUnico = (cat && state.activeSubs.size===1)
    ? findSubByKey(cat, [...state.activeSubs][0]) : null;

  let titulo, subtitulo;
  if(state.search){
    titulo = `“${state.search}”`;
    subtitulo = 'Resultados de tu búsqueda';
  }else if(state.offersOnly && !cat){
    /* El <h1> lleva "instrumentos musicales" porque es lo que se busca; la
       pestaña del menú sigue diciendo solo "Ofertas". */
    titulo = 'Ofertas en instrumentos musicales';
    subtitulo = 'Instrumentos con descuento';
  }else if(cat){
    titulo = subUnico ? subUnico.label : (cat.seo || cat.label);
    subtitulo = subUnico ? cat.label
      : (cat.subs.length && cat.key!=='colegio' ? cat.subs.map(s=>s.label).join(', ') : cat.desc);
  }else{
    titulo = 'Todo el catálogo';
    subtitulo = 'Cuerda, teclados, percusión, viento, audio y accesorios';
  }

  /* Un vacío por filtros no es lo mismo que una categoría sin catálogo
     cargado: el primero se arregla quitando un chip, el segundo solo
     escribiendo a la tienda. */
  /* Solo en la categoría y en las ofertas: en una búsqueda o en el catálogo
     entero no hay nada propio que contar, y un párrafo genérico repetido en
     todas las pantallas sería justo lo contrario de lo que se busca. */
  /* El `intro` está escrito para la categoría entera —el de Cuerda empieza
     hablando de guitarras—, así que en una subcategoría estorba más de lo que
     ayuda y no se enseña. */
  const intro = cat ? (subUnico ? '' : cat.intro) : (state.offersOnly && !state.search ? INTRO_OFERTAS : '');
  const introHtml = intro ? `<p class="cat-intro">${escapeHtml(intro)}</p>` : '';

  /* Se consume al pintarlo: al filtrar o al cambiar de categoría ya no tiene
     sentido seguir avisando de algo que pasó dos pantallas atrás. */
  const avisoHtml = avisoProductoRetirado ? `
    <div class="aviso-retirado">
      <b>Ese producto ya no está en el catálogo.</b>
      <span>Lo retiramos de la tienda. Esto es todo lo que sí tenemos ahora; si buscabas algo puntual, pregúntanos por WhatsApp.</span>
      <a target="_blank" rel="noopener" href="${waHref('Hola, entré a un producto que ya no está en la web. ¿Me ayudan a encontrar algo parecido?')}"
         onclick="trackAdsConversion('whatsapp')">Preguntar por WhatsApp ›</a>
    </div>` : '';
  avisoProductoRetirado = false;

  const sinCatalogo = Boolean(state.activeCat) && !productosDeCategoria(state.activeCat).length;

  let cuerpo;
  if(sinCatalogo){
    cuerpo = `
      <div class="catalogo-en-camino">
        <div class="cec-titulo">Catálogo en camino</div>
        <p>Tenemos stock de ${escapeHtml(titulo.toLowerCase())} en tienda, pero aún no está cargado aquí. Escríbenos y te mandamos fotos y precios al instante.</p>
        <a class="btn-app verde" target="_blank" rel="noopener"
           href="${waHref('Hola, quiero consultar por ' + titulo.toLowerCase() + '.')}"
           onclick="trackAdsConversion('whatsapp')">Consultar por WhatsApp</a>
      </div>`;
  }else if(!list.length){
    cuerpo = `
      <div class="sin-resultados">
        <p>Ningún producto cumple con esos filtros.</p>
        <button type="button" class="btn-app contorno" onclick="clearFilters()">Limpiar filtros</button>
      </div>`;
  }else{
    /* El producto que tiene anuncio no sale además como tarjeta normal: el
       anuncio ocupa su lugar y lleva a la misma ficha. */
    const anuncios = anunciosGrillaHtml(list);
    const conAnuncio = new Set(anuncios.map(a=>a.id));
    const tarjetas = list.filter(p=>!conAnuncio.has(p.id)).map((p,i)=>appProductCard(p, 118, esEscritorio(), i));
    anuncios.forEach((a,k)=>tarjetas.splice(Math.min(2+k, tarjetas.length), 0, a.html));
    cuerpo = `<div class="grid-app">${tarjetas.join('')}</div>`;
  }

  /* En escritorio la pantalla es otra: migas, título grande con los chips de
     orden al lado y dos columnas, panel de filtros fijo a la izquierda. */
  if(esEscritorio()){
    const miga = cat
      ? escapeHtml(cat.label)
      : state.offersOnly ? 'Ofertas' : state.search ? 'Búsqueda' : 'Todo el catálogo';
    return `
    <div class="app-shell cat-esc">
      <nav class="migas" aria-label="Ruta">
        <a href="/" onclick="goHome();return false;">Inicio</a><span>·</span><b>${miga}</b>
      </nav>
      <header class="cat-head">
        <div class="cat-head-texto">
          <h1 class="cat-titulo h-serif">${escapeHtml(titulo)}</h1>
          <div class="cat-conteo">${list.length} producto${list.length!==1?'s':''}${subtitulo?' · '+escapeHtml(subtitulo):''}</div>
          ${avisoHtml}
          ${introHtml}
        </div>
        ${sinCatalogo ? '' : chipsOrdenHtml()}
      </header>
      <div class="cat-layout">
        ${sidebarCategoriaHtml()}
        <div class="cat-lista">${guiaGuitarrasHtml()}${cuerpo}</div>
      </div>
    </div>`;
  }

  return `
  <div class="app-shell">
    <header class="app-head cat">
      <div class="app-head-fila">
        <button type="button" class="btn-volver" onclick="volverAtras()" aria-label="Volver">‹</button>
        <div class="app-head-texto">
          <h1 class="app-head-nombre">${escapeHtml(titulo)}</h1>
          <div class="app-head-sub">${list.length} producto${list.length!==1?'s':''}${subtitulo?' · '+escapeHtml(subtitulo):''}</div>
        </div>
        ${pillAsesorHtml()}
      </div>
      ${sinCatalogo ? '' : subsMovilHtml() + chipsFiltroHtml()}
    </header>
    ${avisoHtml}
    <div style="padding:0 16px">${guiaGuitarrasHtml()}</div>
    ${cuerpo}
  </div>`;
}

/* ======================================================================
   FILTER ACTIONS
   ====================================================================== */
/* Cada chip se pone y se quita. Ninguno recarga la página ni toca la URL: la
   categoría sigue siendo la misma, solo cambia lo que se enseña de ella.
   Después de repintar se sube al principio de la lista, porque si no el
   filtro parece no haber hecho nada cuando estabas a medio scroll. */
function trasFiltrar(){
  /* Los chips cambian lo que se ve, así que también cambian la página: quitar
     "Ukeleles" no puede dejar /categoria/cuerda/ukeleles en la barra. Va con
     replace y no con push para no meter un paso de historial por cada chip. */
  if(state.view==='shop' && !state.offersOnly){
    navigateTo(rutaDeCatalogo(), false);
    applyCurrentViewMeta();
  }
  render();
  /* En el teléfono los chips van en la cabecera y la lista empieza debajo:
     sin este salto el filtro parece no haber hecho nada cuando estabas a
     medio scroll. En escritorio el panel de filtros está fijo al costado y
     la grilla se ve entera, así que mover la página solo despista. */
  if(!esEscritorio()) window.scrollTo({top:0, behavior:'smooth'});
}
function toggleOrdenPrecio(){
  state.sort = state.sort==='price-asc' ? 'relevancia' : 'price-asc';
  trasFiltrar();
}
function toggleSoloOfertas(){ state.soloOfertas = !state.soloOfertas; trasFiltrar(); }
function toggleSoloStock(){ state.soloStock = !state.soloStock; trasFiltrar(); }
function toggleTope(){
  state.priceMax = state.priceMax <= LIMITE_CHIP_PRECIO ? PRICE_MAX : LIMITE_CHIP_PRECIO;
  trasFiltrar();
}
/* Una sola subcategoría a la vez: tocar otra reemplaza a la anterior, y
   volver a tocar la activa la quita. */
function toggleChipSub(subKey){
  const yaActiva = state.activeSubs.has(subKey);
  state.activeSubs = new Set(yaActiva ? [] : [subKey]);
  trasFiltrar();
}
/* Limpia los filtros pero NO la categoría: quien pulsa "Limpiar" dentro de
   Percusión quiere ver toda la percusión, no todo el catálogo. */
function clearFilters(){
  state.activeSubs = new Set();
  state.rangosPrecio = new Set();
  state.soloOfertas = false;
  state.soloStock = false;
  state.etiqueta = null;
  state.priceMin = 0;
  state.priceMax = PRICE_MAX;
  state.sort = 'relevancia';
  trasFiltrar();
}

/* Quitar dentro de un bloque vacía SOLO ese bloque. El de subcategorías pasa
   por trasFiltrar porque la subcategoría está en la URL
   (/categoria/cuerda/ukeleles) y hay que devolverla a /categoria/cuerda; el
   precio no vive en la URL y le basta con repintar. */
function limpiarSubs(){ state.activeSubs = new Set(); trasFiltrar(); }
function limpiarPrecio(){
  state.rangosPrecio = new Set();
  state.soloStock = false;
  render();
}

/* ---------------- filtros del panel lateral (escritorio) ----------------
   Repintan sin subir al principio de la lista: el panel está a la vista y
   quien pone un filtro quiere ver cómo cambia la grilla de al lado, no
   perder el sitio. */
function toggleRangoPrecio(key){
  if(state.rangosPrecio.has(key)) state.rangosPrecio.delete(key);
  else state.rangosPrecio.add(key);
  render();
}
function setOrden(valor){
  state.sort = valor;
  render();
}

/* ======================================================================
   CART
   ====================================================================== */
/* ======================================================================
   PRODUCT DETAIL (quick view) — galería de fotos + video
   ====================================================================== */
let pdState = { productId: null, activeIndex: 0, qty: 1 };

function openProductDetail(id, push){
  const p = PRODUCTS.find(x => x.id === id);
  if(!p) return;
  /* La ficha dejó de ser una ventana encima del catálogo y pasó a ser una
     página con su propia URL. El modal se queda para las políticas y el
     panel de administrador, así que si venía abierto hay que cerrarlo. */
  document.getElementById('modalOverlay').classList.remove('show');
  pdState = { productId: id, activeIndex: 0, qty: 1 };
  state.view = 'producto';
  navigateTo(hrefProducto(p), push);
  render();
  if(push !== false) window.scrollTo({top:0});
  const priceLine = `S/ ${p.price}${p.old ? ` (antes S/ ${p.old})` : ''}`;
  setPageMeta(
    `${p.name} | Chipao Music`,
    `${p.name} — ${priceLine}. Tienda de instrumentos musicales en San Juan de Miraflores, Lima, con envíos a todo el Perú.`,
    { image: (p.images && p.images[0]) || DEFAULT_OG_IMAGE, type: 'product' }
  );
  setPageSchema(productSchema(p));
}

/* Si alguien abre un link con ?producto=ID, muestra ese producto directo */
function checkProductUrlTrigger(){
  // Links viejos con ?producto=ID (de antes de tener URLs reales):
  // se abren igual y la URL se actualiza sola al formato nuevo.
  const params = new URLSearchParams(window.location.search);
  const legacyId = Number(params.get('producto'));
  if(legacyId && PRODUCTS.some(p=>p.id===legacyId)){
    openProductDetail(legacyId, false);
    return;
  }
  // No pisar el enlace secreto del panel de administración: routeFromPath
  // cierra cualquier modal abierto y reescribe la URL sin query string,
  // lo que borraba el ?panel=... justo después de que checkAdminUrlTrigger
  // abriera el login.
  if(params.get('panel') === ADMIN_URL_KEY) return;
  routeFromPath(false);
}

/* Detecta el color de una foto por su nombre de archivo (ej. ".../xilofono-25-notas-azul.jpg" -> "Azul"),
   para mostrar selectores de color en la ficha de producto sin necesitar un campo nuevo en la base de datos. */
const COLOR_WORDS = {
  'marron-entero':'Marrón Entero',
  azul:'Azul', celeste:'Celeste', turquesa:'Turquesa',
  amarillo:'Amarillo', amarilla:'Amarillo', dorado:'Dorado', dorada:'Dorado',
  rojo:'Rojo', roja:'Rojo', rosado:'Rosado', rosada:'Rosado', rosa:'Rosa', vino:'Vino', granate:'Granate',
  verde:'Verde',
  morado:'Morado', morada:'Morado', lila:'Lila', violeta:'Violeta', purpura:'Púrpura',
  naranja:'Naranja', anaranjado:'Naranja', sambar:'Naranja', madera:'Madera',
  negro:'Negro', negra:'Negro', blanco:'Blanco', blanca:'Blanco', gris:'Gris', plateado:'Plateado', plateada:'Plateado',
  caoba:'Caoba', natural:'Natural', natual:'Natural', marron:'Marrón', cafe:'Café'
};
/* Ordena las claves más largas primero, para que "marron-entero" no quede
   eclipsada por la coincidencia genérica de "marron". */
const COLOR_KEYS_BY_SPECIFICITY = Object.keys(COLOR_WORDS).sort((a,b)=>b.length-a.length);
function colorFromImageUrl(url){
  if(!url) return null;
  /* Quita solo la extensión (lo de después del ÚLTIMO punto): un nombre
     como "armonica.azul.jpg" tiene dos puntos, y cortar en el primero
     -como hacía antes- se comía el color entero y dejaba "armonica". */
  let base = (url.split('/').pop()||'').replace(/\.[^./]+$/, '').toLowerCase();
  try{ base = decodeURIComponent(base); }catch(err){}
  /* "diseno 1", "diseño-2"...: variantes que no son un color (el estuche de
     zampoña). Se tratan igual que un color: una foto = una opción. */
  const dis = base.match(/dise[nñ]o[\s_-]*(\d+)/);
  if(dis) return 'Diseño ' + dis[1];
  for(const key of COLOR_KEYS_BY_SPECIFICITY){
    if(base.includes(key)) return COLOR_WORDS[key];
  }
  return null;
}

/* Color aproximado para pintar cada punto de color en la tarjeta del catálogo. */
/* Rojo, Natural, Negro y Azul usan los hexes del handoff: están calibrados
   para la paleta de papel, donde los saturados de antes (#c0392b, #1e5fbf)
   chillaban al lado del terracota. El resto se deja como estaba. */
const COLOR_HEX = {
  'Rojo':'#9E2B20', 'Rosado':'#f48fb1', 'Rosa':'#f6c6d9', 'Vino':'#6d1b2f', 'Granate':'#7a1f2b',
  'Azul':'#2A4A7A', 'Celeste':'#6ec6ff', 'Turquesa':'#1abc9c',
  'Amarillo':'#f4c430', 'Dorado':'#c9a227',
  'Verde':'#2e7d32',
  'Morado':'#7b3fa0', 'Lila':'#b39ddb', 'Violeta':'#8e44ad', 'Púrpura':'#8e2de2',
  'Naranja':'#e8791d', 'Madera':'#a1662f',
  'Negro':'#24211E', 'Blanco':'#ffffff', 'Gris':'#9e9e9e', 'Plateado':'#c0c0c0',
  'Caoba':'#6b3423', 'Natural':'#C89A5B', 'Marrón':'#6d4c30', 'Café':'#4b3221', 'Marrón Entero':'#5a3a22'
};

/* Colores únicos de un producto (para los puntos de color en su tarjeta). */
/* ======================================================================
   FICHA DE PRODUCTO

   Página propia (/producto/<id>-<slug>), no una ventana encima del catálogo:
   tiene su URL, su <head> y su botón atrás.
   ====================================================================== */

/* --------- lo que se puede sacar de la descripción de la base ---------
   La descripción es texto libre que se escribe desde el panel de
   administrador. Cuando trae los encabezados "Características:" y
   "Contenido:" —el formato con el que está cargada la guitarra— se
   convierten en la tabla de especificaciones y en el bloque "Incluye" del
   handoff. Si no los trae, esas secciones sencillamente no salen: es
   preferible a rellenarlas con datos inventados.

   Hoy solo un producto del catálogo usa ese formato. El intérprete queda
   puesto para que cualquier ficha que se escriba así lo aproveche sin tocar
   una línea de código. */
function parseDescripcion(texto){
  const vacio = { parrafos: [], specs: [], incluye: [] };
  if(!texto) return vacio;

  const parrafos = [], specs = [], incluye = [];
  let seccion = 'cuerpo';

  for(const cruda of String(texto).split('\n')){
    const linea = cruda.trim();
    if(!linea) continue;

    if(/^caracter[ií]sticas\s*:?\s*$/i.test(linea)){ seccion = 'specs'; continue; }
    if(/^(contenido|incluye)\s*:?\s*$/i.test(linea)){ seccion = 'incluye'; continue; }

    if(seccion === 'specs'){
      /* "* Cuerdas: Nylon" da clave y valor. "* Recomendado para Aprendizaje"
         no tiene dos puntos: se guarda como fila sin valor. */
      const item = linea.replace(/^[*\-•]\s*/, '');
      const corte = item.indexOf(':');
      if(corte > 0) specs.push({ k: item.slice(0, corte).trim(), v: item.slice(corte + 1).trim() });
      else specs.push({ k: item, v: '' });
      continue;
    }

    if(seccion === 'incluye'){
      /* Puede venir como lista con viñetas o como una sola línea separada por
         comas ("Guitarra, Funda, Plumillas, Llave de calibración."). */
      const item = linea.replace(/^[*\-•]\s*/, '').replace(/\.$/, '');
      if(/^[*\-•]/.test(linea)){
        incluye.push(item);
      }else{
        for(const trozo of item.split(',')) if(trozo.trim()) incluye.push(trozo.trim());
      }
      continue;
    }

    parrafos.push(linea);
  }
  return { parrafos, specs, incluye };
}

/* Cambiar de swatch es cambiar de foto: cada variante de color ES una de las
   fotos del producto. */
function setActiveSlide(i){
  pdState.activeIndex = i;
  render();
}

/* La foto de la ficha, a pantalla completa. Solo aplica a fotos, no a video
   ni a los iframes de YouTube: esos ya tienen su propio control. */
function abrirFotoZoom(){
  const p = productoPorId(pdState.productId);
  const url = p && (p.images || [])[pdState.activeIndex];
  if(!url) return;
  document.getElementById('fotoZoomImg').src = fotoUrl(url, ANCHO_ZOOM);
  document.getElementById('fotoZoomOverlay').classList.add('show');
  zoomFoto.s = 1; zoomFoto.x = 0; zoomFoto.y = 0;
  pintarZoomFoto(false);
  /* La pista solo en pantallas táctiles, y se va sola a los 2,5 segundos. */
  const ayuda = document.getElementById('fotoZoomAyuda');
  if(ayuda && 'ontouchstart' in window){
    ayuda.classList.add('ver');
    setTimeout(() => ayuda.classList.remove('ver'), 2500);
  }
}
function cerrarFotoZoom(){
  document.getElementById('fotoZoomOverlay').classList.remove('show');
  document.getElementById('fotoZoomAyuda').classList.remove('ver');
}

/* Zoom de la foto ampliada: pellizco con dos dedos, arrastre con uno cuando
   ya está acercada, doble toque para acercar y volver, y rueda en el
   escritorio. Es JavaScript a mano con eventos táctiles y no PointerEvents
   porque Safari de iPhone viejo (<13) no los tiene.

   zoomFoto guarda escala (s) y desplazamiento (x, y) en píxeles respecto al
   centro de la pantalla. Al acercar, el punto que queda bajo los dedos se
   mantiene quieto: u = (punto - desplazamiento) / escala. */
const ZOOM_MAX = 4;
const zoomFoto = { s:1, x:0, y:0 };
let gestoZoom = null, ultimoToqueZoom = 0, bloqueoToqueZoom = 0;

function pintarZoomFoto(animar){
  const img = document.getElementById('fotoZoomImg');
  if(!img) return;
  img.classList.toggle('anima', !!animar);
  img.style.transform = `translate(${zoomFoto.x}px,${zoomFoto.y}px) scale(${zoomFoto.s})`;
}
/* Que la foto no se pueda arrastrar fuera de la pantalla: el desplazamiento
   máximo es lo que sobra de la foto ya ampliada respecto a la pantalla. */
function acotarZoomFoto(){
  const img = document.getElementById('fotoZoomImg');
  const ov = document.getElementById('fotoZoomOverlay');
  const maxX = Math.max(0, (img.offsetWidth * zoomFoto.s - ov.clientWidth) / 2);
  const maxY = Math.max(0, (img.offsetHeight * zoomFoto.s - ov.clientHeight) / 2);
  zoomFoto.x = Math.min(maxX, Math.max(-maxX, zoomFoto.x));
  zoomFoto.y = Math.min(maxY, Math.max(-maxY, zoomFoto.y));
}
/* Cambia la escala dejando quieto el punto (cx, cy), en coordenadas de pantalla. */
function escalarZoomFoto(nueva, cx, cy){
  const ov = document.getElementById('fotoZoomOverlay');
  nueva = Math.min(ZOOM_MAX, Math.max(1, nueva));
  const px = cx - ov.clientWidth / 2, py = cy - ov.clientHeight / 2;
  const ux = (px - zoomFoto.x) / zoomFoto.s, uy = (py - zoomFoto.y) / zoomFoto.s;
  zoomFoto.s = nueva;
  zoomFoto.x = px - nueva * ux;
  zoomFoto.y = py - nueva * uy;
  if(nueva === 1){ zoomFoto.x = 0; zoomFoto.y = 0; }
  acotarZoomFoto();
}
function dobleToqueZoomFoto(cx, cy){
  escalarZoomFoto(zoomFoto.s > 1.05 ? 1 : 2.5, cx, cy);
  pintarZoomFoto(true);
}
function distanciaDedos(t){
  return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
}
(function(){
  const ov = document.getElementById('fotoZoomOverlay');
  if(!ov) return;
  ov.addEventListener('touchstart', e => {
    if(e.target.closest('.foto-zoom-close')) return;
    const t = e.touches;
    if(t.length === 2){
      gestoZoom = { tipo:'pellizco', d: distanciaDedos(t), s: zoomFoto.s };
    }else if(t.length === 1){
      gestoZoom = { tipo:'arrastre', x: t[0].clientX, y: t[0].clientY,
                    ox: zoomFoto.x, oy: zoomFoto.y, movido:false };
    }
  }, { passive: true });
  ov.addEventListener('touchmove', e => {
    if(!gestoZoom) return;
    e.preventDefault();
    const t = e.touches;
    if(gestoZoom.tipo === 'pellizco' && t.length === 2){
      const cx = (t[0].clientX + t[1].clientX) / 2, cy = (t[0].clientY + t[1].clientY) / 2;
      escalarZoomFoto(gestoZoom.s * distanciaDedos(t) / gestoZoom.d, cx, cy);
      pintarZoomFoto(false);
    }else if(gestoZoom.tipo === 'arrastre' && t.length === 1){
      const dx = t[0].clientX - gestoZoom.x, dy = t[0].clientY - gestoZoom.y;
      if(Math.abs(dx) + Math.abs(dy) > 14) gestoZoom.movido = true;   // el dedo tiembla al tocar rápido
      if(zoomFoto.s > 1){
        zoomFoto.x = gestoZoom.ox + dx; zoomFoto.y = gestoZoom.oy + dy;
        acotarZoomFoto();
        pintarZoomFoto(false);
      }
    }
  }, { passive: false });
  ov.addEventListener('touchend', e => {
    const g = gestoZoom;
    if(e.touches.length === 1){   // soltó un dedo del pellizco: sigue con el otro
      const t = e.touches[0];
      gestoZoom = { tipo:'arrastre', x:t.clientX, y:t.clientY, ox:zoomFoto.x, oy:zoomFoto.y, movido:true };
      return;
    }
    gestoZoom = null;
    if(!g || g.tipo !== 'arrastre' || g.movido || e.target.closest('.foto-zoom-close')) return;
    /* Un toque suelto: dos seguidos en menos de 350 ms son el doble toque.
       Tras uno, los toques que sigan en la siguiente media segundo se
       ignoran: quien toca cuatro o cinco veces seguidas no quiere acercar y
       alejar, quiere acercar, y antes el tercero y el cuarto deshacían todo. */
    /* Un toque fuera de la foto no cuenta: ese sigue cerrando el visor. */
    if(e.target !== document.getElementById('fotoZoomImg')) return;
    const ahora = Date.now(), c = e.changedTouches[0];
    e.preventDefault();
    if(ahora < bloqueoToqueZoom) return;
    if(ahora - ultimoToqueZoom < 350){
      ultimoToqueZoom = 0;
      bloqueoToqueZoom = ahora + 500;
      dobleToqueZoomFoto(c.clientX, c.clientY);
    }else{
      ultimoToqueZoom = ahora;
    }
  }, { passive: false });
  /* Escritorio: doble clic y rueda. */
  ov.addEventListener('dblclick', e => {
    if(e.target.closest('.foto-zoom-close')) return;
    dobleToqueZoomFoto(e.clientX, e.clientY);
  });
  ov.addEventListener('wheel', e => {
    e.preventDefault();
    escalarZoomFoto(zoomFoto.s * (e.deltaY < 0 ? 1.2 : 1 / 1.2), e.clientX, e.clientY);
    pintarZoomFoto(false);
  }, { passive: false });
})();

/* Deslizar sobre la foto para cambiar de color en el teléfono. Los swatches
   siguen ahí: esto es un atajo, no un reemplazo, porque un gesto no se ve y
   nadie lo descubre si no lo prueba.

   Da la vuelta al llegar al final: con cuatro o cinco colores, volver al
   primero es más cómodo que chocar contra un tope.

   El listener va en el documento y no en la galería porque render() rehace
   el HTML entero en cada cambio: uno puesto sobre el elemento moriría con la
   primera foto. */
let gestoFicha = null;

function cambiarSlideFicha(paso){
  const p = productoPorId(pdState.productId);
  if(!p) return;
  const total = (p.images || []).length + (p.video ? 1 : 0);
  if(total < 2) return;
  setActiveSlide((pdState.activeIndex + paso + total) % total);
  const el = document.querySelector('.ficha-galeria img, .ficha-galeria video');
  if(el) el.classList.add(paso > 0 ? 'entra-der' : 'entra-izq');
}

document.addEventListener('touchstart', (e) => {
  const g = e.target.closest && e.target.closest('.ficha-galeria');
  if(!g || e.touches.length !== 1){ gestoFicha = null; return; }
  gestoFicha = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
}, { passive: true });

document.addEventListener('touchend', (e) => {
  const g = gestoFicha;
  gestoFicha = null;
  if(!g || !e.changedTouches.length) return;
  const dx = e.changedTouches[0].clientX - g.x;
  const dy = e.changedTouches[0].clientY - g.y;
  /* Tres filtros: que haya recorrido, que sea claramente horizontal -si no,
     robaríamos el scroll de la página- y que no sea un arrastre lento. */
  if(Math.abs(dx) < 45) return;
  if(Math.abs(dx) < Math.abs(dy) * 1.6) return;
  if(Date.now() - g.t > 700) return;
  cambiarSlideFicha(dx < 0 ? 1 : -1);
}, { passive: true });

/* Stepper de cantidad del panel de compra de escritorio. En el teléfono la
   barra fija solo tiene el CTA y se agrega de uno en uno, así que pdState.qty
   se queda en 1 y esta función no se usa. */
function cambiarQtyFicha(delta){
  const tope = stockOf(pdState.productId) || 1;
  pdState.qty = Math.min(Math.max(1, pdState.qty + delta), tope);
  render();
}

/* Preguntas frecuentes de la ficha. Las mismas frases viven en src/index.js
   (faqProducto): lo que ve el cliente y lo que lee el rastreador, con el
   schema FAQPage, tienen que decir exactamente lo mismo. Si cambias una,
   cambia la otra. */
function faqFicha(p){
  const lista = [
    ['¿Cuánto cuesta el envío y en cuánto tiempo llega?',
      'A Lima Metropolitana el envío cuesta S/ 10 y lo recibes en menos de 24 horas. Al resto del Perú cuesta S/ 15 y llega en 1 a 3 días hábiles a la agencia Shalom que elijas, donde lo recoges. Solo enviamos dentro del Perú.'],
    ['¿Puedo recogerlo o probarlo en la tienda?',
      'Sí. El recojo en tienda es gratis y, si hay stock, tu pedido está listo en 1 hora. También puedes visitarnos y probar el instrumento antes de comprar, en nuestro horario de atención: de lunes a domingo, de 9:30 a.m. a 9:00 p.m., en Av. Los Héroes 382, San Juan de Miraflores. Si lo recoge un motorizado, indícanos sus datos al comprar.'],
    ['¿Cómo puedo pagar?',
      'Con Yape (subes la captura del comprobante y la validamos), con tarjeta de crédito o débito Visa y Mastercard por Mercado Pago, o coordinando el pago por WhatsApp o al recoger en tienda.'],
    ['¿Dan boleta o factura?',
      'Sí, emitimos boleta o factura. Indícanos cuál necesitas al hacer tu compra.'],
    ['¿Tiene garantía?',
      'Sí, 6 meses de garantía contra defectos de fábrica, contados desde la fecha de compra.'],
    ['¿Puedo devolverlo?',
      'Sí. Tienes hasta 15 días calendario desde que lo recibes, con su embalaje original y accesorios, y sin signos de uso. El costo del envío de la devolución lo paga el cliente.'],
  ];
  if(p.cat === 'cuerda'){
    lista.push(['¿El instrumento se entrega afinado?',
      'Sale afinado de la tienda. En los envíos a provincia recomendamos mandarlo sin afinar, porque la altura puede dañar las cuerdas si van tensadas; lo afinas al recibirlo.']);
  }
  if((p.stock || 0) <= 0){
    lista.push(['¿Cuánto demora si el producto está bajo pedido?',
      'Lo conseguimos en 1 a 2 días hábiles. Escríbenos por WhatsApp y te confirmamos.']);
  }
  return lista;
}
function faqFichaHtml(p){
  return `<section class="ficha-faq">
    <h2>Preguntas frecuentes</h2>
    ${faqFicha(p).map(([q, a]) => `<details><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join('')}
  </section>`;
}

function renderProductDetail(){
  const p = productoPorId(pdState.productId);
  if(!p){
    return `<div class="app-shell"><div class="sin-resultados">
      <p>Este producto ya no está en el catálogo.</p>
      <button type="button" class="btn-app contorno" onclick="goShop(null)">Ver el catálogo</button>
    </div></div>`;
  }

  const cat = CATEGORIES.find(c => c.key === p.cat);
  const images = p.images || [];
  const slides = [...images.map(url => ({type:'image', url})), ...(p.video ? [{type:'video', url:p.video}] : [])];
  if(pdState.activeIndex >= slides.length) pdState.activeIndex = 0;
  const activo = slides[pdState.activeIndex];
  const stock = p.stock || 0;
  const { parrafos, specs, incluye } = parseDescripcion(p.description);

  /* Las variantes no son un campo de la base: se deducen del nombre del
     archivo de cada foto (ver colorFromImageUrl), así que cada swatch es a la
     vez un color y la foto que le corresponde. */
  const colores = images.map(colorFromImageUrl);
  /* Hacen falta dos colores DISTINTOS: un violin con cuatro fotos que se llaman
     todas 'violeta 1..4' es un solo producto con varias fotos, no cuatro colores. */
  const hayColores = new Set(colores.filter(Boolean)).size >= 2;
  const colorActivo = colores[pdState.activeIndex];

  let galeria;
  if(!activo){
    galeria = `<span class="ficha-sinfoto">${iconSvg(iconFor(p))}</span>`;
  }else if(activo.type === 'image'){
    galeria = `<button type="button" class="ficha-foto-zoom-btn" onclick="abrirFotoZoom()" aria-label="Ampliar foto">
      <img src="${fotoUrl(activo.url, ANCHO_GALERIA)}" alt="${escapeHtml(p.name)}${colorActivo ? ' — ' + escapeHtml(colorActivo) : ''}" decoding="async" fetchpriority="high">
    </button>`;
  }else{
    const embed = toEmbedUrl(activo.url);
    galeria = embed
      ? `<iframe src="${embed}" title="${escapeHtml(p.name)}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`
      : `<video src="${activo.url}" controls playsinline></video>`;
  }

  const enCarrito = state.cart.reduce((s,c) => s + c.qty, 0);
  const ahorro = enOferta(p) ? p.old - p.price : 0;
  const consulta = `Hola, me interesa ${p.name}${colorActivo ? ' (' + (esDiseno(colorActivo) ? '' : 'color ') + colorActivo + ')' : ''}. ¿Está disponible?`;

  /* Puntitos debajo de la foto: dicen cuántas fotos hay y en cuál estás, y
     son la pista de que se puede deslizar. Cada uno lleva a su foto, así que
     también sirven de atajo para quien prefiera tocar.
     Por encima de ocho fotos dejan de leerse y vuelve el contador "N de M";
     hoy el producto con más fotos tiene seis. */
  const puntosHtml = (slides.length < 2 || slides.length > 8) ? '' : `
    <div class="ficha-puntos" role="tablist" aria-label="Fotos del producto">
      ${slides.map((_, i) => {
        const sel = i === pdState.activeIndex;
        const etiqueta = colores[i] || ('Foto ' + (i + 1));
        return `<button type="button" class="punto-foto${sel ? ' sel' : ''}" role="tab"
          aria-label="${escapeHtml(etiqueta)}" aria-selected="${sel ? 'true' : 'false'}"
          onclick="setActiveSlide(${i})"></button>`;
      }).join('')}
    </div>`;

  const swatchesHtml = !hayColores ? '' : `
      <div class="ficha-color-label">${palabraVariante(colores)} — <span>${escapeHtml(colorActivo ? colorActivo.replace(/^Diseño /,'') : 'elige uno')}</span></div>
      <div class="ficha-swatches">
        ${images.map((url, i) => {
          const label = colores[i];
          if(!label) return '';
          const sel = i === pdState.activeIndex;
          return `<button type="button" class="swatch${sel ? ' sel' : ''}"
            style="${esDiseno(label) ? `background:#fff url('${fotoUrl(url, ANCHO_MINIATURA)}') center/cover no-repeat` : `background:${COLOR_HEX[label] || '#ccc'}`}"
            aria-label="${escapeHtml(label)}" aria-pressed="${sel ? 'true' : 'false'}"
            onclick="setActiveSlide(${i})"></button>`;
        }).join('')}
      </div>`;

  const asesorHtml = `
      <a class="bloque-asesor" target="_blank" rel="noopener"
         href="${waHref(consulta)}" onclick="trackAdsConversion('whatsapp')">
        <span class="asesor-icono">${iconWhatsapp}</span>
        <span class="asesor-texto">
          <span class="asesor-titulo">¿Dudas con el instrumento?</span>
          <span class="asesor-sub">Te responde un asesor de la tienda en minutos.</span>
        </span>
        <span class="asesor-chevron">›</span>
      </a>`;

  /* ---------------- escritorio ----------------
     Foto grande con sus miniaturas y, debajo, descripción y especificaciones
     a dos columnas. El panel de compra se queda pegado al costado mientras
     se lee todo lo demás. */
  if(esEscritorio()){
    const preciosHtml = `
      <div class="ficha-precios">
        <span class="ficha-precio">${fmt(p.price)}</span>
        ${enOferta(p) ? `
          <span class="ficha-antes">${fmt(p.old)}</span>
          <span class="ficha-ahorras">Ahorras ${fmt(ahorro)}</span>` : ''}
      </div>${resenasFichaHtml()}${pagoFichaHtml(p)}`;

    const thumbs = slides.length > 1 ? `
      <div class="fe-thumbs">
        ${slides.map((s, i) => `
          <button type="button" class="fe-thumb${i === pdState.activeIndex ? ' sel' : ''}"
                  aria-label="Ver imagen ${i + 1}" onclick="setActiveSlide(${i})">
            ${s.type === 'image'
              ? `<img src="${fotoUrl(s.url, ANCHO_MINIATURA)}" alt="" loading="lazy" decoding="async">`
              : `<span class="fe-thumb-video">▶</span>`}
          </button>`).join('')}
      </div>` : '';

    return `
    <div class="app-shell ficha-esc">
      <nav class="migas" aria-label="Ruta">
        <a href="/" onclick="goHome();return false;">Inicio</a><span>·</span>
        ${cat ? `<a href="${hrefCategoria(cat.key)}" onclick="goShop('${cat.key}');return false;">${escapeHtml(cat.label)}</a><span>·</span>` : ''}
        <b>${escapeHtml(p.name)}</b>
      </nav>

      <div class="fe-layout">
        <div class="fe-izq">
          <div class="fe-foto">${galeria}</div>
          ${thumbs}
          <div class="fe-texto">
            <section>
              <h2 class="fe-h2 h-serif">Sobre este instrumento</h2>
              ${parrafos.length
                ? `<div class="fe-desc">${parrafos.map(t => `<p>${escapeHtml(t)}</p>`).join('')}</div>`
                : `<div class="fe-desc"><p>Escríbenos por WhatsApp y te contamos todo sobre este instrumento: nivel, medidas y qué trae.</p></div>`}
              ${incluye.length ? `
              <div class="ficha-incluye">
                <div class="incluye-titulo">Incluye</div>
                ${incluye.map(i => `<div class="incluye-item"><span class="incluye-punto"></span>${escapeHtml(i)}</div>`).join('')}
              </div>` : ''}
            </section>
            ${specs.length ? `
            <section>
              <h2 class="fe-h2 h-serif">Especificaciones</h2>
              <div class="ficha-specs">
                ${specs.map(s => `<div class="spec-fila">
                  <span class="spec-k">${escapeHtml(s.k)}</span>
                  ${s.v ? `<span class="spec-v">${escapeHtml(s.v)}</span>` : ''}
                </div>`).join('')}
              </div>
            </section>` : ''}
            ${faqFichaHtml(p)}
          </div>
        </div>

        <div class="fe-der">
          <div class="fe-panel">
            ${fichaCategoriaHtml(cat)}
            <h1 class="ficha-nombre">${escapeHtml(p.name)}</h1>
            ${preciosHtml}
            <div class="ficha-chips">
              ${stock > 0
                ? '<span class="ficha-chip verde">En stock</span>'
                : '<span class="ficha-chip neutro">Bajo pedido</span>'}
              ${incluyeEstuche(p) ? '<span class="ficha-chip verde">Incluye estuche</span>' : ''}
        <span class="ficha-chip neutro">Envío a todo el Perú</span>
              ${stock > 0 && stock <= 3 ? `<span class="ficha-chip alerta">Quedan ${stock}</span>` : ''}
            </div>
            ${swatchesHtml}

            <div class="fe-compra">
              ${stock > 0 ? `
              <div class="fe-stepper">
                <button type="button" onclick="cambiarQtyFicha(-1)" aria-label="Quitar uno"${pdState.qty<=1?' disabled':''}>−</button>
                <span aria-live="polite">${pdState.qty}</span>
                <button type="button" onclick="cambiarQtyFicha(1)" aria-label="Agregar uno"${pdState.qty>=stock?' disabled':''}>+</button>
              </div>
              <button type="button" class="btn-app terracota" onclick="addFromDetail(${p.id})">Agregar al carrito</button>`
              : '<button type="button" class="btn-app terracota" disabled>Agotado</button>'}
            </div>
            ${enCarrito > 0 ? `<a class="btn-app contorno fe-ir-carrito" href="/carrito" onclick="goCart();return false;">Ir al carrito (${enCarrito})</a>` : ''}

            <div class="fe-datos">
              <span><b>Recojo en tienda</b> listo en 1 hora</span>
              <span><b>Envío a todo el Perú</b> desde ${fmt(SHIPPING_FEE)}</span>
              <span><b>Pagas como quieras</b> Yape o tarjeta</span>
            </div>
          </div>
          ${avisoTallerHtml(p)}
          ${asesorHtml}
        </div>
      </div>
      ${complementosHtml(p)}${recomendadosHtml(p)}
    </div>`;
  }

  /* Cabecera de la ficha: la marca, el buscador y el carrito, para poder
     seguir mirando sin tener que volver atrás dos veces. */
  const cabeceraFicha = `
    <header class="app-head ficha-head">
      <div class="app-head-fila">
        <button type="button" class="btn-volver" onclick="volverAtras()" aria-label="Volver">‹</button>
        <a class="ficha-marca" href="/" onclick="goHome();return false;">
          <logo-gorro><img src="/img/logo-redondo.webp" alt="" width="32" height="32"></logo-gorro>
          <b>Chipao Music</b>
        </a>
        <a class="ficha-lupa" href="/buscar" onclick="goSearch();return false;" aria-label="Buscar">
          ${iconSvg('search')}
        </a>
        <a class="cab-carrito" href="/carrito" onclick="goCart();return false;" aria-label="Ver el carrito">
          ${iconSvg('cart')}${enCarrito > 0 ? `<span class="cab-badge">${enCarrito}</span>` : ''}
        </a>
      </div>
    </header>`;

  return `
  <div class="app-shell ficha">
    ${cabeceraFicha}

    <div class="ficha-galeria">
      ${galeria}
      ${(slides.length > 1 && slides.length > 8) ? `<span class="ficha-contador">${pdState.activeIndex + 1} de ${slides.length}</span>` : ''}
    </div>
    ${puntosHtml}

    <div class="ficha-cuerpo">
      ${fichaCategoriaHtml(cat)}
      <h1 class="ficha-nombre">${escapeHtml(p.name)}</h1>

      <div class="ficha-precios">
        <span class="ficha-precio">${fmt(p.price)}</span>
        ${enOferta(p) ? `
          <span class="ficha-antes">${fmt(p.old)}</span>
          <span class="ficha-ahorras">Ahorras ${fmt(ahorro)}</span>` : ''}
      </div>
      ${resenasFichaHtml()}
      ${pagoFichaHtml(p)}

      <div class="ficha-chips">
        ${stock > 0
          ? '<span class="ficha-chip verde">En stock</span>'
          : '<span class="ficha-chip neutro">Bajo pedido</span>'}
        ${incluyeEstuche(p) ? '<span class="ficha-chip verde">Incluye estuche</span>' : ''}
        <span class="ficha-chip neutro">Envío a todo el Perú</span>
        ${stock > 0 && stock <= 3 ? `<span class="ficha-chip alerta">Quedan ${stock}</span>` : ''}
      </div>

      ${swatchesHtml}

      ${parrafos.length ? `<div class="ficha-desc">${parrafos.map(t => `<p>${escapeHtml(t)}</p>`).join('')}</div>` : ''}

      ${specs.length ? `
      <div class="ficha-specs">
        ${specs.map(s => `<div class="spec-fila">
          <span class="spec-k">${escapeHtml(s.k)}</span>
          ${s.v ? `<span class="spec-v">${escapeHtml(s.v)}</span>` : ''}
        </div>`).join('')}
      </div>` : ''}

      ${incluye.length ? `
      <div class="ficha-incluye">
        <div class="incluye-titulo">Incluye</div>
        ${incluye.map(i => `<div class="incluye-item"><span class="incluye-punto"></span>${escapeHtml(i)}</div>`).join('')}
      </div>` : ''}

      ${faqFichaHtml(p)}

      ${avisoTallerHtml(p)}
      ${asesorHtml}
    </div>

    ${complementosHtml(p)}${recomendadosHtml(p)}

    <div class="ficha-barra">
      ${stock > 0
        ? `<button type="button" class="btn-app terracota" onclick="addFromDetail(${p.id})">Agregar al carrito</button>`
        : '<button type="button" class="btn-app terracota" disabled>Agotado</button>'}
      <a class="btn-wa-cuadrado" target="_blank" rel="noopener"
         href="${waHref(consulta)}" onclick="trackAdsConversion('whatsapp')" aria-label="Consultar por WhatsApp">
        ${iconWhatsapp}
      </a>
    </div>

  </div>`;
}

function stockOf(id){ const p = productoPorId(id); return p ? (p.stock||0) : 0; }

/* Agregar desde la ficha ya no cierra nada: la ficha es una página y se
   queda donde está. El aviso lo da el toast, y el contador del pill que
   flota sobre la galería sube al instante. */
function addFromDetail(id){
  const p = productoPorId(id);
  const color = p ? (p.images||[]).map(colorFromImageUrl)[pdState.activeIndex] : null;
  let agregado = false;
  for(let i=0;i<pdState.qty;i++) agregado = addToCart(id, null, color, true) || agregado;
  if(agregado) goCart();
}

/* Cada línea del carrito es un producto Y un color: la misma guitarra en rojo
   y en natural son dos líneas, porque son dos cosas distintas para quien la
   prepara en la tienda. Antes el color se elegía en la ficha y se perdía al
   agregar, así que el pedido llegaba al WhatsApp sin decir cuál era. */
function mismaLinea(c, id, color){
  return c.id === id && (c.color || null) === (color || null);
}
/* Agregar lleva directo al carrito, que es el primer paso del pago: antes
   salía un aviso de 2,6 s y el cliente se quedaba sin saber qué seguía. Desde
   el carrito se vuelve al catálogo con «Seguir viendo». `sinIr` lo usa la
   ficha, que agrega varias unidades y navega una sola vez. Devuelve true si
   agregó. */
function addToCart(id, btnEl, color, sinIr){
  const available = stockOf(id);
  if(available <= 0){ showToast('Este producto está agotado'); return false; }
  const existing = state.cart.find(c=>mismaLinea(c, id, color));
  /* El stock es del producto, no del color, así que se cuentan todas sus
     líneas juntas para no pasarse. */
  const yaEnCarrito = state.cart.filter(c=>c.id===id).reduce((s,c)=>s+c.qty, 0);
  if(yaEnCarrito >= available){ showToast(`Solo hay ${available} unidad(es) disponibles`); return false; }
  if(existing) existing.qty++; else state.cart.push({ id, qty:1, color: color || null });
  updateCartCount();
  trackAdsConversion('addToCart');
  if(!sinIr) goCart();
  return true;
}
function changeQty(id, color, delta){
  /* En la página única de Tendencia el formulario está debajo: que cambiar
     la cantidad no borre lo que ya se escribió. */
  if(document.getElementById('pedidoForm')) leerDatosDelFormulario();
  const item = state.cart.find(c=>mismaLinea(c, id, color));
  if(!item) return;
  const available = stockOf(id);
  const yaEnCarrito = state.cart.filter(c=>c.id===id).reduce((s,c)=>s+c.qty, 0);
  if(delta > 0 && yaEnCarrito >= available){ showToast(`Solo hay ${available} unidad(es) disponibles`); return; }
  item.qty += delta;
  /* Bajar de uno elimina la línea, como pide el handoff. */
  if(item.qty <= 0) state.cart = state.cart.filter(c=>!mismaLinea(c, id, color));
  updateCartCount();
  if(volverAFichaTendencia(id)) return;
  render();
}
/* Chipao Tendencia (21-11-2026): si al quitar un producto de Tendencia el
   carrito queda vacío, se vuelve a la ficha de ese producto en vez de
   enseñar "Aún no hay nada aquí". En Chipao Music no hace nada. */
function volverAFichaTendencia(id){
  if(state.cart.length || !esTendencia(productoPorId(id))) return false;
  goTendenciaProducto(id);
  return true;
}
/* El carrito vive en el navegador del cliente (localStorage), así que
   sobrevive a un F5, a cerrar la pestaña y a volver desde Mercado Pago o
   WhatsApp. Es por navegador: no se comparte entre el celular y la PC. */
const CART_STORAGE_KEY = 'chipao-carrito-v1';

function saveCart(){
  try{ localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart)); }
  catch(err){ /* modo incógnito o almacenamiento lleno: seguimos sin guardar */ }
}

/* Recupera el carrito guardado, descartando lo que ya no se puede vender:
   productos retirados del catálogo y cantidades por encima del stock actual
   (el carrito pudo quedarse guardado semanas). */
function loadCart(){
  let guardado = [];
  try{ guardado = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]'); }
  catch(err){ guardado = []; }
  if(!Array.isArray(guardado)) guardado = [];

  /* El color viaja con la línea: sin él, dos variantes del mismo producto se
     fundirían en una al recargar y la segunda quedaría inalcanzable, porque
     changeQty busca por id + color. */
  state.cart = guardado
    .map(c => ({ id: Number(c && c.id), qty: Math.floor(Number(c && c.qty)), color: (c && c.color) || null }))
    .filter(c => Number.isFinite(c.id) && c.qty > 0 && TODOS.some(p => p.id === c.id))
    .map(c => ({ id: c.id, qty: Math.min(c.qty, stockOf(c.id)), color: c.color }))
    .filter(c => c.qty > 0);

  updateCartCount();
}

function updateCartCount(){
  const total = state.cart.reduce((s,c)=>s+c.qty,0);
  /* Los dos contadores del carrito dicen lo mismo, así que se actualizan
     desde el mismo sitio: el de la barra inferior y el de la cabecera de la
     ficha. */
  buildBottomNav();
  /* En la ficha la chapa solo existe cuando hay algo: agregar el primer
     producto no tiene número que cambiar, hay que crearla. Y vaciar el
     carrito desde otra pestaña tiene que quitarla. */
  const carritoFicha = document.querySelector('.ficha-head .cab-carrito');
  if(carritoFicha){
    let chapa = carritoFicha.querySelector('.cab-badge');
    if(total > 0){
      if(!chapa){
        chapa = document.createElement('span');
        chapa.className = 'cab-badge';
        carritoFicha.appendChild(chapa);
      }
      chapa.textContent = total;
    }else if(chapa){
      chapa.remove();
    }
  }
  /* Y el tercero, el pill de la cabecera de escritorio, que además del
     número enseña cuánto llevas. */
  pintarNavCarrito();
  /* Toda modificación del carrito pasa por aquí, así que este es el único
     punto donde hace falta guardarlo. */
  saveCart();
}
const SHIPPING_FEE_LIMA = 10;   // envio a domicilio en Lima Metropolitana
const SHIPPING_FEE = 15;        // envio al resto del Peru (agencia Shalom)
/* Adicional por mandar a una agencia Shalom de provincia. Hasta el 2026-10-04
   eran 5 soles encima del envío; el dueño pidió dejar "todo el Perú" en 15 en
   total. Queda en 0 en vez de borrar el mecanismo (fila del resumen, línea de
   Mercado Pago y mensaje de WhatsApp) por si vuelve a hacer falta. */
const PROVINCE_SURCHARGE = 0;

/* ======================== MEDIOS DE PAGO ========================

   Los cuatro del handoff. La cuarta opción del diseño es "Tarjeta de crédito
   o débito — Visa, Mastercard, pago en tienda o link": ese "link" es Mercado
   Pago, así que la tarjeta sigue cobrándose en línea como hasta ahora y el
   resto cierra por WhatsApp.

   "Pago en tienda al recoger" existe solo si eligió recojo: en
   el diseño recojo dejó de ser un medio de pago para ser una modalidad de
   entrega, y sin esta fila quien paga en efectivo al recoger se quedaba sin
   sitio donde decirlo.
   ================================================================ */
/* Fachada de banco: columnas y frontón. Es un dibujo generico a proposito,
   no la marca de ningun banco, porque la transferencia vale para varios. */
const iconoBanco = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5 12 4l9 5.5"/><path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7"/><path d="M3.5 20h17"/></svg>`;

/* Los logos salen de la página oficial de cada marca y viven en /pagos/ del
   propio repositorio, no en R2: son tres archivos de 4 KB que cambian una vez
   cada nunca, así que van versionados con el código. Ojo: /img/ NO vale para
   esto, porque esa ruta la intercepta el Worker para servir R2 (ver
   src/index.js, sirveFoto).

   La transferencia no lleva logo de marca a propósito: vale para BCP y para
   Interbank, así que enseña un dibujo genérico de banco.

   'regalo' pinta la etiqueta roja "Participas en el sorteo navideño": va en
   los medios que se cobran sin pasarela, para que se elijan antes que
   Mercado Pago, que se lleva comisión. Mercado Pago también participa pero
   no lleva etiqueta (decisión del dueño). La etiqueta se apaga sola cuando
   empieza el sorteo (ver SORTEO_HASTA). */
/* 24-dic-2026 21:00 hora de Lima: el sorteo navideño (src/cupones.js, SORTEO). */
const SORTEO_HASTA = Date.UTC(2026, 11, 25, 2, 0);
const MEDIOS_PAGO = [
  { key:'yape',     label:'Yape',                       nota:'Pagas desde tu app y validamos al instante',     logo:'/pagos/yape.png', regalo:true },
  { key:'tarjeta',  label:'Tarjeta de crédito o débito', nota:'Visa o Mastercard · pago en línea con Mercado Pago', logo:'/pagos/mercadopago.png' },
  { key:'whatsapp', label:'Coordinar el pago por WhatsApp', nota:'Tu pedido llega armado al chat y un asesor te guía', logo:'/pagos/whatsapp.svg', regalo:true },
  { key:'tienda',   label:'Pago en tienda al recoger',  nota:'Pagas en efectivo o por Yape cuando lo recojas',     soloRecojo:true },
  /* Solo Chipao Tendencia (22-11-2026), y solo con TODO el carrito de
     Tendencia: pide nombre y teléfono y abre WhatsApp con el pedido. */
  { key:'contraentrega', label:'Pago contra entrega', nota:'Paga cuando recibas tu pedido', soloTendencia:true,
    marca:'contraentrega', marcador:{ fondo:'#169b62', tinta:'#fff', icono:'paquete' } },
];
const iconoPaquete = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 2 2 4-4"/><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="m7.5 4.27 9 5.15"/><path d="M3.29 7 12 12l8.71-5"/><path d="M12 22V12"/></svg>`;
function esContraEntrega(){ return state.pago === 'contraentrega' && carritoSoloTendencia(); }

/* La caja del logo. Con archivo pinta la imagen; sin archivo, el marcador de
   color, que ya deja ver cómo queda la fila. Sin ninguno de los dos no pinta
   nada y la fila se queda como estaba. */
function logoPagoHtml(m){
  if(m.logo){
    return `<span class="opcion-logo"><img src="${m.logo}" alt="" loading="lazy" decoding="async"></span>`;
  }
  if(m.marcador){
    /* La transferencia no tiene marca que enseñar -son varios bancos- asi que
       lleva un dibujo generico de banco, que se entiende igual. */
    const dentro = m.marcador.icono === 'banco' ? iconoBanco : m.marcador.icono === 'paquete' ? iconoPaquete : escapeHtml(m.marcador.texto);
    return `<span class="opcion-logo marcador" style="background:${m.marcador.fondo};color:${m.marcador.tinta}">${dentro}</span>`;
  }
  return '';
}

/* Arranca en Yape, que es como paga la mayoría de la gente en Lima. */
const PAGO_INICIAL = 'yape';

function medioPago(key){
  if(key === 'tarjeta' && !PAGO_TARJETA) return MEDIOS_PAGO[0];
  if(key === 'contraentrega' && !carritoSoloTendencia()) return MEDIOS_PAGO[0];
  return MEDIOS_PAGO.find(m => m.key === key) || MEDIOS_PAGO[0];
}
/* Los medios que se pueden elegir ahora mismo: el de pago en tienda solo
   aparece si va a recoger. */
function mediosDisponibles(){
  if(carritoTendencia()) return MEDIOS_PAGO.filter(m => m.key === 'yape' || (m.key === 'contraentrega' && carritoSoloTendencia()));
  return MEDIOS_PAGO.filter(m => !m.soloTendencia && (!m.soloRecojo || state.entrega === 'tienda')
    && (m.key !== 'tarjeta' || PAGO_TARJETA));
}
/* Con algo de Chipao Tendencia en el carrito, el pedido entero va por agencia
   Shalom y se paga con Yape: son las únicas opciones que se muestran. Se fija
   el estado aquí (y no solo se esconden las filas) para que el total, el
   resumen y el botón de pagar digan lo mismo que se ve. */
function carritoTendencia(){
  return state.cart.some(c => esTendencia(productoPorId(c.id)));
}
function fijarOpcionesTendencia(){
  if(!carritoTendencia()) return;
  state.entrega = 'peru';
  state.motoPropio = false;
  if(!esContraEntrega()) state.pago = 'yape';
}

function cartSubtotal(){
  return state.cart.reduce((s,c)=>{
    const p = productoPorId(c.id);
    return p ? s + totalLinea(p, c.qty) : s;
  },0);
}

/* Tres formas de recibir: 'lima' (a domicilio), 'peru' (agencia Shalom) y
   'tienda'. Recoger en tienda no cuesta nada; los envíos cuestan
   SHIPPING_FEE_LIMA o SHIPPING_FEE (no hay envío gratis desde 2026-10-29).
   Estos números están repetidos en src/pagos.js (el servidor recalcula el
   total): si los cambias aquí, cámbialos allá. */
function conEnvio(entrega){
  const e = entrega || state.entrega;
  return e === 'lima' || e === 'peru';
}
/* 'peru' es "recojo en agencia Shalom": desde el 2026-11-08 incluye agencias
   de Lima y Callao, que cuestan como el envío a Lima. Se sabe por el grupo de
   la agencia (ver shalom-agencias.json y agenciaEnLima en src/pagos.js). */
function agenciaEnLima(a){
  const g = a ? String(a[0] || '') : '';
  return g.startsWith('Lima Metropolitana') || g.startsWith('Callao');
}
/* Envío gratis por Shalom a todo el Perú cuando TODO el carrito es de Chipao
   Tendencia. Desde el 21-11-2026 es SIEMPRE gratis (antes, desde S/ 100):
   el umbral queda en 0. Con el carrito mezclado, el envío normal: S/ 10 Lima
   y Callao, S/ 15 provincia. Misma regla en el servidor (src/pagos.js). */
const ENVIO_GRATIS_TENDENCIA = 0;
function carritoSoloTendencia(){
  return state.cart.length > 0 && state.cart.every(c => esTendencia(productoPorId(c.id)));
}
function envioGratisTendencia(subtotal){
  return carritoSoloTendencia() && subtotal >= ENVIO_GRATIS_TENDENCIA;
}
/* La barra del carrito: cuánto falta para el envío gratis. */
/* Sin usar desde el 21-11-2026: el dueño pidió quitar la barra del carrito
   de Tendencia (el envío gratis se sigue aplicando igual). */
function envioGratisTendenciaHtml(subtotal){
  if(!carritoSoloTendencia() || subtotal <= 0) return '';
  const ok = subtotal >= ENVIO_GRATIS_TENDENCIA;
  const pct = ok ? 100 : Math.max(4, Math.min(100, Math.round(subtotal * 100 / ENVIO_GRATIS_TENDENCIA)));
  return `<div class="envio-prog${ok ? ' ok' : ''}" role="status">
    <p>${ok ? '¡Tu envío por Shalom es gratis!' : `Agrega <b>${fmt(ENVIO_GRATIS_TENDENCIA - subtotal)}</b> más y tu envío es gratis.`}</p>
    <div class="envio-barra"><i style="width:${pct}%"></i></div>
    <small>Envío gratis por Shalom a todo el Perú en compras desde ${fmt(ENVIO_GRATIS_TENDENCIA)}.</small>
  </div>`;
}
function shippingCost(subtotal, entrega){
  if(subtotal <= 0) return 0;
  if(envioGratisTendencia(subtotal)) return 0;
  const e = entrega || state.entrega;
  if(e === 'tienda') return 0;
  if(e === 'peru' && agenciaEnLima(state.agencia)) return SHIPPING_FEE_LIMA;
  return e === 'lima' ? SHIPPING_FEE_LIMA : SHIPPING_FEE;
}

/* El adicional de la agencia Shalom se cobra solo en agencias de provincia. */
function provinceSurcharge(subtotal, entrega){
  if(subtotal <= 0) return 0;
  if(envioGratisTendencia(subtotal)) return 0;
  return (entrega || state.entrega) === 'peru' && !agenciaEnLima(state.agencia) ? PROVINCE_SURCHARGE : 0;
}

function computeOrderTotals(pagoKey, entrega){
  const subtotal = cartSubtotal();
  const ship = shippingCost(subtotal, entrega);
  const provincia = provinceSurcharge(subtotal, entrega);
  return { subtotal, ship, provincia, total: subtotal + ship + provincia };
}

function cartTotal(){
  return computeOrderTotals().total;
}

/* Desde el 2026-11-08 la entrega ya no se recuerda entre visitas: el dueño
   pidió que cada visita arranque siempre en "Recojo en agencia Shalom"
   (state.entrega inicial). Dentro de la misma visita se mantiene lo elegido. */

function setEntrega(valor, moto){
  state.entrega = valor;
  state.motoPropio = valor === 'tienda' && !!moto;
  /* Si dejó de recoger, "pago en tienda" ya no existe: se vuelve al inicial
     en vez de quedarse con un medio que no se puede elegir. */
  if(valor !== 'tienda' && state.pago === 'tienda') state.pago = PAGO_INICIAL;
  render();
}
/* ---------------- agencia Shalom (Lima, Callao y provincia) ----------------
   La lista sale de shalom.com.pe/agencias y vive en /shalom-agencias.json,
   cada una como [grupo, nombre, dirección]. El grupo es "Lima Metropolitana ·
   <distrito>", "Callao · <distrito>" o el departamento de provincia: eso
   decide la pestaña del buscador y el precio. Es una foto fija (última:
   2026-11-08): si Shalom abre o cierra agencias, se vuelve a sacar con
   .claude/shalom-agencias.mjs. Se pide solo cuando alguien abre el buscador,
   así no pesa en la carga de ninguna otra página. */
let AGENCIAS_SHALOM = null;
const MAX_AGENCIAS_VISIBLES = 40;

function agenciaActiva(){
  return state.entrega === 'peru' && state.agencia ? state.agencia : null;
}
function textoEntrega(){
  if(state.entrega === 'tienda') return state.motoPropio ? 'Recojo con mi motorizado (Av. Los Héroes 382)' : 'Recojo en tienda (Av. Los Héroes 382)';
  if(state.entrega === 'lima') return 'Envío a domicilio en Lima Metropolitana';
  const a = agenciaActiva();
  return a ? `Envío a agencia Shalom ${a[1]} (${a[0]}): ${a[2]}` : 'Envío a agencia Shalom (por elegir)';
}

function agenciaShalomHtml(){
  const a = state.agencia;
  if(a && !state.buscandoAgencia){
    return `
      <div class="agencia-elegida">
        <span class="agencia-eyebrow">Agencia Shalom · ${escapeHtml(a[0])}</span>
        <span class="agencia-nombre">${escapeHtml(a[1])}</span>
        <span class="agencia-dir">${escapeHtml(a[2])}</span>
        ${PROVINCE_SURCHARGE > 0 && !agenciaEnLima(a) ? `<span class="agencia-adicional">Envío a provincia: adicional de ${fmt(PROVINCE_SURCHARGE)}</span>` : ''}
        <span class="agencia-acciones">
          <button type="button" onclick="abrirBuscadorAgencia()">Cambiar</button>
        </span>
      </div>`;
  }
  if(state.buscandoAgencia){
    const enLima = state.agenciaSeccion !== 'provincia';
    return `
      <div class="agencia-buscador">
        <div class="agencia-tabs" role="tablist">
          <button type="button" role="tab" class="agencia-tab${enLima?' sel':''}" aria-selected="${enLima}" onclick="elegirSeccionAgencia('lima')">
            Lima y Callao<small>${envioGratisTendencia(cartSubtotal()) ? 'Gratis' : fmt(SHIPPING_FEE_LIMA)}</small></button>
          <button type="button" role="tab" class="agencia-tab${enLima?'':' sel'}" aria-selected="${!enLima}" onclick="elegirSeccionAgencia('provincia')">
            Provincias<small>${envioGratisTendencia(cartSubtotal()) ? 'Gratis' : fmt(SHIPPING_FEE + PROVINCE_SURCHARGE)} · 1 a 3 días útiles</small></button>
        </div>
        <label class="campo">
          <span>Busca tu agencia Shalom</span>
          <input id="agBuscar" type="search" autocomplete="off" placeholder="${enLima ? 'Tu distrito, avenida o zona' : 'Tu ciudad, provincia o departamento'}"
                 oninput="filtrarAgencias(this.value)"
                 onkeydown="if(event.key==='Enter') event.preventDefault()">
        </label>
        <div id="agResultados" class="agencia-resultados"><p class="agencia-vacio">Cargando agencias…</p></div>
        <button type="button" class="agencia-cerrar" onclick="cerrarBuscadorAgencia()">${a ? 'Volver' : 'Cancelar'}</button>
      </div>`;
  }
  return `
    <div class="agencia-invita">
      <span><b>Elige tu agencia Shalom.</b> Ahí recoges tu pedido; busca la más cercana a ti.</span>
      <button type="button" class="btn-shalom" onclick="abrirBuscadorAgencia()"><span class="sh-marca">SHALOM</span><span class="sh-sep" aria-hidden="true"></span><span>Buscar agencia</span><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>`;
}

async function abrirBuscadorAgencia(){
  leerDatosDelFormulario();
  state.buscandoAgencia = true;
  /* Al cambiar de agencia se abre en la pestaña de la que ya tenía. */
  if(state.agencia) state.agenciaSeccion = agenciaEnLima(state.agencia) ? 'lima' : 'provincia';
  render();
  document.getElementById('agBuscar')?.focus();
  if(!AGENCIAS_SHALOM){
    try{
      AGENCIAS_SHALOM = await fetch('/shalom-agencias.json').then(r => r.json());
    }catch(e){
      const cont = document.getElementById('agResultados');
      if(cont) cont.innerHTML = '<p class="agencia-vacio">No se pudo cargar la lista. Escribe tu ciudad en la dirección y te ayudamos por WhatsApp.</p>';
      return;
    }
  }
  filtrarAgencias(document.getElementById('agBuscar')?.value || '');
}

/* Cambia de pestaña sin perder lo escrito en el buscador. */
function elegirSeccionAgencia(seccion){
  const q = document.getElementById('agBuscar')?.value || '';
  leerDatosDelFormulario();
  state.agenciaSeccion = seccion;
  render();
  const input = document.getElementById('agBuscar');
  if(input){ input.value = q; input.focus(); }
  filtrarAgencias(q);
}
function cerrarBuscadorAgencia(){
  leerDatosDelFormulario();
  state.buscandoAgencia = false;
  render();
}
function elegirAgencia(i){
  leerDatosDelFormulario();
  state.agencia = AGENCIAS_SHALOM[i];
  state.buscandoAgencia = false;
  render();
  document.getElementById('coDireccion')?.focus();
}

/* Sin tildes ni mayúsculas: quien escribe "junin" o "cañete" desde el
   teléfono tiene que encontrar "Junín" y "Cañete". Cada palabra tiene que
   aparecer en algún sitio (departamento, nombre o dirección). */
function sinTildes(t){
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function filtrarAgencias(q){
  const cont = document.getElementById('agResultados');
  if(!cont || !AGENCIAS_SHALOM) return;
  const palabras = sinTildes(q).split(/\s+/).filter(Boolean);
  const enLima = state.agenciaSeccion !== 'provincia';
  const hallados = [];
  let enLaOtra = 0;
  AGENCIAS_SHALOM.forEach((a, i) => {
    const texto = sinTildes(a.join(' '));
    if(!palabras.every(w => texto.includes(w))) return;
    if(agenciaEnLima(a) === enLima) hallados.push(i); else enLaOtra++;
  });
  /* Quien escribe "Huacho" en Lima y Callao (o "Ate" en Provincias) no se
     queda en blanco: se le ofrece la otra pestaña. */
  const otra = enLaOtra && palabras.length
    ? `<button type="button" class="agencia-otra" onclick="elegirSeccionAgencia('${enLima ? 'provincia' : 'lima'}')">Ver ${enLaOtra} en ${enLima ? 'Provincias' : 'Lima y Callao'}</button>` : '';
  if(!hallados.length){
    cont.innerHTML = `<p class="agencia-vacio">No encontramos una agencia con ese nombre en ${enLima ? 'Lima y Callao. Prueba con tu distrito' : 'provincia. Prueba con tu provincia o departamento'}.</p>${otra}`;
    return;
  }
  const filas = hallados.slice(0, MAX_AGENCIAS_VISIBLES).map(i => {
    const a = AGENCIAS_SHALOM[i];
    return `
      <button type="button" class="agencia-fila" onclick="elegirAgencia(${i})">
        <span class="agencia-nombre">${escapeHtml(a[1])} <i>${escapeHtml(a[0])}</i></span>
        <span class="agencia-dir">${escapeHtml(a[2])}</span>
      </button>`;
  }).join('');
  const resto = hallados.length - MAX_AGENCIAS_VISIBLES;
  cont.innerHTML = filas + (resto > 0
    ? `<p class="agencia-vacio">Y ${resto} más. Escribe tu ${enLima ? 'distrito' : 'ciudad'} para encontrar la tuya.</p>` : '') + otra;
}

function setPago(valor){
  /* Cambiar de medio no borra lo ya escrito ni sube la página. */
  if(document.getElementById('pedidoForm')) leerDatosDelFormulario();
  state.pago = valor;
  const y = window.scrollY;
  render();
  window.scrollTo(0, y);
}

/* ======================================================================
   CARRITO, PAGO Y CONFIRMACIÓN

   Tres páginas con su propia URL (/carrito, /checkout, /pedido/<id>). Antes
   eran tres estados de un mismo panel lateral.
   ====================================================================== */

/* Cabecera compartida por las tres. */
function cabeceraPedido(titulo, alVolver){
  return `
    <header class="app-head cat">
      <div class="app-head-fila">
        <button type="button" class="btn-volver" onclick="${alVolver}" aria-label="Volver">‹</button>
        <div class="app-head-texto"><h1 class="app-head-nombre">${escapeHtml(titulo)}</h1></div>
      </div>
    </header>`;
}

/* La nota del radio de envío hace de barra de "te falta para el envío
   gratis": el handoff ya reserva esa línea para explicar el umbral, así que
   el aviso va donde la persona está decidiendo, no en un cartel aparte. */
function costeEnvioTexto(subtotal, entrega){
  /* La agencia cuesta S/ 10 en Lima y Callao y S/ 15 en provincia: hasta que
     elija una, el radio dice desde cuánto. */
  if(envioGratisTendencia(subtotal)) return 'Gratis';
  if(entrega === 'peru' && subtotal > 0 && !state.agencia) return 'Desde ' + fmt(SHIPPING_FEE_LIMA);
  const c = shippingCost(subtotal, entrega) + provinceSurcharge(subtotal, entrega);
  return c > 0 ? fmt(c) : 'Gratis';
}

/* Cuántos cupones del sorteo da esta compra y cuánto falta para el siguiente.
   Las mismas reglas que src/cupones.js (cuponesPorSubtotal): de S/ 20 a
   S/ 99.99 un cupón, desde S/ 100 dos, contando solo los productos. Aplica a
   cualquier medio de pago. Se apaga solo cuando empieza el sorteo. */
const SORTEO_MINIMO = 20, SORTEO_DOBLE = 100;
function sorteoCuponesHtml(subtotal){
  /* El sorteo es solo de Chipao Music: en Tendencia ni se nombra. */
  if(modoTendencia()) return '';
  if(subtotal <= 0 || Date.now() >= SORTEO_HASTA) return '';
  const n = subtotal >= SORTEO_DOBLE ? 2 : subtotal >= SORTEO_MINIMO ? 1 : 0;
  const meta = n === 0 ? SORTEO_MINIMO : SORTEO_DOBLE;
  const pct = n === 2 ? 100 : Math.max(4, Math.min(100, Math.round(subtotal * 100 / meta)));
  const texto = n === 2
    ? '<b>Esta compra te da 2 cupones del sorteo navideño.</b>'
    : n === 1
      ? `<b>Esta compra te da 1 cupón del sorteo navideño.</b> Agrega ${fmt(SORTEO_DOBLE - subtotal)} más y recibes 2.`
      : `Agrega <b>${fmt(SORTEO_MINIMO - subtotal)}</b> más y participas en el sorteo navideño.`;
  return `<div class="sorteo-prog" role="status">
    <p>${texto}</p>
    <div class="envio-barra"><i style="width:${pct}%"></i></div>
    <small>Teclado o violín completo · 24 de diciembre · <a href="/sorteo" target="_blank" rel="noopener">Ver premios</a></small>
  </div>`;
}

/* Íconos de las formas de entrega. El de Shalom es su logotipo oficial
   (shalom.com.pe/img/instagram/logo-shalom-300x60.png, sin los márgenes
   transparentes para que se vea más grande), guardado en /pagos/
   junto a los de los medios de pago; los demás son dibujos de línea propios. */
const svgEntrega = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICONO_ENTREGA = {
  shalom: `<span class="opcion-logo entrega-ico shalom"><img src="/pagos/shalom.png" alt="Shalom" loading="lazy" decoding="async"></span>`,
  /* Motorizado propio: el «iD» de inDrive sobre su verde (recortado del logo
     oficial y guardado en /pagos/indrive.png con fondo transparente). */
  moto:   `<span class="opcion-logo entrega-ico indrive"><img src="/pagos/indrive.png" alt="inDrive" loading="lazy" decoding="async"></span>`,
  tienda: `<span class="opcion-logo entrega-ico">${svgEntrega('<path d="M3.5 9 5 4.5h14L20.5 9"/><path d="M3.5 9h17v1.5a2.8 2.8 0 0 1-5.6 0 2.8 2.8 0 0 1-5.8 0 2.8 2.8 0 0 1-5.6 0z"/><path d="M5 13v7h14v-7"/><path d="M10 20v-4h4v4"/>')}</span>`,
  camion: `<span class="opcion-logo entrega-ico">${svgEntrega('<path d="M2.5 6.5h11v9.5h-11z"/><path d="M13.5 9.5h4l3 3.5v3h-7"/><circle cx="6.5" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>')}</span>`,
};
function filaRadio(sel, titulo, nota, coste, accion, logo, regalo, marca){
  return `
  <button type="button" class="opcion${marca?` marca marca-${marca}`:''}${sel?' sel':''}" aria-pressed="${sel?'true':'false'}" onclick="${accion}">
    <span class="opcion-radio">${sel?'<span class="opcion-punto"></span>':''}</span>
    ${logo || ''}
    <span class="opcion-texto">
      <span class="opcion-titulo">${escapeHtml(titulo)}</span>
      ${nota?`<span class="opcion-nota">${escapeHtml(nota)}</span>`:''}
      ${regalo && Date.now() < SORTEO_HASTA && !carritoTendencia() ? '<span class="opcion-regalo">Participas en el sorteo navideño</span>':''}
    </span>
    ${coste?`<span class="opcion-coste">${escapeHtml(coste)}</span>`:''}
  </button>`;
}

/* Agencia Shalom sin elegir: todavía no se sabe si es de Lima (S/ 10) o de
   provincia (S/ 15), así que el resumen y el botón enseñan "Desde" con el
   precio de Lima. Solo es lo que se ve: no se puede pagar sin elegir agencia,
   y al elegirla sale el total exacto. */
function totalesParaMostrar(){
  const t = computeOrderTotals();
  if(state.entrega !== 'peru' || state.agencia || t.subtotal <= 0 || envioGratisTendencia(t.subtotal)) return { ...t, desde:'' };
  return { ...t, ship:SHIPPING_FEE_LIMA, provincia:0, total:t.subtotal + SHIPPING_FEE_LIMA, desde:'Desde ' };
}
function resumenTotalesHtml(etiquetaTotal){
  const { subtotal, ship, provincia, total, desde } = totalesParaMostrar();
  const unidades = state.cart.reduce((s,c)=>s+c.qty, 0);
  return `
  <div class="resumen">
    <div class="resumen-fila"><span>${unidades} producto${unidades!==1?'s':''}</span><span>${fmt(subtotal)}</span></div>
    <div class="resumen-fila">
      <span>${state.entrega==='tienda' ? 'Recojo en tienda' : 'Envío'}</span>
      <span>${ship > 0 ? desde + fmt(ship) : 'Gratis'}</span>
    </div>
    ${provincia > 0 ? `<div class="resumen-fila"><span>Adicional envío a provincia</span><span>${fmt(provincia)}</span></div>` : ''}
    <div class="resumen-total">
      <span>${escapeHtml(etiquetaTotal)}</span>
      <span class="resumen-cifra">${desde ? '<small style="font-size:.5em;font-weight:500">Desde </small>' : ''}${fmt(total)}</span>
    </div>
  </div>`;
}

/* Quita una línea entera del carrito, sin tener que bajar la cantidad de uno
   en uno. Solo existe en escritorio: el handoff del teléfono cierra la línea
   con el stepper y aquí hay sitio para un enlace explícito. */
function quitarLinea(id, color){
  if(document.getElementById('pedidoForm')) leerDatosDelFormulario();
  state.cart = state.cart.filter(c => !mismaLinea(c, id, color));
  updateCartCount();
  if(volverAFichaTendencia(id)) return;
  render();
}

/* Cabecera de las páginas de pedido en escritorio: migas y título serif, en
   vez de la barra con la flecha de volver del teléfono. */
function cabeceraPedidoEscritorio(titulo, migaTexto){
  return `
    <nav class="migas" aria-label="Ruta">
      <a href="${modoTendencia() ? '/tendencia' : '/'}" onclick="irInicioTienda();return false;">Inicio</a><span>·</span><b>${escapeHtml(migaTexto)}</b>
    </nav>
    <h1 class="ped-titulo h-serif">${escapeHtml(titulo)}</h1>`;
}

/* ------------------------------ /carrito ------------------------------ */
function renderCarrito(){
  fijarOpcionesTendencia();
  const esc = esEscritorio();

  if(!state.cart.length){
    const vacio = `
      <div class="carrito-vacio">
        <span class="vacio-cuadro"></span>
        <div class="vacio-titulo">Aún no hay nada aquí</div>
        <p>${modoTendencia() ? 'Mira los productos de Chipao Tendencia.' : 'Empieza por las ofertas de la semana.'}</p>
        <button type="button" class="btn-app oscuro" onclick="irCatalogoTienda()">Ver catálogo</button>
      </div>`;
    return esc
      ? `<div class="app-shell ped-esc">${cabeceraPedidoEscritorio('Tu carrito','Tu carrito')}${vacio}</div>`
      : `<div class="app-shell">${cabeceraPedido('Tu carrito', 'volverDelCarrito()')}${vacio}</div>`;
  }

  if(carritoSoloTendencia()) return renderCheckout();

  const { subtotal, total, desde } = totalesParaMostrar();

  const lineas = lineasCarritoHtml(esc);

  const entregaHtml = `
    ${sorteoCuponesHtml(subtotal)}
    <div class="bloque-titulo">¿Cómo lo recibes?</div>
    <div class="opciones">
      ${filaRadio(state.entrega==='peru', 'Recojo en agencia Shalom', 'En Lima, Callao o provincia · lo recoges en la agencia',
         costeEnvioTexto(subtotal,'peru'), "setEntrega('peru')", ICONO_ENTREGA.shalom)}
      ${carritoTendencia() ? '' : `
      ${filaRadio(state.entrega==='tienda' && state.motoPropio, 'Mando mi motorizado',
         'Tu motorizado recoge en Av. Los Héroes 382 · listo en 1 hora', 'Gratis', "setEntrega('tienda',true)", ICONO_ENTREGA.moto)}
      ${filaRadio(state.entrega==='tienda' && !state.motoPropio, 'Recojo en tienda',
         'Av. Los Héroes 382 · listo en 1 hora', 'Gratis', "setEntrega('tienda',false)", ICONO_ENTREGA.tienda)}
      ${filaRadio(state.entrega==='lima', 'Envío a Lima Metropolitana', 'Recíbelo en menos de 24h',
         costeEnvioTexto(subtotal,'lima'), "setEntrega('lima')", ICONO_ENTREGA.camion)}`}
    </div>`;

  /* Escritorio: las líneas a la izquierda y el panel de entrega y totales
     pegado a la derecha, con el CTA dentro del propio panel. */
  if(esc){
    return `
    <div class="app-shell ped-esc">
      ${cabeceraPedidoEscritorio('Tu carrito','Tu carrito')}
      <div class="ped-layout">
        <div class="ped-izq">
          <div class="lineas">${lineas}</div>
          <a class="seguir-catalogo solo-chipao" href="${modoTendencia() ? '/tendencia' : '/tienda'}" onclick="irCatalogoTienda();return false;">+ Seguir viendo el catálogo</a>
        </div>
        <aside class="ped-der">
          <div class="ped-panel">
            ${entregaHtml}
            ${resumenTotalesHtml('Total')}
            <button type="button" class="btn-app terracota ped-cta" onclick="goCheckout()">Continuar al pago</button>
          </div>
        </aside>
      </div>
    </div>`;
  }

  return `
  <div class="app-shell con-barra">
    ${cabeceraPedido('Tu carrito', 'volverDelCarrito()')}
    <div class="lineas">${lineas}</div>
    <a class="seguir-catalogo movil solo-chipao" href="${modoTendencia() ? '/tendencia' : '/tienda'}" onclick="irCatalogoTienda();return false;">+ Seguir viendo el catálogo</a>

    ${entregaHtml}

    ${resumenTotalesHtml('Total')}

    <div class="barra-fija">
      <button type="button" class="btn-app terracota" onclick="goCheckout()">
        Continuar <span class="btn-cifra">${desde}${fmt(total)}</span>
      </button>
    </div>
  </div>`;
}

/* Las líneas del carrito (foto, nombre, total y − / +). Las usa el carrito y,
   en Chipao Tendencia, la página única de pedido (renderCheckout). */
function lineasCarritoHtml(esc, filtro){
  return state.cart.filter(c => !filtro || filtro(c)).map(c=>{
    const p = productoPorId(c.id);
    if(!p) return '';
    /* La miniatura tiene que ser la del color de ESTA línea: si no, dos
       colores del mismo producto salen con la misma foto. */
    const fotos = p.images || [];
    const iColor = c.color ? fotos.findIndex(u => colorFromImageUrl(u) === c.color) : -1;
    const foto = fotos[iColor >= 0 ? iColor : 0];
    const meta = [c.color, (p.stock||0) > 0 ? 'Entrega inmediata' : 'Bajo pedido'].filter(Boolean).join(' · ');
    const colorArg = c.color ? `'${String(c.color).replace(/'/g, "\\'")}'` : 'null';
    return `
    <div class="linea">
      <span class="linea-thumb">
        ${foto ? `<img src="${fotoUrl(foto, ANCHO_MINIATURA)}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async">` : iconSvg(iconFor(p))}
      </span>
      <span class="linea-texto">
        <span class="linea-nombre">${escapeHtml(p.name)}</span>
        <span class="linea-meta">${escapeHtml(meta)}</span>
        ${esc ? `<span class="linea-unitario">${fmt(p.price)} c/u</span>` : ''}
        <span class="linea-pie">
          <span class="linea-total">${fmt(totalLinea(p, c.qty))}</span>
          <span class="stepper">
            <button type="button" onclick="changeQty(${p.id}, ${colorArg}, -1)" aria-label="Quitar uno">−</button>
            <span class="stepper-n">${c.qty}</span>
            <button type="button" onclick="changeQty(${p.id}, ${colorArg}, 1)" aria-label="Agregar uno">+</button>
          </span>
        </span>
        ${esc ? `<button type="button" class="linea-quitar" onclick="quitarLinea(${p.id}, ${colorArg})">Quitar</button>` : ''}
      </span>
    </div>`;
  }).join('');
}

/* "Tu pedido" de Chipao Tendencia (opción B, 21-11-2026): los productos con
   packs (#pack) se eligen en filas "1 / 2 / 3 Irrigadores" con su precio,
   el de antes tachado y el ahorro, en vez de la línea con − / +. Los que no
   tienen packs salen como línea normal. */
function pluralNombre(palabra){
  if(/z$/i.test(palabra)) return palabra.slice(0, -1) + 'ces';
  return /[aeiouáéó]$/i.test(palabra) ? palabra + 's' : palabra + 'es';
}
function conPacks(c){
  const p = productoPorId(c.id);
  return p && packsFicha(p).length > 1;
}
function packsPedidoHtml(){
  const bloques = state.cart.filter(conPacks).map(c => {
    const p = productoPorId(c.id);
    const cants = packsFicha(p);
    const palabra = String(p.name).split(/\s+/)[0];
    const foto = (p.images || [])[0];
    const colorArg = c.color ? `'${String(c.color).replace(/'/g, "\'")}'` : 'null';
    const filas = cants.map((n, i) => {
      const t = totalLinea(p, n);
      const antes = Math.max(p.old || 0, p.price) * n;
      const sello = cants.length < 3 ? '' : i === 1 ? '<span class="pk-sello">👑 Más vendido</span>'
        : i === cants.length - 1 ? '<span class="pk-sello naranja">⭐ Mayor ahorro</span>' : '';
      const sel = n === c.qty;
      return `<button type="button" class="pk${sel ? ' sel' : ''}" aria-pressed="${sel}" onclick="elegirPackPedido(${p.id}, ${colorArg}, ${n})">
          ${sello}
          <span class="pk-radio" aria-hidden="true"></span>
          ${foto ? `<img class="pk-foto" src="${escapeHtml(fotoUrl(foto, ANCHO_MINIATURA))}" alt="" loading="lazy" decoding="async">` : ''}
          <span class="pk-txt"><b>${n} ${escapeHtml(n === 1 ? palabra : pluralNombre(palabra))}</b>${antes > t ? `<small>Ahorras ${fmt(antes - t)}</small>` : ''}</span>
          <span class="pk-precio"><b>${fmt(t)}</b>${antes > t ? `<s>${fmt(antes)}</s>` : ''}</span>
        </button>`;
    }).join('');
    return `<div class="pk-lista">${filas}</div>`;
  }).join('');
  const sueltas = state.cart.some(c => !conPacks(c))
    ? `<div class="lineas">${lineasCarritoHtml(esEscritorio(), c => !conPacks(c))}</div>` : '';
  return (bloques ? `<div class="bloque-titulo">Elige tu oferta</div>${bloques}` : '') + sueltas;
}
/* Elegir un pack pone esa cantidad en la línea. No borra lo ya escrito. */
function elegirPackPedido(id, color, n){
  if(document.getElementById('pedidoForm')) leerDatosDelFormulario();
  const linea = state.cart.find(c => mismaLinea(c, id, color));
  if(!linea) return;
  const otras = state.cart.filter(c => c.id === id && c !== linea).reduce((s, c) => s + c.qty, 0);
  if(otras + n > stockOf(id)){ showToast(`Solo hay ${stockOf(id)} unidad(es) disponibles`); return; }
  linea.qty = n;
  updateCartCount();
  const y = window.scrollY;
  render();
  window.scrollTo(0, y);
}

/* ------------------------------ /checkout ------------------------------ */
function renderCheckout(){
  if(!state.cart.length) return renderCarrito();
  fijarOpcionesTendencia();
  /* Chipao Tendencia (21-11-2026): carrito y pago en UNA sola página, con
     las líneas arriba (− / +) y un único botón. Solo si TODO el carrito es
     de Tendencia; un carrito mezclado sigue con carrito + pago aparte. */
  const unaPagina = carritoSoloTendencia();
  const lineasArriba = unaPagina ? packsPedidoHtml() : '';

  const medio = medioPago(state.pago);
  const conAgencia = state.entrega==='peru' && !!state.agencia;
  const entregaResumen = state.entrega==='tienda'
    ? (state.motoPropio ? 'Recoge tu motorizado · Av. Los Héroes 382' : 'Recojo en tienda · Av. Los Héroes 382')
    : state.entrega==='peru' ? (conAgencia ? `Envío a agencia Shalom · ${state.agencia[1]}` : 'Agencia Shalom · falta elegir la agencia')
    : 'Envío a domicilio · Lima Metropolitana';

  const contraEntrega = esContraEntrega();
  const camposHtml = contraEntrega ? `
      <label class="campo">
        <span>Nombre y apellido</span>
        <input id="coNombre" type="text" autocomplete="name" placeholder="Ej. María Torres" required value="${escapeHtml(state.datos.nombre)}">
      </label>
      <label class="campo">
        <span>Teléfono / WhatsApp</span>
        <input id="coTelefono" type="tel" inputmode="numeric" autocomplete="tel"
               placeholder="Ej. 987654321" pattern="[0-9]{9}" maxlength="9" required
               title="Nueve dígitos, como 987654321" value="${escapeHtml(state.datos.telefono)}">
      </label>
      <div class="aviso-contraentrega"><b>¡Listo, solo eso!</b>
        Te escribimos por WhatsApp para confirmar la dirección, el color y el día de entrega. Pagas al recibir tu pedido.</div>` : `
      <label class="campo">
        <span>Nombre y apellido</span>
        <input id="coNombre" type="text" autocomplete="name" placeholder="Ej. María Torres" required value="${escapeHtml(state.datos.nombre)}">
      </label>
      <label class="campo">
        <span>Teléfono / WhatsApp</span>
        <input id="coTelefono" type="tel" inputmode="numeric" autocomplete="tel"
               placeholder="Ej. 987654321" pattern="[0-9]{9}" maxlength="9" required
               title="Nueve dígitos, como 987654321" value="${escapeHtml(state.datos.telefono)}">
      </label>
      ${medio.key==='yape' && !unaPagina ? `
      <label class="campo">
        <span>Correo (ahí te llega la confirmación)</span>
        <input id="coEmail" type="email" inputmode="email" autocomplete="email"
               placeholder="Ej. maria@gmail.com" maxlength="120" required value="${escapeHtml(state.datos.email||'')}">
      </label>` : ''}
      ${unaPagina ? `
      <label class="campo">
        <span>¿De qué color lo deseas?</span>
        <input id="coColor" type="text" autocomplete="off" maxlength="60"
               placeholder="Escribe el color que prefieres" value="${escapeHtml(state.datos.color||'')}">
      </label>` : ''}
      ${state.entrega==='peru' ? agenciaShalomHtml() : ''}
      <label class="campo">
        <span>${state.entrega==='tienda' ? (state.motoPropio ? 'Datos del motorizado y a qué hora llega' : 'Quién lo recoge y cuándo')
              : state.entrega==='peru' ? 'Quién recoge en la agencia' : 'Dirección de entrega'}</span>
        <textarea id="coDireccion" rows="2" placeholder="${state.entrega==='tienda' ? (state.motoPropio ? 'Ej. Nombre y celular del motorizado, llega a las 4 p.m.' : 'Ej. Paso yo mañana por la tarde')
              : state.entrega==='peru' ? 'Nombre y DNI, como figura en el documento' : 'Calle, número, distrito, referencia'}" required>${escapeHtml(state.datos.direccion)}</textarea>
      </label>`;

  const notaCierre = contraEntrega
    ? 'Al continuar se abre WhatsApp con tu pedido listo: solo envía el mensaje y te confirmamos.'
    : medio.key === 'tarjeta'
    ? 'Al continuar te llevamos a Mercado Pago para pagar con tarjeta. Al volver te confirmamos el pedido.'
    : medio.key === 'yape'
    ? (unaPagina
      ? 'Al continuar te mostramos el número de Yape. Tienes 30 minutos para pagar y subir la captura del comprobante: validamos tu pago al instante.'
      : 'Al continuar te mostramos el número de Yape. Tienes 30 minutos para pagar y subir la captura del comprobante: validamos tu pago al instante y te llega la confirmación por correo.')
    : 'Al confirmar, tu pedido llega armado al WhatsApp de la tienda con productos, color y forma de entrega. Un asesor valida el stock y te da los datos para pagar.';
  const ctaTexto = contraEntrega ? 'Pedir contra entrega'
    : medio.key === 'tarjeta' ? 'Pagar con Mercado Pago'
    : medio.key === 'yape' ? 'Continuar al pago con Yape' : 'Confirmar pedido por WhatsApp';
  const ctaClase = medio.key === 'tarjeta' || medio.key === 'yape' ? 'terracota' : 'verde';

  /* Escritorio: los medios de pago en rejilla y el formulario a la
     izquierda, con el resumen del pedido pegado a la derecha. El <form>
     envuelve las dos columnas para que el botón del resumen siga siendo el
     submit de los campos de al lado. */
  if(esEscritorio()){
    const items = state.cart.map(c=>{
      const p = productoPorId(c.id);
      if(!p) return '';
      const fotos = p.images || [];
      const iColor = c.color ? fotos.findIndex(u => colorFromImageUrl(u) === c.color) : -1;
      const foto = fotos[iColor >= 0 ? iColor : 0];
      return `
      <div class="res-item">
        <span class="res-item-thumb">
          ${foto ? `<img src="${fotoUrl(foto, ANCHO_MINIATURA)}" alt="" loading="lazy" decoding="async">` : iconSvg(iconFor(p))}
        </span>
        <span class="res-item-texto">
          <span class="res-item-nombre">${escapeHtml(p.name)}${c.color ? ` · ${escapeHtml(c.color)}` : ''}</span>
          <span class="res-item-linea">${c.qty} × ${fmt(p.price)}</span>
        </span>
        <span class="res-item-total">${fmt(totalLinea(p, c.qty))}</span>
      </div>`;
    }).join('');

    return `
    <div class="app-shell ped-esc">
      ${cabeceraPedidoEscritorio(unaPagina ? 'Tu pedido' : 'Pago y confirmación', unaPagina ? 'Tu pedido' : 'Pago')}
      <form id="pedidoForm" class="ped-layout" onsubmit="submitOrder(event)" oninput="limpiarErrorCampo(event)" novalidate>
        <div class="ped-izq">
          ${unaPagina ? `<div class="ped-card">${lineasArriba}</div>` : ''}
          <div class="ped-card">
            <div class="bloque-titulo">Medio de pago</div>
            <div class="opciones rejilla">
              ${mediosDisponibles().map(m => filaRadio(
                  state.pago===m.key, m.label, m.nota,
                  '', `setPago('${m.key}')`, logoPagoHtml(m), m.regalo, m.marca || (m.logo && m.key))).join('')}
</div>
          </div>

          <div class="ped-card datos">
            <div class="bloque-titulo">Tus datos</div>
            ${camposHtml}
            ${contraEntrega ? '' : `<div class="campo-resumen">
              ${escapeHtml(entregaResumen)}
              ${unaPagina ? '' : '<a href="/carrito" onclick="goCart();return false;">Cambiar</a>'}
            </div>`}
          </div>
        </div>

        <aside class="ped-der">
          <div class="ped-panel">
            ${unaPagina ? '<div class="bloque-titulo">Resumen</div>' : `<div class="bloque-titulo">Tu pedido</div>
            <div class="res-items">${items}</div>`}
            ${resumenTotalesHtml('Total a pagar')}
            <div id="avisoDatos" class="aviso-datos" role="alert" hidden></div>
            ${contraEntrega ? `<button type="submit" class="btn-wa-coordinar ce-boton" id="btnConfirmar">${iconWhatsapp} Pedir contra entrega</button>`
              : `<button type="submit" class="btn-app ${ctaClase} ped-cta${unaPagina ? ' btn-tendencia' : ''}" id="btnConfirmar">${ctaTexto}</button>`}
            ${unaPagina && !contraEntrega ? `<button type="button" class="btn-wa-coordinar" onclick="coordinarPorWhatsapp()">${iconWhatsapp} Coordinar pago por WhatsApp</button>` : ''}
            <p class="ped-nota">${notaCierre}</p>
          </div>
        </aside>
      </form>
    </div>`;
  }

  return `
  <div class="app-shell con-barra${unaPagina ? ' con-dos-botones' : ''}">
    ${unaPagina ? cabeceraPedido('Tu pedido', 'volverDelCarrito()') : cabeceraPedido('Pago y confirmación', 'goCart()')}
    ${lineasArriba}

    <div class="bloque-titulo">Medio de pago</div>
    <div class="opciones">
      ${mediosDisponibles().map(m => filaRadio(
          state.pago===m.key, m.label, m.nota,
          '', `setPago('${m.key}')`, logoPagoHtml(m), m.regalo, m.marca || (m.logo && m.key))).join('')}
    </div>

    <form id="pedidoForm" class="datos" onsubmit="submitOrder(event)" oninput="limpiarErrorCampo(event)" novalidate>
      <div class="bloque-titulo">Tus datos</div>
      ${camposHtml}
      ${contraEntrega ? '' : `<div class="campo-resumen">${escapeHtml(entregaResumen)}</div>`}

      ${resumenTotalesHtml('Total a pagar')}

      <p class="nota-cierre">${notaCierre}</p>

      <div class="barra-fija con-aviso">
        <div id="avisoDatos" class="aviso-datos" role="alert" hidden></div>
        ${contraEntrega ? `<button type="submit" class="btn-wa-coordinar ce-boton" id="btnConfirmar">${iconWhatsapp} Pedir contra entrega</button>`
          : `<button type="submit" class="btn-app ${ctaClase}${unaPagina ? ' btn-tendencia' : ''}" id="btnConfirmar">${ctaTexto}</button>`}
        ${unaPagina && !contraEntrega ? `<button type="button" class="btn-wa-coordinar" onclick="coordinarPorWhatsapp()">${iconWhatsapp} Coordinar pago por WhatsApp</button>` : ''}
      </div>
    </form>
  </div>`;
}

/* --------------------------- /pedido/<id> --------------------------- */
function renderPedido(){
  if(state.pedidoYape) return renderPedidoYape();
  const enviado = state.pedidoEnviado || {};
  const entregaResumen = enviado.entrega === 'tienda'
    ? (enviado.moto ? 'Recojo con motorizado' : 'Recojo en tienda')
    : enviado.agencia ? `Envío a agencia Shalom · ${enviado.agencia}`
    : 'Envío a domicilio · Lima Metropolitana';
  const totalTexto = state.pedidoEnviado ? fmt(state.pedidoEnviado.total) : '';

  return `
  <div class="app-shell">
    <div class="pedido-ok">
      <span class="pedido-check">✓</span>
      <h1 class="pedido-titulo">Pedido enviado</h1>
      <p class="pedido-copy">Pedido <strong>#${escapeHtml(state.orderId || '')}</strong>${totalTexto?` por ${totalTexto}`:''}. Te escribimos por WhatsApp para confirmar stock y darte los datos de pago.</p>
      <div class="pedido-tarjeta">
        <div class="pedido-modo">${escapeHtml(entregaResumen)}</div>
        <div class="pedido-dir">${escapeHtml(STORE_ADDRESS)} · ${escapeHtml(STORE_HOURS)}</div>
      </div>
      <a class="btn-app verde" target="_blank" rel="noopener" href="${waHref('Hola, acabo de enviar el pedido #' + (state.orderId||'') + '.')}">Abrir el chat</a>
      <button type="button" class="btn-app contorno" onclick="terminarPedido()">Seguir comprando</button>
    </div>
  </div>`;
}

/* ⚠️ Reemplaza con tu número real de WhatsApp Business (código de país + número, sin +, espacios ni guiones) */
const STORE_WHATSAPP = '51921317384';

/* Dirección de tu tienda física (para el mapa y el botón "Ver en Google Maps") */
const STORE_ADDRESS = 'Av. Los Héroes 382, San Juan de Miraflores, Lima 15801, Perú';
const STORE_MAPS_LINK = 'https://maps.app.goo.gl/y722ggq4K2s6Q5pK9';
const STORE_HOURS = 'Lunes a domingo, 9:30 a.m. – 9:00 p.m.';

/* Calificación real en Google — actualízala cuando cambie tu promedio/reseñas */
const STORE_RATING = 4.7;
const STORE_REVIEW_COUNT = 113;

/* Envío: gratis a partir de este monto (S/); si no llega, se cobra el costo fijo indicado */

/* ⚠️ Pega aquí la URL de tu Web App de Google Apps Script (ver mercadopago-backend.gs) */
const MP_API_URL = 'https://script.google.com/macros/s/AKfycbxyrzUjXsG2wiE-gA2oWsQ1cBWEBNLK1Ffmav9TrbcLCw9jufGrb7ESqLxz-GzxRu-_/exec';

/* ======================================================================
   SEGUIMIENTO DE CONVERSIONES — GOOGLE ADS
   Cuando crees tu cuenta de Google Ads y actives el seguimiento de
   conversiones (Herramientas > Conversiones > Nueva > Sitio web), Google
   te da un "ID de conversión" (empieza con AW-) y una "etiqueta" por
   cada acción que quieras medir (ej. una para WhatsApp, otra para
   "agregar al carrito", otra para compra). Pega esos valores abajo —
   mientras digan "PEGA_AQUI", el seguimiento queda apagado y no se
   carga ningún script de Google, así que no rompe nada dejarlo así.
   ====================================================================== */
const GOOGLE_ADS_CONVERSION_ID = 'AW-18411812687';   // cuenta 169-728-8841

/* Cuatro acciones, no tres. La diferencia entre las dos últimas es la que
   decide si Google optimiza con datos reales o con humo:

   - pedidoWhatsapp: el cliente le dio a "Confirmar pedido" y se le abrió el
     chat. TODAVÍA NO PAGÓ: un asesor tiene que validar stock y pasarle el
     número de Yape, y una parte de estos pedidos nunca se cobra. En Google
     Ads va como "Cliente potencial", no como "Compra".
   - compraPagada: Mercado Pago devolvió status=approved. Eso sí es plata
     cobrada, y es la única que debería contar como "Compra".

   Si las dos van juntas con el monto completo, Google cree que rindes más de
   lo que rindes y te gasta el presupuesto donde no toca. */
const GOOGLE_ADS_LABELS = {
  whatsapp:        'WilLCMHrrvscEM_ut8tE',        // clic en WhatsApp — categoría "Contacto"
  addToCart:       'rzkjCL7rrvscEM_ut8tE',        // "Agregar al carrito" — "Inclusión en el carrito"
  inicioPago:      '_423CLHRtPscEM_ut8tE',        // /checkout con carrito — "Inicio de la tramitación"
  /* Principal en Google Ads desde el 2026-09-24, a pedido del dueño: para él
     la venta se cierra en el chat, y un pedido enviado por WhatsApp es la
     señal más clara que tiene Google de quién compra. Nadie ha pagado todavía,
     pero es lo que el dueño quiere que Google busque. */
  pedidoWhatsapp:  'klWNCLTRtPscEM_ut8tE',        // pedido al chat, sin cobrar — "Cliente potencial"
  compraPagada:    'KhewCIybrvscEM_ut8tE'          // pago aprobado en Mercado Pago
};

function googleAdsConfigured(){
  return GOOGLE_ADS_CONVERSION_ID && !GOOGLE_ADS_CONVERSION_ID.includes('PEGA_AQUI');
}

/* Carga el script de Google (gtag.js) solo si ya pegaste tu ID real */
function loadGoogleAdsTracking(){
  if(!googleAdsConfigured()) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_CONVERSION_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GOOGLE_ADS_CONVERSION_ID);
}

/* Microsoft Clarity: graba cómo navegan los visitantes (dónde tocan, hasta
   dónde bajan, cuándo se van) para entender por qué los que llegan desde los
   anuncios se van sin escribir. Proyecto "Chipao Music" del dueño. Solo en el
   dominio real, para no llenarlo de visitas de prueba, y nunca si se entra al
   panel por su URL; si se entra después, render() marca #app para que
   Clarity lo tape (data-clarity-mask). Los campos de formulario los enmascara
   Clarity por defecto. */
const CLARITY_ID = 'ynzzy3nret';
function loadClarity(){
  if(location.hostname !== 'chipaomusic.com') return;
  if(new URLSearchParams(location.search).has('panel')) return;
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", CLARITY_ID);
}

/* Avisa a Google Ads que ocurrió una conversión. labelKey es una clave de
   GOOGLE_ADS_LABELS. No hace nada si aún no configuraste tus etiquetas. */
function trackAdsConversion(labelKey, value){
  if(!googleAdsConfigured() || typeof gtag !== 'function') return;
  /* Las campañas son de Chipao Music: nada de Chipao Tendencia cuenta como
     conversión -ni estar en /tendencia, ni un carrito con productos de ahí,
     que es lo que sigue en pie hasta que se confirma el pago con Yape-. Si
     contara, Google optimizaría los anuncios de Chipao con ventas ajenas. */
  if(modoTendencia() || carritoTendencia()) return;
  const label = GOOGLE_ADS_LABELS[labelKey];
  if(!label || label.includes('PEGA_AQUI')) return;
  const params = { send_to: `${GOOGLE_ADS_CONVERSION_ID}/${label}` };
  if(value){ params.value = value; params.currency = 'PEN'; }
  gtag('event', 'conversion', params);
}

/* Lee el formulario y lo guarda en el estado, para que volver atrás al
   carrito y regresar no borre lo que ya había escrito. */
function leerDatosDelFormulario(){
  const v = id => (document.getElementById(id) || {}).value || '';
  state.datos = {
    nombre: v('coNombre').trim(),
    telefono: v('coTelefono').trim(),
    email: v('coEmail').trim(),
    direccion: v('coDireccion').trim(),
    color: v('coColor').trim(),   // solo existe en "Tu pedido" de Tendencia
  };
  return state.datos;
}

/* ---------------- datos que faltan al pagar ----------------
   El formulario va con novalidate: el globito nativo del navegador sale en
   el idioma del navegador y, en escritorio, lejos del botón (que está en la
   columna derecha), así que casi nadie lo veía. En su lugar: cada campo
   vacío en rojo con su mensaje, la página sube al primero, y un aviso rojo
   encima del botón dice qué falta. */
function datosFaltantes(){
  const falta = [];
  const val = id => (document.getElementById(id)?.value || '').trim();
  if(!val('coNombre')) falta.push({ id:'coNombre', nombre:'nombre', msg:'Escribe tu nombre y apellido' });
  const tel = val('coTelefono');
  if(!tel) falta.push({ id:'coTelefono', nombre:'teléfono', msg:'Escribe tu celular' });
  else if(!/^[0-9]{9}$/.test(tel)) falta.push({ id:'coTelefono', nombre:'teléfono', msg:'El celular debe tener 9 dígitos, como 987654321' });
  if(document.getElementById('coEmail')){
    const mail = val('coEmail');
    if(!mail) falta.push({ id:'coEmail', nombre:'correo', msg:'Escribe tu correo: ahí te llega la confirmación' });
    else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) falta.push({ id:'coEmail', nombre:'correo', msg:'Revisa tu correo, parece que le falta algo' });
  }
  if(state.entrega === 'peru' && !state.agencia){
    falta.push({ id: state.buscandoAgencia ? 'agBuscar' : null, sel:'.agencia-invita', nombre:'agencia Shalom', msg:'Elige la agencia Shalom donde recoges tu pedido' });
  }
  if(!val('coDireccion')){
    const msg = state.entrega === 'tienda' ? (state.motoPropio ? 'Escribe los datos del motorizado' : 'Escribe quién lo recoge y cuándo')
      : state.entrega === 'peru' ? 'Escribe quién recoge en la agencia (nombre y DNI)' : 'Escribe la dirección de entrega';
    falta.push({ id:'coDireccion', nombre: state.entrega === 'lima' ? 'dirección' : 'quién recoge', msg });
  }
  return falta;
}
function limpiarErroresDatos(){
  document.querySelectorAll('#pedidoForm .campo-error').forEach(el => el.classList.remove('campo-error'));
  document.querySelectorAll('#pedidoForm .campo-msg').forEach(el => el.remove());
  const aviso = document.getElementById('avisoDatos');
  if(aviso){ aviso.hidden = true; aviso.textContent = ''; }
}
/* Al escribir en un campo marcado se le quita el rojo; si ya no queda
   ninguno, también se va el aviso del botón. */
function limpiarErrorCampo(e){
  const el = e.target;
  if(!el || !el.classList || !el.classList.contains('campo-error')) return;
  el.classList.remove('campo-error');
  el.parentElement?.querySelector('.campo-msg')?.remove();
  textoAvisoDatos();
}
/* El aviso del botón nombra solo lo que sigue marcado en rojo. */
function textoAvisoDatos(){
  const aviso = document.getElementById('avisoDatos');
  if(!aviso) return;
  const nombres = [...document.querySelectorAll('#pedidoForm .campo-error')].map(el => el.dataset.falta).filter(Boolean);
  if(!nombres.length){ aviso.hidden = true; return; }
  const lista = nombres.length > 1 ? nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1] : nombres[0];
  aviso.textContent = `Rellena tus datos primero: falta ${lista}.`;
  aviso.hidden = false;
}
function avisarDatosFaltantes(falta){
  limpiarErroresDatos();
  let primero = null;
  falta.forEach(f => {
    const el = f.id ? document.getElementById(f.id) : document.querySelector(f.sel);
    if(!el) return;
    el.classList.add('campo-error');
    el.dataset.falta = f.nombre;
    const msg = document.createElement('span');
    msg.className = 'campo-msg';
    msg.textContent = f.msg;
    el.insertAdjacentElement('afterend', msg);
    if(!primero) primero = el;
  });
  textoAvisoDatos();
  if(primero){
    primero.scrollIntoView({ behavior:'smooth', block:'center' });
    if(primero.focus && primero.tagName !== 'DIV') primero.focus({ preventScroll:true });
  }
}

/* Chipao Tendencia (21-11-2026): "Coordinar pago por WhatsApp" bajo el botón
   de Yape. Solo pide nombre y teléfono (Yape pide todo). Abre el chat con el
   pedido armado y NO cierra el pedido: el carrito sigue por si luego paga
   con Yape. */
function coordinarPorWhatsapp(){
  const falta = datosFaltantes().filter(f => f.id === 'coNombre' || f.id === 'coTelefono');
  if(falta.length){ avisarDatosFaltantes(falta); return; }
  limpiarErroresDatos();
  const datos = leerDatosDelFormulario();
  const { total } = computeOrderTotals();
  const lineas = state.cart.map(c => {
    const p = productoPorId(c.id);
    return p ? `• ${c.qty}x ${p.name}${c.color ? ` (${c.color})` : ''} — ${fmt(totalLinea(p, c.qty))}` : '';
  }).filter(Boolean).join('\n');
  const agencia = state.agencia ? `${state.agencia[1]} (${state.agencia[0]})` : 'por elegir';
  const mensaje =
`Hola, quiero coordinar el pago de mi pedido de Chipao Tendencia:

${lineas}

Envío por Shalom: Gratis
Total: ${fmt(total)}

Nombre: ${datos.nombre}
Teléfono: ${datos.telefono}${datos.email ? `\nCorreo: ${datos.email}` : ''}${datos.color ? `\nColor: ${datos.color}` : ''}
Agencia Shalom: ${agencia}${datos.direccion ? `\nRecoge: ${datos.direccion}` : ''}`;
  window.open(waHref(mensaje), '_blank', 'noopener');
}

/* Chipao Tendencia (22-11-2026): "Contra entrega". Solo nombre y teléfono;
   abre WhatsApp con el pedido armado. Como "Coordinar por WhatsApp", NO
   cierra el pedido: si el cliente no envía el mensaje, el carrito sigue. */
function pedirContraEntrega(){
  const falta = datosFaltantes().filter(f => f.id === 'coNombre' || f.id === 'coTelefono');
  if(falta.length){ avisarDatosFaltantes(falta); return; }
  limpiarErroresDatos();
  const datos = leerDatosDelFormulario();
  const { total } = computeOrderTotals();
  const lineas = state.cart.map(c => {
    const p = productoPorId(c.id);
    return p ? `• ${c.qty}x ${p.name}${c.color ? ` (${c.color})` : ''} — ${fmt(totalLinea(p, c.qty))}` : '';
  }).filter(Boolean).join('\n');
  const mensaje =
`Hola, quiero hacer un pedido CONTRA ENTREGA en Chipao Tendencia:

${lineas}

Total: ${fmt(total)} (pago al recibir)

Nombre: ${datos.nombre}
Teléfono: ${datos.telefono}`;
  window.open(waHref(mensaje), '_blank', 'noopener');
}

async function submitOrder(e){
  e.preventDefault();
  if(esContraEntrega()){ pedirContraEntrega(); return; }
  const falta = datosFaltantes();
  if(falta.length){ avisarDatosFaltantes(falta); return; }
  limpiarErroresDatos();
  let datos = leerDatosDelFormulario();
  if(!datos.nombre || !datos.telefono || !datos.direccion) return;
  /* El pedido y el WhatsApp tienen que decir que viene un motorizado. */
  if(state.entrega === 'tienda' && state.motoPropio) datos = {...datos, direccion: 'Mando mi motorizado · ' + datos.direccion};
  /* Tendencia: el color pedido viaja junto a "quién recoge", que ya sale en
     el panel de pedidos y en los correos. */
  if(datos.color && carritoSoloTendencia()) datos = {...datos, direccion: datos.direccion + ' · Color: ' + datos.color};
  if(state.entrega === 'peru' && !state.agencia){
    showToast('Elige la agencia Shalom donde recoges tu pedido');
    return;
  }

  fijarOpcionesTendencia();
  const medio = medioPago(state.pago);

  /* La tarjeta se cobra en línea; el resto se cierra en el chat. */
  if(medio.key === 'tarjeta'){
    await payWithMercadoPago(datos);
    return;
  }
  /* Yape se valida en la web con la captura del comprobante. */
  if(medio.key === 'yape'){
    await pagarConYape(datos);
    return;
  }

  const { subtotal, ship, provincia, total } = computeOrderTotals();
  const lineas = state.cart.map(c=>{
    const p = productoPorId(c.id);
    if(!p) return '';
    return `• ${c.qty}x ${p.name}${c.color ? ` (${c.color})` : ''} — ${fmt(totalLinea(p, c.qty))}`;
  }).filter(Boolean).join('\n');

  const numero = nuevoNumeroPedido();
  const entregaTexto = textoEntrega();

  const mensaje =
`🎵 Pedido #${numero} — Chipao Music

${lineas}

Subtotal: ${fmt(subtotal)}
${state.entrega === 'tienda' ? 'Recojo en tienda: Gratis' : `Envío: ${ship>0?fmt(ship):'Gratis'}`}${provincia > 0 ? `\nAdicional envío a provincia: ${fmt(provincia)}` : ''}
Total: ${fmt(total)}

Entrega: ${entregaTexto}
Medio de pago: ${medio.label}${medio.regalo && Date.now() < SORTEO_HASTA && !carritoTendencia() ? ' (participa en el sorteo navideño)' : ''}

Cliente: ${datos.nombre}
Teléfono: ${datos.telefono}
${state.entrega === 'tienda' || agenciaActiva() ? 'Recoge' : 'Dirección'}: ${datos.direccion}`;

  window.open(`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener');
  /* Pedido enviado, no cobrado: va como cliente potencial. */
  trackAdsConversion('pedidoWhatsapp', total);
  cerrarPedido(numero, total);
}

/* Deja el pedido por cerrado: guarda lo que la pantalla de confirmación
   necesita enseñar, vacía el carrito y navega a /pedido/<id>. */
function cerrarPedido(numero, total){
  pagoMedido = false;   // el próximo pedido vuelve a medir su inicio de pago
  state.pedidoEnviado = { total, entrega: state.entrega, moto: state.entrega === 'tienda' && state.motoPropio,
    agencia: agenciaActiva() ? agenciaActiva()[1] : null };
  state.orderId = numero;
  state.orderPlaced = true;
  state.cart = [];
  updateCartCount();
  state.view = 'pedido';
  navigateTo('/pedido/' + numero, true);
  aplicarMetaSesion('pedido');
  render();
  window.scrollTo({top:0});
}

/* "Seguir comprando": limpia el pedido cerrado y vuelve a la portada. */
function terminarPedido(){
  state.pedidoYape = null;
  state.orderPlaced = false;
  state.orderId = null;
  state.pedidoEnviado = null;
  irInicioTienda();
}

/* ======================== PAGO CON YAPE ========================

   El pedido se crea en el servidor (/api/pedido), que calcula el total con
   los precios de la base. El cliente yapea, sube la captura del comprobante y
   el Worker la valida (ver src/pagos.js): monto, destinatario, hora y número
   de operación. Estados que llegan del servidor: pendiente, revision, pagado,
   rechazado, expirado.

   El pedido vive en state.pedidoYape; la cuenta regresiva y el sondeo del
   estado "en revisión" cuelgan de un solo setInterval que solo toca el texto
   del reloj, sin repintar la pantalla cada segundo. */
const RE_PEDIDO_YAPE = /^CH-[A-Z0-9]{6}$/;
const YAPE_SONDEO_SEG = 15;
let yapeTimer = null, yapeTicks = 0, yapeEnviando = false;

async function pagarConYape(datos){
  const btn = document.getElementById('btnConfirmar');
  const original = btn ? btn.textContent : '';
  if(btn){ btn.disabled = true; btn.textContent = 'Creando tu pedido...'; }
  const restaurar = () => { if(btn){ btn.disabled = false; btn.textContent = original; } };
  try{
    const r = await fetch('/api/pedido', {
      method:'POST', headers:{ 'content-type':'application/json' },
      body: JSON.stringify({
        items: state.cart.map(c => ({ id:c.id, qty:c.qty, color:c.color || null })),
        entrega: state.entrega,
        agencia: agenciaActiva(),
        datos
      })
    });
    const d = await r.json().catch(() => ({}));
    if(!r.ok){ showToast(d.error || 'No pudimos crear el pedido. Inténtalo otra vez.'); restaurar(); return; }
    d.desfase = d.ahora_ms - Date.now();
    state.pedidoYape = d;
    goPedido(d.id, true);
  }catch(err){
    showToast('Sin conexión. Revisa tu internet e inténtalo otra vez.');
    restaurar();
  }
}

async function cargarPedidoYape(id){
  try{
    const r = await fetch('/api/pedido/' + id);
    if(r.status === 404){ state.pedidoYape = null; render(); return; }
    const d = await r.json();
    d.desfase = d.ahora_ms - Date.now();
    state.pedidoYape = d;
  }catch(err){
    state.pedidoYape = { id, estado:'sin-red' };
  }
  if(state.view === 'pedido' && state.orderId === id){ render(); iniciarRelojYape(); }
}

/* Aplica lo que respondió el servidor. Si el pedido acaba de quedar pagado
   aquí mismo, se vacía el carrito y se mide la compra: solo en esa
   transición, para no contarla de nuevo al recargar. */
function aplicarEstadoYape(nuevo){
  const antes = state.pedidoYape && state.pedidoYape.estado;
  nuevo.desfase = nuevo.ahora_ms - Date.now();
  state.pedidoYape = nuevo;
  if(nuevo.estado === 'pagado' && (antes === 'pendiente' || antes === 'revision')){
    trackAdsConversion('compraPagada', nuevo.total);
    pagoMedido = false;
    state.cart = [];
    updateCartCount();
  }
  if(state.view === 'pedido' && state.orderId === nuevo.id){ render(); iniciarRelojYape(); }
}

function segundosRestantesYape(){
  const p = state.pedidoYape;
  if(!p || !p.expira_ms) return 0;
  return Math.floor((p.expira_ms - (Date.now() + (p.desfase || 0))) / 1000);
}
function textoRelojYape(){
  const s = segundosRestantesYape();
  if(s <= 0) return 'Se acabó el tiempo. Si ya pagaste, sube la captura ahora.';
  return 'Te quedan ' + String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
}

function iniciarRelojYape(){
  clearInterval(yapeTimer);
  yapeTimer = null;
  const p = state.pedidoYape;
  if(!p || state.view !== 'pedido' || (p.estado !== 'pendiente' && p.estado !== 'revision')) return;
  yapeTicks = 0;
  yapeTimer = setInterval(async () => {
    const q = state.pedidoYape;
    if(!q || state.view !== 'pedido' || state.orderId !== q.id){ clearInterval(yapeTimer); return; }
    if(q.estado === 'pendiente'){
      const el = document.getElementById('yapeReloj');
      if(el) el.textContent = textoRelojYape();
    } else if(q.estado === 'revision'){
      if(++yapeTicks % YAPE_SONDEO_SEG === 0){
        try{
          const r = await fetch('/api/pedido/' + q.id);
          if(r.ok){ const d = await r.json(); if(d.estado !== q.estado) aplicarEstadoYape(d); }
        }catch(err){}
      }
    } else {
      clearInterval(yapeTimer);
    }
  }, 1000);
}

/* Reduce la captura antes de subirla: el celular la saca de 1-3 MB y el
   comprobante se lee igual de bien a 1600 px. Si el navegador no la puede
   decodificar (HEIC, por ejemplo) se manda tal cual, si cabe. */
function reducirCaptura(file){
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try{
        const lado = Math.max(img.naturalWidth, img.naturalHeight);
        const k = lado > 1600 ? 1600 / lado : 1;
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * k);
        c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => { URL.revokeObjectURL(url); resolve(b || file); }, 'image/jpeg', 0.85);
      }catch(err){ URL.revokeObjectURL(url); resolve(file); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

function avisoYape(lineas){
  const el = document.getElementById('yapeAviso');
  if(!el) return;
  el.innerHTML = lineas.map(l => `<p>${escapeHtml(l)}</p>`).join('');
  el.hidden = !lineas.length;
}

async function subirCapturaYape(input){
  const file = input.files && input.files[0];
  input.value = '';
  const p = state.pedidoYape;
  if(!file || !p || yapeEnviando) return;
  if(!/^image\//.test(file.type)){ avisoYape(['Sube la captura como imagen (JPG, PNG o WebP).']); return; }
  yapeEnviando = true;
  const boton = document.getElementById('yapeSubir');
  const textoBoton = boton ? boton.querySelector('span') : null;
  if(boton) boton.classList.add('ocupado');
  if(textoBoton) textoBoton.textContent = 'Validando tu pago...';
  avisoYape([]);
  try{
    const imagen = await reducirCaptura(file);
    const r = await fetch('/api/pedido/' + p.id + '/comprobante', {
      method:'POST', headers:{ 'content-type': imagen.type || 'image/jpeg' }, body: imagen
    });
    const d = await r.json().catch(() => ({}));
    if(!r.ok){ avisoYape([d.error || 'No pudimos revisar la captura. Inténtalo otra vez.']); }
    else if(d.rechazo && d.rechazo.length){
      avisoYape(d.rechazo.concat(['Puedes subir otra captura.']));
    }
    else aplicarEstadoYape(d);
  }catch(err){
    avisoYape(['Sin conexión. Revisa tu internet y vuelve a subir la captura.']);
  }
  yapeEnviando = false;
  const b2 = document.getElementById('yapeSubir');
  if(b2){ b2.classList.remove('ocupado'); const t = b2.querySelector('span'); if(t) t.textContent = 'Subir captura del comprobante'; }
}

function copiarNumeroYape(numero){
  const listo = () => showToast('Número copiado');
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(numero).then(listo, listo);
  } else {
    const t = document.createElement('textarea');
    t.value = numero; document.body.appendChild(t); t.select();
    try{ document.execCommand('copy'); }catch(err){}
    document.body.removeChild(t); listo();
  }
}

function renderPedidoYape(){
  const p = state.pedidoYape;
  const id = escapeHtml(p.id);
  const ayuda = waHref('Hola, mi pedido es ' + p.id + ' y necesito ayuda con mi pago de Yape.');
  const enlaceAyuda = `<a class="btn-app contorno" target="_blank" rel="noopener" href="${ayuda}">Escribirnos por WhatsApp</a>`;
  const num = p.yape ? p.yape.numero : '921317384';
  const numBonito = num.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');

  if(p.estado === 'cargando'){
    return `<div class="app-shell"><div class="pedido-ok"><p class="pedido-copy">Cargando tu pedido...</p></div></div>`;
  }
  if(p.estado === 'sin-red'){
    return `<div class="app-shell"><div class="pedido-ok">
      <h1 class="pedido-titulo">Sin conexión</h1>
      <p class="pedido-copy">No pudimos consultar tu pedido <strong>#${id}</strong>. Revisa tu internet.</p>
      <button type="button" class="btn-app oscuro" onclick="cargarPedidoYape('${id}')">Reintentar</button>
    </div></div>`;
  }
  if(p.estado === 'pagado'){
    return `<div class="app-shell"><div class="pedido-ok">
      <span class="pedido-check">✓</span>
      <h1 class="pedido-titulo">¡Pago confirmado!</h1>
      <p class="pedido-copy">Pedido <strong>#${id}</strong> por ${fmt(p.total)}. ${modoTendencia() ? 'Guarda tu código: si tienes dudas, escríbenos por WhatsApp con él.' : 'Te enviamos la confirmación por correo. Si no la ves, revisa la carpeta de spam.'}</p>
      <button type="button" class="btn-app oscuro" onclick="terminarPedido()">Seguir comprando</button>
      ${enlaceAyuda}
    </div></div>`;
  }
  if(p.estado === 'revision'){
    return `<div class="app-shell"><div class="pedido-ok">
      <span class="pedido-check yape-espera">…</span>
      <h1 class="pedido-titulo">Estamos revisando tu pago</h1>
      <p class="pedido-copy">Pedido <strong>#${id}</strong> por ${fmt(p.total)}. Recibimos tu captura y la confirmamos a mano. Esta pantalla se actualiza sola${modoTendencia() ? '' : ' y también te escribimos por correo'}.</p>
      ${enlaceAyuda}
    </div></div>`;
  }
  if(p.estado === 'rechazado'){
    return `<div class="app-shell"><div class="pedido-ok">
      <h1 class="pedido-titulo">No pudimos validar tu pago</h1>
      <p class="pedido-copy">Pedido <strong>#${id}</strong>. Escríbenos por WhatsApp con tu código y lo resolvemos enseguida.</p>
      ${enlaceAyuda}
      <button type="button" class="btn-app contorno" onclick="terminarPedido()">Volver a la tienda</button>
    </div></div>`;
  }
  if(p.estado === 'expirado'){
    return `<div class="app-shell"><div class="pedido-ok">
      <h1 class="pedido-titulo">Se acabó el tiempo</h1>
      <p class="pedido-copy">El pedido <strong>#${id}</strong> venció sin un pago válido. Tu carrito sigue ahí: puedes intentarlo de nuevo.</p>
      <p class="pedido-copy">Si ya yapeaste, escríbenos con tu código y lo revisamos.</p>
      <button type="button" class="btn-app oscuro" onclick="state.pedidoYape=null;goCheckout()">Intentar de nuevo</button>
      ${enlaceAyuda}
    </div></div>`;
  }

  /* pendiente: instrucciones y subida de la captura */
  return `
  <div class="app-shell">
    <div class="yape-pago">
      <div class="yape-reloj" id="yapeReloj" role="timer">${textoRelojYape()}</div>
      <h1 class="pedido-titulo">Paga ${fmt(p.total)} con Yape</h1>
      <p class="pedido-copy">Pedido <strong>#${id}</strong></p>

      <div class="yape-alerta"><b>Tu pedido no queda confirmado hasta que subas la captura del Yape.</b> Yapear solo no basta: la captura es lo que nos dice que ya pagaste.</div>

      <ol class="yape-pasos">
        <li>
          <b>Yapea exactamente ${fmt(p.total)}</b> a este número:
          <div class="yape-numero">
            <span>${numBonito}</span>
            <button type="button" onclick="copiarNumeroYape('${num}')">Copiar</button>
          </div>
          <small>En Yape verás el nombre <b>${escapeHtml(p.yape ? p.yape.nombre : '')}</b>. Si es otro, no pagues.</small>
        </li>
        <li>
          <b>Escribe tu código en el mensaje</b> de Yape: <b>${id}</b>
          <small>No es obligatorio, pero nos ayuda a ubicar tu pago.</small>
        </li>
        <li class="clave">
          <b>Sube la captura</b><span class="yape-oblig">Obligatorio</span> del comprobante, completa y sin recortar: la pantalla "¡Yapeaste!" o, si yapeaste desde la app de tu banco, la de "Operación exitosa".
        </li>
      </ol>

      <label class="btn-app oscuro yape-subir" id="yapeSubir">
        <input type="file" accept="image/*" onchange="subirCapturaYape(this)">
        <span>Subir captura del comprobante</span>
      </label>
      <div class="yape-aviso" id="yapeAviso" role="alert" hidden></div>
      <p class="yape-sin-captura">¿Ya yapeaste? Sube la captura ahora, si no tu pedido se queda sin confirmar.</p>

      <p class="yape-nota">Pagos desde S/ 200 los confirmamos a mano${modoTendencia() ? '' : ' y te avisamos por correo'}. La captura debe ser de un pago hecho después de crear este pedido.</p>
      ${enlaceAyuda}
    </div>
  </div>`;
}

async function payWithMercadoPago(comprador){
  if(!MP_API_URL || MP_API_URL.startsWith('PEGA_AQUI')){
    showToast('Falta configurar MP_API_URL en el código. Revisa las instrucciones.');
    return;
  }
  const btn = document.getElementById('btnConfirmar');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Redirigiendo a Mercado Pago...';

  /* El color va en el título para que aparezca en el comprobante de Mercado
     Pago y en el correo que le llega al cliente. */
  const items = state.cart.map(c=>{
    const p = productoPorId(c.id);
    return { title: p.name + (c.color ? ' (' + c.color + ')' : ''), quantity: c.qty, unit_price: p.price };
  });
  const { ship, provincia } = computeOrderTotals();
  if(ship>0){
    items.push({ title: 'Costo de envío', quantity: 1, unit_price: ship });
  }
  if(provincia>0){
    items.push({ title: 'Adicional envío a provincia', quantity: 1, unit_price: provincia });
  }
  const entrega = textoEntrega();

  try{
    const res = await fetch(MP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita preflight CORS con Apps Script
      body: JSON.stringify({ items, comprador, entrega })
    });
    const data = await res.json();
    if(data.init_point){
      window.location.href = data.init_point;
    }else{
      throw new Error(data.error || 'Sin init_point');
    }
  }catch(err){
    showToast('No se pudo conectar con Mercado Pago. Intenta con otro método.');
    btn.disabled = false;
    btn.textContent = original;
  }
}

/* Al volver de Mercado Pago, la URL trae ?status=approved|pending|failure */
function checkPaymentReturnStatus(){
  const params = new URLSearchParams(window.location.search);
  const status = params.get('status');
  if(!status) return;
  if(status === 'approved'){
    const total = cartTotal();
    /* La única venta cobrada de verdad que el sitio puede confirmar solo. */
    trackAdsConversion('compraPagada', total);
    /* Se limpia el parámetro antes de cerrar el pedido, porque cerrarPedido
       navega a /pedido/<id> y si no el ?status se arrastraría hasta ahí. */
    window.history.replaceState({}, '', window.location.pathname);
    cerrarPedido(nuevoNumeroPedido(), total);
    return;
  }
  if(status === 'pending'){
    showToast('⏳ Tu pago está pendiente de confirmación.');
  }else if(status === 'failure'){
    showToast('❌ El pago no se completó. Puedes intentar de nuevo.');
  }
  // limpia el parámetro de la URL sin recargar la página
  window.history.replaceState({}, '', window.location.pathname);
}

/* Pie de página: dirección y horario en filas con ícono y un botón "Cómo llegar".
   Sin el teléfono (ya está en el botón de WhatsApp) y sin mapa. */
document.getElementById('footerLocation').innerHTML = `
  <div class="ft-row">
    ${iconSvg('pin','style="width:17px;height:17px;flex-shrink:0"')}
    <p><span>Av. Los Héroes 382</span><small>San Juan de Miraflores, Lima</small></p>
  </div>
  <div class="ft-row">
    <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;flex-shrink:0"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
    <p><span>Todos los días</span><small>9:30 a.m. &ndash; 9:00 p.m.</small></p>
  </div>
  <a href="${STORE_MAPS_LINK}" target="_blank" rel="noopener" class="store-maps-btn ft-maps"><span>Cómo llegar</span><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><path d="M7 17L17 7M8 7h9v9"/></svg></a>`;

/* Sincroniza la página (categoría/producto/ofertas/inicio) con el botón
   "atrás"/"adelante" del navegador */
window.addEventListener('popstate', ()=>{
  routeFromPath(false);
});

/* ======================================================================
   TOAST
   ====================================================================== */
let toastTimer;
/* El segundo argumento enseña el enlace 'Ver' que lleva al carrito. Solo lo
   usan los avisos de 'agregado': en un error de stock no hay nada que ver.
   Los 2600 ms son los del handoff. */
function showToast(msg, conEnlaceAlCarrito){
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  document.getElementById('toastAccion').hidden = !conEnlaceAlCarrito;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2600);
}

/* ======================================================================
   TALLER DE REPARACIÓN (/taller)
   La única pantalla del sitio en negro y dorado: es un servicio, no un
   producto, y tiene que verse distinto de la tienda.

   Los precios se editan en la pestaña Taller del panel y viven en D1 (tabla
   settings, clave taller_precios). El Worker los incrusta en el HTML y aquí
   se leen al arrancar. TALLER_POR_DEFECTO es la carta impresa del taller: la
   misma copia está en src/index.js y solo se usa si no llega nada (en el
   servidor local, o si la base no contesta).
   ====================================================================== */
const TALLER_POR_DEFECTO = [
  { titulo:'Guitarras', tipos:'Acústicas · eléctricas · electroacústicas', filas:[
    ['Calibración', 100, 'Altura de cuerdas, alma y octavación'],
    ['Calibración + cuerdas nuevas', 130, 'Incluye juego de cuerdas'],
    ['Calibración + cuerdas nuevas + mantenimiento', 160, 'Limpieza de trastes, diapasón y electrónica'],
    ['Reparación, pintura, otros', null, 'Cotización según el estado del instrumento'],
  ]},
  { titulo:'Bajos', tipos:'Acústicos · eléctricos · electroacústicos', filas:[
    ['Calibración', 100, 'Altura de cuerdas, alma y octavación'],
    ['Calibración + cuerdas nuevas', 200, 'Incluye juego de cuerdas'],
    ['Calibración + cuerdas nuevas + mantenimiento', 230, 'Limpieza de trastes, diapasón y electrónica'],
    ['Reparación, pintura, otros', null, 'Cotización según el estado del instrumento'],
  ]},
];
let TALLER_PRECIOS = TALLER_POR_DEFECTO;

function leerTallerPrecios(){
  const bloque = document.getElementById('taller-precios');
  if(!bloque) return TALLER_POR_DEFECTO;
  try{
    const data = JSON.parse(bloque.textContent);
    return Array.isArray(data) && data.length ? data : TALLER_POR_DEFECTO;
  }catch(err){
    return TALLER_POR_DEFECTO;
  }
}

/* El precio más bajo de la carta, para el "desde S/ …" de los avisos. */
function tallerDesde(){
  const precios = TALLER_PRECIOS.flatMap(g => g.filas.map(f => f[1])).filter(Boolean);
  return precios.length ? Math.min(...precios) : 0;
}

/* El logo de la tienda redibujado en dorado: el redondo de siempre es azul
   sobre blanco y en el fondo negro quedaba como una pegatina. Mismas formas
   —la C, la nota, el anillo—, en los tonos de la página. */
function logoTallerSvg(){
  return `<svg class="taller-logo" viewBox="0 0 512 512" role="img" aria-label="Chipao Music">
    <defs>
      <linearGradient id="tallerOro" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f1dca4"/><stop offset=".55" stop-color="#c9a85e"/><stop offset="1" stop-color="#9c7b3c"/>
      </linearGradient>
    </defs>
    <circle cx="256" cy="256" r="244" fill="none" stroke="url(#tallerOro)" stroke-width="6"/>
    <circle cx="256" cy="256" r="226" fill="none" stroke="#c9a85e" stroke-opacity=".28" stroke-width="2"/>
    <path d="M266 209 A89 89 0 1 0 324 333" fill="none" stroke="#efe6d2" stroke-width="58"/>
    <circle cx="262" cy="292" r="48" fill="url(#tallerOro)"/>
    <rect x="291" y="76" width="12" height="216" fill="url(#tallerOro)"/>
    <path d="M298 76 C310 118 392 132 372 226 C366 196 340 168 303 152 Z" fill="url(#tallerOro)"/>
  </svg>`;
}

/* Cormorant Garamond solo hace falta aquí: se pide la primera vez que se abre
   el taller en vez de cargarla en cada visita a la tienda. */
function cargarFuenteTaller(){
  if(document.getElementById('fuenteTaller')) return;
  const l = document.createElement('link');
  l.id = 'fuenteTaller';
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap';
  document.head.appendChild(l);
}


/* Distritos cercanos al taller. Van en las preguntas frecuentes y en los
   datos estructurados: quien busca "reparación de guitarras" suele poner su
   distrito, y el taller queda a minutos de todos estos. */
const TALLER_ZONAS = ['San Juan de Miraflores', 'Villa María del Triunfo', 'Santiago de Surco', 'Chorrillos', 'Villa El Salvador'];

/* Preguntas frecuentes del taller. Solo dicen lo que la tienda ya ofrece:
   precios de la carta, envío gratis en Lima, dirección y horario. */
function tallerFaq(taller) {
  const precios = taller.flatMap(g => g.filas.map(f => f[1])).filter(Boolean);
  const desde = precios.length ? Math.min(...precios) : 0;
  return [
    ['¿Qué incluye la calibración de una guitarra?',
      'Ajustamos la altura de las cuerdas, el alma y la octavación para que la guitarra sea cómoda de tocar y suene afinada en todo el mástil. La hacemos en guitarras acústicas, eléctricas, electroacústicas y en bajos.'],
    ['¿Cuánto cuesta reparar una guitarra?',
      (desde ? 'La calibración cuesta desde S/ ' + desde + '. ' : '') + 'Las reparaciones, la pintura y otros trabajos se cotizan después de revisar el instrumento, según su estado.'],
    ['¿Tienen envío a domicilio?',
      'Sí: el envío a domicilio es gratis en Lima. Escríbenos por WhatsApp y lo coordinamos.'],
    ['¿Cuánto demora la reparación?',
      'Depende del trabajo. Cuando revisamos tu instrumento te decimos el plazo por WhatsApp, antes de empezar.'],
    ['¿Dónde está el taller?',
      'En Av. Los Héroes 382, San Juan de Miraflores, a pocos minutos de Villa María del Triunfo, Santiago de Surco, Chorrillos y Villa El Salvador. Atendemos de lunes a domingo, de 9:30 a.m. a 9:00 p.m.'],
  ];
}

/* El taller como servicio para Google: qué se hace, quién lo hace (la
   tienda, definida en el <head>), dónde, y a qué precio. */
function tallerSchema(taller) {
  const ofertas = taller.flatMap(g => g.filas.filter(f => f[1]).map(f => ({
    '@type': 'Offer',
    name: f[0] + ' (' + g.titulo.toLowerCase() + ')',
    price: String(f[1]),
    priceCurrency: 'PEN',
    itemOffered: { '@type': 'Service', name: f[0] + ' de ' + g.titulo.toLowerCase() },
  })));
  return {
    '@type': 'Service',
    '@id': SITE_ORIGIN + '/taller#servicio',
    name: 'Reparación de guitarras y bajos',
    serviceType: 'Reparación y calibración de guitarras y bajos',
    url: SITE_ORIGIN + '/taller',
    provider: { '@id': SITE_ORIGIN + '/#tienda' },
    areaServed: TALLER_ZONAS.map(name => ({ '@type': 'AdministrativeArea', name })),
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Precios del taller', itemListElement: ofertas },
  };
}

function goTaller(push){
  document.getElementById('modalOverlay').classList.remove('show');
  state.view = 'taller';
  navigateTo('/taller', push);
  setPageMeta('Reparación de guitarras en San Juan de Miraflores | Chipao Music',
    'Taller de reparación de guitarras y bajos en San Juan de Miraflores: calibración, cuerdas y mantenimiento con precios a la vista. Envío a domicilio gratis en Lima.');
  /* Las migas y el servicio juntos: setBreadcrumbSchema solo dejaría las
     migas y borraría el servicio que manda el Worker. */
  setPageSchema({ '@context': 'https://schema.org', '@graph': [
    breadcrumbSchema([{name:'Inicio', path:'/'}, {name:'Taller de reparación', path:'/taller'}]),
    tallerSchema(TALLER_PRECIOS),
  ]});
  render();
  if(push !== false) window.scrollTo({top:0});
}

/* Recuadro de la portada que lleva al taller: la única pieza negra y dorada
   de la tienda, así que se ve sin necesidad de ser grande. */
/* El sorteo termina el 24-dic a las 21:00 de Lima; se apaga igual que la franja. */
/* Carrusel de banners de la portada. Cada banner lleva su imagen de escritorio
   y la cuadrada del teléfono, su enlace y, si la tiene, la fecha en que se apaga
   (hora de Lima, en UTC). Para agregar o cambiar uno, se edita esta lista. */
const BANNERS_PORTADA = [
  { href:'/sorteo', hasta:Date.UTC(2026, 11, 25, 2, 0),
    img:'/sorteo/banner-sorteo.jpg', movil:'/sorteo/banner-sorteo-movil.jpg',
    alt:'Sorteo navideño: gana un violín 4/4 completo o un teclado Vozzex' },
  { tipo:'taller', hasta:null },
  { tipo:'resenas', hasta:null },
];

/* Slide de reseñas reales de la ficha de Google Maps. El texto va citado de
   Google (recortado con "…", sin cambiar palabras) y firmado con nombre e
   inicial del apellido. Todo el slide lleva a las reseñas en Google Maps.
   El número y el promedio salen de STORE_RATING / STORE_REVIEW_COUNT. */
const RESENAS_LINK = 'https://www.google.com/maps/place/Chipao+Music/@-12.0905203,-76.9901927,13z/data=!4m8!3m7!1s0x9105b95fa7a26deb:0x53e1a17f2332de34!8m2!3d-12.1530556!4d-76.9750485!9m1!1b1!16s%2Fg%2F11fn7v7bc6?hl=es';
const RESENAS_SLIDE = [
  { texto:'Son mis caseros de alta confianza! Desde años. Tienen muy buen trato, amabilidad y buena explicación.', firma:'Carlos S.' },
  { texto:'La reparación quedó muy bien… Se nota que trabajan con cuidado y cariño por los instrumentos.', firma:'Victor D.' },
  { texto:'Recomiendo mucho este lugar. El trato es muy amable y los instrumentos son de primera calidad.', firma:'Sebas C.' },
];

function bannerResenasSlideHtml(){
  const nota = String(STORE_RATING).replace('.', ',');
  const g = '<svg class="br-g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  const citas = RESENAS_SLIDE.map(r => `
          <span class="br-cita"><span class="br-est">★★★★★</span><span class="br-txt">“${escapeHtml(r.texto)}”</span><span class="br-firma">${escapeHtml(r.firma)} · Google</span></span>`).join('');
  return `
      <a class="bn-slide bn-css bn-css-resenas" href="${RESENAS_LINK}" target="_blank" rel="noopener" aria-label="Ver las ${STORE_REVIEW_COUNT} reseñas de Chipao Music en Google (${nota} de 5)">
        <span class="br-izq">
          <span class="br-sobre">${g}Reseñas en Google</span>
          <span class="br-fila"><span class="br-nota">${nota}</span><span class="br-col">
            <span class="br-estrellas">★★★★★</span>
            <span class="br-cuenta"><b>${STORE_REVIEW_COUNT} clientes</b> nos calificaron</span></span></span>
          <span class="br-btn">Ver todas las reseñas ›</span>
        </span>
        <span class="br-citas">${citas}
        </span>
      </a>`;
}

/* Banner del taller, dibujado con HTML y CSS (no imagen): el texto se ve nítido
   en cualquier pantalla, el botón es un WhatsApp de verdad y para cambiar la
   promoción basta con editar estas líneas. */
const BANNER_TALLER = {
  sobre:'Taller de luthería',
  titulo:'Inauguramos',
  insignia:'¡Primeros 100 clientes!',
  cifra:'30',
  cifraTexto:'de descuento',
  detalle:'Por inauguración',
  servicios:'Calibración, cuerdas y mantenimiento · guitarras y bajos',
  condicion:'Válido para los primeros 100 clientes · cupos limitados',
  boton:'Reserva por WhatsApp',
  mensaje:'Hola, quiero reservar el taller de luthería con el 30% de descuento por inauguración.',
};

function bannerTallerSlideHtml(){
  const t = BANNER_TALLER;
  cargarFuenteTaller();
  return `
      <div class="bn-slide bn-css bn-css-taller">
        <a class="bn-todo" href="/taller" onclick="goTaller();return false;" aria-label="Taller de luthería: ${t.cifra}% de descuento por inauguración"></a>
        <div class="bt2-izq">
          <span class="bt2-sobre">${t.sobre}</span>
          <span class="bt2-titulo">${t.titulo}</span>
          <span class="bt2-serv">${t.servicios}</span>
          <a class="bt2-btn" target="_blank" rel="noopener" href="${waHref(t.mensaje)}" onclick="trackAdsConversion('whatsapp')">${t.boton}</a>
          <span class="bt2-cond">${t.condicion}</span>
        </div>
        <img class="bt2-guitarra" src="/sorteo/taller-guitarra.png" alt="" width="240" height="690" loading="lazy" decoding="async">
        <div class="bt2-der">
          <span class="bt2-insig">${t.insignia}</span>
          <span class="bt2-cifra">${t.cifra}<sup>%</sup></span>
          <span class="bt2-dsct">${t.cifraTexto}</span>
          <span class="bt2-cinta">${t.detalle}</span>
        </div>
      </div>`;
}

function bannerSorteoHtml(){
  const vigentes = BANNERS_PORTADA.filter(b => !b.hasta || Date.now() < b.hasta);
  if(!vigentes.length) return '';
  const slides = vigentes.map((b, n) => b.tipo === 'taller' ? bannerTallerSlideHtml() : b.tipo === 'resenas' ? bannerResenasSlideHtml() : `
      <a class="bn-slide" href="${b.href}" aria-label="${b.alt}">
        <picture>
          <source media="(max-width:899px)" srcset="${b.movil}">
          <img src="${b.img}" width="1600" height="560" alt="${b.alt}" ${n ? 'loading="lazy"' : ''} decoding="async">
        </picture>
      </a>`).join('');
  const control = vigentes.length > 1 ? `
      <button type="button" class="bn-flecha bn-prev" aria-label="Banner anterior" data-bn="-1">‹</button>
      <button type="button" class="bn-flecha bn-next" aria-label="Banner siguiente" data-bn="1">›</button>` : '';
  const puntos = vigentes.length > 1 ? `
    <div class="bn-puntos">${vigentes.map((b, n) => `<button type="button" class="bn-punto${n ? '' : ' act'}" aria-label="Ir al banner ${n + 1}" data-bn-ir="${n}"></button>`).join('')}</div>` : '';
  return `
  <div class="banner-carrusel" role="region" aria-roledescription="carrusel" aria-label="Promociones">
    <div class="bn-marco">
      <div class="bn-pista">${slides}</div>${control}
    </div>${puntos}
  </div>`;
}

/* Flechas, puntos y paso automático del carrusel. Va delegado en document porque
   la portada se vuelve a pintar entera y los botones se recrean. El scroll no
   burbujea: se escucha en captura. */
(function(){
  let ultimo = 0;
  const pista = el => el.closest('.banner-carrusel').querySelector('.bn-pista');
  const ir = (c, n) => {
    const p = c.querySelector('.bn-pista'), k = p.children.length;
    n = (n + k) % k;
    p.scrollTo({ left: n * p.clientWidth, behavior: 'smooth' });
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-bn],[data-bn-ir]');
    if(!b) return;
    const c = b.closest('.banner-carrusel'), p = c.querySelector('.bn-pista');
    const actual = Math.round(p.scrollLeft / p.clientWidth);
    ultimo = Date.now();
    ir(c, b.hasAttribute('data-bn') ? actual + Number(b.dataset.bn) : Number(b.dataset.bnIr));
  });
  document.addEventListener('scroll', e => {
    const p = e.target;
    if(!p || !p.classList || !p.classList.contains('bn-pista')) return;
    const n = Math.round(p.scrollLeft / p.clientWidth);
    p.closest('.banner-carrusel').querySelectorAll('.bn-punto').forEach((d, k) => d.classList.toggle('act', k === n));
  }, true);
  ['touchstart','pointerdown','wheel'].forEach(ev => document.addEventListener(ev, e => {
    if(e.target.closest && e.target.closest('.banner-carrusel')) ultimo = Date.now();
  }, { passive:true }));
  const quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!quieto) setInterval(() => {
    const c = document.querySelector('.banner-carrusel');
    if(!c || document.hidden || Date.now() - ultimo < 9000) return;
    const r = c.getBoundingClientRect();
    if(r.bottom < 0 || r.top > innerHeight) return;
    const p = c.querySelector('.bn-pista');
    ir(c, Math.round(p.scrollLeft / p.clientWidth) + 1);
  }, 6000);
})();

function bannerTallerHtml(){
  cargarFuenteTaller();
  return `
  <a class="banner-taller" href="/taller" onclick="goTaller();return false;">
    ${logoTallerSvg()}
    <span class="bt-texto">
      <span class="bt-sobre">Taller de luthería</span>
      <span class="bt-titulo">Repara tu guitarra <em>con nosotros</em></span>
      <span class="bt-sub">${tallerDesde() ? `Desde ${fmt(tallerDesde())} · ` : ''}calibración, cuerdas y mantenimiento · guitarras y bajos</span>
    </span>
    <span class="bt-btn">Ver precios ›</span>
  </a>`;
}

/* En la ficha de una guitarra o un bajo: quien ya tiene uno es quien más
   probablemente necesite calibrarlo. */
const SUBS_TALLER = ['guitarras', 'guitarrasElectricas', 'bajos'];
function avisoTallerHtml(p){
  if(!SUBS_TALLER.includes(p.sub)) return '';
  const cual = p.sub === 'bajos' ? 'Tu bajo' : 'Tu guitarra';
  return `
  <a class="aviso-taller" href="/taller" onclick="goTaller();return false;">
    <span class="at-texto"><b>¿${cual} necesita calibración?</b> Calibración, cuerdas y mantenimiento${tallerDesde() ? ` desde ${fmt(tallerDesde())}` : ''}.</span>
    <span class="at-enlace">Conoce nuestro taller ›</span>
  </a>`;
}

/* La descripción de un servicio (tercer elemento de la fila). Las cartas
   guardadas antes de que existiera no la traen: esas usan la de la carta
   impresa en la misma posición. */
function detalleTaller(f, i){
  if(f.length > 2) return f[2] || '';
  return (TALLER_POR_DEFECTO[0].filas[i] || [])[2] || '';
}

/* i, ii, iii… para numerar los servicios de la carta. */
function numeroRomano(n){
  return ['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii'][n - 1] || String(n);
}

function renderTaller(){
  cargarFuenteTaller();
  /* Las filas son los servicios y las columnas los instrumentos. El nombre y
     la descripción salen de la primera columna (Guitarras). */
  const cols = TALLER_PRECIOS;
  const nFilas = Math.max(...cols.map(c => c.filas.length));
  const base = cols[0].filas;
  const precioHtml = f => !f ? '—' : f[1] ? `S/ ${f[1]}` : 'A tratar';
  /* "A tratar" repetido una vez por columna (Guitarras, Bajos...) se lee
     como si cada instrumento tuviera un trato distinto, cuando en realidad
     es el mismo aviso para todos: si ninguna columna de la fila tiene
     precio fijo, se dice una sola vez, centrado. */
  const todosATratar = i => cols.every(c => c.filas[i] && !c.filas[i][1]);
  const filas = Array.from({length:nFilas}, (_, i) => {
    const f = base[i] || cols.find(c => c.filas[i]).filas[i];
    const detalle = detalleTaller(f, i);
    const precios = todosATratar(i)
      ? `<span class="tl-precio tl-precio-todos">A tratar</span>`
      : cols.map(c => `<span class="tl-precio">${precioHtml(c.filas[i])}</span>`).join('');
    return `
      <div class="tl-fila">
        <span class="tl-num">${numeroRomano(i + 1)}</span>
        <div class="tl-serv"><b>${escapeHtml(f[0])}</b>${detalle ? `<small>${escapeHtml(detalle)}</small>` : ''}</div>
        ${precios}
      </div>`;
  }).join('');
  const wa = waHref('Hola, quiero agendar una reparación en el taller.');
  const [dias, horas] = STORE_HOURS.split(', ');
  return `
  <section class="taller">
    <div class="tl-wrap">
      <header class="tl-top">
        <div class="tl-envio">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>
          <span>Envío a domicilio <em>gratis</em> en Lima</span>
        </div>
        <a class="tl-top-cta" target="_blank" rel="noopener" href="${wa}" onclick="trackAdsConversion('whatsapp')">Agenda tu reparación <span aria-hidden="true">→</span></a>
      </header>

      <div class="tl-hero">
        ${logoTallerSvg()}
        <h1 class="tl-sobre">Reparación de guitarras y bajos en San Juan de Miraflores</h1>
        <p class="tl-titulo">Repara tu guitarra<br><em>con nosotros</em></p>
        <div class="tl-orn" aria-hidden="true"><span></span>✦<span></span></div>
        <div class="tl-hero-der">
          <p>Tu instrumento en manos de quien lo entiende. Calibración, cuerdas y mantenimiento en nuestro taller de San Juan de Miraflores.</p>
          <div class="tl-datos">
            <div><span>Dirección</span>Av. Los Héroes 382<br>San Juan de Miraflores</div>
            <div><span>Horario</span>${escapeHtml(dias)}<br>${escapeHtml(horas || '')}</div>
          </div>
        </div>
      </div>

      <div class="tl-tabla" style="--cols:${cols.length}">
        <div class="tl-cab">
          <span class="tl-rotulo">Servicios · Precios</span>
          ${cols.map(c => `<div class="tl-col"><b>${escapeHtml(c.titulo)}</b>${c.tipos ? `<small>${escapeHtml(c.tipos)}</small>` : ''}</div>`).join('')}
        </div>
        ${filas}
      </div>
      <p class="tl-nota">Precios referenciales en soles. Reparaciones y pintura se cotizan según el estado del instrumento.</p>

      <section class="tl-faq">
        <h2>Preguntas <em>frecuentes</em></h2>
        ${tallerFaq(TALLER_PRECIOS).map(([p, r], i) => `
        <details${i === 0 ? ' open' : ''}>
          <summary>${escapeHtml(p)}</summary>
          <p>${escapeHtml(r)}</p>
        </details>`).join('')}
      </section>

      <div class="tl-cierre">
        ${logoTallerSvg()}
        <h2>Dale a tu instrumento <em>el cuidado que merece</em></h2>
        <a class="tl-btn" target="_blank" rel="noopener" href="${wa}" onclick="trackAdsConversion('whatsapp')">Agenda tu reparación <span aria-hidden="true">→</span></a>
      </div>

      <footer class="tl-pie">
        <span>© Chipao Music · Taller de luthería</span>
        <span>Av. Los Héroes 382, San Juan de Miraflores</span>
      </footer>
    </div>
  </section>`;
}

/* ======================================================================
   POLICY MODALS
   ====================================================================== */
const POLICIES = {
  envios:{title:"Política de envíos", path:"/politica-de-envios",
    desc:"Envío a Lima en menos de 24 horas, a todo el Perú por agencia Shalom en 1 a 3 días útiles y recojo en tienda en 1 hora. Costos desde S/ 10.",
    body:`<p>Enviamos a todo el Perú y también puedes recoger tu pedido en nuestra tienda de San Juan de Miraflores. Esto es lo que debes saber antes de comprar.</p>
<h2>Formas de recibir tu pedido</h2>
<ul><li><b>Recojo en tienda:</b> sin costo. Tu pedido está listo en 1 hora en Av. Los Héroes 382, San Juan de Miraflores. Si lo recoge un motorizado, indícanos sus datos al comprar.</li><li><b>Envío a Lima Metropolitana:</b> lo recibes en menos de 24 horas.</li><li><b>Envío a todo el Perú:</b> tu pedido llega en 1 a 3 días útiles a la agencia Shalom que elijas al comprar, y lo recoges ahí.</li></ul>
<h2>Costos de envío</h2>
<ul><li>Envío a Lima Metropolitana: S/ 10.</li><li>Envío al resto del Perú: S/ 15.</li><li>El recojo en tienda siempre es gratis.</li></ul>
<h2>Seguimiento</h2>
<p>Cuando despachamos tu pedido te avisamos por WhatsApp o por correo. Si necesitas ayuda, escríbenos al +51 921 317 384 con tu código de pedido.</p>
<h2>Si tu pedido llega con algún problema</h2>
<p>Revisa el producto al recibirlo. Si llega dañado o no es lo que pediste, escríbenos el mismo día. Mira también nuestra política de <a href="/cambios-y-devoluciones">cambios y devoluciones</a>.</p>`},
  /* Todas las políticas tienen `path`: no se abren en el modal, se abren como página. Quien
     duda si puede devolver algo lo pregunta en Google antes de comprar, y un
     texto encerrado en un modal no tiene dirección que dar ni que indexar.
     Sus encabezados son <h2> y no <h4> porque van debajo del <h1> de la
     página. El mismo texto lo sirve el Worker: ver PAGINAS_DE_AYUDA en
     src/index.js, y las dos copias tienen que decir lo mismo. */
  cambios:{title:'Cambios y devoluciones', path:'/cambios-y-devoluciones',
    desc:'Tienes 15 días para cambiar o devolver lo que compraste en Chipao Music, con su embalaje y sin señales de uso. Cómo solicitarlo y en cuánto tiempo te devolvemos el dinero.',
    body:`
    <p>Tienes hasta 15 días calendario desde la recepción del producto para solicitar un cambio o devolución, siempre que el producto conserve su embalaje original, accesorios y no presente signos de uso.</p>
    <h2>¿Cómo solicitarlo?</h2>
    <ul><li>Escríbenos indicando tu número de pedido y motivo del cambio.</li><li>Coordinamos la recolección o el envío del producto; el costo del envío de la devolución lo paga el cliente.</li><li>Una vez verificado, procesamos el cambio o la devolución del dinero en un máximo de 10 días hábiles.</li></ul>
    <p>Los instrumentos de viento con boquilla usada y productos personalizados no aplican para devolución por higiene, salvo defecto de fábrica.</p>`},
  /* Con `path`, como la anterior, pero su pantalla no es solo texto: lleva el
     formulario (renderPolitica). El texto de aquí es el que sirve el Worker. */
  reclamaciones:{title:'Libro de reclamaciones', path:'/libro-de-reclamaciones',
    desc:'Libro de reclamaciones virtual de Chipao Music. Registra un reclamo o una queja sobre un producto o servicio y te respondemos en un máximo de 15 días hábiles.',
    body:`
    <p>Conforme al Código de Protección y Defensa del Consumidor, ponemos a tu disposición nuestro Libro de Reclamaciones virtual. Si tienes un reclamo o una queja sobre un producto o servicio, regístralo aquí.</p>
    <p>Te respondemos en un plazo máximo de 15 días hábiles, y recibirás una copia de tu hoja de reclamación en el correo que indiques.</p>`},
  pagos:{title:"Medios de pago", path:"/medios-de-pago",
    desc:"Paga en Chipao Music con Yape, tarjeta Visa o Mastercard, coordinando por WhatsApp o al recoger en tienda. Así validamos tu pago y confirmamos tu pedido.",
    body:`<p>Estos son los medios de pago que aceptamos en la tienda en línea y en nuestro local.</p>
<h2>Formas de pago</h2>
<ul><li><b>Yape:</b> yapeas al número que te mostramos al finalizar la compra, subes la captura del comprobante y la validamos al instante. Tienes 30 minutos para pagar y te llega la confirmación por correo.</li><li><b>Tarjeta de crédito o débito (Visa y Mastercard):</b> pagas en línea en la plataforma segura de Mercado Pago. Chipao Music no guarda los datos de tu tarjeta.</li><li><b>Coordinar el pago por WhatsApp:</b> tu pedido llega armado al chat y un asesor te guía con el pago.</li><li><b>Pago en tienda:</b> si recoges tu pedido, puedes pagar en efectivo o por Yape al recogerlo.</li></ul>
<h2>Cómo validamos tu pago</h2>
<p>Los pagos con Yape se verifican con la captura del comprobante: revisamos el monto, el destinatario y el número de operación. En compras de montos altos podemos revisar el pago manualmente antes de confirmarlo.</p>
<h2>Seguridad</h2>
<p>Nunca te pediremos la clave ni el código de seguridad de tu tarjeta por WhatsApp ni por correo.</p>`},
  garantia:{title:"Garantía de productos", path:"/garantia-de-productos",
    desc:"Todos los instrumentos de Chipao Music tienen 6 meses de garantía contra defectos de fábrica. Qué cubre, qué no cubre y cómo hacerla valer.",
    body:`<p>Todos nuestros instrumentos tienen 6 meses de garantía contra defectos de fábrica, contados desde la fecha de compra.</p>
<h2>Qué cubre</h2>
<ul><li>Defectos de fabricación o de funcionamiento que no se deban al uso.</li><li>Instrumentos: 6 meses.</li></ul>
<h2>Qué no cubre</h2>
<ul><li>Accesorios y consumibles (cuerdas, cañas, baquetas): no tienen garantía por desgaste natural de uso.</li><li>Daños por mal uso, caídas, golpes, humedad o modificaciones hechas por terceros no autorizados.</li></ul>
<h2>Cómo hacer valer tu garantía</h2>
<ul><li>Escríbenos por WhatsApp al +51 921 317 384 con tu número de pedido y una descripción del problema. Si puedes, envía fotos o un video.</li><li>Evaluamos el producto y, si el defecto está cubierto, te ofrecemos su reparación o cambio.</li></ul>
<p>Esta garantía no afecta los derechos que la ley te da como consumidor. Si prefieres, también puedes pedir un cambio o devolución dentro de los 15 días: mira <a href="/cambios-y-devoluciones">Cambios y devoluciones</a>.</p>`},
  terminos:{title:"Términos y condiciones", path:"/terminos-y-condiciones",
    desc:"Términos y condiciones de compra en Chipao Music: precios, stock, pedidos y pagos, cancelaciones, promociones y reclamos.",
    body:`<p>Última actualización: 19 de octubre de 2026.</p>
<p>Al usar esta tienda virtual aceptas estos términos y condiciones. Si no estás de acuerdo con alguno, te pedimos que no realices compras.</p>
<h2>Quiénes somos</h2>
<p>Chipao Music es una tienda de instrumentos musicales con RUC 10772011348, ubicada en Av. Los Héroes 382, San Juan de Miraflores, Lima 15801, Perú. Puedes escribirnos por WhatsApp al +51 921 317 384 o al correo contacto@chipaomusic.com.</p>
<h2>Precios, stock e imágenes</h2>
<ul><li>Los precios están en soles (S/) y pueden cambiar sin previo aviso. Vale el precio que ves al finalizar tu compra.</li><li>La disponibilidad depende del stock. Si un producto no estuviera disponible después de tu compra, te avisamos y coordinamos contigo su cambio o la devolución de tu dinero.</li><li>Las imágenes son referenciales: el color o acabado real puede variar ligeramente.</li></ul>
<h2>Pedidos y pagos</h2>
<p>Tu pedido queda confirmado cuando validamos tu pago. Los medios de pago están en <a href="/medios-de-pago">Medios de pago</a> y las formas de entrega en la <a href="/politica-de-envios">Política de envíos</a>.</p>
<h2>Cancelaciones</h2>
<p>Nos reservamos el derecho de cancelar pedidos ante indicios de fraude o error evidente en el precio publicado. En ese caso te devolvemos el dinero que hayas pagado.</p>
<h2>Cambios, devoluciones y garantía</h2>
<p>Se rigen por nuestras políticas de <a href="/cambios-y-devoluciones">cambios y devoluciones</a> y de <a href="/garantia-de-productos">garantía de productos</a>.</p>
<h2>Promociones y sorteos</h2>
<p>Las promociones y los sorteos tienen sus propias bases, publicadas en la página de cada uno. Por ejemplo, las del sorteo navideño están en <a href="/sorteo">chipaomusic.com/sorteo</a>.</p>
<h2>Reclamos</h2>
<p>Tienes a tu disposición nuestro <a href="/libro-de-reclamaciones">Libro de Reclamaciones</a> virtual.</p>
<h2>Ley aplicable</h2>
<p>Estos términos se rigen por las leyes de la República del Perú, incluido el Código de Protección y Defensa del Consumidor.</p>`},
  privacidad:{title:"Política de privacidad", path:"/politica-de-privacidad",
    desc:"Qué datos personales recopila Chipao Music, para qué los usa, con quién los comparte y cómo puedes acceder a ellos, corregirlos o pedir que los eliminemos.",
    body:`<p>Última actualización: 19 de octubre de 2026.</p>
<p>En Chipao Music (RUC 10772011348) cuidamos tus datos personales conforme a la Ley N.º 29733, Ley de Protección de Datos Personales, y su reglamento.</p>
<h2>Qué datos recopilamos</h2>
<ul><li>Datos de tu pedido: nombre, teléfono, correo electrónico, dirección o agencia de entrega y los productos que compras.</li><li>Comprobante de pago: si pagas con Yape, la captura que subes.</li><li>Los mensajes que nos envías por WhatsApp o por el Libro de Reclamaciones.</li><li>Datos de navegación: las páginas que visitas y datos técnicos de tu dispositivo, mediante cookies y herramientas de analítica.</li></ul>
<h2>Para qué los usamos</h2>
<ul><li>Procesar y entregar tus pedidos, y validar tus pagos.</li><li>Enviarte la confirmación de tu compra y comunicarnos contigo sobre tu pedido.</li><li>Atender tus consultas, garantías, cambios y reclamos.</li><li>Gestionar tu participación en los sorteos y promociones en los que participas al comprar.</li><li>Mejorar la tienda y medir nuestra publicidad.</li><li>Si lo autorizas, enviarte promociones o notificaciones.</li></ul>
<h2>Con quién los compartimos</h2>
<p>No vendemos tus datos. Solo los compartimos con quienes hacen posible el servicio:</p>
<ul><li>Agencias de transporte (por ejemplo Shalom), para entregar tu pedido.</li><li>Mercado Pago, si pagas con tarjeta: el pago se procesa en su plataforma y nosotros no guardamos los datos de tu tarjeta.</li><li>Proveedores tecnológicos: Cloudflare (alojamiento del sitio), Resend (envío de correos) y Google (lectura automática del comprobante de Yape con su servicio de inteligencia artificial Gemini, y analítica y publicidad).</li><li>Microsoft Clarity, para analizar el uso del sitio.</li><li>Las autoridades, cuando la ley lo exija.</li></ul>
<h2>Cookies y analítica</h2>
<p>Usamos cookies, el almacenamiento de tu navegador y herramientas como Google Ads y Microsoft Clarity para recordar tu carrito, entender cómo se usa la tienda y medir anuncios. Puedes bloquear las cookies desde la configuración de tu navegador; algunas funciones de la tienda podrían dejar de funcionar.</p>
<h2>Cuánto tiempo los conservamos</h2>
<p>Mientras sean necesarios para atender tu pedido, tu garantía y nuestras obligaciones legales y tributarias.</p>
<h2>Tus derechos</h2>
<p>Puedes acceder a tus datos, actualizarlos, rectificarlos o pedir que los eliminemos, y oponerte a su uso, escribiéndonos a <a href="mailto:contacto@chipaomusic.com">contacto@chipaomusic.com</a> o por WhatsApp al +51 921 317 384. Si consideras que no atendimos tu solicitud, puedes acudir a la Autoridad Nacional de Protección de Datos Personales.</p>`},
  contacto:{title:"Contáctanos", path:"/contacto",
    desc:"Escríbenos por WhatsApp al +51 921 317 384 o al correo contacto@chipaomusic.com. Tienda en Av. Los Héroes 382, San Juan de Miraflores. Abierto todos los días.",
    body:`<p>Estamos para ayudarte con cualquier consulta sobre nuestros productos, tu pedido o la reparación de tu instrumento.</p>
<h2>Canales de atención</h2>
<ul><li><b>WhatsApp:</b> <a href="https://wa.me/51921317384">+51 921 317 384</a></li><li><b>Correo:</b> <a href="mailto:contacto@chipaomusic.com">contacto@chipaomusic.com</a></li><li><b>Horario de atención:</b> ${STORE_HOURS}</li><li><b>Redes sociales:</b> <a href="https://www.facebook.com/instrumentoschipao/">Facebook</a>, <a href="https://www.instagram.com/instrumentos_chipao/">Instagram</a> y <a href="https://www.tiktok.com/@instrumentosmusicale">TikTok</a></li></ul>
<h2>Nuestra tienda</h2>
${storeLocationHTML(220)}`}
};
function openPolicy(key){
  const p = POLICIES[key];
  /* Las que tienen página no se abren en el modal, ni aunque las llamen por
     aquí: dos sitios con el mismo texto y solo uno con dirección. */
  if(p.path){ goPolicy(key); return; }
  document.getElementById('modalBody').innerHTML = `<h3 class="h-serif">${p.title}</h3>${p.body}`;
  document.getElementById('modalOverlay').classList.add('show');
}

/* Busca la política que vive en esta URL. Devuelve su clave o null. */
function politicaDeRuta(path){
  return Object.keys(POLICIES).find(k => POLICIES[k].path === path) || null;
}

/* Abre la política como pantalla propia: su URL, su título de pestaña y sus
   migas. Es el único destino del sitio que no enseña productos. */
function goPolicy(key, push){
  const p = POLICIES[key];
  if(!p || !p.path){ openPolicy(key); return; }
  document.getElementById('modalOverlay').classList.remove('show');
  state.view = 'politica';
  state.politica = key;
  navigateTo(p.path, push);
  setPageMeta(`${p.title} | Chipao Music`, p.desc);
  setBreadcrumbSchema([{name:'Inicio', path:'/'}, {name:p.title, path:p.path}]);
  render();
  if(push !== false) window.scrollTo({top:0});
}

function renderPolitica(){
  const p = POLICIES[state.politica];
  if(!p || !p.path){ state.view = 'home'; return renderHome(); }
  /* El recuadro de WhatsApp del final: el de cambios habla de pedidos; el resto, de dudas en general. */
  const AYUDA_POLITICA = {
    cambios:{titulo:'¿Tienes un pedido que cambiar?', texto:'Ten a mano tu número de pedido y te decimos en el momento si aplica.', msg:'Hola, quiero solicitar un cambio o devolución de un pedido.'},
  };
  const ay = AYUDA_POLITICA[state.politica] || {titulo:'¿Tienes alguna duda?', texto:'Escríbenos por WhatsApp y te respondemos en el momento.', msg:'Hola, tengo una consulta.'};
  const cuerpo = state.politica === 'reclamaciones' ? `
    <div class="politica-cuerpo">${p.body}</div>
    ${reclamoHtml()}` : `
    <div class="politica-cuerpo">${p.body}</div>
    <div class="politica-ayuda">
      <b>${ay.titulo}</b>
      <p>${ay.texto}</p>
      <a class="btn-app verde" target="_blank" rel="noopener"
         href="${waHref(ay.msg)}"
         onclick="trackAdsConversion('whatsapp')">Escríbenos por WhatsApp</a>
    </div>`;
  return esEscritorio()
    ? `<div class="app-shell politica ped-esc">${cabeceraPedidoEscritorio(p.title, p.title)}${cuerpo}</div>`
    : `<div class="app-shell politica">${cabeceraPedido(p.title, 'goHome()')}${cuerpo}</div>`;
}
/* ------------------- /libro-de-reclamaciones ------------------- */
const PROVEEDOR_RUC = '10772011348';

function reclamoHtml(){
  return `
    <div class="lr-proveedor">
      <b>Proveedor:</b> Chipao Music<br>
      <b>RUC:</b> ${PROVEEDOR_RUC}<br>
      <b>Establecimiento:</b> ${escapeHtml(STORE_ADDRESS)}
    </div>
    <form class="lr-form" id="reclamoForm" onsubmit="enviarReclamo(event)" novalidate>
      <h2>1. Tus datos</h2>
      <label class="campo"><span>Nombre completo</span>
        <input id="lrNombre" type="text" autocomplete="name" maxlength="120" required></label>
      <div class="lr-fila">
        <label class="campo"><span>Documento</span>
          <select id="lrTipoDoc"><option>DNI</option><option>CE</option><option>Pasaporte</option><option>RUC</option></select></label>
        <label class="campo"><span>Número</span>
          <input id="lrDoc" type="text" inputmode="numeric" maxlength="12" required></label>
      </div>
      <label class="campo"><span>Domicilio</span>
        <input id="lrDomicilio" type="text" autocomplete="street-address" maxlength="160" required placeholder="Calle, número, distrito"></label>
      <label class="campo"><span>Teléfono</span>
        <input id="lrTelefono" type="tel" inputmode="numeric" autocomplete="tel" maxlength="9" required placeholder="Ej. 987654321"></label>
      <label class="campo"><span>Correo (ahí te llega la copia)</span>
        <input id="lrEmail" type="email" inputmode="email" autocomplete="email" maxlength="120" required placeholder="Ej. maria@gmail.com"></label>

      <h2>2. Lo que compraste</h2>
      <div class="lr-opciones">
        <label class="lr-op activo" data-grupo="bien"><input type="radio" name="lrBien" value="Producto" checked onchange="marcarOpcion(this)"><b>Producto</b><span>Un instrumento o accesorio</span></label>
        <label class="lr-op" data-grupo="bien"><input type="radio" name="lrBien" value="Servicio" onchange="marcarOpcion(this)"><b>Servicio</b><span>Taller, envío, atención</span></label>
      </div>
      <label class="campo"><span>Monto reclamado (S/) · opcional</span>
        <input id="lrMonto" type="text" inputmode="decimal" maxlength="9" placeholder="Ej. 85"></label>
      <label class="campo"><span>Descripción · número de pedido si lo tienes</span>
        <textarea id="lrBienDesc" rows="2" maxlength="300" required placeholder="Ej. Guitarra acústica, pedido CH-1234"></textarea></label>

      <h2>3. Tu reclamo o queja
        <small>Reclamo: disconformidad con un producto o servicio. Queja: malestar por la atención recibida.</small></h2>
      <div class="lr-opciones">
        <label class="lr-op activo" data-grupo="tipo"><input type="radio" name="lrTipo" value="Reclamo" checked onchange="marcarOpcion(this)"><b>Reclamo</b><span>Del producto o servicio</span></label>
        <label class="lr-op" data-grupo="tipo"><input type="radio" name="lrTipo" value="Queja" onchange="marcarOpcion(this)"><b>Queja</b><span>De la atención</span></label>
      </div>
      <label class="campo"><span>Detalle de lo ocurrido</span>
        <textarea id="lrDetalle" rows="4" maxlength="1500" required placeholder="Cuéntanos qué pasó, cuándo y con quién hablaste"></textarea></label>
      <label class="campo"><span>Qué solicitas</span>
        <textarea id="lrPedido" rows="3" maxlength="800" required placeholder="Ej. Que me cambien el producto o me devuelvan el dinero"></textarea></label>

      <label class="lr-check"><input type="checkbox" id="lrAcepto">
        <span>Declaro que la información es verdadera. Acepto que el proveedor use mis datos solo para atender este reclamo.</span></label>
      <p class="lr-aviso">La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI. El proveedor responde en un máximo de 15 días hábiles, prorrogables por otros 15 según el caso.</p>
      <p class="lr-aviso" id="lrError" style="color:#b3261e;display:none;"></p>
      <input id="lrWeb" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:0;">
      <button type="submit" class="btn-app terracota">Enviar reclamo</button>
    </form>`;
}

function marcarOpcion(radio){
  document.querySelectorAll(`.lr-op[data-grupo="${radio.parentNode.dataset.grupo}"]`)
    .forEach(l => l.classList.toggle('activo', l.firstElementChild.checked));
}

function enviarReclamo(ev){
  ev.preventDefault();
  const v = id => document.getElementById(id).value.trim();
  const err = document.getElementById('lrError');
  const falta = ['lrNombre','lrDoc','lrDomicilio','lrTelefono','lrEmail','lrBienDesc','lrDetalle','lrPedido'].some(id => !v(id));
  let msg = '';
  if(falta) msg = 'Completa todos los campos marcados con texto.';
  else if(!/^[0-9]{9}$/.test(v('lrTelefono'))) msg = 'El teléfono son nueve dígitos, como 987654321.';
  else if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('lrEmail'))) msg = 'Revisa el correo: parece incompleto.';
  else if(!document.getElementById('lrAcepto').checked) msg = 'Marca la declaración para poder enviar.';
  err.textContent = msg;
  err.style.display = msg ? 'block' : 'none';
  if(msg) return;
  const boton = document.querySelector('#reclamoForm button[type=submit]');
  boton.disabled = true; boton.textContent = 'Enviando…';
  const falla = txt => {
    err.textContent = txt; err.style.display = 'block';
    boton.disabled = false; boton.textContent = 'Enviar reclamo';
  };
  fetch('/api/reclamo', {
    method:'POST', headers:{'content-type':'application/json'},
    body: JSON.stringify({
      nombre:v('lrNombre'), tipo_doc:v('lrTipoDoc'), doc:v('lrDoc'), domicilio:v('lrDomicilio'),
      telefono:v('lrTelefono'), email:v('lrEmail'),
      bien:document.querySelector('input[name=lrBien]:checked').value, monto:v('lrMonto'),
      bien_desc:v('lrBienDesc'),
      tipo:document.querySelector('input[name=lrTipo]:checked').value,
      detalle:v('lrDetalle'), pedido:v('lrPedido'), web:v('lrWeb'),
    }),
  }).then(r => r.json().then(d => ({ok:r.ok, d})))
    .then(({ok, d}) => {
      if(!ok) return falla(d.error || 'No se pudo enviar. Escríbenos por WhatsApp.');
      const correo = v('lrEmail');
      document.getElementById('reclamoForm').outerHTML = `
        <div class="lr-gracias">
          <b>Recibimos tu reclamo · ${escapeHtml(d.numero)}</b>
          <p>Te enviamos una copia a ${escapeHtml(correo)}. Te responderemos en un máximo de 15 días hábiles.</p>
        </div>`;
      window.scrollTo({top:0});
    })
    .catch(() => falla('No se pudo enviar. Revisa tu conexión o escríbenos por WhatsApp.'));
}

function closeModal(){
  const wasProduct = !!pdState.productId;
  document.getElementById('modalOverlay').classList.remove('show');
  if(wasProduct){
    pdState = { productId: null, activeIndex: 0, qty: 1 };
    navigateTo(currentViewPath());
    applyCurrentViewMeta();
  }
}

/* ======================================================================
   ADMIN PANEL (stock y precios) — protección básica solo para uso casual.
   Al ser una página estática, cualquiera que revise el código fuente
   podía ver la contraseña antes — ahora ya no: la contraseña se revisa
   en tu Worker (del lado del servidor), nunca queda escrita aquí.
   La cambias directo en Cloudflare → tu Worker → Settings → Variables
   and Secrets → ADMIN_SECRET (la misma clave que ya usas para guardar
   cambios de productos).

   ACCESO: no hay ningún botón visible en la página. Entras escribiendo
   una URL secreta — cambia ADMIN_URL_KEY por una palabra que solo tú
   conozcas, y guarda esta dirección en tus favoritos:
     https://tu-sitio.com/?panel=TU_PALABRA_SECRETA
   ====================================================================== */
const ADMIN_URL_KEY = 'michaparritasuperpoderosa'; // ⚠️ cámbiala por tu propia palabra secreta

/* Clave real del panel: vive solo en memoria mientras tienes la pestaña
   abierta, nunca se guarda en el archivo ni en el navegador. Se pierde
   al recargar la página (a propósito). */
let sessionAdminSecret = null;

function checkAdminUrlTrigger(){
  const params = new URLSearchParams(window.location.search);
  if(params.get('panel') !== ADMIN_URL_KEY) return;
  abrirPanel();
}

/* El panel es una pantalla más, no un modal encima de la tienda: la lista
   necesita el alto entero y quien entra aquí viene a trabajar un rato, no a
   mirar una cosa y cerrar. */
function abrirPanel(){
  state.view = sessionAdminSecret ? 'admin' : 'adminLogin';
  render();
  if(!sessionAdminSecret) setTimeout(()=>document.getElementById('adminPass')?.focus(), 50);
}

/* Salir NO borra la clave de la sesión: volver a entrar por la URL secreta
   mientras la pestaña siga abierta no debería pedirla otra vez. */
function salirDelPanel(){
  goHome();
  /* Y fuera la palabra secreta de la barra de direcciones: se quedaba puesta
     al volver a la tienda, a la vista de quien mire la pantalla. */
  navigateTo('/', false);
}

function renderAdminLoginPage(){
  return `
  <div class="app-shell admin">
    <div class="admin-entrar">
      <h1>Panel de la tienda</h1>
      <p>Tu contraseña se revisa en el servidor: no está escrita en esta página.</p>
      <form class="admin-login" id="adminLoginForm" onsubmit="checkAdminPassword(event)">
        <input type="password" id="adminPass" placeholder="Contraseña" autocomplete="off" required>
        <button type="submit" class="btn-gold" id="adminLoginBtn">Entrar</button>
      </form>
    </div>
  </div>`;
}

async function checkAdminPassword(e){
  e.preventDefault();
  const val = document.getElementById('adminPass').value;
  const btn = document.getElementById('adminLoginBtn');
  const original = btn.textContent;
  btn.textContent = 'Verificando...';
  btn.disabled = true;
  try{
    const res = await fetch(`${PRODUCTS_API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: val })
    });
    const data = await res.json();
    if(data.ok){
      sessionAdminSecret = data.secret;
      state.view = 'admin';
      render();
    }else{
      showToast('Contraseña incorrecta');
      btn.textContent = original;
      btn.disabled = false;
    }
  }catch(err){
    showToast('No se pudo conectar. Intenta de nuevo.');
    btn.textContent = original;
    btn.disabled = false;
  }
}

function subOptionsHtml(catKey, selectedSub){
  const catObj = CATEGORIES.find(c=>c.key===catKey);
  const subs = catObj ? catObj.subs : [];
  if(subs.length){
    return subs.map(s=>`<option value="${s.key}" ${selectedSub===s.key?'selected':''}>${s.label}</option>`).join('');
  }
  // Categorías sin subcategoría (ej. Teclados) usan su propia clave como "sub",
  // igual que los productos existentes — así el <select> nunca queda vacío.
  return catObj ? `<option value="${catObj.key}" selected>${catObj.label}</option>` : '';
}

function adminImageFieldsHtml(idFn, values){
  values = values || [];
  let html = '';
  for(let n=1; n<=MAX_PRODUCT_IMAGES; n++){
    const v = values[n-1] || '';
    html += `
            <div class="media-field">
              <label>Foto ${n} (URL)</label>
              <div class="media-input-row">
                <input type="text" placeholder="https://..." value="${escapeHtml(v)}" id="${idFn(n)}">
                <img class="media-preview" src="${v}" onerror="this.style.display='none'" style="${v?'':'display:none'}">
              </div>
            </div>`;
  }
  return html;
}

function toggleNewProductForm(){
  const el = document.getElementById('new-product-form');
  if(!el) return;
  const show = el.style.display === 'none';
  el.style.display = show ? '' : 'none';
  if(show) document.getElementById('name-new')?.focus();
}

/* "También mostrar en": una casilla por cada categoría distinta de la principal.
   El producto sigue siendo uno solo (una ficha, una URL, un stock); solo
   aparece también en la lista de esas categorías. */
function extraCatsHtml(catKey, marcadas){
  const otras = CATEGORIES.filter(c => c.key !== catKey);
  return `<span>También mostrar en</span>
    <div class="admin-extra-lista">${otras.map(c =>
      `<label><input type="checkbox" value="${c.key}" ${(marcadas||[]).includes(c.key)?'checked':''}> ${c.label}</label>`
    ).join('')}</div>`;
}
function leerExtraCats(id){
  return [...document.querySelectorAll(`#extra-${id} input:checked`)].map(i => i.value);
}

function renderNewProductForm(){
  const firstCat = CATEGORIES[0];
  return `
    <div class="admin-row" id="new-product-form" style="display:none;">
      <div class="admin-row-top">
        <div class="aname">
          <input type="text" placeholder="Nombre del producto nuevo" id="name-new" class="aname-input">
        </div>
      </div>
      <div class="admin-fields">
        <label class="admin-campo-cat">Categoría
          <select id="cat-new" onchange="onAdminCatChange('new')">
            ${CATEGORIES.map(c=>`<option value="${c.key}">${c.label}</option>`).join('')}
          </select>
        </label>
        <label class="admin-campo-cat">Subcategoría
          <select id="sub-new">
            ${subOptionsHtml(firstCat.key, '')}
          </select>
        </label>
        <label>Precio<input type="number" min="0" step="1" value="0" id="price-new"></label>
        <label>Antes (oferta)<input type="number" min="0" step="1" placeholder="—" id="old-new"></label>
        <label>Etiqueta<input type="text" placeholder="—" id="badge-new" style="width:110px;"></label>
        <label>Stock<input type="number" min="0" value="0" id="stock-new"></label>
        <label class="admin-check">
          <input type="checkbox" id="featured-new">
          Marcarlo como más vendida
        </label>
        <div class="admin-extra" id="extra-new">${extraCatsHtml(firstCat.key, [])}</div>
      </div>
      <div class="media-editor open">
        <div class="media-field">
          <label>Descripción</label>
          <textarea placeholder="Descripción del producto..." id="desc-new" rows="4"></textarea>
        </div>
        ${adminImageFieldsHtml(n=>`img${n}-new`)}
        <div class="media-field">
          <label>Video (URL de YouTube o link directo .mp4)</label>
          <input type="text" placeholder="https://..." id="vid-new" style="width:100%;">
        </div>
      </div>
      <button class="btn-gold" style="width:100%;margin-top:10px;" onclick="createProduct(this)">Crear producto</button>
    </div>`;
}

let adminSearchQuery = '';

/* El interruptor de "Más vendida". Es el mismo campo `featured` que ya
   existía como casilla "Destacado" perdida entre los números, y que además de
   pintar la chapa negra en las tarjetas decide qué producto encabeza la
   portada y qué foto representa a su categoría. Aquí se dice por su nombre y
   se ve encendido o apagado de un golpe. */
function chipMasVendidaHtml(p){
  const puesta = Boolean(p.featured);
  return `<button type="button" class="chip-vendida${puesta ? ' puesta' : ''}" id="vendida-${p.id}"
    aria-pressed="${puesta ? 'true' : 'false'}" onclick="toggleMasVendida(${p.id}, this)"
    ><span class="estrella">${puesta ? '★' : '☆'}</span>Más vendida</button>`;
}

/* El aviso "(colores disponibles)" en el nombre. Antes había que escribirlo
   a mano dentro del nombre -así quedaron Melódica California, Pandereta
   Media Luna...-, con el riesgo de escribirlo distinto cada vez o dejarlo
   pegado sin espacio. El punto de color automático (ver coloresDeProducto)
   solo sale si las fotos están subidas con el color en el nombre del
   archivo; este chip es para cuando eso no alcanza -antes de tener las
   fotos de cada color, o si el producto no las va a tener nunca- y de
   todas formas hay que avisarle al cliente. */
const SUFIJO_COLORES = ' (colores disponibles)';
const RE_SUFIJO_COLORES = /\s*\((colores disponibles|varios colores)\)\s*$/i;
function tieneSufijoColores(nombre){
  return RE_SUFIJO_COLORES.test(nombre || '');
}
function sinSufijoColores(nombre){
  return (nombre || '').replace(RE_SUFIJO_COLORES, '').trimEnd();
}
function chipColoresHtml(p){
  const puesto = tieneSufijoColores(p.name);
  return `<button type="button" class="chip-vendida${puesto ? ' puesta' : ''}" id="colores-${p.id}"
    aria-pressed="${puesto ? 'true' : 'false'}" onclick="toggleColoresNombre(${p.id}, this)"
    >Colores</button>`;
}

/* Escribe o quita el aviso y guarda el nombre al toque, como "Más vendida":
   es un sí o un no, no algo para dejar a medias en el cuadro de texto hasta
   acordarse de tocar "Guardar cambios". */
async function toggleColoresNombre(id, btn){
  const p = productoPorId(id);
  if(!p) return;
  const input = document.getElementById('name-' + id);
  const puesto = !tieneSufijoColores(p.name);
  const base = sinSufijoColores(p.name);
  const nombre = puesto ? base + SUFIJO_COLORES : base;
  btn.disabled = true;
  try{
    await guardarProducto(p, { name: nombre });
    p.name = nombre;
    if(input) input.value = nombre;
    btn.classList.toggle('puesta', puesto);
    btn.setAttribute('aria-pressed', puesto ? 'true' : 'false');
    pintarListaAdmin();
    showToast(puesto ? 'Se agregó el aviso de colores al nombre' : 'Se quitó el aviso de colores del nombre');
  }catch(err){
    showToast('No se pudo guardar. Revisa tu clave de administrador.');
  }finally{
    btn.disabled = false;
  }
}

/* La lista es de filas compactas de solo lectura: foto, nombre, dónde está,
   precio y stock. Se edita en el panel de al lado (adminEditorHtml), que es
   uno solo para todo el catálogo en vez de un formulario por producto. */
let adminEditId = null;
let adminEditTab = 'datos';

function etiquetaCatAdmin(p){
  const cat = CATEGORIES.find(c => c.key === p.cat);
  const sub = cat && (cat.subs || []).find(s => s.key === p.sub);
  return [cat && cat.label, sub && sub.label].filter(Boolean).join(' · ');
}

function adminRowHtml(p){
  const foto = (p.images || [])[0];
  const sinStock = (p.stock || 0) <= 0;
  return `
    <button type="button" class="admin-fila${sinStock ? ' zero' : ''}${adminEditId === p.id ? ' activa' : ''}"
      data-fila="${p.id}" onclick="abrirEditorAdmin(${p.id})">
      ${foto
        ? `<img class="admin-thumb" src="${fotoUrl(foto, ANCHO_MINIATURA)}" alt="" loading="lazy" decoding="async">`
        : `<span class="admin-thumb vacia">${iconSvg(iconFor(p))}</span>`}
      <span class="af-texto">
        <span class="af-nombre">${escapeHtml(p.name)}</span>
        <span class="af-donde">${escapeHtml(etiquetaCatAdmin(p))}</span>
      </span>
      <span class="af-datos">
        <b>${fmt(p.price)}</b>
        <i class="${sinStock ? 'alerta' : ''}">${sinStock ? 'sin stock' : p.stock + ' en stock'}</i>
      </span>
      <span class="af-marcas">
        ${p.featured ? '<em class="af-marca vendida">Más vendida</em>' : ''}
        ${enOferta(p) ? `<em class="af-marca oferta">-${pctDescuento(p)}%</em>` : ''}
      </span>
      <span class="af-flecha" aria-hidden="true">›</span>
    </button>`;
}

/* El editor lleva los MISMOS ids que tenía cada fila (name-ID, price-ID...),
   porque saveProduct, onAdminCatChange y los interruptores leen el DOM por
   id. Las tres pestañas se pintan siempre y solo se esconden con CSS: si se
   pintara una sola, Guardar cambios no encontraría los campos de las otras. */
function adminEditorHtml(p){
  const t = adminEditTab;
  const pestana = (k, texto) => `<button type="button" class="ae-tab${t === k ? ' activa' : ''}" data-aetab="${k}" onclick="cambiarTabEditor('${k}')">${texto}</button>`;
  const foto = (p.images || [])[0];
  return `
    <div class="admin-row admin-editor" data-row="${p.id}">
      <div class="ae-cabeza">
        ${foto
          ? `<img class="admin-thumb" src="${fotoUrl(foto, ANCHO_MINIATURA)}" alt="">`
          : `<span class="admin-thumb vacia">${iconSvg(iconFor(p))}</span>`}
        <div class="aname">
          <input type="text" value="${escapeHtml(p.name)}" id="name-${p.id}" class="aname-input" aria-label="Nombre del producto">
          <div class="admin-linea-meta">${escapeHtml(etiquetaCatAdmin(p))}</div>
        </div>
        <button type="button" class="ae-cerrar" onclick="cerrarEditorAdmin()" aria-label="Cerrar">×</button>
      </div>
      <div class="ae-tabs">
        ${pestana('datos', 'Datos')}${pestana('fotos', 'Fotos y video')}${pestana('desc', 'Descripción')}
      </div>

      <div class="ae-panel${t === 'datos' ? ' abierto' : ''}" data-aepanel="datos">
        <div class="admin-chips">
          ${chipMasVendidaHtml(p)}
          ${chipColoresHtml(p)}
        </div>
        <div class="admin-fields">
          <label class="admin-campo-cat">Categoría
            <select id="cat-${p.id}" onchange="onAdminCatChange(${p.id})">
              ${CATEGORIES.map(c=>`<option value="${c.key}" ${p.cat===c.key?'selected':''}>${c.label}</option>`).join('')}
            </select>
          </label>
          <label class="admin-campo-cat">Subcategoría
            <select id="sub-${p.id}">
              ${subOptionsHtml(p.cat, p.sub)}
            </select>
          </label>
          <label>Precio<input type="number" min="0" step="1" value="${p.price}" id="price-${p.id}"></label>
          <label>Antes (oferta)<input type="number" min="0" step="1" placeholder="—" value="${p.old ?? ''}" id="old-${p.id}"></label>
          <label>Etiqueta<input type="text" placeholder="—" value="${escapeHtml(p.badge ?? '')}" id="badge-${p.id}"></label>
          <label>Stock<input type="number" min="0" value="${p.stock}" id="stock-${p.id}"></label>
          <div class="admin-extra" id="extra-${p.id}">${extraCatsHtml(p.cat, p.extraCats)}</div>
        </div>
      </div>

      <div class="ae-panel${t === 'fotos' ? ' abierto' : ''}" data-aepanel="fotos">
        <div class="ae-campos">
          ${adminImageFieldsHtml(n=>`img${n}-${p.id}`, p.images)}
          <div class="media-field">
            <label>Video (URL de YouTube o link directo .mp4)</label>
            <input type="text" placeholder="https://..." value="${p.video||''}" id="vid-${p.id}" style="width:100%;">
          </div>
        </div>
      </div>

      <div class="ae-panel${t === 'desc' ? ' abierto' : ''}" data-aepanel="desc">
        <div class="media-field">
          <label>Descripción</label>
          <textarea placeholder="Descripción del producto..." id="desc-${p.id}" rows="10">${escapeHtml(p.description||'')}</textarea>
        </div>
      </div>

      <div class="ae-pie">
        <button type="button" class="ae-eliminar" onclick="deleteProduct(${p.id}, this)">Eliminar producto</button>
        <button class="btn-gold admin-guardar" onclick="saveProduct(${p.id}, this)">Guardar cambios</button>
      </div>
    </div>`;
}

/* Repintar solo la lista: pintar la pantalla entera le quitaría el scroll y
   lo que estés escribiendo en el editor. */
function pintarListaAdmin(){
  const caja = document.getElementById('admin-list');
  if(caja) caja.innerHTML = renderAdminListHtml();
  pintarResumenAdmin();
}

function abrirEditorAdmin(id){
  adminEditId = id;
  adminEditTab = 'datos';
  pintarEditorAdmin();
}
function cerrarEditorAdmin(){
  adminEditId = null;
  pintarEditorAdmin();
}
function pintarEditorAdmin(){
  const p = productoPorId(adminEditId);
  const caja = document.getElementById('admin-editor');
  const split = document.getElementById('admin-split');
  if(!caja || !split) return;
  caja.innerHTML = p ? adminEditorHtml(p) : '';
  split.classList.toggle('editando', Boolean(p));
  document.getElementById('admin-list').innerHTML = renderAdminListHtml();
  if(p){
    const fila = document.querySelector(`.admin-fila[data-fila="${p.id}"]`);
    if(fila && window.innerWidth >= 1100) fila.scrollIntoView({block:'nearest'});
    if(window.innerWidth < 1100) window.scrollTo({top:0});
  }
}
function cambiarTabEditor(k){
  adminEditTab = k;
  document.querySelectorAll('.ae-tab').forEach(b => b.classList.toggle('activa', b.dataset.aetab === k));
  document.querySelectorAll('.ae-panel').forEach(d => d.classList.toggle('abierto', d.dataset.aepanel === k));
}

let adminCatFiltro = '';
function filteredAdminProducts(){
  const q = adminSearchQuery.trim().toLowerCase();
  return adminCatalogo().filter(p =>
    (!q || p.name.toLowerCase().includes(q)) &&
    (!adminCatFiltro || p.cat === adminCatFiltro) &&
    (adminPestana !== 'ofertas' || enOferta(p)));
}

function renderAdminListHtml(){
  const list = filteredAdminProducts();
  if(!list.length){
    return adminPestana === 'ofertas' && !adminSearchQuery && !adminCatFiltro
      ? '<p class="admin-vacio">No hay productos en oferta ahora mismo.</p>'
      : `<p class="admin-vacio">Ningún producto coincide con la búsqueda.</p>`;
  }
  return list.map(adminRowHtml).join('');
}

function onAdminCatFiltro(val){
  adminCatFiltro = val;
  document.getElementById('admin-list').innerHTML = renderAdminListHtml();
}

function onAdminSearchInput(val){
  adminSearchQuery = val;
  document.getElementById('admin-list').innerHTML = renderAdminListHtml();
}

/* El panel se reparte en secciones, con un menú a la izquierda (en el
   teléfono pasa a una tira de botones arriba). Productos y Ofertas comparten
   lista; Tienda y apariencia lleva los temas; Taller, sus precios. */
let adminPestana = 'productos';
/* ¿Qué tienda se edita? Las dos comparten panel y formulario; cambia solo
   qué productos se listan y a cuál va el producto nuevo. */
let adminTienda = 'chipao';
function adminCatalogo(){ return adminTienda === 'tendencia' ? productosTendencia() : PRODUCTS; }
function cambiarTiendaAdmin(t){
  adminTienda = t;
  adminPestana = 'productos';
  adminEditId = null;
  adminSearchQuery = '';
  adminCatFiltro = '';
  render();
  window.scrollTo({top:0});
}
function selectorTiendaAdminHtml(){
  const b = (k, t) => `<button type="button" class="admin-tienda-btn${adminTienda === k ? ' activa' : ''}" aria-pressed="${adminTienda === k}" onclick="cambiarTiendaAdmin('${k}')">${t}</button>`;
  return `<div class="admin-tiendas" role="group" aria-label="Tienda que editas">${b('chipao', 'Chipao Music')}${b('tendencia', 'Chipao Tendencia')}</div>`;
}
function cambiarPestanaAdmin(p){
  adminPestana = p;
  adminEditId = null;
  render();
  window.scrollTo({top:0});
}
const SECCIONES_ADMIN = [
  ['productos', 'Productos'],
  ['ofertas', 'Ofertas'],
  ['tienda', 'Tienda y apariencia'],
  ['taller', 'Taller'],
];
function menuAdminHtml(){
  /* Tendencia no tiene ofertas, temas ni taller propios: solo productos. */
  const secciones = adminTienda === 'tendencia' ? SECCIONES_ADMIN.slice(0, 1) : SECCIONES_ADMIN;
  return `<nav class="admin-menu" aria-label="Secciones del panel">${secciones.map(([k, t]) =>
    `<button type="button" class="admin-menu-item${adminPestana === k ? ' activa' : ''}" onclick="cambiarPestanaAdmin('${k}')">${t}</button>`
  ).join('')}</nav>`;
}
/* El marco común de todas las secciones: cabecera, menú y contenido. */
function adminMarcoHtml(titulo, cuerpo, conResumen){
  const sinStock = adminCatalogo().filter(x => (x.stock || 0) <= 0).length;
  const ofertas = adminCatalogo().filter(enOferta).length;
  const vendidas = adminCatalogo().filter(x => x.featured).length;
  return `
  <div class="app-shell admin${adminTienda === 'tendencia' ? ' admin-tendencia' : ''}">
    <header class="admin-head">
      <div class="admin-head-fila">
        <div class="admin-head-texto">
          <span class="admin-eyebrow">Panel de la tienda</span>
          <h1>${titulo}</h1>
        </div>
        ${selectorTiendaAdminHtml()}
        <button type="button" class="admin-salir" onclick="salirDelPanel()">Salir</button>
      </div>
      ${conResumen ? `<div class="admin-resumen">
        <span class="admin-dato"><b>${adminCatalogo().length}</b> en catálogo</span>
        <span class="admin-dato${sinStock ? ' alerta' : ''}"><b>${sinStock}</b> sin stock</span>
        <span class="admin-dato"><b>${ofertas}</b> en oferta</span>
        <span class="admin-dato"><b>${vendidas}</b> más vendida</span>
      </div>` : ''}
    </header>
    <div class="admin-cuerpo">
      ${menuAdminHtml()}
      <main class="admin-main">${cuerpo}</main>
    </div>
  </div>`;
}

/* Pestaña Taller: una tarjeta por servicio, con su nombre, su descripción y
   un precio por instrumento, igual que la tabla de /taller. Nombre y
   descripción son de la fila entera: se guardan iguales en cada columna.
   Precio vacío quiere decir "a tratar". */
function renderAdminTaller(){
  const cols = TALLER_PRECIOS;
  const nFilas = Math.max(...cols.map(c => c.filas.length));
  const fila = i => cols[0].filas[i] || cols.find(c => c.filas[i]).filas[i];
  const servicios = Array.from({length:nFilas}, (_, i) => `
    <section class="admin-row admin-taller">
      <span class="admin-taller-num">Servicio ${numeroRomano(i + 1)}</span>
      <label class="admin-taller-campo">Nombre
        <textarea class="admin-taller-texto" id="taller-n-${i}" rows="2" maxlength="80">${escapeHtml(fila(i)[0])}</textarea>
      </label>
      <label class="admin-taller-campo">Descripción <i>(la línea pequeña de debajo)</i>
        <textarea class="admin-taller-texto" id="taller-d-${i}" rows="2" maxlength="100">${escapeHtml(detalleTaller(fila(i), i))}</textarea>
      </label>
      <div class="admin-taller-precios">${cols.map((c, ci) => `
        <label class="admin-taller-precio">${escapeHtml(c.titulo)}
          <span>S/ <input type="number" id="taller-p-${ci}-${i}" inputmode="numeric" min="1" step="1"
                 value="${(c.filas[i] || [])[1] ?? ''}" placeholder="a tratar"></span>
        </label>`).join('')}
      </div>
    </section>`).join('');
  return adminMarcoHtml('Precios del taller', `
    <p class="banner-nota">Son los servicios de chipaomusic.com/taller. Puedes cambiar el nombre, la descripción y los precios de cada uno; deja un precio vacío para que diga «a tratar». Al guardar se cambian para todos.</p>

    ${servicios}

    <button type="button" class="btn-app terracota admin-guardar" id="taller-guardar" onclick="guardarPreciosTaller(this)">Guardar cambios del taller</button>
    <p class="banner-nota" style="text-align:center;"><a href="/taller" target="_blank" rel="noopener">Ver la página del taller ›</a></p>
  `, false);
}

/* Igual que el banner: la clave la comprueba el Worker contra la API de
   productos. Desde el servidor local no hay Worker y esto falla. */
async function guardarPreciosTaller(btn){
  /* Espacios de más fuera, incluidos los saltos de línea del cuadro. */
  const limpio = v => v.replace(/\s+/g, ' ').trim();
  const nFilas = Math.max(...TALLER_PRECIOS.map(c => c.filas.length));
  const nombres = [], detalles = [];
  for(let i = 0; i < nFilas; i++){
    const campoNombre = document.getElementById(`taller-n-${i}`);
    nombres.push(limpio(campoNombre.value));
    detalles.push(limpio(document.getElementById(`taller-d-${i}`).value));
    if(!nombres[i]){
      campoNombre.focus();
      showToast('Cada servicio necesita un nombre');
      return;
    }
  }
  const precios = [];
  for(let ci = 0; ci < TALLER_PRECIOS.length; ci++){
    const c = TALLER_PRECIOS[ci];
    const filas = [];
    for(let i = 0; i < nFilas; i++){
      const campo = document.getElementById(`taller-p-${ci}-${i}`);
      const texto = campo.value.trim();
      const precio = texto === '' ? null : Number(texto);
      if(precio !== null && !(Number.isInteger(precio) && precio > 0)){
        campo.focus();
        showToast('Los precios van en soles enteros, sin decimales');
        return;
      }
      filas.push([nombres[i], precio, detalles[i]]);
    }
    precios.push({ titulo: c.titulo, tipos: c.tipos, filas });
  }

  btn.disabled = true;
  btn.textContent = 'Guardando...';
  try{
    const res = await fetch('/api/taller', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': sessionAdminSecret },
      body: JSON.stringify({ precios })
    });
    const data = await res.json();
    if(!res.ok || data.error) throw new Error(data.error || 'Error al guardar');
    TALLER_PRECIOS = data.precios;
    showToast('Cambios del taller guardados');
  }catch(err){
    showToast('No se pudieron guardar los cambios. Revisa tu clave de administrador.');
  }
  btn.disabled = false;
  btn.textContent = 'Guardar cambios del taller';
}

/* El tema activo vive en el atributo data-tema del <body>, que pone el
   Worker antes de la primera pintada (ver rewrite() en src/index.js): no
   hace falta guardarlo aparte en un JS, alcanza con leerlo de ahí. En el
   servidor local no hay Worker que lo ponga, así que cae a 'normal'. */
function temaActivo(){
  return document.body.dataset.tema || 'normal';
}
function temaBotonHtml(clave, etiqueta){
  const puesto = temaActivo() === clave;
  return `<button class="btn-outline tema-btn${puesto ? ' puesto' : ''}" data-tema-btn="${clave}"
    ${puesto ? 'disabled' : ''} onclick="toggleTema('${clave}', this)">${etiqueta}</button>`;
}

function renderAdminPanel(){
  if(adminPestana === 'taller') return renderAdminTaller();

  if(adminPestana === 'tienda'){
    return adminMarcoHtml('Tienda y apariencia', `
    <div class="admin-warn">Base de datos en vivo: cada cambio que hagas aquí se aplica al instante para todos tus visitantes, sin recargar nada ni tocar código.</div>
    <h2 class="admin-sec-titulo">Tema de la tienda</h2>
    <div class="admin-actions tema-actions">
      ${temaBotonHtml('normal', 'Normal')}
      ${temaBotonHtml('navidad', '🎄 Navidad')}
      ${temaBotonHtml('halloween', '🎃 Halloween')}
      ${temaBotonHtml('criolla', '🎶 Criolla')}
    </div>
    <p class="banner-nota">Cambia los colores de la franja de arriba, el contador de ofertas y las categorías, para todos los visitantes.</p>
    <h2 class="admin-sec-titulo">Medios de pago</h2>
    <div class="admin-actions">
      <button class="btn-outline banner-btn${PAGO_TARJETA ? ' puesto' : ''}" id="tarjeta-btn" onclick="togglePagoTarjeta(this)">${textoBotonTarjeta()}</button>
    </div>
    <p class="banner-nota">${notaBotonTarjeta()}</p>`, false);
  }

  const enOfertas = adminPestana === 'ofertas';
  const bannerHtml = enOfertas ? `
    <div class="admin-actions">
      <button class="btn-outline banner-btn${BANNER_PROMO ? ' puesto' : ''}" id="banner-btn" onclick="toggleBannerPromo(this)">${BANNER_PROMO ? 'Desactivar' : 'Activar'} banner de promoción</button>
    </div>
    <p class="banner-nota">Es la barra roja con el contador y los tres mayores descuentos, arriba de la portada y del catálogo. Un clic y cambia para todos.</p>` : '';
  const nuevoHtml = enOfertas ? '' : `
    ${renderNewProductForm()}`;
  const enTendencia = adminTienda === 'tendencia';
  return adminMarcoHtml(enOfertas ? 'Ofertas' : enTendencia ? 'Chipao Tendencia' : 'Tus productos', `
    <div class="admin-warn">Base de datos en vivo: cada cambio que guardes aquí se aplica al instante para todos tus visitantes, sin recargar nada ni tocar código.</div>
    ${enTendencia ? '<p class="banner-nota">Estos productos solo salen en <a href="/tendencia" target="_blank" rel="noopener">chipaomusic.com/tendencia</a>, que no está enlazada desde la tienda. Usan el mismo carrito, envío por Shalom (gratis desde S/ 100) y pago con Yape.</p>' : ''}
    ${bannerHtml}
    <div class="admin-barra">
      <input type="text" id="admin-search" placeholder="Buscar producto por nombre..." value="${escapeHtml(adminSearchQuery)}" oninput="onAdminSearchInput(this.value)">
      <select id="admin-cat-filtro" onchange="onAdminCatFiltro(this.value)" aria-label="Filtrar por categoría">
        <option value="">Todas las categorías</option>
        ${CATEGORIES.map(c => `<option value="${c.key}" ${adminCatFiltro === c.key ? 'selected' : ''}>${c.label}</option>`).join('')}
      </select>
      ${enOfertas ? '' : '<button type="button" class="admin-nuevo" onclick="toggleNewProductForm()">+ Nuevo</button>'}
    </div>
    ${nuevoHtml}
    <div class="admin-split${adminEditId ? ' editando' : ''}" id="admin-split">
      <div class="admin-list" id="admin-list">${renderAdminListHtml()}</div>
      <aside class="admin-editor-caja" id="admin-editor">${(() => { const p = productoPorId(adminEditId); return p ? adminEditorHtml(p) : ''; })()}</aside>
    </div>`, true);
}

/* Guarda un producto con uno o varios campos cambiados, sin pasar por el
   formulario. El cuerpo va completo porque la API de productos reemplaza la
   fila entera; lo que no se toca viaja tal como está en PRODUCTS. */
async function guardarProducto(p, cambios){
  const fotos = [];
  for(let i = 0; i < MAX_PRODUCT_IMAGES; i++) fotos.push((p.images || [])[i] || null);
  const cuerpo = {
    name: p.name, cat: p.cat, sub: p.sub,
    price: p.price, old: p.old ?? null, badge: p.badge ?? null,
    stock: p.stock, featured: Boolean(p.featured),
    description: p.description ?? null, video: p.video || null,
    ...imagesToBody(fotos),
    ...cambios
  };
  const res = await fetch(`${PRODUCTS_API_URL}/products/${p.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': sessionAdminSecret },
    body: JSON.stringify(cuerpo)
  });
  const data = await res.json();
  if(!res.ok || data.error) throw new Error(data.error || 'Error al guardar');
  return data;
}

/* Pone y quita la chapa "Más vendida". Escribe en el momento, como el
   interruptor del banner: no tiene sentido pedir "Guardar cambios" para algo
   que es un sí o un no. */
async function toggleMasVendida(id, btn){
  const p = productoPorId(id);
  if(!p) return;
  const puesta = !p.featured;
  btn.disabled = true;
  try{
    await guardarProducto(p, { featured: puesta });
    p.featured = puesta;
    btn.classList.toggle('puesta', puesta);
    btn.setAttribute('aria-pressed', puesta ? 'true' : 'false');
    const estrella = btn.querySelector('.estrella');
    if(estrella) estrella.textContent = puesta ? '★' : '☆';
    pintarListaAdmin();
    showToast(puesta ? 'Ahora sale como más vendida' : 'Ya no sale como más vendida');
  }catch(err){
    showToast('No se pudo guardar. Revisa tu clave de administrador.');
  }finally{
    btn.disabled = false;
  }
}

/* El contador de arriba, al vuelo: repintar la pantalla entera perdería el
   scroll y lo que estuvieras escribiendo en otra fila. */
function pintarResumenAdmin(){
  const caja = document.querySelector('.admin-resumen');
  if(!caja) return;
  const sinStock = adminCatalogo().filter(x => (x.stock || 0) <= 0).length;
  const ofertas = adminCatalogo().filter(enOferta).length;
  const vendidas = adminCatalogo().filter(x => x.featured).length;
  caja.innerHTML = `
    <span class="admin-dato"><b>${adminCatalogo().length}</b> en catálogo</span>
    <span class="admin-dato${sinStock ? ' alerta' : ''}"><b>${sinStock}</b> sin stock</span>
    <span class="admin-dato"><b>${ofertas}</b> en oferta</span>
    <span class="admin-dato"><b>${vendidas}</b> más vendida</span>`;
}

/* Un clic enciende o apaga la barra roja para todos los visitantes. No hay
   formulario ni confirmacion a proposito: es un interruptor, y equivocarse
   cuesta otro clic.

   Quien autoriza el cambio es la API de productos, no el navegador: aqui solo
   viaja la clave que ya se uso para entrar al panel. Desde el servidor local
   (localhost:8788) no hay Worker que atienda /api/banner-promo y esto falla:
   el interruptor solo funciona en el sitio de verdad. */
async function toggleBannerPromo(btn){
  const nuevo = !BANNER_PROMO;
  btn.textContent = nuevo ? 'Activando...' : 'Desactivando...';
  btn.disabled = true;
  try{
    const res = await fetch('/api/banner-promo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': sessionAdminSecret },
      body: JSON.stringify({ activo: nuevo })
    });
    const data = await res.json();
    if(!res.ok || data.error) throw new Error(data.error || 'Error al guardar');
    BANNER_PROMO = Boolean(data.activo);
    pintarBotonBanner(btn);
    renderBandaOferta();
    showToast(BANNER_PROMO ? 'Banner de promoción activado' : 'Banner de promoción desactivado');
  }catch(err){
    btn.textContent = 'Error, reintentar';
    btn.disabled = false;
    showToast('No se pudo cambiar el banner. Revisa tu clave de administrador.');
    setTimeout(()=>pintarBotonBanner(btn), 1600);
  }
}

/* El interruptor del pago con tarjeta, igual que el del banner. Solo
   funciona en el sitio de verdad: en localhost no hay Worker. */
function textoBotonTarjeta(){
  return PAGO_TARJETA ? 'Desactivar pago con tarjeta' : 'Activar pago con tarjeta';
}
function notaBotonTarjeta(){
  return PAGO_TARJETA
    ? 'Ahora SÍ sale "Tarjeta de crédito o débito" (Mercado Pago) en el pago de Chipao Music.'
    : 'Ahora NO sale "Tarjeta de crédito o débito" (Mercado Pago) en el pago de Chipao Music. Un clic y vuelve a salir para todos.';
}
async function togglePagoTarjeta(btn){
  const nuevo = !PAGO_TARJETA;
  btn.textContent = nuevo ? 'Activando...' : 'Desactivando...';
  btn.disabled = true;
  try{
    const res = await fetch('/api/pago-tarjeta', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': sessionAdminSecret },
      body: JSON.stringify({ activo: nuevo })
    });
    const data = await res.json();
    if(!res.ok || data.error) throw new Error(data.error || 'Error al guardar');
    PAGO_TARJETA = Boolean(data.activo);
    showToast(PAGO_TARJETA ? 'Pago con tarjeta activado' : 'Pago con tarjeta desactivado');
  }catch(err){
    showToast('No se pudo cambiar el pago con tarjeta. Revisa tu clave de administrador.');
  }
  btn.textContent = textoBotonTarjeta();
  btn.classList.toggle('puesto', PAGO_TARJETA);
  btn.disabled = false;
  const nota = btn.parentElement && btn.parentElement.nextElementSibling;
  if(nota) nota.textContent = notaBotonTarjeta();
}

function pintarBotonBanner(btn){
  btn = btn || document.getElementById('banner-btn');
  if(!btn) return;
  btn.textContent = (BANNER_PROMO ? 'Desactivar' : 'Activar') + ' banner de promoción';
  btn.classList.toggle('puesto', BANNER_PROMO);
  btn.disabled = false;
}

/* Mismo patrón que el banner: sin formulario, un clic y cambia para todos.
   El propio <body> cambia de tema al toque, sin esperar la respuesta del
   servidor -es solo un atributo, no hay nada que perder si falla-, y si la
   escritura falla de verdad se vuelve al tema anterior. Igual que el
   banner, /api/tema no existe en el servidor local: el cambio se ve pero no
   se guarda hasta que corre en el sitio real. */
async function toggleTema(nuevo, btn){
  const anterior = temaActivo();
  if(nuevo === anterior) return;
  const fila = btn.closest('.tema-actions');
  fila.querySelectorAll('.tema-btn').forEach(b => b.disabled = true);
  document.body.dataset.tema = nuevo;
  try{
    const res = await fetch('/api/tema', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': sessionAdminSecret },
      body: JSON.stringify({ tema: nuevo })
    });
    const data = await res.json();
    if(!res.ok || data.error) throw new Error(data.error || 'Error al guardar');
    document.body.dataset.tema = data.tema;
    showToast('Tema de la tienda: ' + ROTULO_TEMA[data.tema]);
  }catch(err){
    document.body.dataset.tema = anterior;
    showToast('No se pudo cambiar el tema. Revisa tu clave de administrador.');
  }
  fila.querySelectorAll('.tema-btn').forEach(b => {
    const clave = b.dataset.temaBtn;
    const puesto = clave === temaActivo();
    b.classList.toggle('puesto', puesto);
    b.disabled = puesto;
  });
}
const ROTULO_TEMA = { normal: 'Normal', navidad: 'Navidad 🎄', halloween: 'Halloween 🎃', criolla: 'Criolla 🎶' };

function onAdminCatChange(id){
  const catKey = document.getElementById(`cat-${id}`).value;
  document.getElementById(`sub-${id}`).innerHTML = subOptionsHtml(catKey, '');
  document.getElementById(`extra-${id}`).innerHTML = extraCatsHtml(catKey, leerExtraCats(id));
}
function toggleMediaEditor(id){
  document.getElementById(`media-editor-${id}`)?.classList.toggle('open');
}
function toggleDescEditor(id){
  document.getElementById(`desc-editor-${id}`)?.classList.toggle('open');
}

async function saveProduct(id, btnEl){
  const p = productoPorId(id);
  if(!p) return;

  const name = document.getElementById(`name-${id}`).value.trim();
  if(!name){ showToast('El nombre no puede quedar vacío'); return; }
  const cat = document.getElementById(`cat-${id}`).value;
  const sub = document.getElementById(`sub-${id}`).value;
  const price = Math.max(0, parseFloat(document.getElementById(`price-${id}`).value) || 0);
  const oldVal = document.getElementById(`old-${id}`).value;
  const old = oldVal === '' ? null : Math.max(0, parseFloat(oldVal) || 0);
  const badgeVal = document.getElementById(`badge-${id}`).value.trim();
  const badge = badgeVal === '' ? null : badgeVal;
  const stock = Math.max(0, parseInt(document.getElementById(`stock-${id}`).value) || 0);
  /* "Más vendida" ya no se guarda aquí: tiene su propio interruptor, que
     escribe al instante. Se manda tal como está para no pisarlo. */
  const featured = Boolean(p.featured);
  const extraCats = leerExtraCats(id);
  const descVal = document.getElementById(`desc-${id}`).value.trim();
  const description = descVal === '' ? null : descVal;
  const imgs = readImageFields(n=>`img${n}-${id}`);
  const video = document.getElementById(`vid-${id}`).value.trim();

  const original = btnEl.textContent;
  btnEl.textContent = 'Guardando...';
  btnEl.disabled = true;

  try{
    const res = await fetch(`${PRODUCTS_API_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': sessionAdminSecret },
      body: JSON.stringify({ name, cat, sub, price, old, badge, stock, featured, extraCats, description, video: video||null, tienda: adminTienda, ...imagesToBody(imgs) })
    });
    const data = await res.json();
    if(!res.ok || data.error) throw new Error(data.error || 'Error al guardar');

    // refleja el cambio al instante, sin recargar toda la tienda
    p.name = name; p.cat = cat; p.sub = sub; p.price = price; p.old = old; p.badge = badge; p.stock = stock; p.featured = featured; p.extraCats = extraCats; p.description = description;
    p.images = imgs.filter(Boolean); p.video = video || null;
    PRICE_MAX = Math.max(...PRODUCTS.map(x=>x.price));
    if(state.priceMax < PRICE_MAX) state.priceMax = PRICE_MAX;

    pintarListaAdmin();
    if(state.view==='shop') render();
    btnEl.textContent = '✓ Guardado';
    showToast('Producto actualizado');
  }catch(err){
    btnEl.textContent = 'Error, reintentar';
    showToast('No se pudo guardar. Revisa tu clave de administrador.');
  }finally{
    setTimeout(()=>{ btnEl.textContent = original; btnEl.disabled = false; }, 1400);
  }
}

function readImageFields(idFn){
  const imgs = [];
  for(let n=1; n<=MAX_PRODUCT_IMAGES; n++){
    imgs.push(document.getElementById(idFn(n)).value.trim());
  }
  return imgs;
}
function imagesToBody(imgs){
  const body = {};
  imgs.forEach((v,i)=>{ body[`image${i+1}`] = v || null; });
  return body;
}

async function createProduct(btnEl){
  const name = document.getElementById('name-new').value.trim();
  if(!name){ showToast('El nombre no puede quedar vacío'); return; }
  const cat = document.getElementById('cat-new').value;
  const sub = document.getElementById('sub-new').value;
  if(!sub){ showToast('Elige una subcategoría'); return; }
  const price = Math.max(0, parseFloat(document.getElementById('price-new').value) || 0);
  const oldVal = document.getElementById('old-new').value;
  const old = oldVal === '' ? null : Math.max(0, parseFloat(oldVal) || 0);
  const badgeVal = document.getElementById('badge-new').value.trim();
  const badge = badgeVal === '' ? null : badgeVal;
  const stock = Math.max(0, parseInt(document.getElementById('stock-new').value) || 0);
  const featured = document.getElementById('featured-new').checked;
  const extraCats = leerExtraCats('new');
  const descVal = document.getElementById('desc-new').value.trim();
  const description = descVal === '' ? null : descVal;
  const imgs = readImageFields(n=>`img${n}-new`);
  const video = document.getElementById('vid-new').value.trim();

  const original = btnEl.textContent;
  btnEl.textContent = 'Creando...';
  btnEl.disabled = true;

  try{
    const res = await fetch(`${PRODUCTS_API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': sessionAdminSecret },
      body: JSON.stringify({ name, cat, sub, price, old, badge, stock, featured, extraCats, description, video: video||null, ...imagesToBody(imgs) })
    });
    const data = await res.json();
    if(!res.ok || data.error) throw new Error(data.error || 'Error al crear');

    separarTiendas([...TODOS, { id: data.id, name, cat, sub, price, old, badge, stock, featured, extraCats, description, images: imgs.filter(Boolean), video: video||null, tienda: adminTienda }]);
    PRICE_MAX = Math.max(...PRODUCTS.map(x=>x.price));
    if(state.priceMax < PRICE_MAX) state.priceMax = PRICE_MAX;
    if(state.view==='shop') render();
    showToast('Producto creado');
    render();
  }catch(err){
    btnEl.textContent = 'Error, reintentar';
    showToast('No se pudo crear. Revisa tu clave de administrador.');
    setTimeout(()=>{ btnEl.textContent = original; btnEl.disabled = false; }, 1400);
  }
}

async function deleteProduct(id, btnEl){
  const p = productoPorId(id);
  if(!p) return;
  if(!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;

  const original = btnEl.textContent;
  btnEl.textContent = 'Eliminando...';
  btnEl.disabled = true;

  try{
    const res = await fetch(`${PRODUCTS_API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Secret': sessionAdminSecret }
    });
    const data = await res.json();
    if(!res.ok || data.error) throw new Error(data.error || 'Error al eliminar');

    separarTiendas(TODOS.filter(x=>x.id!==id));
    if(adminEditId === id) adminEditId = null;
    PRICE_MAX = PRODUCTS.length ? Math.max(...PRODUCTS.map(x=>x.price)) : 3000;
    if(state.priceMax > PRICE_MAX) state.priceMax = PRICE_MAX;
    if(state.view==='shop') render();
    showToast('Producto eliminado');
    render();
  }catch(err){
    btnEl.textContent = 'Error, reintentar';
    showToast('No se pudo eliminar. Revisa tu clave de administrador.');
    setTimeout(()=>{ btnEl.textContent = original; btnEl.disabled = false; }, 1400);
  }
}


/* ======================================================================
   MAIN RENDER
   ====================================================================== */
/* ======================================================================
   ESCRITORIO

   El móvil manda: todo lo de abajo es la misma pantalla reordenada por CSS.
   Solo dos bloques cambian de marcado y por eso se deciden aquí en vez de
   con una @media — la portada, que en escritorio estrena un hero a dos
   columnas con el producto más rebajado, y el mosaico de categorías, que
   mete el texto dentro del bloque de color.
   ====================================================================== */
const ANCHO_ESCRITORIO = 900;
function esEscritorio(){
  return window.matchMedia('(min-width:' + ANCHO_ESCRITORIO + 'px)').matches;
}

/* ---------------- buscador en vivo de la cabecera ----------------
   En el teléfono buscar es una pantalla (/buscar). En escritorio sobra el
   salto: hay sitio para enseñar los resultados colgando del input. La ruta
   /buscar se queda igual para el móvil y para quien llegue por enlace.

   Vive fuera de `state` a propósito: es estado de un widget, no del sitio.
   Nada de lo que hay aquí cambia la URL ni lo que se pinta en #app. */
const NAV_MAX_RESULTADOS = 8;
let navQuery = '';
let navMarcado = -1;   // fila resaltada con las flechas; -1 = ninguna

function navResultados(){
  const q = navQuery.trim();
  return q ? buscarProductos(q) : [];
}

function navFilaHtml(p, i){
  const foto = (p.images || [])[0];
  const stock = p.stock || 0;
  return `
  <a class="nav-res${i===navMarcado?' marcado':''}" data-i="${i}"
     href="${hrefProducto(p)}"
     onclick="abrirDesdeNavBuscar(${p.id});return false;">
    <span class="nav-res-thumb">
      ${foto
        ? `<img src="${fotoUrl(foto, ANCHO_MINIATURA)}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async">`
        : iconSvg(iconFor(p))}
    </span>
    <span class="nav-res-texto">
      <span class="nav-res-nombre">${escapeHtml(p.name)}</span>
      <span class="nav-res-linea">
        <span class="nav-res-precio">${fmt(p.price)}</span>
        <span class="nav-res-stock${stock>0?'':' agotado'}">${stock>0?'En stock':'Agotado'}</span>
      </span>
    </span>
    <span class="nav-res-chevron">›</span>
  </a>`;
}

function navBuscarMenuHtml(){
  const q = navQuery.trim();
  if(!q) return '';
  const todos = navResultados();

  if(!todos.length){
    return `
      <div class="nav-buscar-vacio">
        <div class="nbv-titulo">Nada con “${escapeHtml(q)}”</div>
        <p>Puede que lo tengamos en tienda sin publicar.</p>
        <a target="_blank" rel="noopener"
           href="${waHref('Hola, busco ' + q + '. ¿Lo tienen en tienda?')}"
           onclick="trackAdsConversion('whatsapp')">Preguntar por WhatsApp</a>
      </div>`;
  }

  const vistos = todos.slice(0, NAV_MAX_RESULTADOS);
  const conteo = busquedaAproximada
    ? `Nada exacto · ${todos.length} parecido${todos.length === 1 ? '' : 's'}`
    : todos.length === 1
      ? '1 resultado'
      : `${todos.length} resultados${todos.length > vistos.length ? ` · se enseñan ${vistos.length}` : ''}`;
  /* Cuando quedan fuera, la salida está aquí: antes el desplegable decía
     "se enseñan 5" y no daba forma de ver los otros quince. */
  const verTodos = todos.length > vistos.length
    ? `<button type="button" class="nav-res-todos" onclick="verTodosLosResultados()">Ver los ${todos.length} resultados ›</button>`
    : '';
  return `<div class="nav-res-conteo">${conteo}</div>${vistos.map(navFilaHtml).join('')}${verTodos}`;
}

/* Solo se repinta el desplegable: repintar la cabecera entera le quitaría el
   foco al input y se cortaría la escritura en cada tecla. */
function pintarNavBuscar(){
  const menu = document.getElementById('navBuscarMenu');
  if(menu) menu.innerHTML = navBuscarMenuHtml();
  const limpiar = document.getElementById('navBuscarLimpiar');
  if(limpiar) limpiar.hidden = !navQuery.trim();
}

function onNavBuscar(val){
  navQuery = val;
  navMarcado = -1;
  pintarNavBuscar();
}

function limpiarNavBuscar(){
  navQuery = '';
  navMarcado = -1;
  const input = document.getElementById('navBuscarInput');
  if(input){ input.value = ''; input.focus(); }
  pintarNavBuscar();
}

/* Cerrar de verdad: vacía la consulta para que el desplegable no reaparezca
   solo la próxima vez que algo repinte la cabecera. */
function cerrarNavBuscar(){
  navQuery = '';
  navMarcado = -1;
  const input = document.getElementById('navBuscarInput');
  if(input) input.value = '';
  pintarNavBuscar();
}

/* Pasa lo escrito a la pantalla de búsqueda, que sí los lista todos. */
function verTodosLosResultados(){
  const q = navQuery.trim();
  cerrarNavBuscar();
  state.searchQuery = q;
  state.searchRango = null;
  goSearch();
}

function abrirDesdeNavBuscar(id){
  cerrarNavBuscar();
  openProductDetail(id);
}

/* Flechas para recorrer las filas, Enter para abrir la marcada (o la primera
   si no hay ninguna), Escape para cerrar. */
function onNavBuscarTecla(e){
  const vistos = navResultados().slice(0, NAV_MAX_RESULTADOS);
  if(e.key === 'Escape'){ cerrarNavBuscar(); e.target.blur(); return; }
  /* Enter sin haber marcado ninguna fila: si lo escrito es una sección, a la sección. */
  if(e.key === 'Enter' && navMarcado < 0 && seccionDeBusqueda(navQuery)){
    e.preventDefault();
    const q = navQuery;
    cerrarNavBuscar();
    e.target.blur();
    irASeccionDeBusqueda(q);
    return;
  }
  if(!vistos.length) return;

  if(e.key === 'ArrowDown'){
    e.preventDefault();
    navMarcado = navMarcado + 1 >= vistos.length ? 0 : navMarcado + 1;
    pintarNavBuscar();
    return;
  }
  if(e.key === 'ArrowUp'){
    e.preventDefault();
    navMarcado = navMarcado <= 0 ? vistos.length - 1 : navMarcado - 1;
    pintarNavBuscar();
    return;
  }
  if(e.key === 'Enter'){
    e.preventDefault();
    const elegido = vistos[navMarcado >= 0 ? navMarcado : 0];
    if(elegido) abrirDesdeNavBuscar(elegido.id);
  }
}

/* Un clic fuera del buscador lo cierra. Se registra una sola vez, al cargar,
   y no hace nada mientras no haya nada escrito. */
document.addEventListener('click', e => {
  if(!navQuery.trim()) return;
  if(e.target.closest('.nav-buscar')) return;
  cerrarNavBuscar();
});

/* El pill del carrito se repinta solo, sin pasar por render(): agregar al
   carrito no vuelve a pintar la pantalla (ver updateCartCount) y si no el
   total de la cabecera se quedaría viejo. */
function navCarritoHtml(){
  const unidades = state.cart.reduce((s,c)=>s+c.qty, 0);
  const etiqueta = unidades > 0 ? fmt(cartSubtotal()) : 'Carrito';
  return `${iconSvg('cart')}<span>${etiqueta}</span>${unidades>0?`<span class="nav-badge">${unidades}</span>`:''}`;
}
function pintarNavCarrito(){
  const pill = document.getElementById('navCarrito');
  if(pill) pill.innerHTML = navCarritoHtml();
}

/* Cabecera de escritorio: franja utilitaria (estática, en el HTML), esta
   barra de 78px y la fila de categorías de 48px. En el teléfono la
   navegación va abajo (ver .bottom-nav) y nada de esto se enseña. */
function renderNavEscritorio(){
  const el = document.getElementById('navEscritorio');
  if(!el) return;
  /* En el panel no: ahi la cabecera es la suya, con el resumen y el boton de
     salir, y la barra de la tienda solo roba alto. */
  if(state.view==='admin' || state.view==='adminLogin'){ el.innerHTML = ''; return; }
  /* .nav-esc es display:none por debajo de los 900px (ver CSS): en el
     teléfono esto se tira igual. Antes se armaba entero en cada render() -o
     sea, en cada toque a un color, una cantidad o un filtro- recorriendo el
     catálogo siete veces para las fotos de categoría más el cálculo del
     descuento máximo. Ese trabajo de sobra en el hilo principal es lo que
     Clarity marcaba como INP alto, sobre todo en gama baja: el 70% de las
     visitas son móvil. Se recupera solo con volver a escritorio (render() ya
     se llama al cruzar el punto de quiebre, ver checkBreakpoint). */
  if(!esEscritorio()){ el.innerHTML = ''; return; }
  const enCarrito = ['carrito','checkout','pedido'].includes(state.view);
  if(state.view === 'tendencia' || state.view === 'tendenciaProducto'){ el.innerHTML = ''; return; } // sin cabecera, ver renderCabeceraMovil
  if(modoTendencia()){ el.innerHTML = navTendenciaHtml(enCarrito); return; }
  const fotos = fotosBarraCategorias(new Set());
  const ofertas = PRODUCTS.filter(x => enOferta(x) && (x.stock||0) > 0);
  const maxDto = ofertas.length ? Math.max(...ofertas.map(pctDescuento)) : 0;
  el.innerHTML = `
    <div class="nav-esc-inner">
      <a class="nav-esc-marca" href="/" onclick="cerrarNavBuscar();goHome();return false;">
        <logo-gorro><img src="/img/logo-redondo.webp" alt="Chipao Music" width="44" height="44"></logo-gorro>
        <span>
          <b>Chipao Music</b>
          <i>Instrumentos musicales</i>
        </span>
      </a>

      <div class="nav-buscar">
        <div class="nav-buscar-caja">
          ${iconSvg('search')}
          <input id="navBuscarInput" type="search" autocomplete="off" enterkeyhint="search"
                 aria-label="Buscar instrumentos"
                 placeholder="Busca “ukelele”, “cajón”, “teclado”…"
                 value="${escapeHtml(navQuery)}"
                 oninput="onNavBuscar(this.value)"
                 onkeydown="onNavBuscarTecla(event)">
          <button type="button" class="nav-buscar-limpiar" id="navBuscarLimpiar"
                  ${navQuery.trim()?'':'hidden'} onclick="limpiarNavBuscar()">Limpiar</button>
        </div>
        <div class="nav-buscar-menu" id="navBuscarMenu" role="listbox"
             aria-label="Resultados de búsqueda">${navBuscarMenuHtml()}</div>
      </div>

      <a class="nav-esc-asesor" target="_blank" rel="noopener"
         href="${waHref('Hola, quiero hablar con un asesor.')}"
         onclick="trackAdsConversion('whatsapp')">
        <span class="ico-wa">${iconWhatsapp}</span>Hablar con un asesor</a>

      <a class="nav-esc-carrito${enCarrito?' activo':''}" id="navCarrito"
         href="/carrito" onclick="cerrarNavBuscar();goCart();return false;"
         aria-label="Ver el carrito">${navCarritoHtml()}</a>
    </div>

    <!-- Las pestañas llevan el nombre completo, el mismo del <h1> y del
         <title>. Antes se acortaban ("Cuerda", "Micro y Audio") por miedo a
         que las siete no cupieran en una fila, pero no hacía falta: en la
         pantalla más estrecha en la que sale esta barra (900px) la fila pide
         772px de los 885 que tiene. "Cuerda" a secas es jerga de tienda de
         música y quien no la conoce no sabe qué hay detrás. Si algún día se
         añade una categoría y la fila deja de caber, el sitio para acortar es
         aquí, no el nombre de la categoría, que es lo que lee Google. -->
    <!-- Cada categoría lleva la foto de uno de sus productos y, al pasar el
         ratón, un menú con sus subcategorías. -->
    <nav class="nav-esc-cats${navMenuCerrado ? ' sin-menu' : ''}" aria-label="Categorías"
         onmouseleave="navMenuCerrado=false;this.classList.remove('sin-menu')">
      ${CATEGORIES.map(c => navCategoriaHtml(c, fotos[c.key])).join('')}
      <a class="nav-ofertas${state.view==='shop' && state.offersOnly ? ' activo' : ''}" href="/ofertas"
         onclick="cerrarNavBuscar();cerrarMenuCategorias();goOffers();return false;">Ofertas${maxDto > 0 ? ` −${maxDto}%` : ''}</a>
    </nav>`;
}

/* Cabecera de escritorio de Chipao Tendencia: la misma fila de arriba
   (marca, buscador, asesor y carrito), sin la barra de categorías. */
function navTendenciaHtml(enCarrito){
  return `
    <div class="nav-esc-inner">
      <a class="nav-esc-marca" href="/tendencia" onclick="goTendencia();return false;">
        <logo-gorro><img src="/img/logo-redondo.webp" alt="Chipao Tendencia" width="44" height="44"></logo-gorro>
        <span>
          <b>Chipao Tendencia</b>
          <i>Productos en tendencia</i>
        </span>
      </a>

      ${BUSCADOR_TENDENCIA ? `<div class="nav-buscar">
        <div class="nav-buscar-caja">
          ${iconSvg('search')}
          <input id="tendBuscarInput" type="search" autocomplete="off" enterkeyhint="search"
                 aria-label="Buscar en Chipao Tendencia"
                 placeholder="Busca en Chipao Tendencia…"
                 value="${escapeHtml(tendQuery)}"
                 oninput="onTendBuscar(this.value, this)">
        </div>
      </div>` : '<div class="nav-buscar"></div>'}

      <a class="nav-esc-asesor" target="_blank" rel="noopener"
         href="${waHref(MENSAJE_WA_TENDENCIA)}"
         onclick="trackAdsConversion('whatsapp')">
        <span class="ico-wa">${iconWhatsapp}</span>Hablar con un asesor</a>

      <a class="nav-esc-carrito${enCarrito?' activo':''}" id="navCarrito"
         href="/carrito" onclick="goCart();return false;"
         aria-label="Ver el carrito">${navCarritoHtml()}</a>
    </div>`;
}

/* Al elegir algo del menú la barra se vuelve a pintar con el ratón todavía
   encima, y el menú se quedaría abierto tapando la página nueva. Se apaga
   hasta que el ratón sale de la barra. */
let navMenuCerrado = false;
function cerrarMenuCategorias(){ navMenuCerrado = true; }

function navCategoriaHtml(c, foto){
  const activa = state.view==='shop' && !state.offersOnly && state.activeCat===c.key;
  const subs = subsNavegables(c).slice(0, 8);
  const menu = subs.length ? `
      <div class="nav-cat-menu">
        <div class="ncm-lista">
          <span class="ncm-titulo">${escapeHtml(c.label)}</span>
          ${subs.map(s => `
          <a href="${hrefSubcategoria(c.key, s)}"
             onclick="cerrarNavBuscar();cerrarMenuCategorias();goShop('${c.key}','${s.key}');return false;">${escapeHtml(s.label)}</a>`).join('')}
          <a class="ncm-todo" href="${hrefCategoria(c.key)}"
             onclick="cerrarNavBuscar();cerrarMenuCategorias();goShop('${c.key}');return false;">Ver todo en ${escapeHtml(c.label)} ›</a>
        </div>
        ${foto ? `<span class="ncm-foto"><img src="${foto}" alt="" loading="lazy" decoding="async"></span>` : ''}
      </div>` : '';
  return `
    <div class="nav-cat">
      <a class="nav-cat-link${activa ? ' activo' : ''}" href="${hrefCategoria(c.key)}"
         onclick="cerrarNavBuscar();cerrarMenuCategorias();goShop('${c.key}');return false;">
        <span class="nav-cat-foto">${foto
          ? `<img src="${foto}" alt="" width="32" height="32" decoding="async">`
          : iconSvg(ICON_BY_CAT[c.key] || 'tag')}</span>${escapeHtml(c.label)}</a>
      ${menu}
    </div>`;
}

/* ---------------- banda de oferta ----------------
   Cuenta contra un plazo REAL: ciclos de 24 horas anclados a una fecha fija,
   iguales para todo el que entre. Un reloj que arranca de cero en cada visita
   es publicidad engañosa y en Perú Indecopi lo puede tomar como tal.

   Los números salen del catálogo en cada pintada: si cambian los descuentos,
   la banda se actualiza sola, y si algún día no queda ninguna oferta con
   stock, no se enseña en vez de mentir. */
/* Ciclo de 24 horas anclado a una fecha fija, NO a cuándo abriste la página.
   Es la diferencia entre un plazo real y un engaño: al ir contra un instante
   absoluto, todos los que entran ven el mismo tiempo restante. Si el contador
   arrancara en 24:00:00 para cada visitante, sería un reloj de mentira.

   El ancla es el 1 de enero de 2026 a las 00:00 de Lima (05:00 UTC). Con un
   ciclo de 24 horas eso deja el corte a medianoche de Lima todos los días.
   Mover el ancla mueve la hora del corte. */
const CICLO_HORAS = 24;
const CICLO_ANCLA = Date.UTC(2026, 0, 1, 5, 0, 0);

function segundosHastaFinDeCiclo(){
  const ms = CICLO_HORAS * 3600 * 1000;
  const transcurrido = ((Date.now() - CICLO_ANCLA) % ms + ms) % ms;
  return Math.ceil((ms - transcurrido) / 1000);
}

/* Al cerrarse un ciclo se vuelve a pedir el catálogo: si cambiaste los
   descuentos desde el panel, la banda y la portada se actualizan solas sin
   que nadie recargue. Es una versión ligera de fetchProducts() a propósito:
   la original también revisa la URL y puede navegar a otra pantalla, y eso
   aquí sería un salto inesperado a mitad de la visita. */
let refrescandoOfertas = false;
async function refrescarOfertas(){
  if(refrescandoOfertas) return;
  refrescandoOfertas = true;
  try{
    const res = await fetch(`${PRODUCTS_API_URL}/products`);
    const data = await res.json();
    if(!data.error && Array.isArray(data.products) && data.products.length){
      separarTiendas(data.products);
      PRICE_MAX = Math.max(...PRODUCTS.map(p => p.price));
      if(state.priceMax > PRICE_MAX) state.priceMax = PRICE_MAX;
      render();
    }
  }catch(err){
    /* Sin conexión la banda sigue con lo que ya tenía: mejor un dato viejo
       que una pantalla rota. */
  }
  refrescandoOfertas = false;
}

/* La banda no aparece dentro del flujo de compra: un contador corriendo
   mientras alguien llena sus datos de pago es presión, no información. */
const VISTAS_CON_BANDA = ['home', 'shop'];

let relojBanda = null;

let ultimoRestante = Infinity;

function pintarRelojBanda(){
  const el = document.getElementById('bandaOferta');
  if(!el) return;
  const celdas = el.querySelectorAll('[data-reloj]');
  if(!celdas.length) return;
  const s = segundosHastaFinDeCiclo();

  /* El ciclo se cerró: el restante dejó de bajar y volvió a subir. */
  if(s > ultimoRestante) refrescarOfertas();
  ultimoRestante = s;

  const partes = [
    String(Math.floor(s / 3600)).padStart(2, '0'),
    String(Math.floor(s % 3600 / 60)).padStart(2, '0'),
    String(s % 60).padStart(2, '0'),
  ];
  celdas.forEach((c, i) => { c.textContent = partes[i]; });
}

/* Se crea de cero en cada pintada en vez de vivir fija en el HTML: en el
   teléfono va DENTRO de #app —debajo del buscador— y ahí el innerHTML de
   render() se la llevaría por delante. */
/* Barra delgada oscura con el contador a la izquierda y los tres mayores
   descuentos clicables al centro. Sustituye a la banda de la llama: el
   handoff cambia el banner por producto real dentro de la barra, que es lo
   que se puede tocar. */
function renderBandaOferta(){
  const previa = document.getElementById('bandaOferta');
  if(previa) previa.remove();

  const ofertas = PRODUCTS.filter(x => enOferta(x) && (x.stock||0) > 0);
  if(!BANNER_PROMO || !ofertas.length || !VISTAS_CON_BANDA.includes(state.view)){
    if(relojBanda){ clearInterval(relojBanda); relojBanda = null; }
    return;
  }

  const el = document.createElement('div');
  el.className = 'urgencia';
  el.id = 'bandaOferta';
  const reloj = `
    <span class="urg-reloj" role="timer" aria-live="off">
      <span class="urg-cel" data-reloj>00</span><i>:</i><span class="urg-cel" data-reloj>00</span><i>:</i><span class="urg-cel" data-reloj>00</span>
    </span>`;

  el.innerHTML = esEscritorio() ? `
    <div class="urg-inner">
      <span class="urg-label">Termina en</span>
      ${reloj}
      <span class="urg-divisor"></span>
      <span class="urg-chips-label">Los 3 mayores descuentos:</span>
      <span class="urg-chips">${chipsUrgenciaHtml()}</span>
      <a class="urg-ver" href="/ofertas" onclick="goOffers();return false;">Ver las ${ofertas.length} ofertas ›</a>
    </div>` : `
    <div class="urg-inner">
      <span class="urg-label-movil">La oferta termina en</span>
      ${reloj}
      <a class="urg-ver" href="/ofertas" onclick="goOffers();return false;">Ver ${ofertas.length} ›</a>
    </div>`;

  document.getElementById('app').before(el);
  pintarRelojBanda();
  if(!relojBanda) relojBanda = setInterval(pintarRelojBanda, 1000);
}

/* Cabecera de la portada en el teléfono: franja de beneficio, marca con el
   logo real, buscador y chips de categoría. Al rehacer la portada se quedó
   fuera y el móvil se quedaba sin logo, sin buscador y sin categorías: la
   cabecera de escritorio está oculta por debajo de 900px.

   Solo en la portada. El resto de pantallas traen su propia .app-head con su
   título y su botón de volver. */
function renderCabeceraMovil(){
  const el = document.getElementById('cabeceraMovil');
  if(!el) return;
  /* 21-11-2026: el dueño pidió quitar la franja y la cabecera (logo, nombre,
     WhatsApp y carrito) en las páginas de Chipao Tendencia. El carrito se
     sigue alcanzando con la barra de abajo o con el botón de compra. */
  if(state.view === 'tendencia' || state.view === 'tendenciaProducto'){ el.innerHTML = ''; return; }
  if(esEscritorio() || state.view !== 'home'){ el.innerHTML = ''; return; }

  const unidades = state.cart.reduce((n,c)=>n+c.qty, 0);

  /* Las categorías ya no van aquí como chips: son la cuadrícula con fotos
     de debajo del producto destacado (categoriasPortadaHtml). */
  el.innerHTML = `
  <div class="cab-movil">
    <div class="cab-franja">Envío a todo el Perú · Recojo en 1 hora</div>
    <div class="cab-fila">
      <logo-gorro><img class="cab-logo" src="/img/logo-redondo.webp"
           alt="Chipao Music" width="34" height="34"></logo-gorro>
      <div class="cab-texto">
        <b>Chipao Music</b>
        <i>San Juan de Miraflores · ${estadoTienda()}</i>
      </div>
      <a class="cab-wa" href="${waHref('Hola, tengo una consulta.')}" target="_blank" rel="noopener"
         onclick="trackAdsConversion('whatsapp')" aria-label="Escríbenos por WhatsApp">${iconWhatsapp}</a>
      <a class="cab-carrito" href="/carrito" onclick="goCart();return false;" aria-label="Ver el carrito">
        ${iconSvg('cart')}${unidades > 0 ? `<span class="cab-badge">${unidades}</span>` : ''}
      </a>
    </div>
    <div class="cab-buscar">
      <a class="buscador-falso" href="/buscar" onclick="goSearch();return false;">
        ${iconSvg('search')}
        <span>Busca “cajón”, “ukelele”, “teclado”…</span>
      </a>
    </div>
  </div>`;
}

function cabeceraMovilTendenciaHtml(){
  const unidades = state.cart.reduce((n,c)=>n+c.qty, 0);
  return `
  <div class="cab-movil">
    <div class="cab-franja">Envío gratis por Shalom · Pago con Yape</div>
    <div class="cab-fila">
      <logo-gorro><img class="cab-logo" src="/img/logo-redondo.webp"
           alt="Chipao Tendencia" width="34" height="34"></logo-gorro>
      <div class="cab-texto">
        <b>Chipao Tendencia</b>
        <i>Productos en tendencia</i>
      </div>
      <a class="cab-wa" href="${waHref(MENSAJE_WA_TENDENCIA)}" target="_blank" rel="noopener"
         onclick="trackAdsConversion('whatsapp')" aria-label="Escríbenos por WhatsApp">${iconWhatsapp}</a>
      <a class="cab-carrito" href="/carrito" onclick="goCart();return false;" aria-label="Ver el carrito">
        ${iconSvg('cart')}${unidades > 0 ? `<span class="cab-badge">${unidades}</span>` : ''}
      </a>
    </div>
    ${BUSCADOR_TENDENCIA ? `<div class="cab-buscar">
      <label class="buscador-falso tend-buscar-movil">
        ${iconSvg('search')}
        <input id="tendBuscarMovil" type="search" autocomplete="off" enterkeyhint="search"
               aria-label="Buscar en Chipao Tendencia" placeholder="Busca en Chipao Tendencia…"
               value="${escapeHtml(tendQuery)}" oninput="onTendBuscar(this.value, this)">
      </label>
    </div>` : ''}
  </div>`;
}

/* CTA flotante de WhatsApp. El handoff lo pide fijo y visible siempre; en la
   maqueta aparecía al final del flujo solo porque el prototipo no tiene
   scroll. En el teléfono no va: ahí ya está la barra de compra fija abajo y
   dos elementos flotantes se pisarían. */
function renderWaFlotante(){
  const previo = document.getElementById('waFlotante');
  if(previo) previo.remove();
  if(!esEscritorio()) return;
  if(state.view==='admin' || state.view==='adminLogin') return;
  const a = document.createElement('a');
  a.id = 'waFlotante';
  a.className = 'wa-flotante';
  a.target = '_blank';
  a.rel = 'noopener';
  a.href = waHref(modoTendencia() ? MENSAJE_WA_TENDENCIA : 'Hola, quiero que me ayuden a elegir un instrumento.');
  a.setAttribute('onclick', "trackAdsConversion('whatsapp')");
  a.innerHTML = `<span class="ico-wa">${iconWhatsapp}</span>Te ayudamos a elegir`;
  document.body.appendChild(a);
}

/* Cruzar los 900px cambia el marcado de la portada, así que hay que volver a
   pintar. Solo cuando se cruza de verdad: arrastrar el borde de la ventana
   no debe repintar en cada píxel. */
let eraEscritorio = null;
window.addEventListener('resize', () => {
  const ahora = esEscritorio();
  if(ahora === eraEscritorio) return;
  eraEscritorio = ahora;
  render();
});

function render(){
  apuntarTienda();
  document.getElementById('app').classList.remove('cargando');
  /* La reserva de hueco para la cabecera del teléfono solo vale hasta que el
     JS pinta por primera vez. A partir de aquí él decide si hay cabecera o
     no, y dejarla puesta abría 165px de blanco en cuanto se salía de la
     portada sin recargar: se tocaba la lupa y el buscador aparecía a media
     pantalla. */
  document.documentElement.classList.remove('ruta-portada');
  document.getElementById('app').innerHTML =
      state.view==='home'     ? renderHome()
    : state.view==='search'   ? renderSearch()
    : state.view==='producto' ? renderProductDetail()
    : state.view==='carrito'  ? renderCarrito()
    : state.view==='checkout' ? renderCheckout()
    : state.view==='pedido'   ? renderPedido()
    : state.view==='politica' ? renderPolitica()
    : state.view==='taller'   ? renderTaller()
    : state.view==='tendencia' ? renderTendencia()
    : state.view==='tendenciaProducto' ? renderTendenciaProducto()
    : state.view==='admin'      ? renderAdminPanel()
    : state.view==='adminLogin' ? renderAdminLoginPage()
    : renderShop();
  buildNavLists();
  renderNavEscritorio();
  renderCabeceraMovil();
  renderBandaOferta();
  renderWaFlotante();
  prepararBarraCompra();
  montarVitrina();
  vigilarBarraTendencia();
  /* El alto real de la barra fija de la ficha, para que los recomendados
     puedan dejarle sitio y no queden por debajo. */
  const barraFicha = document.querySelector('.ficha-barra');
  if(barraFicha) document.documentElement.style.setProperty('--ficha-barra-real', barraFicha.offsetHeight + 'px');
  /* Y el de la cabecera de la ficha, que en los Safari sin overflow:clip va
     fija y necesita que el contenido le deje su hueco exacto. */
  const cabFicha = document.querySelector('.ficha-head');
  if(cabFicha) document.documentElement.style.setProperty('--ficha-head-real', cabFicha.offsetHeight + 'px');
  /* La ficha no lleva barra inferior: trae su propia barra fija con el CTA y
     el botón de WhatsApp, y el carrito está en el pill que flota sobre la
     galería. Dos barras apiladas dejarían el CTA a media pantalla. */
  const conBarraFija = state.view==='producto' || state.view==='tendenciaProducto' || state.view==='checkout' || state.view==='pedido'
    || (state.view==='carrito' && state.cart.length > 0);
  /* El panel no es la tienda: las pestañas de abajo, el pie y el botón de
     WhatsApp no pintan nada mientras se edita el catálogo. */
  const enPanel = state.view==='admin' || state.view==='adminLogin';
  document.body.classList.toggle('en-panel', enPanel);
  /* En Chipao Tendencia se esconde lo que lleva a la tienda de Chipao: las
     categorías del pie y el taller, y la franja dice cómo se compra ahí. */
  document.body.classList.toggle('modo-tendencia', modoTendencia());
  if(enPanel) document.getElementById('app').setAttribute('data-clarity-mask', 'true');
  else document.getElementById('app').removeAttribute('data-clarity-mask');
  document.body.classList.toggle('en-taller', state.view==='taller');
  document.getElementById('bottomNav').classList.toggle('oculta', conBarraFija || enPanel);
  /* Y tampoco el pie: la barra fija se le montaría encima. La ficha es una
     pantalla de decisión, termina en el CTA. */
  document.body.classList.toggle('en-ficha', conBarraFija);
  pintarBarraNavegador();
}

/* La barra del navegador toma el color de la franja que esté arriba del
   todo, sin listas de colores a mano: mira qué hay en el primer píxel de la
   pantalla y sube hasta el primer elemento con fondo. Así sigue sola al
   sorteo, a los temas (Navidad, Halloween) y a Tendencia. Solo con la página
   arriba: si se repinta a media página, lo de arriba no es la franja. */
function pintarBarraNavegador(){
  const meta = document.querySelector('meta[name="theme-color"]');
  if(!meta || window.scrollY > 4) return;
  let el = document.elementFromPoint(window.innerWidth / 2, 1);
  while(el){
    const fondo = getComputedStyle(el).backgroundColor;
    if(fondo && fondo !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(fondo)){
      if(meta.getAttribute('content') !== fondo) meta.setAttribute('content', fondo);
      return;
    }
    el = el.parentElement;
  }
}
document.getElementById('app').classList.add('cargando');
document.getElementById('app').innerHTML = `
  <div class="empty-state" style="padding-top:140px;">
    <div style="width:36px;height:36px;border:3px solid var(--navy-line);border-top-color:var(--gold);border-radius:50%;margin:0 auto 16px;animation:spin .8s linear infinite;"></div>
    <p>Cargando productos...</p>
  </div>`;
fetchProducts();
loadGoogleAdsTracking();
loadClarity();
