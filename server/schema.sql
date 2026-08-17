-- =========================================================
-- MAHMUD TELECOM ONLINE SHOP
-- FINAL PRODUCTION DATABASE SETUP
-- =========================================================

-- ---------------------------------------------------------
-- 1. PRODUCTS
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    old_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    image TEXT NOT NULL DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 2. ORDERS
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_no TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    area TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    payment TEXT NOT NULL DEFAULT 'Cash on Delivery',
    delivery_zone TEXT NOT NULL,
    delivery_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'New',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 3. ORDER ITEMS
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    quantity INTEGER NOT NULL,
    line_total NUMERIC(12,2) NOT NULL
);

-- ---------------------------------------------------------
-- 4. SHOP SETTINGS
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS shop_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    shop_name TEXT NOT NULL DEFAULT 'মাহমুদ টেলিকম',
    phone TEXT NOT NULL DEFAULT '01846-655270',
    whatsapp TEXT NOT NULL DEFAULT '8801846655270',
    delivery_inside NUMERIC(12,2) NOT NULL DEFAULT 60,
    delivery_outside NUMERIC(12,2) NOT NULL DEFAULT 120,
    cod BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO shop_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;


-- =========================================================
-- VALIDATION
-- =========================================================

ALTER TABLE products
    DROP CONSTRAINT IF EXISTS products_price_check;

ALTER TABLE products
    ADD CONSTRAINT products_price_check
    CHECK (price >= 0 AND old_price >= 0 AND stock >= 0);

ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS orders_amount_check;

ALTER TABLE orders
    ADD CONSTRAINT orders_amount_check
    CHECK (
        delivery_charge >= 0
        AND subtotal >= 0
        AND grand_total >= 0
    );

ALTER TABLE order_items
    DROP CONSTRAINT IF EXISTS order_items_quantity_check;

ALTER TABLE order_items
    ADD CONSTRAINT order_items_quantity_check
    CHECK (
        quantity > 0
        AND price >= 0
        AND line_total >= 0
    );


-- =========================================================
-- ORDER STATUS VALIDATION
-- =========================================================

ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
    ADD CONSTRAINT orders_status_check
    CHECK (
        status IN (
            'New',
            'Confirmed',
            'Processing',
            'Shipped',
            'Delivered',
            'Cancelled'
        )
    );


-- =========================================================
-- PAYMENT VALIDATION
-- =========================================================

ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS orders_payment_check;

ALTER TABLE orders
    ADD CONSTRAINT orders_payment_check
    CHECK (
        payment IN (
            'Cash on Delivery',
            'COD'
        )
    );


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_products_active
ON products(active);

CREATE INDEX IF NOT EXISTS idx_products_category
ON products(category);

CREATE INDEX IF NOT EXISTS idx_products_created_at
ON products(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_phone
ON orders(phone);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
ON order_items(product_id);


-- =========================================================
-- AUTOMATIC updated_at
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS products_updated_at
ON products;

CREATE TRIGGER products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS orders_updated_at
ON orders;

CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;


-- =========================================================
-- PRODUCTS
-- Customer can only see active products
-- =========================================================

DROP POLICY IF EXISTS "Public can view active products"
ON products;

CREATE POLICY "Public can view active products"
ON products
FOR SELECT
TO anon, authenticated
USING (active = TRUE);


-- =========================================================
-- ORDERS
-- Customer can create an order
-- Customer cannot read all orders
-- =========================================================

DROP POLICY IF EXISTS "Public can create orders"
ON orders;

CREATE POLICY "Public can create orders"
ON orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
    customer_name <> ''
    AND phone <> ''
    AND address <> ''
    AND area <> ''
);


-- =========================================================
-- ORDER ITEMS
-- Customer can add items while creating an order
-- =========================================================

DROP POLICY IF EXISTS "Public can create order items"
ON order_items;

CREATE POLICY "Public can create order items"
ON order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (
    quantity > 0
    AND price >= 0
    AND line_total >= 0
);


-- =========================================================
-- SHOP SETTINGS
-- Public can read shop information
-- =========================================================

DROP POLICY IF EXISTS "Public can view shop settings"
ON shop_settings;

CREATE POLICY "Public can view shop settings"
ON shop_settings
FOR SELECT
TO anon, authenticated
USING (id = 1);


-- =========================================================
-- SECURITY: REMOVE PUBLIC WRITE ACCESS
-- =========================================================

REVOKE UPDATE, DELETE
ON products
FROM anon;

REVOKE UPDATE, DELETE
ON orders
FROM anon;

REVOKE UPDATE, DELETE
ON order_items
FROM anon;

REVOKE UPDATE, DELETE
ON shop_settings
FROM anon;


-- =========================================================
-- FINAL
-- =========================================================

SELECT
    'Mahmud Telecom Online Shop database is ready.'
    AS status;
