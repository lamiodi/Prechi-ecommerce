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

async function checkProducts() {
  try {
    const products = await sql`SELECT id, name, base_price, sku_prefix, category FROM products ORDER BY id`
    console.log(`Found ${products.length} products:`)
    console.log(JSON.stringify(products, null, 2))
  } catch (err) {
    console.error('Error fetching products:', err)
  } finally {
    await sql.end()
  }
}

checkProducts()
