import express from 'express';
import {
  createOrder,
  verifyOrderByReference,
  cancelOrder,
  getOrdersByUser,
  getOrderById
} from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();
// Order creation is public (guest checkout); the server validates all pricing itself.
router.post('/', createOrder);
router.get('/verify/:reference', verifyOrderByReference);

// These endpoints mutate or expose order data and require authentication
router.delete('/:orderId', authenticateToken, cancelOrder);
router.get('/user/:userId', authenticateToken, getOrdersByUser);
router.get('/:id', authenticateToken, getOrderById);
export default router;