-- ============================================================================
-- COZINHA AO LUCRO - SCHEMA FINAL V4.0 (CONSOLIDADO E COMPLETO)
-- ============================================================================
-- Data: 2026-01-20
-- Status: PRODUÇÃO (Inclui Subscriptions, Performance indexes, Estoque Negativo, Kanban e Views)
-- ============================================================================

-- ============================================================================
-- 0. EXTENSÕES & TIPOS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE plan_type AS ENUM ('free', 'pro', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status_enum AS ENUM ('active', 'past_due', 'canceled', 'trialing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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
    facebook_pixel_id TEXT,
    has_seeded BOOLEAN DEFAULT false,
    -- Assinatura (Legado mantido para compatibilidade, novo sistema usa tabela subscriptions)
    subscription_status TEXT DEFAULT 'trial',
    subscription_plan TEXT DEFAULT 'pro',
    subscription_end TIMESTAMPTZ,
    subscription_interval TEXT DEFAULT 'monthly',
    pagarme_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Subscriptions (Sistema Novo SaaS)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id plan_type NOT NULL DEFAULT 'free',
  status subscription_status_enum NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  stripe_customer_id text,
  stripe_subscription_id text
);

-- 1.3 Usage Metrics (Limites SaaS)
CREATE TABLE IF NOT EXISTS public.usage_metrics (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  orders_count_month integer DEFAULT 0,
  products_count_total integer DEFAULT 0,
  customers_count_total integer DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- 1.4 Ingredientes
CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    cost_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock_quantity NUMERIC(10, 2) DEFAULT 0,
    min_stock_threshold NUMERIC(10, 2) DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- 1.5 Produtos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    selling_price NUMERIC(10, 2),
    selling_unit TEXT DEFAULT 'unidade',
    preparation_time_minutes INTEGER DEFAULT 0,
    hourly_rate NUMERIC(10, 2) DEFAULT 0,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    is_highlight BOOLEAN DEFAULT false,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 Ficha Técnica (Product Ingredients)
CREATE TABLE IF NOT EXISTS public.product_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 3) NOT NULL,
    UNIQUE(product_id, ingredient_id)
);

-- 1.7 Clientes
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    last_order_date TIMESTAMPTZ,
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.8 Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    order_number TEXT,
    display_id SERIAL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
    total_value NUMERIC(10, 2) DEFAULT 0,
    total_cost NUMERIC(10, 2) DEFAULT 0,
    position INTEGER DEFAULT 0, -- Kanban Position
    delivery_date DATE,
    delivery_time TEXT,
    delivery_method TEXT CHECK (delivery_method IS NULL OR delivery_method IN ('pickup', 'delivery')),
    delivery_fee NUMERIC(10, 2) DEFAULT 0,
    payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('cash', 'pix', 'card', 'transfer', 'credit_card', 'debit_card')),
    notes TEXT,
    google_event_id TEXT,
    start_date DATE,
    production_started_at TIMESTAMPTZ,
    production_completed_at TIMESTAMPTZ,
    production_duration_minutes INTEGER,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.9 Itens do Pedido
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    unit_cost NUMERIC(10, 2) DEFAULT 0,
    subtotal NUMERIC(10, 2) NOT NULL
);

-- 1.10 Logs de Status e Movimentações
CREATE TABLE IF NOT EXISTS public.order_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'loss', 'sale')),
    quantity NUMERIC(10, 3) NOT NULL,
    reason TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.11 Sistema Auxiliar (Templates, Logs, Notificações, Histórico de Pagamentos, Erros)
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'whatsapp',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    notes TEXT,
    content TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pagarme_order_id TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
