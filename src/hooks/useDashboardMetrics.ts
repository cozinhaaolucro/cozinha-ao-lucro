// ============================================================================
// USE DASHBOARD METRICS HOOK
// ============================================================================
// Hook customizado que encapsula toda a lógica do Dashboard

import { useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrders, getProducts, getIngredients, getCustomers, getOrdersByDateRange, getActiveOrders, getDashboardMetrics } from '@/lib/database';
import { AnalyticsService } from '@/services/analytics.service';
import type { OrderWithDetails, ProductWithIngredients, Ingredient, Customer } from '@/types/database';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardFilters {
    period: string;
    customRange?: {
        start: string;
        end: string;
    };
}

export interface UseDashboardMetricsResult {
    // Data
    metrics: ReturnType<typeof AnalyticsService.calculateMetrics>;
    stockAnalysis: ReturnType<typeof AnalyticsService.analyzeStockDemand>;
    chartData: ReturnType<typeof AnalyticsService.getChartData>;
    productPerformance: ReturnType<typeof AnalyticsService.getProductPerformance>;

    // Raw data (if needed)
    orders: OrderWithDetails[];
    products: ProductWithIngredients[];
    ingredients: Ingredient[];
    customers: Customer[];

    // Filtered data
    filteredOrders: OrderWithDetails[];
    activeOrders: OrderWithDetails[];

    // State
    isLoading: boolean;
    error: Error | null;

    // Actions
    refetch: () => void;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const dashboardQueryKeys = {
    all: ['dashboard'] as const,
    orders: () => [...dashboardQueryKeys.all, 'orders'] as const,
    ordersFiltered: (filters: DashboardFilters) => [...dashboardQueryKeys.all, 'orders', filters] as const,
    products: () => [...dashboardQueryKeys.all, 'products'] as const,
    ingredients: () => [...dashboardQueryKeys.all, 'ingredients'] as const,
    customers: () => [...dashboardQueryKeys.all, 'customers'] as const,
    metrics: (filters: DashboardFilters) => [...dashboardQueryKeys.all, 'metrics', filters] as const,
};

// ============================================================================
// HOOK
// ============================================================================

export function useDashboardMetrics(filters: DashboardFilters): UseDashboardMetricsResult {
    const queryClient = useQueryClient();

    // 1. Calculate Date Range (Client Side)
    const dateRange = useMemo(() => {
        if (filters.period === 'custom' && filters.customRange) {
            return {
                start: filters.customRange.start,
                end: filters.customRange.end
            };
        }
        // Named periods
        const end = new Date();
        const start = new Date();
        const days = parseInt(filters.period) || 30;
        start.setDate(start.getDate() - days);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return {
            start: start.toISOString(),
            end: end.toISOString()
        };
    }, [filters]);

    // 2. Fetch Orders (Client Side - Required for Charts & Metrics Reliability)
    const {
        data: ordersData,
        isLoading: ordersLoading,
        error: ordersError,
    } = useQuery({
        queryKey: dashboardQueryKeys.ordersFiltered(filters),
        queryFn: async () => {
            const { data, error } = await getOrdersByDateRange(dateRange.start, dateRange.end);
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 min
    });

    // 3. Fetch Active Orders
    const {
        data: activeOrdersData,
        isLoading: activeOrdersLoading,
    } = useQuery({
        queryKey: ['dashboard', 'active_orders'],
        queryFn: async () => {
            const { data } = await getActiveOrders();
            return data || [];
        },
        staleTime: 1000 * 30
    });

    // 4. Fetch Products 
    const {
        data: productsData,
        isLoading: productsLoading,
    } = useQuery({
        queryKey: dashboardQueryKeys.products(),
        queryFn: async () => {
            const { data } = await getProducts();
            return data || [];
        },
        staleTime: 1000 * 60 * 10,
    });

    // 5. Fetch Ingredients
    const {
        data: ingredientsData,
        isLoading: ingredientsLoading
    } = useQuery({
        queryKey: dashboardQueryKeys.ingredients(),
        queryFn: async () => {
            const { data } = await getIngredients();
            return data || [];
        },
        staleTime: 1000 * 60 * 10
    });

    // 6. Fetch Customers
    const {
        data: customersData,
        isLoading: customersLoading
    } = useQuery({
        queryKey: dashboardQueryKeys.customers(),
        queryFn: async () => {
            const { data } = await getCustomers();
            return data || [];
        },
        staleTime: 1000 * 60 * 5
    });

    // Default values
    const orders = ordersData || [];
    const activeOrders = activeOrdersData || [];
    const products = productsData || [];
    const ingredients = ingredientsData || [];
    const customers = customersData || [];
    const filteredOrders = orders;

    // Calculate metrics Client-Side
    const metrics = useMemo(() => {
        return AnalyticsService.calculateMetrics(filteredOrders, products as any);
    }, [filteredOrders, products]);

    // Analyze stock demand
    const stockAnalysis = useMemo(() => {
        return AnalyticsService.analyzeStockDemand(activeOrders, products as any, ingredients);
    }, [activeOrders, products, ingredients]);

    // Generate chart data client-side
    const chartData = useMemo(() => {
        const days = filters.period === 'custom' ? 30 : parseInt(filters.period) || 7;
        return AnalyticsService.getChartData(filteredOrders, products as any, days);
    }, [filteredOrders, products, filters.period]);

    // Product performance client-side
    const productPerformance = useMemo(() => {
        return AnalyticsService.getProductPerformance(filteredOrders, products as any);
    }, [filteredOrders, products]);

    const refetch = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all });
    }, [queryClient]);

    const isLoading = ordersLoading || productsLoading || ingredientsLoading || customersLoading || activeOrdersLoading;
    const error = ordersError as Error;

    return {
        metrics,
        stockAnalysis,
        chartData,
        productPerformance,
        orders,
        activeOrders,
        products,
        ingredients,
        customers,
        filteredOrders,
        isLoading,
        error,
        refetch,
    };
}

// ============================================================================
// SIMPLER HOOKS FOR SPECIFIC USE CASES
// ============================================================================

/**
 * Hook simplificado apenas para métricas rápidas
 */
export function useQuickMetrics() {
    const { metrics, isLoading, error } = useDashboardMetrics({ period: '7' });
    return { metrics, isLoading, error };
}

/**
 * Hook para análise de estoque
 */
export function useStockAnalysis() {
    const { stockAnalysis, ingredients, isLoading, error, refetch } = useDashboardMetrics({ period: '30' });

    const criticalItems = useMemo(() =>
        stockAnalysis.filter(item => item.status === 'critical'),
        [stockAnalysis]
    );

    const lowItems = useMemo(() =>
        stockAnalysis.filter(item => item.status === 'low'),
        [stockAnalysis]
    );

    return {
        stockAnalysis,
        criticalItems,
        lowItems,
        ingredients,
        isLoading,
        error,
        refetch,
    };
}

/**
 * Hook para dados de gráfico
 */
export function useRevenueChart(period: string = '7') {
    const { chartData, isLoading, error } = useDashboardMetrics({ period });
    return { chartData, isLoading, error };
}

export default useDashboardMetrics;
