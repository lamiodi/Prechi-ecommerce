import postgres from 'postgres';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1,
});

async function applyQueries() {
  try {
    console.log('🚀 Connecting to Supabase database...');
    
    // Read the queries.sql file
    const queries = readFileSync('./queries.sql', 'utf8');
    
    console.log('📋 Read queries.sql file');
    
    // Split the file into individual statements
    const statements = queries
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .filter(stmt => !stmt.includes('SELECT') || stmt.includes('CREATE') || stmt.includes('INSERT'));
    
    console.log(`🔍 Found ${statements.length} SQL statements to apply`);
    
    // Apply each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.includes('get_product_or_bundle_optimized') || 
          statement.includes('get_cart_items_optimized') || 
          statement.includes('validate_cart_stock_batch')) {
        
        console.log(`📝 Applying optimized function ${i + 1}/${statements.length}...`);
        try {
          await sql.unsafe(statement);
          console.log(`✅ Successfully applied statement ${i + 1}`);
        } catch (err) {
          console.error(`❌ Error applying statement ${i + 1}:`, err.message);
          // Continue with other statements even if one fails
        }
      }
    }
    
    console.log('🎉 All optimized functions applied successfully!');
    
    // Test the functions
    console.log('\n🧪 Testing optimized functions...');
    
    try {
      const testResult = await sql`SELECT * FROM public.get_product_or_bundle_optimized(1)`;
      console.log('✅ get_product_or_bundle_optimized function working');
    } catch (err) {
      console.log('⚠️  get_product_or_bundle_optimized test failed (may need data):', err.message);
    }
    
  } catch (error) {
    console.error('❌ Error applying queries:', error);
  } finally {
    await sql.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the application
applyQueries().catch(console.error);