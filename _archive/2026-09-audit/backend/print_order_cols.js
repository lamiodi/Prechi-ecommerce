import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace(':6543', ':5432')
  : 'postgres://postgres:postgres@localhost:5432/prechi_clothing';

const sql = postgres(connectionString, { ssl: 'require', max: 1 });

async function printOrderCols() {
  const orderCols = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'orders'
    ORDER BY ordinal_position
  `;
  console.log('Orders columns:');
  console.table(orderCols);

  const itemCols = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'order_items'
    ORDER BY ordinal_position
  `;
  console.log('Order_items columns:');
  console.table(itemCols);

  await sql.end();
}

printOrderCols();
