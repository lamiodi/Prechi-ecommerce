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

// Diamond Set Product Template
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
        color_id: 1, // Assuming brown color ID
        sizes: [
          { size_id: 1, stock_quantity: 50 }, // Small
          { size_id: 2, stock_quantity: 75 }, // Medium
          { size_id: 3, stock_quantity: 60 }, // Large
          { size_id: 4, stock_quantity: 40 }, // XL
        ]
      },
      {
        name: 'Carton',
        color_id: 2, // Assuming carton/beige color ID
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
        color_id: 3, // Assuming navy blue color ID
        sizes: [
          { size_id: 1, stock_quantity: 55 }, // Small
          { size_id: 2, stock_quantity: 70 }, // Medium
          { size_id: 3, stock_quantity: 65 }, // Large
          { size_id: 4, stock_quantity: 45 }, // XL
        ]
      },
      {
        name: 'Sky Blue',
        color_id: 4, // Assuming sky blue color ID
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
        color_id: 5, // Assuming ash/grey color ID
        sizes: [
          { size_id: 1, stock_quantity: 60 }, // Small
          { size_id: 2, stock_quantity: 80 }, // Medium
          { size_id: 3, stock_quantity: 70 }, // Large
          { size_id: 4, stock_quantity: 50 }, // XL
        ]
      },
      {
        name: 'Pink',
        color_id: 6, // Assuming pink color ID
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

async function getColorAndSizeMappings() {
  console.log('📋 Fetching color and size mappings...')
  
  const colors = await sql`SELECT id, color_name, color_code FROM colors ORDER BY id`
  const sizes = await sql`SELECT id, size_name, size_code FROM sizes ORDER BY id`
  
  console.log('Available Colors:')
  colors.forEach(color => {
    console.log(`   ${color.id}: ${color.color_name} (${color.color_code})`)
  })
  
  console.log('Available Sizes:')
  sizes.forEach(size => {
    console.log(`   ${size.id}: ${size.size_name} (${size.size_code})`)
  })
  
  return { colors, sizes }
}

async function prepareDiamondSets() {
  console.log('💎 Preparing Diamond Set products for insertion...')
  
  try {
    const { colors, sizes } = await getColorAndSizeMappings()
    
    console.log('\n📦 Product Templates Ready:')
    diamondSetProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`)
      console.log(`   SKU: ${product.sku_prefix}`)
      console.log(`   Price: ₦${product.base_price}`)
      console.log(`   Variants:`)
      product.variants.forEach(variant => {
        console.log(`     - ${variant.name} (Color ID: ${variant.color_id})`)
        console.log(`       Sizes: ${variant.sizes.map(s => `Size ${s.size_id} (${s.stock_quantity} qty)`).join(', ')}`)
      })
    })
    
    console.log('\n✅ Diamond Set product templates are ready!')
    console.log('📝 Next steps:')
    console.log('   1. Review the color mappings above')
    console.log('   2. Update color IDs in the template if needed')
    console.log('   3. Run the insertion script to add these products')
    console.log('   4. Add product images via admin panel or upload script')
    
    return diamondSetProducts
    
  } catch (error) {
    console.error('❌ Error preparing Diamond Sets:', error)
    throw error
  } finally {
    await sql.end()
  }
}

// Run the preparation
prepareDiamondSets().catch(console.error)