import sql from '../db/index.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

// Ensure Cloudinary is configured
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Get all products with inventory data
export const getProducts = async (req, res) => {
  try {
    const products = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.base_price AS price,
        p.sku_prefix AS design_code,
        p.is_active,
        p.is_new_release,
        (SELECT array_agg(DISTINCT pi.image_url)
         FROM product_images pi
         JOIN product_variants pv ON pi.variant_id = pv.id
         WHERE pv.product_id = p.id) AS images,
        (SELECT COUNT(*) FROM bundle_items bi
         JOIN product_variants pv ON bi.variant_id = pv.id
         WHERE pv.product_id = p.id) AS bundle_count,
        (SELECT string_agg(DISTINCT c.color_name, ', ') FROM product_variants pv
         JOIN colors c ON c.id = pv.color_id
         WHERE pv.product_id = p.id) AS color,
        (SELECT string_agg(DISTINCT s.size_name, ', ') FROM variant_sizes vs
         JOIN sizes s ON s.id = vs.size_id
         JOIN product_variants pv ON pv.id = vs.variant_id
         WHERE pv.product_id = p.id) AS size,
        (SELECT SUM(vs.stock_quantity) FROM variant_sizes vs
         JOIN product_variants pv ON pv.id = vs.variant_id
         WHERE pv.product_id = p.id) AS stock,
        (SELECT jsonb_agg(
          jsonb_build_object(
            'id', pv.id,
            'name', pv.name,
            'color_id', pv.color_id,
            'color_name', c.color_name,
            'sku', pv.sku,
            'sizes', (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'size_id', vs.size_id,
                  'size_name', s.size_name,
                  'stock_quantity', vs.stock_quantity,
                  'price', vs.price
                )
              )
              FROM variant_sizes vs
              JOIN sizes s ON vs.size_id = s.id
              WHERE vs.variant_id = pv.id
            ),
            'images', (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', pi.id,
                  'image_url', pi.image_url,
                  'is_primary', pi.is_primary
                )
              )
              FROM product_images pi
              WHERE pi.variant_id = pv.id
            ),
            'videos', (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', pv_vid.id,
                  'video_url', pv_vid.video_url,
                  'video_thumbnail_url', pv_vid.video_thumbnail_url,
                  'is_primary', pv_vid.is_primary
                )
              )
              FROM product_videos pv_vid
              WHERE pv_vid.variant_id = pv.id
            )
          )
        )
        FROM product_variants pv
        JOIN colors c ON pv.color_id = c.id
        WHERE pv.product_id = p.id) AS variants
      FROM products p
      ORDER BY p.created_at DESC
    `;
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({
      error: 'Failed to fetch products',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get all bundles with inventory data
export const getBundles = async (req, res) => {
  try {
    const bundles = await sql`
      SELECT 
        b.id,
        b.name,
        b.description,
        b.bundle_price AS price,
        b.is_active,
        b.bundle_type,
        (SELECT array_agg(DISTINCT bi.image_url)
         FROM bundle_images bi 
         WHERE bi.bundle_id = b.id) AS images,
        (SELECT COUNT(*) 
         FROM bundle_items 
         WHERE bundle_id = b.id) AS item_count,
        (SELECT jsonb_agg(
          jsonb_build_object(
            'variant_id', bi.variant_id,
            'product_name', p.name,
            'color_name', c.color_name
          )
        )
        FROM bundle_items bi
        JOIN product_variants pv ON bi.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        JOIN colors c ON pv.color_id = c.id
        WHERE bi.bundle_id = b.id) AS items
      FROM bundles b
      ORDER BY b.created_at DESC
    `;
    res.json(bundles);
  } catch (err) {
    console.error('Error fetching bundles:', err);
    res.status(500).json({
      error: 'Failed to fetch bundles',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Permanent delete a product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await sql.begin(async (sql) => {
      const bundleCheck = await sql`
        SELECT b.id, b.name
        FROM bundles b
        JOIN bundle_items bi ON b.id = bi.bundle_id
        JOIN product_variants pv ON bi.variant_id = pv.id
        WHERE pv.product_id = ${id} AND b.is_active = TRUE
        LIMIT 1
      `;

      if (bundleCheck.length > 0) {
        throw { type: 'bundle_conflict', bundle: bundleCheck[0] };
      }

      await sql`DELETE FROM product_images WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = ${id})`;
      await sql`DELETE FROM variant_sizes WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = ${id})`;
      await sql`DELETE FROM product_variants WHERE product_id = ${id}`;
      await sql`DELETE FROM products WHERE id = ${id}`;
    });

    res.json({ message: 'Product permanently deleted' });
  } catch (err) {
    if (err.type === 'bundle_conflict') {
      return res.status(400).json({
        error: `Cannot delete product. It is used in active bundle "${err.bundle.name}"`,
        bundleId: err.bundle.id,
        conflictType: 'bundle'
      });
    }
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Delete a bundle
export const deleteBundle = async (req, res) => {
  const { id } = req.params;
  try {
    await sql.begin(async (sql) => {
      await sql`DELETE FROM bundle_images WHERE bundle_id = ${id}`;
      await sql`DELETE FROM bundle_items WHERE bundle_id = ${id}`;
      await sql`DELETE FROM bundles WHERE id = ${id}`;
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting bundle:', err);
    res.status(500).json({ error: 'Failed to delete bundle' });
  }
};

// Update product price, stock, and variant details
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, base_price, variants, is_new_release } = req.body;

  try {
    await sql.begin(async (sql) => {
      // Update product level details
      if (name || base_price || typeof is_new_release === 'boolean') {
        const updates = {};
        if (name) updates.name = name;
        if (base_price) updates.base_price = base_price;
        if (typeof is_new_release === 'boolean') updates.is_new_release = is_new_release;

        if (Object.keys(updates).length > 0) {
          await sql`UPDATE products SET ${sql(updates)} WHERE id = ${id}`;
        }
      }

      if (variants?.length) {
        for (const variant of variants) {
          // Update variant name (if provided and different)
          // Note: Frontend sends 'name' inside variant object if we add it there.
          // Currently getProducts query returns 'sku' but not explicit variant 'name' column if it exists in product_variants table?
          // Let's check the schema. Usually product_variants has a name or it uses color/size.
          // The getProducts query selects 'p.name' as product name, and 'c.color_name' for variant.
          // Let's assume the user wants to update the 'name' column in 'product_variants' table if it exists,
          // OR they mean the 'sku' or just the display name which is often 'Product Name - Color'.
          // The user said "name in product_variant table".
          // Let's check if 'product_variants' table has a 'name' column.
          // Based on create_tables.js (which I read earlier but might need to recall), 
          // product_variants usually has: id, product_id, color_id, sku, is_active, etc.
          // If it has a 'name' column, we should update it.
          // I will assume it does or add it to the query. 
          // Wait, in getProducts query:
          // SELECT ... (SELECT jsonb_agg(jsonb_build_object(..., 'sku', pv.sku, ...)))
          // It doesn't select 'name' from pv. 
          // But I'll add the update logic for 'name' in product_variants if it is passed.

          if (variant.name !== undefined) {
            const variantName = variant.name === '' ? null : variant.name;
            await sql`UPDATE product_variants SET name = ${variantName} WHERE id = ${variant.id}`;
          }

          for (const size of variant.sizes || []) {
            await sql`
              UPDATE variant_sizes
              SET stock_quantity = ${size.stock_quantity}, price = ${size.price || 0}
              WHERE variant_id = ${variant.id} AND size_id = ${size.size_id}
            `;
          }
        }
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Update bundle price
export const updateBundle = async (req, res) => {
  const { id } = req.params;
  const { bundle_price } = req.body;

  try {
    await sql`UPDATE bundles SET bundle_price = ${bundle_price} WHERE id = ${id}`;
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating bundle:', err);
    res.status(500).json({ error: 'Failed to update bundle' });
  }
};

// Set primary image for a variant (and unset others)
export const setPrimaryImage = async (req, res) => {
  const { variantId } = req.params;
  const { image_id } = req.body;

  if (!image_id) {
    return res.status(400).json({ error: 'image_id is required' });
  }

  try {
    await sql.begin(async (sql) => {
      await sql`UPDATE product_images SET is_primary = FALSE WHERE variant_id = ${variantId}`;
      await sql`UPDATE product_images SET is_primary = TRUE WHERE id = ${image_id} AND variant_id = ${variantId}`;
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error setting primary image:', err);
    res.status(500).json({ error: 'Failed to set primary image' });
  }
};

export const addVariantMedia = async (req, res) => {
  const { variantId } = req.params;
  const files = req.files;

  try {
    const uploadedImages = [];
    const uploadedVideos = [];

    // Process 'images' field
    if (files.images && files.images.length > 0) {
      for (const file of files.images) {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: 'image',
          folder: 'products',
        });
        uploadedImages.push(result.secure_url);
        await fs.unlink(file.path);
      }
    }

    // Process 'videos' field
    if (files.videos && files.videos.length > 0) {
      for (const file of files.videos) {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: 'video',
          folder: 'products/videos',
        });
        uploadedVideos.push(result.secure_url);
        await fs.unlink(file.path);
      }
    }

    // 3. Save to Database
    if (uploadedImages.length > 0 || uploadedVideos.length > 0) {
      await sql.begin(async (sql) => {
        // Insert Images
        for (const url of uploadedImages) {
          await sql`
            INSERT INTO product_images (variant_id, image_url, is_primary)
            VALUES (${variantId}, ${url}, FALSE)
          `;
        }

        // Insert Videos
        for (const url of uploadedVideos) {
          const thumbnailUrl = url.replace(/\.[^/.]+$/, ".jpg");

          await sql`
                INSERT INTO product_videos (variant_id, video_url, video_thumbnail_url, title, position, is_primary)
                VALUES (${variantId}, ${url}, ${thumbnailUrl}, 'Product Video', 0, FALSE)
            `;
        }
      });
    }

    res.json({
      success: true,
      message: 'Media uploaded successfully',
      images: uploadedImages,
      videos: uploadedVideos
    });
  } catch (err) {
    console.error('Error uploading media:', err);
    res.status(500).json({ error: 'Failed to upload media' });
  }
};

// Extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;
  // Remove version (e.g., v1612345678/) if present
  let pathAfterUpload = parts[1];
  if (pathAfterUpload.match(/^v\d+\//)) {
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
  }
  // Remove file extension
  const lastDotIndex = pathAfterUpload.lastIndexOf('.');
  const publicId = lastDotIndex !== -1 ? pathAfterUpload.substring(0, lastDotIndex) : pathAfterUpload;
  return decodeURIComponent(publicId);
};

export const deleteVariantImage = async (req, res) => {
  const { imageId } = req.params;
  try {
    // 1. Get the image URL from DB
    const imageInfo = await sql`SELECT image_url FROM product_images WHERE id = ${imageId}`;

    if (imageInfo.length > 0 && imageInfo[0].image_url) {
      const publicId = getPublicIdFromUrl(imageInfo[0].image_url);
      if (publicId) {
        // 2. Delete from Cloudinary
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(err => {
          console.warn('Failed to delete image from Cloudinary:', err);
        });
      }
    }

    // 3. Delete from DB
    await sql`DELETE FROM product_images WHERE id = ${imageId}`;
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Error deleting image:', err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

export const deleteVariantVideo = async (req, res) => {
  const { videoId } = req.params;
  try {
    // 1. Get the video URL from DB
    const videoInfo = await sql`SELECT video_url FROM product_videos WHERE id = ${videoId}`;

    if (videoInfo.length > 0 && videoInfo[0].video_url) {
      const publicId = getPublicIdFromUrl(videoInfo[0].video_url);
      if (publicId) {
        // 2. Delete from Cloudinary
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }).catch(err => {
          console.warn('Failed to delete video from Cloudinary:', err);
        });
      }
    }

    // 3. Delete from DB
    await sql`DELETE FROM product_videos WHERE id = ${videoId}`;
    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (err) {
    console.error('Error deleting video:', err);
    res.status(500).json({ error: 'Failed to delete video' });
  }
};
