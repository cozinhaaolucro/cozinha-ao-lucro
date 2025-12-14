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
    -- Only trigger when status changes to 'preparing' (production started) or 'delivered' (if skipped)
    -- And only if it wasn't already in one of those states (to avoid double deduction)
    -- Simplification: Deduct when status becomes 'preparing'
    
    IF NEW.status = 'preparing' AND (OLD.status = 'pending' OR OLD.status IS NULL) THEN
        
        -- Loop through order items
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            
            -- Loop through ingredients for each product
            FOR ing IN 
                SELECT ingredient_id, quantity 
                FROM public.product_ingredients 
                WHERE product_id = item.product_id
            LOOP
                qty_needed := ing.quantity * item.quantity;
                
                -- Record movement (Log)
                INSERT INTO public.stock_movements (user_id, ingredient_id, type, quantity, reason)
                VALUES (NEW.user_id, ing.ingredient_id, 'sale', qty_needed, 'Pedido #' || COALESCE(NEW.order_number, 'N/A'));
                
                -- Update Ingredient Stock
                UPDATE public.ingredients
                SET stock_quantity = stock_quantity - qty_needed,
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

-- 4. Manual Adjustment Helper Function (Optional, can just insert directly from client)
-- But ensuring consistency:
CREATE OR REPLACE FUNCTION public.adjust_stock(
    p_ingredient_id UUID,
    p_quantity NUMERIC, -- Positive to add, Negative to remove (delta)
    p_reason TEXT,
    p_type TEXT
) RETURNS VOID AS $$
BEGIN
    -- Log based on sign
    INSERT INTO public.stock_movements (user_id, ingredient_id, type, quantity, reason)
    VALUES (
        auth.uid(), 
        p_ingredient_id, 
        p_type, 
        ABS(p_quantity), 
        p_reason
    );

    -- Update Actual Stock
    UPDATE public.ingredients
    SET stock_quantity = stock_quantity + p_quantity,
        updated_at = NOW()
    WHERE id = p_ingredient_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
