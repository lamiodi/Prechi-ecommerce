-- ============================================
-- DATABASE OPTIMIZATION SCRIPTS
-- Quick Win Index Implementation
-- ============================================
-- 
-- DEPLOYMENT INSTRUCTIONS:
-- 1. Run during low-traffic hours (maintenance window)
-- 2. Execute each phase separately
-- 3. Monitor performance after each phase
-- 4. Keep rollback scripts ready
--
-- ESTIMATED DEPLOYMENT TIME: 2-4 hours
-- PERFORMANCE IMPROVEMENT: 60-90% for targeted queries
-- ============================================

-- ============================================
-- PHASE 1: CRITICAL INDEXES (Deploy First)
-- Impact: High - Order verification, user queries, stock validation
-- Time: 30-60 minutes
-- ============================================

-- 1. Order reference index (CRITICAL for payment verification API)
-- Query pattern: SELECT * FROM orders WHERE reference = ?
-- Frequency: Every payment verification (high traffic)
-- Current performance: 300-500ms table scan
-- Expected improvement: 30-50ms index lookup
BEGIN;
CREATE INDEX CONCURRENTLY idx_orders_reference ON orders(reference);
-- ROLLBACK: DROP INDEX IF EXISTS idx_orders_reference;
COMMIT;

-- Verify index creation
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE indexname = 'idx_orders_reference';

-- 2. User order history index (CRITICAL for user dashboard)
-- Query pattern: SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
-- Frequency: Every user login/dashboard view (high traffic)
-- Current performance: 200-400ms table scan
-- Expected improvement: 40-80ms index lookup
BEGIN;
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
-- ROLLBACK: DROP INDEX IF EXISTS idx_orders_user_id;
COMMIT;

-- Verify index creation
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE indexname = 'idx_orders_user_id';

-- 3. Product variant index (CRITICAL for product details)
-- Query pattern: SELECT * FROM product_variants WHERE product_id = ?
-- Frequency: Every product detail view (high traffic)
-- Current performance: 150-300ms table scan
-- Expected improvement: 45-90ms index lookup
BEGIN;
CREATE INDEX CONCURRENTLY idx_product_variants_product_id ON product_variants(product_id);
-- ROLLBACK: DROP INDEX IF EXISTS idx_product_variants_product_id;
COMMIT;

-- Verify index creation
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE indexname = 'idx_product_variants_product_id';

-- 4. Stock validation composite index (CRITICAL for order creation)
-- Query pattern: SELECT stock_quantity FROM variant_sizes WHERE variant_id = ? AND size_id = ?
-- Frequency: Every order item validation (critical path)
-- Current performance: 100-200ms table scan
-- Expected improvement: 10-30ms composite index lookup
BEGIN;
CREATE INDEX CONCURRENTLY idx_variant_sizes_variant_size ON variant_sizes(variant_id, size_id);
-- ROLLBACK: DROP INDEX IF EXISTS idx_variant_sizes_variant_size;
COMMIT;

-- Verify index creation
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE indexname = 'idx_variant_sizes_variant_size';

-- ============================================
-- MONITORING PHASE 1 (Wait 30 minutes)
-- ============================================
-- Check for any performance degradation
-- Monitor these metrics for 30 minutes before proceeding

-- Active query monitoring
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%orders%' OR query LIKE '%products%'
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage monitoring
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE indexname LIKE 'idx_%'
ORDER BY idx_tup_read DESC;

-- ============================================
-- PHASE 2: SUPPORTING INDEXES (Deploy Second)
-- Impact: Medium - Cart operations, order items, images
-- Time: 30-60 minutes
-- ============================================

-- 5. Cart item lookups (supporting cart operations)
-- Query pattern: SELECT * FROM cart_items WHERE cart_id = ?
-- Frequency: Every cart view/update (medium traffic)
-- Expected improvement: 50-70% faster cart operations
BEGIN;
CREATE INDEX CONCURRENTLY idx_cart_items_cart_id ON cart_items(cart_id);
-- ROLLBACK: DROP INDEX IF EXISTS idx_cart_items_cart_id;
COMMIT;

-- 6. Order item retrieval (supporting order details)
-- Query pattern: SELECT * FROM order_items WHERE order_id = ?
-- Frequency: Every order detail view (medium traffic)
-- Expected improvement: 60-80% faster order details
BEGIN;
CREATE INDEX CONCURRENTLY idx_order_items_order_id ON order_items(order_id);
-- ROLLBACK: DROP INDEX IF EXISTS idx_order_items_order_id;
COMMIT;

-- 7. Product image lookups (supporting product display)
-- Query pattern: SELECT * FROM product_images WHERE variant_id = ?
-- Frequency: Every product with images (medium traffic)
-- Expected improvement: 40-60% faster image loading
BEGIN;
CREATE INDEX CONCURRENTLY idx_product_images_variant_id ON product_images(variant_id);
-- ROLLBACK: DROP INDEX IF EXISTS idx_product_images_variant_id;
COMMIT;

-- 8. Bundle item validation (supporting bundle operations)
-- Query pattern: SELECT * FROM bundle_items WHERE bundle_id = ?
-- Frequency: Every bundle validation (low-medium traffic)
-- Expected improvement: 50-70% faster bundle validation
BEGIN;
CREATE INDEX CONCURRENTLY idx_bundle_items_bundle_id ON bundle_items(bundle_id);
-- ROLLBACK: DROP INDEX IF EXISTS idx_bundle_items_bundle_id;
COMMIT;

