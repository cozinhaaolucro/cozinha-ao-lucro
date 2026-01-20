-- ============================================================================
-- FIX FULL STOCK LOGIC (VERSION 4 - HANDLE DELETE)
-- Purpose: 
-- 1. All previous logic (Set-Based).
-- 2. Handle DELETE operations: If an active order is deleted, RESTOCK ingredients.
-- ============================================================================

-- 1. CLEANUP
DROP TRIGGER IF EXISTS tr_order_stock_automation ON public.orders;
DROP TRIGGER IF EXISTS on_stock_movement_insert ON public.stock_movements;
DROP FUNCTION IF EXISTS public.fn_handle_stock_on_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.handle_stock_movement() CASCADE;

-- 2. WORKER FUNCTION (Unchanged)
CREATE OR REPLACE FUNCTION public.handle_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type IN ('in', 'restock') THEN
        UPDATE public.ingredients
        SET stock_quantity = COALESCE(stock_quantity, 0) + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.ingredient_id;
    ELSIF NEW.type IN ('out', 'loss', 'sale', 'production') THEN
        UPDATE public.ingredients
        SET stock_quantity = COALESCE(stock_quantity, 0) - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.ingredient_id;
    ELSIF NEW.type = 'adjustment' THEN
         UPDATE public.ingredients
        SET stock_quantity = COALESCE(stock_quantity, 0) + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.ingredient_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. MANAGER FUNCTION (Handles UPDATE and DELETE)
CREATE OR REPLACE FUNCTION public.fn_handle_stock_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    pi RECORD;
    qty_needed NUMERIC;
    
    is_old_consumed BOOLEAN;
    is_new_consumed BOOLEAN;
    
    target_id UUID;
    target_user_id UUID;
BEGIN
    -- INIT VARIABLES BASED ON OPERATION
    IF (TG_OP = 'DELETE') THEN
        target_id := OLD.id;
        target_user_id := OLD.user_id;
        is_old_consumed := (OLD.status IN ('preparing', 'ready', 'delivered'));
        is_new_consumed := FALSE; -- New state is "Non-existent", so not consumed
    ELSE
        target_id := NEW.id;
        target_user_id := NEW.user_id;
        is_old_consumed := (OLD.status IN ('preparing', 'ready', 'delivered'));
        is_new_consumed := (NEW.status IN ('preparing', 'ready', 'delivered'));
    END IF;

    -- LOGIC:
    -- 1. Not Consumed -> Consumed :: SALE
    -- 2. Consumed -> Not Consumed (includes DELETE of Consumed) :: RESTOCK

    IF (NOT is_old_consumed AND is_new_consumed) THEN
        -- DEDUCT STOCK
        FOR item IN SELECT * FROM public.order_items WHERE order_id = target_id LOOP
            FOR pi IN SELECT * FROM public.product_ingredients WHERE product_id = item.product_id LOOP
                qty_needed := COALESCE(pi.quantity, 0) * COALESCE(item.quantity, 0);
                IF qty_needed > 0 THEN
                   INSERT INTO public.stock_movements (user_id, ingredient_id, type, quantity, reason, order_id)
                   VALUES (target_user_id, pi.ingredient_id, 'sale', qty_needed, 'Produção: Pedido #' || target_id, target_id);
                END IF;
            END LOOP;
        END LOOP;

    ELSIF (is_old_consumed AND NOT is_new_consumed) THEN
        -- RESTOCK STOCK
        -- Note: If TG_OP is DELETE, we must use OLD items. But foreign key cascading might delete items first?
        -- Usually Trigger BEFORE DELETE is safer? Or we rely on finding items?
        -- If items are deleted by cascade, SELECT * FROM order_items WHERE order_id = target_id returns NOTHING.
        -- So for DELETE, we must rely on OLD items passed? No, row-level trigger only passes OLD row of orders.
        -- We assume order_items are NOT yet deleted?
        -- Postgres DELETE order: Triggers on parent fire BEFORE cascade? No, AFTER trigger fires AFTER.
        -- Issue: If cascade deletes items, we can't calculate stock to refund.
        -- Fix: Check order_items existence.
        
        -- To be safe, this logic works for UPDATE. For DELETE, we might miss items if cascade happened first.
        -- But let's try standard fetch.
        
        FOR item IN SELECT * FROM public.order_items WHERE order_id = target_id LOOP
           FOR pi IN SELECT * FROM public.product_ingredients WHERE product_id = item.product_id LOOP
                qty_needed := COALESCE(pi.quantity, 0) * COALESCE(item.quantity, 0);
                IF qty_needed > 0 THEN
                   INSERT INTO public.stock_movements (user_id, ingredient_id, type, quantity, reason, order_id)
                   VALUES (target_user_id, pi.ingredient_id, 'restock', qty_needed, 'Estorno/Exclusão: Pedido #' || target_id, target_id);
                END IF;
            END LOOP;
        END LOOP;
    END IF;

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to safely truncate reason if needed, or just standard insert
-- (Inline logic in function above matches previous V3)

-- 4. BIND TRIGGERS
CREATE TRIGGER on_stock_movement_insert
AFTER INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.handle_stock_movement();

-- TRIGGER ON ORDERS (UPDATE AND DELETE)
-- IMPORTANT: For DELETE to see child items, typically we need BEFORE DELETE?
-- Default CASCADE deletes children. AFTER DELETE on parent = children gone.
-- Solution: Use BEFORE DELETE.
CREATE TRIGGER tr_order_stock_automation_update
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.fn_handle_stock_on_status_change();

CREATE TRIGGER tr_order_stock_automation_delete
BEFORE DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_handle_stock_on_status_change();
