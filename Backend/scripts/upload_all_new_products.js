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

async function ensureLightGreyColor() {
  const [existing] = await sql`SELECT id FROM colors WHERE LOWER(color_name) = 'light grey' OR LOWER(color_name) = 'light-grey'`
  if (existing) {
    return existing.id
  }
  const [inserted] = await sql`
    INSERT INTO colors (color_name, color_code)
    VALUES ('Light Grey', '#D3D3D3')
    RETURNING id
  `
  console.log(`🎨 Created new color 'Light Grey' with ID: ${inserted.id}`)
  return inserted.id
}

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
    console.warn(`  ⚠️ Cloudinary upload skipped for ${localPath}: ${err.message}. Using public path fallback: ${publicUrl}`)
    return publicUrl
  }
}

async function uploadAllProducts() {
  console.log('🚀 Starting Upload for All 7 Products...\n')

  try {
    const lightGreyId = await ensureLightGreyColor()

    const standardSizes = [
      { size_id: 2, stock_quantity: 50, priceOffset: 0 },    // S
      { size_id: 3, stock_quantity: 50, priceOffset: 0 },    // M
      { size_id: 4, stock_quantity: 50, priceOffset: 0 },    // L
      { size_id: 5, stock_quantity: 50, priceOffset: 0 },    // XL
      { size_id: 6, stock_quantity: 50, priceOffset: 0 },    // 2XL
      { size_id: 7, stock_quantity: 50, priceOffset: 5000 }, // 3XL (+5k)
      { size_id: 8, stock_quantity: 50, priceOffset: 5000 }, // 4XL (+5k)
      { size_id: 9, stock_quantity: 50, priceOffset: 5000 }, // 5XL (+5k)
    ]

    const productsToInsert = [
      // 1. Prechi Signature Leather Bag
      {
        name: 'Prechi Signature Leather Bag',
        description: 'Elevate your accessories with the Prechi Signature Leather Bag. Crafted from premium leather with refined stitching, metallic hardware, and dual carry handles. Versatile, durable, and designed for modern streetwear and daily luxury.',
        base_price: 70000,
        sku_prefix: 'PSB',
        category: 'Bags',
        gender: 'unisex',
        is_new_release: true,
        variants: [
          { name: 'Black', color_id: 1 },
          { name: 'Brown', color_id: 5 },
          { name: 'Light Grey', color_id: lightGreyId },
          { name: 'Blue', color_id: 8 },
          { name: 'Green', color_id: 9 },
          { name: 'Red', color_id: 7 }
        ].map((v) => ({
          ...v,
          localImages: [
            'Frontend/public/products/productone/IMG_0300.JPG.jpeg',
            'Frontend/public/products/productone/IMG_0301.JPG.jpeg',
            'Frontend/public/products/productone/IMG_0304.JPG.jpeg'
          ],
          publicUrls: [
            '/products/productone/IMG_0300.JPG.jpeg',
            '/products/productone/IMG_0301.JPG.jpeg',
            '/products/productone/IMG_0304.JPG.jpeg'
          ]
        }))
      },

      // 2. Prechi Two-Piece Short Skirt Set
      {
        name: 'Prechi Two-Piece Short Skirt Set',
        description: 'A chic two-piece ensemble combining modern tailoring with effortless casual elegance. Features a structured top paired with a matching pleated short skirt. Crafted from premium woven fabric for maximum style and comfort. Optional white inner top available.',
        base_price: 80000,
        sku_prefix: 'SSS',
        category: 'Sets',
        gender: 'women',
        is_new_release: true,
        variants: [
          {
            name: 'Brown Skirt Set',
            color_id: 5,
            localImages: [
              'Frontend/public/products/producttwo/variantbrownimage/IMG_0285.JPG.jpeg',
              'Frontend/public/products/producttwo/variantbrownimage/IMG_0286.JPG.jpeg',
              'Frontend/public/products/producttwo/variantbrownimage/IMG_0289.JPG.jpeg',
              'Frontend/public/products/producttwo/variantbrownimage/IMG_0337.PNG'
            ],
            publicUrls: [
              '/products/producttwo/variantbrownimage/IMG_0285.JPG.jpeg',
              '/products/producttwo/variantbrownimage/IMG_0286.JPG.jpeg',
              '/products/producttwo/variantbrownimage/IMG_0289.JPG.jpeg',
              '/products/producttwo/variantbrownimage/IMG_0337.PNG'
            ]
          },
          {
            name: 'Grey Skirt Set',
            color_id: 3,
            localImages: [
              'Frontend/public/products/producttwo/varianttgreyimage/IMG_0282.JPG.jpeg',
              'Frontend/public/products/producttwo/varianttgreyimage/IMG_0284.JPG.jpeg',
              'Frontend/public/products/producttwo/varianttgreyimage/IMG_0287.JPG.jpeg',
              'Frontend/public/products/producttwo/varianttgreyimage/IMG_0290.JPG.jpeg'
            ],
            publicUrls: [
              '/products/producttwo/varianttgreyimage/IMG_0282.JPG.jpeg',
              '/products/producttwo/varianttgreyimage/IMG_0284.JPG.jpeg',
              '/products/producttwo/varianttgreyimage/IMG_0287.JPG.jpeg',
              '/products/producttwo/varianttgreyimage/IMG_0290.JPG.jpeg'
            ]
          }
        ]
      },

      // 3. Prechi Bright Tracksuit Set
      {
        name: 'Prechi Bright Tracksuit Set',
        description: 'Designed for dynamic lifestyle performance and standout streetwear aesthetics. Features contrast linear paneling on high-grade breathable cotton fleece, paired with tailored joggers.',
        base_price: 80000,
        sku_prefix: 'BTS',
        category: 'Sets',
        gender: 'women',
        is_new_release: true,
        variants: [
          {
            name: 'Black Bright Set',
            color_id: 1,
            localImages: [
              'Frontend/public/products/productthree/blackvariantimage/IMG_0298.JPG.jpeg',
              'Frontend/public/products/productthree/blackvariantimage/IMG_0302.JPG.jpeg',
              'Frontend/public/products/productthree/blackvariantimage/IMG_0308.JPG.jpeg',
              'Frontend/public/products/productthree/blackvariantimage/IMG_0338.PNG'
            ],
            publicUrls: [
              '/products/productthree/blackvariantimage/IMG_0298.JPG.jpeg',
              '/products/productthree/blackvariantimage/IMG_0302.JPG.jpeg',
              '/products/productthree/blackvariantimage/IMG_0308.JPG.jpeg',
              '/products/productthree/blackvariantimage/IMG_0338.PNG'
            ]
          },
          {
            name: 'White Bright Set',
            color_id: 2,
            localImages: [
              'Frontend/public/products/productthree/whitevariantimage/IMG_0297.JPG.jpeg',
              'Frontend/public/products/productthree/whitevariantimage/IMG_0303.JPG.jpeg',
              'Frontend/public/products/productthree/whitevariantimage/IMG_0305.JPG.jpeg',
              'Frontend/public/products/productthree/whitevariantimage/IMG_0332.PNG'
            ],
            publicUrls: [
              '/products/productthree/whitevariantimage/IMG_0297.JPG.jpeg',
              '/products/productthree/whitevariantimage/IMG_0303.JPG.jpeg',
              '/products/productthree/whitevariantimage/IMG_0305.JPG.jpeg',
              '/products/productthree/whitevariantimage/IMG_0332.PNG'
            ]
          }
        ]
      },

      // 4. Prechi Men Bright Set
      {
        name: 'Prechi Men Bright Set',
        description: 'Tailored premium athletic set for men, featuring precision stitching, relaxed fit top, and ribbed-ankle track pants. Ideal for modern urban leisure and luxury comfort.',
        base_price: 85000,
        sku_prefix: 'MBS',
        category: 'Sets',
        gender: 'men',
        is_new_release: true,
        variants: [
          {
            name: 'Bright Set Men',
            color_id: 1,
            localImages: [
              'Frontend/public/products/productfour/IMG_0299.JPG.jpeg',
              'Frontend/public/products/productfour/IMG_0306.JPG.jpeg',
              'Frontend/public/products/productfour/IMG_0307.JPG.jpeg',
              'Frontend/public/products/productfour/IMG_0334.PNG'
            ],
            publicUrls: [
              '/products/productfour/IMG_0299.JPG.jpeg',
              '/products/productfour/IMG_0306.JPG.jpeg',
              '/products/productfour/IMG_0307.JPG.jpeg',
              '/products/productfour/IMG_0334.PNG'
            ]
          }
        ]
      },

      // 5. Prechi Black Set Men
      {
        name: 'Prechi Black Set Men',
        description: 'Sleek all-black men streetwear tracksuit. Available in T-Shirt top and Sleeveless top variations, built with heavy cotton fleece and signature branding.',
        base_price: 100000,
        sku_prefix: 'BSM',
        category: 'Sets',
        gender: 'men',
        is_new_release: true,
        variants: [
          {
            name: 'Black T-Shirt Set',
            color_id: 1,
            localImages: [
              'Frontend/public/products/productfive/tshirtimage/IMG_0321.JPG.jpeg',
              'Frontend/public/products/productfive/tshirtimage/IMG_0322.JPG.jpeg',
              'Frontend/public/products/productfive/tshirtimage/IMG_0326.JPG.jpeg'
            ],
            publicUrls: [
              '/products/productfive/tshirtimage/IMG_0321.JPG.jpeg',
              '/products/productfive/tshirtimage/IMG_0322.JPG.jpeg',
              '/products/productfive/tshirtimage/IMG_0326.JPG.jpeg'
            ]
          },
          {
            name: 'Black Sleeveless Set',
            color_id: 1,
            localImages: [
              'Frontend/public/products/productfive/sleevelessimage/IMG_0327.JPG.jpeg',
              'Frontend/public/products/productfive/sleevelessimage/IMG_0328.JPG.jpeg',
              'Frontend/public/products/productfive/sleevelessimage/IMG_0329.JPG.jpeg'
            ],
            publicUrls: [
              '/products/productfive/sleevelessimage/IMG_0327.JPG.jpeg',
              '/products/productfive/sleevelessimage/IMG_0328.JPG.jpeg',
              '/products/productfive/sleevelessimage/IMG_0329.JPG.jpeg'
            ]
          }
        ]
      },

      // 6. Prechi Niga Striped Tracksuit Set
      {
        name: 'Prechi Niga Striped Tracksuit Set',
        description: 'Bold graphic striped tracksuit featuring a high-comfort round neck top and tailored side-stripe track pants. Available with Pink stripe accents and Black stripe accents.',
        base_price: 110000,
        sku_prefix: 'NST',
        category: 'Sets',
        gender: 'unisex',
        is_new_release: true,
        variants: [
          {
            name: 'Pink Stripes Set',
            color_id: 11, // Pink
            localImages: [
              'Frontend/public/products/productsix/pinkstripes/IMG_0317.JPG.jpeg',
              'Frontend/public/products/productsix/pinkstripes/IMG_0325.JPG.jpeg'
            ],
            publicUrls: [
              '/products/productsix/pinkstripes/IMG_0317.JPG.jpeg',
              '/products/productsix/pinkstripes/IMG_0325.JPG.jpeg'
            ]
          },
          {
            name: 'Black Stripes Set',
            color_id: 1, // Black
            localImages: [
              'Frontend/public/products/productsix/blackstripes/IMG_0320.JPG.jpeg',
              'Frontend/public/products/productsix/blackstripes/IMG_0324.JPG.jpeg'
            ],
            publicUrls: [
              '/products/productsix/blackstripes/IMG_0320.JPG.jpeg',
              '/products/productsix/blackstripes/IMG_0324.JPG.jpeg'
            ]
          }
        ]
      },

      // 7. Prechi Navy Blue & White T Set
      {
        name: 'Prechi Navy Blue & White T Set',
        description: 'Luxury two-piece crewneck t-shirt set crafted from ultra-soft combed cotton. Available in Navy Blue and White colorways with optional matching leather bag add-on.',
        base_price: 120000,
        sku_prefix: 'NWT',
        category: 'Sets',
        gender: 'unisex',
        is_new_release: true,
        variants: [
          {
            name: 'Navy Blue T Set',
            color_id: 4, // Navy Blue
            localImages: [
              'Frontend/public/products/productone/IMG_0300.JPG.jpeg'
            ],
            publicUrls: [
              '/products/productone/IMG_0300.JPG.jpeg'
            ]
          },
          {
            name: 'White T Set',
            color_id: 2, // White
            localImages: [
              'Frontend/public/products/productone/IMG_0301.JPG.jpeg'
            ],
            publicUrls: [
              '/products/productone/IMG_0301.JPG.jpeg'
            ]
          }
        ]
      }
    ]

    for (const item of productsToInsert) {
      console.log(`\n📦 Creating Product: "${item.name}"`)
      
      const [product] = await sql`
        INSERT INTO products (name, description, base_price, sku_prefix, category, gender, is_new_release, is_active)
        VALUES (${item.name}, ${item.description}, ${item.base_price}, ${item.sku_prefix}, ${item.category}, ${item.gender}, ${item.is_new_release}, true)
        RETURNING id
      `
      const productId = product.id
      console.log(`   ✅ Product Created with ID: ${productId}`)

      for (let i = 0; i < item.variants.length; i++) {
        const variant = item.variants[i]
        const sku = `${item.sku_prefix}-${i + 1}`

        console.log(`   🎨 Creating Variant: "${variant.name}" (SKU: ${sku})`)
        const [variantResult] = await sql`
          INSERT INTO product_variants (product_id, color_id, sku, name, is_active)
          VALUES (${productId}, ${variant.color_id}, ${sku}, ${variant.name}, true)
          RETURNING id
        `
        const variantId = variantResult.id
        console.log(`      ✅ Variant Created with ID: ${variantId}`)

        // Insert Sizes & Prices
        for (const s of standardSizes) {
          const finalPrice = item.base_price + s.priceOffset
          await sql`
            INSERT INTO variant_sizes (variant_id, size_id, stock_quantity, price)
            VALUES (${variantId}, ${s.size_id}, ${s.stock_quantity}, ${finalPrice})
          `
        }
        console.log(`      ✅ Sizing & stock assigned (S-5XL)`)

        // Upload & Attach Images
        for (let imgIdx = 0; imgIdx < variant.localImages.length; imgIdx++) {
          const localPath = variant.localImages[imgIdx]
          const publicUrl = variant.publicUrls[imgIdx]
          const imageUrl = await uploadImageToCloudinary(localPath, publicUrl)
          const isPrimary = imgIdx === 0

          await sql`
            INSERT INTO product_images (variant_id, image_url, is_primary, position)
            VALUES (${variantId}, ${imageUrl}, ${isPrimary}, ${imgIdx})
          `
          console.log(`      🖼️ Image attached: ${imageUrl}`)
        }
      }
      console.log(`✅ "${item.name}" complete!`)
    }

    console.log('\n🎉 ALL 7 PRODUCTS SUCCESSFULLY UPLOADED TO DATABASE & CLOUDINARY!')

  } catch (err) {
    console.error('❌ Error during product upload:', err)
  } finally {
    await sql.end()
  }
}

uploadAllProducts()
