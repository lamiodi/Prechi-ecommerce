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
    validColorIds = Array.from({ length: 12 }, (_, i) => i + 1);
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
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/avi', 'video/x-msvideo'];
  const maxImageSize = 10 * 1024 * 1024; // 10MB
  const maxVideoSize = 100 * 1024 * 1024; // 100MB

  try {
    // Validate image files
    Object.keys(files).forEach(key => {
      if (key.startsWith('images_')) {
        files[key].forEach(file => {
          if (!allowedImageTypes.includes(file.mimetype)) {
            throw new Error(`Invalid image format for ${file.originalname}. Allowed formats: JPEG, PNG, WebP, HEIC`);
          }
          if (file.size > maxImageSize) {
            throw new Error(`Image ${file.originalname} is too large. Maximum size: 10MB`);
          }
        });
      } else if (key.startsWith('videos_')) {
        files[key].forEach(file => {
          if (!allowedVideoTypes.includes(file.mimetype)) {
            throw new Error(`Invalid video format for ${file.originalname}. Allowed formats: MP4, MOV, AVI`);
          }
          if (file.size > maxVideoSize) {
            throw new Error(`Video ${file.originalname} is too large. Maximum size: 100MB`);
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

const toTitleCase = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => {
      if (!word) return '';
      if (word.includes('-')) {
        return word
          .split('-')
          .map(p => p.charAt(0).toUpperCase() + p.slice(1))
          .join('-');
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

  try {
    await sql.begin(async (sql) => {
      const formattedName = toTitleCase(name);
      const formattedCategory = category ? toTitleCase(category) : null;

      const [product] = await sql`
        INSERT INTO products (name, description, base_price, sku_prefix, category, gender)
        VALUES (${formattedName}, ${description || ''}, ${base_price || null}, ${sku_prefix}, ${formattedCategory}, ${gender || null})
        RETURNING id
      `;
      const productId = product.id;

      for (const [index, variant] of variants.entries()) {
        const formattedVariantName = variant.name ? toTitleCase(variant.name) : null;

        const [variantResult] = await sql`
          INSERT INTO product_variants (product_id, color_id, sku, name)
          VALUES (${productId}, ${variant.color_id}, ${`${sku_prefix}-${index}`}, ${formattedVariantName})
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
        if (images.length > 0) {
          const uploadedImages = await Promise.all(
            images.map(async (file, imgIdx) => {
              const uploaded = await cloudinary.uploader.upload(file.path, {
                folder: 'prechi_products',
                transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }]
              });
              await fs.unlink(file.path).catch(() => {});
              return {
                url: uploaded.secure_url,
                isPrimary: imgIdx === 0,
                position: imgIdx
              };
            })
          );

          for (const img of uploadedImages) {
            await sql`
              INSERT INTO product_images (variant_id, image_url, is_primary, position)
              VALUES (${variantId}, ${img.url}, ${img.isPrimary}, ${img.position})
            `;
          }
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
          await fs.unlink(file.path).catch(() => {});
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
  const numericId = parseInt(id, 10);

  if (isNaN(numericId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    // ── Try product first ──────────────────────────────────────────────────
    const [product] = await sql`
      SELECT id, name, description, base_price AS price, sku_prefix, is_active, category, gender,
             COALESCE(
               (SELECT SUM(vs.stock_quantity)
                FROM product_variants pv2
                JOIN variant_sizes vs ON vs.variant_id = pv2.id
                WHERE pv2.product_id = p.id AND pv2.deleted_at IS NULL AND pv2.is_active = TRUE),
               0
             )::INTEGER AS total_stock
      FROM products p
      WHERE p.id = ${numericId} AND p.deleted_at IS NULL
    `;

    if (product) {
      // Fetch variants with sizes, images and videos
      const variants = await sql`
        SELECT
          pv.id                  AS variant_id,
          pv.color_id,
          c.color_name,
          c.color_code,
          pv.sku,
          pv.name                AS variant_name,
          COALESCE(
            (SELECT json_agg(
               json_build_object(
                 'size_id',        s.id,
                 'size_name',      s.size_name,
                 'stock_quantity', vs.stock_quantity,
                 'price',          vs.price
               ) ORDER BY s.id
             )
             FROM variant_sizes vs
             JOIN sizes s ON s.id = vs.size_id
             WHERE vs.variant_id = pv.id),
            '[]'
          ) AS sizes,
          COALESCE(
            (SELECT json_agg(
               json_build_object(
                 'image_url',  pi.image_url,
                 'is_primary', pi.is_primary,
                 'position',   pi.position
               ) ORDER BY pi.is_primary DESC NULLS LAST, pi.position
             )
             FROM product_images pi
             WHERE pi.variant_id = pv.id),
            '[]'
          ) AS images,
          COALESCE(
            (SELECT json_agg(
               json_build_object(
                 'video_url',           pv2.video_url,
                 'video_thumbnail_url', pv2.video_thumbnail_url,
                 'title',               pv2.title,
                 'position',            pv2.position,
                 'is_primary',          pv2.is_primary
               ) ORDER BY pv2.is_primary DESC NULLS LAST, pv2.position
             )
             FROM product_videos pv2
             WHERE pv2.variant_id = pv.id),
            '[]'
          ) AS videos
        FROM product_variants pv
        JOIN colors c ON c.id = pv.color_id
        WHERE pv.product_id = ${numericId}
          AND pv.deleted_at IS NULL
          AND pv.is_active = TRUE
        ORDER BY pv.id
      `;

      return res.json({
        type: 'product',
        data: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          sku_prefix: product.sku_prefix,
          is_active: product.is_active,
          category: product.category,
          gender: product.gender,
          total_stock: product.total_stock,
          variants,
        }
      });
    }

    // ── Try bundle ─────────────────────────────────────────────────────────
    const [bundle] = await sql`
      SELECT id, name, description, bundle_price AS price, sku_prefix, is_active, bundle_type,
             COALESCE(
               (SELECT SUM(vs.stock_quantity)
                FROM bundle_items bi2
                JOIN variant_sizes vs ON vs.variant_id = bi2.variant_id
                WHERE bi2.bundle_id = b.id),
               0
             )::INTEGER AS total_stock
      FROM bundles b
      WHERE b.id = ${numericId} AND b.deleted_at IS NULL
    `;

    if (bundle) {
      const bundleImages = await sql`
        SELECT image_url, is_primary, position
        FROM bundle_images
        WHERE bundle_id = ${numericId}
        ORDER BY is_primary DESC NULLS LAST, position
      `;

      const bundleItems = await sql`
        SELECT
          bi.id,
          pv.id                AS variant_id,
          p.name               AS product_name,
          c.color_name,
          c.color_code,
          pv.sku,
          COALESCE(
            (SELECT json_agg(
               json_build_object(
                 'variant_id',    pv2.id,
                 'color_name',    c2.color_name,
                 'color_code',    c2.color_code,
                 'sizes',         (
                   SELECT json_agg(
                            json_build_object(
                              'size_id',        s.id,
                              'size_name',      s.size_name,
                              'stock_quantity', vs.stock_quantity,
                              'price',          vs.price
                            ) ORDER BY s.id
                          )
                   FROM variant_sizes vs
                   JOIN sizes s ON s.id = vs.size_id
                   WHERE vs.variant_id = pv2.id
                 ),
                 'images', (
                   SELECT json_agg(
                            json_build_object(
                              'image_url',  pi.image_url,
                              'is_primary', pi.is_primary
                            ) ORDER BY pi.is_primary DESC NULLS LAST, pi.position
                          )
                   FROM product_images pi
                   WHERE pi.variant_id = pv2.id
                 )
               ) ORDER BY pv2.id
             )
             FROM product_variants pv2
             JOIN colors c2 ON c2.id = pv2.color_id
             WHERE pv2.product_id = p.id
               AND pv2.deleted_at IS NULL
               AND pv2.is_active = TRUE),
            '[]'
          ) AS all_variants
        FROM bundle_items bi
        JOIN product_variants pv ON pv.id = bi.variant_id
        JOIN products p ON p.id = pv.product_id
        JOIN colors c ON c.id = pv.color_id
        WHERE bi.bundle_id = ${numericId}
        ORDER BY bi.id
      `;

      return res.json({
        type: 'bundle',
        data: {
          id: bundle.id,
          name: bundle.name,
          description: bundle.description,
          price: bundle.price,
          sku_prefix: bundle.sku_prefix,
          is_active: bundle.is_active,
          bundle_type: bundle.bundle_type,
          total_stock: bundle.total_stock,
          images: bundleImages,
          items: bundleItems,
        }
      });
    }

    return res.status(404).json({ error: 'Item not found' });
  } catch (err) {
    console.error('Get product error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

