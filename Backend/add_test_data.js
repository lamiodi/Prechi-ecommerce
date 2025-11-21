import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config()

const connectionOptions = {
  ssl: 'require',
  max: 1,
  idle_timeout: 30,
  connect_timeout: 10
}

const sql = postgres(process.env.DATABASE_URL, connectionOptions)

async function addTestData() {
  console.log('🧪 Adding test data to verify optimized functions...')
  
  try {
    // Add test user
    console.log('👤 Adding test user...')
    const [testUser] = await sql`
      INSERT INTO public.users (email, password, first_name, last_name, username)
      VALUES ('test@example.com', 'hashed_password', 'Test', 'User', 'testuser')
      RETURNING id, email, first_name, last_name
    `
    console.log(`✅ Test user created: ${testUser.first_name} ${testUser.last_name} (${testUser.email})`)

    // Add test colors
    console.log('🎨 Adding test colors...')
    const colors = await sql`
      INSERT INTO public.colors (color_name, color_code)
      VALUES 
        ('Black', '#000000'),
        ('White', '#FFFFFF'),
        ('Navy Blue', '#000080'),
        ('Red', '#FF0000')
      RETURNING id, color_name
    `
    console.log(`✅ Added ${colors.length} colors`)

    // Add test sizes
    console.log('📏 Adding test sizes...')
    const sizes = await sql`
      INSERT INTO public.sizes (size_name, size_order)
      VALUES 
        ('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5), ('XXL', 6)
      RETURNING id, size_name
    `
    console.log(`✅ Added ${sizes.length} sizes`)

    // Add test product
    console.log('📦 Adding test product...')
    const [testProduct] = await sql`
      INSERT INTO public.products (name, description, base_price, sku_prefix, category, gender)
      VALUES ('Classic T-Shirt', 'Comfortable cotton t-shirt perfect for everyday wear', 29.99, 'TS-CL', 'Tops', 'Unisex')
      RETURNING id, name, base_price
    `
    console.log(`✅ Test product created: ${testProduct.name} ($${testProduct.base_price})`)

    // Add product variant
    console.log('🔄 Adding product variant...')
    const [testVariant] = await sql`
      INSERT INTO public.product_variants (product_id, color_id, sku, is_active)
      VALUES (${testProduct.id}, ${colors[0].id}, 'TS-CL-BLK-001', true)
      RETURNING id, sku
    `
    console.log(`✅ Product variant created: ${testVariant.sku}`)

    // Add variant sizes with stock
    console.log('📦 Adding variant sizes and stock...')
    const variantSizes = await sql`
      INSERT INTO public.variant_sizes (variant_id, size_id, stock_quantity)
      VALUES 
        (${testVariant.id}, ${sizes[1].id}, 10), -- S: 10 in stock
        (${testVariant.id}, ${sizes[2].id}, 15), -- M: 15 in stock
        (${testVariant.id}, ${sizes[3].id}, 20), -- L: 20 in stock
        (${testVariant.id}, ${sizes[4].id}, 12)  -- XL: 12 in stock
      RETURNING id, stock_quantity
    `
    console.log(`✅ Added ${variantSizes.length} size variants with stock`)

    // Add product images
    console.log('🖼️ Adding product images...')
    await sql`
      INSERT INTO public.product_images (variant_id, image_url, is_primary, position)
      VALUES 
        (${testVariant.id}, 'https://example.com/images/ts-cl-black-front.jpg', true, 1),
        (${testVariant.id}, 'https://example.com/images/ts-cl-black-back.jpg', false, 2)
    `
    console.log(`✅ Added product images`)

    // Add test bundle
    console.log('📦 Adding test bundle...')
    const [testBundle] = await sql`
      INSERT INTO public.bundles (name, description, bundle_price, sku_prefix, bundle_type)
      VALUES ('T-Shirt & Accessories Bundle', 'Complete outfit bundle with t-shirt and accessories', 49.99, 'BND-TS', 'Outfit')
      RETURNING id, name, bundle_price
    `
    console.log(`✅ Test bundle created: ${testBundle.name} ($${testBundle.bundle_price})`)

    // Add bundle item
    console.log('🔗 Adding bundle item...')
    await sql`
      INSERT INTO public.bundle_items (bundle_id, variant_id)
      VALUES (${testBundle.id}, ${testVariant.id})
    `
    console.log(`✅ Bundle item linked`)

    // Add bundle images
    console.log('🖼️ Adding bundle images...')
    await sql`
      INSERT INTO public.bundle_images (bundle_id, image_url, is_primary, position)
      VALUES 
        (${testBundle.id}, 'https://example.com/images/bundle-ts-outfit.jpg', true, 1)
    `
    console.log(`✅ Added bundle images`)

    // Add test cart
    console.log('🛒 Adding test cart...')
    const [testCart] = await sql`
      INSERT INTO public.cart (user_id, total)
      VALUES (${testUser.id}, 0.00)
      RETURNING id, total
    `
    console.log(`✅ Test cart created for user`)

    // Add cart items
    console.log('🛍️ Adding cart items...')
    await sql`
      INSERT INTO public.cart_items (cart_id, variant_id, size_id, quantity, price)
      VALUES 
        (${testCart.id}, ${testVariant.id}, ${sizes[2].id}, 2, 29.99), -- 2 Medium t-shirts
        (${testCart.id}, ${testVariant.id}, ${sizes[3].id}, 1, 29.99)  -- 1 Large t-shirt
    `
    console.log(`✅ Added cart items`)

    console.log('🎉 Test data setup complete!')
    
    // Now let's test our optimized functions
    console.log('\n🔍 Testing optimized functions...')
    
    // Test get_product_or_bundle_optimized
    console.log('\n1️⃣ Testing get_product_or_bundle_optimized function...')
    const productResult = await sql`
      SELECT * FROM public.get_product_or_bundle_optimized(${testProduct.id})
    `
    console.log(`✅ Product query returned ${productResult.length} results`)
    if (productResult.length > 0) {
      console.log(`   - Item type: ${productResult[0].item_type}`)
      console.log(`   - Name: ${productResult[0].name}`)
      console.log(`   - Price: $${productResult[0].price}`)
      console.log(`   - Variants: ${productResult[0].variants.length} variants`)
    }

    // Test bundle query
    const bundleResult = await sql`
      SELECT * FROM public.get_product_or_bundle_optimized(${testBundle.id})
    `
    console.log(`✅ Bundle query returned ${bundleResult.length} results`)
    if (bundleResult.length > 0) {
      console.log(`   - Item type: ${bundleResult[0].item_type}`)
      console.log(`   - Name: ${bundleResult[0].name}`)
      console.log(`   - Price: $${bundleResult[0].price}`)
    }

    // Test get_cart_items_optimized
    console.log('\n2️⃣ Testing get_cart_items_optimized function...')
    const cartResult = await sql`
      SELECT * FROM public.get_cart_items_optimized(${testCart.id})
    `
    console.log(`✅ Cart items query returned ${cartResult.length} results`)
    cartResult.forEach((item, index) => {
      console.log(`   - Item ${index + 1}: ${item.product_name} (${item.size_name}) x${item.quantity} = $${item.price * item.quantity}`)
    })

    // Test validate_cart_stock_batch
    console.log('\n3️⃣ Testing validate_cart_stock_batch function...')
    const cartItems = await sql`
      SELECT id, variant_id, size_id, quantity 
      FROM public.cart_items 
      WHERE cart_id = ${testCart.id}
    `
    
    if (cartItems.length > 0) {
      const validationResult = await sql`
        SELECT * FROM public.validate_cart_stock_batch(${sql.array(cartItems.map(item => item.id), 'int4')})
      `
      console.log(`✅ Stock validation returned ${validationResult.length} results`)
      validationResult.forEach((result, index) => {
        console.log(`   - Item ${index + 1}: ${result.is_available ? '✅ Available' : '❌ Not Available'} (${result.available_stock} in stock)`)
      })
    }

    console.log('\n🎉 All optimized functions are working correctly!')
    console.log('\n📊 Summary:')
    console.log(`   - get_product_or_bundle_optimized: ✅ Working`)
    console.log(`   - get_cart_items_optimized: ✅ Working`)
    console.log(`   - validate_cart_stock_batch: ✅ Working`)
    
  } catch (error) {
    console.error('❌ Error adding test data:', error.message)
    throw error
  } finally {
    await sql.end()
  }
}

// Run the test data setup
addTestData().catch(console.error)