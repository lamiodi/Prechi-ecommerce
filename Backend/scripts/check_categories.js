import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', idle_timeout: 10, connect_timeout: 10 });

async function run() {
  try {
    const cats = await sql`
      SELECT DISTINCT category FROM products WHERE is_active = TRUE AND category IS NOT NULL;
    `;
    console.log('Categories in DB products:', cats);

    const products = await sql`
      SELECT id, name, category FROM products WHERE is_active = TRUE ORDER BY id;
    `;
    console.log('Products & Categories:', products);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

run();
