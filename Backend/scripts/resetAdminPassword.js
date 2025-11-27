import bcrypt from 'bcrypt';
import sql from '../db/index.js';

async function resetAdminPassword() {
  try {
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    console.log('New password hash:', hashedPassword);
    
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
      
      const isMatch = await bcrypt.compare('Admin@123456', user.password);
      console.log('✅ Password verification test:', isMatch);
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