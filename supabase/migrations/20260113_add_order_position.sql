-- Adiciona coluna de posição para ordenação personalizada
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Inicializa a posição baseada na data de criação (mais recentes primeiro ou ultimo? Kanban geralmente novos no topo ou fundo. Vamos manter ordem atual)
-- Na verdade, vamos inicializar sequencialmente por status.
DO $$
BEGIN
    WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY status ORDER BY created_at ASC) as rnk
        FROM public.orders
    )
    UPDATE public.orders
    SET position = ranked.rnk
    FROM ranked
    WHERE public.orders.id = ranked.id;
END $$;
