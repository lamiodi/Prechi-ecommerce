import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

console.log('🧪 Testing Supabase connection...');
console.log('📋 Database URL:', process.env.DATABASE_URL);

// Parse the connection URL to verify format
const url = new URL(process.env.DATABASE_URL);
console.log('🏠 Host:', url.hostname);
console.log('🔢 Port:', url.port);
console.log('👤 User:', url.username);
console.log('📊 Database:', url.pathname.substring(1));

async function testConnection() {
  let sql;
  try {
    console.log('\n🔌 Attempting to connect...');
    
    // Test with different SSL configurations
    const connectionConfigs = [
      { ssl: 'require' },
      { ssl: false },
      { ssl: { rejectUnauthorized: false } }
    ];
    
    for (let i = 0; i < connectionConfigs.length; i++) {
      const config = connectionConfigs[i];
      console.log(`\n🔄 Testing connection ${i + 1} with config:`, JSON.stringify(config));
      
      try {
        sql = postgres(process.env.DATABASE_URL, {
          ...config,
          max: 1,
          idle_timeout: 10,
          connect_timeout: 10
        });
        
        // Test the connection
        const result = await sql`SELECT current_timestamp as server_time, current_database() as db_name`;
        console.log('✅ Connection successful!');
        console.log('🕐 Server time:', result[0].server_time);
        console.log('📊 Database name:', result[0].db_name);
        
        // Test if our functions exist
        console.log('\n🔍 Checking for existing functions...');
        const functions = await sql`
          SELECT routine_name 
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name LIKE '%optimized%'
        `;
        
        if (functions.length > 0) {
          console.log('📋 Found existing optimized functions:', functions.map(f => f.routine_name));
        } else {
          console.log('📋 No optimized functions found yet');
        }
        
        return; // Success, exit the function
        
      } catch (err) {
        console.log(`❌ Connection ${i + 1} failed:`, err.message);
        if (sql) {
          await sql.end();
          sql = null;
        }
      }
    }
    
    console.log('\n❌ All connection attempts failed');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  } finally {
    if (sql) {
      await sql.end();
      console.log('🔌 Connection closed');
    }
  }
}

// Run the test
testConnection().catch(console.error);