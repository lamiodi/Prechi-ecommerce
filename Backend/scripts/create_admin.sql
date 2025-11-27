-- SQL script to create an admin account
-- Run this script in your PostgreSQL database

-- Check if admin already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@prechi.com') THEN
        -- Insert admin user with hashed password
        -- Password: Admin@123456
        INSERT INTO users (
            first_name, 
            last_name, 
            username, 
            email, 
            password, 
            phone_number, 
            is_admin, 
            created_at, 
            updated_at, 
            first_order
        ) VALUES (
            'Admin', 
            'User', 
            'admin', 
            'admin@prechi.com', 
            '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
            '+2341234567890', 
            true, 
            NOW(), 
            NOW(), 
            false
        );
        
        RAISE NOTICE 'Admin account created successfully!';
        RAISE NOTICE 'Email: admin@prechi.com';
        RAISE NOTICE 'Password: Admin@123456';
    ELSE
        RAISE NOTICE 'Admin account already exists!';
        RAISE NOTICE 'Email: admin@prechi.com';
        RAISE NOTICE 'If you forgot the password, use the forgot password feature.';
    END IF;
END $$;