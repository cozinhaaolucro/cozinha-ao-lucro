
import { Product, Ingredient } from '@/types/database';

export const PRESET_INGREDIENTS = [
    // Básicos Confeitaria
    { name: 'Leite Condensado', unit: 'kg', cost_per_unit: 16.50, stock_quantity: 0 }, // R$ 6.50/395g -> ~16.50/kg
    { name: 'Creme de Leite', unit: 'kg', cost_per_unit: 17.50, stock_quantity: 0 }, // R$ 3.50/200g -> ~17.50/kg
    { name: 'Chocolate em Pó 50%', unit: 'kg', cost_per_unit: 75.00, stock_quantity: 0 }, // R$ 15.00/200g -> ~75.00/kg
    { name: 'Farinha de Trigo', unit: 'kg', cost_per_unit: 5.00, stock_quantity: 0 },
    { name: 'Açúcar Refinado', unit: 'kg', cost_per_unit: 4.50, stock_quantity: 0 },
    { name: 'Manteiga', unit: 'kg', cost_per_unit: 50.00, stock_quantity: 0 }, // R$ 10.00/200g -> 50.00/kg
    { name: 'Ovos', unit: 'unidade', cost_per_unit: 1.00, stock_quantity: 0 }, // R$ 12.00/dz -> 1.00/un
    { name: 'Leite Integral', unit: 'litro', cost_per_unit: 5.00, stock_quantity: 0 },
    { name: 'Chocolate Nobre Barra', unit: 'kg', cost_per_unit: 60.00, stock_quantity: 0 },
    { name: 'Granulado', unit: 'kg', cost_per_unit: 36.00, stock_quantity: 0 }, // R$ 18.00/500g -> 36.00/kg
    { name: 'Chantilly', unit: 'litro', cost_per_unit: 16.00, stock_quantity: 0 },
    { name: 'Nutella', unit: 'kg', cost_per_unit: 71.40, stock_quantity: 0 }, // R$ 25.00/350g -> ~71.40/kg

    // Embalagens (Mantém unidade)
    { name: 'Pote 250ml', unit: 'unidade', cost_per_unit: 0.80, stock_quantity: 0 },
    { name: 'Copo Bolha', unit: 'unidade', cost_per_unit: 1.20, stock_quantity: 0 },
    { name: 'Forminha Trufa', unit: 'unidade', cost_per_unit: 0.10, stock_quantity: 0 },
    { name: 'Saquinho Geladinho', unit: 'unidade', cost_per_unit: 0.05, stock_quantity: 0 },
    { name: 'Embalagem Marmita', unit: 'unidade', cost_per_unit: 1.50, stock_quantity: 0 },

    // Salgados/Refeições
    { name: 'Arroz Integral', unit: 'kg', cost_per_unit: 6.00, stock_quantity: 0 },
    { name: 'Peito de Frango', unit: 'kg', cost_per_unit: 22.00, stock_quantity: 0 },
    { name: 'Brócolis', unit: 'unidade', cost_per_unit: 8.00, stock_quantity: 0 },
    { name: 'Batata Doce', unit: 'kg', cost_per_unit: 5.00, stock_quantity: 0 },
    { name: 'Carne Moída', unit: 'kg', cost_per_unit: 35.00, stock_quantity: 0 },
];

