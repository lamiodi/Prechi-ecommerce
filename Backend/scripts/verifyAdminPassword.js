import bcrypt from 'bcrypt';
import sql from '../db/index.js';

async function verifyPassword() {
  try {
    const [admin] = await sql`
      SELECT password 
      FROM users 
      WHERE email = 'admin@prechi.com' AND is_admin = true
    `;
    
    if (admin) {
      console.log('Password verification: This script requires manual password input for security');
      console.log('Use the resetAdminPassword.js script to set a new temporary password instead');
      console.log('Or use the admin login interface to verify credentials');
    }
  } catch (err) {
    console.error('Error verifying password:', err);
  } finally {
    await sql.end();
  }
}

verifyPassword();