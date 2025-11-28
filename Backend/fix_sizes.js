import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

const sql = postgres(process.env.DATABASE_URL, { 
  ssl: 'require', 
  max: 1 
});

async function fixSizes() {
  try {
    console.log('Fixing sizes in database...');
    
    // 1. Check if XS size exists and has associated data
    const xsSize = await sql`SELECT id FROM sizes WHERE size_name = 'XS'`;
    
    if (xsSize.length > 0) {
      const xsId = xsSize[0].id;
      console.log(`Found XS size with ID: ${xsId}`);
      
      // Check if XS size is used in variant_sizes
      const xsUsage = await sql`SELECT COUNT(*) FROM variant_sizes WHERE size_id = ${xsId}`;
      const xsCount = xsUsage[0].count;
      
      if (xsCount > 0) {
        console.log(`❌ XS size is used in ${xsCount} variant_sizes records. These need to be handled first.`);
        
        // Option 1: Delete variant_sizes records with XS size
        // await sql`DELETE FROM variant_sizes WHERE size_id = ${xsId}`;
        // console.log(`Deleted ${xsCount} variant_sizes records with XS size`);
        
        // Option 2: Update variant_sizes to use a different size (e.g., S)
        const sSize = await sql`SELECT id FROM sizes WHERE size_name = 'S'`;
        if (sSize.length > 0) {
          const sId = sSize[0].id;
          await sql`UPDATE variant_sizes SET size_id = ${sId} WHERE size_id = ${xsId}`;
          console.log(`Updated ${xsCount} variant_sizes records from XS to S size`);
        }
      }
      
      // Delete the XS size
      await sql`DELETE FROM sizes WHERE size_name = 'XS'`;
      console.log('✅ XS size removed from database');
    } else {
      console.log('✅ XS size not found in database');
    }
    
    // 2. Check and fix XXL to 2XL
    const xxlSize = await sql`SELECT id FROM sizes WHERE size_name = 'XXL'`;
    
    if (xxlSize.length > 0) {
      const xxlId = xxlSize[0].id;
      console.log(`Found XXL size with ID: ${xxlId}`);
      
      // Update XXL to 2XL
      await sql`UPDATE sizes SET size_name = '2XL' WHERE size_name = 'XXL'`;
      console.log('✅ XXL size renamed to 2XL');
    } else {
      console.log('✅ XXL size not found in database');
    }
    
    // 3. Ensure all required sizes exist (S-5XL)
    const requiredSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    
    for (const sizeName of requiredSizes) {
      const existingSize = await sql`SELECT id FROM sizes WHERE size_name = ${sizeName}`;
      
      if (existingSize.length === 0) {
        // Insert missing size
        await sql`INSERT INTO sizes (size_name) VALUES (${sizeName})`;
        console.log(`✅ Added missing size: ${sizeName}`);
      } else {
        console.log(`✅ Size ${sizeName} already exists`);
      }
    }
    
    console.log('\n✅ Size cleanup completed successfully!');
    
    // Show final sizes
    const finalSizes = await sql`SELECT id, size_name FROM sizes ORDER BY id`;
    console.log('\nFinal sizes in database:');
    finalSizes.forEach(size => {
      console.log(`  ID: ${size.id}, Size: ${size.size_name}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sql.end();
  }
}

fixSizes();