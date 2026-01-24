-- Migration: Optimize Product Ingredients performance
-- Purpose: Add missing index on foreign key to prevent full table scans during cost calculation.
-- Safe to run: Yes, only adds index.

CREATE INDEX IF NOT EXISTS idx_product_ingredients_product_id ON product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_ingredient_id ON product_ingredients(ingredient_id);
