import type {
    OrderWithDetails,
    Ingredient,
    ProductWithIngredients,
    ProductIngredientWithDetails
} from '@/types/database';

export interface StockDemandAnalysis {
    ingredient: Ingredient;
    stock: number;
    demand: number;
    reserved: number;
    balance: number;
    total_required: number;
    status: 'sufficient' | 'low' | 'critical' | 'unused';
}

type ProductWithCost = ProductWithIngredients & {
    product_ingredients: ProductIngredientWithDetails[];
};

/**
 * Analisa estoque vs demanda para pedidos pendentes
 * Precisamos do mapa de produtos COM seus ingredientes para calcular o uso.
 */
export function analyzeStockDemand(
    ingredients: Ingredient[],
    allOrders: OrderWithDetails[],
    productsWithRecipes?: ProductWithCost[]
): StockDemandAnalysis[] {

    // Se não tivermos receitas, não conseguimos calcular demanda precisa.
    // Retornamos apenas o estoque atual.
    if (!productsWithRecipes || productsWithRecipes.length === 0) {
        return ingredients.map(ing => ({
            ingredient: ing,
            stock: ing.stock_quantity,
            demand: 0,
            reserved: 0,
            balance: ing.stock_quantity,
            total_required: 0,
            status: ing.stock_quantity <= 0 ? 'critical' : (ing.stock_quantity < 5 ? 'low' : 'sufficient')
        }));
    }

    // Pendentes = Demanda Futura
    const pendingOrders = allOrders.filter(o => o.status === 'pending');

    // Reservados = Em Preparo (já deveriam ter baixado? Se não, contam como 'Reservado')
    // Na logica atual do sistema:
    // - Pending: Não baixou.
    // - Preparing: Baixou? Depende da implementação.
    // Assumindo que 'stock_quantity' no banco é o estoque FÍSICO atual.
    // Se 'Preparing' já baixou, não precisamos reservar.
    // Se 'Pending' não baixou, precisamos subtrair para saber o "Saldo Projetado".

    // Calcular Demanda
    const demandMap = new Map<string, number>();

    const calculateUsage = (orders: OrderWithDetails[], map: Map<string, number>) => {
        orders.forEach(order => {
            // Skip cancelled
            if (order.status === 'cancelled') return;

            order.items?.forEach(item => {
                // Encontrar produto e sua receita
                const product = productsWithRecipes.find(p => p.id === item.product_id);
                if (product && product.product_ingredients) {
                    product.product_ingredients.forEach(pi => {
                        // ID do ingrediente
                        const ingId = pi.ingredient_id || (pi.ingredient as any)?.id;
                        if (ingId) {
                            const qtyPerProduct = pi.quantity || 0;
                            const totalNeeded = qtyPerProduct * item.quantity;
                            const current = map.get(ingId) || 0;
                            map.set(ingId, current + totalNeeded);
                        }
                    });
                }
            });
        });
    };

    calculateUsage(pendingOrders, demandMap);

    return ingredients.map(ing => {
        const demandQty = demandMap.get(ing.id) || 0;
        const balance = ing.stock_quantity - demandQty;

        // Status determination
        let status: StockDemandAnalysis['status'] = 'sufficient';
        if (balance < 0) status = 'critical';
        else if (balance < 5) status = 'low'; // threshold hardcoded or from ing.min_stock
        else if (demandQty === 0 && ing.stock_quantity === 0) status = 'unused'; // or critical empty?

        return {
            ingredient: ing,
            stock: ing.stock_quantity,
            demand: demandQty, // Pending Demand
            reserved: 0, // Ignoring 'reserved' for now as logic is unclear on 'preparing' deduct
            balance, // Projected Balance
            total_required: demandQty, // Alias
            status
        };
    });
}
