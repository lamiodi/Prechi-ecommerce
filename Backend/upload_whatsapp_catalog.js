import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: './.env' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

async function uploadToCloudinary(publicUrl) {
  const relativePath = `Frontend/public${publicUrl}`;
  const fullPath = path.resolve(__dirname, '../', relativePath);
  try {
    console.log(`  ☁️ Uploading to Cloudinary: ${publicUrl}`);
    const res = await cloudinary.uploader.upload(fullPath, {
      folder: 'prechi_products'
    });
    console.log(`  ✅ Cloudinary URL: ${res.secure_url}`);
    return res.secure_url;
  } catch (err) {
    console.warn(`  ⚠️ Cloudinary upload warning for ${publicUrl}: ${err.message}. Using fallback: ${publicUrl}`);
    return publicUrl;
  }
}

const whatsappProducts = [
  {
    name: 'Short Skirt Set',
    description: 'An exquisite two-piece ensemble engineered for elevated comfort and sleek street tailoring. Crafted from premium heavyweight fleece, this set features a relaxed drawstring cropped hoodie paired with a floor-length elasticated high-waisted skirt. Accented with signature tonal Prechi embroidery.',
    base_price: 80000,
    sku_prefix: 'SSS',
    category: 'Sets',
    gender: 'women',
    color_id: 2, // White
    images: [
      '/products/IMG_0272.JPG.jpeg',
      '/products/IMG_0273.JPG.jpeg',
      '/products/IMG_0275.JPG.jpeg',
      '/products/IMG_0277.JPG.jpeg',
      '/products/IMG_0278.JPG.jpeg',
      '/products/IMG_0279.JPG.jpeg',
      '/products/IMG_0280.JPG.jpeg',
      '/products/IMG_0282.JPG.jpeg',
      '/products/IMG_0284.JPG.jpeg',
      '/products/IMG_0285.JPG.jpeg',
      '/products/IMG_0286.JPG.jpeg',
      '/products/IMG_0287.JPG.jpeg',
      '/products/IMG_0289.JPG.jpeg',
      '/products/IMG_0290.JPG.jpeg',
      '/products/IMG_0337.PNG'
    ]
  },
  {
    name: 'Short Skirt Set - White Inner',
    description: 'The essential base piece designed to complement the Short Skirt Set. Cut from soft combed cotton stretch jersey, featuring a minimalist silhouette with contrast embroidery across the front.',
    base_price: 10000,
    sku_prefix: 'SWI',
    category: 'Tops',
    gender: 'women',
    color_id: 2, // White
    images: [
      '/products/IMG_0337.PNG',
      '/products/IMG_0285.JPG.jpeg'
    ]
  },
  {
    name: 'Bright Set (Women)',
    description: 'Vibrant luxury loungewear crafted from premium fleece. Features relaxed wide-leg bermuda shorts with ruffled waistband trim paired with a tailored cropped rib tank top, completed with custom "Pc Style" embroidered detailing.',
    base_price: 80000,
    sku_prefix: 'BSW',
    category: 'Sets',
    gender: 'women',
    color_id: 6, // Beige / Bright
    images: [
      '/products/IMG_0297.JPG.jpeg',
      '/products/IMG_0298.JPG.jpeg',
      '/products/IMG_0302.JPG.jpeg',
      '/products/IMG_0303.JPG.jpeg',
      '/products/IMG_0305.JPG.jpeg',
      '/products/IMG_0308.JPG.jpeg',
      '/products/IMG_0332.PNG',
      '/products/IMG_0338.PNG'
    ]
  },
  {
    name: 'Men Bright Set',
    description: 'A modern streetwear uniform featuring heavyweight fleece bermuda shorts with custom embroidered branding paired with a ribbed fitted muscle tank. Engineered for maximum relaxed comfort with refined tailored lines.',
    base_price: 85000,
    sku_prefix: 'BSM',
    category: 'Sets',
    gender: 'men',
    color_id: 6, // Beige / Bright
    images: [
      '/products/IMG_0299.JPG.jpeg',
      '/products/IMG_0306.JPG.jpeg',
      '/products/IMG_0307.JPG.jpeg',
      '/products/IMG_0334.PNG'
    ]
  },
  {
    name: 'Prechi Bag',
    description: 'The ultimate statement travel companion. Milled from durable water-resistant nylon with quilted puffer padding, dual reinforced webbed carry handles, adjustable shoulder strap, and iconic "style@PC" editorial embroidery.',
    base_price: 70000,
    sku_prefix: 'PBG',
    category: 'Bags',
    gender: 'unisex',
    color_id: 5, // Brown
    images: [
      '/products/IMG_0300.JPG.jpeg',
      '/products/IMG_0301.JPG.jpeg',
      '/products/IMG_0304.JPG.jpeg',
      '/products/IMG_0308.JPG.jpeg'
    ]
  },
  {
    name: 'Black Set Men - Round Neck',
    description: 'Sophisticated dark luxury 2-piece set. Features structured heavyweight fleece lounge pants paired with an oversized luxury round neck sweatshirt, adorned with custom Prechi logo emblem embroidery.',
    base_price: 110000,
    sku_prefix: 'BMR',
    category: 'Sets',
    gender: 'men',
    color_id: 1, // Black
    images: [
      '/products/IMG_0321.JPG.jpeg',
      '/products/IMG_0322.JPG.jpeg',
      '/products/IMG_0326.JPG.jpeg',
      '/products/IMG_0327.JPG.jpeg',
      '/products/IMG_0328.JPG.jpeg'
    ]
  },
  {
    name: 'Black Set Men - Sleeveless',
    description: 'Clean, minimalist black two-piece set combining wide-leg fleece shorts/pants with a custom fitted ribbed sleeveless tank. Designed for effortless summer layering and everyday drip.',
    base_price: 100000,
    sku_prefix: 'BMS',
    category: 'Sets',
    gender: 'men',
    color_id: 1, // Black
    images: [
      '/products/IMG_0328.JPG.jpeg',
      '/products/IMG_0329.JPG.jpeg'
    ]
  },
  {
    name: 'Niga Set',
    description: 'Tailored contemporary 2-piece set featuring relaxed tapered fleece trousers and a luxury crewneck top with refined contrast trim and chest branding.',
    base_price: 110000,
    sku_prefix: 'NGS',
    category: 'Sets',
    gender: 'men',
    color_id: 1, // Black / Dark
    images: [
      '/products/IMG_0317.JPG.jpeg',
      '/products/IMG_0318.JPG.jpeg',
      '/products/IMG_0319.JPG.jpeg',
      '/products/IMG_0320.JPG.jpeg',
      '/products/IMG_0323.JPG.jpeg',
      '/products/IMG_0324.JPG.jpeg',
      '/products/IMG_0325.JPG.jpeg'
    ]
  },
  {
    name: 'Army Black Set',
    description: 'Tactical aesthetic meets streetwear luxury. Crafted from heavy-gauge cotton fleece in a utility-inspired dark army silhouette with reinforced seam construction and subtle emblem detailing.',
    base_price: 120000,
    sku_prefix: 'ABS',
    category: 'Sets',
    gender: 'unisex',
    color_id: 1, // Black
    images: [
      '/products/IMG_0291.JPG.jpeg',
      '/products/IMG_0293.JPG.jpeg',
      '/products/IMG_0294.JPG.jpeg',
      '/products/IMG_0295.JPG.jpeg',
      '/products/IMG_0296.JPG.jpeg'
    ]
  },
  {
    name: 'Lilac Set Men',
    description: 'A bold statement piece in soft lilac. Cut from ultra-soft brushed fleece with an oversized fit, drop-shoulder pullover top, and matching tailored fleece trousers.',
    base_price: 120000,
    sku_prefix: 'LSM',
    category: 'Sets',
    gender: 'men',
    color_id: 11, // Pink / Lilac
    images: [
      '/products/IMG_0293.JPG.jpeg',
      '/products/IMG_0335.PNG',
      '/products/IMG_0339.PNG',
      '/products/IMG_0342.PNG'
    ]
  },
  {
    name: 'White Fix Set',
    description: 'Pristine white luxury 2-piece loungewear set. Milled from premium heavyweight cotton with clean minimalist lines, tonal stitching, and discreet branding for a crisp, high-end finish.',
    base_price: 120000,
    sku_prefix: 'WFS',
    category: 'Sets',
    gender: 'unisex',
    color_id: 2, // White
    images: [
      '/products/IMG_0310.JPG.jpeg',
      '/products/IMG_0312.JPG.jpeg',
      '/products/IMG_0314.JPG.jpeg',
      '/products/IMG_0316.JPG.jpeg'
    ]
  },
  {
    name: 'Navy Blue / White T Set',
    description: 'Classic dual-tone 2-piece set in deep navy blue accented with crisp white stripe trim. Designed with an athletic yet refined drape for versatile daily luxury.',
    base_price: 120000,
    sku_prefix: 'NTS',
    category: 'Sets',
    gender: 'unisex',
    color_id: 4, // Navy Blue
    images: [
      '/products/IMG_0309.JPG.jpeg',
      '/products/IMG_0311.JPG.jpeg',
      '/products/IMG_0313.JPG.jpeg',
      '/products/IMG_0315.JPG.jpeg'
    ]
  }
];

