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

async function checkColorsAndSizes() {
  try {
    const colors = await sql`SELECT * FROM colors ORDER BY id`
    const sizes = await sql`SELECT * FROM sizes ORDER BY id`
    const categories = await sql`SELECT * FROM categories ORDER BY id`

    console.log('=== Colors ===')
    console.log(JSON.stringify(colors, null, 2))

    console.log('=== Sizes ===')
    console.log(JSON.stringify(sizes, null, 2))

    console.log('=== Categories ===')
    console.log(JSON.stringify(categories, null, 2))
  } catch (err) {
    console.error('Error querying db:', err)
  } finally {
    await sql.end()
  }
}

checkColorsAndSizes()
