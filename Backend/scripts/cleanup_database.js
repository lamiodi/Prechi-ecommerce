import sql from '../db/index.js';

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...');

  try {
    // 1. Drop unused tables
    console.log('Removing unused tables...');
    
    // Check and drop wishlist table
    try {
      await sql`DROP TABLE IF EXISTS wishlist`;
      console.log('✅ Dropped wishlist table');
    } catch (e) {
      console.log('⚠️ Error dropping wishlist table (might not exist):', e.message);
    }

    // Check and drop payments table (redundant with orders)
    try {
      await sql`DROP TABLE IF EXISTS payments`;
      console.log('✅ Dropped payments table');
    } catch (e) {
      console.log('⚠️ Error dropping payments table:', e.message);
    }

    // Check and drop review_votes table
    try {
      await sql`DROP TABLE IF EXISTS review_votes`;
      console.log('✅ Dropped review_votes table');
    } catch (e) {
      console.log('⚠️ Error dropping review_votes table:', e.message);
    }

    // 2. Remove redundant columns
    console.log('Removing redundant columns...');

    // Helper to drop column if exists
    const dropColumn = async (table, column) => {
      try {
        await sql`ALTER TABLE ${sql(table)} DROP COLUMN IF EXISTS ${sql(column)}`;
        console.log(`✅ Dropped column ${table}.${column}`);
      } catch (e) {
        console.log(`⚠️ Error dropping column ${table}.${column}:`, e.message);
      }
    };

    // Orders table
    await dropColumn('orders', 'total_ngn');
    await dropColumn('orders', 'base_currency_total');
    await dropColumn('orders', 'converted_total');
    await dropColumn('orders', 'email_sent');
    await dropColumn('orders', 'shipping_method_id');

    // Cart items table
    await dropColumn('cart_items', 'product_id');
    await dropColumn('cart_items', 'user_id');
    await dropColumn('cart_items', 'color_name');
    await dropColumn('cart_items', 'size_name');

    // Bundles table
    await dropColumn('bundles', 'product_id');

    // Product variants table
    await dropColumn('product_variants', 'name');

    // Reviews table
    await dropColumn('reviews', 'size');
    await dropColumn('reviews', 'color');

    console.log('✨ Database cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Critical error during cleanup:', error);
  } finally {
    await sql.end();
  }
}

cleanupDatabase();
