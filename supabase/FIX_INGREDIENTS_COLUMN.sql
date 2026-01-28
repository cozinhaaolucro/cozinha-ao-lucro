-- ============================================================================
-- FIX: Adicionar coluna min_stock_threshold faltante na tabela ingredients
-- Data: 2026-01-20
-- ============================================================================

-- 1. Adicionar a coluna se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredients' AND column_name = 'min_stock_threshold') THEN
        ALTER TABLE public.ingredients ADD COLUMN min_stock_threshold NUMERIC(10, 2) DEFAULT 5;
    END IF;
END $$;

-- 2. Atualizar a função que depende dessa coluna (para garantir que ela reconheça a nova coluna)
CREATE OR REPLACE FUNCTION public.check_low_stock_and_notify()
RETURNS TRIGGER AS $$
BEGIN
    -- O erro ocorria aqui porque NEW.min_stock_threshold não existia no record NEW
    IF NEW.stock_quantity < COALESCE(NEW.min_stock_threshold, 5) AND (OLD.stock_quantity >= COALESCE(NEW.min_stock_threshold, 5) OR OLD.stock_quantity IS NULL) THEN
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (NEW.user_id, '⚠️ Estoque Baixo', 'O ingrediente "' || NEW.name || '" está com estoque baixo (' || ROUND(NEW.stock_quantity::numeric, 2) || ' ' || NEW.unit || ').', 'warning');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Confirmar que a trigger está ativa
DROP TRIGGER IF EXISTS on_ingredient_low_stock ON public.ingredients;
CREATE TRIGGER on_ingredient_low_stock AFTER UPDATE OF stock_quantity ON public.ingredients FOR EACH ROW EXECUTE FUNCTION public.check_low_stock_and_notify();

