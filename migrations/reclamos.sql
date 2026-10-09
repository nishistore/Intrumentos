-- Libro de reclamaciones virtual (/libro-de-reclamaciones).
-- Se aplica UNA vez sobre la base chipao-productos:
--   npx wrangler d1 execute chipao-productos --remote --file=migrations/reclamos.sql
-- Es aditivo: no toca products, settings ni pedidos.

CREATE TABLE IF NOT EXISTS reclamos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- el correlativo: R-AAAA-000001
  creado_ms INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  tipo_doc TEXT NOT NULL,
  doc TEXT NOT NULL,
  domicilio TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  bien TEXT NOT NULL,                     -- Producto | Servicio
  monto TEXT,
  bien_desc TEXT NOT NULL,
  tipo TEXT NOT NULL,                     -- Reclamo | Queja
  detalle TEXT NOT NULL,
  pedido TEXT NOT NULL,                   -- lo que solicita el consumidor
  ip TEXT
);

CREATE INDEX IF NOT EXISTS reclamos_ip ON reclamos (ip, creado_ms);
