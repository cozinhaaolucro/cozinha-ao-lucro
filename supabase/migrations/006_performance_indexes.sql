-- ============================================================================
-- COZINHA AO LUCRO - MIGRATION 006: PERFORMANCE INDEXES
-- ============================================================================
-- Versão: 1.0.0
-- Descrição: Índices adicionais para otimização de consultas em tempo real
-- Idempotente: Sim (seguro para rodar múltiplas vezes)
-- ============================================================================

-- Índice composto para consultas de pedidos por usuário e data de entrega
CREATE INDEX IF NOT EXISTS idx_orders_user_delivery_status 
  ON public.orders(user_id, delivery_date, status);

-- Índice para acelerar joins de order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_product 
  ON public.order_items(order_id, product_id);

-- Índice para busca de produtos por ingrediente (ficha técnica)
CREATE INDEX IF NOT EXISTS idx_product_ingredients_ingredient 
  ON public.product_ingredients(ingredient_id);

-- Índice para consultas de estoque baixo
CREATE INDEX IF NOT EXISTS idx_ingredients_stock_low 
  ON public.ingredients(user_id, stock_quantity) 
  WHERE stock_quantity < 10;

-- Índice para busca de clientes recentes
CREATE INDEX IF NOT EXISTS idx_customers_last_order 
  ON public.customers(user_id, last_order_date DESC);

-- ============================================================================
-- ENABLE REALTIME FOR CRITICAL TABLES (Idempotent)
-- ============================================================================
-- Skip if tables are already in the publication

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
END;
$$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ingredients;
EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
END;
$$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
END;
$$;

-- ============================================================================
-- DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON INDEX idx_orders_user_delivery_status IS 'Otimiza queries de pedidos por usuário e data';
COMMENT ON INDEX idx_order_items_order_product IS 'Acelera joins de itens de pedido';

-- FIM DO SCRIPT 006
