-- ===========================================
-- SCRIPT DE CORREÇÃO PARA COZINHA AO LUCRO
-- Corrige problemas de criação de dados (RLS)
-- ===========================================

-- 1. GARANTIR QUE A TABELA PROFILES EXISTE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HABILITAR RLS MAS ADICIONAR POLICY PARA INSERT
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas de profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Criar policies mais permissivas para profiles
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. REFAZER A FUNÇÃO HANDLE_NEW_USER COM TRATAMENTO DE ERRO
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
  -- Log error but don't fail
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. GARANTIR QUE O TRIGGER EXISTE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. CRIAR PERFIS FALTANTES PARA USUÁRIOS EXISTENTES
INSERT INTO public.profiles (id, business_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', '')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 6. VERIFICAR E RECRIAR POLICIES PARA OUTRAS TABELAS

-- Ingredients
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own ingredients" ON public.ingredients;
CREATE POLICY "Users can manage own ingredients" ON public.ingredients 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Products  
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own products" ON public.products;
CREATE POLICY "Users can manage own products" ON public.products 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Product Ingredients
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own product ingredients" ON public.product_ingredients;
CREATE POLICY "Users can manage own product ingredients" ON public.product_ingredients 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.products WHERE products.id = product_ingredients.product_id AND products.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.products WHERE products.id = product_ingredients.product_id AND products.user_id = auth.uid())
  );

-- Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own customers" ON public.customers;
CREATE POLICY "Users can manage own customers" ON public.customers 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own orders" ON public.orders;
CREATE POLICY "Users can manage own orders" ON public.orders 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Order Items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own order items" ON public.order_items;
CREATE POLICY "Users can manage own order items" ON public.order_items 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- Message Templates
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own templates" ON public.message_templates;
CREATE POLICY "Users can manage own templates" ON public.message_templates 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Interaction Logs
ALTER TABLE public.interaction_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own logs" ON public.interaction_logs;
CREATE POLICY "Users can manage own logs" ON public.interaction_logs 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. VERIFICAÇÃO FINAL: Mostrar usuários sem perfil
SELECT 
  u.id,
  u.email,
  CASE WHEN p.id IS NULL THEN 'SEM PERFIL ❌' ELSE 'COM PERFIL ✓' END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- ===========================================
-- 8. CONFIGURAR STORAGE PARA AVATARES
-- ===========================================
-- NOTA: Este comando precisa ser executado manualmente no Dashboard
-- Supabase > Storage > Create new bucket

-- Criar bucket via SQL (pode não funcionar dependendo das permissões)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO NOTHING;

-- Se o bucket já existe, adicionar políticas:
-- Vá em Storage > avatars > Policies e adicione:
-- 1. Allow authenticated uploads: 
--    SELECT auth.role() = 'authenticated'
-- 2. Allow public reads:
--    SELECT true

-- OU execute as policies via SQL:
DO $$
BEGIN
  -- Tentar criar policies (pode falhar se bucket não existe)
  BEGIN
    DROP POLICY IF EXISTS "Avatar upload for authenticated" ON storage.objects;
    CREATE POLICY "Avatar upload for authenticated" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'avatars');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create upload policy: %', SQLERRM;
  END;

  BEGIN
    DROP POLICY IF EXISTS "Avatar update for own" ON storage.objects;
    CREATE POLICY "Avatar update for own" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'avatars')
      WITH CHECK (bucket_id = 'avatars');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create update policy: %', SQLERRM;
  END;

  BEGIN
    DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
    CREATE POLICY "Avatar public read" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'avatars');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create read policy: %', SQLERRM;
  END;
END $$;

-- FIM DO SCRIPT DE CORREÇÃO
