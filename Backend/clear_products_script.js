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

async function clearAllProducts() {
  console.log('🗑️ Starting to clear all existing products...')
  
  try {
    await sql.begin(async (sql) => {
      // First, let's see what products exist
      const existingProducts = await sql`
        SELECT id, name, sku_prefix, created_at 
        FROM products 
        ORDER BY created_at DESC
      `
      
      console.log(`📋 Found ${existingProducts.length} products:`)
      existingProducts.forEach(product => {
        console.log(`   - ${product.name} (SKU: ${product.sku_prefix}, ID: ${product.id})`)
      })
      
      if (existingProducts.length === 0) {
        console.log('✅ No products found to delete')
        return
      }
      
      console.log('\n🗑️ Removing all products and related data...')
      
      // Delete in proper order to respect foreign key constraints
      console.log('   - Deleting cart items first...')
      await sql`DELETE FROM cart_items WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id IS NOT NULL)`
      
      console.log('   - Deleting bundle items...')
      await sql`DELETE FROM bundle_items WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id IS NOT NULL)`
      
      console.log('   - Deleting product images...')
      await sql`DELETE FROM product_images WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id IS NOT NULL)`
      
      console.log('   - Deleting variant sizes...')
      await sql`DELETE FROM variant_sizes WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id IS NOT NULL)`
      
      console.log('   - Deleting product variants...')
      await sql`DELETE FROM product_variants WHERE product_id IS NOT NULL`
      
      console.log('   - Deleting products...')
      await sql`DELETE FROM products WHERE id IS NOT NULL`
      
      console.log('✅ All products cleared successfully!')
    })
    
  } catch (error) {
    console.error('❌ Error clearing products:', error)
    throw error
  } finally {
    await sql.end()
  }
}

// Run the script
clearAllProducts().catch(console.error)