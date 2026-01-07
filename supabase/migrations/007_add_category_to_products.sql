-- Add category column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category text DEFAULT NULL;

-- Add index for faster filtering by category
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
