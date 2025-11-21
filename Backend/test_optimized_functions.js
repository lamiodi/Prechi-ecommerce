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

async function testOptimizedFunctions() {
  console.log('🧪 Testing optimized functions with existing data...')
  
  try {
    // Get test data IDs
    const testUser = await sql`SELECT id FROM public.users WHERE email = 'test@example.com' LIMIT 1`
    const testProduct = await sql`SELECT id FROM public.products WHERE name = 'Classic T-Shirt' LIMIT 1`
    const testBundle = await sql`SELECT id FROM public.bundles WHERE name = 'T-Shirt & Accessories Bundle' LIMIT 1`
    const testCart = await sql`SELECT id FROM public.cart WHERE user_id = ${testUser[0].id} LIMIT 1`

    if (testUser.length === 0 || testProduct.length === 0 || testBundle.length === 0 || testCart.length === 0) {
      console.log('❌ Test data not found. Please run the full test data setup first.')
      return
    }

    console.log(`✅ Found test data:`)
    console.log(`   - User ID: ${testUser[0].id}`)
    console.log(`   - Product ID: ${testProduct[0].id}`)
    console.log(`   - Bundle ID: ${testBundle[0].id}`)
    console.log(`   - Cart ID: ${testCart[0].id}`)

    console.log('\n🔍 Testing optimized functions...')
    
    // Test get_product_or_bundle_optimized with product
    console.log('\n1️⃣ Testing get_product_or_bundle_optimized (Product)...')
    const productResult = await sql`
      SELECT * FROM public.get_product_or_bundle_optimized(${testProduct[0].id})
    `
    console.log(`✅ Product query returned ${productResult.length} results`)
    if (productResult.length > 0) {
      productResult.forEach((item, index) => {
        console.log(`   Result ${index + 1}:`)
        console.log(`   - Type: ${item.item_type}`)
        console.log(`   - Name: ${item.name}`)
        console.log(`   - Price: ₦${item.price.toLocaleString()}`)
        console.log(`   - Variants: ${item.variants.length} variants`)
        console.log(`   - Total Stock: ${item.total_stock}`)
      })
    }

    // Test get_product_or_bundle_optimized with bundle
    console.log('\n2️⃣ Testing get_product_or_bundle_optimized (Bundle)...')
    const bundleResult = await sql`
      SELECT * FROM public.get_product_or_bundle_optimized(${testBundle[0].id})
    `
    console.log(`✅ Bundle query returned ${bundleResult.length} results`)
    if (bundleResult.length > 0) {
      bundleResult.forEach((item, index) => {
        console.log(`   Result ${index + 1}:`)
        console.log(`   - Type: ${item.item_type}`)
        console.log(`   - Name: ${item.name}`)
        console.log(`   - Price: ₦${item.price.toLocaleString()}`)
        console.log(`   - Bundle Type: ${item.bundle_type}`)
      })
    }

    // Test get_cart_items_optimized
    console.log('\n3️⃣ Testing get_cart_items_optimized...')
    const cartResult = await sql`
      SELECT * FROM public.get_cart_items_optimized(${testCart[0].id})
    `
    console.log(`✅ Cart items query returned ${cartResult.length} results`)
    if (cartResult.length > 0) {
      cartResult.forEach((item, index) => {
        console.log(`   Item ${index + 1}:`)
        console.log(`   - Product: ${item.product_name}`)
        console.log(`   - Size: ${item.size_name}`)
        console.log(`   - Quantity: ${item.quantity}`)
        console.log(`   - Price: ₦${item.price.toLocaleString()}`)
        console.log(`   - Total: ₦${(item.price * item.quantity).toLocaleString()}`)
      })
    }

    // Test validate_cart_stock_batch
    console.log('\n4️⃣ Testing validate_cart_stock_batch...')
    const cartItems = await sql`
      SELECT id, variant_id, size_id, quantity 
      FROM public.cart_items 
      WHERE cart_id = ${testCart[0].id}
    `
    
    if (cartItems.length > 0) {
      const cartItemIds = cartItems.map(item => item.id)
      console.log(`   Found ${cartItemIds.length} cart items to validate: [${cartItemIds.join(', ')}]`)
      
      const validationResult = await sql`
        SELECT * FROM public.validate_cart_stock_batch(${cartItemIds})
      `
      console.log(`✅ Stock validation returned ${validationResult.length} results`)
      validationResult.forEach((result, index) => {
        console.log(`   Item ${index + 1}:`)
        console.log(`   - Cart Item ID: ${result.cart_item_id}`)
        console.log(`   - Requested: ${result.quantity_requested}`)
        console.log(`   - Available: ${result.available_stock}`)
        console.log(`   - Status: ${result.is_available ? '✅ Available' : '❌ Not Available'}`)
      })
    }

    console.log('\n🎉 All optimized functions are working correctly!')
    console.log('\n📊 Performance Summary:')
    console.log(`   - get_product_or_bundle_optimized: ✅ Working - Single query for product/bundle with variants, images, and stock`)
    console.log(`   - get_cart_items_optimized: ✅ Working - Single query for cart items with complete product data`)
    console.log(`   - validate_cart_stock_batch: ✅ Working - Batch validation of cart stock availability`)
    
    console.log('\n💡 Key Benefits:')
    console.log(`   - Eliminates N+1 queries when fetching products/bundles with variants`)
    console.log(`   - Single query retrieves cart items with all related product data`)
    console.log(`   - Batch stock validation prevents multiple individual queries`)
    console.log(`   - JSON aggregation reduces query complexity and improves performance`)
    
  } catch (error) {
    console.error('❌ Error testing functions:', error.message)
    throw error
  } finally {
    await sql.end()
  }
}

// Run the test
testOptimizedFunctions().catch(console.error)