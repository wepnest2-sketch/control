-- SQL Schema for Papillon Store
-- You can run this in the Supabase SQL Editor

-- 1. Wilayas (States/Provinces)
CREATE TABLE IF NOT EXISTS wilayas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  delivery_price_home NUMERIC NOT NULL DEFAULT 0,
  delivery_price_desk NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  discount_price NUMERIC,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size TEXT,
  color_name TEXT,
  color_hex TEXT,
  quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL UNIQUE,
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  wilaya_id UUID REFERENCES wilayas(id) ON DELETE SET NULL,
  municipality_name TEXT,
  address TEXT,
  delivery_type TEXT CHECK (delivery_type IN ('home', 'post')),
  total_price NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  selected_size TEXT,
  selected_color TEXT
);

-- Ensure variant_id exists in order_items (in case table was created before)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='variant_id') THEN
        ALTER TABLE order_items ADD COLUMN variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Stock Management Triggers
CREATE OR REPLACE FUNCTION handle_stock_on_order_item()
RETURNS TRIGGER AS $$
BEGIN
    -- Deduct stock when an order item is created
    IF NEW.variant_id IS NOT NULL THEN
        UPDATE product_variants
        SET quantity = GREATEST(0, quantity - NEW.quantity)
        WHERE id = NEW.variant_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deduct_stock ON order_items;
CREATE TRIGGER trigger_deduct_stock
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE PROCEDURE handle_stock_on_order_item();

CREATE OR REPLACE FUNCTION handle_stock_on_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Restore stock when an order is cancelled
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        UPDATE product_variants pv
        SET quantity = pv.quantity + oi.quantity
        FROM order_items oi
        WHERE oi.order_id = NEW.id
          AND pv.id = oi.variant_id
          AND oi.variant_id IS NOT NULL;
    
    -- Deduct stock when an order is un-cancelled (restored to pending/confirmed)
    ELSIF OLD.status = 'cancelled' AND NEW.status != 'cancelled' THEN
        UPDATE product_variants pv
        SET quantity = GREATEST(0, pv.quantity - oi.quantity)
        FROM order_items oi
        WHERE oi.order_id = NEW.id
          AND pv.id = oi.variant_id
          AND oi.variant_id IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_order_status_stock ON orders;
CREATE TRIGGER trigger_order_status_stock
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE PROCEDURE handle_stock_on_order_status_change();

-- 7. Site Settings
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT NOT NULL DEFAULT 'Papillon Store',
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#ffffff',
  announcement_text TEXT,
  hero_image_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  delivery_company_name TEXT DEFAULT 'Yalidine',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fix existing site_settings table if it has NOT NULL constraints on optional fields
DO $$ 
BEGIN 
    ALTER TABLE site_settings ALTER COLUMN logo_url DROP NOT NULL;
    ALTER TABLE site_settings ALTER COLUMN favicon_url DROP NOT NULL;
    ALTER TABLE site_settings ALTER COLUMN announcement_text DROP NOT NULL;
    ALTER TABLE site_settings ALTER COLUMN hero_image_url DROP NOT NULL;
    ALTER TABLE site_settings ALTER COLUMN hero_title DROP NOT NULL;
    ALTER TABLE site_settings ALTER COLUMN hero_subtitle DROP NOT NULL;
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist yet, which is fine
        NULL;
    WHEN others THEN
        -- Other errors, just log or ignore
        NULL;
END $$;

-- 8. About Us
CREATE TABLE IF NOT EXISTS about_us (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  features JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings if none exist
INSERT INTO site_settings (site_name) 
SELECT 'Papillon Store'
WHERE NOT EXISTS (SELECT 1 FROM site_settings);
