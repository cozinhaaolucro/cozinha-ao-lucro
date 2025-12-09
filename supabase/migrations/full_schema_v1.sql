-- SCRIPT COMPLETO E DEFINITIVO - COZINHA AO LUCRO
-- Este script garante que toda a estrutura do banco de dados esteja correta.
-- Pode ser executado múltiplas vezes sem perder dados (Idempotente).

-- 1. CONFIGURAÇÃO INICIAL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS PRINCIPAIS

-- Profiles (Perfil do Usuário)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredients (Ingredientes)
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL, -- 'kg', 'litro', 'unidade', 'grama'
  cost_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  stock_quantity NUMERIC(10, 2) DEFAULT 0, -- Adicionado: Controle de Estoque
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (Produtos)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  selling_price NUMERIC(10, 2),
  selling_unit TEXT DEFAULT 'unidade', -- Adicionado: Unidade de Venda
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Ingredients (Receita do Produto)
CREATE TABLE IF NOT EXISTS public.product_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC(10, 3) NOT NULL,
  UNIQUE(product_id, ingredient_id)
);

-- Customers (Clientes)
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

-- Orders (Pedidos)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'preparing', 'ready', 'delivered', 'cancelled'
  total_value NUMERIC(10, 2) DEFAULT 0,
  delivery_date DATE,
  delivery_time TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items (Itens do Pedido)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL
);

-- Message Templates (CRM)
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interaction Logs (CRM)
CREATE TABLE IF NOT EXISTS public.interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'whatsapp', 'email', 'call'
  notes TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GARANTIA DE COLUNAS (ALTER TABLE para tabelas existentes)
-- Isso garante que quem já criou as tabelas receba as novas colunas
DO $$
BEGIN
    -- Ingredients
    BEGIN ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC(10, 2) DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END;
    
    -- Products
    BEGIN ALTER TABLE public.products ADD COLUMN IF NOT EXISTS selling_unit TEXT DEFAULT 'unidade'; EXCEPTION WHEN OTHERS THEN NULL; END;
    
    -- Customers
    BEGIN ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS total_spent NUMERIC(10, 2) DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMPTZ; EXCEPTION WHEN OTHERS THEN NULL; END;
    
    -- Orders
    BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_value NUMERIC(10, 2) DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_date DATE; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_time TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;

    -- Order Items
    BEGIN ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_name TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS quantity INTEGER; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2); EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 4. SEGURANÇA (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_logs ENABLE ROW LEVEL SECURITY;

-- Recriar Policies (Drop/Create para garantir atualização)
DO $$ 
BEGIN
    -- Profiles
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

    -- Ingredients
    DROP POLICY IF EXISTS "Users can manage own ingredients" ON public.ingredients;
    CREATE POLICY "Users can manage own ingredients" ON public.ingredients FOR ALL USING (auth.uid() = user_id);

    -- Products
    DROP POLICY IF EXISTS "Users can manage own products" ON public.products;
    CREATE POLICY "Users can manage own products" ON public.products FOR ALL USING (auth.uid() = user_id);

    -- Product Ingredients
    DROP POLICY IF EXISTS "Users can manage own product ingredients" ON public.product_ingredients;
    CREATE POLICY "Users can manage own product ingredients" ON public.product_ingredients FOR ALL USING (
        EXISTS (SELECT 1 FROM public.products WHERE products.id = product_ingredients.product_id AND products.user_id = auth.uid())
    );

    -- Customers
    DROP POLICY IF EXISTS "Users can manage own customers" ON public.customers;
    CREATE POLICY "Users can manage own customers" ON public.customers FOR ALL USING (auth.uid() = user_id);

    -- Orders
    DROP POLICY IF EXISTS "Users can manage own orders" ON public.orders;
    CREATE POLICY "Users can manage own orders" ON public.orders FOR ALL USING (auth.uid() = user_id);

    -- Order Items
    DROP POLICY IF EXISTS "Users can manage own order items" ON public.order_items;
    CREATE POLICY "Users can manage own order items" ON public.order_items FOR ALL USING (
        EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
    );

    -- Message Templates
    DROP POLICY IF EXISTS "Users can manage own templates" ON public.message_templates;
    CREATE POLICY "Users can manage own templates" ON public.message_templates FOR ALL USING (auth.uid() = user_id);

    -- Interaction Logs
    DROP POLICY IF EXISTS "Users can manage own logs" ON public.interaction_logs;
    CREATE POLICY "Users can manage own logs" ON public.interaction_logs FOR ALL USING (auth.uid() = user_id);
END $$;

-- 5. FUNÇÕES E TRIGGERS

-- Função: Criar Perfil ao Cadastrar Usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, business_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função: Atualizar Estatísticas do Cliente
CREATE OR REPLACE FUNCTION update_customer_stats_on_order()
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

DROP TRIGGER IF EXISTS on_order_created ON public.orders;
CREATE TRIGGER on_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats_on_order();

DROP TRIGGER IF EXISTS on_order_updated ON public.orders;
CREATE TRIGGER on_order_updated
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats_on_order();

-- 6. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_ingredients_user_id ON public.ingredients(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON public.orders(customer_id, status);

-- 7. COMENTÁRIOS
COMMENT ON COLUMN ingredients.stock_quantity IS 'Quantidade em estoque (na mesma unidade do ingrediente)';
COMMENT ON COLUMN products.selling_unit IS 'Unidade de venda: unidade, kg, pacote, dúzia, etc';

-- FIM DO SCRIPT
