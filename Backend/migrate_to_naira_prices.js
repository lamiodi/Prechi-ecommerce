import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL, {
  prepare: false
});

// Exchange rate: 1 USD = 1455 NGN (current rate as of Nov 2024)
const USD_TO_NGN_RATE = 1455;

async function migrateToNairaPrices() {
  try {
    console.log('💱 Starting migration to Naira prices...');
    console.log(`📊 Exchange rate: 1 USD = ${USD_TO_NGN_RATE} NGN`);

    // Update products table
    console.log('\n🔄 Updating products table...');
    const updatedProducts = await sql`
      UPDATE public.products 
      SET base_price = base_price * ${USD_TO_NGN_RATE}
      WHERE base_price < 1000 -- Only convert if price is still in USD (less than 1000)
      RETURNING id, name, base_price
    `;
    console.log(`✅ Updated ${updatedProducts.length} products to Naira prices`);
    
    // Show sample conversions
    if (updatedProducts.length > 0) {
      console.log('📋 Sample product conversions:');
      updatedProducts.slice(0, 3).forEach(product => {
        console.log(`   - ${product.name}: ₦${product.base_price.toLocaleString()}`);
      });
    }

    // Update bundles table
    console.log('\n🔄 Updating bundles table...');
    const updatedBundles = await sql`
      UPDATE public.bundles 
      SET bundle_price = bundle_price * ${USD_TO_NGN_RATE}
      WHERE bundle_price < 1000 -- Only convert if price is still in USD (less than 1000)
      RETURNING id, name, bundle_price
    `;
    console.log(`✅ Updated ${updatedBundles.length} bundles to Naira prices`);
    
    // Show sample conversions
    if (updatedBundles.length > 0) {
      console.log('📋 Sample bundle conversions:');
      updatedBundles.slice(0, 3).forEach(bundle => {
        console.log(`   - ${bundle.name}: ₦${bundle.bundle_price.toLocaleString()}`);
      });
    }

    // Update cart_items table
    console.log('\n🔄 Updating cart_items table...');
    const updatedCartItems = await sql`
      UPDATE public.cart_items 
      SET price = price * ${USD_TO_NGN_RATE}
      WHERE price < 1000 -- Only convert if price is still in USD (less than 1000)
      RETURNING id, price, quantity
    `;
    console.log(`✅ Updated ${updatedCartItems.length} cart items to Naira prices`);

    // Add currency column to track currency type
    console.log('\n🏷️ Adding currency tracking...');
    
    // Add currency column to products table
    try {
      await sql.unsafe(`
        ALTER TABLE public.products 
        ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'NGN'
      `);
      console.log('✅ Added currency column to products table');
    } catch (err) {
      console.log('ℹ️ Currency column already exists in products table');
    }

    // Add currency column to bundles table
    try {
      await sql.unsafe(`
        ALTER TABLE public.bundles 
        ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'NGN'
      `);
      console.log('✅ Added currency column to bundles table');
    } catch (err) {
      console.log('ℹ️ Currency column already exists in bundles table');
    }

    // Add currency column to cart_items table
    try {
      await sql.unsafe(`
        ALTER TABLE public.cart_items 
        ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'NGN'
      `);
      console.log('✅ Added currency column to cart_items table');
    } catch (err) {
      console.log('ℹ️ Currency column already exists in cart_items table');
    }

    // Update currency values
    await sql.unsafe(`UPDATE public.products SET currency = 'NGN' WHERE currency IS NULL`);
    await sql.unsafe(`UPDATE public.bundles SET currency = 'NGN' WHERE currency IS NULL`);
    await sql.unsafe(`UPDATE public.cart_items SET currency = 'NGN' WHERE currency IS NULL`);

    console.log('\n🎉 Migration to Naira prices completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Products updated: ${updatedProducts.length}`);
    console.log(`   - Bundles updated: ${updatedBundles.length}`);
    console.log(`   - Cart items updated: ${updatedCartItems.length}`);
    console.log(`   - Currency columns added/updated: ✅`);
    console.log('\n💡 Next steps:');
    console.log('   - Update your frontend to display ₦ symbol instead of $');
    console.log('   - Implement exchange rate API integration for currency conversion');
    console.log('   - Update price formatting to use Nigerian locale');

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the migration
migrateToNairaPrices().catch(console.error);