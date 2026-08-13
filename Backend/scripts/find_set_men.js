import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function main() {
  try {
    const products = await sql`
      SELECT p.id, p.name, p.description, p.base_price, p.sku_prefix, p.category, p.gender,
             json_agg(
               json_build_object(
                 'variant_id', pv.id,
                 'color_id', pv.color_id,
                 'color_name', c.color_name,
                 'sku', pv.sku,
                 'variant_name', pv.name,
                 'images', (
                   SELECT json_agg(
                     json_build_object(
                       'image_url', pi.image_url,
                       'is_primary', pi.is_primary
                     )
                   )
                   FROM product_images pi
                   WHERE pi.variant_id = pv.id
                 )
               )
             ) as variants
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.deleted_at IS NULL
      LEFT JOIN colors c ON c.id = pv.color_id
      WHERE p.deleted_at IS NULL
      GROUP BY p.id
      ORDER BY p.id DESC
    `;
    
    products.forEach(p => {
      console.log(`[ID: ${p.id}] Name: "${p.name}" | Category: ${p.category} | Gender: ${p.gender}`);
    });
  } catch (err) {
    console.error('Error querying products:', err);
  } finally {
    await sql.end();
  }
}

main();
