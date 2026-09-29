import postgres from 'postgres'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { v2 as cloudinary } from 'cloudinary'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const connectionOptions = {
  ssl: 'require',
  max: 1,
  idle_timeout: 30,
  connect_timeout: 10
}

const sql = postgres(process.env.DATABASE_URL, connectionOptions)

const productsToInsert = [
  {
    name: 'Prechi Contrast Two-Tone Tracksuit Set - Magenta & Blush',
    description: 'Elevate your streetwear wardrobe with the Prechi Contrast Two-Tone Tracksuit. Crafted from high-grade cotton fleece, this set features a fitted zip-up top with retro-inspired chest stripes, paired with comfortable blush-pink joggers accented with bold red side panels and the signature PC emblem. Designed for casual luxury and everyday comfort.',
    base_price: 75000,
    sku_prefix: 'CTS',
    category: 'Sets',
    gender: 'unisex',
    is_new_release: true,
    variants: [
      {
        name: 'Magenta & Blush Tracksuit',
        color_id: 11, // Pink / Magenta
        localImages: [
          'Frontend/public/products/firstproducts/WhatsApp Image 2026-07-29 at 5.22.20 PM.jpeg',
          'Frontend/public/products/firstproducts/WhatsApp Image 2026-07-29 at 5.22.20 PM (1).jpeg',
          'Frontend/public/products/firstproducts/WhatsApp Image 2026-07-29 at 5.22.20 PM (2).jpeg',
          'Frontend/public/products/firstproducts/WhatsApp Image 2026-07-29 at 5.22.20 PM (3).jpeg',
        ],
        publicUrls: [
          '/products/firstproducts/WhatsApp Image 2026-07-29 at 5.22.20 PM.jpeg',
          '/products/firstproducts/WhatsApp Image 2026-07-29 at 5.22.20 PM (1).jpeg',
          '/products/firstproducts/WhatsApp Image 2026-07-29 at 5.22.20 PM (2).jpeg',
          '/products/firstproducts/WhatsApp Image 2026-07-29 at 5.22.20 PM (3).jpeg',
        ],
        sizes: [
          { size_id: 2, stock_quantity: 50, price: 75000 }, // S
          { size_id: 3, stock_quantity: 50, price: 75000 }, // M
          { size_id: 4, stock_quantity: 50, price: 75000 }, // L
          { size_id: 5, stock_quantity: 50, price: 75000 }, // XL
          { size_id: 6, stock_quantity: 50, price: 75000 }, // 2XL
          { size_id: 7, stock_quantity: 50, price: 80000 }, // 3XL (above 2XL)
          { size_id: 8, stock_quantity: 50, price: 80000 }, // 4XL
          { size_id: 9, stock_quantity: 50, price: 80000 }, // 5XL
        ]
      }
    ]
  },
  {
    name: 'Prechi Side-Snap Tear-Away Tracksuit Set - Black & White',
    description: 'Make a bold statement with the Prechi Side-Snap Tear-Away Tracksuit. Engineered with a sleek high-neck zip jacket featuring contrast chest striping, paired with wide-leg track pants styled with functional side snap-buttons along white side panels. Merging retro sporty functionality with high-end modern street fashion.',
    base_price: 75000,
    sku_prefix: 'SST',
    category: 'Sets',
    gender: 'unisex',
    is_new_release: true,
    variants: [
      {
        name: 'Black & White Side-Snap Tracksuit',
        color_id: 1, // Black
        localImages: [
          'Frontend/public/products/secondproducts/WhatsApp Image 2026-08-03 at 4.08.38 PM.jpeg',
          'Frontend/public/products/secondproducts/WhatsApp Image 2026-08-03 at 4.08.38 PM (1).jpeg',
          'Frontend/public/products/secondproducts/WhatsApp Image 2026-08-03 at 4.08.38 PM (2).jpeg',
        ],
        publicUrls: [
          '/products/secondproducts/WhatsApp Image 2026-08-03 at 4.08.38 PM.jpeg',
          '/products/secondproducts/WhatsApp Image 2026-08-03 at 4.08.38 PM (1).jpeg',
          '/products/secondproducts/WhatsApp Image 2026-08-03 at 4.08.38 PM (2).jpeg',
        ],
        sizes: [
          { size_id: 2, stock_quantity: 50, price: 75000 }, // S
          { size_id: 3, stock_quantity: 50, price: 75000 }, // M
          { size_id: 4, stock_quantity: 50, price: 75000 }, // L
          { size_id: 5, stock_quantity: 50, price: 75000 }, // XL
          { size_id: 6, stock_quantity: 50, price: 75000 }, // 2XL
          { size_id: 7, stock_quantity: 50, price: 80000 }, // 3XL
          { size_id: 8, stock_quantity: 50, price: 80000 }, // 4XL
          { size_id: 9, stock_quantity: 50, price: 80000 }, // 5XL
        ]
      }
    ]
  }
]

