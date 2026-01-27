
import { Product, Ingredient } from '@/types/database';

export const PRESET_INGREDIENTS = [
    // Básicos Confeitaria
    { name: 'Leite Condensado', unit: 'g', cost_per_unit: 0.0165, stock_quantity: 0, icon: 'milk' },
    { name: 'Creme de Leite', unit: 'g', cost_per_unit: 0.0175, stock_quantity: 0, icon: 'droplet' },
    { name: 'Chocolate em Pó 50%', unit: 'g', cost_per_unit: 0.075, stock_quantity: 0, icon: 'candy' },
    { name: 'Farinha de Trigo', unit: 'g', cost_per_unit: 0.005, stock_quantity: 0, icon: 'wheat' },
    { name: 'Açúcar Refinado', unit: 'g', cost_per_unit: 0.0045, stock_quantity: 0, icon: 'sparkles' },
    { name: 'Manteiga', unit: 'g', cost_per_unit: 0.05, stock_quantity: 0, icon: 'square' },
    { name: 'Ovos', unit: 'un', cost_per_unit: 1.00, stock_quantity: 0, icon: 'egg' },
    { name: 'Leite Integral', unit: 'ml', cost_per_unit: 0.005, stock_quantity: 0, icon: 'glass-water' },
    { name: 'Chocolate Nobre Barra', unit: 'g', cost_per_unit: 0.06, stock_quantity: 0, icon: 'cookie' },
    { name: 'Granulado', unit: 'g', cost_per_unit: 0.036, stock_quantity: 0, icon: 'asterisk' },
    { name: 'Chantilly', unit: 'ml', cost_per_unit: 0.016, stock_quantity: 0, icon: 'cloud' },
    { name: 'Nutella', unit: 'g', cost_per_unit: 0.0714, stock_quantity: 0, icon: 'heart' },

    // Embalagens (Mantém unidade)
    { name: 'Pote 250ml', unit: 'un', cost_per_unit: 0.80, stock_quantity: 0, icon: 'package' },
    { name: 'Copo Bolha', unit: 'un', cost_per_unit: 1.20, stock_quantity: 0, icon: 'cup-soda' },
    { name: 'Forminha Trufa', unit: 'un', cost_per_unit: 0.10, stock_quantity: 0, icon: 'circle' },
    { name: 'Saquinho Geladinho', unit: 'un', cost_per_unit: 0.05, stock_quantity: 0, icon: 'snowflake' },
    { name: 'Embalagem Marmita', unit: 'un', cost_per_unit: 1.50, stock_quantity: 0, icon: 'box' },

    // Salgados/Refeições
    { name: 'Arroz Integral', unit: 'g', cost_per_unit: 0.006, stock_quantity: 0, icon: 'salad' },
    { name: 'Peito de Frango', unit: 'g', cost_per_unit: 0.022, stock_quantity: 0, icon: 'drumstick' },
    { name: 'Brócolis', unit: 'un', cost_per_unit: 8.00, stock_quantity: 0, icon: 'leaf' },
    { name: 'Batata Doce', unit: 'g', cost_per_unit: 0.005, stock_quantity: 0, icon: 'carrot' },
    { name: 'Carne Moída', unit: 'g', cost_per_unit: 0.035, stock_quantity: 0, icon: 'beef' },
];

