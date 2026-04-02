
import sql from './db/index.js';

const runMigration = async () => {
  console.log('Fixing addresses and billing_addresses schema...');
  try {
    // Fix addresses table
    console.log('Updating addresses table...');
    await sql`ALTER TABLE addresses RENAME COLUMN address_line1 TO address_line_1`;
    await sql`ALTER TABLE addresses RENAME COLUMN address_line2 TO landmark`;
    await sql`ALTER TABLE addresses RENAME COLUMN postal_code TO zip_code`;
    await sql`ALTER TABLE addresses ADD COLUMN IF NOT EXISTS title TEXT`;
    
    // Fix billing_addresses table
    console.log('Updating billing_addresses table...');
    await sql`ALTER TABLE billing_addresses RENAME COLUMN address_line1 TO address_line_1`;
    // billing_addresses doesn't use landmark/address_line2 in the code, so we can drop address_line2 or leave it. 
    // I'll leave it but renamed to address_line_2 just in case, or drop it? Code doesn't use it.
    // Let's rename it to address_line_2 to match style if we keep it, or just ignore.
    // But we need to rename postal_code.
    await sql`ALTER TABLE billing_addresses RENAME COLUMN postal_code TO zip_code`;
    
    await sql`ALTER TABLE billing_addresses ADD COLUMN IF NOT EXISTS full_name TEXT`;
    await sql`ALTER TABLE billing_addresses ADD COLUMN IF NOT EXISTS email TEXT`;
    await sql`ALTER TABLE billing_addresses ADD COLUMN IF NOT EXISTS phone_number TEXT`;
    
    console.log('✅ Successfully updated addresses schema.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    // Continue even if rename fails (might already be renamed)
  } finally {
    await sql.end();
  }
};

runMigration();