// Available sizes IDs: 2: S, 3: M, 4: L, 5: XL, 6: 2XL
const sizeIds = [2, 3, 4, 5, 6];

async function seedWhatsAppProducts() {
  console.log(`🚀 Starting Cloudinary catalog upload for ${whatsappProducts.length} products...`);

  try {
    for (const item of whatsappProducts) {
      console.log(`\n📦 Processing: ${item.name} (${item.sku_prefix})`);

      // Check if product already exists with SKU prefix
      const existing = await sql`SELECT id FROM products WHERE sku_prefix = ${item.sku_prefix}`;
      let productId;

      if (existing.length > 0) {
        productId = existing[0].id;
        console.log(`   ℹ️ Product already exists (ID: ${productId}). Updating details...`);
        await sql`
          UPDATE products
          SET name = ${item.name},
              description = ${item.description},
              base_price = ${item.base_price},
              category = ${item.category},
              gender = ${item.gender},
              is_active = true
          WHERE id = ${productId}
        `;
      } else {
        const [newProduct] = await sql`
          INSERT INTO products (name, description, base_price, sku_prefix, category, gender, is_new_release, is_active)
          VALUES (${item.name}, ${item.description}, ${item.base_price}, ${item.sku_prefix}, ${item.category}, ${item.gender}, true, true)
          RETURNING id
        `;
        productId = newProduct.id;
        console.log(`   ✅ Product created with ID: ${productId}`);
      }

      // Insert / Update Product Variant
      const variantSku = `${item.sku_prefix}-1`;
      const existingVariant = await sql`SELECT id FROM product_variants WHERE product_id = ${productId}`;
      let variantId;

      if (existingVariant.length > 0) {
        variantId = existingVariant[0].id;
      } else {
        const [newVariant] = await sql`
          INSERT INTO product_variants (product_id, color_id, sku, name)
          VALUES (${productId}, ${item.color_id}, ${variantSku}, NULL)
          RETURNING id
        `;
        variantId = newVariant.id;
        console.log(`   🎨 Variant created with ID: ${variantId}`);
      }

      // Add size stock
      for (const sId of sizeIds) {
        const sizePrice = (sId >= 6) ? item.base_price + 5000 : item.base_price;
        await sql`
          INSERT INTO variant_sizes (variant_id, size_id, stock_quantity, price)
          VALUES (${variantId}, ${sId}, 25, ${sizePrice})
          ON CONFLICT (variant_id, size_id) DO UPDATE
          SET stock_quantity = EXCLUDED.stock_quantity, price = EXCLUDED.price
        `;
      }
      console.log(`   📏 Sizes and stock quantities configured (S - 2XL)`);

      // Clean & insert images with Cloudinary URLs
      await sql`DELETE FROM product_images WHERE variant_id = ${variantId}`;
      for (let idx = 0; idx < item.images.length; idx++) {
        const publicUrl = item.images[idx];
        const cloudinaryUrl = await uploadToCloudinary(publicUrl);
        await sql`
          INSERT INTO product_images (variant_id, image_url, is_primary, position)
          VALUES (${variantId}, ${cloudinaryUrl}, ${idx === 0}, ${idx})
        `;
      }
      console.log(`   🖼️ Inserted ${item.images.length} Cloudinary product images`);
    }

    console.log('\n🎉 ALL PRODUCTS & CLOUDINARY IMAGES SUCCESSFULLY UPLOADED & INTEGRATED!');
  } catch (err) {
    console.error('❌ Upload failed with error:', err);
  } finally {
    await sql.end();
  }
}

seedWhatsAppProducts().catch(console.error);

