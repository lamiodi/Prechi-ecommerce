import sql from '../db/index.js';

async function addFirstOrderColumn() {
  try {
    console.log('🔧 Adding first_order column to users table...');
    
    await sql`
      ALTER TABLE users ADD COLUMN first_order BOOLEAN DEFAULT true
    `;
    
    console.log('✅ first_order column added successfully!');
    
    // Verify the change
    const [result] = await sql`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'first_order'
    `;
    
    if (result) {
      console.log('✅ Column verified:', result);
    }
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  first_order column already exists');
    } else {
      console.error('❌ Error adding first_order column:', error);
    }
  } finally {
    await sql.end();
  }
}

addFirstOrderColumn();