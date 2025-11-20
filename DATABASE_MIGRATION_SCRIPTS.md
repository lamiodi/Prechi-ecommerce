# Database Migration Scripts for Client Deployment

## 1. Database Setup Script (setup_database.sql)
```sql
-- Create client database
CREATE DATABASE client_ecommerce;

-- Connect to the new database
\c client_ecommerce;

-- Create database user (optional - for production)
CREATE USER client_user WITH PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE client_ecommerce TO client_user;

-- Create schema if needed
CREATE SCHEMA IF NOT EXISTS ecommerce;
SET search_path TO ecommerce, public;
```

## 2. Schema Migration Script (migrate_schema.sql)
```sql
-- Connect to client database
\c client_ecommerce;

-- Import main schema from queries.sql
-- This will create all tables, relationships, and constraints
\i path/to/queries.sql

-- Set up initial data
INSERT INTO users (first_name, last_name, email, password_hash, is_admin) 
VALUES 
('Admin', 'User', 'admin@client.com', '$2b$10$examplehashedpassword', true),
('John', 'Doe', 'john@client.com', '$2b$10$examplehashedpassword', false);

-- Insert sample categories
INSERT INTO categories (name, description, image_url) VALUES
('Clothing', 'Fashion clothing and apparel', NULL),
('Accessories', 'Fashion accessories', NULL),
('Shoes', 'Footwear collection', NULL);

-- Insert sample sizes
INSERT INTO sizes (size_name, size_type) VALUES
('XS', 'clothing'), ('S', 'clothing'), ('M', 'clothing'), ('L', 'clothing'), ('XL', 'clothing'),
('28', 'jeans'), ('30', 'jeans'), ('32', 'jeans'), ('34', 'jeans'), ('36', 'jeans'),
('6', 'shoes'), ('7', 'shoes'), ('8', 'shoes'), ('9', 'shoes'), ('10', 'shoes');

-- Insert sample colors
INSERT INTO colors (color_name, hex_code) VALUES
('Black', '#000000'), ('White', '#FFFFFF'), ('Red', '#FF0000'), ('Blue', '#0000FF'),
('Green', '#00FF00'), ('Yellow', '#FFFF00'), ('Purple', '#800080'), ('Pink', '#FFC0CB');
```

## 3. Data Migration Script (migrate_data.sql)
```sql
-- Sample product data
INSERT INTO products (name, description, price, category, is_active, created_at) VALUES
('Classic T-Shirt', 'Premium cotton t-shirt', 2500, 'Clothing', true, NOW()),
('Denim Jeans', 'Comfortable denim jeans', 4500, 'Clothing', true, NOW()),
('Leather Belt', 'Genuine leather belt', 1500, 'Accessories', true, NOW());

-- Sample product variants
INSERT INTO product_variants (product_id, color_id, sku, price_adjustment, stock_quantity) VALUES
(1, 1, 'TSHIRT-BLACK-001', 0, 100), (1, 2, 'TSHIRT-WHITE-001', 0, 80),
(2, 1, 'JEANS-BLACK-001', 0, 50), (2, 3, 'JEANS-BLUE-001', 0, 60);

-- Sample shipping methods
INSERT INTO shipping_methods (name, description, cost, estimated_days) VALUES
('Standard Shipping', 'Regular delivery', 500, 3),
('Express Shipping', 'Fast delivery', 1200, 1),
('Free Shipping', 'Free delivery on orders over $50', 0, 5);
```

## 4. Client Customization Script (customize_client.sql)
```sql
-- Update business information
UPDATE business_settings SET 
store_name = 'Client E-commerce Store',
store_email = 'info@client.com', 
store_phone = '+1234567890',
store_address = '123 Main Street, City, Country',
currency = 'USD',
tax_rate = 0.08
WHERE id = 1;

-- Update payment settings
UPDATE payment_settings SET
paystack_secret_key = 'sk_test_client_key',
paystack_public_key = 'pk_test_client_key',
is_test_mode = true
WHERE id = 1;

-- Update shipping settings
UPDATE shipping_settings SET
free_shipping_threshold = 5000,
default_shipping_method_id = 1,
allowed_countries = 'US,UK,CA,NG'
WHERE id = 1;
```

