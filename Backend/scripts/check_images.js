import dotenv from 'dotenv';
import path from 'path';
import postgres from 'postgres';

dotenv.config({ path: path.resolve('./Backend/.env') });

const dbUrl = process.env.DATABASE_URL;
const sql = postgres(dbUrl, { ssl: 'require' });

async function checkImages() {
  try {
    const res = await sql`
      SELECT p.id, p.name, 
        (
          SELECT JSON_AGG(img.image_url)
          FROM (
            SELECT DISTINCT ON (pi.image_url) pi.image_url
            FROM product_images pi 
            JOIN product_variants pv ON pi.variant_id = pv.id
            WHERE pv.product_id = p.id AND pv.is_active = TRUE
          ) img
        ) as images
      FROM products p;
    `;
    res.forEach(r => {
      console.log(`Product ID: ${r.id} | Name: ${r.name} | Images count: ${r.images ? r.images.length : 0}`);
      if (r.images) {
        console.log(`  URLs:`, r.images);
      }
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkImages();
