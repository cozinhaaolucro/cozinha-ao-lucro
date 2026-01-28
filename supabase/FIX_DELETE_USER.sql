-- ==========================================================
-- CORREÇÃO DE ERRO AO DELETAR USUÁRIO (Abordagem V2 - Sem permissão de Admin)
-- ==========================================================

-- Se você recebeu "must be owner of table objects", use esta solução.
-- Em vez de mudar a regra do banco (que é protegida), criamos um "faxineiro"
-- que limpa a sujeira antes do usuário ser deletado.

-- 1. Função Faxineira (Roda com permissão total)
CREATE OR REPLACE FUNCTION public.cleanup_user_storage_before_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Deleta arquivos do storage
    DELETE FROM storage.objects WHERE owner = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar Trigger na tabela de usuários do sistema
DROP TRIGGER IF EXISTS on_auth_user_delete_storage ON auth.users;

CREATE TRIGGER on_auth_user_delete_storage
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.cleanup_user_storage_before_delete();

-- Agora, quando você tentar deletar um usuário:
-- 1. O trigger dispara ANTES.
-- 2. Ele apaga os arquivos do storage.objects.
-- 3. O usuário é deletado sem bloqueios.

