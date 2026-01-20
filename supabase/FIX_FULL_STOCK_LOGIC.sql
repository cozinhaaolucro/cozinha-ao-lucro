-- ============================================================================
-- FIX FULL STOCK LOGIC (VERSION 2 - WITH CASCADE)
-- Purpose: 
-- 1. Unify stock deduction logic into a linear flow: Order Change -> Stock Movement -> Stock Update.
-- 2. Fix dependency errors by using CASCADE drops.
-- 3. Ensure History is always created.
-- ============================================================================

-- 1. DROP OLD TRIGGERS AND FUNCTIONS TO CLEAR CONFLICTS (WITH CASCADE)
DROP TRIGGER IF EXISTS tr_order_stock_automation ON public.orders;
DROP TRIGGER IF EXISTS on_stock_movement_insert ON public.stock_movements;
-- Drop legacy triggers identified in error logs
DROP TRIGGER IF EXISTS on_order_preparing_deduct_stock ON public.orders;
DROP TRIGGER IF EXISTS on_order_stock_deduction ON public.orders;

-- Drop functions with CASCADE to remove any other hidden dependencies
DROP FUNCTION IF EXISTS public.fn_handle_stock_on_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.handle_stock_movement() CASCADE;
DROP FUNCTION IF EXISTS public.handle_order_stock_deduction() CASCADE; 
DROP FUNCTION IF EXISTS public.fn_handle_item_stock_direct() CASCADE;
DROP FUNCTION IF EXISTS public.fn_handle_item_stock_delete() CASCADE;

-- 2. CREATE WORKER FUNCTION: Updates Stock based on Movement
CREATE OR REPLACE FUNCTION public.handle_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle Positive Flow (Adding to Stock)
    IF NEW.type IN ('in', 'restock') THEN
        UPDATE public.ingredients
        SET stock_quantity = COALESCE(stock_quantity, 0) + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.ingredient_id;
    
    -- Handle Negative Flow (Removing from Stock)
    ELSIF NEW.type IN ('out', 'loss', 'sale', 'production') THEN
        UPDATE public.ingredients
        SET stock_quantity = COALESCE(stock_quantity, 0) - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.ingredient_id;
        
    -- Handle Adjustment (Delta)
    ELSIF NEW.type = 'adjustment' THEN
         UPDATE public.ingredients
        SET stock_quantity = COALESCE(stock_quantity, 0) + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.ingredient_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CREATE MANAGER FUNCTION: Watch Order Status and Create Movements
CREATE OR REPLACE FUNCTION public.fn_handle_stock_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    pi RECORD;
    qty_needed NUMERIC;
BEGIN
    -- DETERMINE STATUS CHANGE
    IF (NEW.status = 'preparing' AND (OLD.status = 'pending' OR OLD.status IS NULL)) THEN
        -- Order went to Production -> DEDUCT STOCK
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            FOR pi IN SELECT * FROM public.product_ingredients WHERE product_id = item.product_id LOOP
                qty_needed := COALESCE(pi.quantity, 0) * COALESCE(item.quantity, 0);
                
                IF qty_needed > 0 THEN
                   -- Insert Movement (triggers worker)
                   INSERT INTO public.stock_movements (user_id, ingredient_id, type, quantity, reason, order_id)
                   VALUES (NEW.user_id, pi.ingredient_id, 'sale', qty_needed, 'Produção: Pedido #' || NEW.id, NEW.id);
                END IF;
            END LOOP;
        END LOOP;

    -- RESTOCK IF CANCELLED/REVERTED FROM PRODUCTION
    ELSIF (
        (NEW.status IN ('pending', 'cancelled')) AND 
        (OLD.status IN ('preparing', 'ready', 'delivered'))
    ) THEN
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
           FOR pi IN SELECT * FROM public.product_ingredients WHERE product_id = item.product_id LOOP
                qty_needed := COALESCE(pi.quantity, 0) * COALESCE(item.quantity, 0);
                
                IF qty_needed > 0 THEN
                   -- Insert Restock Movement (triggers worker)
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
