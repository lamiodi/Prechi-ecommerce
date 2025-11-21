import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config()

// Configure connection options for Supabase
const connectionOptions = {
  ssl: 'require', // Required for Supabase
  max: 1, // Single connection for schema changes
  idle_timeout: 30,
  connect_timeout: 10
}

const sql = postgres(process.env.DATABASE_URL, connectionOptions)

async function createTables() {
  console.log('🚀 Starting table creation process...')
  
  try {
    // Create tables in dependency order (parent tables first)
    
    // 1. Users table
    console.log('👥 Creating users table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        uuid UUID DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        username VARCHAR(50) UNIQUE,
        phone_number VARCHAR(20),
        is_admin BOOLEAN DEFAULT FALSE,
        reset_token TEXT,
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `)

    // 2. Categories table
    console.log('📂 Creating categories table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `)

    // 3. Colors table
    console.log('🎨 Creating colors table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.colors (
        id SERIAL PRIMARY KEY,
        color_name VARCHAR(50) NOT NULL,
        color_code VARCHAR(7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 4. Sizes table
    console.log('📏 Creating sizes table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.sizes (
        id SERIAL PRIMARY KEY,
        size_name VARCHAR(20) NOT NULL,
        size_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 5. Products table
    console.log('📦 Creating products table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.products (
        id SERIAL PRIMARY KEY,
        uuid UUID DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        base_price NUMERIC(10,2) NOT NULL,
        sku_prefix VARCHAR(50),
        category VARCHAR(100),
        gender VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        is_new_release BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `)

    // 6. Product Variants table
    console.log('🔄 Creating product_variants table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
        color_id INTEGER NOT NULL REFERENCES public.colors(id),
        sku VARCHAR(100) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `)

    // 7. Variant Sizes table (for stock management)
    console.log('📦 Creating variant_sizes table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.variant_sizes (
        id SERIAL PRIMARY KEY,
        variant_id INTEGER NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
        size_id INTEGER NOT NULL REFERENCES public.sizes(id),
        stock_quantity INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(variant_id, size_id)
      );
    `)

    // 8. Product Images table
    console.log('🖼️ Creating product_images table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.product_images (
        id SERIAL PRIMARY KEY,
        variant_id INTEGER NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 9. Bundles table
    console.log('📦 Creating bundles table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.bundles (
        id SERIAL PRIMARY KEY,
        uuid UUID DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        bundle_price NUMERIC(10,2) NOT NULL,
        sku_prefix VARCHAR(50),
        bundle_type VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `)

    // 10. Bundle Items table
    console.log('🔗 Creating bundle_items table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.bundle_items (
        id SERIAL PRIMARY KEY,
        bundle_id INTEGER NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
        variant_id INTEGER NOT NULL REFERENCES public.product_variants(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(bundle_id, variant_id)
      );
    `)

    // 11. Bundle Images table
    console.log('🖼️ Creating bundle_images table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.bundle_images (
        id SERIAL PRIMARY KEY,
        bundle_id INTEGER NOT NULL REFERENCES public.bundles(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 12. Cart table
    console.log('🛒 Creating cart table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.cart (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        total NUMERIC(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `)

    // 13. Cart Items table
    console.log('🛍️ Creating cart_items table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.cart_items (
        id SERIAL PRIMARY KEY,
        cart_id INTEGER NOT NULL REFERENCES public.cart(id) ON DELETE CASCADE,
        variant_id INTEGER REFERENCES public.product_variants(id),
        bundle_id INTEGER REFERENCES public.bundles(id),
        size_id INTEGER REFERENCES public.sizes(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        price NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        CHECK ((variant_id IS NOT NULL AND bundle_id IS NULL) OR (variant_id IS NULL AND bundle_id IS NOT NULL))
      );
    `)

    // 14. Orders table
    console.log('📋 Creating orders table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.orders (
        id SERIAL PRIMARY KEY,
        uuid UUID DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES public.users(id),
        reference VARCHAR(100) UNIQUE NOT NULL,
        payment_method VARCHAR(50),
        payment_status VARCHAR(50) DEFAULT 'pending',
        status VARCHAR(50) DEFAULT 'pending',
        subtotal NUMERIC(10,2) DEFAULT 0.00,
        delivery_fee NUMERIC(10,2) DEFAULT 0.00,
        discount NUMERIC(10,2) DEFAULT 0.00,
        total NUMERIC(10,2) DEFAULT 0.00,
        email_sent BOOLEAN DEFAULT FALSE,
        idempotency_key VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `)

    // 15. Order Items table
    console.log('📦 Creating order_items table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
        variant_id INTEGER REFERENCES public.product_variants(id),
        bundle_id INTEGER REFERENCES public.bundles(id),
        quantity INTEGER NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHECK ((variant_id IS NOT NULL AND bundle_id IS NULL) OR (variant_id IS NULL AND bundle_id IS NOT NULL))
      );
    `)

    // 16. Addresses table
    console.log('🏠 Creating addresses table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20),
        country VARCHAR(100) DEFAULT 'Nigeria',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `)

    // 17. Billing Addresses table
    console.log('💳 Creating billing_addresses table...')
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.billing_addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20),
        country VARCHAR(100) DEFAULT 'Nigeria',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `)

    // Add updated_at triggers
    console.log('⚡ Adding updated_at triggers...')
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $func$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $func$ language plpgsql;
    `)

    // Apply triggers to tables with updated_at
    const tablesWithUpdatedAt = [
      'users', 'products', 'product_variants', 'bundles', 
      'cart', 'cart_items', 'orders', 'addresses', 'billing_addresses'
    ]

    for (const table of tablesWithUpdatedAt) {
      await sql.unsafe(`
        CREATE TRIGGER IF NOT EXISTS update_${table}_updated_at 
          BEFORE UPDATE ON public.${table}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `)
    }

    console.log('✅ All tables created successfully!')
    
    // Show summary
    const tableCount = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `
    
    console.log(`📊 Total tables created: ${tableCount[0].count}`)
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message)
    throw error
  } finally {
    await sql.end()
  }
}

// Run the table creation
createTables().catch(console.error)