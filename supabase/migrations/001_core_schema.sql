-- ============================================================================
-- COZINHA AO LUCRO - MIGRATION 001: CORE SCHEMA
-- ============================================================================
-- Versão: 1.0.0
-- Descrição: Schema base do sistema com todas as tabelas essenciais, RLS e triggers
-- Idempotente: Sim (seguro para rodar múltiplas vezes)
-- ============================================================================

-- 0. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABELAS PRINCIPAIS
-- ============================================================================

-- 1.1 Profiles (estende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT,
    phone TEXT,
    logo_url TEXT,
    description TEXT,
    banner_url TEXT,
    color_theme TEXT DEFAULT 'orange',
    slug TEXT UNIQUE,
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
    subscription_plan TEXT DEFAULT 'pro',
    subscription_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Ingredientes
CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    unit TEXT NOT NULL CHECK (unit IN ('kg', 'g', 'mg', 'l', 'ml', 'unidade', 'un', 'cx', 'caixa', 'pct', 'pacote', 'fatia', 'lata', 'garrafa', 'dúzia', 'duzia', 'maço', 'colher', 'copo', 'xícara')),
    cost_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock_quantity NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Produtos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    selling_price NUMERIC(10, 2),
    selling_unit TEXT DEFAULT 'unidade' CHECK (selling_unit IN ('kg', 'g', 'mg', 'l', 'ml', 'unidade', 'un', 'cx', 'caixa', 'pct', 'pacote', 'fatia', 'lata', 'garrafa', 'dúzia', 'duzia', 'kit', 'combo', 'porção')),
    preparation_time_minutes INTEGER DEFAULT 0,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Ficha Técnica (Product Ingredients)
CREATE TABLE IF NOT EXISTS public.product_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 3) NOT NULL,
    UNIQUE(product_id, ingredient_id)
);

-- 1.5 Clientes
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    last_order_date TIMESTAMPTZ,
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    order_number TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
    total_value NUMERIC(10, 2) DEFAULT 0,
    delivery_date DATE,
    delivery_time TEXT,
    notes TEXT,
    google_event_id TEXT,
    -- Timestamps de produção
    production_started_at TIMESTAMPTZ,
    production_completed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.7 Itens do Pedido
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);

-- 1.8 Templates de Mensagem
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.9 Logs de Interação
CREATE TABLE IF NOT EXISTS public.interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    notes TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.10 Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.11 Logs de Erro do Sistema
CREATE TABLE IF NOT EXISTS public.system_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    function_name TEXT,
    error_message TEXT,
    error_details JSONB,
    severity TEXT DEFAULT 'ERROR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

-- Policies (usando DO block para idempotência)
DO $$ 
BEGIN
    -- Profiles
    DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
    
    CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true); -- Menu público

    -- Ingredients
    DROP POLICY IF EXISTS "ingredients_all_own" ON public.ingredients;
    CREATE POLICY "ingredients_all_own" ON public.ingredients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    -- Products
    DROP POLICY IF EXISTS "products_all_own" ON public.products;
    DROP POLICY IF EXISTS "products_public_read" ON public.products;
    CREATE POLICY "products_all_own" ON public.products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (active = true);

    -- Product Ingredients
    DROP POLICY IF EXISTS "product_ingredients_all_own" ON public.product_ingredients;
    CREATE POLICY "product_ingredients_all_own" ON public.product_ingredients FOR ALL 
        USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_ingredients.product_id AND products.user_id = auth.uid()))
        WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_ingredients.product_id AND products.user_id = auth.uid()));

    -- Customers
    DROP POLICY IF EXISTS "customers_all_own" ON public.customers;
    CREATE POLICY "customers_all_own" ON public.customers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    -- Orders
    DROP POLICY IF EXISTS "orders_all_own" ON public.orders;
    CREATE POLICY "orders_all_own" ON public.orders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    -- Order Items
    DROP POLICY IF EXISTS "order_items_all_own" ON public.order_items;
    CREATE POLICY "order_items_all_own" ON public.order_items FOR ALL 
        USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()))
        WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

    -- Message Templates
    DROP POLICY IF EXISTS "message_templates_all_own" ON public.message_templates;
    CREATE POLICY "message_templates_all_own" ON public.message_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    -- Interaction Logs
    DROP POLICY IF EXISTS "interaction_logs_all_own" ON public.interaction_logs;
    CREATE POLICY "interaction_logs_all_own" ON public.interaction_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    -- Notifications
    DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
    DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
    DROP POLICY IF EXISTS "notifications_insert_any" ON public.notifications;
    CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
    CREATE POLICY "notifications_insert_any" ON public.notifications FOR INSERT WITH CHECK (true);

    -- System Errors
    DROP POLICY IF EXISTS "system_errors_insert_any" ON public.system_errors;
    DROP POLICY IF EXISTS "system_errors_select_own" ON public.system_errors;
    CREATE POLICY "system_errors_insert_any" ON public.system_errors FOR INSERT WITH CHECK (true);
    CREATE POLICY "system_errors_select_own" ON public.system_errors FOR SELECT USING (auth.uid() = user_id);
