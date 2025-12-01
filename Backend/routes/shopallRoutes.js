// routes/shopallRoutes.js
import express from 'express';
import { getShopAll } from '../controllers/shop/getShopAll.js';
import { searchProducts } from '../controllers/shop/searchController.js';
import { getCategories } from '../controllers/shop/getCategories.js';

const router = express.Router();

router.get('/', getShopAll);
router.get('/search', searchProducts);
router.get('/categories', getCategories);

export default router;