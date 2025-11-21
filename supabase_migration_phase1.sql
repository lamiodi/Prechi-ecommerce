-- =============================================
-- TIA DATABASE OPTIMIZATION - PHASE 1
-- SUPABASE MIGRATION SCRIPTS
-- =============================================
-- WARNING: Run these scripts in order and backup your data first!

-- =============================================
-- STEP 1: CREATE BACKUP (Run this first)
-- =============================================
-- This step should be done manually through Supabase dashboard or pg_dump

-- =============================================
-- STEP 2: REMOVE REDUNDANT TABLES
-- =============================================

-- Drop unused tables that are not referenced in application code
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.wishlist CASCADE;
DROP TABLE IF EXISTS public.discounts CASCADE;
DROP TABLE IF EXISTS public.review_votes CASCADE;

-- =============================================
-- STEP 3: REMOVE REDUNDANT COLUMNS
-- =============================================

-- Remove redundant columns from orders table
ALTER TABLE public.orders DROP COLUMN IF EXISTS total_ngn;
ALTER TABLE public.orders DROP COLUMN IF EXISTS base_currency_total;
ALTER TABLE public.orders DROP COLUMN IF EXISTS converted_total;
ALTER TABLE public.orders DROP COLUMN IF EXISTS email_sent;
ALTER TABLE public.orders DROP COLUMN IF EXISTS shipping_method_id;

-- Remove redundant columns from cart_items table
ALTER TABLE public.cart_items DROP COLUMN IF EXISTS product_id;
ALTER TABLE public.cart_items DROP COLUMN IF EXISTS color_name;
ALTER TABLE public.cart_items DROP COLUMN IF EXISTS size_name;

-- Remove redundant columns from order_items table
ALTER TABLE public.order_items DROP COLUMN IF EXISTS product_name;
ALTER TABLE public.order_items DROP COLUMN IF EXISTS image_url;
ALTER TABLE public.order_items DROP COLUMN IF EXISTS color_name;
ALTER TABLE public.order_items DROP COLUMN IF EXISTS size_name;

-- =============================================
-- STEP 4: OPTIMIZE TABLE STRUCTURES
-- =============================================

-- Add missing foreign key constraints
ALTER TABLE public.cart_items 
ADD CONSTRAINT cart_items_variant_id_fkey 
FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);

ALTER TABLE public.cart_items 
ADD CONSTRAINT cart_items_bundle_id_fkey 
FOREIGN KEY (bundle_id) REFERENCES public.bundles(id);

ALTER TABLE public.cart_items 
ADD CONSTRAINT cart_items_size_id_fkey 
FOREIGN KEY (size_id) REFERENCES public.sizes(id);

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON public.cart_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_bundle_id ON public.cart_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_size_id ON public.cart_items(size_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);

-- =============================================
-- STEP 5: ADD SUPABASE-SPECIFIC OPTIMIZATIONS
-- =============================================

-- Add UUID columns for better Supabase compatibility
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();

-- Create indexes on UUID columns
CREATE INDEX IF NOT EXISTS idx_users_uuid ON public.users(uuid);
CREATE INDEX IF NOT EXISTS idx_orders_uuid ON public.orders(uuid);
CREATE INDEX IF NOT EXISTS idx_products_uuid ON public.products(uuid);

-- Add updated_at triggers for real-time sync
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all relevant tables
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_orders_updated_at 
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_products_updated_at 
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_cart_items_updated_at 
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STEP 6: CREATE STRATEGIC INDEXES
-- =============================================

