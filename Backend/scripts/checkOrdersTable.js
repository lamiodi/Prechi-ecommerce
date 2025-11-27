import sql from '../db/index.js';

async function checkOrdersTable() {
  try {
    // Check if orders table has all required columns
    const columns = await sql`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
      ORDER BY ordinal_position
    `;
    
    console.log('Orders table columns:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Test the query from getAllOrdersForAdmin
    const orders = await sql`
      SELECT 
        o.id,
        o.user_id,
        o.created_at AS order_date,
        o.total AS total_amount,
        o.status,
        o.shipping_method,
        o.shipping_cost,
        o.payment_method,
        o.payment_status,
        o.reference,
        o.updated_at,
        o.address_id,
        o.billing_address_id,
        o.currency,
        o.delivery_fee,
        o.delivery_fee_paid,
        u.email AS user_email,
        u.first_name,
        u.last_name,
        u.is_temporary,
        COALESCE(a.country, o.shipping_country) AS shipping_country
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN addresses a ON o.address_id = a.id
      WHERE o.deleted_at IS NULL
      ORDER BY o.created_at DESC
      LIMIT 5
    `;
    
    console.log('✅ Orders query successful, found', orders.length, 'orders');
    
  } catch (error) {
    console.error('Error checking orders table:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sql.end();
  }
}

checkOrdersTable();