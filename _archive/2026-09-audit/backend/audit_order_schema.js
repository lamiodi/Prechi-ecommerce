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

async function auditOrderSchema() {
  console.log('🔍 Auditing Database Schema for Order Lifecycle...\n');

  try {
    const tables = ['orders', 'order_items', 'addresses', 'billing_addresses', 'users', 'cart', 'cart_items', 'variant_sizes'];
    
    for (const table of tables) {
      console.log(`\n📋 Table: ${table}`);
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = ${table}
        ORDER BY ordinal_position
      `;
      console.table(columns);
    }

    // Check foreign keys and constraints on orders and order_items
    console.log('\n🔗 Constraints on orders & order_items:');
    const constraints = await sql`
      SELECT tc.table_name, tc.constraint_name, tc.constraint_type, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name IN ('orders', 'order_items')
      ORDER BY tc.table_name, tc.constraint_name
    `;
    console.table(constraints);

  } catch (err) {
    console.error('Audit error:', err);
  } finally {
    await sql.end();
  }
}

auditOrderSchema();