-- Payment processing optimization
CREATE INDEX IF NOT EXISTS idx_orders_reference_payment ON public.orders(reference, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_reference_deleted ON public.orders(reference, deleted_at);

-- Cart performance optimization
CREATE INDEX IF NOT EXISTS idx_cart_user_current ON public.cart(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cart_items_composite ON public.cart_items(cart_id, variant_id, size_id);

-- Product catalog optimization
CREATE INDEX IF NOT EXISTS idx_products_category_deleted ON public.products(category, deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_price_range ON public.products(base_price) WHERE deleted_at IS NULL;

-- User authentication optimization
CREATE INDEX IF NOT EXISTS idx_users_email_active ON public.users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone_active ON public.users(phone_number) WHERE deleted_at IS NULL;

-- Order management optimization
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_status ON public.orders(created_at DESC, status);

-- Stock management optimization
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON public.product_variants(stock_quantity, deleted_at);
CREATE INDEX IF NOT EXISTS idx_variant_sizes_stock ON public.variant_sizes(variant_id, size_id, stock_quantity);

-- =============================================
-- STEP 7: ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on core tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (you can customize these based on your auth setup)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = uuid);

CREATE POLICY "Users can manage own cart" ON public.cart
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (deleted_at IS NULL);

-- =============================================
-- STEP 8: CREATE OPTIMIZED VIEWS
-- =============================================

-- Order summary view for dashboard
CREATE OR REPLACE VIEW order_summary AS
SELECT 
  o.id,
  o.uuid,
  o.reference,
  o.total,
  o.tax,
  o.shipping_cost,
  o.status,
  o.payment_status,
  o.created_at,
  o.updated_at,
  u.email as user_email,
  u.first_name,
  u.last_name,
  COUNT(oi.id) as item_count,
  json_agg(
    json_build_object(
      'id', oi.id,
      'quantity', oi.quantity,
      'price', oi.price,
      'product_name', p.name,
      'variant_sku', pv.sku
    )
  ) as items
FROM public.orders o
JOIN public.users u ON o.user_id = u.id
LEFT JOIN public.order_items oi ON o.id = oi.order_id
LEFT JOIN public.product_variants pv ON oi.variant_id = pv.id
LEFT JOIN public.products p ON pv.product_id = p.id
WHERE o.deleted_at IS NULL
GROUP BY o.id, o.uuid, o.reference, o.total, o.tax, o.shipping_cost, o.status, o.payment_status, o.created_at, o.updated_at, u.email, u.first_name, u.last_name;

-- Product catalog view with stock info
CREATE OR REPLACE VIEW product_catalog AS
SELECT 
  p.id,
  p.uuid,
  p.name,
  p.slug,
  p.base_price,
  p.description,
  p.is_active,
  p.created_at,
  c.name as category_name,
  pi.image_url as primary_image,
  COUNT(pv.id) as variant_count,
  SUM(pv.stock_quantity) as total_stock,
  MIN(pv.price) as min_price,
  MAX(pv.price) as max_price
FROM public.products p
LEFT JOIN public.categories c ON p.category = c.name
LEFT JOIN public.product_images pi ON p.id = pi.product_id AND pi.is_primary = true
LEFT JOIN public.product_variants pv ON p.id = pv.product_id AND pv.deleted_at IS NULL
WHERE p.deleted_at IS NULL AND p.is_active = true
GROUP BY p.id, p.uuid, p.name, p.slug, p.base_price, p.description, p.is_active, p.created_at, c.name, pi.image_url;

-- =============================================
-- STEP 9: ENABLE REAL-TIME SUBSCRIPTIONS
-- =============================================

-- Enable replication for real-time functionality
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.cart REPLICA IDENTITY FULL;
ALTER TABLE public.cart_items REPLICA IDENTITY FULL;

-- Create publication for real-time updates (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'tia_realtime'
    ) THEN
        CREATE PUBLICATION tia_realtime FOR TABLE public.orders, public.cart, public.cart_items;
    END IF;
END $$;

-- =============================================
-- STEP 10: VALIDATION QUERIES
-- =============================================

-- Verify table structures
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'cart', 'cart_items', 'users', 'products')
ORDER BY table_name, ordinal_position;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats 
WHERE tablename IN ('orders', 'cart', 'cart_items', 'users', 'products');

-- Verify foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('orders', 'cart', 'cart_items', 'users', 'products');

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

SELECT 'Phase 1 Migration Completed Successfully!' as status,
       'Next: Test your application thoroughly before proceeding to Phase 2' as next_step;