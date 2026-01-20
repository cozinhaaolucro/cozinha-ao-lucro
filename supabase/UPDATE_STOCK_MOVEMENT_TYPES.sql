-- EXCEPTION FIX: Update allowed types for stock movements
-- The error "violates check constraint" happens because we added 'sale' and 'restock' 
-- but the database only knew about 'in', 'out', 'adjustment', 'loss'.

BEGIN;

-- 1. Drop the old limited check
ALTER TABLE public.stock_movements 
DROP CONSTRAINT IF EXISTS stock_movements_type_check;

-- 2. Add the new flexible check
ALTER TABLE public.stock_movements 
ADD CONSTRAINT stock_movements_type_check 
CHECK (type IN ('in', 'out', 'adjustment', 'loss', 'sale', 'production', 'restock'));

COMMIT;
