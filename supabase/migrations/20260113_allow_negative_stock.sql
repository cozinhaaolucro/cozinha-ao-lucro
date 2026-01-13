-- ============================================================================
-- MIGRATION: ALLOW NEGATIVE STOCK
-- Data: 2026-01-13
-- Descrição: Remove a restrição GREATEST(0, ...) das funções de dedução de estoque
--            para permitir que o estoque fique negativo quando necessário.
-- ============================================================================

-- 1. Atualizar handle_order_stock_deduction (Trigger Legado/Completo)
CREATE OR REPLACE FUNCTION public.handle_order_stock_deduction()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    ing RECORD;
    qty_needed NUMERIC;
BEGIN
    IF NEW.status = 'preparing' AND (OLD.status = 'pending' OR OLD.status IS NULL) THEN
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            FOR ing IN SELECT ingredient_id, quantity FROM public.product_ingredients WHERE product_id = item.product_id LOOP
                qty_needed := ing.quantity * item.quantity;
                -- INSERE MOVIMENTO
                INSERT INTO public.stock_movements (user_id, ingredient_id, type, quantity, reason, order_id)
                VALUES (NEW.user_id, ing.ingredient_id, 'sale', qty_needed, 'Produção: Pedido #' || COALESCE(NEW.display_id::text, NEW.id::text), NEW.id);
                -- ATUALIZA ESTOQUE (PERMITINDO NEGATIVO)
                UPDATE public.ingredients SET stock_quantity = stock_quantity - qty_needed, updated_at = NOW() WHERE id = ing.ingredient_id;
            END LOOP;
        END LOOP;
    ELSIF OLD.status = 'preparing' AND (NEW.status = 'pending' OR NEW.status = 'cancelled') THEN
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            FOR ing IN SELECT ingredient_id, quantity FROM public.product_ingredients WHERE product_id = item.product_id LOOP
                qty_needed := ing.quantity * item.quantity;
                -- INSERE MOVIMENTO
                INSERT INTO public.stock_movements (user_id, ingredient_id, type, quantity, reason, order_id)
                VALUES (NEW.user_id, ing.ingredient_id, 'adjustment', qty_needed, 'Estorno: Pedido #' || COALESCE(NEW.display_id::text, NEW.id::text), NEW.id);
                -- ATUALIZA ESTOQUE (PERMITINDO NEGATIVO SE NECESSÁRIO NO ESTORNO? GERALMENTE SOMA)
                UPDATE public.ingredients SET stock_quantity = stock_quantity + qty_needed, updated_at = NOW() WHERE id = ing.ingredient_id;
            END LOOP;
        END LOOP;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.system_errors (user_id, function_name, error_message, severity) VALUES (NEW.user_id, 'handle_order_stock_deduction', SQLERRM, 'WARNING');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atualizar fn_handle_stock_on_status_change (Trigger Novo - se utilizado)
CREATE OR REPLACE FUNCTION public.fn_handle_stock_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    pi RECORD;
    target_id UUID;
    target_status TEXT;
    prev_status TEXT;
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
    IF (target_status = 'preparing' AND (prev_status = 'pending' OR prev_status IS NULL)) THEN
        FOR item IN SELECT * FROM public.order_items WHERE order_id = target_id LOOP
            FOR pi IN SELECT * FROM public.product_ingredients WHERE product_id = item.product_id LOOP
                -- ATUALIZA ESTOQUE (PERMITINDO NEGATIVO)
                UPDATE public.ingredients 
                SET stock_quantity = stock_quantity - (pi.quantity * item.quantity),
                    updated_at = now()
                WHERE id = pi.ingredient_id;
            END LOOP;
        END LOOP;

    -- GATILHO: ESTORNO DE ESTOQUE
    ELSIF (
        (target_status IN ('pending', 'cancelled')) AND 
        (prev_status IN ('preparing', 'ready', 'delivered'))
    ) THEN
        FOR item IN SELECT * FROM public.order_items WHERE order_id = target_id LOOP
            FOR pi IN SELECT * FROM public.product_ingredients WHERE product_id = item.product_id LOOP
                UPDATE public.ingredients 
                SET stock_quantity = stock_quantity + (pi.quantity * item.quantity),
                    updated_at = now()
                WHERE id = pi.ingredient_id;
            END LOOP;
        END LOOP;
    END IF;

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualizar fn_handle_item_stock_direct (Adição de itens em pedidos em andamento)
CREATE OR REPLACE FUNCTION public.fn_handle_item_stock_direct()
RETURNS TRIGGER AS $$
DECLARE
    parent_status TEXT;
    pi RECORD;
BEGIN
    SELECT status INTO parent_status FROM public.orders WHERE id = NEW.order_id;
    
    IF (parent_status IN ('preparing', 'ready', 'delivered')) THEN
        FOR pi IN SELECT * FROM public.product_ingredients WHERE product_id = NEW.product_id LOOP
            -- ATUALIZA ESTOQUE (PERMITINDO NEGATIVO)
            UPDATE public.ingredients 
            SET stock_quantity = stock_quantity - (pi.quantity * NEW.quantity),
                updated_at = now()
            WHERE id = pi.ingredient_id;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