-- 2. POLÍTICAS RLS (Row Level Security) - COMPLETO
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

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
    CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true); -- Perfil público

    -- Subscriptions
    DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
    CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

    -- Usage Metrics
    DROP POLICY IF EXISTS "Users can view their own metrics" ON public.usage_metrics;
    CREATE POLICY "Users can view their own metrics" ON public.usage_metrics FOR SELECT USING (auth.uid() = user_id);

    -- Ingredients
    DROP POLICY IF EXISTS "ingredients_all_own" ON public.ingredients;
    CREATE POLICY "ingredients_all_own" ON public.ingredients FOR ALL USING (auth.uid() = user_id);

    -- Products
    DROP POLICY IF EXISTS "products_all_own" ON public.products;
    DROP POLICY IF EXISTS "products_public_menu" ON public.products;
    CREATE POLICY "products_all_own" ON public.products FOR ALL USING (auth.uid() = user_id);
    CREATE POLICY "products_public_menu" ON public.products FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = products.user_id AND products.active = true)
    );

    -- Product Ingredients (Ficha Técnica)
    DROP POLICY IF EXISTS "product_ingredients_all_own" ON public.product_ingredients;
    DROP POLICY IF EXISTS "product_ingredients_public_read_via_product" ON public.product_ingredients;
    CREATE POLICY "product_ingredients_all_own" ON public.product_ingredients FOR ALL 
        USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_ingredients.product_id AND products.user_id = auth.uid()));
    CREATE POLICY "product_ingredients_public_read_via_product" ON public.product_ingredients FOR SELECT 
        USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_ingredients.product_id AND products.active = true));

    -- Customers
    DROP POLICY IF EXISTS "customers_all_own" ON public.customers;
    CREATE POLICY "customers_all_own" ON public.customers FOR ALL USING (auth.uid() = user_id);

    -- Orders
    DROP POLICY IF EXISTS "orders_all_own" ON public.orders;
    CREATE POLICY "orders_all_own" ON public.orders FOR ALL USING (auth.uid() = user_id);

    -- Order Items
    DROP POLICY IF EXISTS "order_items_all_own" ON public.order_items;
    CREATE POLICY "order_items_all_own" ON public.order_items FOR ALL 
        USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

    -- Order Status Logs
    DROP POLICY IF EXISTS "order_status_logs_select_own" ON public.order_status_logs;
    CREATE POLICY "order_status_logs_select_own" ON public.order_status_logs FOR SELECT 
        USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_status_logs.order_id AND orders.user_id = auth.uid()));

    -- Stock Movements
    DROP POLICY IF EXISTS "stock_movements_all_own" ON public.stock_movements;
    CREATE POLICY "stock_movements_all_own" ON public.stock_movements FOR ALL USING (auth.uid() = user_id);

    -- Message Templates
    DROP POLICY IF EXISTS "message_templates_all_own" ON public.message_templates;
    CREATE POLICY "message_templates_all_own" ON public.message_templates FOR ALL USING (auth.uid() = user_id);

    -- Interaction Logs
    DROP POLICY IF EXISTS "interaction_logs_all_own" ON public.interaction_logs;
    CREATE POLICY "interaction_logs_all_own" ON public.interaction_logs FOR ALL USING (auth.uid() = user_id);

    -- Notifications
    DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
    DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
    CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

    -- Payment History
    DROP POLICY IF EXISTS "payment_history_select_own" ON public.payment_history;
    CREATE POLICY "payment_history_select_own" ON public.payment_history FOR SELECT USING (auth.uid() = user_id);

    -- System Errors (Log only)
    DROP POLICY IF EXISTS "system_errors_insert_any" ON public.system_errors;
    DROP POLICY IF EXISTS "system_errors_select_own" ON public.system_errors;
    CREATE POLICY "system_errors_insert_any" ON public.system_errors FOR INSERT WITH CHECK (true);
    CREATE POLICY "system_errors_select_own" ON public.system_errors FOR SELECT USING (auth.uid() = user_id);
END $$;

-- ============================================================================
-- 3. FUNÇÕES E TRIGGERS (AUTOMATIZAÇÃO COMPLETA)
-- ============================================================================

