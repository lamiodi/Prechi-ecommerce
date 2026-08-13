import dotenv from 'dotenv';
import path from 'path';
import postgres from 'postgres';

dotenv.config({ path: path.resolve('./Backend/.env') });

const dbUrl = process.env.DATABASE_URL;
const sql = postgres(dbUrl, { ssl: 'require' });

async function setupWhiteVariant() {
  try {
    const productId = 47; // Prechi Men Bright Set
    console.log("Checking colors...");
    let whiteColor = await sql`SELECT * FROM colors WHERE LOWER(color_name) = 'white' LIMIT 1`;
    if (whiteColor.length === 0) {
      whiteColor = await sql`INSERT INTO colors (color_name, color_code) VALUES ('White', '#FFFFFF') RETURNING *`;
    }
    const whiteColorId = whiteColor[0].id;
    console.log("White color ID:", whiteColorId);

    // Check if variant for White already exists on product 47
    let existingVariant = await sql`
      SELECT * FROM product_variants WHERE product_id = ${productId} AND color_id = ${whiteColorId}
    `;

    let variantId;
    if (existingVariant.length === 0) {
      const newVariant = await sql`
        INSERT INTO product_variants (product_id, color_id, sku, is_active)
        VALUES (${productId}, ${whiteColorId}, 'MBS-WHITE', true)
        RETURNING *
      `;
      variantId = newVariant[0].id;
      console.log("Created new White variant ID:", variantId);
    } else {
      variantId = existingVariant[0].id;
      console.log("Found existing White variant ID:", variantId);
    }

    // Ensure variant sizes S, M, L, XL, 2XL, 3XL, 4XL, 5XL exist for this variant
    const sizesList = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    for (const sizeName of sizesList) {
      const sizeObj = await sql`SELECT id FROM sizes WHERE UPPER(size_name) = ${sizeName} LIMIT 1`;
      if (sizeObj.length > 0) {
        const sizeId = sizeObj[0].id;
        const vsCheck = await sql`
          SELECT id FROM variant_sizes WHERE variant_id = ${variantId} AND size_id = ${sizeId}
        `;
        if (vsCheck.length === 0) {
          await sql`
            INSERT INTO variant_sizes (variant_id, size_id, stock_quantity)
            VALUES (${variantId}, ${sizeId}, 50)
          `;
        }
      }
    }
    console.log("Variant sizes added/verified.");

    // Check existing images for this white variant
    const existingImages = await sql`SELECT * FROM product_images WHERE variant_id = ${variantId}`;
    console.log("Existing images count for White variant:", existingImages.length);

    // If no images exist, copy Cloudinary URLs from product 46 white variant (or productfour IMG_0334.PNG)
    if (existingImages.length === 0) {
      const whiteImageUrls = [
        'https://res.cloudinary.com/dwhwdkfia/image/upload/v1786620598/prechi_products/e9osru5qcojos3scstpa.jpg',
        'https://res.cloudinary.com/dwhwdkfia/image/upload/v1786620602/prechi_products/yjuuis0tkiweinovfbvy.jpg',
        'https://res.cloudinary.com/dwhwdkfia/image/upload/v1786620606/prechi_products/hcclgxzodowyb9cwgjpx.jpg',
        'https://res.cloudinary.com/dwhwdkfia/image/upload/v1786620608/prechi_products/wc74ekpzugqki1bn2ng8.jpg'
      ];
      for (let i = 0; i < whiteImageUrls.length; i++) {
        await sql`
          INSERT INTO product_images (variant_id, image_url, is_primary, position)
          VALUES (${variantId}, ${whiteImageUrls[i]}, ${i === 0}, ${i + 1})
        `;
      }
      console.log("Linked 4 White variant images successfully!");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

setupWhiteVariant();
