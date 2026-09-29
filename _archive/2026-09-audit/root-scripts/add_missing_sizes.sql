-- Add missing sizes (3XL, 4XL, 5XL) to complete the diamond set size range
-- This script adds the plus sizes needed for your client's diamond set requirements

-- Insert the missing larger sizes
INSERT INTO public.sizes (size_name, size_order) VALUES 
  ('3XL', 7),
  ('4XL', 8),
  ('5XL', 9);

-- Verify the complete size range
SELECT id, size_name, size_order 
FROM public.sizes 
ORDER BY size_order;

-- Expected result should show: XS, S, M, L, XL, XXL, 3XL, 4XL, 5XL