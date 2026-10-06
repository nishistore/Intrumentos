/* API de productos de Chipao (worker chipao-productos-api).
   Antes vivía solo en Cloudflare; esta copia se bajó de ahí el 2026-10-06 para
   ponerle el límite de intentos a requireAdmin. Se despliega aparte del sitio:
   ver wrangler.jsonc de esta carpeta. */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Secret"
};
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MINUTES = 5;
const IMAGE_FIELDS = ["image1", "image2", "image3", "image4", "image5", "image6", "image7"];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}

const MENSAJE_LIMITE = "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";

/* Comprueba la clave de administrador de las rutas que crean, editan y borran.
   Devuelve null si pasa, o la Response con que hay que contestar si no.

   Comparte contador (tabla login_attempts) y límite con /admin/login: 5 claves
   falsas en 5 minutos por IP, sumando las dos puertas. Antes estas rutas
   aceptaban la clave sin contar nada, así que se podía probar claves sin
   parar aunque /admin/login estuviera limitado.

   Solo cuentan las claves FALSAS: usar el panel con la clave buena no gasta
   intentos. Una petición sin cabecera tampoco, porque no es un intento de
   adivinar nada. Si la IP ya está bloqueada se rechaza también la clave
   buena, igual que hace /admin/login.

   El intento falso se apunta con un solo INSERT condicionado al conteo, no
   con "contar y luego insertar": con dos pasos, cien peticiones en paralelo
   leen todas "0 intentos" antes de que ninguna escriba y se cuelan. Y si la
   base falla, se dice que no: abierto por error sería peor que cerrado. */
async function requireAdmin(request, env) {
  const secret = request.headers.get("X-Admin-Secret");
  if (!secret) return json({ error: "No autorizado" }, 401);
  const ip = request.headers.get("CF-Connecting-IP") || "desconocida";
  const ventana = `-${LOGIN_WINDOW_MINUTES} minutes`;
  try {
    if (await claveCoincide(secret, env.ADMIN_SECRET)) {
      const fila = await env.DB.prepare(
        `SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND created_at >= datetime('now', ?)`
      ).bind(ip, ventana).first();
      if (fila.n >= LOGIN_MAX_ATTEMPTS) return json({ error: MENSAJE_LIMITE }, 429);
      return null;
    }
    if (!await apuntarIntento(env, ip)) return json({ error: MENSAJE_LIMITE }, 429);
    return json({ error: "No autorizado" }, 401);
  } catch {
    return json({ error: "No autorizado" }, 401);
  }
}

/* Apunta un intento de esta IP si todavía le quedan; devuelve false si ya
   gastó los 5 de la ventana. Es UN solo INSERT condicionado al conteo, no
   "contar y luego insertar": con dos pasos, cien peticiones en paralelo leen
   todas "0 intentos" antes de que ninguna escriba y se cuelan. Aprovecha para
   borrar lo de hace más de un día, que no cuenta para nada. */
async function apuntarIntento(env, ip) {
  await env.DB.prepare(`DELETE FROM login_attempts WHERE created_at < datetime('now', '-1 day')`).run();
  const r = await env.DB.prepare(
    `INSERT INTO login_attempts (ip)
     SELECT ?1 WHERE (SELECT COUNT(*) FROM login_attempts WHERE ip = ?1 AND created_at >= datetime('now', ?2)) < ?3`
  ).bind(ip, `-${LOGIN_WINDOW_MINUTES} minutes`, LOGIN_MAX_ATTEMPTS).run();
  return r.meta.changes > 0;
}

/* Compara la clave en tiempo constante. Con "===" el tiempo de respuesta
   depende de cuántas letras iniciales acertó, y eso se puede medir. Se
   comparan los SHA-256 de las dos, que siempre miden lo mismo, y se recorren
   enteros sin salir al primer byte distinto. */
