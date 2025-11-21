import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

console.log('🚀 Database URL:', process.env.DATABASE_URL);

// Create connection with SSL disabled for testing
const sql = postgres(process.env.DATABASE_URL, {
  ssl: false, // Disable SSL for local testing
  max: 1,
});

async function applyOptimizedFunctions() {
  try {
    console.log('🚀 Connecting to database...');
    
    // Test connection first
    const test = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful:', test);
    
    console.log('\n📝 Creating optimized functions...');
    
    // Create the optimized product/bundle function
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.get_product_or_bundle_optimized(p_id INTEGER)
      RETURNS TABLE (
        item_type TEXT,
        item_id INTEGER,
        name TEXT,
        description TEXT,
        price NUMERIC,
        sku_prefix TEXT,
        is_active BOOLEAN,
        is_product BOOLEAN,
        bundle_type TEXT,
        variants JSONB,
        images JSONB,
        total_stock INTEGER
      ) AS $$
      BEGIN
        -- Product query with optimized joins
        RETURN QUERY
        SELECT 
          'product'::TEXT as item_type,
          p.id::INTEGER as item_id,
          p.name::TEXT,
          p.description::TEXT,
          p.base_price::NUMERIC as price,
          p.sku_prefix::TEXT,
          p.is_active::BOOLEAN,
          TRUE::BOOLEAN as is_product,
          NULL::TEXT as bundle_type,
          COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'variant_id', pv.id,
                'color_id', pv.color_id,
                'color_name', c.color_name,
                'color_code', c.color_code,
                'sku', pv.sku,
                'sizes', pv_sizes.sizes_array,
                'images', pv_images.images_array
              ) ORDER BY pv.id
            ), '[]'::jsonb
          ) as variants,
          COALESCE(
            (SELECT jsonb_agg(image_url ORDER BY position) 
             FROM product_images pi 
             WHERE pi.variant_id = pv.id AND pi.is_primary = TRUE 
             LIMIT 1), '[]'::jsonb
          ) as images,
          COALESCE(SUM(vs.stock_quantity), 0)::INTEGER as total_stock
        FROM products p
        LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.deleted_at IS NULL
        LEFT JOIN colors c ON pv.color_id = c.id
        LEFT JOIN LATERAL (
          SELECT jsonb_agg(
            jsonb_build_object(
              'size_id', s.id,
              'size_name', s.size_name,
              'stock_quantity', vs.stock_quantity
            ) ORDER BY s.id
          ) as sizes_array
          FROM variant_sizes vs
          JOIN sizes s ON vs.size_id = s.id
          WHERE vs.variant_id = pv.id
        ) pv_sizes ON TRUE
        LEFT JOIN LATERAL (
          SELECT jsonb_agg(image_url ORDER BY position) as images_array
          FROM product_images pi
          WHERE pi.variant_id = pv.id
          LIMIT 3
        ) pv_images ON TRUE
        LEFT JOIN variant_sizes vs ON pv.id = vs.variant_id
        WHERE p.id = p_id AND p.deleted_at IS NULL
        GROUP BY p.id, p.name, p.description, p.base_price, p.sku_prefix, p.is_active;

        -- Bundle query with optimized joins
        RETURN QUERY
        SELECT 
          'bundle'::TEXT as item_type,
          b.id::INTEGER as item_id,
          b.name::TEXT,
          b.description::TEXT,
          b.bundle_price::NUMERIC as price,
          b.sku_prefix::TEXT,
          b.is_active::BOOLEAN,
          FALSE::BOOLEAN as is_product,
          b.bundle_type::TEXT,
          COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'variant_id', pv.id,
                'product_name', p.name,
                'color_name', c.color_name,
                'sizes', bundle_sizes.sizes_array
              ) ORDER BY bi.id
            ), '[]'::jsonb
          ) as variants,
          COALESCE(
            (SELECT jsonb_agg(image_url ORDER BY position) 
             FROM bundle_images bi2 
             WHERE bi2.bundle_id = b.id AND bi2.is_primary = TRUE 
             LIMIT 3), '[]'::jsonb
          ) as images,
          COALESCE(SUM(vs.stock_quantity), 0)::INTEGER as total_stock
        FROM bundles b
        LEFT JOIN bundle_items bi ON b.id = bi.bundle_id
        LEFT JOIN product_variants pv ON bi.variant_id = pv.id
        LEFT JOIN products p ON pv.product_id = p.id
        LEFT JOIN colors c ON pv.color_id = c.id
        LEFT JOIN LATERAL (
          SELECT jsonb_agg(
            jsonb_build_object(
              'size_id', s.id,
              'size_name', s.size_name
            ) ORDER BY s.id
          ) as sizes_array
          FROM variant_sizes vs
          JOIN sizes s ON vs.size_id = s.id
          WHERE vs.variant_id = pv.id
        ) bundle_sizes ON TRUE
        LEFT JOIN variant_sizes vs ON pv.id = vs.variant_id
        WHERE b.id = p_id AND b.deleted_at IS NULL
        GROUP BY b.id, b.name, b.description, b.bundle_price, b.sku_prefix, b.is_active, b.bundle_type;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ get_product_or_bundle_optimized function created');
    
    // Create the optimized cart items function
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.get_cart_items_optimized(p_cart_id INTEGER)
      RETURNS TABLE (
        cart_item_id INTEGER,
        quantity INTEGER,
        item_data JSONB
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          ci.id::INTEGER as cart_item_id,
          ci.quantity::INTEGER,
          CASE 
            WHEN ci.product_variant_id IS NOT NULL THEN
              jsonb_build_object(
                'type', 'product',
                'id', p.id,
                'name', p.name,
                'description', p.description,
                'price', p.base_price,
                'sku_prefix', p.sku_prefix,
                'is_active', p.is_active,
                'variant', jsonb_build_object(
                  'variant_id', pv.id,
                  'color_id', pv.color_id,
                  'color_name', c.color_name,
                  'color_code', c.color_code,
                  'sku', pv.sku,
                  'sizes', pv_sizes.sizes_array,
                  'images', pv_images.images_array,
                  'total_stock', COALESCE(SUM(vs.stock_quantity), 0)
                )
              )
            WHEN ci.bundle_id IS NOT NULL THEN
              jsonb_build_object(
                'type', 'bundle',
                'id', b.id,
                'name', b.name,
                'description', b.description,
                'price', b.bundle_price,
                'sku_prefix', b.sku_prefix,
                'is_active', b.is_active,
                'bundle_type', b.bundle_type,
                'variants', bundle_variants.variants_array,
                'images', bundle_images.images_array,
                'total_stock', COALESCE(SUM(vs2.stock_quantity), 0)
              )
          END as item_data
        FROM cart_items ci
        LEFT JOIN product_variants pv ON ci.product_variant_id = pv.id
        LEFT JOIN products p ON pv.product_id = p.id
        LEFT JOIN colors c ON pv.color_id = c.id
        LEFT JOIN bundles b ON ci.bundle_id = b.id
        LEFT JOIN LATERAL (
          SELECT jsonb_agg(
            jsonb_build_object(
              'size_id', s.id,
              'size_name', s.size_name,
              'stock_quantity', vs.stock_quantity
            ) ORDER BY s.id
          ) as sizes_array
          FROM variant_sizes vs
          JOIN sizes s ON vs.size_id = s.id
          WHERE vs.variant_id = pv.id
        ) pv_sizes ON TRUE
        LEFT JOIN LATERAL (
          SELECT jsonb_agg(image_url ORDER BY position) as images_array
          FROM product_images pi
          WHERE pi.variant_id = pv.id
          LIMIT 3
        ) pv_images ON TRUE
        LEFT JOIN LATERAL (
          SELECT jsonb_agg(
            jsonb_build_object(
              'variant_id', pv2.id,
              'product_name', p2.name,
              'color_name', c2.color_name,
              'sizes', bundle_item_sizes.sizes_array
            ) ORDER BY bi.id
          ) as variants_array
          FROM bundle_items bi
          JOIN product_variants pv2 ON bi.variant_id = pv2.id
          JOIN products p2 ON pv2.product_id = p2.id
          JOIN colors c2 ON pv2.color_id = c2.id
          LEFT JOIN LATERAL (
            SELECT jsonb_agg(
              jsonb_build_object(
                'size_id', s2.id,
                'size_name', s2.size_name
              ) ORDER BY s2.id
            ) as sizes_array
            FROM variant_sizes vs2
            JOIN sizes s2 ON vs2.size_id = s2.id
            WHERE vs2.variant_id = pv2.id
          ) bundle_item_sizes ON TRUE
          WHERE bi.bundle_id = b.id
        ) bundle_variants ON TRUE
        LEFT JOIN LATERAL (
          SELECT jsonb_agg(image_url ORDER BY position) as images_array
          FROM bundle_images bi3
          WHERE bi3.bundle_id = b.id
          LIMIT 3
        ) bundle_images ON TRUE
        LEFT JOIN variant_sizes vs ON pv.id = vs.variant_id
        LEFT JOIN variant_sizes vs2 ON pv.id = vs2.variant_id
        WHERE ci.cart_id = p_cart_id AND ci.deleted_at IS NULL
        GROUP BY ci.id, ci.quantity, p.id, p.name, p.description, p.base_price, p.sku_prefix, p.is_active,
                 pv.id, pv.color_id, c.color_name, c.color_code, pv.sku, b.id, b.name, b.description, 
                 b.bundle_price, b.sku_prefix, b.is_active, b.bundle_type;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ get_cart_items_optimized function created');
    
    // Create the batch stock validation function
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.validate_cart_stock_batch(p_cart_id INTEGER)
      RETURNS TABLE (
        cart_item_id INTEGER,
        is_valid BOOLEAN,
        available_stock INTEGER,
        requested_quantity INTEGER
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          ci.id::INTEGER as cart_item_id,
          CASE 
            WHEN ci.product_variant_id IS NOT NULL THEN
              COALESCE(SUM(vs.stock_quantity), 0) >= ci.quantity
            WHEN ci.bundle_id IS NOT NULL THEN
              -- For bundles, check minimum stock across all bundle items
              COALESCE(MIN(vs2.stock_quantity), 0) >= ci.quantity
          END::BOOLEAN as is_valid,
          CASE 
            WHEN ci.product_variant_id IS NOT NULL THEN
              COALESCE(SUM(vs.stock_quantity), 0)::INTEGER
            WHEN ci.bundle_id IS NOT NULL THEN
              COALESCE(MIN(vs2.stock_quantity), 0)::INTEGER
          END as available_stock,
          ci.quantity::INTEGER as requested_quantity
        FROM cart_items ci
        LEFT JOIN product_variants pv ON ci.product_variant_id = pv.id
        LEFT JOIN bundles b ON ci.bundle_id = b.id
        LEFT JOIN bundle_items bi ON b.id = bi.bundle_id
        LEFT JOIN product_variants pv2 ON bi.variant_id = pv2.id
        LEFT JOIN variant_sizes vs ON pv.id = vs.variant_id
        LEFT JOIN variant_sizes vs2 ON pv2.id = vs2.variant_id
        WHERE ci.cart_id = p_cart_id AND ci.deleted_at IS NULL
        GROUP BY ci.id, ci.quantity, ci.product_variant_id, ci.bundle_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ validate_cart_stock_batch function created');
    
    console.log('\n🎉 All optimized functions created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating functions:', error);
  } finally {
    await sql.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the application
applyOptimizedFunctions().catch(console.error);