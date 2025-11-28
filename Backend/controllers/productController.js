// Backend/controllers/productController.js
import sql from '../db/index.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadProduct = async (req, res) => {
  const { name, description, base_price, sku_prefix, category, gender, variants } = JSON.parse(req.body.data);
  const files = req.files;
  
  if (!name || !base_price || !sku_prefix || !variants || !Object.keys(files).length) {
    return res.status(400).json({ error: 'Missing required fields or images' });
  }

  try {
    await sql.begin(async (sql) => {
      const [product] = await sql`
        INSERT INTO products (name, description, base_price, sku_prefix, category, gender)
        VALUES (${name}, ${description || ''}, ${base_price}, ${sku_prefix}, ${category || null}, ${gender || null})
        RETURNING id
      `;
      const productId = product.id;

      for (const [index, variant] of variants.entries()) {
        const [variantResult] = await sql`
          INSERT INTO product_variants (product_id, color_id, sku, name)
          VALUES (${productId}, ${variant.color_id}, ${`${sku_prefix}-${index}`}, ${variant.name || null})
          RETURNING id
        `;
        const variantId = variantResult.id;

        for (const size of variant.sizes) {
          await sql`
            INSERT INTO variant_sizes (variant_id, size_id, stock_quantity, price)
            VALUES (${variantId}, ${size.size_id}, ${size.stock_quantity || 0}, ${size.price || 0})
          `;
        }

        const images = files[`images_${index}`] || [];
        for (const file of images) {
          const uploaded = await cloudinary.uploader.upload(file.path);
          await sql`
            INSERT INTO product_images (variant_id, image_url, is_primary)
            VALUES (${variantId}, ${uploaded.secure_url}, ${images.indexOf(file) === 0})
          `;
          await fs.unlink(file.path);
        }

        // Handle video uploads
        const videos = files[`videos_${index}`] || [];
        for (const file of videos) {
          // Upload video to Cloudinary with video-specific settings
          const uploaded = await cloudinary.uploader.upload(file.path, {
            resource_type: 'video',
            folder: 'product_videos',
            transformation: [
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          });
          
          // Generate thumbnail from video (first frame)
          const thumbnailUrl = cloudinary.url(uploaded.public_id, {
            resource_type: 'video',
            format: 'jpg',
            transformation: [
              { width: 640, height: 360, crop: 'fill' },
              { quality: 'auto' }
            ]
          });
          
          await sql`
            INSERT INTO product_videos (variant_id, video_url, video_thumbnail_url, title, position, is_primary)
            VALUES (${variantId}, ${uploaded.secure_url}, ${thumbnailUrl}, ${`Product Video ${videos.indexOf(file) + 1}`}, ${videos.indexOf(file)}, ${videos.indexOf(file) === 0})
          `;
          await fs.unlink(file.path);
        }
      }
    });

    res.status(201).json({ message: 'Product created successfully' });
  } catch (err) {
    console.error('Upload product error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Use the optimized function for single query retrieval
    const result = await sql`
      SELECT * FROM public.get_product_or_bundle_optimized(${id})
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const item = result[0];
    return res.json({
      type: item.item_type,
      data: {
        id: item.item_id,
        name: item.name,
        description: item.description,
        price: item.price,
        sku_prefix: item.sku_prefix,
        is_active: item.is_active,
        bundle_type: item.bundle_type,
        variants: item.variants,
        images: item.images,
        videos: item.videos,
        total_stock: item.total_stock
      }
    });
  } catch (err) {
    console.error('Get product error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

