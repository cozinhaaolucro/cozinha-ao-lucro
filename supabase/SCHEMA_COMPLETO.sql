-- ============================================================================
-- COZINHA AO LUCRO - SCHEMA COMPLETO CONSOLIDADO
-- ============================================================================
-- Versão: 3.0.0
-- Data: 2026-01-11
-- Descrição: Schema ÚNICO e COMPLETO do sistema. Execute este arquivo em um
--            banco VAZIO para criar toda a estrutura necessária.
-- 
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard > SQL Editor
-- 2. Cole TODO este arquivo
-- 3. Execute
-- ============================================================================

-- ============================================================================
-- 0. EXTENSÕES
-- ============================================================================
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
    facebook_pixel_id TEXT,
    -- Seeding control
    has_seeded BOOLEAN DEFAULT false,
    -- Assinatura
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
    subscription_plan TEXT DEFAULT 'pro',
    subscription_end TIMESTAMPTZ,
    subscription_interval TEXT DEFAULT 'monthly' CHECK (subscription_interval IN ('monthly', 'yearly')),
    pagarme_customer_id TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Ingredientes
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

-- 1.3 Produtos
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
    email TEXT,
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
    display_id SERIAL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
    total_value NUMERIC(10, 2) DEFAULT 0,
    total_cost NUMERIC(10, 2) DEFAULT 0,
    -- Entrega
    delivery_date DATE,
    delivery_time TEXT,
    delivery_method TEXT CHECK (delivery_method IS NULL OR delivery_method IN ('pickup', 'delivery')),
    delivery_fee NUMERIC(10, 2) DEFAULT 0,
    -- Pagamento
    payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN ('cash', 'pix', 'card', 'transfer')),
    -- Outros
    notes TEXT,
    google_event_id TEXT,
    start_date DATE,
    -- Timestamps de produção
    production_started_at TIMESTAMPTZ,
    production_completed_at TIMESTAMPTZ,
    production_duration_minutes INTEGER,
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
    unit_cost NUMERIC(10, 2) DEFAULT 0,
    subtotal NUMERIC(10, 2) NOT NULL
);

-- 1.8 Logs de Status de Pedidos
CREATE TABLE IF NOT EXISTS public.order_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.9 Movimentações de Estoque
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

-- 1.10 Templates de Mensagem
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'whatsapp' CHECK (type IN ('whatsapp', 'email', 'sms')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.11 Logs de Interação (CRM)
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

-- 1.12 Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.13 Histórico de Pagamentos
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

-- 1.14 Logs de Erro do Sistema
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
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

-- Policies
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
    CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);

    -- Ingredients
    DROP POLICY IF EXISTS "ingredients_all_own" ON public.ingredients;
    DROP POLICY IF EXISTS "ingredients_public_read" ON public.ingredients;
    CREATE POLICY "ingredients_all_own" ON public.ingredients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    -- Products
    DROP POLICY IF EXISTS "products_all_own" ON public.products;
    DROP POLICY IF EXISTS "products_public_read" ON public.products;
    CREATE POLICY "products_all_own" ON public.products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    
    -- Public visibility for products (Menu)
    DROP POLICY IF EXISTS "products_public_read_via_profile" ON public.products;
    CREATE POLICY "products_public_read_via_profile" ON public.products 
        FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = products.user_id 
                AND products.active = true
            )
        );

    -- Product Ingredients
    DROP POLICY IF EXISTS "product_ingredients_all_own" ON public.product_ingredients;
    DROP POLICY IF EXISTS "product_ingredients_public_read" ON public.product_ingredients;
    CREATE POLICY "product_ingredients_all_own" ON public.product_ingredients FOR ALL 
        USING (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_ingredients.product_id AND products.user_id = auth.uid()))
        WITH CHECK (EXISTS (SELECT 1 FROM public.products WHERE products.id = product_ingredients.product_id AND products.user_id = auth.uid()));

    -- Public visibility for recipe ingredients (needed for cost calculation in menu if shown, or just basic display)
    DROP POLICY IF EXISTS "product_ingredients_public_read_via_product" ON public.product_ingredients;
    CREATE POLICY "product_ingredients_public_read_via_product" ON public.product_ingredients 
        FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.products 
                WHERE products.id = product_ingredients.product_id 
                AND products.active = true
            )
        );

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

    -- Order Status Logs
    DROP POLICY IF EXISTS "order_status_logs_select_own" ON public.order_status_logs;
    DROP POLICY IF EXISTS "order_status_logs_insert_own" ON public.order_status_logs;
    CREATE POLICY "order_status_logs_select_own" ON public.order_status_logs FOR SELECT 
        USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_status_logs.order_id AND orders.user_id = auth.uid()));
    CREATE POLICY "order_status_logs_insert_own" ON public.order_status_logs FOR INSERT WITH CHECK (true);

    -- Stock Movements
    DROP POLICY IF EXISTS "stock_movements_all_own" ON public.stock_movements;
    CREATE POLICY "stock_movements_all_own" ON public.stock_movements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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

    -- Payment History
    DROP POLICY IF EXISTS "payment_history_select_own" ON public.payment_history;
    DROP POLICY IF EXISTS "payment_history_insert_system" ON public.payment_history;
    CREATE POLICY "payment_history_select_own" ON public.payment_history FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "payment_history_insert_system" ON public.payment_history FOR INSERT WITH CHECK (true);

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
    INSERT INTO public.system_errors (user_id, function_name, error_message)
    VALUES (NEW.id, 'handle_new_user', SQLERRM);
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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_created ON public.orders;
CREATE TRIGGER on_order_created AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_customer_stats_on_order();

