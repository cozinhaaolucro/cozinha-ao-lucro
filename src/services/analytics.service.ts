// ============================================================================
// ANALYTICS SERVICE
// ============================================================================
// Lógica de cálculos e análises extraída do Dashboard
// Centraliza toda a lógica de negócio para métricas

import type {
    OrderWithDetails,
    Product,
    Ingredient,
    ProductWithIngredients,
    ProductIngredientWithDetails
} from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardMetrics {
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
    orders: number;
    avgTicket: number;
    pendingOrders: number;
    preparingOrders: number;
    deliveredOrders: number;
}

export interface StockDemandAnalysis {
    ingredient: Ingredient;
    stock: number;
    demand: number;
    reserved: number;
    balance: number;
    status: 'sufficient' | 'low' | 'critical' | 'unused';
}

export interface ChartDataPoint {
    date: string;
    label: string;
    revenue: number;
    cost: number;
    profit: number;
    orders: number;
}

export interface ProductPerformance {
    product: Product;
    timesSold: number;
    totalQuantity: number;
    totalRevenue: number;
    avgPrice: number;
    totalProfit: number;
    margin: number;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

type ProductWithCost = ProductWithIngredients & {
    product_ingredients: ProductIngredientWithDetails[];
};

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

export const AnalyticsService = {
    /**
     * Calcula o custo de produção de um produto baseado em sua receita
     */
    calculateProductCost(product: ProductWithCost): number {
        if (!product.product_ingredients || product.product_ingredients.length === 0) {
            return 0;
        }

        return product.product_ingredients.reduce((sum, pi) => {
            const ingredientCost = pi.ingredient?.cost_per_unit || 0;
            const quantity = pi.quantity || 0;
            return sum + (ingredientCost * quantity);
        }, 0);
    },

    /**
     * Calcula o custo total de um pedido
     */
    calculateOrderCost(order: OrderWithDetails, products: ProductWithCost[]): number {
        if (!order.items || order.items.length === 0) {
            // Se temos total_cost já calculado, usar ele
            if (order.total_cost && order.total_cost > 0) {
                return order.total_cost;
            }
            return 0;
        }

        return order.items.reduce((sum, item) => {
            // Preferir unit_cost se já capturado
            if (item.unit_cost && item.unit_cost > 0) {
                return sum + (item.unit_cost * item.quantity);
            }

            // Fallback: calcular do produto
            const product = products.find(p => p.id === item.product_id);
            if (!product) return sum;

            const productCost = this.calculateProductCost(product);
            return sum + (productCost * item.quantity);
        }, 0);
    },

    /**
     * Calcula métricas principais do dashboard
     */
    calculateMetrics(orders: OrderWithDetails[], products: ProductWithCost[]): DashboardMetrics {
        // Filtrar pedidos válidos (não cancelados)
        const validOrders = orders.filter(o => o.status !== 'cancelled');

        // Calcular totais
        let totalRevenue = 0;
        let totalCost = 0;

        validOrders.forEach(order => {
            totalRevenue += order.total_value || 0;
            totalCost += this.calculateOrderCost(order, products);
        });

        const profit = totalRevenue - totalCost;
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
        const avgTicket = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

        // Contadores por status
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const preparingOrders = orders.filter(o => o.status === 'preparing').length;
        const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

        return {
            revenue: totalRevenue,
            cost: totalCost,
            profit,
            margin,
            orders: validOrders.length,
            avgTicket,
            pendingOrders,
            preparingOrders,
            deliveredOrders,
        };
    },

    /**
     * Analisa estoque vs demanda para pedidos pendentes
     */
    analyzeStockDemand(
        allOrders: OrderWithDetails[],
        products: ProductWithCost[],
        ingredients: Ingredient[]
    ): StockDemandAnalysis[] {
        // Pedidos que reservam estoque
        const reservedOrders = allOrders.filter(o =>
            ['preparing', 'ready', 'delivered'].includes(o.status)
        );

        // Pedidos com demanda futura
        const pendingOrders = allOrders.filter(o => o.status === 'pending');

        // Calcular estoque reservado
        const reserved = new Map<string, number>();
        reservedOrders.forEach(order => {
            order.items?.forEach(item => {
                const product = products.find(p => p.id === item.product_id);
                product?.product_ingredients?.forEach(pi => {
                    const ingredientId = pi.ingredient_id || (pi as any).ingredient?.id;
                    if (ingredientId) {
                        const current = reserved.get(ingredientId) || 0;
                        reserved.set(ingredientId, current + (pi.quantity * item.quantity));
                    }
                });
            });
        });

        // Calcular demanda pendente
        const demand = new Map<string, number>();
        pendingOrders.forEach(order => {
            order.items?.forEach(item => {
                const product = products.find(p => p.id === item.product_id);
                product?.product_ingredients?.forEach(pi => {
                    const ingredientId = pi.ingredient_id || (pi as any).ingredient?.id;
                    if (ingredientId) {
                        const current = demand.get(ingredientId) || 0;
                        demand.set(ingredientId, current + (pi.quantity * item.quantity));
                    }
                });
            });
        });

        // Analisar cada ingrediente
        return ingredients.map(ing => {
            const reservedQty = reserved.get(ing.id) || 0;
            const demandQty = demand.get(ing.id) || 0;

            // "Demand" is strictly what is needed for PENDING orders.
            // "Reserved" (Preparing/Ready) is already deducted from ing.stock_quantity by DB triggers (now allowing negative stock).
            // Therefore, Balance = Current Stock - Pending Demand.

            const balance = ing.stock_quantity - demandQty;

            let status: StockDemandAnalysis['status'] = 'sufficient';

            if (demandQty === 0 && reservedQty === 0) {
                status = 'unused';
            } else if (balance < 0) {
                status = 'critical'; // We don't have enough for Pending orders (or we are already in debt)
            } else if (balance < (ing.min_stock_threshold || 5)) {
                status = 'low';
            }

            return {
                ingredient: ing,
                stock: ing.stock_quantity,
                demand: demandQty,
                reserved: reservedQty,
                balance,
                status,
            };
        }).filter(item =>
            item.demand > 0 ||
            item.reserved > 0 ||
            item.status === 'low' ||
            item.status === 'critical'
        ).sort((a, b) => {
            // Ordenar por criticidade
            const statusOrder = { critical: 0, low: 1, sufficient: 2, unused: 3 };
            return statusOrder[a.status] - statusOrder[b.status];
        });
    },

    /**
     * Gera dados para gráfico de revenue (últimos N dias)
     */
    getChartData(orders: OrderWithDetails[], products: ProductWithCost[], days: number): ChartDataPoint[] {
        const result: ChartDataPoint[] = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Filtrar pedidos do dia
            const dayOrders = orders.filter(o => {
                const orderDate = o.delivery_date || o.created_at?.split('T')[0];
                return orderDate === dateStr && o.status !== 'cancelled';
            });

            // Calcular métricas do dia
            const revenue = dayOrders.reduce((sum, o) => sum + (o.total_value || 0), 0);
            const cost = dayOrders.reduce((sum, o) => sum + this.calculateOrderCost(o, products), 0);

            result.push({
                date: dateStr,
                label: this.formatDateLabel(date),
                revenue,
                cost,
                profit: revenue - cost,
                orders: dayOrders.length,
            });
        }

        return result;
    },

