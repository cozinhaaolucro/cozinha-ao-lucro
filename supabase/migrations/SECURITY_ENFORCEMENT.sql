-- ============================================================================
-- MIGRATION: SECURITY_ENFORCEMENT
-- Propósito: Bloquear operações de escrita (INSERT/UPDATE) para usuários
-- com período de teste expirado e sem assinatura ativa.
-- ============================================================================

-- 1. Função de Verificação de Permissão de Escrita
CREATE OR REPLACE FUNCTION public.check_subscription_active()
RETURNS TRIGGER AS $$
DECLARE
    v_created_at TIMESTAMPTZ;
    v_has_active_sub BOOLEAN;
    v_is_trial_active BOOLEAN;
    v_bypass_tables TEXT[] := ARRAY['interaction_logs', 'system_errors', 'notifications']; -- Tabelas que nunca bloqueiam
BEGIN
    -- Se a tabela estiver na whitelist, permite
    IF TG_TABLE_NAME = ANY(v_bypass_tables) THEN
        RETURN NEW;
    END IF;

    -- Obter data de criação do usuário (usando profiles como proxy seguro)
    SELECT created_at INTO v_created_at
    FROM public.profiles
    WHERE id = auth.uid();

    -- Se não achou perfil, algo está errado (ou é superuser), mas por segurança vamos deixar passar se for auth.uid()
    IF v_created_at IS NULL THEN
        -- Talvez seeding ou admin
        RETURN NEW; 
    END IF;

    -- Verificar se possui assinatura ativa que NÃO seja Free (assumindo que Free = Trial expirado logic)
    -- Baseado no DashboardLayout.tsx: isBlocked = isTrialExpired && !hasActiveSubscription
    -- E handle_new_user cria plan='free', status='active'.
    -- Assumiremos 'active' + 'pro'/'premium' como pago real.
    
    SELECT EXISTS (
        SELECT 1 
        FROM public.subscriptions 
        WHERE user_id = auth.uid() 
        AND status IN ('active', 'trialing')
        AND plan_id IN ('pro', 'premium') -- Apenas planos pagos evitam o bloqueio após trial
    ) INTO v_has_active_sub;

    -- Verificar Trial (7 dias)
    v_is_trial_active := (v_created_at + INTERVAL '7 days') > NOW();

    -- Lógica de Bloqueio
    IF (NOT v_is_trial_active) AND (NOT v_has_active_sub) THEN
        RAISE EXCEPTION 'Acesso Bloqueado: Seu período de teste expirou e nenhuma assinatura ativa foi encontrada.'
            USING ERRCODE = 'P0001'; -- Código de erro customizado para o Frontend capturar se quiser
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Aplicar Triggers nas Tabelas Críticas (Core Business)
-- Evitamos aplicar em 'profiles' para permitir updates de conta/pagamento
-- Evitamos 'subscriptions' para permitir webhooks de pagamento atualizarem o status

DROP TRIGGER IF EXISTS tr_enforce_sub_orders ON public.orders;
CREATE TRIGGER tr_enforce_sub_orders
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.check_subscription_active();

DROP TRIGGER IF EXISTS tr_enforce_sub_products ON public.products;
CREATE TRIGGER tr_enforce_sub_products
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.check_subscription_active();

DROP TRIGGER IF EXISTS tr_enforce_sub_customers ON public.customers;
CREATE TRIGGER tr_enforce_sub_customers
    BEFORE INSERT OR UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.check_subscription_active();

DROP TRIGGER IF EXISTS tr_enforce_sub_ingredients ON public.ingredients;
CREATE TRIGGER tr_enforce_sub_ingredients
    BEFORE INSERT OR UPDATE ON public.ingredients
    FOR EACH ROW EXECUTE FUNCTION public.check_subscription_active();

