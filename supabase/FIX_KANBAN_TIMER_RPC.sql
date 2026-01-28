-- ============================================================================
-- RPC: UPDATE KANBAN POSITIONS (FIXED TIMER)
-- Purpose: Efficiently update multiple order positions and statuses in a single transaction.
--          AND handle timestamp updates for Production Timer logic.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_kanban_positions(
    updates jsonb
)
RETURNS void AS $$
DECLARE
    item jsonb;
BEGIN
    -- Iterate through the JSON array of updates
    -- Expected format: [{ "id": "uuid", "status": "string", "position": 123 }, ...]
    
    FOR item IN SELECT * FROM jsonb_array_elements(updates)
    LOOP
        UPDATE public.orders
        SET 
            -- Update Timestamps based on Status Transitions
            production_started_at = CASE 
                WHEN (item->>'status') = 'preparing' AND status != 'preparing' THEN NOW() 
                ELSE production_started_at 
            END,
            production_completed_at = CASE 
                WHEN (item->>'status') = 'ready' AND status = 'preparing' THEN NOW() 
                -- Fix: If skipping 'ready' and going straight to 'delivered', mark production as done
                WHEN (item->>'status') = 'delivered' AND status = 'preparing' THEN NOW()
                ELSE production_completed_at 
            END,
            delivered_at = CASE 
                WHEN (item->>'status') = 'delivered' AND status != 'delivered' THEN NOW() 
                ELSE delivered_at 
            END,
            
            -- Update Status and Position
            status = (item->>'status'),
            position = (item->>'position')::int,
            updated_at = NOW()
        WHERE id = (item->>'id')::uuid
          AND user_id = auth.uid(); -- Security: Ensure user owns the order
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
