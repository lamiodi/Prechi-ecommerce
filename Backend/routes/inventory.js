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
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All inventory management routes are admin-only
const adminOnly = [authenticateToken, requireAdmin];

// ✅ Get all products (for admin panel)
router.get('/products', ...adminOnly, getProducts);

// ✅ Get all bundles (for admin panel)
router.get('/bundles', ...adminOnly, getBundles);

// ✅ Delete a product by ID
router.delete('/products/:id', ...adminOnly, deleteProduct);

// ✅ Delete a bundle by ID
router.delete('/bundles/:id', ...adminOnly, deleteBundle);

// ✅ Update product (name, price, category, gender, active, new_release, variants)
router.put('/products/:id', ...adminOnly, updateProduct);

// ✅ Update bundle (price only for now)
router.put('/bundles/:id', ...adminOnly, updateBundle);

// ✅ Delete a variant by ID
router.delete('/variants/:variantId', ...adminOnly, deleteVariant);

// ✅ Set primary image for a variant
router.put('/variants/:variantId/primary-image', ...adminOnly, setPrimaryImage);

// ✅ Reorder images for a variant
router.put('/variants/:variantId/reorder-images', ...adminOnly, reorderVariantImages);

// ✅ Add new images/videos to an existing variant
router.post('/variants/:variantId/media', ...adminOnly, upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'videos', maxCount: 3 }
]), addVariantMedia);

// ✅ Delete existing images/videos from variant
router.delete('/variants/media/image/:imageId', ...adminOnly, deleteVariantImage);
router.delete('/variants/media/video/:videoId', ...adminOnly, deleteVariantVideo);

export default router;
// ✅ Inventory management routes for admin panel
