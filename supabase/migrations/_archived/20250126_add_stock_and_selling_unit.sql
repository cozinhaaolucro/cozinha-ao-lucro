-- Add stock_quantity to ingredients table
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS stock_quantity DECIMAL(10,2) DEFAULT 0;

-- Add selling_unit to products table  
ALTER TABLE products ADD COLUMN IF NOT EXISTS selling_unit TEXT DEFAULT 'unidade';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ingredients_stock ON ingredients(stock_quantity);