async function claveCoincide(dada, real) {
  if (typeof dada !== "string" || typeof real !== "string" || !dada || !real) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(dada)),
    crypto.subtle.digest("SHA-256", enc.encode(real))
  ]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diferencia = 0;
  for (let i = 0; i < x.length; i++) diferencia |= x[i] ^ y[i];
  return diferencia === 0;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (request.method === "POST" && url.pathname === "/admin/login") {
      const ip = request.headers.get("CF-Connecting-IP") || "desconocida";
      try {
        /* Cada intento se apunta ANTES de mirar la clave, acierte o no; si
           acierta, se borran los de esta IP más abajo. */
        if (!await apuntarIntento(env, ip)) {
          return json({ ok: false, error: MENSAJE_LIMITE }, 429);
        }
        const body = await request.json();
        const ok = await claveCoincide(body.password, env.ADMIN_SECRET);
        if (!ok) return json({ ok: false }, 401);
        await env.DB.prepare(`DELETE FROM login_attempts WHERE ip = ?`).bind(ip).run();
        return json({ ok: true, secret: env.ADMIN_SECRET });
      } catch (err) {
        return json({ ok: false, error: String(err) }, 400);
      }
    }
    if (request.method === "GET" && url.pathname === "/products") {
      try {
        const { results } = await env.DB.prepare("SELECT * FROM products ORDER BY id").all();
        const products = results.map((r) => ({
          id: r.id,
          name: r.name,
          cat: r.cat,
          sub: r.sub,
          price: r.price,
          old: r.old,
          badge: r.badge,
          stock: r.stock,
          featured: !!r.featured,
          description: r.description || null,
          images: IMAGE_FIELDS.map((f) => r[f]).filter(Boolean),
          video: r.video || null
        }));
        return json({ products });
      } catch (err) {
        return json({ error: String(err) }, 500);
      }
    }
    if (request.method === "POST" && url.pathname === "/products") {
      const denegado = await requireAdmin(request, env);
      if (denegado) return denegado;
      try {
        const body = await request.json();
        const name = (body.name || "").trim();
        const cat = (body.cat || "").trim();
        const sub = (body.sub || "").trim();
        const price = Number(body.price);
        if (!name || !cat || !sub || !Number.isFinite(price)) {
          return json({ error: "Faltan campos obligatorios: name, cat, sub, price" }, 400);
        }
        const columns = ["name", "cat", "sub", "price", "old", "badge", "stock", "featured", "description", "video", ...IMAGE_FIELDS];
        const values = [
          name,
          cat,
          sub,
          price,
          body.old ?? null,
          body.badge ?? null,
          Number.isFinite(Number(body.stock)) ? Number(body.stock) : 0,
          body.featured ? 1 : 0,
          body.description ?? null,
          body.video ?? null,
          ...IMAGE_FIELDS.map((f) => body[f] ?? null)
        ];
        const placeholders = columns.map(() => "?").join(", ");
        const { meta } = await env.DB.prepare(
          `INSERT INTO products (${columns.join(", ")}) VALUES (${placeholders})`
        ).bind(...values).run();
        return json({ ok: true, id: meta.last_row_id });
      } catch (err) {
        return json({ error: String(err) }, 500);
      }
    }
    const match = url.pathname.match(/^\/products\/(\d+)$/);
    if (request.method === "PUT" && match) {
      const denegado = await requireAdmin(request, env);
      if (denegado) return denegado;
      try {
        const id = Number(match[1]);
        const body = await request.json();
        const fields = ["name", "cat", "sub", "price", "old", "badge", "stock", "featured", "description", "video", ...IMAGE_FIELDS];
        const updates = [];
        const values = [];
        for (const f of fields) {
          if (f in body) {
            if (f === "featured") {
              updates.push(`${f} = ?`);
              values.push(body[f] ? 1 : 0);
            } else {
              updates.push(`${f} = ?`);
              values.push(body[f]);
            }
          }
        }
        if (!updates.length) return json({ error: "Nada para actualizar" }, 400);
        updates.push("updated_at = datetime('now')");
        values.push(id);
        await env.DB.prepare(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
        return json({ ok: true });
      } catch (err) {
        return json({ error: String(err) }, 500);
      }
    }
    if (request.method === "DELETE" && match) {
      const denegado = await requireAdmin(request, env);
      if (denegado) return denegado;
      try {
        const id = Number(match[1]);
        await env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(id).run();
        return json({ ok: true });
      } catch (err) {
        return json({ error: String(err) }, 500);
      }
    }
    return json({ error: "Ruta no encontrada" }, 404);
  }
};
