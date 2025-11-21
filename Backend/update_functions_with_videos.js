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

async function updateFunctionsWithVideos() {
  console.log('🎬 Updating optimized functions to include video support...')
  
  try {
    // Drop existing functions first
    console.log('🗑️ Dropping existing functions...')
    await sql.unsafe(`DROP FUNCTION IF EXISTS public.get_product_or_bundle_optimized CASCADE;`)
    await sql.unsafe(`DROP FUNCTION IF EXISTS public.get_cart_items_optimized CASCADE;`)

    // Create updated get_product_or_bundle_optimized function with video support
    console.log('🔄 Creating updated get_product_or_bundle_optimized function with video support...')
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
        videos JSONB,
        total_stock INTEGER
      ) AS $func$
      BEGIN
        -- Product query with video support
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
            (SELECT jsonb_agg(image_data ORDER BY position) 
             FROM (
               SELECT jsonb_build_object(
                 'url', pi.image_url,
                 'is_primary', pi.is_primary,
                 'position', pi.position,
                 'media_type', COALESCE(pi.media_type, 'image')
               ) as image_data
               FROM product_images pi 
               WHERE pi.variant_id = (
                 SELECT id FROM product_variants pv2 
                 WHERE pv2.product_id = p.id AND pv2.deleted_at IS NULL 
                 LIMIT 1
               ) AND pi.is_primary = TRUE 
               ORDER BY pi.position
               LIMIT 5
             ) images_sub), '[]'::jsonb
          ) as images,
          COALESCE(
            (SELECT jsonb_agg(video_data ORDER BY position) 
             FROM (
               SELECT jsonb_build_object(
                 'url', pv2.video_url,
                 'thumbnail', pv2.video_thumbnail_url,
                 'title', pv2.title,
                 'description', pv2.description,
                 'duration', pv2.duration_seconds,
                 'position', pv2.position,
                 'is_primary', pv2.is_primary
               ) as video_data
               FROM product_videos pv2 
               WHERE pv2.variant_id = (
                 SELECT id FROM product_variants pv3 
                 WHERE pv3.product_id = p.id AND pv3.deleted_at IS NULL 
                 LIMIT 1
               )
               ORDER BY pv2.position
               LIMIT 3
             ) videos_sub), '[]'::jsonb
          ) as videos,
          COALESCE(
            (SELECT SUM(vs.stock_quantity) 
             FROM variant_sizes vs 
             JOIN product_variants pv2 ON vs.variant_id = pv2.id 
             WHERE pv2.product_id = p.id AND pv2.deleted_at IS NULL), 0
          )::INTEGER as total_stock
        FROM products p
        WHERE p.id = p_id AND p.deleted_at IS NULL;

        -- Bundle query with video support
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
            (SELECT jsonb_agg(image_data ORDER BY position) 
             FROM (
               SELECT jsonb_build_object(
                 'url', bi2.image_url,
                 'is_primary', bi2.is_primary,
                 'position', bi2.position,
                 'media_type', COALESCE(bi2.media_type, 'image')
               ) as image_data
               FROM bundle_images bi2 
               WHERE bi2.bundle_id = b.id
               ORDER BY bi2.position
               LIMIT 5
             ) images_sub), '[]'::jsonb
          ) as images,
          COALESCE(
            (SELECT jsonb_agg(video_data ORDER BY position) 
             FROM (
               SELECT jsonb_build_object(
                 'url', pv2.video_url,
                 'thumbnail', pv2.video_thumbnail_url,
                 'title', pv2.title,
                 'description', pv2.description,
                 'duration', pv2.duration_seconds,
                 'position', pv2.position,
                 'is_primary', pv2.is_primary
               ) as video_data
               FROM product_videos pv2 
               WHERE pv2.bundle_id = b.id
               ORDER BY pv2.position
               LIMIT 3
             ) videos_sub), '[]'::jsonb
          ) as videos,
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

    console.log('✅ Functions updated with video support!')

  } catch (error) {
    console.error('❌ Error updating functions with video support:', error)
    throw error
  } finally {
    await sql.end()
  }
}

// Run the update
updateFunctionsWithVideos().catch(console.error)