import dotenv from 'dotenv';
import path from 'path';
import postgres from 'postgres';

dotenv.config({ path: path.resolve('./Backend/.env') });

const dbUrl = process.env.DATABASE_URL;
const sql = postgres(dbUrl, { ssl: 'require' });

async function checkBrightSet() {
  try {
    const productId = 47;
    const product = await sql`SELECT * FROM products WHERE id = ${productId}`;
    console.log("Product:", product[0]);

    const variants = await sql`
      SELECT pv.id as variant_id, pv.sku, pv.is_active, c.color_name, c.color_code
      FROM product_variants pv
      LEFT JOIN colors c ON pv.color_id = c.id
      WHERE pv.product_id = ${productId};
    `;
    console.log("Variants:", variants);

    const images = await sql`
      SELECT pi.id, pi.variant_id, pi.image_url, pi.is_primary, pi.position, c.color_name
      FROM product_images pi
      JOIN product_variants pv ON pi.variant_id = pv.id
      LEFT JOIN colors c ON pv.color_id = c.id
      WHERE pv.product_id = ${productId};
    `;
    console.log("Images:", images);

    const sizes = await sql`
      SELECT vs.id, vs.variant_id, s.size_name, vs.stock_quantity, c.color_name
      FROM variant_sizes vs
      JOIN sizes s ON vs.size_id = s.id
      JOIN product_variants pv ON vs.variant_id = pv.id
      LEFT JOIN colors c ON pv.color_id = c.id
      WHERE pv.product_id = ${productId};
    `;
    console.log("Variant Sizes:", sizes);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkBrightSet();
