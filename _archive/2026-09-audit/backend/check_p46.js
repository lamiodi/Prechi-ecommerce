import dotenv from 'dotenv';
import path from 'path';
import postgres from 'postgres';

dotenv.config({ path: path.resolve('./Backend/.env') });

const dbUrl = process.env.DATABASE_URL;
const sql = postgres(dbUrl, { ssl: 'require' });

async function checkProduct46() {
  try {
    const p46 = await sql`SELECT * FROM products WHERE id = 46`;
    console.log("Product 46:", p46[0]);

    const v46 = await sql`
      SELECT pv.id as variant_id, pv.sku, c.color_name, c.color_code
      FROM product_variants pv
      LEFT JOIN colors c ON pv.color_id = c.id
      WHERE pv.product_id = 46;
    `;
    console.log("Product 46 Variants:", v46);

    const img46 = await sql`
      SELECT pi.id, pi.variant_id, pi.image_url, pi.is_primary, pi.position, c.color_name
      FROM product_images pi
      JOIN product_variants pv ON pi.variant_id = pv.id
      LEFT JOIN colors c ON pv.color_id = c.id
      WHERE pv.product_id = 46;
    `;
    console.log("Product 46 Images:", img46);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkProduct46();
