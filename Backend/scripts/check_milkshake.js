import dotenv from 'dotenv';
import path from 'path';
import postgres from 'postgres';

dotenv.config({ path: path.resolve('./Backend/.env') });

const dbUrl = process.env.DATABASE_URL;
const sql = postgres(dbUrl, { ssl: 'require' });

async function checkMilkshake() {
  try {
    const product = await sql`SELECT * FROM products WHERE id = 41 OR name LIKE '%Milkshake%'`;
    console.log("Milkshake Product:", product);

    if (product.length > 0) {
      const pId = product[0].id;
      const variants = await sql`
        SELECT pv.id as variant_id, pv.sku, c.id as color_id, c.color_name, c.color_code
        FROM product_variants pv
        LEFT JOIN colors c ON pv.color_id = c.id
        WHERE pv.product_id = ${pId};
      `;
      console.log("Variants:", variants);

      // Check colors table
      const colors = await sql`SELECT * FROM colors`;
      console.log("All colors:", colors);

      // Check product add-ons or custom options table if any
      const addOns = await sql`
        SELECT table_name FROM information_schema.tables WHERE table_schema='public';
      `;
      console.log("Database Tables:", addOns.map(t => t.table_name));
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkMilkshake();
