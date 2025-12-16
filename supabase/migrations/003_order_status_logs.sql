-- ============================================================================
-- COZINHA AO LUCRO - MIGRATION 003: ORDER STATUS LOGS
-- ============================================================================
-- Versão: 1.0.0
-- Descrição: Sistema de logs para rastreamento de mudanças de status de pedidos
-- Idempotente: Sim (seguro para rodar múltiplas vezes)
-- ============================================================================

-- ============================================================================
-- 1. TABELA DE LOGS DE STATUS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.order_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.order_status_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "order_status_logs_select_own" ON public.order_status_logs;
    DROP POLICY IF EXISTS "order_status_logs_insert_own" ON public.order_status_logs;
    
    CREATE POLICY "order_status_logs_select_own" ON public.order_status_logs
        FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "order_status_logs_insert_own" ON public.order_status_logs
        FOR INSERT WITH CHECK (auth.uid() = user_id);
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_order_status_logs_order_id ON public.order_status_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_logs_created_at ON public.order_status_logs(created_at DESC);

-- ============================================================================
-- 2. DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE public.order_status_logs IS 'Histórico de mudanças de status dos pedidos';
COMMENT ON COLUMN public.order_status_logs.previous_status IS 'Status anterior (NULL se primeiro registro)';
COMMENT ON COLUMN public.order_status_logs.new_status IS 'Novo status aplicado';

-- FIM DO SCRIPT 003
