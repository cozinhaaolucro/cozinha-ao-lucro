-- MIGRATION: 20251210_system_refinements
-- OBJETIVO: Otimizações de sistema, logs de erro e automação de estoque.
-- PREMISSAS: Execução idempotente (pode rodar mais de uma vez sem falhar).

-- ==============================================================================
-- 1. SISTEMA DE LOGS DE ERRO ROBUSTO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.system_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Pode ser nulo se erro ocorrer antes do login
  function_name TEXT,
  error_message TEXT,
  error_details JSONB,
  severity TEXT DEFAULT 'ERROR', -- ERROR, WARNING, INFO
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para Logs (Apenas Admin/Dev deveria ver, mas aqui deixamos o usuário ver seus próprios erros para debug)
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can insert errors" ON public.system_errors;
  CREATE POLICY "Users can insert errors" ON public.system_errors FOR INSERT WITH CHECK (true); -- Permitir que qualquer um logue erros
  
  DROP POLICY IF EXISTS "Users can view own errors" ON public.system_errors;
  CREATE POLICY "Users can view own errors" ON public.system_errors FOR SELECT USING (auth.uid() = user_id);
END $$;

-- Atualizar handle_new_user para usar o log
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
  -- Log error table
  INSERT INTO public.system_errors (user_id, function_name, error_message, error_details)
  VALUES (NEW.id, 'handle_new_user', SQLERRM, jsonb_build_object('meta', NEW.raw_user_meta_data));
  -- Ainda retorna NEW para não bloquear o cadastro no Auth (os dados do profile podem ser corrigidos depois)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- 2. AUTOMAÇÃO DE BAIXA DE ESTOQUE
-- ==============================================================================
-- Função para atualizar estoque ao completar pedido
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    ing RECORD;
BEGIN
    -- Só executa se o status mudou para 'completed' (ou 'entregue') e o anterior não era
    -- Ajuste conforme seus status reais. Assumindo 'completed' como final.
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Loop pelos itens do pedido
        FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
            
            -- Para cada produto no item, buscar seus ingredientes e quantidade da ficha técnica
            FOR ing IN 
                SELECT ingredient_id, quantity 
                FROM public.product_ingredients 
                WHERE product_id = item.product_id 
            LOOP
                -- Atualizar estoque: Estoque Atual - (Qtd Ingrediente * Qtd Produto no Pedido)
                UPDATE public.ingredients
                SET stock_quantity = stock_quantity - (ing.quantity * item.quantity),
                    updated_at = NOW()
                WHERE id = ing.ingredient_id;
            END LOOP;
            
        END LOOP;
        
    END IF;

    -- Opcional: Se pedido for cancelado e já estava completed, devolver ao estoque?
    -- Por segurança/complexidade, não faremos estorno automático agora para evitar "atrito" de lógica errada.
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
   INSERT INTO public.system_errors (user_id, function_name, error_message, severity)
   VALUES (NEW.user_id, 'handle_order_status_change', SQLERRM, 'WARNING');
   RETURN NEW; -- Não impede a mudança de status
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para estoque
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_status_change();


-- ==============================================================================
-- 3. PADRONIZAÇÃO DE UNIDADES (SEM QUEBRAR DADOS ANTIGOS)
-- ==============================================================================
-- Primeiro: Normalizar dados existentes para lowercase para evitar duplicidade visual
UPDATE public.ingredients SET unit = LOWER(unit) WHERE unit IS NOT NULL;
UPDATE public.products SET selling_unit = LOWER(selling_unit) WHERE selling_unit IS NOT NULL;

-- Segundo: Higienizar dados que não estão na lista permitida (Fallback para 'unidade')
-- Isso garante que a constraint não falhe se houver algo como "litros" ou "kilos" (escrito errado)
UPDATE public.ingredients 
SET unit = 'unidade' 
WHERE unit NOT IN ('kg', 'g', 'mg', 'l', 'ml', 'unidade', 'un', 'cx', 'caixa', 'pct', 'pacote', 'fatia', 'lata', 'garrafa', 'dúzia', 'duzia', 'maço', 'colher', 'copo', 'xícara');

UPDATE public.products 
SET selling_unit = 'unidade' 
WHERE selling_unit NOT IN ('kg', 'g', 'mg', 'l', 'ml', 'unidade', 'un', 'cx', 'caixa', 'pct', 'pacote', 'fatia', 'lata', 'garrafa', 'dúzia', 'duzia', 'kit', 'combo', 'porção');

-- Terceiro: Adicionar Check Constraint com segurança
ALTER TABLE public.ingredients DROP CONSTRAINT IF EXISTS valid_unit_check;
ALTER TABLE public.ingredients 
    ADD CONSTRAINT valid_unit_check 
    CHECK (unit IN ('kg', 'g', 'mg', 'l', 'ml', 'unidade', 'un', 'cx', 'caixa', 'pct', 'pacote', 'fatia', 'lata', 'garrafa', 'dúzia', 'duzia', 'maço', 'colher', 'copo', 'xícara'));

-- Mesma coisa para products
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS valid_selling_unit_check;
ALTER TABLE public.products 
    ADD CONSTRAINT valid_selling_unit_check 
    CHECK (selling_unit IN ('kg', 'g', 'mg', 'l', 'ml', 'unidade', 'un', 'cx', 'caixa', 'pct', 'pacote', 'fatia', 'lata', 'garrafa', 'dúzia', 'duzia', 'kit', 'combo', 'porção'));


-- ==============================================================================
-- 4. OTIMIZAÇÃO DE PERFORMANCE (ÍNDICES)
-- ==============================================================================
-- Order Number (busca exata e ordenação)
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Busca textual se precisar (trgm é extension, talvez não tenhamos permissão de criar, então usaremos btree simples para starts_with)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Comentado para evitar erro de permissão em free tier
-- CREATE INDEX IF NOT EXISTS idx_products_name_search ON public.products USING gin(name gin_trgm_ops);

-- Índices compostos para queries frequentes de dashboard
CREATE INDEX IF NOT EXISTS idx_orders_user_status_date ON public.orders(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_user_spent ON public.customers(user_id, total_spent DESC);


-- ==============================================================================
-- 5. CORREÇÃO FINAL TRIGGER DE ESTATÍSTICAS (Reforço)
-- ==============================================================================
-- Garantir que a trigger de customer stats não falhe
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
EXCEPTION WHEN OTHERS THEN
  -- Apenas ignora erro de estatística para não travar o pedido principal
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
