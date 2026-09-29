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

async function testCartSizePricing() {
  console.log('🧪 Testing Cart and Size Pricing Enforcement...\n');

  try {
    // 1. Verify sizes for Product 47 (Men Bright Set)
    console.log('1️⃣ Verifying Variant 70 (Black) & Variant 78 (White) for Product 47:');
    const p47Sizes = await sql`
      SELECT vs.variant_id, pv.sku, c.color_name, s.size_name, vs.price, vs.stock_quantity
      FROM variant_sizes vs
      JOIN product_variants pv ON vs.variant_id = pv.id
      JOIN colors c ON pv.color_id = c.id
      JOIN sizes s ON vs.size_id = s.id
      WHERE pv.product_id = 47
      ORDER BY vs.variant_id, s.id
    `;
    console.table(p47Sizes);

    // 2. Verify all zero price checks across all variant_sizes in DB
    const invalidSizes = await sql`
      SELECT COUNT(*) as count FROM variant_sizes WHERE price IS NULL OR price <= 0
    `;
    console.log(`\n2️⃣ Total variant_sizes with price <= 0 in DB: ${invalidSizes[0].count}`);
    if (invalidSizes[0].count === 0) {
      console.log('   ✅ All size prices in database are positive and valid!');
    }

    // Fetch a user id for mock cart
    const [user] = await sql`SELECT id FROM users LIMIT 1`;
    const userId = user ? user.id : 1;

    // Create a temporary cart
    const [testCart] = await sql`
      INSERT INTO cart (user_id, created_at, updated_at)
      VALUES (${userId}, NOW(), NOW())
      RETURNING id
    `;
    const cartId = testCart.id;
    console.log(`   Created temporary test cart ID: ${cartId}`);

    // Fetch size IDs for 'S' and '3XL'
    const [sizeS] = await sql`SELECT id FROM sizes WHERE size_name = 'S'`;
    const [size3XL] = await sql`SELECT id FROM sizes WHERE size_name = '3XL'`;

    // Add item 1: Variant 78 (White) Size S (Expected price: 85,000)
    await sql`
      INSERT INTO cart_items (cart_id, variant_id, size_id, quantity, is_bundle, price)
      VALUES (${cartId}, 78, ${sizeS.id}, 1, false, 85000.00)
    `;

    // Add item 2: Variant 78 (White) Size 3XL (Expected price: 90,000)
    await sql`
      INSERT INTO cart_items (cart_id, variant_id, size_id, quantity, is_bundle, price)
      VALUES (${cartId}, 78, ${size3XL.id}, 2, false, 90000.00)
    `;

    // Query cart items via get_cart_items_optimized
    const cartItems = await sql`
      SELECT cart_item_id, quantity, item_data
      FROM get_cart_items_optimized(${cartId})
    `;

    console.log('\n   Returned items from get_cart_items_optimized:');
    let subtotal = 0;
    for (const row of cartItems) {
      const item = row.item_data;
      const price = Number(item.price);
      const total = price * row.quantity;
      subtotal += total;
      console.log(`   - Cart Item ${row.cart_item_id}: ${item.name} (${item.color}, Size ${item.size}) -> Qty ${row.quantity} x ₦${price.toLocaleString()} = ₦${total.toLocaleString()}`);
    }

    console.log(`\n   Calculated Subtotal: ₦${subtotal.toLocaleString()} (Expected: ₦${(85000 + 2 * 90000).toLocaleString()})`);

    // Clean up temporary test cart
    await sql`DELETE FROM cart_items WHERE cart_id = ${cartId}`;
    await sql`DELETE FROM cart WHERE id = ${cartId}`;
    console.log('\n   Cleaned up temporary test cart.');

    if (subtotal === 85000 + 2 * 90000) {
      console.log('\n✅ TEST PASSED: Size-specific pricing correctly enforced in DB & stored function!');
    } else {
      console.error('\n❌ TEST FAILED: Subtotal mismatch!');
    }

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await sql.end();
  }
}

testCartSizePricing();
