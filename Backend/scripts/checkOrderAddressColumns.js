import sql from '../db/index.js';

async function checkOrderAddressColumns() {
  try {
    // Get all columns from orders table
    const allColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `;
    
    console.log('All orders table columns:');
    allColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Check for any address-related columns
    const addressColumns = allColumns.filter(col => 
      col.column_name.includes('address') || 
      col.column_name.includes('shipping') || 
      col.column_name.includes('billing')
    );
    
    console.log('\nAddress-related columns in orders table:');
    addressColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Check if there are any other tables that link orders to addresses
    const foreignKeys = await sql`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name 
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name 
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = 'orders'
    `;
    
    console.log('\nForeign keys in orders table:');
    foreignKeys.forEach(fk => {
      console.log(`  ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
  } catch (error) {
    console.error('Error checking order address columns:', error.message);
  } finally {
    await sql.end();
  }
}

checkOrderAddressColumns();