END $$;

-- ============================================================================
-- 3. FUNÇÕES E TRIGGERS
-- ============================================================================

-- 3.1 Criar perfil ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, business_name, phone)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        business_name = COALESCE(EXCLUDED.business_name, public.profiles.business_name),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = NOW();
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.system_errors (user_id, function_name, error_message, error_details)
    VALUES (NEW.id, 'handle_new_user', SQLERRM, jsonb_build_object('meta', NEW.raw_user_meta_data));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3.2 Atualizar estatísticas do cliente
CREATE OR REPLACE FUNCTION public.update_customer_stats_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_id IS NOT NULL THEN
        UPDATE public.customers 
        SET 
            last_order_date = NEW.created_at,
            total_orders = (SELECT COUNT(*) FROM orders WHERE customer_id = NEW.customer_id AND status != 'cancelled'),
            total_spent = (SELECT COALESCE(SUM(total_value), 0) FROM orders WHERE customer_id = NEW.customer_id AND status != 'cancelled'),
            updated_at = NOW()
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW; -- Não bloquear operação principal
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_created ON public.orders;
CREATE TRIGGER on_order_created
    AFTER INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_customer_stats_on_order();

DROP TRIGGER IF EXISTS on_order_updated ON public.orders;
CREATE TRIGGER on_order_updated
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_customer_stats_on_order();

-- ============================================================================
-- 4. ÍNDICES DE PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ingredients_user_id ON public.ingredients(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON public.orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status_date ON public.orders(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_production_started ON public.orders(production_started_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug);

-- ============================================================================
-- 5. COMENTÁRIOS DE DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'Perfis de usuários/negócios';
COMMENT ON TABLE public.ingredients IS 'Ingredientes usados nas receitas';
COMMENT ON TABLE public.products IS 'Produtos vendáveis com ficha técnica';
COMMENT ON TABLE public.orders IS 'Pedidos dos clientes';
COMMENT ON COLUMN public.ingredients.stock_quantity IS 'Quantidade em estoque (mesma unidade)';
COMMENT ON COLUMN public.products.selling_unit IS 'Unidade de venda: unidade, kg, etc';
COMMENT ON COLUMN public.products.preparation_time_minutes IS 'Tempo estimado de preparo em minutos';
COMMENT ON COLUMN public.orders.production_started_at IS 'Timestamp do início da produção';
COMMENT ON COLUMN public.orders.production_completed_at IS 'Timestamp da conclusão da produção';
COMMENT ON COLUMN public.orders.delivered_at IS 'Timestamp da entrega/pagamento';
COMMENT ON COLUMN public.profiles.slug IS 'URL amigável para menu público';

-- FIM DO SCRIPT 001
