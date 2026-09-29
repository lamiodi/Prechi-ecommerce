//authroutes
import express from 'express';
import rateLimit from 'express-rate-limit';
import { loginUser, adminLogin, signupUser, requestPasswordReset, resetPassword, getMe, updateProfile, updateUserFirstOrder, createTemporaryUser } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
const router = express.Router();

// Strict limiter for credential and email-sending endpoints (brute-force / email-bombing guard)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', authLimiter, loginUser);
router.post('/admin-login', authLimiter, adminLogin);
router.post('/signup', authLimiter, signupUser);
router.post('/forgot-password', authLimiter, requestPasswordReset);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});
router.patch('/users/:id', authenticateToken, updateUserFirstOrder);
// Add this to your authRoutes file
router.post('/create-temp-user', createTemporaryUser);

export default router;