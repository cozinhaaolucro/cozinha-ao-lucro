-- ============================================================================
-- COZINHA AO LUCRO - MIGRATION 005: REMOVE UNIT CONSTRAINTS
-- ============================================================================
-- Versão: 1.0.0
-- Descrição: Remove constraints restritivas de unidades para maior flexibilidade
-- Idempotente: Sim (seguro para rodar múltiplas vezes)
-- ============================================================================

-- Remove check constraints that may be too restrictive
-- This allows users to use any unit they need

DO $$
BEGIN
    -- Try to drop constraint from ingredients
    ALTER TABLE public.ingredients DROP CONSTRAINT IF EXISTS valid_unit_check;
    ALTER TABLE public.ingredients DROP CONSTRAINT IF EXISTS ingredients_unit_check;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop ingredient constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Try to drop constraint from products  
    ALTER TABLE public.products DROP CONSTRAINT IF EXISTS valid_selling_unit_check;
    ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_selling_unit_check;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop product constraint: %', SQLERRM;
END $$;

-- Normalize existing data to lowercase
UPDATE public.ingredients SET unit = LOWER(unit) WHERE unit IS NOT NULL;
UPDATE public.products SET selling_unit = LOWER(selling_unit) WHERE selling_unit IS NOT NULL;

-- Convert 'litro' to 'l' for consistency
UPDATE public.ingredients SET unit = 'l' WHERE unit = 'litro';

-- FIM DO SCRIPT 005
