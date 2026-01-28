-- Fix for Order Status Trigger causing 'Error saving order'
-- 1. Enhances robustness against NULL values.
-- 2. Ensures logic handles negative stock correctly (removes GREATEST constraint if present in old function).
-- 3. Handles both Legacy and New Trigger logic just in case.

CREATE OR REPLACE FUNCTION public.fn_handle_stock_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    pi RECORD;
    target_id UUID;
    target_status TEXT;
    prev_status TEXT;
    qty_needed NUMERIC;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_id := OLD.id;
        target_status := 'cancelled'; 
        prev_status := OLD.status;
    ELSE
        target_id := NEW.id;
        target_status := NEW.status;
        prev_status := OLD.status;
    END IF;

    -- GATILHO: BAIXA DE ESTOQUE
    -- Quando status muda para 'preparing' (vindo de pending/null)
    IF (target_status = 'preparing' AND (prev_status = 'pending' OR prev_status IS NULL)) THEN
        FOR item IN SELECT * FROM public.order_items WHERE order_id = target_id LOOP
            -- Check if product exists and has ingredients
            FOR pi IN SELECT * FROM public.product_ingredients WHERE product_id = item.product_id LOOP
                qty_needed := COALESCE(pi.quantity, 0) * COALESCE(item.quantity, 0);
                
                -- UPDATE with COALESCE to prevent NULL crash
                IF qty_needed > 0 THEN
                    UPDATE public.ingredients 
                    SET stock_quantity = COALESCE(stock_quantity, 0) - qty_needed,
                        updated_at = now()
                    WHERE id = pi.ingredient_id;
                END IF;
            END LOOP;
        END LOOP;

    -- GATILHO: ESTORNO DE ESTOQUE
    -- Quando volta para pending ou cancelado
    ELSIF (
        (target_status IN ('pending', 'cancelled')) AND 
        (prev_status IN ('preparing', 'ready', 'delivered'))
    ) THEN
        FOR item IN SELECT * FROM public.order_items WHERE order_id = target_id LOOP
            FOR pi IN SELECT * FROM public.product_ingredients WHERE product_id = item.product_id LOOP
                qty_needed := COALESCE(pi.quantity, 0) * COALESCE(item.quantity, 0);
                
                IF qty_needed > 0 THEN
                    UPDATE public.ingredients 
                    SET stock_quantity = COALESCE(stock_quantity, 0) + qty_needed,
                        updated_at = now()
                    WHERE id = pi.ingredient_id;
                END IF;
            END LOOP;
        END LOOP;
    END IF;

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger just to be sure
DROP TRIGGER IF EXISTS tr_order_stock_automation ON public.orders;
CREATE TRIGGER tr_order_stock_automation
    AFTER INSERT OR UPDATE OF status OR DELETE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_handle_stock_on_status_change();