DROP TRIGGER IF EXISTS on_order_updated_stats ON public.orders;
CREATE TRIGGER on_order_updated_stats AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_customer_stats_on_order();

-- 3.3 Log automático de mudança de status
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.order_status_logs (order_id, previous_status, new_status, user_id)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- 3.4 Dedução automática de estoque
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
                INSERT INTO public.stock_movements (user_id, ingredient_id, type, quantity, reason, order_id)
                VALUES (NEW.user_id, ing.ingredient_id, 'sale', qty_needed, 'Produção: Pedido #' || COALESCE(NEW.display_id::text, NEW.id::text), NEW.id);
                UPDATE public.ingredients SET stock_quantity = GREATEST(0, stock_quantity - qty_needed), updated_at = NOW() WHERE id = ing.ingredient_id;
            END LOOP;
        END LOOP;
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
EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.system_errors (user_id, function_name, error_message, severity) VALUES (NEW.user_id, 'handle_order_stock_deduction', SQLERRM, 'WARNING');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_stock_deduction ON public.orders;
CREATE TRIGGER on_order_stock_deduction AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_order_stock_deduction();

-- 3.5 Notificação de estoque baixo
CREATE OR REPLACE FUNCTION public.check_low_stock_and_notify()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_quantity < COALESCE(NEW.min_stock_threshold, 5) AND (OLD.stock_quantity >= COALESCE(NEW.min_stock_threshold, 5) OR OLD.stock_quantity IS NULL) THEN
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (NEW.user_id, '⚠️ Estoque Baixo', 'O ingrediente "' || NEW.name || '" está com estoque baixo (' || ROUND(NEW.stock_quantity::numeric, 2) || ' ' || NEW.unit || ').', 'warning');
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_ingredient_low_stock ON public.ingredients;
CREATE TRIGGER on_ingredient_low_stock AFTER UPDATE OF stock_quantity ON public.ingredients FOR EACH ROW EXECUTE FUNCTION public.check_low_stock_and_notify();

-- 3.6 Notificação de novo pedido
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS TRIGGER AS $$
DECLARE customer_name TEXT;
BEGIN
    SELECT name INTO customer_name FROM public.customers WHERE id = NEW.customer_id;
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.user_id, '🎉 Novo Pedido!', 'Pedido #' || COALESCE(NEW.display_id::text, LEFT(NEW.id::text, 8)) || CASE WHEN customer_name IS NOT NULL THEN ' de ' || customer_name ELSE '' END || ' - R$ ' || ROUND(NEW.total_value::numeric, 2), 'success');
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_order_notify ON public.orders;
CREATE TRIGGER on_new_order_notify AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.notify_new_order();

-- 3.7 Calcular duração de produção
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

