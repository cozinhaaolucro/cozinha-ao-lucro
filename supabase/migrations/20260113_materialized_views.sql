-- ============================================================================
-- COZINHA AO LUCRO - MATERIALIZED VIEWS PARA PERFORMANCE
-- ============================================================================
-- Data: 2026-01-13
-- Descrição: Views materializadas para acelerar cálculos do Dashboard
-- ============================================================================

-- ============================================================================
-- 1. DAILY METRICS VIEW
-- ============================================================================
-- Agregar métricas diárias por usuário

DROP MATERIALIZED VIEW IF EXISTS mv_daily_metrics CASCADE;

CREATE MATERIALIZED VIEW mv_daily_metrics AS
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

-- Índice único para refresh concorrente
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_metrics_unique 
    ON mv_daily_metrics (user_id, date);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_mv_daily_metrics_user 
    ON mv_daily_metrics (user_id);
CREATE INDEX IF NOT EXISTS idx_mv_daily_metrics_date 
    ON mv_daily_metrics (date DESC);

-- ============================================================================
-- 2. MONTHLY METRICS VIEW
-- ============================================================================
-- Agregar métricas mensais para análise de tendências

DROP MATERIALIZED VIEW IF EXISTS mv_monthly_metrics CASCADE;

CREATE MATERIALIZED VIEW mv_monthly_metrics AS
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_monthly_metrics_unique 
    ON mv_monthly_metrics (user_id, month);

CREATE INDEX IF NOT EXISTS idx_mv_monthly_metrics_user 
    ON mv_monthly_metrics (user_id);

-- ============================================================================
-- 3. PRODUCT PERFORMANCE VIEW
-- ============================================================================
-- Análise de performance de produtos

DROP MATERIALIZED VIEW IF EXISTS mv_product_performance CASCADE;

CREATE MATERIALIZED VIEW mv_product_performance AS
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
    SUM(oi.subtotal - (oi.unit_cost * oi.quantity)) as total_profit,
    MIN(o.created_at) as first_sale,
    MAX(o.created_at) as last_sale
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
WHERE o.status NOT IN ('cancelled')
GROUP BY oi.product_id, p.name, p.user_id, p.selling_price;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_product_performance_unique 
    ON mv_product_performance (product_id);

CREATE INDEX IF NOT EXISTS idx_mv_product_performance_user 
    ON mv_product_performance (user_id);

-- ============================================================================
-- 4. CUSTOMER INSIGHTS VIEW
-- ============================================================================
-- Segmentação e análise de clientes

DROP MATERIALIZED VIEW IF EXISTS mv_customer_insights CASCADE;

CREATE MATERIALIZED VIEW mv_customer_insights AS
SELECT 
    c.id as customer_id,
    c.user_id,
    c.name as customer_name,
    COUNT(DISTINCT o.id) as orders_count,
    SUM(o.total_value) FILTER (WHERE o.status = 'delivered') as total_spent,
    AVG(o.total_value) FILTER (WHERE o.status = 'delivered') as avg_order_value,
    MAX(o.created_at) as last_order_date,
    MIN(o.created_at) as first_order_date,
    CASE 
        WHEN COUNT(o.id) = 0 THEN 'inactive'
        WHEN COUNT(o.id) = 1 THEN 'new'
        WHEN SUM(o.total_value) FILTER (WHERE o.status = 'delivered') > 500 THEN 'vip'
        WHEN MAX(o.created_at) < NOW() - INTERVAL '90 days' THEN 'inactive'
        ELSE 'regular'
    END as customer_segment,
    EXTRACT(days FROM NOW() - MAX(o.created_at)) as days_since_last_order
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status != 'cancelled'
GROUP BY c.id, c.user_id, c.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_customer_insights_unique 
    ON mv_customer_insights (customer_id);

CREATE INDEX IF NOT EXISTS idx_mv_customer_insights_user 
    ON mv_customer_insights (user_id);