-- ============================================
-- PHASE 3: OPTIMIZATION INDEXES (Deploy Final)
-- Impact: Low-Medium - Supporting queries, reports
-- Time: 30-45 minutes
-- ============================================

-- 9. User email lookups (supporting user authentication)
-- Query pattern: SELECT * FROM users WHERE email = ?
-- Frequency: Every login (medium traffic)
BEGIN;
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
-- ROLLBACK: DROP INDEX IF EXISTS idx_users_email;
COMMIT;

-- 10. Product category filtering (supporting product browsing)
-- Query pattern: SELECT * FROM products WHERE category = ? AND is_active = true
-- Frequency: Category page views (low-medium traffic)
BEGIN;
CREATE INDEX CONCURRENTLY idx_products_category_active ON products(category, is_active);
-- ROLLBACK: DROP INDEX IF EXISTS idx_products_category_active;
COMMIT;

-- 11. Address user lookups (supporting address validation)
-- Query pattern: SELECT * FROM addresses WHERE user_id = ?
-- Frequency: Address management (low traffic)
BEGIN;
CREATE INDEX CONCURRENTLY idx_addresses_user_id ON addresses(user_id);
-- ROLLBACK: DROP INDEX IF EXISTS idx_addresses_user_id;
COMMIT;

-- 12. Wishlist user lookups (supporting wishlist operations)
-- Query pattern: SELECT * FROM wishlist WHERE user_id = ?
-- Frequency: Wishlist views (low traffic)
BEGIN;
CREATE INDEX CONCURRENTLY idx_wishlist_user_id ON wishlist(user_id);
-- ROLLBACK: DROP INDEX IF EXISTS idx_wishlist_user_id;
COMMIT;

-- ============================================
-- POST-DEPLOYMENT VERIFICATION
-- ============================================

-- Comprehensive index verification
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef,
    tablespace
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Index size analysis
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================
-- ROLLBACK SCRIPT (Emergency Use)
-- ============================================
-- Use this script to quickly remove all new indexes if issues arise
-- 
-- WARNING: This will remove ALL indexes created by this optimization
-- Only use if experiencing performance degradation or other issues

/*
-- Emergency rollback - removes all optimization indexes
DROP INDEX IF EXISTS idx_orders_reference;
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_product_variants_product_id;
DROP INDEX IF EXISTS idx_variant_sizes_variant_size;
DROP INDEX IF EXISTS idx_cart_items_cart_id;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_product_images_variant_id;
DROP INDEX IF EXISTS idx_bundle_items_bundle_id;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_products_category_active;
DROP INDEX IF EXISTS idx_addresses_user_id;
DROP INDEX IF EXISTS idx_wishlist_user_id;

-- Verify rollback
SELECT COUNT(*) as remaining_indexes 
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';
*/

-- ============================================
-- PERFORMANCE MONITORING QUERIES
-- ============================================
-- Run these queries 24-48 hours after deployment to measure improvement

-- Query performance comparison
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query LIKE '%orders%' OR query LIKE '%products%' OR query LIKE '%cart%'
ORDER BY mean_time DESC
LIMIT 20;

-- Index usage statistics (post-deployment)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes 
WHERE indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- Table scan vs index scan ratio
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    CASE 
        WHEN seq_scan + idx_scan > 0 
        THEN 100.0 * idx_scan / (seq_scan + idx_scan) 
        ELSE 0 
    END AS index_usage_ratio
FROM pg_stat_user_tables 
WHERE tablename IN ('orders', 'products', 'product_variants', 'variant_sizes', 'cart_items')
ORDER BY seq_scan DESC;

-- ============================================
-- DEPLOYMENT CHECKLIST
-- ============================================
-- 
-- BEFORE DEPLOYMENT:
-- [ ] Schedule maintenance window (low traffic hours)
-- [ ] Backup database (recommended)
-- [ ] Notify team of deployment window
-- [ ] Prepare rollback script (copy above)
-- [ ] Monitor current performance baselines
--
-- DURING DEPLOYMENT:
-- [ ] Execute Phase 1 indexes (30-60 minutes)
-- [ ] Monitor for 30 minutes between phases
-- [ ] Execute Phase 2 indexes (30-60 minutes)
-- [ ] Monitor for 30 minutes before Phase 3
-- [ ] Execute Phase 3 indexes (30-45 minutes)
--
-- AFTER DEPLOYMENT:
-- [ ] Monitor query performance for 2-4 hours
-- [ ] Verify no increase in error rates
-- [ ] Check index usage statistics after 24 hours
-- [ ] Document performance improvements
-- [ ] Update team on completion
--
-- EMERGENCY PROCEDURES:
-- [ ] If performance degrades: Execute rollback script immediately
-- [ ] If errors increase: Revert to backup or remove indexes
-- [ ] Contact database administrator for complex issues
--
-- SUCCESS CRITERIA:
-- [ ] No performance degradation during deployment
-- [ ] Target queries show 60-90% improvement
-- [ ] Index hit rate >90% for targeted queries
-- [ ] No increase in application error rates