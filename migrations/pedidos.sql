-- Pedidos pagados con Yape y validados con la captura del comprobante.
-- Se aplica UNA vez sobre la base chipao-productos (la misma que usa el sitio):
--   npx wrangler d1 execute chipao-productos --remote --file=migrations/pedidos.sql
-- Es aditivo: no toca products ni settings.

CREATE TABLE IF NOT EXISTS pedidos (
  id TEXT PRIMARY KEY,                 -- CH-XXXXXX, es lo que ve el cliente en la URL
  estado TEXT NOT NULL,                -- pendiente | revision | pagado | rechazado | expirado
  creado_ms INTEGER NOT NULL,
  expira_ms INTEGER NOT NULL,          -- hasta cuando puede yapear
  total REAL NOT NULL,
  subtotal REAL NOT NULL,
  envio REAL NOT NULL DEFAULT 0,
  provincia REAL NOT NULL DEFAULT 0,
  items TEXT NOT NULL,                 -- JSON: [{id,name,price,qty,color}]
  entrega TEXT NOT NULL,               -- envio | tienda
  agencia TEXT,                        -- JSON [departamento, nombre, direccion] o null
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  direccion TEXT NOT NULL,
  ip TEXT,
  intentos INTEGER NOT NULL DEFAULT 0, -- capturas enviadas
  comprobante TEXT,                    -- clave de la ultima captura en R2
  lectura TEXT,                        -- JSON de lo que leyo la IA
  nota TEXT,                           -- por que quedo en revision o rechazado
  operacion TEXT,
  pagado_ms INTEGER,
  stock_descontado INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS pedidos_estado ON pedidos (estado, creado_ms);
CREATE INDEX IF NOT EXISTS pedidos_ip ON pedidos (ip, creado_ms);

-- Claves que no se pueden repetir: 'op:<nro operacion>|<fecha>' y 'img:<sha256>'.
-- La PRIMARY KEY es la defensa contra reusar un comprobante: el segundo INSERT
-- falla aunque dos capturas lleguen a la vez.
CREATE TABLE IF NOT EXISTS pagos_usados (
  clave TEXT PRIMARY KEY,
  pedido_id TEXT NOT NULL,
  creado_ms INTEGER NOT NULL
);
