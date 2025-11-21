import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

async function checkDatabaseSchema() {
  const sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require',
    max: 1,
  });

  try {
    console.log('🔍 Checking current database schema...');
    
    // Get all tables
    const tables = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 Found', tables.length, 'tables:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name} (${table.table_type})`);
    });
    
    // Check if we have any data
    if (tables.length > 0) {
      console.log('\n📊 Checking data in key tables...');
      
      for (const table of tables.slice(0, 5)) { // Check first 5 tables
        try {
          const count = await sql.unsafe(`SELECT COUNT(*) as count FROM public.${table.table_name}`);
          console.log(`   ${table.table_name}: ${count[0].count} rows`);
        } catch (err) {
          console.log(`   ${table.table_name}: Error counting - ${err.message}`);
        }
      }
    }
    
    // Check for existing functions
    console.log('\n🔧 Checking existing functions...');
    const functions = await sql`
      SELECT routine_name, routine_type, created
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      ORDER BY routine_name
    `;
    
    console.log('📋 Found', functions.length, 'functions:');
    functions.forEach(func => {
      console.log(`   - ${func.routine_name}`);
    });
    
    console.log('\n✅ Database schema check complete!');
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  } finally {
    await sql.end();
  }
}

// Run the check
checkDatabaseSchema().catch(console.error);