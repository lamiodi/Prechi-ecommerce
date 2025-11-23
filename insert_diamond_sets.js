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

// Diamond Set Product Data (updated with actual color IDs)
const diamondSetProducts = [
  {
    name: 'Diamond Set - Brown and Carton Color',
    description: 'Premium diamond set featuring brown and carton colors. Comfortable and stylish for everyday wear.',
    base_price: 8500,
    sku_prefix: 'DS-BC',
    category: 'diamond-set',
    gender: 'unisex',
    is_new_release: true,
    variants: [
      {
        name: 'Brown',
        color_id: 1, // Brown
        sizes: [
          { size_id: 1, stock_quantity: 50 }, // Small
          { size_id: 2, stock_quantity: 75 }, // Medium
          { size_id: 3, stock_quantity: 60 }, // Large
          { size_id: 4, stock_quantity: 40 }, // XL
        ]
      },
      {
        name: 'Carton',
        color_id: 2, // Beige/Carton
        sizes: [
          { size_id: 1, stock_quantity: 45 }, // Small
          { size_id: 2, stock_quantity: 80 }, // Medium
          { size_id: 3, stock_quantity: 65 }, // Large
          { size_id: 4, stock_quantity: 35 }, // XL
        ]
      }
    ]
  },
  {
    name: 'Diamond Set - Navy Blue and Sky Blue',
    description: 'Elegant diamond set in navy blue and sky blue colors. Perfect combination for a sophisticated look.',
    base_price: 8500,
    sku_prefix: 'DS-NS',
    category: 'diamond-set',
    gender: 'unisex',
    is_new_release: true,
    variants: [
      {
        name: 'Navy Blue',
        color_id: 3, // Navy Blue
        sizes: [
          { size_id: 1, stock_quantity: 55 }, // Small
          { size_id: 2, stock_quantity: 70 }, // Medium
          { size_id: 3, stock_quantity: 65 }, // Large
          { size_id: 4, stock_quantity: 45 }, // XL
        ]
      },
      {
        name: 'Sky Blue',
        color_id: 4, // Sky Blue
        sizes: [
          { size_id: 1, stock_quantity: 50 }, // Small
          { size_id: 2, stock_quantity: 75 }, // Medium
          { size_id: 3, stock_quantity: 60 }, // Large
          { size_id: 4, stock_quantity: 40 }, // XL
        ]
      }
    ]
  },
  {
    name: 'Diamond Set - Ash and Pink',
    description: 'Stylish diamond set combining ash and pink colors. Modern and trendy design for fashion enthusiasts.',
    base_price: 8500,
    sku_prefix: 'DS-AP',
    category: 'diamond-set',
    gender: 'unisex',
    is_new_release: true,
    variants: [
      {
        name: 'Ash',
        color_id: 5, // Ash/Grey
        sizes: [
          { size_id: 1, stock_quantity: 60 }, // Small
          { size_id: 2, stock_quantity: 80 }, // Medium
          { size_id: 3, stock_quantity: 70 }, // Large
          { size_id: 4, stock_quantity: 50 }, // XL
        ]
      },
      {
        name: 'Pink',
        color_id: 6, // Pink
        sizes: [
          { size_id: 1, stock_quantity: 45 }, // Small
          { size_id: 2, stock_quantity: 65 }, // Medium
          { size_id: 3, stock_quantity: 55 }, // Large
          { size_id: 4, stock_quantity: 35 }, // XL
        ]
      }
    ]
  }
]

async function insertDiamondSets() {
  console.log('💎 Inserting Diamond Set products...')
  
  try {
    await sql.begin(async (sql) => {
      for (const product of diamondSetProducts) {
        console.log(`\n📦 Creating product: ${product.name}`)
        
        // Insert product
        const [productResult] = await sql`
          INSERT INTO products (name, description, base_price, sku_prefix, category, gender, is_new_release, is_active)
          VALUES (${product.name}, ${product.description}, ${product.base_price}, ${product.sku_prefix}, ${product.category}, ${product.gender}, ${product.is_new_release}, true)
          RETURNING id
        `
        const productId = productResult.id
        console.log(`   ✅ Product created with ID: ${productId}`)
        
        // Insert variants
        for (let i = 0; i < product.variants.length; i++) {
          const variant = product.variants[i]
          console.log(`   🎨 Creating variant: ${variant.name}`)
          
          const [variantResult] = await sql`
            INSERT INTO product_variants (product_id, color_id, sku, name)
            VALUES (${productId}, ${variant.color_id}, ${product.sku_prefix}-${i + 1}, ${variant.name})
            RETURNING id
          `
          const variantId = variantResult.id
          console.log(`      ✅ Variant created with ID: ${variantId}`)
          
          // Insert size stock
          for (const size of variant.sizes) {
            await sql`
              INSERT INTO variant_sizes (variant_id, size_id, stock_quantity)
              VALUES (${variantId}, ${size.size_id}, ${size.stock_quantity})
            `
          }
          console.log(`      ✅ Stock quantities added for all sizes`)
        }
      }
    })
    
    console.log('\n🎉 All Diamond Set products inserted successfully!')
    console.log('\n📋 Summary of created products:')
    diamondSetProducts.forEach(product => {
      console.log(`   - ${product.name}`)
      console.log(`     SKU: ${product.sku_prefix}`)
      console.log(`     Price: ₦${product.base_price}`)
      console.log(`     Variants: ${product.variants.map(v => v.name).join(', ')}`)
    })
    
    console.log('\n📝 Next steps:')
    console.log('   1. Add product images via admin panel')
    console.log('   2. Verify products appear in shop/catalog')
    console.log('   3. Test adding to cart and checkout')
    console.log('   4. Create bundles if needed')
    
  } catch (error) {
    console.error('❌ Error inserting Diamond Sets:', error)
    throw error
  } finally {
    await sql.end()
  }
}

// Run the insertion
insertDiamondSets().catch(console.error)