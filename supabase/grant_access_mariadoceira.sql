-- ============================================================================
-- LIBERAR ACESSO: Maria Doceira
-- ============================================================================
-- Este script concede acesso PRO ao usuário mariadoceira@gmail.com
-- Atualiza tanto a tabela de perfis (legacy) quanto a tabela de assinaturas (novo SaaS)
-- ============================================================================

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 1. Buscar o ID do usuário pelo email
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'mariadoceira@gmail.com';

    -- Se não encontrar, avisa (em um cenário real de script SQL, logs são limitados, mas o RAISE ajuda)
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Usuário mariadoceira@gmail.com não encontrado na tabela auth.users.';
    ELSE
        -- 2. Atualizar tabela PROFILES (Legacy / Frontend Compatibility)
        UPDATE public.profiles
        SET 
            subscription_status = 'active',
            subscription_plan = 'pro',
            updated_at = NOW()
        WHERE id = v_user_id;

        -- 3. Atualizar tabela SUBSCRIPTIONS (Novo Sistema SaaS)
        -- Tenta atualizar se já existir, senão insere
        IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = v_user_id) THEN
            UPDATE public.subscriptions
            SET 
                plan_id = 'pro',
                status = 'active',
                current_period_start = NOW(),
                current_period_end = NOW() + INTERVAL '1 year', -- Dá 1 ano de acesso
                updated_at = NOW()
            WHERE user_id = v_user_id;
        ELSE
            INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
            VALUES (v_user_id, 'pro', 'active', NOW(), NOW() + INTERVAL '1 year');
        END IF;

        RAISE NOTICE 'Acesso liberado com sucesso para mariadoceira@gmail.com (ID: %)', v_user_id;
    END IF;
END $$;
