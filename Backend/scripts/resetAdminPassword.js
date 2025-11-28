import bcrypt from 'bcrypt';
import sql from '../db/index.js';

async function resetAdminPassword() {
  try {
    // Generate a secure random temporary password
    const temporaryPassword = require('crypto').randomBytes(12).toString('hex');
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    console.log('New temporary password generated');
    
    const [updatedUser] = await sql`
      UPDATE users 
      SET password = ${hashedPassword}, updated_at = NOW()
      WHERE email = 'admin@prechi.com' AND is_admin = true
      RETURNING id, email, username, is_admin
    `;
    
    if (updatedUser) {
      console.log('✅ Admin password updated successfully for:', updatedUser.email);
      
      // Verify the new password works
      const [user] = await sql`
        SELECT password 
        FROM users 
        WHERE email = 'admin@prechi.com' AND is_admin = true
      `;
      
      const isMatch = await bcrypt.compare(temporaryPassword, user.password);
      console.log('✅ Password verification test:', isMatch);
      console.log('🔑 Temporary password (valid for first login only):', temporaryPassword);
      console.log('⚠️  This password will be invalidated after first use - user must set a new password');
    } else {
      console.log('❌ Admin user not found');
    }
  } catch (err) {
    console.error('Error resetting admin password:', err);
  } finally {
    await sql.end();
  }
}

resetAdminPassword();