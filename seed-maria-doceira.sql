-- ============================================================================
-- SEED DATA: MARIA DOCEIRA - Conta Demo para Screenshots
-- ============================================================================
-- Execute este script no Supabase SQL Editor após criar a conta manualmente
-- Email sugerido: maria.doceira.demo@cozinhaaolucro.com
-- Senha sugerida: Demo@2026!
-- ============================================================================

-- ⚠️ IMPORTANTE: Primeiro crie a conta via interface do app, depois pegue o user_id
-- e substitua 'SEU_USER_ID_AQUI' pelo ID real da conta criada.

-- Para encontrar o user_id, execute: SELECT id FROM auth.users WHERE email = 'maria.doceira.demo@cozinhaaolucro.com';

DO $$
DECLARE
    v_user_id UUID := 'ca322b78-19ba-4fdb-af21-e70b71bf1dbe'; -- ⬅️ SUBSTITUA PELO ID REAL
    
    -- IDs dos ingredientes
    v_leite_cond UUID;
    v_creme_leite UUID;
    v_chocolate_po UUID;
    v_farinha UUID;
    v_acucar UUID;
    v_manteiga UUID;
    v_ovos UUID;
    v_leite UUID;
    v_chocolate_barra UUID;
    v_granulado UUID;
    v_chantilly UUID;
    v_nutella UUID;
    v_forminha UUID;
    v_pote UUID;
    v_copo_bolha UUID;
    
    -- IDs dos produtos
    v_brigadeiro UUID;
    v_bolo_pote UUID;
    v_brownie UUID;
    v_trufa UUID;
    v_copo_felicidade UUID;
    
    -- IDs dos clientes
    v_cliente_ana UUID;
    v_cliente_pedro UUID;
    v_cliente_carla UUID;
    v_cliente_julia UUID;
    v_cliente_marcos UUID;
    v_cliente_fernanda UUID;
    v_cliente_ricardo UUID;
    v_cliente_empresa UUID;
    
