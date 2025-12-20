import express from 'express';
import {
  getProducts,
  getBundles,
  deleteProduct,
  deleteBundle,
  updateProduct,
  updateBundle,
} from '../controllers/inventoryController.js';
import upload from '../utils/multer.js';

const router = express.Router();

const multiFieldUpload = upload.fields([
  { name: 'images_0', maxCount: 5 },
  { name: 'images_1', maxCount: 5 },
  { name: 'images_2', maxCount: 5 },
  { name: 'images_3', maxCount: 5 },
  { name: 'images_4', maxCount: 5 },
]);

// ✅ Get all products (for admin panel)
router.get('/products', getProducts);

// ✅ Get all bundles (for admin panel)
router.get('/bundles', getBundles);

// ✅ Delete a product by ID
router.delete('/products/:id', deleteProduct);

// ✅ Delete a bundle by ID
router.delete('/bundles/:id', deleteBundle);

// ✅ Update product (price + stock + images)
router.put('/products/:id', multiFieldUpload, updateProduct);

// ✅ Update bundle (price only for now)
router.put('/bundles/:id', updateBundle);

export default router;
// ✅ Inventory management routes for admin panel