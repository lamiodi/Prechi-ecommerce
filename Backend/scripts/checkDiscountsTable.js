import sql from '../db/index.js';

async function checkDiscountsTable() {
  try {
    // Check if table exists
    const [tableExists] = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'discounts'
      )
    `;
    
    console.log('Discounts table exists:', tableExists.exists);
    
    if (!tableExists.exists) {
      console.log('Creating discounts table...');
      
      await sql`
        CREATE TABLE discounts (
          id SERIAL PRIMARY KEY,
          code VARCHAR(50) UNIQUE NOT NULL,
          discount_type VARCHAR(20) NOT NULL,
          discount_value DECIMAL(10,2) NOT NULL,
          start_date DATE,
          end_date DATE,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      
      console.log('✅ Discounts table created successfully');
    } else {
      // Check table structure
      const columns = await sql`
        SELECT column_name, data_type, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'discounts'
        ORDER BY ordinal_position
      `;
      
      console.log('Discounts table structure:');
      columns.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.column_default})`);
      });
    }
    
    // Test query
    const discounts = await sql`
      SELECT COUNT(*) as count FROM discounts
    `;
    
    console.log('Current discount count:', discounts[0].count);
    
  } catch (error) {
    console.error('Error checking discounts table:', error);
  } finally {
    await sql.end();
  }
}

checkDiscountsTable();