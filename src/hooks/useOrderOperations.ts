import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStockCheck } from './useStockCheck';
import { createOrder, deleteOrder, createStockMovement } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/hooks/useQueries';
import type { OrderWithDetails, Product, ProductIngredientWithDetails } from '@/types/database';

interface UseOrderOperationsProps {
    products: Product[];
    onSuccess?: () => void;
}

import { type MissingIngredient } from './useStockCheck';

export const useOrderOperations = ({ products, onSuccess }: UseOrderOperationsProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Duplicate Stock Alert States
    const [duplicatingOrder, setDuplicatingOrder] = useState<OrderWithDetails | null>(null);
    const [showDuplicateStockAlert, setShowDuplicateStockAlert] = useState(false);
    const [missingIngredientsForDuplicate, setMissingIngredientsForDuplicate] = useState<MissingIngredient[]>([]);
    const [isDuplicateRestocking, setIsDuplicateRestocking] = useState(false);

    const { checkStockAvailability } = useStockCheck();

    const calculateMissingStockForDuplicate = async (order: OrderWithDetails) => {
        const items = order.items.map(item => ({
            product_id: item.product_id || '',
            quantity: item.quantity
        })).filter(i => i.product_id);

        return await checkStockAvailability(items, products);
    };

    const processDuplicateOrderCreation = async (order: OrderWithDetails) => {
        try {
            const newOrder = {
                customer_id: order.customer_id,
                order_number: `#${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                status: 'pending' as const,
                total_value: order.total_value || 0,
                total_cost: order.total_cost || 0,
                delivery_date: null,
                delivery_time: null,
                delivery_method: order.delivery_method || 'pickup',
                delivery_fee: order.delivery_fee || 0,
                payment_method: order.payment_method || 'pix',
                notes: order.notes,
            };

            const newItems = order.items.map(item => ({
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                subtotal: item.subtotal,
                unit_cost: item.unit_cost || 0
            }));

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const { error } = await createOrder(newOrder, newItems);

            if (error) throw error;

            toast({
                title: 'Pedido duplicado',
                description: 'O pedido foi duplicado com sucesso para a aba "A Fazer".',
            });
            onSuccess?.();
        } catch (error: unknown) { // Safer than any
            const err = error as Error;
            toast({
                title: 'Erro ao duplicar',
                description: `Erro: ${err?.message}`,
                variant: 'destructive',
            });
        }
    };

    const handleDuplicate = async (order: OrderWithDetails) => {
        if (order.status === 'pending') {
            await processDuplicateOrderCreation(order);
            return;
        }

        const missing = await calculateMissingStockForDuplicate(order);

        if (missing.length > 0) {
            setDuplicatingOrder(order);
            setMissingIngredientsForDuplicate(missing);
            setShowDuplicateStockAlert(true);
        } else {
            await processDuplicateOrderCreation(order);
        }
    };

    const handleDuplicateAutoRestock = async () => {
        if (!duplicatingOrder) return;
        setIsDuplicateRestocking(true);
        try {
            await Promise.all(missingIngredientsForDuplicate.map(async (item) => {
                await createStockMovement({
                    ingredient_id: item.id,
                    type: 'in',
                    quantity: item.missing,
                    reason: `Auto-refill para Duplicação de Pedido`
                });
            }));

            toast({ title: 'Estoque atualizado automaticamente!' });
            setShowDuplicateStockAlert(false);
            await processDuplicateOrderCreation(duplicatingOrder);
            setDuplicatingOrder(null);
        } catch (error) {
            toast({ title: 'Erro ao atualizar estoque', variant: 'destructive' });
        } finally {
            setIsDuplicateRestocking(false);
        }
    };

    const handleDeleteOrder = async (id: string) => {
        const { error } = await deleteOrder(id);
        if (!error) {
            toast({ title: 'Pedido excluído' });
            onSuccess?.();
            // Invalidate queries to ensure fresh stock/dashboard data
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ingredients] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.products] });
        } else {
            toast({ title: 'Erro ao excluir pedido', variant: 'destructive' });
        }
    };

    return {
        // States
        duplicatingOrder,
        showDuplicateStockAlert,
        setShowDuplicateStockAlert,
        missingIngredientsForDuplicate,
        isDuplicateRestocking,
        setDuplicatingOrder,

        // Actions
        handleDuplicate,
        handleDuplicateAutoRestock,
        handleDeleteOrder,
        confirmDuplicate: processDuplicateOrderCreation // Expose internal function
    };
};
