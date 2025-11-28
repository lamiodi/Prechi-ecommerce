import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

const sql = postgres(process.env.DATABASE_URL, { 
  ssl: 'require', 
  max: 1 
});

async function checkSizes() {
  try {
    console.log('Checking sizes in database...');
    
    // Get all sizes
    const sizes = await sql`SELECT id, size_name FROM sizes ORDER BY id`;
    console.log('Current sizes:');
    sizes.forEach(size => {
      console.log(`  ID: ${size.id}, Size: ${size.size_name}`);
    });
    
    // Check if XS exists
    const xsSize = sizes.find(s => s.size_name === 'XS');
    if (xsSize) {
      console.log('\n❌ XS size found:', xsSize);
      console.log('XS size needs to be removed from the database');
    } else {
      console.log('\n✅ XS size not found in database');
    }
    
    // Check for valid sizes (S-5XL)
    const validSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    const invalidSizes = sizes.filter(size => !validSizes.includes(size.size_name));
    
    if (invalidSizes.length > 0) {
      console.log('\n❌ Invalid sizes found (should be removed):');
      invalidSizes.forEach(size => {
        console.log(`  ID: ${size.id}, Size: ${size.size_name}`);
      });
    } else {
      console.log('\n✅ All sizes are valid (S-5XL range)');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sql.end();
  }
}

checkSizes();