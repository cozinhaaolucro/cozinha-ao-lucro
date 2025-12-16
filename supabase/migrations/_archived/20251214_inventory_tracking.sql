-- Migration: Inventory Tracking and History
-- Creates stock_movements table and automatic stock deduction logic

-- 1. Create Stock Movements Table
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'loss', 'sale')),
    quantity NUMERIC(10, 3) NOT NULL, -- Positive value
    reason TEXT, -- Optional notes
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage own stock movements" ON public.stock_movements;
CREATE POLICY "Users can manage own stock movements" ON public.stock_movements
    FOR ALL USING (auth.uid() = user_id);

-- 2. Function to Deduct Stock on Order Confirmation
CREATE OR REPLACE FUNCTION public.handle_order_stock_deduction()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    ing RECORD;
    qty_needed NUMERIC;
BEGIN
    -- CASE 1: Production Started (Pending -> Preparing)
    -- Action: DEDUCT Stock
    IF NEW.status = 'preparing' AND (OLD.status = 'pending' OR OLD.status IS NULL) THEN
        
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            FOR ing IN 
                SELECT ingredient_id, quantity 
                FROM public.product_ingredients 
                WHERE product_id = item.product_id
            LOOP
                qty_needed := ing.quantity * item.quantity;
                
                -- Log Sale
                INSERT INTO public.stock_movements (user_id, ingredient_id, type, quantity, reason)
                VALUES (NEW.user_id, ing.ingredient_id, 'sale', qty_needed, 'Produção: Pedido #' || COALESCE(NEW.order_number, 'N/A'));
                
                -- Deduct
                UPDATE public.ingredients
                SET stock_quantity = stock_quantity - qty_needed,
                    updated_at = NOW()
                WHERE id = ing.ingredient_id;
            END LOOP;
        END LOOP;

    -- CASE 2: Production Rolled Back (Preparing -> Pending) OR Cancelled (Preparing -> Cancelled)
    -- Action: REFUND Stock (Items were not used/wasted)
    ELSIF OLD.status = 'preparing' AND (NEW.status = 'pending' OR NEW.status = 'cancelled') THEN
        
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            FOR ing IN 
                SELECT ingredient_id, quantity 
                FROM public.product_ingredients 
                WHERE product_id = item.product_id
            LOOP
                qty_needed := ing.quantity * item.quantity;
                
                -- Log Restock
                INSERT INTO public.stock_movements (user_id, ingredient_id, type, quantity, reason)
                VALUES (NEW.user_id, ing.ingredient_id, 'adjustment', qty_needed, 'Estorno: Pedido #' || COALESCE(NEW.order_number, 'N/A') || ' (' || NEW.status || ')');
                
                -- Refund
                UPDATE public.ingredients
                SET stock_quantity = stock_quantity + qty_needed,
                    updated_at = NOW()
                WHERE id = ing.ingredient_id;
            END LOOP;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger Definition
DROP TRIGGER IF EXISTS on_order_preparing_deduct_stock ON public.orders;
CREATE TRIGGER on_order_preparing_deduct_stock
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_stock_deduction();
