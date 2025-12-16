-- Seed data para demonstração
-- Execute depois da migração inicial

-- Nota: Substitua 'YOUR_USER_ID_HERE' pelo ID do usuário cozinhaaolucro@gmail.com
-- Você pode obter o ID em: Supabase Dashboard > Authentication > Users

-- Ingredientes de exemplo
INSERT INTO public.ingredients (user_id, name, unit, cost_per_unit) VALUES
('YOUR_USER_ID_HERE', 'Leite Condensado', 'unidade', 5.50),
('YOUR_USER_ID_HERE', 'Chocolate em Pó', 'kg', 18.00),
('YOUR_USER_ID_HERE', 'Manteiga', 'kg', 25.00),
('YOUR_USER_ID_HERE', 'Creme de Leite', 'unidade', 3.80),
('YOUR_USER_ID_HERE', 'Granulado', 'kg', 12.00),
('YOUR_USER_ID_HERE', 'Farinha de Trigo', 'kg', 4.50),
('YOUR_USER_ID_HERE', 'Açúcar', 'kg', 3.20),
('YOUR_USER_ID_HERE', 'Ovos', 'unidade', 0.70),
('YOUR_USER_ID_HERE', 'Frutas Variadas', 'kg', 8.00),
('YOUR_USER_ID_HERE', 'Recheio Gourmet', 'kg', 35.00);

-- Clientes de exemplo
INSERT INTO public.customers (user_id, name, phone, address, last_order_date, total_orders, total_spent) VALUES
('YOUR_USER_ID_HERE', 'Maria Silva', '(11) 98765-4321', 'Rua das Flores, 123', NOW() - INTERVAL '3 days', 8, 450.00),
('YOUR_USER_ID_HERE', 'João Santos', '(11) 97654-3210', 'Av. Paulista, 1000', NOW() - INTERVAL '1 day', 12, 780.00),
('YOUR_USER_ID_HERE', 'Ana Paula', '(11) 96543-2109', 'Rua Augusta, 500', NOW() - INTERVAL '45 days', 3, 180.00),
('YOUR_USER_ID_HERE', 'Carlos Eduardo', '(11) 95432-1098', 'Rua Consolação, 250', NOW() - INTERVAL '2 days', 5, 320.00),
('YOUR_USER_ID_HERE', 'Juliana Costa', '(11) 94321-0987', 'Av. Rebouças, 800', NOW() - INTERVAL '60 days', 2, 95.00),
('YOUR_USER_ID_HERE', 'Pedro Oliveira', '(11) 93210-9876', 'Rua Oscar Freire, 150', NOW(), 15, 1250.00),
('YOUR_USER_ID_HERE', 'Fernanda Lima', '(11) 92109-8765', 'Rua Haddock Lobo, 300', NOW() - INTERVAL '7 days', 6, 490.00);

-- Nota: Produtos e pedidos serão criados via interface para demonstração
-- Isso permite ver o sistema funcionando com dados mais realistas
