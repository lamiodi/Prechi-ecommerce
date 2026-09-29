import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: './Backend/.env' });

if (!process.env.DATABASE_URL) {
  dotenv.config(); // fallback to root .env
}

const connectionOptions = {
  ssl: 'require',
  max: 1,
  idle_timeout: 30,
  connect_timeout: 10
};

const sql = postgres(process.env.DATABASE_URL, connectionOptions);

async function uploadBatchProducts(filePath = './products_batch.json') {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ File not found: ${absolutePath}`);
    console.log(`💡 Copy 'products_batch_example.json' to 'products_batch.json' and fill in your WhatsApp product details.`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(absolutePath, 'utf8');
  const products = JSON.parse(fileContent);

  console.log(`📦 Preparing to upload ${products.length} products to database...`);

  try {
    await sql.begin(async (sql) => {
      for (const product of products) {
        console.log(`\nInserting product: ${product.name}`);

        const [insertedProduct] = await sql`
          INSERT INTO products (name, description, base_price, sku_prefix, category, gender, is_new_release, is_active)
          VALUES (${product.name}, ${product.description || ''}, ${product.base_price || 0}, ${product.sku_prefix}, ${product.category || 'general'}, ${product.gender || 'unisex'}, ${product.is_new_release ?? true}, true)
          RETURNING id
        `;
        const productId = insertedProduct.id;

        if (product.variants && Array.isArray(product.variants)) {
          for (let i = 0; i < product.variants.length; i++) {
            const variant = product.variants[i];
            const variantSku = `${product.sku_prefix}-${i + 1}`;

            const [insertedVariant] = await sql`
              INSERT INTO product_variants (product_id, color_id, sku, name)
              VALUES (${productId}, ${variant.color_id || 1}, ${variantSku}, ${variant.name || 'Default Variant'})
              RETURNING id
            `;
            const variantId = insertedVariant.id;

            if (variant.sizes && Array.isArray(variant.sizes)) {
              for (const size of variant.sizes) {
                await sql`
                  INSERT INTO variant_sizes (variant_id, size_id, stock_quantity, price)
                  VALUES (${variantId}, ${size.size_id}, ${size.stock_quantity || 0}, ${size.price || product.base_price || 0})
                `;
              }
            }

            if (product.images && Array.isArray(product.images)) {
              for (let imgIdx = 0; imgIdx < product.images.length; imgIdx++) {
                const imgUrl = product.images[imgIdx];
                await sql`
                  INSERT INTO product_images (variant_id, image_url, is_primary, position)
                  VALUES (${variantId}, ${imgUrl}, ${imgIdx === 0}, ${imgIdx})
                `;
              }
            }
          }
        }
      }
    });

    console.log(`\n🎉 Successfully uploaded ${products.length} WhatsApp products!`);
  } catch (error) {
    console.error(`❌ Upload failed:`, error);
  } finally {
    await sql.end();
  }
}

const batchFile = process.argv[2] || './products_batch.json';
uploadBatchProducts(batchFile).catch(console.error);