export const PRESET_PRODUCTS = [
    {
        name: 'Brigadeiro Gourmet (Receita 50un)',
        description: 'Receita completa para um cento de festa (aprox. 50 unidades de 12g).',
        selling_price: 120.00, // ~R$ 2.40/unidade se vendida solta, mas aqui é o cento/batch
        active: true,
        ingredients: [
            { name: 'Leite Condensado', quantity: 0.395 }, // 1 lata (395g)
            { name: 'Creme de Leite', quantity: 0.200 }, // 1 caixa (200g)
            { name: 'Chocolate em Pó 50%', quantity: 0.050 }, // 50g
            { name: 'Manteiga', quantity: 0.020 }, // 20g
            { name: 'Granulado', quantity: 0.150 }, // 150g para enrolar 50un
            { name: 'Forminha Trufa', quantity: 50 }, // Usando forminha genérica por enquanto (unidade)
        ]
    },
    {
        name: 'Bolo de Pote: Leite Ninho com Nutella',
        description: 'Massa fofinha de chocolate, recheio cremoso de Ninho e Nutella pura.',
        selling_price: 12.00,
        active: true,
        ingredients: [
            { name: 'Farinha de Trigo', quantity: 0.050 }, // 50g
            { name: 'Ovos', quantity: 1 }, // 1 ovo
            { name: 'Açúcar Refinado', quantity: 0.050 }, // 50g
            { name: 'Leite Condensado', quantity: 0.050 }, // 50g
            { name: 'Creme de Leite', quantity: 0.050 }, // 50g
            { name: 'Nutella', quantity: 0.030 }, // 30g
            { name: 'Pote 250ml', quantity: 1 },
        ]
    },
    {
        name: 'Brownie Recheado',
        description: 'Brownie úmido por dentro e casquinha crocante, recheado com doce de leite.',
        selling_price: 8.00,
        active: true,
        ingredients: [
            { name: 'Chocolate Nobre Barra', quantity: 0.050 }, // 50g
            { name: 'Manteiga', quantity: 0.010 }, // 10g
            { name: 'Açúcar Refinado', quantity: 0.050 }, // 50g
            { name: 'Ovos', quantity: 1 }, // 1 ovo
            { name: 'Farinha de Trigo', quantity: 0.030 }, // 30g
        ]
    },
    {
        name: 'Geladinho Gourmet: Ninho',
        description: 'Super cremoso, feito com base de leite ninho e leite condensado.',
        selling_price: 5.00,
        active: true,
        ingredients: [
            { name: 'Leite Integral', quantity: 0.100 }, // 100ml
            { name: 'Leite Condensado', quantity: 0.050 }, // 50g
            { name: 'Saquinho Geladinho', quantity: 1 },
        ]
    },
    {
        name: 'Copo da Felicidade',
        description: 'Camadas de brownie, creme de morango e ganache de chocolate.',
        selling_price: 18.00,
        active: true,
        ingredients: [
            { name: 'Copo Bolha', quantity: 1 },
            { name: 'Chocolate Nobre Barra', quantity: 0.050 }, // 50g
            { name: 'Creme de Leite', quantity: 0.100 }, // 100g
            { name: 'Leite Condensado', quantity: 0.050 }, // 50g
            { name: 'Chantilly', quantity: 0.050 }, // 50ml
        ]
    },
    {
        name: 'Marmita Fit: Frango com Batata Doce',
        description: 'Refeição equilibrada com 150g de frango grelhado e 100g de purê de batata doce.',
        selling_price: 22.00,
        active: true,
        ingredients: [
            { name: 'Peito de Frango', quantity: 0.150 }, // 150g
            { name: 'Batata Doce', quantity: 0.100 }, // 100g
            { name: 'Brócolis', quantity: 1 }, // 1 unidade (porção)
            { name: 'Embalagem Marmita', quantity: 1 },
        ]
    },
    {
        name: 'Trufa Artesanal (Receita 30un)',
        description: 'Receita para produção de 30 trufas médias (~40g cada).',
        selling_price: 90.00, // ~R$ 3.00/unidade nesse lote
        active: true,
        ingredients: [
            { name: 'Chocolate Nobre Barra', quantity: 0.500 }, // 500g (casca + ganache)
            { name: 'Creme de Leite', quantity: 0.200 }, // 200g (ganache)
            { name: 'Forminha Trufa', quantity: 30 }, // 30 unidades
            // Opcional: Recheio extra, ou álcool, simplificado aqui.
        ]
    }
];
