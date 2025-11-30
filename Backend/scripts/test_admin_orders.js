import sql from '../db/index.js';

const testAdminOrders = async () => {
  try {
    console.log('Testing getAllOrdersForAdmin logic...');
    
    // Create test data
    console.log('Creating test user and order...');
    const [user] = await sql`
      INSERT INTO users (first_name, last_name, email, password, is_admin)
      VALUES ('Test', 'User', 'test@example.com', 'hashedpassword', false)
      RETURNING id
    `;
    
    const [order] = await sql`
      INSERT INTO orders (user_id, total, status, reference)
      VALUES (${user.id}, 1000, 'pending', 'TEST-REF-123')
      RETURNING id
    `;
    console.log(`Created User ID: ${user.id}, Order ID: ${order.id}`);

    const page = 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = 'TEST'; // Try with search term
    const status = 'all';

    let queryConditions = sql`o.deleted_at IS NULL`;
    
    if (search) {
      const searchPattern = `%${search}%`;
      queryConditions = sql`${queryConditions} AND (
        o.reference ILIKE ${searchPattern} OR
        u.email ILIKE ${searchPattern} OR
        u.first_name ILIKE ${searchPattern} OR
        u.last_name ILIKE ${searchPattern}
      )`;
    }

    if (status !== 'all') {
      queryConditions = sql`${queryConditions} AND o.status = ${status}`;
    }

    console.log('Query Conditions constructed.');

    // Get total count
    console.log('Executing count query...');
    const [countResult] = await sql`
      SELECT COUNT(*) as count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE ${queryConditions}
    `;
    console.log('Count result:', countResult);
    
    const totalOrders = parseInt(countResult.count);
    console.log('Total orders:', totalOrders);

    console.log('Executing orders query...');
    const orders = await sql`
      SELECT 
        o.id,
        o.reference
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE ${queryConditions}
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    console.log('Fetched orders:', orders.length);
    
    // Cleanup
    console.log('Cleaning up test data...');
    await sql`DELETE FROM orders WHERE id = ${order.id}`;
    await sql`DELETE FROM users WHERE id = ${user.id}`;
    
    console.log('✅ Test passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sql.end();
  }
};

testAdminOrders();
