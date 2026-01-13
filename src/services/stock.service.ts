// ============================================================================
// STOCK SERVICE
// ============================================================================
// Lógica centralizada de gestão de estoque

import { supabase } from '@/lib/supabase';
import type { Ingredient, OrderWithDetails, ProductWithIngredients } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

export interface StockValidation {
    isValid: boolean;
    missingItems: MissingIngredient[];
}

export interface MissingIngredient {
    id: string;
    name: string;
    unit: string;
    current: number;
    reserved: number;
    needed: number;
    missing: number;
}

export interface StockMovementInput {
    ingredientId: string;
    type: 'in' | 'out' | 'adjustment' | 'loss' | 'sale';
    quantity: number;
    reason?: string;
    orderId?: string;
}

// ============================================================================
// STOCK SERVICE
// ============================================================================

export const StockService = {
    /**
     * Busca estoque reservado por pedidos em produção
     */
    async getReservedStock(userId?: string): Promise<Map<string, number>> {
        const reserved = new Map<string, number>();

        const query = supabase
            .from('orders')
            .select(`
                id,
                items:order_items (
                    quantity,
                    product:products (
                        id,
                        product_ingredients (
                            quantity,
                            ingredient_id
                        )
                    )
                )
            `)
            .in('status', ['preparing', 'ready']);

        if (userId) {
            query.eq('user_id', userId);
        }

        const { data: orders, error } = await query;

        if (error || !orders) {
            console.error('Error fetching reserved stock:', error);
            return reserved;
        }

        orders.forEach((order: any) => {
            order.items?.forEach((item: any) => {
                item.product?.product_ingredients?.forEach((pi: any) => {
                    if (pi.ingredient_id) {
                        const current = reserved.get(pi.ingredient_id) || 0;
                        reserved.set(pi.ingredient_id, current + (pi.quantity * item.quantity));
                    }
                });
            });
        });

        return reserved;
    },

    /**
     * Calcula demanda de ingredientes para uma lista de itens de pedido
     */
    calculateDemand(
        items: Array<{ product_id: string; quantity: number }>,
        products: ProductWithIngredients[]
    ): Map<string, { name: string; qty: number; unit: string }> {
        const demand = new Map<string, { name: string; qty: number; unit: string }>();

        items.forEach(item => {
            const product = products.find(p => p.id === item.product_id);
            if (!product?.product_ingredients) return;

            product.product_ingredients.forEach((pi: any) => {
                const ingredient = pi.ingredient;
                if (!ingredient) return;

                const existing = demand.get(ingredient.id) || {
                    name: ingredient.name,
                    qty: 0,
                    unit: ingredient.unit,
                };
                existing.qty += pi.quantity * item.quantity;
                demand.set(ingredient.id, existing);
            });
        });

        return demand;
    },

    /**
     * Valida se há estoque suficiente para um pedido
     * Considera estoque atual, reservado e demanda do novo pedido
     */
    async validateStock(
        items: Array<{ product_id: string; quantity: number }>,
        products: ProductWithIngredients[],
        ingredients: Ingredient[]
    ): Promise<StockValidation> {
        // Buscar estoque reservado
        const reserved = await this.getReservedStock();

        // Calcular demanda do novo pedido
        const demand = this.calculateDemand(items, products);

        // Verificar disponibilidade
        const missingItems: MissingIngredient[] = [];

        demand.forEach((demandInfo, ingredientId) => {
            const ingredient = ingredients.find(i => i.id === ingredientId);
            if (!ingredient) return;

            const reservedQty = reserved.get(ingredientId) || 0;
            const available = ingredient.stock_quantity - reservedQty;

            if (demandInfo.qty > available) {
                missingItems.push({
                    id: ingredientId,
                    name: demandInfo.name,
                    unit: demandInfo.unit,
                    current: ingredient.stock_quantity,
                    reserved: reservedQty,
                    needed: demandInfo.qty,
                    missing: demandInfo.qty - available,
                });
            }
        });

        return {
            isValid: missingItems.length === 0,
            missingItems,
        };
    },

    /**
     * Adiciona estoque automaticamente para itens faltantes
     */
    async autoRestock(
        missingItems: MissingIngredient[],
        reason = 'Reposição automática para pedido'
    ): Promise<{ success: boolean; error?: Error }> {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) {
                return { success: false, error: new Error('Usuário não autenticado') };
            }

            await Promise.all(missingItems.map(async (item) => {
                // Atualizar estoque
                const { error: updateError } = await supabase
                    .from('ingredients')
                    .update({
                        stock_quantity: item.current + item.missing,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', item.id);

                if (updateError) throw updateError;

                // Registrar movimento
                const { error: movementError } = await supabase
                    .from('stock_movements')
                    .insert({
                        ingredient_id: item.id,
                        user_id: user.id,
                        type: 'in',
                        quantity: item.missing,
                        reason: `${reason} (Falta: ${item.missing.toFixed(2)} ${item.unit})`,
                    });

                if (movementError) throw movementError;
            }));

            return { success: true };
        } catch (error) {
            console.error('Auto-restock error:', error);
            return { success: false, error: error as Error };
        }
    },

    /**
     * Registra movimento de estoque manual
     */
    async createMovement(input: StockMovementInput): Promise<{ success: boolean; error?: Error }> {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) {
                return { success: false, error: new Error('Usuário não autenticado') };
            }

            // Buscar estoque atual
            const { data: ingredient, error: fetchError } = await supabase
                .from('ingredients')
                .select('stock_quantity')
                .eq('id', input.ingredientId)
                .single();

            if (fetchError || !ingredient) {
                return { success: false, error: fetchError || new Error('Ingrediente não encontrado') };
            }

            // Calcular novo estoque
            let newStock = ingredient.stock_quantity;
            if (input.type === 'in') {
                newStock += input.quantity;
            } else if (['out', 'loss', 'sale'].includes(input.type)) {
                newStock = Math.max(0, newStock - input.quantity);
            } else if (input.type === 'adjustment') {
                newStock = input.quantity; // Ajuste define valor absoluto
            }

            // Atualizar estoque
            const { error: updateError } = await supabase
                .from('ingredients')
                .update({
                    stock_quantity: newStock,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', input.ingredientId);

            if (updateError) throw updateError;

            // Registrar movimento
            const { error: movementError } = await supabase
                .from('stock_movements')
                .insert({
                    ingredient_id: input.ingredientId,
                    user_id: user.id,
                    type: input.type,
                    quantity: input.quantity,
                    reason: input.reason,
                    order_id: input.orderId,
                });

            if (movementError) throw movementError;

            return { success: true };
        } catch (error) {
            console.error('Stock movement error:', error);
            return { success: false, error: error as Error };
        }
    },

    /**
     * Verifica ingredientes com estoque baixo
     */
    async getLowStockIngredients(): Promise<Ingredient[]> {
        const { data, error } = await supabase
            .from('ingredients')
            .select('*');

        if (error || !data) {
            console.error('Error fetching ingredients:', error);
            return [];
        }

        return data.filter(i => i.stock_quantity < (i.min_stock_threshold || 5));
    },

    /**
     * Busca status de estoque vs demanda da view materializada
     */
    async getStockDemandStatus(): Promise<any[]> {
        const { data, error } = await supabase
            .from('mv_stock_demand')
            .select('*')
            .not('stock_status', 'eq', 'sufficient');

        if (error) {
            console.warn('Materialized view not available, using fallback:', error.message);
            return [];
        }

        return data || [];
    },
};

export default StockService;
