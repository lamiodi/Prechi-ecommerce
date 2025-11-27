import sql from '../db/index.js';

async function checkNewsletterTable() {
  try {
    // Check if table exists
    const [tableExists] = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'newsletter_subscribers'
      )
    `;
    
    console.log('Table exists:', tableExists.exists);
    
    if (!tableExists.exists) {
      console.log('Creating newsletter_subscribers table...');
      
      await sql`
        CREATE TABLE newsletter_subscribers (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          subscribed_at TIMESTAMP DEFAULT NOW(),
          unsubscribed_at TIMESTAMP DEFAULT NULL
        )
      `;
      
      console.log('✅ Table created successfully');
    } else {
      // Check table structure
      const columns = await sql`
        SELECT column_name, data_type, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'newsletter_subscribers'
        ORDER BY ordinal_position
      `;
      
      console.log('Table structure:');
      columns.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.column_default})`);
      });
    }
    
    // Test query
    const subscribers = await sql`
      SELECT COUNT(*) as count FROM newsletter_subscribers
    `;
    
    console.log('Current subscriber count:', subscribers[0].count);
    
  } catch (error) {
    console.error('Error checking newsletter table:', error);
  } finally {
    await sql.end();
  }
}

checkNewsletterTable();