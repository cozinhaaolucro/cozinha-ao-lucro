-- ============================================================================
-- FIX: Adicionar TODAS as colunas faltantes do Schema V4 em tabelas existentes
-- Data: 2026-01-20
-- ============================================================================

DO $$
BEGIN
    -- 1. Notifications: adicionar 'type'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE public.notifications ADD COLUMN type TEXT DEFAULT 'info';
    END IF;

    -- 2. Ingredients: adicionar 'min_stock_threshold' (reforço)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredients' AND column_name = 'min_stock_threshold') THEN
        ALTER TABLE public.ingredients ADD COLUMN min_stock_threshold NUMERIC(10, 2) DEFAULT 5;
    END IF;

    -- 3. Products: adicionar campos novos se faltarem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_highlight') THEN
        ALTER TABLE public.products ADD COLUMN is_highlight BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category') THEN
        ALTER TABLE public.products ADD COLUMN category TEXT;
    END IF;
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'active') THEN
        ALTER TABLE public.products ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;

    -- 4. Orders: adicionar novos campos de entrega/pagamento
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_method') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_method TEXT CHECK (delivery_method IS NULL OR delivery_method IN ('pickup', 'delivery'));
    END IF;
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
        ALTER TABLE public.orders ADD COLUMN payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('cash', 'pix', 'card', 'transfer', 'credit_card', 'debit_card'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'position') THEN
        ALTER TABLE public.orders ADD COLUMN position INTEGER DEFAULT 0;
    END IF;

    -- 5. Profiles: adicionar campos de assinatura/config
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'color_theme') THEN
        ALTER TABLE public.profiles ADD COLUMN color_theme TEXT DEFAULT 'orange';
    END IF;
    
END $$;

-- Recarregar funções que podem ter quebrado por falta de colunas
CREATE OR REPLACE FUNCTION public.check_low_stock_and_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_quantity < COALESCE(NEW.min_stock_threshold, 5) AND (OLD.stock_quantity >= COALESCE(NEW.min_stock_threshold, 5) OR OLD.stock_quantity IS NULL) THEN
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (NEW.user_id, '⚠️ Estoque Baixo', 'O ingrediente "' || NEW.name || '" está com estoque baixo (' || ROUND(NEW.stock_quantity::numeric, 2) || ' ' || NEW.unit || ').', 'warning');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refazer trigger da notificação de novo pedido (garantir type)
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER AS $$
DECLARE customer_name TEXT;
BEGIN
    SELECT name INTO customer_name FROM public.customers WHERE id = NEW.customer_id;
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.user_id, '🎉 Novo Pedido!', 'Pedido #' || COALESCE(NEW.display_id::text, LEFT(NEW.id::text, 8)) || CASE WHEN customer_name IS NOT NULL THEN ' de ' || customer_name ELSE '' END || ' - R$ ' || ROUND(NEW.total_value::numeric, 2), 'success');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
