// ============================================================================
// ANALYTICS SERVICE TESTS
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsService } from '../analytics.service';
import type { OrderWithDetails, ProductWithIngredients, Ingredient } from '@/types/database';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockIngredients: Ingredient[] = [
    {
        id: 'ing-1',
        user_id: 'user-1',
        name: 'Farinha de Trigo',
        unit: 'kg',
        cost_per_unit: 5.0,
        stock_quantity: 10,
        min_stock_threshold: 2,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
    },
    {
        id: 'ing-2',
        user_id: 'user-1',
        name: 'Ovos',
        unit: 'un',
        cost_per_unit: 1.0,
        stock_quantity: 24,
        min_stock_threshold: 6,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
    },
    {
        id: 'ing-3',
        user_id: 'user-1',
        name: 'Chocolate',
        unit: 'kg',
        cost_per_unit: 30.0,
        stock_quantity: 2,
        min_stock_threshold: 1,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
    },
];

const mockProducts: any[] = [
    {
        id: 'prod-1',
        user_id: 'user-1',
        name: 'Bolo de Chocolate',
        selling_price: 80.0,
        category: 'Bolos',
        product_ingredients: [
            { ingredient_id: 'ing-1', quantity: 0.5, ingredient: mockIngredients[0] },
            { ingredient_id: 'ing-2', quantity: 4, ingredient: mockIngredients[1] },
            { ingredient_id: 'ing-3', quantity: 0.2, ingredient: mockIngredients[2] },
        ],
    },
    {
        id: 'prod-2',
        user_id: 'user-1',
        name: 'Brigadeiro (unidade)',
        selling_price: 3.0,
        category: 'Doces',
        product_ingredients: [
            { ingredient_id: 'ing-3', quantity: 0.01, ingredient: mockIngredients[2] },
        ],
    },
];

const mockOrders: any[] = [
    {
        id: 'order-1',
        user_id: 'user-1',
        customer_id: 'cust-1',
        status: 'delivered',
        total_value: 160.0,
        total_cost: 0, // Será calculado
        delivery_date: '2026-01-10',
        created_at: '2026-01-10T10:00:00Z',
        items: [
            { product_id: 'prod-1', quantity: 2, unit_price: 80.0, unit_cost: 12.5, subtotal: 160.0 },
        ],
    },
    {
        id: 'order-2',
        user_id: 'user-1',
        customer_id: 'cust-2',
        status: 'pending',
        total_value: 80.0,
        total_cost: 0,
        delivery_date: '2026-01-15',
        created_at: '2026-01-12T10:00:00Z',
        items: [
            { product_id: 'prod-1', quantity: 1, unit_price: 80.0, unit_cost: 12.5, subtotal: 80.0 },
        ],
    },
    {
        id: 'order-3',
        user_id: 'user-1',
        customer_id: 'cust-1',
        status: 'cancelled',
        total_value: 30.0,
        total_cost: 0,
        delivery_date: '2026-01-11',
        created_at: '2026-01-11T10:00:00Z',
        items: [
            { product_id: 'prod-2', quantity: 10, unit_price: 3.0, unit_cost: 0.3, subtotal: 30.0 },
        ],
    },
    {
        id: 'order-4',
        user_id: 'user-1',
        customer_id: 'cust-3',
        status: 'preparing',
        total_value: 90.0,
        total_cost: 0,
        delivery_date: '2026-01-13',
        created_at: '2026-01-12T14:00:00Z',
        items: [
            { product_id: 'prod-2', quantity: 30, unit_price: 3.0, unit_cost: 0.3, subtotal: 90.0 },
        ],
    },
];

// ============================================================================
// TESTS
// ============================================================================

