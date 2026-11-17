-- Tienda oculta /tendencia: sus productos viven en la misma tabla que los de
-- Chipao (así el carrito, Yape y la validación de pagos funcionan igual),
-- separados por esta columna. Todo lo existente queda como 'chipao'.
ALTER TABLE products ADD COLUMN tienda TEXT NOT NULL DEFAULT 'chipao';
