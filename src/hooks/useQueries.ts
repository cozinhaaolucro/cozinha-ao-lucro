import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, getProducts, getIngredients, getCustomers } from '@/lib/database';
import { OrderWithDetails, ProductWithIngredients, Ingredient } from '@/types/database';

// --- Kanban Specific Hook ---

export function useKanbanOrders(dateRange?: { from: Date, to?: Date }) {
    return useQuery({
        queryKey: [QUERY_KEYS.orders, 'kanban', dateRange],
        queryFn: async () => {
            if (dateRange?.from) {
                const start = dateRange.from.toISOString();
                const end = (dateRange.to || dateRange.from).toISOString();
                const { data, error } = await getOrders(undefined, start, end);
                if (error) throw error;
                return data || [];
            } else {
                // Default View: All Active + 50 recent delivered
                const [pending, preparing, ready, delivered] = await Promise.all([
                    getOrders('pending'),
                    getOrders('preparing'),
                    getOrders('ready'),
                    getOrders('delivered', undefined, undefined, 1, 50)
                ]);

                // Check errors? Assuming successful mostly, or throw first error
                if (pending.error) throw pending.error;

                const allOrders = [
                    ...(pending.data || []),
                    ...(preparing.data || []),
                    ...(ready.data || []),
                    ...(delivered.data || [])
                ];
                return allOrders as OrderWithDetails[];
            }
        },
        staleTime: 1000 * 30, // 30s for Kanban
    });
}

// Keys
export const QUERY_KEYS = {
    orders: 'orders',
    products: 'products',
    ingredients: 'ingredients',
    customers: 'customers',
    dashboard: 'dashboard',
};

// --- Orders Hooks ---

export function useOrders(filters?: { status?: string, startDate?: string, endDate?: string }) {
    return useQuery({
        queryKey: [QUERY_KEYS.orders, filters],
        queryFn: async () => {
            // If we have date filters, use the range
            if (filters?.startDate) {
                const { data, error } = await getOrders(filters.status, filters.startDate, filters.endDate);
                if (error) throw error;
                return data as OrderWithDetails[];
            }
            // Otherwise use status or fetch all (default behavior needs explicit args in getOrders if we want *all*)
            const { data, error } = await getOrders(filters?.status);
            if (error) throw error;
            return data as OrderWithDetails[];
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

export function useActiveOrders() {
    return useQuery({
        queryKey: [QUERY_KEYS.orders, 'active'],
        queryFn: async () => {
            // Parallel fetch for active statuses
            const [pending, preparing, ready] = await Promise.all([
                getOrders('pending'),
                getOrders('preparing'),
                getOrders('ready')
            ]);

            const allActive = [
                ...(pending.data || []),
                ...(preparing.data || []),
                ...(ready.data || [])
            ];
            return allActive as OrderWithDetails[];
        },
        staleTime: 1000 * 30, // 30 seconds for active orders (more frequent updates)
    });
}


// --- Products Hooks ---

export function useProducts(page?: number, limit?: number) {
    return useQuery({
        queryKey: [QUERY_KEYS.products, { page, limit }],
        queryFn: async () => {
            const { data, error, count } = await getProducts(page, limit);
            if (error) throw error;
            return { products: data as ProductWithIngredients[], count };
        },
        staleTime: 1000 * 60 * 10, // 10 minutes (products change rarely)
    });
}

// --- Ingredients Hooks ---

export function useIngredients(page?: number, limit?: number) {
    return useQuery({
        queryKey: [QUERY_KEYS.ingredients, { page, limit }],
        queryFn: async () => {
            const { data, error, count } = await getIngredients(page, limit);
            if (error) throw error;
            return { ingredients: data as Ingredient[], count };
        },
        staleTime: 1000 * 60 * 10,
    });
}

// --- Customers Hooks ---

export function useCustomers(page?: number, limit?: number, search?: string, filters?: any) {
    return useQuery({
        queryKey: [QUERY_KEYS.customers, { page, limit, search, filters }],
        queryFn: async () => {
            const { data, error, count } = await getCustomers(page, limit, search, filters);
            if (error) throw error;
            return { customers: data, count };
        },
        staleTime: 1000 * 60 * 5,
    });
}
