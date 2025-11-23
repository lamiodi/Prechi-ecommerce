-- Comprehensive size and pricing setup for diamond sets
-- This script adds missing sizes and sets up pricing structure for your client's requirements

-- Step 1: Add missing plus sizes
INSERT INTO public.sizes (size_name, size_order) VALUES 
  ('3XL', 7),
  ('4XL', 8),
  ('5XL', 9)
ON CONFLICT (size_name) DO NOTHING;

-- Step 2: Verify complete size range
SELECT id, size_name, size_order 
FROM public.sizes 
ORDER BY size_order;

-- Step 3: Create a sample diamond set product with proper pricing structure
-- This demonstrates how to set up the ₦70k (S-2XL) and ₦80k+ (3XL-5XL) pricing

-- Sample product creation (you can modify this for your actual diamond sets)
/*
-- Example of how to set up pricing for diamond sets:

-- For products with base price ₦70,000 (S-2XL)
-- Plus sizes (3XL-5XL) would be ₦80,000

INSERT INTO public.products (name, description, base_price, sku_prefix, category, gender)
VALUES 
('Diamond Set - Brown & Carton', 'Premium 3-piece diamond set in brown and carton colors', 70000, 'DS-BC', 'Sets', 'Women'),
('Diamond Set - Navy & Sky Blue', 'Premium 3-piece diamond set in navy blue and sky blue', 70000, 'DS-NS', 'Sets', 'Women'),
('Diamond Set - Ash & Pink', 'Premium 3-piece diamond set in ash and pink colors', 70000, 'DS-AP', 'Sets', 'Women');
*/

-- Step 4: Set up size-specific pricing (if needed for individual pieces)
-- This would be used if you want to charge different prices for individual items within the set
/*
-- Example size pricing structure:
-- Regular sizes: S, M, L, XL, XXL - Base price
-- Plus sizes: 3XL, 4XL, 5XL - Base price + ₦10,000

-- You would implement this in your pricing logic when creating product variants
*/

-- Final verification query
SELECT 
  s.size_name,
  s.size_order,
  CASE 
    WHEN s.size_name IN ('S', 'M', 'L', 'XL', 'XXL') THEN 'Regular Size - ₦70,000'
    WHEN s.size_name IN ('3XL', '4XL', '5XL') THEN 'Plus Size - ₦80,000'
    ELSE 'Other'
  END as pricing_category
FROM public.sizes s
ORDER BY s.size_order;