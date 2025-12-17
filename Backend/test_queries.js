
import sql from './db/index.js';
import crypto from 'crypto';

const runTests = async () => {
  console.log('Starting SQL Query Verification Tests...');

  try {
    // 1. Get a valid User ID and Order ID for testing
    console.log('\n--- Setup: Fetching/Creating Test Data ---');
    
    // Ensure User
    let [user] = await sql`SELECT id FROM users LIMIT 1`;
    if (!user) {
      console.log('Creating test user...');
      const randomStr = crypto.randomBytes(4).toString('hex');
      [user] = await sql`
        INSERT INTO users (email, first_name, last_name, password, is_active, is_admin)
        VALUES (${`test_${randomStr}@example.com`}, 'Test', 'User', 'hashedpass', true, true)
        RETURNING id
      `;
    }
    console.log(`✅ Test User ID: ${user.id}`);

    // Ensure Address
    let [address] = await sql`SELECT id FROM addresses WHERE user_id = ${user.id} LIMIT 1`;
    if (!address) {
      console.log('Creating test address...');
      [address] = await sql`
        INSERT INTO addresses (user_id, title, address_line_1, city, state, zip_code, country)
        VALUES (${user.id}, 'Home', '123 Test St', 'Lagos', 'Lagos', '100001', 'Nigeria')
        RETURNING id
      `;
    }
    console.log(`✅ Test Address ID: ${address.id}`);

    // Ensure Billing Address
    let [billingAddress] = await sql`SELECT id FROM billing_addresses WHERE user_id = ${user.id} LIMIT 1`;
    if (!billingAddress) {
      console.log('Creating test billing address...');
      [billingAddress] = await sql`
        INSERT INTO billing_addresses (user_id, full_name, email, address_line_1, city, state, zip_code, country)
        VALUES (${user.id}, 'Test User', 'test@example.com', '123 Test St', 'Lagos', 'Lagos', '100001', 'Nigeria')
        RETURNING id
      `;
    }
    console.log(`✅ Test Billing Address ID: ${billingAddress.id}`);

    // Ensure Order
    let [order] = await sql`SELECT id, reference, user_id FROM orders WHERE deleted_at IS NULL LIMIT 1`;
    if (!order) {
      console.log('Creating test order...');
      const ref = `ORD-${Date.now()}`;
      [order] = await sql`
        INSERT INTO orders (
          user_id, address_id, billing_address_id, total, status, payment_status, 
          reference, shipping_method, currency, shipping_cost, tax, delivery_fee_paid
        ) VALUES (
          ${user.id}, ${address.id}, ${billingAddress.id}, 5000, 'pending', 'pending',
          ${ref}, 'Standard Delivery', 'NGN', 1000, 0, false
        )
        RETURNING id, reference, user_id
      `;
    }
    console.log(`✅ Test Order ID: ${order.id}, Reference: ${order.reference}`);

    const userId = user.id;
    const orderId = order.id;
    const reference = order.reference;

    // 2. Test orderController.js - verifyOrderByReference (modified query)
    if (reference) {
      console.log('\n--- Testing orderController.js queries ---');
      try {
        const [res] = await sql`
          SELECT 
            o.id, o.user_id, o.total, o.discount, o.tax, o.shipping_method, o.shipping_cost, a.country as shipping_country, 
            o.payment_method, o.payment_status, o.status, o.created_at, o.reference, o.note, o.currency,
            o.delivery_fee_paid
          FROM orders o
          LEFT JOIN addresses a ON o.address_id = a.id
          WHERE o.reference = ${reference} AND o.deleted_at IS NULL
        `;
        console.log('✅ verifyOrderByReference query: Success');
      } catch (err) {
        console.error('❌ verifyOrderByReference query: Failed', err.message);
      }
      
      try {
          const [res] = await sql`
            SELECT 
                o.*, 
                u.first_name, u.last_name, u.email,
                a.country as shipping_country
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN addresses a ON o.address_id = a.id
            WHERE o.id = ${orderId} AND o.deleted_at IS NULL
            `;
            console.log('✅ getOrderById query: Success');
      } catch (err) {
        console.error('❌ getOrderById query: Failed', err.message);
      }
      
      try {
         const res = await sql`
            SELECT 
                o.id, o.user_id, o.total, o.discount, o.tax, o.shipping_method, o.shipping_cost, a.country as shipping_country, 
                o.payment_method, o.payment_status, o.status, o.created_at, o.reference, o.note, o.currency
            FROM orders o
            LEFT JOIN addresses a ON o.address_id = a.id
            WHERE o.user_id = ${userId} AND o.deleted_at IS NULL
            ORDER BY o.created_at DESC
         `;
         console.log('✅ getOrdersByUser query: Success');
      } catch (err) {
         console.error('❌ getOrdersByUser query: Failed', err.message);
      }
    }

    // 3. Test adminController.js - getCompleteOrderDetails (modified query)
    if (orderId) {
      console.log('\n--- Testing adminController.js queries ---');
      try {
        const [res] = await sql`
           SELECT o.*, a.country as shipping_country
           FROM orders o
           LEFT JOIN addresses a ON o.address_id = a.id
           WHERE o.id = ${orderId} AND o.deleted_at IS NULL
        `;
        console.log('✅ setDeliveryFee check query: Success');
      } catch (err) {
        console.error('❌ setDeliveryFee check query: Failed', err.message);
      }

       try {
        const [res] = await sql`
            SELECT user_id
            FROM orders 
            WHERE id = ${orderId}
        `;
        console.log('✅ getOrderShippingAddress/BillingAddress check query: Success');
       } catch (err) {
        console.error('❌ getOrderShippingAddress/BillingAddress check query: Failed', err.message);
       }
    }

    // 4. Test paystackController.js - initializeDeliveryFeePayment (modified query)
    if (orderId) {
      console.log('\n--- Testing paystackController.js queries ---');
      try {
        const [res] = await sql`
          SELECT 
            o.id, o.total, o.currency, o.payment_status, 
            a.country as shipping_country,
            o.delivery_fee, o.delivery_fee_paid,
            u.email as user_email, u.first_name as user_first_name, u.is_temporary,
            ba.email as billing_email, ba.full_name as billing_full_name,
            COALESCE(u.email, ba.email) as email,
            COALESCE(u.first_name, ba.full_name) as first_name
          FROM orders o
          JOIN users u ON o.user_id = u.id
          LEFT JOIN billing_addresses ba ON o.billing_address_id = ba.id
          LEFT JOIN addresses a ON o.address_id = a.id
          WHERE o.id = ${orderId} AND o.deleted_at IS NULL
        `;
        console.log('✅ initializeDeliveryFeePayment query: Success');
      } catch (err) {
        console.error('❌ initializeDeliveryFeePayment query: Failed', err.message);
      }
    }

    // 5. Test webhookRoutes.js - handleSuccessfulPayment (modified query)
    if (reference) {
      console.log('\n--- Testing webhookRoutes.js queries ---');
      try {
        const [res] = await sql`
          SELECT 
            o.id, 
            o.payment_status, 
            o.user_id, 
            o.total, 
            o.currency, 
            o.email_sent, 
            o.cart_id,
            o.delivery_fee,
            o.delivery_fee_paid,
            a.country as shipping_country,
            u.email as user_email,
            u.first_name as user_first_name,
            u.last_name as user_last_name,
            u.is_temporary,
            ba.full_name as billing_full_name,
            ba.email as billing_email,
            a.address_line_1,
            a.city,
            a.state,
            a.zip_code
          FROM orders o
          LEFT JOIN users u ON o.user_id = u.id
          LEFT JOIN billing_addresses ba ON o.billing_address_id = ba.id
          LEFT JOIN addresses a ON o.address_id = a.id
          WHERE o.reference = ${reference} AND o.deleted_at IS NULL
        `;
        console.log('✅ handleSuccessfulPayment query: Success');
      } catch (err) {
        console.error('❌ handleSuccessfulPayment query: Failed', err.message);
      }
    }
    
    // 6. Test userController.js - getUserOrders (modified query)
    if (userId) {
        console.log('\n--- Testing userController.js queries ---');
        try {
            const res = await sql`
              SELECT 
                o.id, o.reference, o.total, o.currency, o.payment_status, 
                a.country AS shipping_country, o.created_at, o.updated_at, 
                o.delivery_fee, o.delivery_fee_paid,
                a.title AS shipping_address_title,
                a.address_line_1 AS shipping_address_line_1,
                a.landmark AS shipping_address_landmark,
                a.city AS shipping_address_city,
                a.state AS shipping_address_state,
                a.zip_code AS shipping_address_zip_code,
                a.country AS shipping_address_country,
                ba.full_name AS billing_address_full_name,
                ba.email AS billing_address_email,
                ba.phone_number AS billing_address_phone_number,
                ba.address_line_1 AS billing_address_line_1,
                ba.city AS billing_address_city,
                ba.state AS billing_address_state,
                ba.zip_code AS billing_address_zip_code,
                ba.country AS billing_address_country,
                COALESCE(
                  json_agg(
                    json_build_object(
                      'id', oi.id,
                      'variant_id', oi.variant_id,
                      'bundle_id', oi.bundle_id,
                      'quantity', oi.quantity,
                      'price', oi.price,
                      'product_name', oi.product_name,
                      'image_url', oi.image_url,
                      'color_name', oi.color_name,
                      'size_name', oi.size_name,
                      'bundle_details', oi.bundle_details
                    )
                  ), '[]'::json
                ) AS items
              FROM orders o
              LEFT JOIN order_items oi ON o.id = oi.order_id
              LEFT JOIN addresses a ON o.address_id = a.id
              LEFT JOIN billing_addresses ba ON o.billing_address_id = ba.id
              WHERE o.user_id = ${userId} AND o.deleted_at IS NULL
              GROUP BY o.id, a.title, a.address_line_1, a.landmark, a.city, a.state, a.zip_code, a.country,
                       ba.full_name, ba.email, ba.phone_number, ba.address_line_1, ba.city, ba.state, ba.zip_code, ba.country
              ORDER BY o.created_at DESC
            `;
            console.log('✅ getUserOrders query: Success');
        } catch (err) {
            console.error('❌ getUserOrders query: Failed', err.message);
        }
    }
    
    // 7. Test emailService.js - sendOrderConfirmationEmail (modified query)
    if (orderId) {
        console.log('\n--- Testing emailService.js queries ---');
        try {
            const [res] = await sql`
                SELECT 
                  o.id, o.reference, o.payment_status, o.payment_method, o.shipping_method, o.shipping_cost,
                  o.delivery_fee, o.delivery_fee_paid, o.created_at, a.country AS shipping_country,
                  a.title AS shipping_address_title, a.address_line_1 AS shipping_address_line_1, 
                  a.landmark AS shipping_address_landmark, a.city AS shipping_address_city, 
                  a.state AS shipping_address_state, a.zip_code AS shipping_address_zip_code, 
                  a.country AS shipping_address_country,
                  ba.full_name AS billing_address_full_name, ba.address_line_1 AS billing_address_line_1, 
                  ba.city AS billing_address_city, ba.state AS billing_address_state, 
                  ba.zip_code AS billing_address_zip_code, ba.country AS billing_address_country, 
                  ba.email AS billing_address_email, ba.phone_number AS billing_address_phone_number
                FROM orders o
                LEFT JOIN addresses a ON o.address_id = a.id
                LEFT JOIN billing_addresses ba ON o.billing_address_id = ba.id
                WHERE o.id = ${orderId}
            `;
             console.log('✅ sendOrderConfirmationEmail query: Success');
        } catch (err) {
             console.error('❌ sendOrderConfirmationEmail query: Failed', err.message);
        }
    }


  } catch (err) {
    console.error('Global Error:', err);
  } finally {
    await sql.end();
  }
};

runTests();
