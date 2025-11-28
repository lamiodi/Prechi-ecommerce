// createAdmin.js - Script to create admin account
import sql from '../db/index.js';

async function createAdmin() {
  try {
    // Check if admin already exists
    const [existing] = await sql`
      SELECT id FROM users WHERE email = 'admin@prechi.com'
    `;
    
    if (existing) {
      console.log('Admin account already exists!');
      console.log('Email: admin@prechi.com');
      console.log('If you forgot the password, use the forgot password feature.');
      return;
    }
    
    // Insert admin user with temporary password that must be changed on first login
    await sql`
      INSERT INTO users (
        first_name, 
        last_name, 
        username, 
        email, 
        password, 
        phone_number, 
        is_admin, 
        created_at, 
        updated_at
      ) VALUES (
        'Admin', 
        'User', 
        'admin', 
        'admin@prechi.com', 
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
        '+2341234567890', 
        true, 
        NOW(), 
        NOW()
      )
    `;
    
    console.log('✅ Admin account created successfully!');
    console.log('📧 Email: admin@prechi.com');
    console.log('🔑 Password: [Automatically generated - check your email for setup instructions]');
    console.log('');
    console.log('🚀 You can now login at: http://localhost:5173/admin/login');
    console.log('ℹ️  Use the forgot password feature to set your initial password');
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
  } finally {
    await sql.end();
  }
}

createAdmin();