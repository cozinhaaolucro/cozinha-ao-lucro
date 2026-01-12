-- Execute este comando no SQL Editor do Supabase para corrigir o erro
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS start_date DATE;

-- Atualizar o cache do schema (às vezes necessário)
NOTIFY pgrst, 'reload config';
