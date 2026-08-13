import dotenv from 'dotenv';
import path from 'path';
import postgres from 'postgres';

dotenv.config({ path: path.resolve('./Backend/.env') });

const dbUrl = process.env.DATABASE_URL;
const sql = postgres(dbUrl, { ssl: 'require' });

async function updateMilkshakeName() {
  try {
    const updated = await sql`
      UPDATE product_variants
      SET name = 'Purple Milkshake Set 3 Pieces', updated_at = NOW()
      WHERE id = 56
      RETURNING *
    `;
    console.log("Updated Variant 56 name:", updated[0]);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateMilkshakeName();
