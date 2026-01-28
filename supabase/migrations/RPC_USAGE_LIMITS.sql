-- ============================================================================
-- MIGRATION: RPC_USAGE_LIMITS
-- Propósito: Calcular uso de recursos no servidor para evitar downloads desnecessários
-- e lógica de contagem no frontend.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_resource_usage(
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    products_count BIGINT,
    customers_count BIGINT,
    orders_month_count BIGINT
) AS $$
DECLARE
    v_start_of_month TIMESTAMPTZ;
BEGIN
    -- Definir início do mês atual para contagem de pedidos
    v_start_of_month := DATE_TRUNC('month', NOW());

    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.products WHERE user_id = p_user_id) as products_count,
        (SELECT COUNT(*) FROM public.customers WHERE user_id = p_user_id) as customers_count,
        (SELECT COUNT(*) FROM public.orders WHERE user_id = p_user_id AND created_at >= v_start_of_month) as orders_month_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_resource_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_resource_usage(UUID) TO service_role;
