// ============================================================================
// USE DASHBOARD METRICS HOOK
// ============================================================================
// Hook customizado que encapsula toda a lógica do Dashboard

import { useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrders, getProducts, getIngredients, getCustomers } from '@/lib/database';
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

    // Fetch orders
    const {
        data: ordersData,
        isLoading: ordersLoading,
        error: ordersError,
    } = useQuery({
        queryKey: dashboardQueryKeys.orders(),
        queryFn: async () => {
            const { data, error } = await getOrders();
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 2, // 2 min
    });

    // Fetch products
    const {
        data: productsData,
        isLoading: productsLoading,
        error: productsError,
    } = useQuery({
        queryKey: dashboardQueryKeys.products(),
        queryFn: async () => {
            const { data, error } = await getProducts();
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 min
    });

    // Fetch ingredients
    const {
        data: ingredientsData,
        isLoading: ingredientsLoading,
        error: ingredientsError,
    } = useQuery({
        queryKey: dashboardQueryKeys.ingredients(),
        queryFn: async () => {
            const { data, error } = await getIngredients();
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 min
    });

    // Fetch customers
    const {
        data: customersData,
        isLoading: customersLoading,
        error: customersError,
    } = useQuery({
        queryKey: dashboardQueryKeys.customers(),
        queryFn: async () => {
            const { data, error } = await getCustomers();
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5, // 5 min
    });

    // Default values
    const orders = ordersData || [];
    const products = productsData || [];
    const ingredients = ingredientsData || [];
    const customers = customersData || [];

    // Filter orders by period
    const filteredOrders = useMemo(() => {
        return AnalyticsService.filterOrdersByPeriod(
            orders,
            filters.period,
            filters.customRange
        );
    }, [orders, filters.period, filters.customRange]);

    // Calculate metrics
    const metrics = useMemo(() => {
        return AnalyticsService.calculateMetrics(filteredOrders, products as any);
    }, [filteredOrders, products]);

    // Analyze stock demand
    const stockAnalysis = useMemo(() => {
        return AnalyticsService.analyzeStockDemand(orders, products as any, ingredients);
    }, [orders, products, ingredients]);

    // Generate chart data
    const chartData = useMemo(() => {
        const days = filters.period === 'custom' ? 30 : parseInt(filters.period) || 7;
        return AnalyticsService.getChartData(filteredOrders, products as any, days);
    }, [filteredOrders, products, filters.period]);

    // Product performance
    const productPerformance = useMemo(() => {
        return AnalyticsService.getProductPerformance(filteredOrders, products as any);
    }, [filteredOrders, products]);

    // Refetch function
    const refetch = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all });
    }, [queryClient]);

    // Combined loading state
    const isLoading = ordersLoading || productsLoading || ingredientsLoading || customersLoading;

    // Combined error
    const error = ordersError || productsError || ingredientsError || customersError || null;

    return {
        metrics,
        stockAnalysis,
        chartData,
        productPerformance,
        orders,
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