describe('AnalyticsService', () => {
    describe('calculateProductCost', () => {
        it('should calculate product cost correctly from ingredients', () => {
            // Bolo: 0.5kg farinha (R$2.50) + 4 ovos (R$4) + 0.2kg chocolate (R$6) = R$12.50
            const cost = AnalyticsService.calculateProductCost(mockProducts[0]);
            expect(cost).toBe(12.5);
        });

        it('should return 0 for product without ingredients', () => {
            const productWithoutIngredients = {
                ...mockProducts[0],
                product_ingredients: [],
            };
            const cost = AnalyticsService.calculateProductCost(productWithoutIngredients);
            expect(cost).toBe(0);
        });

        it('should handle missing ingredient cost gracefully', () => {
            const productWithMissingCost = {
                ...mockProducts[0],
                product_ingredients: [
                    { ingredient_id: 'ing-1', quantity: 1, ingredient: { cost_per_unit: null } },
                ],
            };
            const cost = AnalyticsService.calculateProductCost(productWithMissingCost as any);
            expect(cost).toBe(0);
        });
    });

    describe('calculateMetrics', () => {
        it('should calculate correct revenue (excluding cancelled)', () => {
            const metrics = AnalyticsService.calculateMetrics(mockOrders, mockProducts);
            // Orders: 160 (delivered) + 80 (pending) + 90 (preparing) = 330
            // Cancelled (30) is excluded
            expect(metrics.revenue).toBe(330);
        });

        it('should count orders correctly (excluding cancelled)', () => {
            const metrics = AnalyticsService.calculateMetrics(mockOrders, mockProducts);
            expect(metrics.orders).toBe(3); // 3 valid orders (1 cancelled excluded)
        });

        it('should calculate average ticket correctly', () => {
            const metrics = AnalyticsService.calculateMetrics(mockOrders, mockProducts);
            // 330 / 3 = 110
            expect(metrics.avgTicket).toBe(110);
        });

        it('should count pending orders correctly', () => {
            const metrics = AnalyticsService.calculateMetrics(mockOrders, mockProducts);
            expect(metrics.pendingOrders).toBe(1);
        });

        it('should count preparing orders correctly', () => {
            const metrics = AnalyticsService.calculateMetrics(mockOrders, mockProducts);
            expect(metrics.preparingOrders).toBe(1);
        });

        it('should return zeros for empty orders', () => {
            const metrics = AnalyticsService.calculateMetrics([], mockProducts);
            expect(metrics.revenue).toBe(0);
            expect(metrics.orders).toBe(0);
            expect(metrics.avgTicket).toBe(0);
            expect(metrics.margin).toBe(0);
        });
    });

    describe('analyzeStockDemand', () => {
        it('should identify items with pending demand', () => {
            const analysis = AnalyticsService.analyzeStockDemand(
                mockOrders,
                mockProducts,
                mockIngredients
            );

            // Should have entries for ingredients used in pending/preparing orders
            expect(analysis.length).toBeGreaterThan(0);
        });

        it('should calculate reserved stock from preparing and delivered orders', () => {
            const analysis = AnalyticsService.analyzeStockDemand(
                mockOrders,
                mockProducts,
                mockIngredients
            );

            // Chocolate reserved:
            // - preparing order-4: 30 brigadeiros * 0.01kg = 0.3kg
            // - delivered order-1: 2 bolos * 0.2kg = 0.4kg  
            // Total reserved for chocolate = 0.7kg (preparing + delivered are both 'reserved')
            const chocolateAnalysis = analysis.find(a => a.ingredient.id === 'ing-3');
            expect(chocolateAnalysis?.reserved).toBeCloseTo(0.7, 1);  // 0.3 + 0.4
        });

        it('should identify critical stock status', () => {
            // Create scenario where demand exceeds stock
            const lowStockIngredients = mockIngredients.map(i => ({
                ...i,
                stock_quantity: 0.1, // Very low stock
            }));

            const analysis = AnalyticsService.analyzeStockDemand(
                mockOrders,
                mockProducts,
                lowStockIngredients
            );

            const criticalItems = analysis.filter(a => a.status === 'critical');
            expect(criticalItems.length).toBeGreaterThan(0);
        });

        it('should sort by criticality (critical first)', () => {
            const lowStockIngredients = mockIngredients.map(i => ({
                ...i,
                stock_quantity: 0.1,
            }));

            const analysis = AnalyticsService.analyzeStockDemand(
                mockOrders,
                mockProducts,
                lowStockIngredients
            );

            // First items should be critical
            if (analysis.length > 1) {
                const firstStatus = analysis[0].status;
                expect(['critical', 'low']).toContain(firstStatus);
            }
        });
    });

    describe('getChartData', () => {
        it('should return correct number of days', () => {
            const chartData = AnalyticsService.getChartData(mockOrders, mockProducts, 7);
            expect(chartData.length).toBe(7);
        });

        it('should have date labels in correct format', () => {
            const chartData = AnalyticsService.getChartData(mockOrders, mockProducts, 7);

            chartData.forEach(point => {
                expect(point.label).toMatch(/^\d{2}\/\d{2}$/); // DD/MM format
            });
        });

        it('should calculate profit as revenue minus cost', () => {
            const chartData = AnalyticsService.getChartData(mockOrders, mockProducts, 30);

            chartData.forEach(point => {
                expect(point.profit).toBe(point.revenue - point.cost);
            });
        });
    });

    describe('filterOrdersByPeriod', () => {
        it('should filter by day count', () => {
            // Mock orders with recent dates
            const recentOrders = [
                { ...mockOrders[0], delivery_date: new Date().toISOString().split('T')[0] },
                { ...mockOrders[1], delivery_date: '2020-01-01' }, // Old order
            ];

            const filtered = AnalyticsService.filterOrdersByPeriod(recentOrders as any, '7');
            expect(filtered.length).toBe(1); // Only recent order
        });

        it('should filter by custom range', () => {
            const filtered = AnalyticsService.filterOrdersByPeriod(
                mockOrders,
                'custom',
                { start: '2026-01-10', end: '2026-01-11' }
            );

            // Orders matching: order-1 (2026-01-10) and order-3 (2026-01-11)
            expect(filtered.length).toBe(2);
            expect(filtered.some(o => o.id === 'order-1')).toBe(true);
            expect(filtered.some(o => o.id === 'order-3')).toBe(true);
        });

        it('should return all if period is invalid', () => {
            const filtered = AnalyticsService.filterOrdersByPeriod(mockOrders, 'invalid');
            expect(filtered.length).toBe(mockOrders.length);
        });
    });

    describe('formatCurrency', () => {
        it('should format in BRL currency', () => {
            const formatted = AnalyticsService.formatCurrency(1234.56);
            expect(formatted).toContain('1.234,56');
            expect(formatted).toContain('R$');
        });
    });

    describe('formatPercent', () => {
        it('should format with 1 decimal place', () => {
            expect(AnalyticsService.formatPercent(33.333)).toBe('33.3%');
            expect(AnalyticsService.formatPercent(100)).toBe('100.0%');
        });
    });
});
