
import sql from './db/index.js';

const runMigration = async () => {
  console.log('Adding missing columns to orders table...');
  try {
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_id INTEGER REFERENCES addresses(id)`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address_id INTEGER REFERENCES billing_addresses(id)`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_id INTEGER REFERENCES cart(id)`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS note TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'NGN'`;
    
    console.log('✅ Successfully added missing columns.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await sql.end();
  }
};

runMigration();
