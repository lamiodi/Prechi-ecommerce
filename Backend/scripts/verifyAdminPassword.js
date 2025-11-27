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
      const isMatch = await bcrypt.compare('Admin@123456', admin.password);
      console.log('Password verification result:', isMatch);
      
      if (!isMatch) {
        console.log('Password hash in database:', admin.password);
        console.log('Expected password: Admin@123456');
      }
    }
  } catch (err) {
    console.error('Error verifying password:', err);
  } finally {
    await sql.end();
  }
}

verifyPassword();