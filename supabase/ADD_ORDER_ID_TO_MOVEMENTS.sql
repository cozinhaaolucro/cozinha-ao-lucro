-- Add order_id to stock_movements table to link history to orders
-- This is required by the new stock logic triggers.

BEGIN;

-- 1. Add column if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_movements' AND column_name = 'order_id') THEN
        ALTER TABLE public.stock_movements ADD COLUMN order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_order_id ON public.stock_movements(order_id);

COMMIT;
