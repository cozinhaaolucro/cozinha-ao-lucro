-- ============================================================================
-- COZINHA AO LUCRO - MIGRATION 004: STORAGE BUCKETS
-- ============================================================================
-- Versão: 1.0.0
-- Descrição: Configuração de buckets de storage para imagens
-- Idempotente: Sim (seguro para rodar múltiplas vezes)
-- ============================================================================

-- ============================================================================
-- 1. CRIAR BUCKET DE IMAGENS DE PRODUTOS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. POLICIES DE STORAGE
-- ============================================================================

DO $$
BEGIN
    -- Leitura pública
    DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
    CREATE POLICY "product_images_public_read" ON storage.objects
        FOR SELECT USING (bucket_id = 'product-images');

    -- Upload para usuários autenticados
    DROP POLICY IF EXISTS "product_images_authenticated_insert" ON storage.objects;
    CREATE POLICY "product_images_authenticated_insert" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'product-images');

    -- Atualização para usuários autenticados
    DROP POLICY IF EXISTS "product_images_authenticated_update" ON storage.objects;
    CREATE POLICY "product_images_authenticated_update" ON storage.objects
        FOR UPDATE TO authenticated
        USING (bucket_id = 'product-images');

    -- Deleção para usuários autenticados
    DROP POLICY IF EXISTS "product_images_authenticated_delete" ON storage.objects;
    CREATE POLICY "product_images_authenticated_delete" ON storage.objects
        FOR DELETE TO authenticated
        USING (bucket_id = 'product-images');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Storage policies may already exist or bucket not configured: %', SQLERRM;
END $$;

-- ============================================================================
-- 3. CRIAR BUCKET DE AVATARES (OPCIONAL)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
    CREATE POLICY "avatars_public_read" ON storage.objects
        FOR SELECT USING (bucket_id = 'avatars');

    DROP POLICY IF EXISTS "avatars_authenticated_insert" ON storage.objects;
    CREATE POLICY "avatars_authenticated_insert" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'avatars');
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Avatar policies may already exist: %', SQLERRM;
END $$;

-- FIM DO SCRIPT 004