-- ============================================================================
-- 4. ÍNDICES DE PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ingredients_user_id ON public.ingredients(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON public.orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_display_id ON public.orders(display_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_delivery_status ON public.orders(user_id, delivery_date, status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON public.order_items(order_id, product_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_ingredient ON public.product_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON public.stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ingredient_id ON public.stock_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_status_logs_order_id ON public.order_status_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_end ON public.profiles(subscription_end) WHERE subscription_status = 'active';

-- ============================================================================
-- 5. STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
    CREATE POLICY "product_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
    
    DROP POLICY IF EXISTS "product_images_authenticated_insert" ON storage.objects;
    CREATE POLICY "product_images_authenticated_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
    
    DROP POLICY IF EXISTS "product_images_authenticated_update" ON storage.objects;
    CREATE POLICY "product_images_authenticated_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');
    
    DROP POLICY IF EXISTS "product_images_authenticated_delete" ON storage.objects;
    CREATE POLICY "product_images_authenticated_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');

    DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
    CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
    
    DROP POLICY IF EXISTS "avatars_authenticated_insert" ON storage.objects;
    CREATE POLICY "avatars_authenticated_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Storage policies may already exist: %', SQLERRM;
END $$;

-- ============================================================================
-- 6. REALTIME
-- ============================================================================

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.orders; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ingredients; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 7. MIGRAÇÕES E CORREÇÕES
-- ============================================================================

-- 7.1 Limpar ingredientes duplicados (mantém o mais antigo por user_id + name)
DELETE FROM ingredients a
USING ingredients b
WHERE a.id > b.id 
  AND a.user_id = b.user_id 
  AND a.name = b.name;

-- 7.2 Adicionar constraint UNIQUE para prevenir duplicatas de ingredientes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ingredients_user_name_unique'
    ) THEN
        ALTER TABLE ingredients ADD CONSTRAINT ingredients_user_name_unique UNIQUE (user_id, name);
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 7.3 Adicionar coluna has_seeded ao profiles (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'has_seeded'
    ) THEN
        ALTER TABLE profiles ADD COLUMN has_seeded BOOLEAN DEFAULT false;
    END IF;
END $$;


-- ============================================================================
-- 8. AUTOMAÇÃO DE NEGÓCIO (TRIGGERS)
-- ============================================================================

-- 8.1 GARANTIR COLUNAS (MIGRAÇÃO)
-- Adiciona colunas necessárias se o banco já existir sem elas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='unit_cost') THEN
        ALTER TABLE public.order_items ADD COLUMN unit_cost NUMERIC(10, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='total_cost') THEN
        ALTER TABLE public.orders ADD COLUMN total_cost NUMERIC(10, 2) DEFAULT 0;
    END IF;
END $$;

-- 8.2 Função: Gerenciar estoque na mudança de status do pedido
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
        target_status := 'cancelled'; -- Forçamos estorno ao deletar se estava em produção
        prev_status := OLD.status;
    ELSE
        target_id := NEW.id;
        target_status := NEW.status;
        prev_status := OLD.status;
    END IF;

    -- GATILHO: BAIXA DE ESTOQUE
    -- Ocorre quando o pedido vai para 'preparing' (vindo de pending ou novo)
    IF (target_status = 'preparing' AND (prev_status = 'pending' OR prev_status IS NULL)) THEN
        FOR item IN SELECT * FROM public.order_items WHERE order_id = target_id LOOP
            FOR pi IN SELECT * FROM public.product_ingredients WHERE product_id = item.product_id LOOP
                UPDATE public.ingredients 
                SET stock_quantity = GREATEST(0, stock_quantity - (pi.quantity * item.quantity)),
                    updated_at = now()
                WHERE id = pi.ingredient_id;
            END LOOP;
        END LOOP;

    -- GATILHO: ESTORNO DE ESTOQUE
    -- Ocorre quando o pedido sai de produção e volta para pending ou é cancelado/excluído
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

-- 8.2 Função: Gerenciar estatísticas do cliente
CREATE OR REPLACE FUNCTION public.fn_handle_customer_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_customer_id UUID;
BEGIN
    target_customer_id := COALESCE(NEW.customer_id, OLD.customer_id);

    IF target_customer_id IS NOT NULL THEN
        UPDATE public.customers
        SET 
            total_orders = (SELECT count(*) FROM public.orders WHERE customer_id = target_customer_id AND status != 'cancelled'),
            total_spent = (SELECT COALESCE(sum(total_value), 0) FROM public.orders WHERE customer_id = target_customer_id AND status = 'delivered'),
            last_order_date = (SELECT max(created_at) FROM public.orders WHERE customer_id = target_customer_id),
            updated_at = now()
        WHERE id = target_customer_id;
    END IF;

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8.3 Função: Gerenciar estoque ao ADICIONAR item em pedido já em produção
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
            SET stock_quantity = GREATEST(0, stock_quantity - (pi.quantity * NEW.quantity)),
                updated_at = now()
            WHERE id = pi.ingredient_id;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8.4 Função: Estornar estoque ao EXCLUIR item de pedido em produção
CREATE OR REPLACE FUNCTION public.fn_handle_item_stock_delete()
RETURNS TRIGGER AS $$
DECLARE
    parent_status TEXT;
    pi RECORD;
BEGIN
    SELECT status INTO parent_status FROM public.orders WHERE id = OLD.order_id;
    
    IF (parent_status IN ('preparing', 'ready', 'delivered')) THEN
        FOR pi IN SELECT * FROM public.product_ingredients WHERE product_id = OLD.product_id LOOP
            UPDATE public.ingredients 
            SET stock_quantity = stock_quantity + (pi.quantity * OLD.quantity),
                updated_at = now()
            WHERE id = pi.ingredient_id;
        END LOOP;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GATILHOS NA TABELA ORDERS
DROP TRIGGER IF EXISTS tr_order_stock_automation ON public.orders;
CREATE TRIGGER tr_order_stock_automation
    AFTER INSERT OR UPDATE OF status OR DELETE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_handle_stock_on_status_change();

DROP TRIGGER IF EXISTS tr_order_customer_stats_automation ON public.orders;
CREATE TRIGGER tr_order_customer_stats_automation
    AFTER INSERT OR UPDATE OF status, total_value OR DELETE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_handle_customer_stats();

-- GATILHOS NA TABELA ORDER_ITEMS
DROP TRIGGER IF EXISTS tr_order_item_stock_insert ON public.order_items;
CREATE TRIGGER tr_order_item_stock_insert
    AFTER INSERT ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_handle_item_stock_direct();

DROP TRIGGER IF EXISTS tr_order_item_stock_delete ON public.order_items;
CREATE TRIGGER tr_order_item_stock_delete
    AFTER DELETE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_handle_item_stock_delete();


-- 8.5 Função: Capturar custo histórico do produto no momento da venda
CREATE OR REPLACE FUNCTION public.fn_capture_order_costs()
RETURNS TRIGGER AS $$
DECLARE
    current_cost NUMERIC(10, 2);
BEGIN
    -- Calcula o custo atual do produto baseado na soma dos custos de seus ingredientes
    SELECT COALESCE(SUM(pi.quantity * i.cost_per_unit), 0)
    INTO current_cost
    FROM public.product_ingredients pi
    JOIN public.ingredients i ON pi.ingredient_id = i.id
    WHERE pi.product_id = NEW.product_id;

    -- Salva o custo unitário no item do pedido
    NEW.unit_cost := current_cost;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8.6 Função: Atualizar o total_cost do pedido quando os itens mudam
CREATE OR REPLACE FUNCTION public.fn_sync_order_total_cost()
RETURNS TRIGGER AS $$
DECLARE
    oid UUID;
BEGIN
    oid := COALESCE(NEW.order_id, OLD.order_id);
    
    UPDATE public.orders
    SET total_cost = (
        SELECT COALESCE(SUM(unit_cost * quantity), 0)
        FROM public.order_items
        WHERE order_id = oid
    )
    WHERE id = oid;

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GATILHOS DE CUSTO HISTÓRICO
DROP TRIGGER IF EXISTS tr_order_item_capture_cost ON public.order_items;
CREATE TRIGGER tr_order_item_capture_cost
    BEFORE INSERT ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_capture_order_costs();

DROP TRIGGER IF EXISTS tr_order_item_sync_total_cost ON public.order_items;
CREATE TRIGGER tr_order_item_sync_total_cost
    AFTER INSERT OR UPDATE OF unit_cost, quantity OR DELETE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_sync_order_total_cost();

-- ============================================================================
-- 9. MIGRAÇÕES FINAIS (DADOS)
-- ============================================================================

-- 9.1 Migrar custos existentes (Snapshot dos custos atuais para pedidos antigos)
UPDATE public.order_items oi
SET unit_cost = (
    SELECT COALESCE(SUM(pi.quantity * i.cost_per_unit), 0)
    FROM public.product_ingredients pi
    JOIN public.ingredients i ON pi.ingredient_id = i.id
    WHERE pi.product_id = oi.product_id
)
WHERE unit_cost = 0 OR unit_cost IS NULL;

UPDATE public.orders o
SET total_cost = (
    SELECT COALESCE(SUM(unit_cost * quantity), 0)
    FROM public.order_items
    WHERE order_id = o.id
);

-- FIM DO SCHEMA CONSOLIDADO
-- ============================================================================
-- Executado com sucesso! Seu banco está pronto com Blindagem Financeira.
-- ============================================================================
