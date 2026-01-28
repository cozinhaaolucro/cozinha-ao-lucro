-- ============================================================================
-- MIGRATION: BATCH_IMPORT_PRODUCTS
-- Propósito: Importação em lote (Batch Upsert) para Produtos via Excel.
-- Suporta Criar (novo) ou Atualizar (existente) baseado no 'display_id' ou 'id'.
-- ============================================================================

-- Tipo auxiliar para entrada de dados (JSON)
-- O Supabase já serializa JSONB automaticamente, mas definimos o formato esperado nos comentários.
-- [
--   {
--     "id": "uuid" (opcional),
--     "display_id": 123 (opcional),
--     "name": "Produto X",
--     "description": "...",
--     "selling_price": 10.50,
--     "selling_unit": "unidade",
--     "ingredients": [ { "name": "Farinha", "quantity": 0.5 } ]
--   }
-- ]

CREATE OR REPLACE FUNCTION public.import_products_batch(products_data JSONB)
RETURNS JSONB AS $$
DECLARE
    product_item JSONB;
    v_product_id UUID;
    v_new_product_id UUID;
    v_upserted_count INT := 0;
    v_errors TEXT[] := ARRAY[]::TEXT[];
    v_user_id UUID := auth.uid();
    
    -- Vars de ingrediente
    ing_item JSONB;
    v_ingredient_id UUID;
    v_ing_name TEXT;
    v_ing_qty NUMERIC;
    
    v_existing_product RECORD;
BEGIN
    -- Validar autenticação
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Iterar sobre cada item do JSON
    FOR product_item IN SELECT * FROM jsonb_array_elements(products_data)
    LOOP
        BEGIN
            v_product_id := NULL;
            
            -- 1. Tentar encontrar produto existente (Sync Logic)
            -- Prioridade 1: UUID (id)
            IF (product_item->>'id') IS NOT NULL AND (product_item->>'id') != '' THEN
                 SELECT id INTO v_product_id FROM public.products 
                 WHERE id = (product_item->>'id')::UUID AND user_id = v_user_id;
            
            -- Prioridade 2: Display ID (display_id)
            ELSIF (product_item->>'display_id') IS NOT NULL AND (product_item->>'display_id') != '' THEN
                 SELECT id INTO v_product_id FROM public.products 
                 WHERE display_id = (product_item->>'display_id')::INT AND user_id = v_user_id;
            END IF;

            -- 2. UPSERT Produto
            IF v_product_id IS NOT NULL THEN
                -- UPDATE
                UPDATE public.products
                SET
                    name = COALESCE(product_item->>'name', name),
                    description = COALESCE(product_item->>'description', description),
                    selling_price = COALESCE((product_item->>'selling_price')::NUMERIC, selling_price),
                    updated_at = NOW()
                WHERE id = v_product_id
                RETURNING id INTO v_new_product_id;
            ELSE
                -- INSERT
                -- Checar limite de produtos (simplificado, ideal usar check_usage_limits antes)
                INSERT INTO public.products (
                    user_id, 
                    name, 
                    description, 
                    selling_price, 
                    selling_unit, 
                    active,
                    preparation_time_minutes
                ) VALUES (
                    v_user_id,
                    product_item->>'name',
                    COALESCE(product_item->>'description', ''),
                    COALESCE((product_item->>'selling_price')::NUMERIC, 0),
                    COALESCE(product_item->>'selling_unit', 'unidade'),
                    true,
                    30 -- Default prep time
                )
                RETURNING id INTO v_new_product_id;
            END IF;

            -- 3. Tratar Ingredientes (Se fornecidos)
            -- Nota: A lógica atual de String "Ovo (2un)" é complexa para SQL puro.
            -- O Frontend vai processar a string e enviar array limpo: [{name: 'Ovo', quantity: 2}]
            IF (product_item->'ingredients') IS NOT NULL AND jsonb_array_length(product_item->'ingredients') > 0 THEN
                -- Limpar ingredientes antigos (Full Replace Strategy)
                DELETE FROM public.product_ingredients WHERE product_id = v_new_product_id;

                FOR ing_item IN SELECT * FROM jsonb_array_elements(product_item->'ingredients')
                LOOP
                    v_ing_name := ing_item->>'name';
                    v_ing_qty := (ing_item->>'quantity')::NUMERIC;
                    
                    -- Buscar ID do ingrediente pelo nome (Case Insensitive)
                    SELECT id INTO v_ingredient_id FROM public.ingredients 
                    WHERE user_id = v_user_id AND name ILIKE v_ing_name LIMIT 1;

                    -- Se achou, vincula
                    IF v_ingredient_id IS NOT NULL THEN
                        INSERT INTO public.product_ingredients (product_id, ingredient_id, quantity)
                        VALUES (v_new_product_id, v_ingredient_id, v_ing_qty);
                    END IF;
                END LOOP;
            END IF;

            v_upserted_count := v_upserted_count + 1;

        EXCEPTION WHEN OTHERS THEN
            -- Captura erro individual mas não aborta o lote inteiro
            v_errors := array_append(v_errors, 'Erro no item ' || (product_item->>'name') || ': ' || SQLERRM);
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'count', v_upserted_count,
        'errors', v_errors
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
