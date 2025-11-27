import sql from '../db/index.js';

async function testAdminAPIs() {
  try {
    console.log('Testing admin APIs...\n');
    
    // Test 1: Check if admin user exists
    const adminUser = await sql`
      SELECT id, email, first_name, last_name, is_admin 
      FROM users 
      WHERE email = 'admin@prechi.com'
    `;
    
    if (adminUser.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:', adminUser[0].email);
    
    // Test 2: Check orders table
    const ordersCount = await sql`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE deleted_at IS NULL
    `;
    
    console.log('✅ Orders table has', ordersCount[0].count, 'orders');
    
    // Test 3: Check if we can run the admin orders query
    const orders = await sql`
      SELECT 
        o.id,
        o.user_id,
        o.created_at AS order_date,
        o.total AS total_amount,
        o.status,
        o.subtotal,
        o.discount,
        o.payment_method,
        o.payment_status,
        o.reference,
        o.updated_at,
        o.delivery_fee,
        o.email_sent,
        o.idempotency_key,
        u.email AS user_email,
        u.first_name,
        u.last_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.deleted_at IS NULL
      ORDER BY o.created_at DESC
      LIMIT 5
    `;
    
    console.log('✅ Admin orders query successful, found', orders.length, 'orders');
    
    // Test 4: Check addresses for shipping/billing
    const addresses = await sql`
      SELECT COUNT(*) as count 
      FROM addresses 
      WHERE deleted_at IS NULL
    `;
    
    console.log('✅ Addresses table has', addresses[0].count, 'addresses');
    
    // Test 5: Check billing addresses
    const billingAddresses = await sql`
      SELECT COUNT(*) as count 
      FROM billing_addresses 
      WHERE deleted_at IS NULL
    `;
    
    console.log('✅ Billing addresses table has', billingAddresses[0].count, 'billing addresses');
    
    // Test 6: Check newsletter subscribers table
    const newsletterCount = await sql`
      SELECT COUNT(*) as count 
      FROM newsletter_subscribers
    `;
    
    console.log('✅ Newsletter subscribers table has', newsletterCount[0].count, 'subscribers');
    
    // Test 7: Check discounts table
    const discountsCount = await sql`
      SELECT COUNT(*) as count 
      FROM discounts
    `;
    
    console.log('✅ Discounts table has', discountsCount[0].count, 'discounts');
    
    console.log('\n🎉 All admin API tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sql.end();
  }
}

testAdminAPIs();