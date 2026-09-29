import postgres from '../Backend/node_modules/postgres/src/index.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'Backend/.env') });

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  prepare: false
});

const newDescription = `Elevate your streetwear aesthetic with the Milkshake 3-Piece Set—an effortlessly chic ensemble designed for style and comfort. 

This versatile 3-piece set includes:
• Graphic Crop Tank Top: Fitted crop ribbed tank featuring a bold vintage motorcycle graphic print ("Vintage PC - Freedom is a Full Tank of Gas").
• Cropped Long-Sleeve Hoodie: Cozy cropped pullover hoodie featuring matching drawstrings, comfortable ribbed cuffs, and the signature PC logo emblem on the chest.
• Floor-Length Maxi Cargo Skirt: Statement high-waisted fleece maxi skirt equipped with an adjustable drawstring waist and spacious functional side cargo pockets.

Designed to be worn together for an instant high-fashion streetwear lounge look or mixed and matched with your wardrobe favorites. Available in Black and Pink.`;

async function updateDescription() {
  try {
    const updated = await sql`
      UPDATE products 
      SET description = ${newDescription} 
      WHERE id = 41
      RETURNING id, name, description;
    `;
    console.log("Successfully updated product description:\n", updated[0]);
  } catch (err) {
    console.error("Error updating product description:", err);
  } finally {
    await sql.end();
  }
}

updateDescription();
