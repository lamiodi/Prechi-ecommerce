import express from 'express';
import {
  getProducts,
  getBundles,
  deleteProduct,
  deleteBundle,
  updateProduct,
  updateBundle,
  setPrimaryImage,
  addVariantMedia,
  deleteVariantImage,
  deleteVariantVideo,
  reorderVariantImages,
  deleteVariant,
} from '../controllers/inventoryController.js';
import upload from '../utils/multer.js';

const router = express.Router();

// ✅ Get all products (for admin panel)
router.get('/products', getProducts);

// ✅ Get all bundles (for admin panel)
router.get('/bundles', getBundles);

// ✅ Delete a product by ID
router.delete('/products/:id', deleteProduct);

// ✅ Delete a bundle by ID
router.delete('/bundles/:id', deleteBundle);

// ✅ Update product (name, price, category, gender, active, new_release, variants)
router.put('/products/:id', updateProduct);

// ✅ Update bundle (price only for now)
router.put('/bundles/:id', updateBundle);

// ✅ Delete a variant by ID
router.delete('/variants/:variantId', deleteVariant);

// ✅ Set primary image for a variant
router.put('/variants/:variantId/primary-image', setPrimaryImage);

// ✅ Reorder images for a variant
router.put('/variants/:variantId/reorder-images', reorderVariantImages);

// ✅ Add new images/videos to an existing variant
router.post('/variants/:variantId/media', upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'videos', maxCount: 3 }
]), addVariantMedia);

// ✅ Delete existing images/videos from variant
router.delete('/variants/media/image/:imageId', deleteVariantImage);
router.delete('/variants/media/video/:videoId', deleteVariantVideo);

export default router;
// ✅ Inventory management routes for admin panel
