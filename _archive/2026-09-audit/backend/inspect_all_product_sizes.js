import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

async function inspect() {
  try {
    const products = await sql`
      SELECT p.id, p.name, p.base_price, p.sku_prefix, p.category
      FROM products p
      WHERE p.deleted_at IS NULL
      ORDER BY p.id
    `;
    for (const p of products) {
      console.log(`Product ${p.id}: ${p.name} (Base: ${p.base_price})`);
      const vs = await sql`
        SELECT pv.id as var_id, c.color_name, s.size_name, vs.stock_quantity, vs.price
        FROM variant_sizes vs
        JOIN product_variants pv ON vs.variant_id = pv.id
        JOIN colors c ON pv.color_id = c.id
        JOIN sizes s ON vs.size_id = s.id
        WHERE pv.product_id = ${p.id}
        ORDER BY pv.id, s.size_order
      `;
      const sizePrices = vs.map(item => `${item.color_name}/${item.size_name}: ₦${item.price} (qty: ${item.stock_quantity})`).join(', ');
      console.log(`  Sizes: ${sizePrices || 'None'}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

inspect();
