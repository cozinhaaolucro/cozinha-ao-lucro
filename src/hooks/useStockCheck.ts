import { supabase } from '@/lib/supabase';
import type { Product, ProductIngredientWithDetails } from '@/types/database';

export interface MissingIngredient {
    id: string;
    name: string;
    missing: number;
    current: number;
    needed: number;
    unit: string;
    reserved?: number;
}

export interface StockCheckItem {
    product_id: string;
    quantity: number;
}

export const useStockCheck = () => {

    const checkStockAvailability = async (items: StockCheckItem[], products: Product[]): Promise<MissingIngredient[]> => {
        const needed = new Map<string, { name: string; qty: number; unit: string }>();
        const ingredientIds = new Set<string>();

        // 1. Calculate Total Needed
        items.forEach(item => {
            const product = products.find(p => p.id === item.product_id);
            if (product?.product_ingredients) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                product.product_ingredients.forEach((pi: ProductIngredientWithDetails | any) => {
                    const ing = pi.ingredient;
                    if (ing) {
                        const total = (pi.quantity * item.quantity);
                        const existing = needed.get(ing.id) || { name: ing.name, qty: 0, unit: ing.unit };
                        existing.qty += total;
                        needed.set(ing.id, existing);
                        ingredientIds.add(ing.id);
                    }
                });
            }
        });

        if (ingredientIds.size === 0) return [];

        // 2. Fetch Fresh Stock
        const { data: freshIngredients } = await supabase
            .from('ingredients')
            .select('id, stock_quantity, name, unit')
            .in('id', Array.from(ingredientIds));

        const stockMap = new Map<string, number>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        freshIngredients?.forEach((ing: any) => {
            stockMap.set(ing.id, ing.stock_quantity);
        });

        // 3. Compare
        const missing: MissingIngredient[] = [];
        needed.forEach((val, key) => {
            const currentStock = stockMap.get(key) || 0;
            if (val.qty > currentStock) {
                missing.push({
                    id: key,
                    name: val.name,
                    missing: val.qty - currentStock,
                    current: currentStock,
                    needed: val.qty,
                    unit: val.unit,
                    reserved: 0 // Could be enhanced later with reserved logic if needed
                });
            }
        });

        return missing;
    };

    return { checkStockAvailability };
};
