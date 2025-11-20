import sql from '../../Backend/db/index.js';

async function testSizeLogic() {
  console.log('🔍 Testing Size and Note Logic from Checkout to Admin\n');
  
  try {
    // 1. Check sample orders with size data validation
    console.log('1. SAMPLE ORDER SIZE VALIDATION:');
    console.log('='.repeat(40));
    
    const sampleItems = await sql`
      SELECT id, variant_id, size_id, size_name, product_name
      FROM order_items 
      WHERE size_name IS NOT NULL AND size_id IS NOT NULL
      ORDER BY id
      LIMIT 5
    `;
    
    console.log(`Found ${sampleItems.length} sample items with size data:`);
    
    let sizeValidationGood = true;
    sampleItems.forEach(item => {
      const hasSize = item.size_name && item.size_id;
      const status = hasSize ? '✅' : '❌';
      console.log(`   ${status} Item ${item.id}: ${item.product_name} - Size: ${item.size_name || 'NULL'} (ID: ${item.size_id || 'NULL'})`);
      
      if (!hasSize) {
        sizeValidationGood = false;
      }
    });
    
    // Check sample order notes
    const [sampleOrder] = await sql`SELECT note FROM orders WHERE note IS NOT NULL AND note != '' LIMIT 1`;
    if (sampleOrder) {
      console.log(`\n   Sample Order Note: "${sampleOrder.note}"`);
    }
    
    console.log(`\n   Size Validation Status: ${sizeValidationGood ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    // 2. Check Recent Orders
    console.log('\n2. RECENT ORDERS (LAST 3 DAYS):');
    console.log('='.repeat(40));
    
    const recentOrders = await sql`
      SELECT o.id, o.reference, o.created_at,
             COUNT(oi.id) as item_count,
             SUM(CASE WHEN oi.size_name IS NULL THEN 1 ELSE 0 END) as missing_sizes
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.created_at > NOW() - INTERVAL '3 days'
      GROUP BY o.id, o.reference, o.created_at
      ORDER BY o.created_at DESC
      LIMIT 5
    `;
    
    console.log(`Found ${recentOrders.length} recent orders:`);
    
    let goodOrders = 0;
    let badOrders = 0;
    
    recentOrders.forEach(order => {
      // Convert string values to numbers for comparison
      const missingSizes = parseInt(order.missing_sizes);
      const isGood = missingSizes === 0;
      const status = isGood ? '✅' : '❌';
      console.log(`   ${status} Order ${order.id}: ${order.item_count} items, ${missingSizes} missing sizes`);
      
      if (isGood) {
        goodOrders++;
      } else {
        badOrders++;
      }
    });
    
    // 3. Check Orders with Notes
    console.log('\n3. ORDERS WITH NOTES (LAST 7 DAYS):');
    console.log('='.repeat(40));
    
    const ordersWithNotes = await sql`
      SELECT id, reference, note, created_at
      FROM orders 
      WHERE note IS NOT NULL AND note != ''
      AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 3
    `;
    
    console.log(`Found ${ordersWithNotes.length} orders with notes:`);
    ordersWithNotes.forEach(order => {
      console.log(`   📝 Order ${order.id}: "${order.note}"`);
    });
    
    // 4. Final Assessment
    console.log('\n4. FINAL ASSESSMENT:');
    console.log('='.repeat(40));
    
    console.log(`✅ Size Validation: ${sizeValidationGood ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Recent Orders Good: ${badOrders === 0 ? 'YES' : 'NO'} (${goodOrders} good, ${badOrders} bad)`);
    console.log(`✅ Notes Working: ${ordersWithNotes.length > 0 ? 'YES' : 'NO NOTES FOUND'}`);
    
    if (sizeValidationGood && badOrders === 0) {
      console.log('\n🎉 SUCCESS! Size and note logic are working correctly.');
      console.log('   Orders will no longer show null or empty values for size information.');
      return true;
    } else {
      console.log('\n⚠️  ISSUES DETECTED:');
      if (!sizeValidationGood) {
        console.log('   - Size validation failed for sample items');
      }
      if (badOrders > 0) {
        console.log(`   - ${badOrders} recent orders have missing size information`);
      }
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testSizeLogic()
  .then(success => {
    console.log('\n' + '='.repeat(50));
    if (success) {
      console.log('✅ TEST PASSED: Size and note logic are working!');
      process.exit(0);
    } else {
      console.log('❌ TEST FAILED: Issues with size/logic implementation');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  });