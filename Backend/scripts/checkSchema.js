import sql from '../db/index.js';

async function checkSchema() {
  try {
    console.log('🔍 Checking users table schema...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    console.log('Current users table columns:');
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable})${col.column_default ? ' DEFAULT: ' + col.column_default : ''}`);
    });
    
    // Check if first_order exists
    const hasFirstOrder = columns.some(col => col.column_name === 'first_order');
    console.log(`\n✅ first_order column exists: ${hasFirstOrder}`);
    
    if (!hasFirstOrder) {
      console.log('\n📝 To add first_order column, run this SQL:');
      console.log('ALTER TABLE users ADD COLUMN first_order BOOLEAN DEFAULT true;');
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await sql.end();
  }
}

checkSchema();