-- ============================================================================
-- COZINHA AO LUCRO - MIGRATION 002: INVENTORY TRACKING
-- ============================================================================
-- Versão: 1.0.0
-- Descrição: Sistema de controle de estoque com movimentações e dedução automática
-- Idempotente: Sim (seguro para rodar múltiplas vezes)
-- ============================================================================

-- ============================================================================
-- 1. TABELA DE MOVIMENTAÇÕES DE ESTOQUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'loss', 'sale')),
    quantity NUMERIC(10, 3) NOT NULL, -- Valor positivo (direção definida pelo tipo)
    reason TEXT, -- Notas opcionais
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "stock_movements_all_own" ON public.stock_movements;
    CREATE POLICY "stock_movements_all_own" ON public.stock_movements
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON public.stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ingredient_id ON public.stock_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at DESC);

-- ============================================================================
-- 2. FUNÇÃO DE DEDUÇÃO AUTOMÁTICA DE ESTOQUE
-- ============================================================================
-- Lógica:
-- - PENDENTE -> PREPARANDO: Deduz estoque (produção iniciada)
-- - PREPARANDO -> PENDENTE/CANCELADO: Devolve estoque (estorno)

CREATE OR REPLACE FUNCTION public.handle_order_stock_deduction()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    ing RECORD;
    qty_needed NUMERIC;
BEGIN
    -- CASO 1: Produção Iniciada (pending -> preparing)
    -- Ação: DEDUZIR Estoque
    IF NEW.status = 'preparing' AND (OLD.status = 'pending' OR OLD.status IS NULL) THEN
        
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            FOR ing IN 
                SELECT ingredient_id, quantity 
                FROM public.product_ingredients 
                WHERE product_id = item.product_id
            LOOP
                qty_needed := ing.quantity * item.quantity;
                
                -- Registrar movimento de saída
                INSERT INTO public.stock_movements (user_id, ingredient_id, type, quantity, reason)
                VALUES (NEW.user_id, ing.ingredient_id, 'sale', qty_needed, 'Produção: Pedido #' || COALESCE(NEW.order_number, NEW.id::text));
                
                -- Deduzir do estoque
                UPDATE public.ingredients
                SET stock_quantity = stock_quantity - qty_needed,
                    updated_at = NOW()
                WHERE id = ing.ingredient_id;
            END LOOP;
        END LOOP;

    -- CASO 2: Produção Revertida (preparing -> pending/cancelled)
    -- Ação: DEVOLVER Estoque
    ELSIF OLD.status = 'preparing' AND (NEW.status = 'pending' OR NEW.status = 'cancelled') THEN
        
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            FOR ing IN 
                SELECT ingredient_id, quantity 
                FROM public.product_ingredients 
                WHERE product_id = item.product_id
            LOOP
                qty_needed := ing.quantity * item.quantity;
                
                -- Registrar movimento de ajuste (devolução)
                INSERT INTO public.stock_movements (user_id, ingredient_id, type, quantity, reason)
                VALUES (NEW.user_id, ing.ingredient_id, 'adjustment', qty_needed, 'Estorno: Pedido #' || COALESCE(NEW.order_number, NEW.id::text) || ' (' || NEW.status || ')');
                
                -- Devolver ao estoque
                UPDATE public.ingredients
                SET stock_quantity = stock_quantity + qty_needed,
                    updated_at = NOW()
                WHERE id = ing.ingredient_id;
            END LOOP;
        END LOOP;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log erro mas não bloqueia a operação
    INSERT INTO public.system_errors (user_id, function_name, error_message, severity)
    VALUES (NEW.user_id, 'handle_order_stock_deduction', SQLERRM, 'WARNING');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_order_stock_deduction ON public.orders;
CREATE TRIGGER on_order_stock_deduction
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_stock_deduction();

-- ============================================================================
-- 3. DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE public.stock_movements IS 'Histórico de movimentações de estoque';
COMMENT ON COLUMN public.stock_movements.type IS 'Tipo: in=entrada, out=saída, adjustment=ajuste, loss=perda, sale=venda';
COMMENT ON COLUMN public.stock_movements.quantity IS 'Quantidade movimentada (sempre positivo)';

-- FIM DO SCRIPT 002