-- 3.1 Setup de Novo Usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, business_name, phone)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'phone', ''))
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.subscriptions (user_id, plan_id, status) VALUES (NEW.id, 'free', 'active');
    INSERT INTO public.usage_metrics (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3.2 Atualizar Estatísticas do Cliente
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_created_stats ON public.orders;
CREATE TRIGGER on_order_created_stats AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_customer_stats_on_order();

-- 3.3 Log Automático de Mudança de Status
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.order_status_logs (order_id, previous_status, new_status, user_id)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- 3.4 Calcular Duração de Produção
CREATE OR REPLACE FUNCTION public.calculate_production_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.production_completed_at IS NOT NULL AND OLD.production_completed_at IS NULL AND NEW.production_started_at IS NOT NULL THEN
        NEW.production_duration_minutes := EXTRACT(EPOCH FROM (NEW.production_completed_at - NEW.production_started_at)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_production_complete ON public.orders;
CREATE TRIGGER on_production_complete BEFORE UPDATE OF production_completed_at ON public.orders FOR EACH ROW EXECUTE FUNCTION public.calculate_production_duration();

-- 3.5 Dedução Inteligente de Estoque (Permite Negativo) + Movimentações
CREATE OR REPLACE FUNCTION public.handle_order_stock_deduction()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    ing RECORD;
    qty_needed NUMERIC;
BEGIN
    -- SAIU DE PENDING -> PREPARING (Consumir estoque)
    IF NEW.status = 'preparing' AND (OLD.status = 'pending' OR OLD.status IS NULL) THEN
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            FOR ing IN SELECT ingredient_id, quantity FROM public.product_ingredients WHERE product_id = item.product_id LOOP
                qty_needed := ing.quantity * item.quantity;
                -- Log Movimento
                INSERT INTO public.stock_movements (user_id, ingredient_id, type, quantity, reason, order_id)
                VALUES (NEW.user_id, ing.ingredient_id, 'sale', qty_needed, 'Produção: Pedido #' || COALESCE(NEW.display_id::text, NEW.id::text), NEW.id);
                -- Baixa (sem GREATEST 0, permitindo negativo para alertar)
                UPDATE public.ingredients SET stock_quantity = stock_quantity - qty_needed, updated_at = NOW() WHERE id = ing.ingredient_id;
            END LOOP;
        END LOOP;
        
    -- VOLTOU DE PREPARING -> PENDING/CANCELLED (Estornar estoque)
    ELSIF OLD.status = 'preparing' AND (NEW.status = 'pending' OR NEW.status = 'cancelled') THEN
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            FOR ing IN SELECT ingredient_id, quantity FROM public.product_ingredients WHERE product_id = item.product_id LOOP
                qty_needed := ing.quantity * item.quantity;
                INSERT INTO public.stock_movements (user_id, ingredient_id, type, quantity, reason, order_id)
                VALUES (NEW.user_id, ing.ingredient_id, 'adjustment', qty_needed, 'Estorno: Pedido #' || COALESCE(NEW.display_id::text, NEW.id::text), NEW.id);
                UPDATE public.ingredients SET stock_quantity = stock_quantity + qty_needed, updated_at = NOW() WHERE id = ing.ingredient_id;
            END LOOP;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_stock_deduction ON public.orders;
CREATE TRIGGER on_order_stock_deduction AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_order_stock_deduction();

-- 3.6 Notificação de Estoque Baixo
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

DROP TRIGGER IF EXISTS on_ingredient_low_stock ON public.ingredients;
CREATE TRIGGER on_ingredient_low_stock AFTER UPDATE OF stock_quantity ON public.ingredients FOR EACH ROW EXECUTE FUNCTION public.check_low_stock_and_notify();

-- 3.7 Notificação de Novo Pedido
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

DROP TRIGGER IF EXISTS on_new_order_notify ON public.orders;
CREATE TRIGGER on_new_order_notify AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.notify_new_order();

-- 3.8 Função para adicionar itens diretamente ajustando estoque (ex: adicionar depois de iniciado)
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
            SET stock_quantity = stock_quantity - (pi.quantity * NEW.quantity), updated_at = now()
            WHERE id = pi.ingredient_id;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_order_item_stock_insert ON public.order_items;
CREATE TRIGGER tr_order_item_stock_insert AFTER INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.fn_handle_item_stock_direct();

-- ============================================================================
-- 4. VIEWS MATERIALIZADAS (DASHBOARD PERFORMANCE)
-- ============================================================================

-- 4.1 Daily Metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_metrics AS
SELECT 
    o.user_id,
    COALESCE(o.delivery_date, DATE(o.created_at)) as date,
    SUM(o.total_value) as revenue,
    SUM(o.total_cost) as cost,
    SUM(o.total_value - o.total_cost) as profit,
    COUNT(*) as orders_count,
    COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_count,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_count,
    AVG(o.total_value) as avg_ticket
FROM orders o
WHERE o.status != 'cancelled'
GROUP BY o.user_id, COALESCE(o.delivery_date, DATE(o.created_at));

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_metrics_unique ON mv_daily_metrics (user_id, date);
CREATE INDEX IF NOT EXISTS idx_mv_daily_metrics_user ON mv_daily_metrics (user_id);

-- 4.2 Monthly Metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_metrics AS
SELECT 
    o.user_id,
    DATE_TRUNC('month', COALESCE(o.delivery_date, DATE(o.created_at))) as month,
    SUM(o.total_value) as revenue,
    SUM(o.total_cost) as cost,
    SUM(o.total_value - o.total_cost) as profit,
    COUNT(*) as orders_count,
    COUNT(DISTINCT o.customer_id) as unique_customers,
    AVG(o.total_value) as avg_ticket
FROM orders o
WHERE o.status != 'cancelled'
GROUP BY o.user_id, DATE_TRUNC('month', COALESCE(o.delivery_date, DATE(o.created_at)));

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_monthly_metrics_unique ON mv_monthly_metrics (user_id, month);

-- 4.3 Product Performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_performance AS
SELECT 
    oi.product_id,
    p.name as product_name,
    p.user_id,
    p.selling_price as current_price,
    COUNT(DISTINCT o.id) as times_sold,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.subtotal) as total_revenue,
    AVG(oi.unit_price) as avg_sold_price,
    AVG(oi.unit_cost) as avg_cost,
    SUM(oi.subtotal - (oi.unit_cost * oi.quantity)) as total_profit
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.status NOT IN ('cancelled')
GROUP BY oi.product_id, p.name, p.user_id, p.selling_price;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_product_performance_unique ON mv_product_performance (product_id);

-- 4.4 Refresh Function
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_performance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. ÍNDICES DE PERFORMANCE (GERAL)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_delivery ON orders (user_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders (user_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_user_name ON customers (user_id, name);
CREATE INDEX IF NOT EXISTS idx_products_user_name ON products (user_id, name);
CREATE INDEX IF NOT EXISTS idx_ingredients_user_name ON ingredients (user_id, name);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON stock_movements (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, read);

-- ============================================================================
-- 6. STORAGE BUCKETS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
    CREATE POLICY "product_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
    DROP POLICY IF EXISTS "product_images_authenticated_insert" ON storage.objects;
    CREATE POLICY "product_images_authenticated_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
    
    DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
    CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
    DROP POLICY IF EXISTS "avatars_authenticated_insert" ON storage.objects;
    CREATE POLICY "avatars_authenticated_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
