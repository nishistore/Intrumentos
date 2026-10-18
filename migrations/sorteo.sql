-- Sorteo navideño 2026 y ventas por WhatsApp.
-- Se aplica UNA vez, DESPUÉS de pedidos.sql, sobre la base chipao-productos:
--   npx wrangler d1 execute chipao-productos --remote --file=migrations/sorteo.sql
-- Los dos ALTER no se pueden repetir: si ya corrió, da "duplicate column name".

-- Una venta por WhatsApp se guarda como un pedido más (estado pagado), así sale
-- en /pedidos junto a las de la web.
ALTER TABLE pedidos ADD COLUMN canal TEXT NOT NULL DEFAULT 'web';   -- web | whatsapp
ALTER TABLE pedidos ADD COLUMN correo_ms INTEGER;                   -- último correo manual enviado

-- Cada cupón es una fila. El número es lo que ve el cliente (CHIPAO-01001).
-- Un cupón anulado conserva su número para que no se reutilice.
CREATE TABLE IF NOT EXISTS cupones (
  numero INTEGER PRIMARY KEY,
  pedido_id TEXT NOT NULL,
  orden INTEGER NOT NULL,              -- 1 o 2 dentro del pedido
  nombre TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',      -- en minúsculas; vacío si la venta de WhatsApp no tiene
  telefono TEXT NOT NULL,
  creado_ms INTEGER NOT NULL,
  anulado INTEGER NOT NULL DEFAULT 0,
  UNIQUE (pedido_id, orden)
);
CREATE INDEX IF NOT EXISTS cupones_email ON cupones (email);
CREATE INDEX IF NOT EXISTS cupones_telefono ON cupones (telefono);

-- Quién ganó qué. Un cliente (mismo correo O mismo celular) gana un solo premio;
-- descartado = 1 cuando el ganador no apareció en el vivo y se sorteó otro.
CREATE TABLE IF NOT EXISTS ganadores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  premio INTEGER NOT NULL,
  numero INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL,
  sorteado_ms INTEGER NOT NULL,
  descartado INTEGER NOT NULL DEFAULT 0
);