export const PRESET_PRODUCTS = [
    {
        name: 'Brigadeiro Gourmet (Receita 50un)',
        description: 'Receita completa para um cento de festa (aprox. 50 unidades de 12g).',
        selling_price: 120.00, // ~R$ 2.40/unidade se vendida solta, mas aqui é o cento/batch
        active: true,
        image_url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80',
        icon: 'cookie',
        ingredients: [
            { name: 'Leite Condensado', quantity: 395 }, // 1 lata (395g)
            { name: 'Creme de Leite', quantity: 200 }, // 1 caixa (200g)
            { name: 'Chocolate em Pó 50%', quantity: 50 }, // 50g
            { name: 'Manteiga', quantity: 20 }, // 20g
            { name: 'Granulado', quantity: 150 }, // 150g para enrolar 50un
            { name: 'Forminha Trufa', quantity: 50 }, // Usando forminha genérica por enquanto (unidade)
        ]
    },
    {
        name: 'Bolo de Pote: Leite Ninho com Nutella',
        description: 'Massa fofinha de chocolate, recheio cremoso de Ninho e Nutella pura.',
        selling_price: 12.00,
        active: true,
        image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80',
        icon: 'cake',
        ingredients: [
            { name: 'Farinha de Trigo', quantity: 50 }, // 50g
            { name: 'Ovos', quantity: 1 }, // 1 ovo
            { name: 'Açúcar Refinado', quantity: 50 }, // 50g
            { name: 'Leite Condensado', quantity: 50 }, // 50g
            { name: 'Creme de Leite', quantity: 50 }, // 50g
            { name: 'Nutella', quantity: 30 }, // 30g
            { name: 'Pote 250ml', quantity: 1 },
        ]
    },
    {
        name: 'Brownie Recheado',
        description: 'Brownie úmido por dentro e casquinha crocante, recheado com doce de leite.',
        selling_price: 8.00,
        active: true,
        image_url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&q=80',
        icon: 'square',
        ingredients: [
            { name: 'Chocolate Nobre Barra', quantity: 50 }, // 50g
            { name: 'Manteiga', quantity: 10 }, // 10g
            { name: 'Açúcar Refinado', quantity: 50 }, // 50g
            { name: 'Ovos', quantity: 1 }, // 1 ovo
            { name: 'Farinha de Trigo', quantity: 30 }, // 30g
        ]
    },
    {
        name: 'Geladinho Gourmet: Ninho',
        description: 'Super cremoso, feito com base de leite ninho e leite condensado.',
        selling_price: 5.00,
        active: true,
        image_url: 'https://images.unsplash.com/photo-1506459225024-1428097a7e18?w=800&q=80', // Sorvete placeholder
        icon: 'ice-cream',
        ingredients: [
            { name: 'Leite Integral', quantity: 100 }, // 100ml
            { name: 'Leite Condensado', quantity: 50 }, // 50g
            { name: 'Saquinho Geladinho', quantity: 1 },
        ]
    },
    {
        name: 'Copo da Felicidade',
        description: 'Camadas de brownie, creme de morango e ganache de chocolate.',
        selling_price: 18.00,
        active: true,
        image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80',
        icon: 'cup',
        ingredients: [
            { name: 'Copo Bolha', quantity: 1 },
            { name: 'Chocolate Nobre Barra', quantity: 50 }, // 50g
            { name: 'Creme de Leite', quantity: 100 }, // 100g
            { name: 'Leite Condensado', quantity: 50 }, // 50g
            { name: 'Chantilly', quantity: 50 }, // 50ml
        ]
    },
    {
        name: 'Marmita Fit: Frango com Batata Doce',
        description: 'Refeição equilibrada com 150g de frango grelhado e 100g de purê de batata doce.',
        selling_price: 22.00,
        active: true,
        image_url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&q=80',
        icon: 'utensils',
        ingredients: [
            { name: 'Peito de Frango', quantity: 150 }, // 150g
            { name: 'Batata Doce', quantity: 100 }, // 100g
            { name: 'Brócolis', quantity: 1 }, // 1 unidade (porção)
            { name: 'Embalagem Marmita', quantity: 1 },
        ]
    },
    {
        name: 'Trufa Artesanal (Receita 30un)',
        description: 'Receita para produção de 30 trufas médias (~40g cada).',
        selling_price: 90.00, // ~R$ 3.00/unidade nesse lote
        active: true,
        image_url: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=800&q=80', // Robust Truffles URL
        icon: 'circle',
        ingredients: [
            { name: 'Chocolate Nobre Barra', quantity: 500 }, // 500g (casca + ganache)
            { name: 'Creme de Leite', quantity: 200 }, // 200g (ganache)
            { name: 'Forminha Trufa', quantity: 30 }, // 30 unidades
            // Opcional: Recheio extra, ou álcool, simplificado aqui.
        ]
    }
];
