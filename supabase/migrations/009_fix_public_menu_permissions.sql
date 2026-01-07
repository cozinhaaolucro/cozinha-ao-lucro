-- ============================================================================
-- COZINHA AO LUCRO - MIGRATION 009: FIX PUBLIC MENU PERMISSIONS
-- ============================================================================
-- Versão: 1.0.0
-- Descrição: Ajusta permissões RLS para permitir leitura pública de ingredientes e itens de ficha técnica
--            necessários para o detalhamento no Cardápio Digital.
-- ============================================================================

-- 1. Ingredientes
-- Permitir leitura pública para que o cardápio possa exibir a composição dos pratos
-- Nota: Isso expõe o custo unitário se a API for consultada diretamente, mas é aceitável para o MVP.
-- Futuramente, recomenda-se criar uma View segura (public_ingredients_view) sem custos.
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "ingredients_public_read" ON public.ingredients;
    CREATE POLICY "ingredients_public_read" ON public.ingredients FOR SELECT USING (true);
END $$;

-- 2. Itens da Ficha Técnica (Relacionamento Produto-Ingrediente)
-- Permitir leitura pública para conectar produtos aos seus ingredientes
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "product_ingredients_public_read" ON public.product_ingredients;
    CREATE POLICY "product_ingredients_public_read" ON public.product_ingredients FOR SELECT USING (true);
END $$;

-- 3. Garantir Políticas de Produtos
-- Reforçar a política de leitura pública de produtos ativos
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "products_public_read" ON public.products;
    CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (active = true);
END $$;
