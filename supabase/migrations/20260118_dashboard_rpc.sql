-- Function to calculate dashboard metrics entirely in the database
-- This avoids fetching thousands of rows to the client
-- Usage: select * from get_dashboard_metrics('2024-01-01', '2024-02-01');

CREATE OR REPLACE FUNCTION get_dashboard_metrics(
    start_date timestamp with time zone,
    end_date timestamp with time zone
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_total_revenue numeric := 0;
    v_total_cost numeric := 0;
    v_total_orders integer := 0;
    v_avg_ticket numeric := 0;
    v_pending_count integer := 0;
    v_preparing_count integer := 0;
    v_ready_count integer := 0;
    v_delivered_count integer := 0;
    v_top_products json;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- basic counts and sums
    SELECT 
        COALESCE(SUM(total_value), 0),
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'pending'),
        COUNT(*) FILTER (WHERE status = 'preparing'),
        COUNT(*) FILTER (WHERE status = 'ready'),
        COUNT(*) FILTER (WHERE status = 'delivered'),
        -- Approximating total cost by summing subtotal of items (logic needs cost_per_unit in order_items if we want exact profit history)
        -- Assuming order_items has cost snapshot or we join products.
        -- If order_items doesn't store historical cost, we join products (which might have changed cost, but it's best effort)
        (
            SELECT COALESCE(SUM(oi.quantity * p.cost_per_unit), 0)
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id IN (
                SELECT id FROM orders 
                WHERE user_id = v_user_id 
                AND created_at >= start_date 
                AND created_at <= end_date
                AND status != 'cancelled'
            )
        )
    INTO 
        v_total_revenue,
        v_total_orders,
        v_pending_count,
        v_preparing_count,
        v_ready_count,
        v_delivered_count,
        v_total_cost
    FROM orders
    WHERE user_id = v_user_id
    AND created_at >= start_date
    AND created_at <= end_date
    AND status != 'cancelled';

    -- Avg Ticket
    IF v_total_orders > 0 THEN
        v_avg_ticket := v_total_revenue / v_total_orders;
    END IF;

    -- Top 5 Products
    WITH product_sales AS (
        SELECT 
            p.name,
            SUM(oi.quantity) as total_qty,
            SUM(oi.quantity * (p.selling_price - p.cost_per_unit)) as total_profit
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE o.user_id = v_user_id
        AND o.created_at >= start_date
        AND o.created_at <= end_date
        AND o.status != 'cancelled'
        GROUP BY p.name
        ORDER BY total_profit DESC
        LIMIT 5
    )
    SELECT json_agg(product_sales) INTO v_top_products FROM product_sales;

    RETURN json_build_object(
        'totalRevenue', v_total_revenue,
        'totalCost', v_total_cost,
        'totalProfit', v_total_revenue - v_total_cost,
        'margin', CASE WHEN v_total_revenue > 0 THEN ((v_total_revenue - v_total_cost) / v_total_revenue) * 100 ELSE 0 END,
        'totalOrders', v_total_orders,
        'avgTicket', v_avg_ticket,
        'ordersByStatus', json_build_object(
            'pending', v_pending_count,
            'preparing', v_preparing_count,
            'ready', v_ready_count,
            'delivered', v_delivered_count
        ),
        'topProducts', COALESCE(v_top_products, '[]'::json)
    );
END;
$$;
