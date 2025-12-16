-- Script to seed realistic data for "Cozinha ao Lucro"
-- Includes: Ingredients, Products, and Recipes (Product Ingredients)

-- 1. Insert Ingredients
INSERT INTO public.ingredients (name, unit, cost_per_unit, stock_quantity, user_id)
SELECT 'Leite Condensado (395g)', 'un', 5.50, 10, auth.uid()
FROM auth.users
WHERE email = 'admin@demo.com' -- Adjust if necessary or remove WHERE to apply to all users (careful)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.ingredients (name, unit, cost_per_unit, stock_quantity, user_id)
SELECT 'Creme de Leite (200g)', 'un', 3.00, 15, auth.uid()
FROM auth.users
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.ingredients (name, unit, cost_per_unit, stock_quantity, user_id)
SELECT 'Chocolate em Pó 50% (kg)', 'kg', 45.00, 2.0, auth.uid()
FROM auth.users
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.ingredients (name, unit, cost_per_unit, stock_quantity, user_id)
SELECT 'Manteiga (kg)', 'kg', 40.00, 1.0, auth.uid()
FROM auth.users
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.ingredients (name, unit, cost_per_unit, stock_quantity, user_id)
SELECT 'Granulado (kg)', 'kg', 25.00, 2.0, auth.uid()
FROM auth.users
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.ingredients (name, unit, cost_per_unit, stock_quantity, user_id)
SELECT 'Farinha de Trigo (kg)', 'kg', 5.00, 5.0, auth.uid()
FROM auth.users
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.ingredients (name, unit, cost_per_unit, stock_quantity, user_id)
SELECT 'Açúcar Refinado (kg)', 'kg', 4.50, 5.0, auth.uid()
FROM auth.users
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.ingredients (name, unit, cost_per_unit, stock_quantity, user_id)
SELECT 'Ovos (un)', 'un', 0.80, 60, auth.uid()
FROM auth.users
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Products
-- Note: We need to fetch the user_id dynamically
DO $$
DECLARE
  v_user_id UUID;
  v_ing_leite_cond UUID;
  v_ing_creme_leite UUID;
  v_ing_choc_po UUID;
  v_ing_manteiga UUID;
  v_ing_granulado UUID;
  v_prod_brigadeiro UUID;
BEGIN
  -- Get a user ID (assuming the current user or a specific one)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    
    -- Get Ingredient IDs
    SELECT id INTO v_ing_leite_cond FROM public.ingredients WHERE name = 'Leite Condensado (395g)' LIMIT 1;
    SELECT id INTO v_ing_creme_leite FROM public.ingredients WHERE name = 'Creme de Leite (200g)' LIMIT 1;
    SELECT id INTO v_ing_choc_po FROM public.ingredients WHERE name = 'Chocolate em Pó 50% (kg)' LIMIT 1;
    SELECT id INTO v_ing_manteiga FROM public.ingredients WHERE name = 'Manteiga (kg)' LIMIT 1;
    SELECT id INTO v_ing_granulado FROM public.ingredients WHERE name = 'Granulado (kg)' LIMIT 1;

    -- Create Product: Brigadeiro Tradicional (Cento)
    INSERT INTO public.products (name, selling_price, selling_unit, active, user_id)
    VALUES ('Brigadeiro Tradicional (Cento)', 120.00, 'cento', true, v_user_id)
    ON CONFLICT (name) DO UPDATE SET selling_price = 120.00
    RETURNING id INTO v_prod_brigadeiro;

    -- Link Ingredients to Product (Recipe for 1 cento)
    -- Assuming 1 recipe yields 100 units (1 cento)
    -- Recipe: 2 Leite Cond, 1 Creme de Leite, 50g Choc Pó, 20g Manteiga, 200g Granulado
    
    IF v_prod_brigadeiro IS NOT NULL THEN
        -- Clear existing ingredients for this product to avoid duplicates/errors on re-run
        DELETE FROM public.product_ingredients WHERE product_id = v_prod_brigadeiro;

        IF v_ing_leite_cond IS NOT NULL THEN
            INSERT INTO public.product_ingredients (product_id, ingredient_id, quantity) VALUES (v_prod_brigadeiro, v_ing_leite_cond, 2);
        END IF;
        IF v_ing_creme_leite IS NOT NULL THEN
            INSERT INTO public.product_ingredients (product_id, ingredient_id, quantity) VALUES (v_prod_brigadeiro, v_ing_creme_leite, 1);
        END IF;
        IF v_ing_choc_po IS NOT NULL THEN
            INSERT INTO public.product_ingredients (product_id, ingredient_id, quantity) VALUES (v_prod_brigadeiro, v_ing_choc_po, 0.050); -- 50g
        END IF;
        IF v_ing_manteiga IS NOT NULL THEN
            INSERT INTO public.product_ingredients (product_id, ingredient_id, quantity) VALUES (v_prod_brigadeiro, v_ing_manteiga, 0.020); -- 20g
        END IF;
        IF v_ing_granulado IS NOT NULL THEN
            INSERT INTO public.product_ingredients (product_id, ingredient_id, quantity) VALUES (v_prod_brigadeiro, v_ing_granulado, 0.200); -- 200g
        END IF;
    END IF;

  END IF;
END $$;