BEGIN
    -- ========================================================================
    -- 0. LIMPEZA DE DADOS EXISTENTES (Evita erros de duplicidade)
    -- ========================================================================
    DELETE FROM order_status_logs WHERE order_id IN (SELECT id FROM orders WHERE user_id = v_user_id);
    DELETE FROM stock_movements WHERE user_id = v_user_id;
    DELETE FROM product_ingredients WHERE product_id IN (SELECT id FROM products WHERE user_id = v_user_id);
    DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = v_user_id);
    DELETE FROM orders WHERE user_id = v_user_id;
    DELETE FROM products WHERE user_id = v_user_id;
    DELETE FROM ingredients WHERE user_id = v_user_id;
    DELETE FROM customers WHERE user_id = v_user_id;

    -- ========================================================================
    -- 1. ATUALIZAR PERFIL
    -- ========================================================================
    UPDATE profiles SET
        business_name = 'Doces da Maria',
        phone = '(11) 99999-1234',
        description = 'Doces artesanais feitos com amor e ingredientes de qualidade',
        subscription_status = 'active',
        subscription_plan = 'pro',
        has_seeded = true
    WHERE id = v_user_id;

    -- ========================================================================
    -- 2. INGREDIENTES (com estoque realista)
    -- ========================================================================
    
    INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, stock_quantity)
    VALUES
        (gen_random_uuid(), v_user_id, 'Leite Condensado', 'kg', 16.50, 5.5) RETURNING id INTO v_leite_cond;
    
    INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, stock_quantity)
    VALUES (gen_random_uuid(), v_user_id, 'Creme de Leite', 'kg', 17.50, 3.2) RETURNING id INTO v_creme_leite;
    
    INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, stock_quantity)
    VALUES (gen_random_uuid(), v_user_id, 'Chocolate em Pó 50%', 'kg', 75.00, 1.8) RETURNING id INTO v_chocolate_po;
    
    INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, stock_quantity)
    VALUES (gen_random_uuid(), v_user_id, 'Farinha de Trigo', 'kg', 5.00, 8.0) RETURNING id INTO v_farinha;
    
    INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, stock_quantity)
    VALUES (gen_random_uuid(), v_user_id, 'Açúcar Refinado', 'kg', 4.50, 6.5) RETURNING id INTO v_acucar;
    
    INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, stock_quantity)
    VALUES (gen_random_uuid(), v_user_id, 'Manteiga', 'kg', 50.00, 1.2) RETURNING id INTO v_manteiga;
    
    INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, stock_quantity)
    VALUES (gen_random_uuid(), v_user_id, 'Ovos', 'unidade', 1.00, 48) RETURNING id INTO v_ovos;
    
    INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, stock_quantity)
    VALUES (gen_random_uuid(), v_user_id, 'Leite Integral', 'l', 5.00, 6.0) RETURNING id INTO v_leite;
    
    INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, stock_quantity)
    VALUES (gen_random_uuid(), v_user_id, 'Chocolate Nobre Barra', 'kg', 60.00, 2.5) RETURNING id INTO v_chocolate_barra;
    
    INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, stock_quantity)
    VALUES (gen_random_uuid(), v_user_id, 'Granulado', 'kg', 36.00, 0.8) RETURNING id INTO v_granulado;
    
    INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, stock_quantity)
    VALUES (gen_random_uuid(), v_user_id, 'Chantilly', 'l', 16.00, 2.0) RETURNING id INTO v_chantilly;
    
    INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, stock_quantity)
    VALUES (gen_random_uuid(), v_user_id, 'Nutella', 'kg', 71.40, 0.35) RETURNING id INTO v_nutella;
    
    INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, stock_quantity)
    VALUES (gen_random_uuid(), v_user_id, 'Forminha Trufa', 'unidade', 0.10, 500) RETURNING id INTO v_forminha;
    
    INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, stock_quantity)
    VALUES (gen_random_uuid(), v_user_id, 'Pote 250ml', 'unidade', 0.80, 120) RETURNING id INTO v_pote;
    
    INSERT INTO ingredients (id, user_id, name, unit, cost_per_unit, stock_quantity)
    VALUES (gen_random_uuid(), v_user_id, 'Copo Bolha', 'unidade', 1.20, 80) RETURNING id INTO v_copo_bolha;

    -- ========================================================================
    -- 3. PRODUTOS
    -- ========================================================================
    
    INSERT INTO products (id, user_id, name, description, selling_price, selling_unit, preparation_time_minutes, active, image_url, category)
    VALUES (gen_random_uuid(), v_user_id, 'Brigadeiro Gourmet (50un)', 'Brigadeiro tradicional enrolado à mão com granulado belga', 120.00, 'unidade', 60, true, 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80', 'Doces')
    RETURNING id INTO v_brigadeiro;
    
    INSERT INTO products (id, user_id, name, description, selling_price, selling_unit, preparation_time_minutes, active, image_url, category)
    VALUES (gen_random_uuid(), v_user_id, 'Bolo de Pote Ninho c/ Nutella', 'Camadas de bolo fofinho, creme de leite ninho e Nutella', 15.00, 'unidade', 15, true, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80', 'Doces')
    RETURNING id INTO v_bolo_pote;
    
    INSERT INTO products (id, user_id, name, description, selling_price, selling_unit, preparation_time_minutes, active, image_url, category)
    VALUES (gen_random_uuid(), v_user_id, 'Brownie Recheado', 'Brownie úmido com recheio cremoso de doce de leite', 10.00, 'unidade', 10, true, 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&q=80', 'Doces')
    RETURNING id INTO v_brownie;
    
    INSERT INTO products (id, user_id, name, description, selling_price, selling_unit, preparation_time_minutes, active, image_url, category)
    VALUES (gen_random_uuid(), v_user_id, 'Trufa Artesanal (30un)', 'Trufas de chocolate belga com recheio cremoso', 105.00, 'unidade', 90, true, 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=800&q=80', 'Doces')
    RETURNING id INTO v_trufa;
    
    INSERT INTO products (id, user_id, name, description, selling_price, selling_unit, preparation_time_minutes, active, image_url, category)
    VALUES (gen_random_uuid(), v_user_id, 'Copo da Felicidade', 'Camadas de brownie, mousse de chocolate e chantilly', 22.00, 'unidade', 20, true, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80', 'Doces')
    RETURNING id INTO v_copo_felicidade;

    -- ========================================================================
    -- 4. FICHA TÉCNICA (Product Ingredients)
    -- ========================================================================
    
    -- Brigadeiro
    INSERT INTO product_ingredients (product_id, ingredient_id, quantity) VALUES
        (v_brigadeiro, v_leite_cond, 0.395),
        (v_brigadeiro, v_creme_leite, 0.200),
        (v_brigadeiro, v_chocolate_po, 0.050),
        (v_brigadeiro, v_manteiga, 0.020),
        (v_brigadeiro, v_granulado, 0.150),
        (v_brigadeiro, v_forminha, 50);
    
    -- Bolo de Pote
    INSERT INTO product_ingredients (product_id, ingredient_id, quantity) VALUES
        (v_bolo_pote, v_farinha, 0.050),
        (v_bolo_pote, v_ovos, 1),
        (v_bolo_pote, v_acucar, 0.050),
        (v_bolo_pote, v_leite_cond, 0.050),
        (v_bolo_pote, v_creme_leite, 0.050),
        (v_bolo_pote, v_nutella, 0.030),
        (v_bolo_pote, v_pote, 1);
    
    -- Brownie
    INSERT INTO product_ingredients (product_id, ingredient_id, quantity) VALUES
        (v_brownie, v_chocolate_barra, 0.050),
        (v_brownie, v_manteiga, 0.010),
        (v_brownie, v_acucar, 0.050),
        (v_brownie, v_ovos, 1),
        (v_brownie, v_farinha, 0.030);
    
    -- Trufa
    INSERT INTO product_ingredients (product_id, ingredient_id, quantity) VALUES
        (v_trufa, v_chocolate_barra, 0.500),
        (v_trufa, v_creme_leite, 0.200),
        (v_trufa, v_forminha, 30);
    
    -- Copo da Felicidade
    INSERT INTO product_ingredients (product_id, ingredient_id, quantity) VALUES
        (v_copo_felicidade, v_chocolate_barra, 0.050),
        (v_copo_felicidade, v_creme_leite, 0.100),
        (v_copo_felicidade, v_leite_cond, 0.050),
        (v_copo_felicidade, v_chantilly, 0.050),
        (v_copo_felicidade, v_copo_bolha, 1);

    -- ========================================================================
    -- 5. CLIENTES
    -- ========================================================================
    
    INSERT INTO customers (id, user_id, name, phone, email, address, notes, total_orders, total_spent)
    VALUES (gen_random_uuid(), v_user_id, 'Ana Silva', '(11) 98765-4321', 'ana.silva@email.com', 'Rua das Flores, 123 - Jardins', 'Cliente VIP - Encomendas de casamento', 12, 2450.00)
    RETURNING id INTO v_cliente_ana;
    
    INSERT INTO customers (id, user_id, name, phone, email, address, notes, total_orders, total_spent)
    VALUES (gen_random_uuid(), v_user_id, 'Pedro Costa', '(11) 91234-5678', 'pedro.costa@email.com', 'Av. Paulista, 1000 - Bela Vista', 'Empresa - Pedidos corporativos', 8, 1680.00)
    RETURNING id INTO v_cliente_pedro;
    
    INSERT INTO customers (id, user_id, name, phone, email, address, notes, total_orders, total_spent)
    VALUES (gen_random_uuid(), v_user_id, 'Carla Mendes', '(11) 99876-5432', 'carla.m@email.com', 'Rua Augusta, 500 - Consolação', 'Prefere entregas à tarde', 6, 890.00)
    RETURNING id INTO v_cliente_carla;
    
    INSERT INTO customers (id, user_id, name, phone, email, address, notes, total_orders, total_spent)
    VALUES (gen_random_uuid(), v_user_id, 'Julia Santos', '(11) 94567-8901', 'julia.santos@email.com', 'Rua Oscar Freire, 200 - Pinheiros', 'Festas infantis', 5, 1250.00)
    RETURNING id INTO v_cliente_julia;
    
    INSERT INTO customers (id, user_id, name, phone, email, address, notes, total_orders, total_spent)
    VALUES (gen_random_uuid(), v_user_id, 'Marcos Lima', '(11) 93456-7890', 'marcos.lima@email.com', 'Rua Haddock Lobo, 300', NULL, 4, 520.00)
    RETURNING id INTO v_cliente_marcos;
    
    INSERT INTO customers (id, user_id, name, phone, email, address, notes, total_orders, total_spent)
    VALUES (gen_random_uuid(), v_user_id, 'Fernanda Oliveira', '(11) 92345-6789', 'fernanda.o@email.com', 'Al. Santos, 800 - Cerqueira César', 'Aniversários mensais', 7, 1120.00)
    RETURNING id INTO v_cliente_fernanda;
    
    INSERT INTO customers (id, user_id, name, phone, email, address, notes, total_orders, total_spent)
    VALUES (gen_random_uuid(), v_user_id, 'Ricardo Almeida', '(11) 91111-2222', 'ricardo.a@email.com', 'Rua Bela Cintra, 450', NULL, 3, 380.00)
    RETURNING id INTO v_cliente_ricardo;
    
    INSERT INTO customers (id, user_id, name, phone, email, address, notes, total_orders, total_spent)
    VALUES (gen_random_uuid(), v_user_id, 'Empresa TechCorp LTDA', '(11) 3333-4444', 'eventos@techcorp.com', 'Av. Faria Lima, 2000 - Itaim Bibi', 'Coffee breaks e eventos corporativos', 10, 4200.00)
    RETURNING id INTO v_cliente_empresa;

    -- ========================================================================
    -- 6. PEDIDOS (últimos 6 meses para gráfico bonito)
    -- ========================================================================
    
    -- Janeiro 2026 (R$ 8.000)
    INSERT INTO orders (user_id, customer_id, display_id, status, total_value, total_cost, delivery_date, delivery_method, payment_method, created_at)
    VALUES 
        (v_user_id, v_cliente_ana, 1, 'delivered', 450.00, 135.00, '2026-01-05', 'delivery', 'pix', '2026-01-03 10:00:00'),
        (v_user_id, v_cliente_pedro, 2, 'delivered', 680.00, 204.00, '2026-01-10', 'pickup', 'credit_card', '2026-01-08 14:00:00'),
        (v_user_id, v_cliente_empresa, 3, 'delivered', 1200.00, 360.00, '2026-01-15', 'delivery', 'transfer', '2026-01-12 09:00:00'),
        (v_user_id, v_cliente_julia, 4, 'delivered', 380.00, 114.00, '2026-01-18', 'pickup', 'pix', '2026-01-16 11:00:00'),
        (v_user_id, v_cliente_carla, 5, 'delivered', 250.00, 75.00, '2026-01-22', 'delivery', 'cash', '2026-01-20 15:00:00'),
        (v_user_id, v_cliente_fernanda, 6, 'delivered', 520.00, 156.00, '2026-01-25', 'pickup', 'pix', '2026-01-23 10:00:00'),
        (v_user_id, v_cliente_marcos, 7, 'delivered', 180.00, 54.00, '2026-01-28', 'pickup', 'debit_card', '2026-01-26 16:00:00'),
        (v_user_id, v_cliente_ana, 8, 'delivered', 890.00, 267.00, '2026-01-30', 'delivery', 'pix', '2026-01-28 09:00:00');
    
    -- Fevereiro 2026 (R$ 9.200)
    INSERT INTO orders (user_id, customer_id, display_id, status, total_value, total_cost, delivery_date, delivery_method, payment_method, created_at)
    VALUES 
        (v_user_id, v_cliente_empresa, 9, 'delivered', 1500.00, 450.00, '2026-02-05', 'delivery', 'transfer', '2026-02-03 10:00:00'),
        (v_user_id, v_cliente_pedro, 10, 'delivered', 750.00, 225.00, '2026-02-10', 'pickup', 'credit_card', '2026-02-08 14:00:00'),
        (v_user_id, v_cliente_julia, 11, 'delivered', 420.00, 126.00, '2026-02-14', 'delivery', 'pix', '2026-02-12 11:00:00'),
        (v_user_id, v_cliente_ana, 12, 'delivered', 1100.00, 330.00, '2026-02-18', 'delivery', 'pix', '2026-02-16 09:00:00'),
        (v_user_id, v_cliente_fernanda, 13, 'delivered', 380.00, 114.00, '2026-02-22', 'pickup', 'cash', '2026-02-20 15:00:00'),
        (v_user_id, v_cliente_carla, 14, 'delivered', 290.00, 87.00, '2026-02-25', 'delivery', 'pix', '2026-02-23 10:00:00'),
        (v_user_id, v_cliente_ricardo, 15, 'delivered', 220.00, 66.00, '2026-02-28', 'pickup', 'debit_card', '2026-02-26 16:00:00');
    
    -- Março 2026 (R$ 10.500)
    INSERT INTO orders (user_id, customer_id, display_id, status, total_value, total_cost, delivery_date, delivery_method, payment_method, created_at)
    VALUES 
        (v_user_id, v_cliente_empresa, 16, 'delivered', 2200.00, 660.00, '2026-03-05', 'delivery', 'transfer', '2026-03-03 10:00:00'),
        (v_user_id, v_cliente_ana, 17, 'delivered', 980.00, 294.00, '2026-03-10', 'delivery', 'pix', '2026-03-08 14:00:00'),
        (v_user_id, v_cliente_pedro, 18, 'delivered', 650.00, 195.00, '2026-03-15', 'pickup', 'credit_card', '2026-03-13 11:00:00'),
        (v_user_id, v_cliente_julia, 19, 'delivered', 520.00, 156.00, '2026-03-20', 'delivery', 'pix', '2026-03-18 09:00:00'),
        (v_user_id, v_cliente_fernanda, 20, 'delivered', 450.00, 135.00, '2026-03-25', 'pickup', 'pix', '2026-03-23 15:00:00'),
        (v_user_id, v_cliente_carla, 21, 'delivered', 380.00, 114.00, '2026-03-28', 'delivery', 'cash', '2026-03-26 10:00:00');
    
    -- Abril 2026 (R$ 11.200)
    INSERT INTO orders (user_id, customer_id, display_id, status, total_value, total_cost, delivery_date, delivery_method, payment_method, created_at)
    VALUES 
        (v_user_id, v_cliente_empresa, 22, 'delivered', 2800.00, 840.00, '2026-04-05', 'delivery', 'transfer', '2026-04-03 10:00:00'),
        (v_user_id, v_cliente_ana, 23, 'delivered', 1200.00, 360.00, '2026-04-12', 'delivery', 'pix', '2026-04-10 14:00:00'),
        (v_user_id, v_cliente_pedro, 24, 'delivered', 750.00, 225.00, '2026-04-18', 'pickup', 'credit_card', '2026-04-16 11:00:00'),
        (v_user_id, v_cliente_julia, 25, 'delivered', 580.00, 174.00, '2026-04-22', 'delivery', 'pix', '2026-04-20 09:00:00'),
        (v_user_id, v_cliente_fernanda, 26, 'delivered', 420.00, 126.00, '2026-04-26', 'pickup', 'cash', '2026-04-24 15:00:00'),
        (v_user_id, v_cliente_marcos, 27, 'delivered', 350.00, 105.00, '2026-04-30', 'pickup', 'debit_card', '2026-04-28 10:00:00');
    
    -- Maio 2026 (R$ 12.840 - Mês atual)
    INSERT INTO orders (user_id, customer_id, display_id, status, total_value, total_cost, delivery_date, delivery_method, payment_method, created_at)
    VALUES 
        (v_user_id, v_cliente_empresa, 28, 'delivered', 3200.00, 960.00, '2026-05-05', 'delivery', 'transfer', '2026-05-03 10:00:00'),
        (v_user_id, v_cliente_ana, 29, 'delivered', 1450.00, 435.00, '2026-05-10', 'delivery', 'pix', '2026-05-08 14:00:00'),
        (v_user_id, v_cliente_pedro, 30, 'delivered', 890.00, 267.00, '2026-05-15', 'pickup', 'credit_card', '2026-05-13 11:00:00'),
        (v_user_id, v_cliente_julia, 31, 'delivered', 720.00, 216.00, '2026-05-18', 'delivery', 'pix', '2026-05-16 09:00:00'),
        (v_user_id, v_cliente_fernanda, 32, 'delivered', 580.00, 174.00, '2026-05-20', 'pickup', 'pix', '2026-05-18 15:00:00'),
        (v_user_id, v_cliente_carla, 33, 'delivered', 450.00, 135.00, '2026-05-22', 'delivery', 'cash', '2026-05-20 10:00:00');
    
    -- Pedidos PENDENTES para hoje (para screenshots)
    INSERT INTO orders (user_id, customer_id, display_id, status, total_value, total_cost, delivery_date, delivery_time, delivery_method, payment_method, notes, created_at)
    VALUES 
        (v_user_id, v_cliente_ana, 34, 'ready', 650.00, 195.00, CURRENT_DATE, '14:00', 'delivery', 'pix', 'Bolo de casamento 3 andares - Decoração com flores', CURRENT_TIMESTAMP - INTERVAL '2 days'),
        (v_user_id, v_cliente_pedro, 35, 'preparing', 280.00, 84.00, CURRENT_DATE, '16:00', 'pickup', 'credit_card', '50 Brigadeiros para reunião', CURRENT_TIMESTAMP - INTERVAL '1 day'),
        (v_user_id, v_cliente_carla, 36, 'pending', 180.00, 54.00, CURRENT_DATE, '18:00', 'delivery', 'pix', 'Torta de Limão - Aniversário', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
        (v_user_id, v_cliente_julia, 37, 'pending', 420.00, 126.00, CURRENT_DATE + INTERVAL '1 day', '15:00', 'delivery', 'pix', 'Kit Festa Infantil - Tema Unicórnio', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
        (v_user_id, v_cliente_marcos, 38, 'pending', 220.00, 66.00, CURRENT_DATE + INTERVAL '2 days', '10:00', 'pickup', 'cash', '20 Cupcakes variados', CURRENT_TIMESTAMP);

    -- ========================================================================
    -- 7. ORDER_ITEMS (Itens dos pedidos para gráficos de pizza e ranking)
    -- ========================================================================
    
    -- Janeiro 2026 - Pedidos 1-8 (Brigadeiros e Trufas variados)
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brigadeiro, 'Brigadeiro Gourmet (50un)', 3, 120.00, 35.00, 360.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 1;
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brownie, 'Brownie Recheado', 9, 10.00, 3.00, 90.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 1;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_trufa, 'Trufa Artesanal (30un)', 6, 105.00, 31.50, 630.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 2;
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brownie, 'Brownie Recheado', 5, 10.00, 3.00, 50.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 2;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brigadeiro, 'Brigadeiro Gourmet (50un)', 10, 120.00, 36.00, 1200.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 3;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_bolo_pote, 'Bolo de Pote Ninho c/ Nutella', 25, 15.00, 4.50, 375.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 4;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_copo_felicidade, 'Copo da Felicidade', 11, 22.00, 6.60, 242.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 5;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_trufa, 'Trufa Artesanal (30un)', 5, 105.00, 31.50, 525.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 6;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_bolo_pote, 'Bolo de Pote Ninho c/ Nutella', 12, 15.00, 4.50, 180.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 7;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brigadeiro, 'Brigadeiro Gourmet (50un)', 7, 120.00, 36.00, 840.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 8;
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brownie, 'Brownie Recheado', 5, 10.00, 3.00, 50.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 8;
    
    -- Fevereiro 2026 - Pedidos 9-15
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_copo_felicidade, 'Copo da Felicidade', 68, 22.00, 6.60, 1496.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 9;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_trufa, 'Trufa Artesanal (30un)', 7, 105.00, 31.50, 735.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 10;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_trufa, 'Trufa Artesanal (30un)', 4, 105.00, 31.50, 420.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 11;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brigadeiro, 'Brigadeiro Gourmet (50un)', 9, 120.00, 36.00, 1080.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 12;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_bolo_pote, 'Bolo de Pote Ninho c/ Nutella', 25, 15.00, 4.50, 375.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 13;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brownie, 'Brownie Recheado', 29, 10.00, 3.00, 290.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 14;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_copo_felicidade, 'Copo da Felicidade', 10, 22.00, 6.60, 220.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 15;
    
    -- Março 2026 - Pedidos 16-21
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brigadeiro, 'Brigadeiro Gourmet (50un)', 18, 120.00, 36.00, 2160.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 16;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_trufa, 'Trufa Artesanal (30un)', 9, 105.00, 31.50, 945.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 17;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_copo_felicidade, 'Copo da Felicidade', 29, 22.00, 6.60, 638.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 18;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_bolo_pote, 'Bolo de Pote Ninho c/ Nutella', 34, 15.00, 4.50, 510.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 19;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brownie, 'Brownie Recheado', 45, 10.00, 3.00, 450.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 20;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brigadeiro, 'Brigadeiro Gourmet (50un)', 3, 120.00, 36.00, 360.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 21;
    
    -- Abril 2026 - Pedidos 22-27
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_trufa, 'Trufa Artesanal (30un)', 26, 105.00, 31.50, 2730.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 22;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brigadeiro, 'Brigadeiro Gourmet (50un)', 10, 120.00, 36.00, 1200.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 23;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_copo_felicidade, 'Copo da Felicidade', 34, 22.00, 6.60, 748.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 24;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_bolo_pote, 'Bolo de Pote Ninho c/ Nutella', 38, 15.00, 4.50, 570.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 25;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brownie, 'Brownie Recheado', 42, 10.00, 3.00, 420.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 26;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_trufa, 'Trufa Artesanal (30un)', 3, 105.00, 31.50, 315.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 27;
    
    -- Maio 2026 - Pedidos 28-33
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brigadeiro, 'Brigadeiro Gourmet (50un)', 26, 120.00, 36.00, 3120.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 28;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_copo_felicidade, 'Copo da Felicidade', 65, 22.00, 6.60, 1430.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 29;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_trufa, 'Trufa Artesanal (30un)', 8, 105.00, 31.50, 840.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 30;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_bolo_pote, 'Bolo de Pote Ninho c/ Nutella', 48, 15.00, 4.50, 720.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 31;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brownie, 'Brownie Recheado', 58, 10.00, 3.00, 580.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 32;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brigadeiro, 'Brigadeiro Gourmet (50un)', 3, 120.00, 36.00, 360.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 33;
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brownie, 'Brownie Recheado', 9, 10.00, 3.00, 90.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 33;
    
    -- Pedidos Pendentes - 34-38
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brigadeiro, 'Brigadeiro Gourmet (50un)', 5, 120.00, 36.00, 600.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 34;
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brownie, 'Brownie Recheado', 5, 10.00, 3.00, 50.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 34;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brigadeiro, 'Brigadeiro Gourmet (50un)', 2, 120.00, 36.00, 240.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 35;
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_brownie, 'Brownie Recheado', 4, 10.00, 3.00, 40.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 35;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_bolo_pote, 'Bolo de Pote Ninho c/ Nutella', 12, 15.00, 4.50, 180.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 36;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_trufa, 'Trufa Artesanal (30un)', 4, 105.00, 31.50, 420.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 37;
    
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal)
    SELECT o.id, v_copo_felicidade, 'Copo da Felicidade', 10, 22.00, 6.60, 220.00
    FROM orders o WHERE o.user_id = v_user_id AND o.display_id = 38;

    RAISE NOTICE 'Seed completo! Conta Maria Doceira configurada com sucesso.';
    RAISE NOTICE 'Total de ingredientes: 15';
    RAISE NOTICE 'Total de produtos: 5';
    RAISE NOTICE 'Total de clientes: 8';
    RAISE NOTICE 'Total de pedidos: 38';
    
END $$;

-- ============================================================================
-- VERIFICAÇÃO (execute separadamente após o seed)
-- ============================================================================
-- SELECT COUNT(*) as ingredientes FROM ingredients WHERE user_id = 'SEU_USER_ID';
-- SELECT COUNT(*) as produtos FROM products WHERE user_id = 'SEU_USER_ID';
-- SELECT COUNT(*) as clientes FROM customers WHERE user_id = 'SEU_USER_ID';
-- SELECT COUNT(*) as pedidos FROM orders WHERE user_id = 'SEU_USER_ID';
-- SELECT SUM(total_value) as faturamento_total FROM orders WHERE user_id = 'SEU_USER_ID' AND status = 'delivered';
