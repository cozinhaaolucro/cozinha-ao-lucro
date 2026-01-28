-- Allow duplicate ingredients in the same product (e.g. 2 instances of 'flour' with different purposes)
ALTER TABLE public.product_ingredients 
DROP CONSTRAINT IF EXISTS product_ingredients_product_id_ingredient_id_key;

-- Also check for unique index just in case it was created implicitly
DROP INDEX IF EXISTS product_ingredients_product_id_ingredient_id_key;
