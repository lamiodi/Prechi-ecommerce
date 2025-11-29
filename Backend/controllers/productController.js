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
  
  // Enhanced validation with detailed error messages
  const validationErrors = [];
  
  // Get valid color IDs from database for validation
  let validColorIds = [];
  try {
    const colorResult = await sql`
      SELECT id, color_name FROM colors ORDER BY id
    `;
    validColorIds = colorResult.map(c => c.id);
  } catch (colorErr) {
    console.warn('Could not fetch colors for validation, using fallback validation');
    // Fallback: assume standard color IDs 1-12 are valid
    validColorIds = Array.from({length: 12}, (_, i) => i + 1);
  }
  
  if (!name || !name.trim()) {
    validationErrors.push('Product name is required');
  }
  
  if (!sku_prefix || !sku_prefix.trim()) {
    validationErrors.push('SKU prefix is required');
  } else if (sku_prefix.length !== 3) {
    validationErrors.push('SKU prefix must be exactly 3 characters');
  }
  
  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    validationErrors.push('At least one product variant is required');
  }
  
  if (!files || !Object.keys(files).length) {
    validationErrors.push('Product images are required');
  }
  
  // Validate variants structure
  if (variants && Array.isArray(variants)) {
    variants.forEach((variant, index) => {
      if (!variant.name || !variant.name.trim()) {
        validationErrors.push(`Variant ${index + 1} name is required`);
      }
      if (!variant.color_id) {
        validationErrors.push(`Variant ${index + 1} color is required`);
      } else if (!validColorIds.includes(variant.color_id)) {
        validationErrors.push(`Variant ${index + 1} has an invalid color ID`);
      }
      if (!variant.sizes || !Array.isArray(variant.sizes)) {
        validationErrors.push(`Variant ${index + 1} sizes are required`);
      } else {
        const hasStock = variant.sizes.some(size => size.stock_quantity > 0);
        if (!hasStock) {
          validationErrors.push(`Variant ${index + 1} must have stock in at least one size`);
        }
        // Validate that sizes with stock have prices
        variant.sizes.forEach((size, sizeIndex) => {
          if (size.stock_quantity > 0 && (!size.price || parseFloat(size.price) <= 0)) {
            validationErrors.push(`Variant ${index + 1} size ${sizeIndex + 1} with stock must have a valid price`);
          }
        });
      }
    });
  }
  
  if (validationErrors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: validationErrors 
    });
  }

  // Validate file uploads
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/avi', 'video/x-msvideo'];
  const maxImageSize = 5 * 1024 * 1024; // 5MB
  const maxVideoSize = 50 * 1024 * 1024; // 50MB

  try {
    // Validate image files
    Object.keys(files).forEach(key => {
      if (key.startsWith('images_')) {
        files[key].forEach(file => {
          if (!allowedImageTypes.includes(file.mimetype)) {
            throw new Error(`Invalid image format for ${file.originalname}. Allowed formats: JPEG, PNG, WebP`);
          }
          if (file.size > maxImageSize) {
            throw new Error(`Image ${file.originalname} is too large. Maximum size: 5MB`);
          }
        });
      } else if (key.startsWith('videos_')) {
        files[key].forEach(file => {
          if (!allowedVideoTypes.includes(file.mimetype)) {
            throw new Error(`Invalid video format for ${file.originalname}. Allowed formats: MP4, MOV, AVI`);
          }
          if (file.size > maxVideoSize) {
            throw new Error(`Video ${file.originalname} is too large. Maximum size: 50MB`);
          }
        });
      }
    });
  } catch (fileError) {
    return res.status(400).json({ 
      error: 'File validation failed',
      details: [fileError.message] 
    });
  }

  try {
    await sql.begin(async (sql) => {
      const [product] = await sql`
        INSERT INTO products (name, description, base_price, sku_prefix, category, gender)
        VALUES (${name}, ${description || ''}, ${base_price || null}, ${sku_prefix}, ${category || null}, ${gender || null})
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
    
    // Handle specific database errors
    if (err.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({ 
        error: 'A product with this SKU prefix already exists',
        details: ['Please choose a different SKU prefix']
      });
    } else if (err.code === '23502') {
      // Not null constraint violation
      return res.status(400).json({ 
        error: 'Missing required field',
        details: ['Please ensure all required fields are filled']
      });
    } else if (err.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({ 
        error: 'Invalid reference',
        details: ['Please check that selected categories, colors, and sizes are valid']
      });
    }
    
    res.status(500).json({ 
      error: 'Server error during product upload',
      details: ['Please try again or contact support if the issue persists']
    });
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