    /**
     * Calcula performance de produtos
     */
    getProductPerformance(orders: OrderWithDetails[], products: ProductWithCost[]): ProductPerformance[] {
        const productStats = new Map<string, {
            timesSold: number;
            totalQuantity: number;
            totalRevenue: number;
            totalCost: number;
            prices: number[];
        }>();

        // Agregar dados
        orders.forEach(order => {
            if (order.status === 'cancelled') return;

            order.items?.forEach(item => {
                const existing = productStats.get(item.product_id || '') || {
                    timesSold: 0,
                    totalQuantity: 0,
                    totalRevenue: 0,
                    totalCost: 0,
                    prices: [],
                };

                existing.timesSold++;
                existing.totalQuantity += item.quantity;
                existing.totalRevenue += item.subtotal || (item.unit_price * item.quantity);
                existing.totalCost += (item.unit_cost || 0) * item.quantity;
                existing.prices.push(item.unit_price);

                productStats.set(item.product_id || '', existing);
            });
        });

        // Transformar em array
        return products.map(product => {
            const stats = productStats.get(product.id);

            if (!stats) {
                return {
                    product,
                    timesSold: 0,
                    totalQuantity: 0,
                    totalRevenue: 0,
                    avgPrice: product.selling_price || 0,
                    totalProfit: 0,
                    margin: 0,
                };
            }

            const avgPrice = stats.prices.length > 0
                ? stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length
                : product.selling_price || 0;

            const totalProfit = stats.totalRevenue - stats.totalCost;
            const margin = stats.totalRevenue > 0
                ? (totalProfit / stats.totalRevenue) * 100
                : 0;

            return {
                product,
                timesSold: stats.timesSold,
                totalQuantity: stats.totalQuantity,
                totalRevenue: stats.totalRevenue,
                avgPrice,
                totalProfit,
                margin,
            };
        }).sort((a, b) => b.totalRevenue - a.totalRevenue);
    },

    /**
     * Filtra pedidos por período
     */
    filterOrdersByPeriod(
        orders: OrderWithDetails[],
        period: string,
        customRange?: { start: string; end: string }
    ): OrderWithDetails[] {
        if (period === 'custom' && customRange) {
            return orders.filter(o => {
                const date = o.delivery_date || o.created_at?.split('T')[0];
                return date && date >= customRange.start && date <= customRange.end;
            });
        }

        const days = parseInt(period);
        if (isNaN(days)) return orders;

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutoffStr = cutoff.toISOString().split('T')[0];

        return orders.filter(o => {
            const date = o.delivery_date || o.created_at?.split('T')[0];
            return date && date >= cutoffStr;
        });
    },

    /**
     * Helper: Formata label de data para gráfico
     */
    formatDateLabel(date: Date): string {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}`;
    },

    /**
     * Helper: Formata valor em reais
     */
    formatCurrency(value: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    },

    /**
     * Helper: Formata porcentagem
     */
    formatPercent(value: number): string {
        return `${value.toFixed(1)}%`;
    },
};

export default AnalyticsService;
