-- ============================================================================
-- MIGRATION: ADD_PRODUCT_DISPLAY_ID
-- Propósito: Adicionar ID sequencial (human-readable) para facilitar sincronização via Excel.
-- ============================================================================

-- 1. Adicionar colunas
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS display_id SERIAL;

-- 2. Criar índice para busca rápida por ID curto
CREATE INDEX IF NOT EXISTS idx_products_display_id ON public.products(display_id);
CREATE INDEX IF NOT EXISTS idx_products_user_display_id ON public.products(user_id, display_id);

-- 3. Backfill (Opcional, pois SERIAL já preenche, mas garantindo ordem)
-- O tipo SERIAL preenche automaticamente valores para linhas existentes.
-- Se quiséssemos reiniciar a contagem por usuário, seria mais complexo.
-- Assumimos ID Global simples para "001" visual.

-- 4. Comentário
COMMENT ON COLUMN public.products.display_id IS 'ID sequencial curto para exibição e referência em planilhas';
