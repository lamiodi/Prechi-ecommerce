-- Delivery fee security fix: the fee amount and currency must live on the order
-- row (set by an admin via PUT /api/admin/orders/:orderId/delivery-fee) so that
-- payment initialization can derive the charge from the DB instead of trusting
-- client-supplied amounts.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee_currency TEXT;

-- Historic fees were generated through the admin modal which defaulted to USD
UPDATE orders
SET delivery_fee_currency = 'USD'
WHERE delivery_fee IS NOT NULL
  AND delivery_fee > 0
  AND delivery_fee_currency IS NULL;
