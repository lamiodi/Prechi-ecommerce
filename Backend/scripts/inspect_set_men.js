import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function inspectSetMen() {
  try {
    const [product] = await sql`
      SELECT p.*
      FROM products p
      WHERE p.id = 42
    `;
    
    console.log("=== PRODUCT 42 DETAILS ===");
    console.log(JSON.stringify(product, null, 2));

    const variants = await sql`
      SELECT pv.*, c.color_name, c.color_code
      FROM product_variants pv
      LEFT JOIN colors c ON c.id = pv.color_id
      WHERE pv.product_id = 42 AND pv.deleted_at IS NULL
    `;

    console.log("\n=== VARIANTS ===");
    console.log(JSON.stringify(variants, null, 2));

    for (const v of variants) {
      const images = await sql`
        SELECT * FROM product_images WHERE variant_id = ${v.id} ORDER BY position
      `;
      const sizes = await sql`
        SELECT vs.*, s.size_name 
        FROM variant_sizes vs 
        JOIN sizes s ON s.id = vs.size_id 
        WHERE vs.variant_id = ${v.id}
      `;
      console.log(`\n=== VARIANT ${v.id} (${v.name} - ${v.color_name}) IMAGES ===`);
      console.log(JSON.stringify(images, null, 2));
      console.log(`\n=== VARIANT ${v.id} (${v.name} - ${v.color_name}) SIZES ===`);
      console.log(JSON.stringify(sizes, null, 2));
    }

  } catch (err) {
    console.error('Error inspecting Product 42:', err);
  } finally {
    await sql.end();
  }
}

inspectSetMen();
