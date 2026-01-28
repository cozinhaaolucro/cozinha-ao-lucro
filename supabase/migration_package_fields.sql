-- Add package info columns to ingredients table
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS package_qty integer;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS package_size numeric;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS package_unit text;

-- Add display_unit column to product_ingredients table
ALTER TABLE product_ingredients ADD COLUMN IF NOT EXISTS display_unit text;
