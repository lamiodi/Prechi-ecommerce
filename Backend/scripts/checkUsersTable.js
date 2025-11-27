import sql from '../db/index.js';

async function checkUsersTable() {
  try {
    // Get all columns from users table
    const allColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    console.log('Users table columns:');
    allColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Check for is_temporary column specifically
    const hasIsTemporary = allColumns.some(col => col.column_name === 'is_temporary');
    console.log('\nHas is_temporary column:', hasIsTemporary);
    
  } catch (error) {
    console.error('Error checking users table:', error.message);
  } finally {
    await sql.end();
  }
}

checkUsersTable();