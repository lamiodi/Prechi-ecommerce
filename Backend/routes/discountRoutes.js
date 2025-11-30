import express from 'express';
import { validateCoupon } from '../controllers/adminDiscountController.js';

const router = express.Router();

// Public route for coupon validation
router.post('/validate', validateCoupon);

export default router;
