import sql from '../db/index.js';

async function restoreDatabase() {
  console.log('🚑 Starting database restoration (adding back dropped columns)...');

  try {
    // 1. Restore columns in orders table
    console.log('Restoring columns in orders table...');
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_ngn NUMERIC(10, 2)`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS base_currency_total NUMERIC(10, 2)`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS converted_total NUMERIC(10, 2)`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method_id INTEGER`;
    console.log('✅ Restored columns in orders table');

    // 2. Restore columns in cart_items table
    console.log('Restoring columns in cart_items table...');
    await sql`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS product_id INTEGER`;
    await sql`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS user_id INTEGER`;
    await sql`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS color_name VARCHAR(50)`;
    await sql`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS size_name VARCHAR(50)`;
    console.log('✅ Restored columns in cart_items table');

    // 3. Restore columns in bundles table
    console.log('Restoring columns in bundles table...');
    await sql`ALTER TABLE bundles ADD COLUMN IF NOT EXISTS product_id INTEGER`;
    console.log('✅ Restored columns in bundles table');

    // 4. Restore columns in product_variants table
    console.log('Restoring columns in product_variants table...');
    await sql`ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS name VARCHAR(255)`;
    console.log('✅ Restored columns in product_variants table');

    // 5. Restore tables (optional, but good for completeness if old code used them)
    // We won't restore tables (wishlist, payments) as they were likely unused even in old code, 
    // but columns in active tables are critical.

    console.log('✨ Database restoration completed successfully!');
  } catch (error) {
    console.error('❌ Critical error during restoration:', error);
  } finally {
    await sql.end();
  }
}

restoreDatabase();
