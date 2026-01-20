-- ============================================================================
-- FIX FULL STOCK LOGIC (VERSION 3 - STATE BASED ROBUST)
-- Purpose: 
-- 1. Handle ALL state transitions correctly, including skipping steps (Pending -> Delivered).
-- 2. Use a "Set-Based" approach: {preparing, ready, delivered} = Stock Deducted.
-- 3. Solves "Direct to Ready" not deducting.
-- 4. Solves "Backtracking" logic consistently.
-- ============================================================================

-- 1. CLEANUP (With Cascade to be safe)
DROP TRIGGER IF EXISTS tr_order_stock_automation ON public.orders;
DROP TRIGGER IF EXISTS on_stock_movement_insert ON public.stock_movements;
DROP FUNCTION IF EXISTS public.fn_handle_stock_on_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.handle_stock_movement() CASCADE;

-- 2. WORKER FUNCTION (Same as before, good logic)
CREATE OR REPLACE FUNCTION public.handle_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Positive Flow (Add)
    IF NEW.type IN ('in', 'restock') THEN
        UPDATE public.ingredients
        SET stock_quantity = COALESCE(stock_quantity, 0) + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.ingredient_id;
    
    -- Negative Flow (Subtract)
    ELSIF NEW.type IN ('out', 'loss', 'sale', 'production') THEN
        UPDATE public.ingredients
        SET stock_quantity = COALESCE(stock_quantity, 0) - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.ingredient_id;
        
    -- Adjustment
    ELSIF NEW.type = 'adjustment' THEN
         UPDATE public.ingredients
        SET stock_quantity = COALESCE(stock_quantity, 0) + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.ingredient_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. MANAGER FUNCTION (New State-Based Logic)
CREATE OR REPLACE FUNCTION public.fn_handle_stock_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    pi RECORD;
    qty_needed NUMERIC;
    
    -- States where stock SHOULD be deducted
    -- We treat 'preparing', 'ready', 'delivered' as "Consumed"
    is_old_consumed BOOLEAN;
    is_new_consumed BOOLEAN;
BEGIN
    -- Define the sets
    is_old_consumed := (OLD.status IN ('preparing', 'ready', 'delivered'));
    is_new_consumed := (NEW.status IN ('preparing', 'ready', 'delivered'));

    -- LOGIC:
    -- 1. Not Consumed -> Consumed (e.g. Pending -> Preparing OR Pending -> Ready) :: SALE (Deduct)
    -- 2. Consumed -> Not Consumed (e.g. Preparing -> Pending OR Ready -> Cancelled) :: RESTOCK (Add)
    -- 3. Consumed -> Consumed (e.g. Preparing -> Ready) :: NO ACTION
    -- 4. Not Consumed -> Not Consumed (e.g. Pending -> Cancelled) :: NO ACTION

    IF (NOT is_old_consumed AND is_new_consumed) THEN
        -- DEDUCT STOCK
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            FOR pi IN SELECT * FROM public.product_ingredients WHERE product_id = item.product_id LOOP
                qty_needed := COALESCE(pi.quantity, 0) * COALESCE(item.quantity, 0);
                
                IF qty_needed > 0 THEN
                   INSERT INTO public.stock_movements (user_id, ingredient_id, type, quantity, reason, order_id)
                   VALUES (NEW.user_id, pi.ingredient_id, 'sale', qty_needed, 'Produção: Pedido #' || NEW.id, NEW.id);
                END IF;
            END LOOP;
        END LOOP;

    ELSIF (is_old_consumed AND NOT is_new_consumed) THEN
        -- RESTOCK STOCK
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
           FOR pi IN SELECT * FROM public.product_ingredients WHERE product_id = item.product_id LOOP
                qty_needed := COALESCE(pi.quantity, 0) * COALESCE(item.quantity, 0);
                
                IF qty_needed > 0 THEN
                   INSERT INTO public.stock_movements (user_id, ingredient_id, type, quantity, reason, order_id)
                   VALUES (NEW.user_id, pi.ingredient_id, 'restock', qty_needed, 'Estorno: Pedido #' || NEW.id, NEW.id);
                END IF;
            END LOOP;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. BIND TRIGGERS
CREATE TRIGGER on_stock_movement_insert
AFTER INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.handle_stock_movement();

CREATE TRIGGER tr_order_stock_automation
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.fn_handle_stock_on_status_change();