async function uploadImageToCloudinary(localPath, publicUrl) {
  try {
    const fullPath = path.resolve(__dirname, '../../', localPath)
    console.log(`  ☁️ Uploading ${localPath} to Cloudinary...`)
    const uploadResult = await cloudinary.uploader.upload(fullPath, {
      folder: 'prechi_products'
    })
    console.log(`  ✅ Cloudinary Uploaded: ${uploadResult.secure_url}`)
    return uploadResult.secure_url
  } catch (err) {
    console.warn(`  ⚠️ Cloudinary upload failed for ${localPath}: ${err.message}. Using public path fallback: ${publicUrl}`)
    return publicUrl
  }
}

async function insertNewProducts() {
  console.log('🚀 Starting New Product Insertion Process...\n')

  try {
    for (const item of productsToInsert) {
      console.log(`📦 Creating Product: "${item.name}"`)
      
      const [product] = await sql`
        INSERT INTO products (name, description, base_price, sku_prefix, category, gender, is_new_release, is_active)
        VALUES (${item.name}, ${item.description}, ${item.base_price}, ${item.sku_prefix}, ${item.category}, ${item.gender}, ${item.is_new_release}, true)
        RETURNING id
      `
      const productId = product.id
      console.log(`   ✅ Product Record Created with ID: ${productId}`)

      for (let i = 0; i < item.variants.length; i++) {
        const variant = item.variants[i]
        const sku = `${item.sku_prefix}-${i}`
        
        console.log(`   🎨 Creating Variant: "${variant.name}" (SKU: ${sku})`)
        const [variantResult] = await sql`
          INSERT INTO product_variants (product_id, color_id, sku, name, is_active)
          VALUES (${productId}, ${variant.color_id}, ${sku}, ${variant.name}, true)
          RETURNING id
        `
        const variantId = variantResult.id
        console.log(`      ✅ Variant Created with ID: ${variantId}`)

        // Insert Sizes & Prices
        for (const size of variant.sizes) {
          await sql`
            INSERT INTO variant_sizes (variant_id, size_id, stock_quantity, price)
            VALUES (${variantId}, ${size.size_id}, ${size.stock_quantity}, ${size.price})
          `
        }
        console.log(`      ✅ Size stock & pricing configured (S-2XL @ ₦75,000, >2XL @ ₦80,000)`)

        // Upload & Insert Images
        for (let imgIdx = 0; imgIdx < variant.localImages.length; imgIdx++) {
          const localPath = variant.localImages[imgIdx]
          const publicUrl = variant.publicUrls[imgIdx]
          const imageUrl = await uploadImageToCloudinary(localPath, publicUrl)
          const isPrimary = imgIdx === 0

          await sql`
            INSERT INTO product_images (variant_id, image_url, is_primary, position)
            VALUES (${variantId}, ${imageUrl}, ${isPrimary}, ${imgIdx})
          `
          console.log(`      🖼️ Image #${imgIdx + 1} attached (primary: ${isPrimary})`)
        }
      }
      console.log(`✅ "${item.name}" complete!\n`)
    }

    console.log('🎉 All new products successfully inserted!')
  } catch (err) {
    console.error('❌ Error inserting new products:', err)
  } finally {
    await sql.end()
  }
}

insertNewProducts()
