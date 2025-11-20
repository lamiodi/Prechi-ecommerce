# Database Optimization Quick Deployment Guide

## 🚀 Quick Start (30 minutes)

### Phase 1 - Critical Indexes (Deploy These First)
```sql
-- Copy and paste these 4 commands in order:
CREATE INDEX CONCURRENTLY idx_orders_reference ON orders(reference);
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
CREATE INDEX CONCURRENTLY idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX CONCURRENTLY idx_variant_sizes_variant_size ON variant_sizes(variant_id, size_id);
```

### Immediate Verification
```sql
-- Run this to verify indexes were created:
SELECT indexname, tablename FROM pg_indexes WHERE indexname LIKE 'idx_%';
```

## 📋 Complete Deployment Plan

### Before You Start
- [ ] Schedule during low traffic (maintenance window)
- [ ] Have rollback script ready
- [ ] Monitor current performance for baseline

### Phase 1: Critical Indexes (30-60 min)
**Impact**: High - Payment verification, user queries, stock validation
**Risk**: Low - CONCURRENTLY prevents table locks

```sql
-- 1. Order reference (payment verification API)
CREATE INDEX CONCURRENTLY idx_orders_reference ON orders(reference);

-- 2. User order history (dashboard)
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);

-- 3. Product variants (product details)
CREATE INDEX CONCURRENTLY idx_product_variants_product_id ON product_variants(product_id);

-- 4. Stock validation (order creation)
CREATE INDEX CONCURRENTLY idx_variant_sizes_variant_size ON variant_sizes(variant_id, size_id);
```

**Wait 30 minutes, monitor for issues**

### Phase 2: Supporting Indexes (30-60 min)
**Impact**: Medium - Cart operations, order details
**Risk**: Low

```sql
-- 5. Cart operations
CREATE INDEX CONCURRENTLY idx_cart_items_cart_id ON cart_items(cart_id);

-- 6. Order details
CREATE INDEX CONCURRENTLY idx_order_items_order_id ON order_items(order_id);

-- 7. Product images
CREATE INDEX CONCURRENTLY idx_product_images_variant_id ON product_images(variant_id);

-- 8. Bundle validation
CREATE INDEX CONCURRENTLY idx_bundle_items_bundle_id ON bundle_items(bundle_id);
```

### Phase 3: Optimization Indexes (30-45 min)
**Impact**: Low-Medium - Supporting queries
**Risk**: Low

```sql
-- 9. User authentication
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- 10. Product browsing
CREATE INDEX CONCURRENTLY idx_products_category_active ON products(category, is_active);

-- 11. Address management
CREATE INDEX CONCURRENTLY idx_addresses_user_id ON addresses(user_id);

-- 12. Wishlist operations
CREATE INDEX CONCURRENTLY idx_wishlist_user_id ON wishlist(user_id);
```

## 🚨 Emergency Rollback

**If performance degrades or errors increase:**
```sql
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
```

## 📊 Expected Improvements

### Query Performance
- **Order verification**: 300-500ms → 30-50ms (90% faster)
- **User order history**: 200-400ms → 40-80ms (80% faster)
- **Product details**: 150-300ms → 45-90ms (70% faster)
- **Stock validation**: 100-200ms → 10-30ms (90% faster)

### Database Load
- **Index hit rate**: 90%+ for targeted queries
- **Full table scans**: 80% reduction for order operations
- **Connection pool usage**: 30-40% reduction during peak

## 🔍 Monitoring Checklist

### During Deployment
- [ ] No increase in query errors
- [ ] No table lock timeouts
- [ ] No connection pool exhaustion

### 24 Hours After
- [ ] Query response times improved
- [ ] No performance degradation
- [ ] Index usage statistics show hits

### Verification Queries
```sql
-- Check index usage (run after 24 hours)
SELECT indexname, idx_scan, idx_tup_read 
FROM pg_stat_user_indexes 
WHERE indexname LIKE 'idx_%';

-- Monitor query performance
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE query LIKE '%orders%' OR query LIKE '%products%'
ORDER BY mean_time DESC LIMIT 10;
```

## ⚠️ Important Notes

### DO:
- ✅ Run during maintenance window
- ✅ Use CONCURRENTLY to avoid locks
- ✅ Monitor between phases
- ✅ Have rollback ready
- ✅ Test on staging first (if available)

### DON'T:
- ❌ Run during peak traffic
- ❌ Create all indexes at once
- ❌ Skip monitoring between phases
- ❌ Ignore error rate increases

## 🎯 Success Criteria

**Immediate (2 hours):**
- All 12 indexes created successfully
- No increase in error rates
- No performance degradation

**24 Hours:**
- Target queries 60-90% faster
- Index hit rate >90%
- Reduced database CPU usage

**1 Week:**
- Overall API response time improved 30-50%
- Connection pool pressure reduced
- User experience improved

---

**Need Help?** Check the full `database_optimization_scripts.sql` file for detailed procedures and monitoring queries.