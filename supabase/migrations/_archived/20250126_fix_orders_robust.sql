-- Script de Correção "Infalível" para Pedidos
-- Este script usa ALTER TABLE para garantir que as colunas existam, mesmo se a tabela já existir.

-- 1. Garantir colunas na tabela orders
DO $$
BEGIN
    -- Adicionar colunas se não existirem
    BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_value NUMERIC(10, 2) DEFAULT 0; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_date DATE; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_time TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 2. Garantir colunas na tabela order_items
DO $$
BEGIN
    BEGIN ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_name TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS quantity INTEGER; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2); EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 3. Forçar atualização do cache do schema do Supabase (opcional, mas bom)
NOTIFY pgrst, 'reload schema';

-- 4. Recriar Policies de Segurança (Garantia)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own orders" ON public.orders;
CREATE POLICY "Users can manage own orders" ON public.orders
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own order items" ON public.order_items;
CREATE POLICY "Users can manage own order items" ON public.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );
