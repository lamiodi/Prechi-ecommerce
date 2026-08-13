import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

const newDescription = `Redefine modern luxury streetwear with the Prechi Architectural Color-Blocked Men's Tracksuit Set. Crafted from heavy-weight, ultra-soft cotton fleece, this two-piece premium ensemble seamlessly blends contemporary relaxed tailoring with bold geometric aesthetics.

Features:
• Structured Pullover Hoodie: High-density fleece construction featuring a double-lined hood with custom drawstrings, a spacious kangaroo front pocket, and the signature oval 'Pc Style' chest emblem badge.
• Architectural Color-Blocking: Dynamic contrast curved chest, back, and sleeve panels defined by clean white piping accents.
• Relaxed-Fit Track Pants: Straight/wide-leg fleece trousers designed with an elasticated waistband, deep side pockets, and sweeping side-panel piping that mirrors the top for a unified silhouette.
• Versatile Luxury Drip: Wear as a coordinated luxury set or style the hoodie and joggers individually for effortless everyday versatility.

Available in Army Black & Olive and Black & Lilac Purple.`;

async function updateDescription() {
  try {
    const result = await sql`
      UPDATE products
      SET description = ${newDescription},
          updated_at = NOW()
      WHERE id = 42
      RETURNING id, name, category, gender, description;
    `;
    
    console.log("Updated Product Description Successfully!");
    console.log(JSON.stringify(result[0], null, 2));

  } catch (err) {
    console.error('Error updating product description:', err);
  } finally {
    await sql.end();
  }
}

updateDescription();
