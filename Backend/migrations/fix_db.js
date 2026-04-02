import dotenv from 'dotenv';
import postgres from 'postgres';
dotenv.config();

// Use direct connection (port 5432) derived from DATABASE_URL to bypass pooler timeout issues
const connectionString = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace(':6543', ':5432')
  : 'postgres://postgres:postgres@localhost:5432/prechi_clothing';

const sql = postgres(connectionString);

async function fix() {
  try {
    await sql`
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
      WHEN ci.variant_id IS NOT NULL THEN
        jsonb_build_object(
          'type', 'product',
          'id', p.id,
          'name', p.name,
          'description', p.description,
          'price', COALESCE(vs_price.price, p.base_price),
          'sku_prefix', p.sku_prefix,
          'is_active', p.is_active,
          'stock_quantity', COALESCE(vs_price.stock_quantity, 0),
          'is_product', true,
          'size_id', ci.size_id,
          'image', (SELECT image_url FROM product_images WHERE variant_id = pv.id ORDER BY is_primary DESC, position ASC LIMIT 1),
          'color', c.color_name,
          'size', s_main.size_name,
          'variant', jsonb_build_object(
            'variant_id', pv.id,
            'color_id', pv.color_id,
            'color_name', c.color_name,
            'color_code', c.color_code,
            'sku', pv.sku,
            'sizes', pv_sizes.sizes_array,
            'images', pv_images.images_array,
            'total_stock', COALESCE((SELECT SUM(stock_quantity) FROM variant_sizes WHERE variant_id = pv.id), 0)
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
          'is_product', false,
          'bundle_type', b.bundle_type,
          'image', (SELECT image_url FROM bundle_images WHERE bundle_id = b.id ORDER BY is_primary DESC, position ASC LIMIT 1),
          'variants', bundle_variants.variants_array,
          'images', bundle_images.images_array,
          'items', bundle_items_detail.items_array,
          'total_stock', 999 
        )
    END as item_data
  FROM cart_items ci
  LEFT JOIN product_variants pv ON ci.variant_id = pv.id
  LEFT JOIN products p ON pv.product_id = p.id
  LEFT JOIN colors c ON pv.color_id = c.id
  LEFT JOIN bundles b ON ci.bundle_id = b.id
  LEFT JOIN sizes s_main ON s_main.id = ci.size_id
  LEFT JOIN variant_sizes vs_price ON vs_price.variant_id = pv.id AND vs_price.size_id = ci.size_id
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
    LEFT JOIN colors c2 ON pv2.color_id = c2.id
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
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', cbi.id,
        'variant_id', cbi.variant_id,
        'size_id', cbi.size_id,
        'product_name', p2.name,
        'color_name', c2.color_name,
        'size_name', s2.size_name,
        'image_url', (SELECT image_url FROM product_images pi2 WHERE pi2.variant_id = cbi.variant_id ORDER BY pi2.is_primary DESC LIMIT 1)
      ) ORDER BY cbi.id
    ) as items_array
    FROM cart_bundle_items cbi
    JOIN product_variants pv2 ON cbi.variant_id = pv2.id
    JOIN products p2 ON pv2.product_id = p2.id
    LEFT JOIN colors c2 ON pv2.color_id = c2.id
    LEFT JOIN sizes s2 ON cbi.size_id = s2.id
    WHERE cbi.cart_item_id = ci.id
  ) bundle_items_detail ON TRUE
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(image_url ORDER BY position) as images_array
    FROM bundle_images bi3
    WHERE bi3.bundle_id = b.id
    LIMIT 3
  ) bundle_images ON TRUE
  WHERE ci.cart_id = p_cart_id AND ci.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;
    `;
    console.log("Corrected get_cart_items_optimized!");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
fix();
