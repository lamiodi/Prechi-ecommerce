import sql from '../db/index.js';

async function checkAddressTables() {
  try {
    // Check all tables related to addresses and orders
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%address%' OR table_name LIKE '%order%') 
      ORDER BY table_name
    `;
    
    console.log('Address and Order related tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Check if order_addresses table exists
    const orderAddressesExists = await sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_addresses'
      )
    `;
    
    console.log('\norder_addresses table exists:', orderAddressesExists[0].exists);
    
    // Check addresses table structure
    const addressColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'addresses' 
      ORDER BY ordinal_position
    `;
    
    console.log('\nAddresses table columns:');
    addressColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Check if there are any address references in orders table
    const orderAddressColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name LIKE '%address%'
      ORDER BY ordinal_position
    `;
    
    console.log('\nOrder table address-related columns:');
    orderAddressColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('Error checking address tables:', error.message);
  } finally {
    await sql.end();
  }
}

checkAddressTables();