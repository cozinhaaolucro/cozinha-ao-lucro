-- ====================================================================
-- FORÇAR EXCLUSÃO EM CASCATA EM TODAS AS TABELAS (Marreta Biônica)
-- ====================================================================
-- Execute este script inteiro no SQL Editor para corrigir as relações.

BEGIN;

-- ====================================================================
-- FORÇAR EXCLUSÃO EM CASCATA EM TODAS AS TABELAS (Versão à Prova de Falhas)
-- ====================================================================

-- 1. Profiles
DO $$ BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 2. Subscriptions (Só roda se tabela existir)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
        ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
        ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 3. Usage Metrics (Só roda se tabela existir)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usage_metrics') THEN
        ALTER TABLE public.usage_metrics DROP CONSTRAINT IF EXISTS usage_metrics_user_id_fkey;
        ALTER TABLE public.usage_metrics ADD CONSTRAINT usage_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 4. Notificações
DO $$ BEGIN
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 5. System Errors
DO $$ BEGIN
    ALTER TABLE public.system_errors DROP CONSTRAINT IF EXISTS system_errors_user_id_fkey;
    ALTER TABLE public.system_errors ADD CONSTRAINT system_errors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 6. Order Status Logs
DO $$ BEGIN
    ALTER TABLE public.order_status_logs DROP CONSTRAINT IF EXISTS order_status_logs_user_id_fkey;
    ALTER TABLE public.order_status_logs ADD CONSTRAINT order_status_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;


-- 7. REFORÇO: Função de Limpeza do Storage (Caso não tenha funcionado antes)
CREATE OR REPLACE FUNCTION public.cleanup_user_storage_before_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM storage.objects WHERE owner = OLD.id;
    RETURN OLD;
EXCEPTION WHEN OTHERS THEN
    -- Se falhar (ex: permissão), ignora e deixa o banco tentar o cascade normal se houver
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_delete_storage ON auth.users;
CREATE TRIGGER on_auth_user_delete_storage
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_user_storage_before_delete();

COMMIT;

-- Se após rodar isso ainda der erro, tente deletar o usuário via SQL direto para ver a mensagem de erro específica:
-- DELETE FROM auth.users WHERE email = 'o-email-do-usuario@gmail.com';