CREATE INDEX IF NOT EXISTS idx_mv_customer_insights_segment 
    ON mv_customer_insights (user_id, customer_segment);

-- ============================================================================
-- 5. STOCK DEMAND ANALYSIS VIEW
-- ============================================================================
-- Análise de demanda de ingredientes para pedidos pendentes

DROP MATERIALIZED VIEW IF EXISTS mv_stock_demand CASCADE;

CREATE MATERIALIZED VIEW mv_stock_demand AS
SELECT 
    i.id as ingredient_id,
    i.user_id,
    i.name as ingredient_name,
    i.unit,
    i.stock_quantity,
    COALESCE(SUM(pi.quantity * oi.quantity) FILTER (WHERE o.status = 'pending'), 0) as pending_demand,
    COALESCE(SUM(pi.quantity * oi.quantity) FILTER (WHERE o.status IN ('preparing', 'ready')), 0) as in_production_demand,
    i.stock_quantity - COALESCE(SUM(pi.quantity * oi.quantity) FILTER (WHERE o.status IN ('pending', 'preparing', 'ready')), 0) as available_stock,
    CASE 
        WHEN i.stock_quantity <= 0 THEN 'out_of_stock'
        WHEN i.stock_quantity < 5 THEN 'low'
        WHEN i.stock_quantity - COALESCE(SUM(pi.quantity * oi.quantity) FILTER (WHERE o.status IN ('pending', 'preparing', 'ready')), 0) < 0 THEN 'insufficient'
        ELSE 'sufficient'
    END as stock_status
FROM ingredients i
LEFT JOIN product_ingredients pi ON pi.ingredient_id = i.id
LEFT JOIN order_items oi ON oi.product_id = pi.product_id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status IN ('pending', 'preparing', 'ready')
GROUP BY i.id, i.user_id, i.name, i.unit, i.stock_quantity;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_stock_demand_unique 
    ON mv_stock_demand (ingredient_id);

CREATE INDEX IF NOT EXISTS idx_mv_stock_demand_user 
    ON mv_stock_demand (user_id);

CREATE INDEX IF NOT EXISTS idx_mv_stock_demand_status 
    ON mv_stock_demand (user_id, stock_status);

-- ============================================================================
-- 6. FUNÇÃO PARA REFRESH DAS VIEWS
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_metrics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_customer_insights;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stock_demand;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. TRIGGER PARA REFRESH AUTOMÁTICO (APÓS MUDANÇAS EM ORDERS)
-- ============================================================================
-- Nota: Em produção, considere usar pg_cron ou Supabase scheduled functions
-- para refresh em intervalos ao invés de triggers (melhor performance)

CREATE OR REPLACE FUNCTION trigger_refresh_metrics_async()
RETURNS trigger AS $$
BEGIN
    -- Usar notify para processamento assíncrono 
    -- (requer worker/listener externo para processar)
    PERFORM pg_notify('refresh_metrics', '');
    RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger opcional (pode impactar performance em alta carga)
-- Recomendado: usar cron job ao invés de trigger
-- DROP TRIGGER IF EXISTS tr_refresh_metrics ON orders;
-- CREATE TRIGGER tr_refresh_metrics
--     AFTER INSERT OR UPDATE OR DELETE ON orders
--     FOR EACH STATEMENT
--     EXECUTE FUNCTION trigger_refresh_metrics_async();

-- ============================================================================
-- 8. RLS POLICIES PARA AS VIEWS
-- ============================================================================

-- As views herdam as políticas das tabelas base, mas precisamos garantir acesso

-- Função helper para verificar ownership
CREATE OR REPLACE FUNCTION is_owner(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN check_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. REFRESH INICIAL
-- ============================================================================

-- Executar refresh inicial para popular as views
SELECT refresh_materialized_views();

-- ============================================================================
-- FIM
-- ============================================================================
