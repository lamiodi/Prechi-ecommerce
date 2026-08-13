import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', idle_timeout: 10, connect_timeout: 10 });

async function run() {
  try {
    const products = await sql`
      SELECT p.id, p.name, p.category, p.is_new_release,
      (SELECT pi.image_url FROM product_images pi JOIN product_variants pv ON pi.variant_id = pv.id WHERE pv.product_id = p.id AND pv.is_active = TRUE ORDER BY (pi.is_primary IS TRUE) DESC, pi.id ASC LIMIT 1) as image
      FROM products p WHERE p.is_active = TRUE ORDER BY p.id DESC;
    `;
    console.log('Products:', JSON.stringify(products, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

run();
