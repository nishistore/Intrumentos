-- Categorías extra de un producto ("También mostrar en"), separadas por comas.
-- Se aplica a la base D1 chipao-productos ANTES de desplegar la API de productos.
ALTER TABLE products ADD COLUMN extra_cats TEXT;
