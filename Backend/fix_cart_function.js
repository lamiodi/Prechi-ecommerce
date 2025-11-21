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

async function fixCartFunction() {
  console.log('🔧 Fixing cart function...')
  
  try {
    // Drop and recreate the get_cart_items_optimized function with the fix
    console.log('🔄 Recreating get_cart_items_optimized function...')
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
          pv.product_id as product_id,
          ci.variant_id,
          ci.bundle_id,
          ci.quantity,
          CASE WHEN ci.bundle_id IS NOT NULL THEN TRUE ELSE FALSE END as is_bundle,
          ci.price,
          p.name as product_name,
          p.description as product_description,
          p.base_price as base_price,
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

    console.log('✅ Cart function has been fixed!')
    
  } catch (error) {
    console.error('❌ Error fixing cart function:', error.message)
    throw error
  } finally {
    await sql.end()
  }
}

// Run the fix
fixCartFunction().catch(console.error)