import postgres from 'postgres'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const connectionOptions = {
  ssl: 'require',
  max: 1,
  idle_timeout: 30,
  connect_timeout: 10
}

const sql = postgres(process.env.DATABASE_URL, connectionOptions)

async function checkVariantsAndImages() {
  try {
    const variants = await sql`
      SELECT pv.id, pv.product_id, pv.color_id, pv.sku, pv.name, c.color_name
      FROM product_variants pv
      LEFT JOIN colors c ON c.id = pv.color_id
      ORDER BY pv.id
    `
    console.log('=== Product Variants ===')
    console.log(JSON.stringify(variants, null, 2))

    const images = await sql`
      SELECT pi.id, pi.variant_id, pi.image_url, pi.is_primary, pi.position
      FROM product_images pi
      ORDER BY pi.id
    `
    console.log('=== Product Images ===')
    console.log(JSON.stringify(images, null, 2))

    const sizePrices = await sql`
      SELECT vs.id, vs.variant_id, vs.size_id, s.size_name, vs.stock_quantity, vs.price
      FROM variant_sizes vs
      JOIN sizes s ON s.id = vs.size_id
      ORDER BY vs.id
      LIMIT 20
    `
    console.log('=== Variant Sizes & Prices ===')
    console.log(JSON.stringify(sizePrices, null, 2))
  } catch (err) {
    console.error('Error fetching variants and images:', err)
  } finally {
    await sql.end()
  }
}

checkVariantsAndImages()
