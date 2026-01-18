-- ============================================================================
-- MIGRATION: ALLOW NEGATIVE STOCK
-- Data: 2026-01-18
-- Descrição: Remove o bloqueio GREATEST(0, ...) dos triggers de estoque para
--            permitir que o saldo fique negativo, refletindo o déficit real.
-- ============================================================================

-- 1. Atualizar função de mudança de status do pedido
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

    -- GATILHO: BAIXA DE ESTOQUE (Pending -> Preparing)
    IF (target_status = 'preparing' AND (prev_status = 'pending' OR prev_status IS NULL)) THEN
        FOR item IN SELECT * FROM public.order_items WHERE order_id = target_id LOOP
            FOR pi IN SELECT * FROM public.product_ingredients WHERE product_id = item.product_id LOOP
                UPDATE public.ingredients 
                SET stock_quantity = stock_quantity - (pi.quantity * item.quantity), -- REMOVIDO O CLAMP GREATEST(0, ...)
                    updated_at = now()
                WHERE id = pi.ingredient_id;
            END LOOP;
        END LOOP;

    -- GATILHO: ESTORNO DE ESTOQUE (Preparing/Ready/Delivered -> Pending/Cancelled)
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


-- 2. Atualizar função de Adição Direta de Item (em pedidos já em produção)
CREATE OR REPLACE FUNCTION public.fn_handle_item_stock_direct()
RETURNS TRIGGER AS $$
DECLARE
    parent_status TEXT;
    pi RECORD;
BEGIN
    SELECT status INTO parent_status FROM public.orders WHERE id = NEW.order_id;
    
    IF (parent_status IN ('preparing', 'ready', 'delivered')) THEN
        FOR pi IN SELECT * FROM public.product_ingredients WHERE product_id = NEW.product_id LOOP
            UPDATE public.ingredients 
            SET stock_quantity = stock_quantity - (pi.quantity * NEW.quantity), -- REMOVIDO O CLAMP GREATEST(0, ...)
                updated_at = now()
            WHERE id = pi.ingredient_id;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
