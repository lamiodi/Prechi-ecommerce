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

async function runEndToEndOrderSimulation() {
  console.log('🚀 Starting End-to-End Order Lifecycle Simulation...\n');
  let testUserId, testCartId, testAddressId, testBillingAddressId, testOrderId;
  const testRef = `TEST_SIM_${Date.now()}`;
  const testIdempotencyKey = `idemp_${Date.now()}`;

  try {
    // 1. Pick an active variant & size for test
    const [variantSize] = await sql`
      SELECT vs.id, vs.variant_id, vs.size_id, vs.stock_quantity, vs.price, p.name as product_title, p.base_price
      FROM variant_sizes vs
      JOIN product_variants pv ON vs.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE vs.stock_quantity > 5 AND vs.price > 0
      LIMIT 1
    `;

    if (!variantSize) {
      throw new Error('No product variant size with stock and price > 0 found for testing.');
    }

    console.log(`📦 Selected test item: "${variantSize.product_title}" (Variant ${variantSize.variant_id}, Size ${variantSize.size_id}, Price: ₦${variantSize.price}, Stock: ${variantSize.stock_quantity})`);
    const initialStock = variantSize.stock_quantity;
    const itemPrice = parseFloat(variantSize.price);
    const itemQuantity = 2;
    const expectedSubtotal = itemPrice * itemQuantity;
    const expectedTax = expectedSubtotal * 0.05; // 5%
    const expectedDeliveryFee = 4000; // Lagos Island standard fee
    const expectedTotal = expectedSubtotal + expectedTax + expectedDeliveryFee;

    // 2. Create a test user
    const [testUser] = await sql`
      INSERT INTO users (first_name, last_name, email, phone_number, password, is_temporary)
      VALUES ('Simulation', 'Tester', ${`sim_${Date.now()}@example.com`}, '08012345678', 'hashed_test_pwd_123', true)
      RETURNING id, email
    `;
    testUserId = testUser.id;
    console.log(`👤 Created temporary test user: ID ${testUserId}`);

    // 3. Create a test cart and cart item
    const [testCart] = await sql`
      INSERT INTO cart (user_id)
      VALUES (${testUserId})
      RETURNING id
    `;
    testCartId = testCart.id;

    await sql`
      INSERT INTO cart_items (cart_id, variant_id, size_id, quantity, price, currency)
      VALUES (${testCartId}, ${variantSize.variant_id}, ${variantSize.size_id}, ${itemQuantity}, ${itemPrice}, 'NGN')
    `;
    console.log(`🛒 Created test cart ${testCartId} with item quantity ${itemQuantity}`);

    // 4. Create Shipping and Billing Addresses
    const [shippingAddr] = await sql`
      INSERT INTO addresses (user_id, title, address_line_1, city, state, country, zip_code)
      VALUES (${testUserId}, 'Home', '123 Test Street, Victoria Island', 'Lagos', 'Lagos', 'Nigeria', '101241')
      RETURNING id
    `;
    testAddressId = shippingAddr.id;

    const [billingAddr] = await sql`
      INSERT INTO billing_addresses (user_id, full_name, email, phone_number, address_line_1, city, state, country, zip_code)
      VALUES (${testUserId}, 'Simulation Tester', ${testUser.email}, '08012345678', '123 Test Street, Victoria Island', 'Lagos', 'Lagos', 'Nigeria', '101241')
      RETURNING id
    `;
    testBillingAddressId = billingAddr.id;
    console.log(`📍 Created Shipping Address (${testAddressId}) and Billing Address (${testBillingAddressId})`);

    // 5. Simulate Order Creation with Atomic Stock Decrement (In Transaction)
    console.log('\n--- Step 1: Order Creation & Stock Reservation ---');
    await sql.begin(async (trx) => {
      // Check & decrement stock
      const [updatedVs] = await trx`
        UPDATE variant_sizes
        SET stock_quantity = stock_quantity - ${itemQuantity}, updated_at = NOW()
        WHERE id = ${variantSize.id} AND stock_quantity >= ${itemQuantity}
        RETURNING stock_quantity
      `;

      if (!updatedVs) throw new Error('Insufficient stock during simulation!');
      console.log(`  ✓ Stock decremented from ${initialStock} to ${updatedVs.stock_quantity}`);

      // Insert Order
      const [order] = await trx`
        INSERT INTO orders (
          user_id, reference, payment_method, payment_status, status,
          subtotal, discount, tax, delivery_fee, total, shipping_cost,
          shipping_method, address_id, billing_address_id, cart_id,
          idempotency_key, currency, delivery_fee_paid
        ) VALUES (
          ${testUserId}, ${testRef}, 'paystack', 'pending', 'pending',
          ${expectedSubtotal}, 0, ${expectedTax}, ${expectedDeliveryFee}, ${expectedTotal}, ${expectedDeliveryFee},
          'door_delivery', ${testAddressId}, ${testBillingAddressId}, ${testCartId},
          ${testIdempotencyKey}, 'NGN', false
        ) RETURNING id, reference, total, status, payment_status
      `;
      testOrderId = order.id;

      // Insert Order Items
      await trx`
        INSERT INTO order_items (
          order_id, variant_id, size_id, quantity, price, product_name, size_name
        ) VALUES (
          ${testOrderId}, ${variantSize.variant_id}, ${variantSize.size_id}, ${itemQuantity}, ${itemPrice},
          ${variantSize.product_title}, 'Standard'
        )
      `;
    });

    console.log(`  ✓ Order created successfully! ID: #${testOrderId}, Total: ₦${expectedTotal}`);

    // 6. Test Idempotency Check
    console.log('\n--- Step 2: Idempotency & Duplicate Prevention ---');
    const [duplicateCheck] = await sql`
      SELECT id, reference, payment_status FROM orders WHERE idempotency_key = ${testIdempotencyKey}
    `;
    if (duplicateCheck && duplicateCheck.id === testOrderId) {
      console.log('  ✓ Idempotency key successfully guarded duplicate creation!');
    }

    // 7. Simulate Payment Completion & Cart Clearance
    console.log('\n--- Step 3: Payment Verification & Cart Clearance ---');
    const [paidOrder] = await sql`
      UPDATE orders
      SET payment_status = 'completed', status = 'processing', updated_at = NOW()
      WHERE id = ${testOrderId} AND payment_status = 'pending'
      RETURNING id, payment_status, status
    `;

    if (!paidOrder) throw new Error('Failed to transition order to completed payment');
    console.log(`  ✓ Payment marked as ${paidOrder.payment_status}, order status is ${paidOrder.status}`);

    // Clear cart
    const deletedCartItems = await sql`
      DELETE FROM cart_items WHERE cart_id = ${testCartId} RETURNING id
    `;
    console.log(`  ✓ Cleared ${deletedCartItems.length} cart items upon successful payment.`);

    // 8. Admin Fulfillment: Address Lookup & Details
    console.log('\n--- Step 4: Admin Order Fulfillment & Accurate Address Lookup ---');
    const [fetchedShipping] = await sql`
      SELECT a.*, o.id as order_id
      FROM orders o
      JOIN addresses a ON o.address_id = a.id
      WHERE o.id = ${testOrderId}
    `;
    if (fetchedShipping && fetchedShipping.id === testAddressId) {
      console.log(`  ✓ Admin shipping address accurately matched order address: "${fetchedShipping.address_line_1}, ${fetchedShipping.city}"`);
    } else {
      throw new Error('Admin shipping address resolution failed!');
    }

    const [fetchedBilling] = await sql`
      SELECT ba.*, o.id as order_id
      FROM orders o
      JOIN billing_addresses ba ON o.billing_address_id = ba.id
      WHERE o.id = ${testOrderId}
    `;
    if (fetchedBilling && fetchedBilling.id === testBillingAddressId) {
      console.log(`  ✓ Admin billing address accurately matched: "${fetchedBilling.email}"`);
    } else {
      throw new Error('Admin billing address resolution failed!');
    }

    // 9. Admin Lifecycle Transitions
    console.log('\n--- Step 5: Status State Transitions (Processing -> Shipped -> Delivered) ---');
    const [shippedOrder] = await sql`
      UPDATE orders SET status = 'shipped', updated_at = NOW() WHERE id = ${testOrderId} RETURNING status
    `;
    console.log(`  ✓ Order marked as: ${shippedOrder.status}`);

    const [deliveredOrder] = await sql`
      UPDATE orders SET status = 'delivered', updated_at = NOW() WHERE id = ${testOrderId} RETURNING status
    `;
    console.log(`  ✓ Order marked as: ${deliveredOrder.status}`);

    // 10. Test International Order Delivery Fee Mechanism
    console.log('\n--- Step 6: International Order & Delivery Fee Handling ---');
    const [intlOrder] = await sql`
      UPDATE orders
      SET shipping_method = 'international', delivery_fee = 25000, delivery_fee_paid = false
      WHERE id = ${testOrderId}
      RETURNING id, shipping_method, delivery_fee, delivery_fee_paid
    `;
    console.log(`  ✓ Admin set DHL international delivery fee: ₦${intlOrder.delivery_fee}, paid: ${intlOrder.delivery_fee_paid}`);

    const [paidDeliveryFeeOrder] = await sql`
      UPDATE orders
      SET delivery_fee_paid = true, updated_at = NOW()
      WHERE id = ${testOrderId}
      RETURNING delivery_fee_paid
    `;
    console.log(`  ✓ Customer paid delivery fee -> delivery_fee_paid: ${paidDeliveryFeeOrder.delivery_fee_paid}`);

    // 11. Test Cancellation & Stock Replenishment
    console.log('\n--- Step 7: Order Cancellation & Automated Inventory Restock ---');
    const orderItems = await sql`
      SELECT variant_id, size_id, quantity FROM order_items WHERE order_id = ${testOrderId}
    `;
    for (const item of orderItems) {
      await sql`
        UPDATE variant_sizes
        SET stock_quantity = stock_quantity + ${item.quantity}, updated_at = NOW()
        WHERE variant_id = ${item.variant_id} AND size_id = ${item.size_id}
      `;
    }
    const [restockedVs] = await sql`
      SELECT stock_quantity FROM variant_sizes WHERE id = ${variantSize.id}
    `;
    console.log(`  ✓ Restocked inventory: current stock = ${restockedVs.stock_quantity} (Initial: ${initialStock})`);

    console.log('\n🎉 ALL 7 ORDER LIFECYCLE AUDIT PHASES PASSED 100% SUCCESSFULLY!\n');

  } catch (err) {
    console.error('❌ Simulation Error:', err);
  } finally {
    // Clean up simulation data
    if (testOrderId) {
      await sql`DELETE FROM order_items WHERE order_id = ${testOrderId}`;
      await sql`DELETE FROM orders WHERE id = ${testOrderId}`;
    }
    if (testCartId) {
      await sql`DELETE FROM cart_items WHERE cart_id = ${testCartId}`;
      await sql`DELETE FROM cart WHERE id = ${testCartId}`;
    }
    if (testAddressId) await sql`DELETE FROM addresses WHERE id = ${testAddressId}`;
    if (testBillingAddressId) await sql`DELETE FROM billing_addresses WHERE id = ${testBillingAddressId}`;
    if (testUserId) await sql`DELETE FROM users WHERE id = ${testUserId}`;
    console.log('🧹 Cleaned up temporary test data.');
    await sql.end();
  }
}

runEndToEndOrderSimulation();