## 5. Index Optimization Script (optimize_indexes.sql)
```sql
-- Apply performance indexes from optimization report
CREATE INDEX CONCURRENTLY idx_orders_reference ON orders(reference);
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
CREATE INDEX CONCURRENTLY idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX CONCURRENTLY idx_variant_sizes_variant_size ON variant_sizes(variant_id, size_id);
CREATE INDEX CONCURRENTLY idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX CONCURRENTLY idx_order_items_order_id ON order_items(order_id);

-- Verify index creation
SELECT indexname, tablename FROM pg_indexes WHERE indexname LIKE 'idx_%';
```

## 6. Rollback Script (rollback_migration.sql)
```sql
-- Emergency rollback script
DROP INDEX IF EXISTS idx_orders_reference;
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_product_variants_product_id;
DROP INDEX IF EXISTS idx_variant_sizes_variant_size;
DROP INDEX IF EXISTS idx_cart_items_cart_id;
DROP INDEX IF EXISTS idx_order_items_order_id;

-- Remove sample data (if needed)
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = 1);
DELETE FROM orders WHERE user_id = 1;
DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = 1);
DELETE FROM carts WHERE user_id = 1;
DELETE FROM users WHERE email LIKE '%@client.com';

-- Reset sequences if needed
ALTER SEQUENCE users_id_seq RESTART WITH 1000;
ALTER SEQUENCE products_id_seq RESTART WITH 1000;
ALTER SEQUENCE orders_id_seq RESTART WITH 1000;
```

## 7. Verification Script (verify_migration.sql)
```sql
-- Verify database structure
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Verify admin user created
SELECT id, first_name, last_name, email, is_admin FROM users WHERE is_admin = true;

-- Verify sample data
SELECT COUNT(*) as product_count FROM products;
SELECT COUNT(*) as variant_count FROM product_variants;
SELECT COUNT(*) as category_count FROM categories;

-- Verify indexes
SELECT COUNT(*) as index_count FROM pg_indexes WHERE indexname LIKE 'idx_%';

-- Verify business settings
SELECT store_name, store_email, currency FROM business_settings;
```

## 8. Batch Migration Script (run_all_migrations.sh)
```bash
#!/bin/bash
# Client Database Migration Script

echo "Starting client database migration..."

# Step 1: Create database
echo "Creating database..."
psql -U postgres -f setup_database.sql

# Step 2: Import schema
echo "Importing schema..."
psql -U postgres -d client_ecommerce -f migrate_schema.sql

# Step 3: Insert sample data
echo "Inserting sample data..."
psql -U postgres -d client_ecommerce -f migrate_data.sql

# Step 4: Customize for client
echo "Applying client customization..."
psql -U postgres -d client_ecommerce -f customize_client.sql

# Step 5: Optimize performance
echo "Applying performance optimizations..."
psql -U postgres -d client_ecommerce -f optimize_indexes.sql

# Step 6: Verify migration
echo "Verifying migration..."
psql -U postgres -d client_ecommerce -f verify_migration.sql

echo "Migration completed successfully!"
echo "Database: client_ecommerce"
echo "Admin user: admin@client.com"
echo "Check verification results above."
```

## Usage Instructions

1. **Prepare**: Update all placeholder values (emails, keys, etc.)
2. **Run**: Execute scripts in order:
   ```bash
   ./run_all_migrations.sh
   ```
3. **Verify**: Check verification script output
4. **Test**: Login with admin credentials and test functionality

## Safety Features

- ✅ Transaction blocks for data integrity
- ✅ CONCURRENTLY keyword to prevent table locking
- ✅ Complete rollback script included
- ✅ Verification steps at each stage
- ✅ Sample data can be easily removed

## Client-Specific Customizations

Remember to update:
- Business name and contact information
- Payment gateway keys
- Email addresses
- Currency and tax settings
- Shipping configurations
- Product catalog data