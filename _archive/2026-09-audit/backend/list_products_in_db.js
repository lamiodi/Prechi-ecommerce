import sql from '../db/index.js'

async function listProducts() {
  try {
    const products = await sql`
      SELECT *
      FROM products
      ORDER BY id ASC
    `
    console.log(`Found ${products.length} products in database:`)
    console.log(JSON.stringify(products, null, 2))
    
    const colors = await sql`
      SELECT * FROM colors
    `
    console.log('\nColors table:', JSON.stringify(colors, null, 2))

    const productImages = await sql`
      SELECT * FROM product_images
    `
    console.log('\nProduct Images:', JSON.stringify(productImages, null, 2))
    
  } catch (err) {
    console.error('Error fetching products:', err)
  } finally {
    await sql.end()
  }
}

listProducts()
