-- Add standard colors to the colors table
-- These colors will be used across the system for product variants

INSERT INTO public.colors (color_name, color_code) VALUES 
  ('Black', '#000000'),
  ('White', '#FFFFFF'),
  ('Grey', '#808080'),
  ('Navy Blue', '#000080'),
  ('Brown', '#8B4513'),
  ('Beige', '#F5F5DC'),
  ('Red', '#FF0000'),
  ('Blue', '#0000FF'),
  ('Green', '#008000'),
  ('Burgundy', '#800020'),
  ('Pink', '#FFC0CB'),
  ('Olive', '#808000')
ON CONFLICT (color_name) DO UPDATE 
SET color_code = EXCLUDED.color_code;

-- Verify the colors were added
SELECT id, color_name, color_code FROM public.colors 
WHERE color_name IN ('Black', 'White', 'Grey', 'Navy Blue', 'Brown', 'Beige', 'Red', 'Blue', 'Green', 'Burgundy', 'Pink', 'Olive')
ORDER BY color_name;