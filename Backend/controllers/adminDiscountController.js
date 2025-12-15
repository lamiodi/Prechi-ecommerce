import sql from '../db/index.js';
// Features disabled due to table removal

// Create discount
export const createDiscount = async (req, res) => {
  res.status(501).json({ error: 'Discount feature is disabled' });
};

// Get all discounts
export const getDiscounts = async (req, res) => {
  res.json([]);
};

// Update discount
export const updateDiscount = async (req, res) => {
  res.status(501).json({ error: 'Discount feature is disabled' });
};

// Delete discount
export const deleteDiscount = async (req, res) => {
  res.status(501).json({ error: 'Discount feature is disabled' });
};

// Validate coupon code
export const validateCoupon = async (req, res) => {
  res.status(404).json({ valid: false, message: 'Coupons are currently disabled' });
};