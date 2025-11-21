import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config()

const connectionOptions = {
  ssl: 'require',
  max: 1,
  idle_timeout: 30,
  connect_timeout: 10
}

const sql = postgres(process.env.DATABASE_URL, connectionOptions)

async function createWorkingFunctions() {
  console.log('🔧 Creating working optimized functions...')
  
  try {
    // Drop existing functions first
    console.log('🗑️ Dropping existing functions...')
    await sql.unsafe(`DROP FUNCTION IF EXISTS public.get_product_or_bundle_optimized CASCADE;`)
    await sql.unsafe(`DROP FUNCTION IF EXISTS public.get_cart_items_optimized CASCADE;`)
    await sql.unsafe(`DROP FUNCTION IF EXISTS public.validate_cart_stock_batch CASCADE;`)

    // Create working get_product_or_bundle_optimized function
    console.log('🔄 Creating working get_product_or_bundle_optimized function...')
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
      ) AS $func$
      BEGIN
        -- Product query
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
            (SELECT jsonb_agg(variant_data ORDER BY variant_data->>'variant_id')
             FROM (
               SELECT jsonb_build_object(
                 'variant_id', pv.id,
                 'color_id', pv.color_id,
                 'color_name', c.color_name,
                 'color_code', c.color_code,
                 'sku', pv.sku,
                 'total_stock', COALESCE(SUM(vs2.stock_quantity), 0)
               ) as variant_data
               FROM product_variants pv
               LEFT JOIN colors c ON pv.color_id = c.id
               LEFT JOIN variant_sizes vs2 ON pv.id = vs2.variant_id
               WHERE pv.product_id = p.id AND pv.deleted_at IS NULL
               GROUP BY pv.id, c.color_name, c.color_code
             ) variants_sub), '[]'::jsonb
          ) as variants,
          COALESCE(
            (SELECT jsonb_agg(image_url ORDER BY position) 
             FROM product_images pi 
             WHERE pi.variant_id = (
               SELECT id FROM product_variants pv2 
               WHERE pv2.product_id = p.id AND pv2.deleted_at IS NULL 
               LIMIT 1
             ) AND pi.is_primary = TRUE 
             LIMIT 3), '[]'::jsonb
          ) as images,
          COALESCE(
            (SELECT SUM(vs.stock_quantity) 
             FROM variant_sizes vs 
             JOIN product_variants pv2 ON vs.variant_id = pv2.id 
             WHERE pv2.product_id = p.id AND pv2.deleted_at IS NULL), 0
          )::INTEGER as total_stock
        FROM products p
        WHERE p.id = p_id AND p.deleted_at IS NULL;

        -- Bundle query
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
            (SELECT jsonb_agg(bundle_item_data ORDER BY bundle_item_data->>'variant_id')
             FROM (
               SELECT jsonb_build_object(
                 'variant_id', pv.id,
                 'product_name', p2.name,
                 'color_name', c.color_name,
                 'total_stock', COALESCE(SUM(vs2.stock_quantity), 0)
               ) as bundle_item_data
               FROM bundle_items bi
               JOIN product_variants pv ON bi.variant_id = pv.id
               JOIN products p2 ON pv.product_id = p2.id
               LEFT JOIN colors c ON pv.color_id = c.id
               LEFT JOIN variant_sizes vs2 ON pv.id = vs2.variant_id
               WHERE bi.bundle_id = b.id
               GROUP BY pv.id, p2.name, c.color_name
             ) bundle_items_sub), '[]'::jsonb
          ) as variants,
          COALESCE(
            (SELECT jsonb_agg(image_url ORDER BY position) 
             FROM bundle_images bi2 
             WHERE bi2.bundle_id = b.id AND bi2.is_primary = TRUE 
             LIMIT 3), '[]'::jsonb
          ) as images,
          COALESCE(
            (SELECT SUM(vs.stock_quantity) 
             FROM bundle_items bi
             JOIN product_variants pv ON bi.variant_id = pv.id
             JOIN variant_sizes vs ON pv.id = vs.variant_id
             WHERE bi.bundle_id = b.id), 0
          )::INTEGER as total_stock
        FROM bundles b
        WHERE b.id = p_id AND b.deleted_at IS NULL;
      END;
      $func$ LANGUAGE plpgsql;
    `)

    // Create get_cart_items_optimized function
    console.log('🔄 Creating get_cart_items_optimized function...')
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.get_cart_items_optimized(p_cart_id INTEGER)
      RETURNS TABLE (
        item_id INTEGER,
        product_id INTEGER,
        variant_id INTEGER,
        bundle_id INTEGER,
        quantity INTEGER,
        is_bundle BOOLEAN,
        price NUMERIC,
        product_name VARCHAR,
        product_description TEXT,
        base_price NUMERIC,
        sku VARCHAR,
        color_name VARCHAR,
        size_name VARCHAR,
        stock_quantity INTEGER,
        bundle_type VARCHAR,
        bundle_price NUMERIC
      ) AS $func$
      BEGIN
        RETURN QUERY
        SELECT 
          ci.id as item_id,
          COALESCE(pv.product_id, b.product_id) as product_id,
          ci.variant_id,
          ci.bundle_id,
          ci.quantity,
          CASE WHEN ci.bundle_id IS NOT NULL THEN TRUE ELSE FALSE END as is_bundle,
          ci.price,
          COALESCE(p.name, b.name) as product_name,
          COALESCE(p.description, b.description) as product_description,
          COALESCE(p.base_price, b.bundle_price) as base_price,
          pv.sku,
          c.color_name,
          s.size_name,
          vs.stock_quantity,
          b.bundle_type,
          b.bundle_price
        FROM cart_items ci
        LEFT JOIN product_variants pv ON ci.variant_id = pv.id
        LEFT JOIN products p ON pv.product_id = p.id
        LEFT JOIN colors c ON pv.color_id = c.id
        LEFT JOIN sizes s ON ci.size_id = s.id
        LEFT JOIN variant_sizes vs ON ci.variant_id = vs.variant_id AND ci.size_id = vs.size_id
        LEFT JOIN bundles b ON ci.bundle_id = b.id
        WHERE ci.cart_id = p_cart_id AND ci.deleted_at IS NULL
        ORDER BY ci.created_at;
      END;
      $func$ LANGUAGE plpgsql;
    `)

    // Create validate_cart_stock_batch function
    console.log('🔄 Creating validate_cart_stock_batch function...')
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION public.validate_cart_stock_batch(p_cart_item_ids INTEGER[])
      RETURNS TABLE (
        cart_item_id INTEGER,
        variant_id INTEGER,
        size_id INTEGER,
        quantity_requested INTEGER,
        available_stock INTEGER,
        is_available BOOLEAN
      ) AS $func$
      BEGIN
        RETURN QUERY
        SELECT 
          ci.id as cart_item_id,
          ci.variant_id,
          ci.size_id,
          ci.quantity as quantity_requested,
          COALESCE(vs.stock_quantity, 0) as available_stock,
          CASE 
            WHEN COALESCE(vs.stock_quantity, 0) >= ci.quantity THEN TRUE 
            ELSE FALSE 
          END as is_available
        FROM cart_items ci
        LEFT JOIN variant_sizes vs ON ci.variant_id = vs.variant_id AND ci.size_id = vs.size_id
        WHERE ci.id = ANY(p_cart_item_ids) AND ci.deleted_at IS NULL;
      END;
      $func$ LANGUAGE plpgsql;
    `)

    console.log('✅ All working optimized functions have been created!')
    
  } catch (error) {
    console.error('❌ Error creating functions:', error.message)
    throw error
  } finally {
    await sql.end()
  }
}

// Run the function creation
createWorkingFunctions().catch(console.error)