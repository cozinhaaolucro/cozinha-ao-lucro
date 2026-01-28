import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { supabase } from '@/lib/supabase';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import type { ProductWithIngredients, OrderWithDetails } from '@/types/database';

// Components
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardInsights } from '@/components/dashboard/DashboardInsights';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { RevenueMetrics } from '@/components/dashboard/RevenueMetrics';
import { StockDemandList } from '@/components/dashboard/StockDemandList';
import { TopProductsList } from '@/components/dashboard/TopProductsList';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { CostBreakdownChart } from '@/components/dashboard/CostBreakdownChart';

// Extra Visuals (Leaving the Goal/Tip cards here as "Page Specific" or could separate later)
import { Card, CardContent } from '@/components/ui/card';
import { Target, Lightbulb } from 'lucide-react';


const Dashboard = () => {
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    // Map DateRange to DashboardFilters
    const filters = useMemo(() => {
        if (dateRange?.from && dateRange?.to) {
            return {
                period: 'custom',
                customRange: {
                    start: dateRange.from.toISOString(),
                    end: dateRange.to.toISOString(),
                }
            };
        }
        return { period: '30' }; // Default
    }, [dateRange]);

    // Use the Hook
    const {
        metrics,
        stockAnalysis,
        chartData,
        orders,      // These are filtered by date
        activeOrders, // These are for stock
        products,
        ingredients,
        isLoading,
        refetch
    } = useDashboardMetrics(filters);

    const {
        revenue: totalRevenue,
        cost: totalCost,
        profit: totalProfit,
        margin: profitMargin
    } = metrics;

    // Real-time synchronization
    useEffect(() => {
        const channel = supabase
            .channel('dashboard_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                refetch();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, () => {
                refetch();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [refetch]);

    const getProductCost = (product: ProductWithIngredients): number => {
        if (!product.product_ingredients) return 0;
        return product.product_ingredients.reduce((total: number, r: any) => {
            if (!r.ingredient) return total;
            return total + (r.ingredient.cost_per_unit ?? 0) * r.quantity;
        }, 0);
    };

    const getOrderCost = (order: OrderWithDetails): number => {
        if (order.total_cost && Number(order.total_cost) > 0) return Number(order.total_cost);
        if (!order.items) return 0;
        return order.items.reduce((sum, item) => {
            const prod = products.find(p => p.id === item.product_id);
            if (!prod) return sum;
            return sum + getProductCost(prod) * item.quantity;
        }, 0);
    };

    // Calculate Cost Breakdown for the Donut Chart
    const costBreakdownData = useMemo(() => {
        return orders.flatMap(o => o.items || []).reduce((acc, item) => {
            const prod = products.find(p => p.id === item.product_id);
            if (!prod?.product_ingredients) return acc;

            prod.product_ingredients.forEach((pi: any) => {
                if (!pi.ingredient) return;
                const cost = (pi.ingredient.cost_per_unit || 0) * pi.quantity * item.quantity;
                const existing = acc.find(x => x.name === pi.ingredient!.name);
                if (existing) existing.value += cost;
                else acc.push({ name: pi.ingredient.name, value: cost });
            });
            return acc;
        }, [] as { name: string; value: number }[]);
    }, [orders, products]);

    // Top profitable products
    const topProfitableProducts = useMemo(() => {
        const productSales = new Map<string, { name: string; quantity: number; revenue: number; cost: number; profit: number; margin: number }>();
        orders.forEach(order => {
            order.items?.forEach(item => {
                const prod = products.find(p => p.id === item.product_id);
                if (!prod) return;

                // Use historical unit_cost from item if available, otherwise fallback
                const unitCost = (item as any).unit_cost > 0 ? (item as any).unit_cost : getProductCost(prod);
                const revenue = item.subtotal;
                const profit = revenue - unitCost * item.quantity;

                const entry = productSales.get(item.product_name) || {
                    name: item.product_name,
                    quantity: 0,
                    revenue: 0,
                    cost: 0,
                    profit: 0,
                    margin: 0,
                };
                entry.quantity += item.quantity;
                entry.revenue += revenue;
                entry.cost += unitCost * item.quantity;
                entry.profit += profit;
                entry.margin = entry.revenue > 0 ? (entry.profit / entry.revenue) * 100 : 0;
                productSales.set(item.product_name, entry);
            });
        });
        return Array.from(productSales.values())
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 5);
    }, [orders, products]);

    // Last N days data for chart
    const dailyData = useMemo(() => {
        const days: { date: string; revenue: number; profit: number; ordersCount: number; averageTicket: number }[] = [];

        // Determine range
        let start: Date;
        let end: Date;

        if (dateRange?.from) {
            start = new Date(dateRange.from);
            end = dateRange.to ? new Date(dateRange.to) : new Date(start);
        } else {
            // Fallback
            end = new Date();
            start = subDays(end, 30);
        }

        // Normalize time
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const numDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        for (let i = numDays - 1; i >= 0; i--) {
            const d = new Date(end);
            d.setDate(d.getDate() - i); // Go backwards from end

            const dayOrders = orders.filter(o => {
                if (!o.created_at) return false;
                const od = new Date(o.created_at);
                return od.toDateString() === d.toDateString();
            });
            const rev = dayOrders.reduce((s, o) => s + o.total_value, 0);
            const cost = dayOrders.reduce((s, o) => s + getOrderCost(o), 0);
            const count = dayOrders.length;
            days.push({
                date: format(d, 'dd MMM', { locale: ptBR }).toLowerCase(),
                revenue: rev,
                profit: rev - cost,
                ordersCount: count,
                averageTicket: count > 0 ? rev / count : 0
            });
        }
        return days;
    }, [orders, dateRange]);

    const clearDateFilter = () => {
        setDateRange(undefined);
    };

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-6">
            <DashboardFilters dateRange={dateRange} setDateRange={setDateRange} />

            <DashboardInsights
                hasProducts={products.length > 0}
                hasOrders={orders.length > 0}
                hasStock={ingredients.some(i => (i.stock_quantity || 0) > 0)}
            />

            {/* Premium Goal Progress */}
            <div className="mt-4">
                <div className="grid gap-3 md:gap-4 md:grid-cols-3">
                    {/* Meta de Vendas - Neo-Glass Aurora Design */}
                    <Card className="md:col-span-2 relative overflow-hidden border border-border/60 shadow-elegant group bg-white">
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-50" />
                        <div className="absolute inset-0 border border-transparent transition-colors duration-500 rounded-xl" />
                        <CardContent className="p-4 md:p-6 relative z-10 flex flex-col justify-center h-full">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
                                <div className="w-full text-center md:text-left flex-1">
                                    <div className="flex justify-between md:block items-center mb-1">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 mb-2">
                                            <Target className="w-3.5 h-3.5 text-primary" />
                                            <span className="text-xs font-bold text-primary uppercase tracking-wider">Meta Mensal</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: '#2FBF71' }}>
                                            R$ {totalRevenue.toFixed(2)}
                                        </h3>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            de <span className="font-bold" style={{ color: '#2e5b60' }}>R$ 10.000,00</span> projetados
                                        </p>
                                    </div>
                                </div>
                                <div className="flex-1 w-full max-w-sm space-y-4">
                                    <div className="relative h-3 w-full bg-muted/50 rounded-full overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-1"
                                            style={{
                                                width: `${Math.min(100, (totalRevenue / 10000) * 100)}%`,
                                                background: 'linear-gradient(90deg, #2e5b60 0%, #5F98A1 100%)',
                                            }}
                                        />
                                    </div>
                                    <p className="hidden md:block text-center text-xs text-muted-foreground font-medium pt-1">
                                        {totalRevenue >= 10000 ? "🎉 Meta atingida com sucesso!" : "Continue acelerando!"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dica do Especialista */}
                    <Card className="block overflow-hidden border border-border/60 shadow-elegant relative bg-white">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#5F98A1] to-[#2e5b60]" />
                        <div className="absolute -right-6 -bottom-6 opacity-[0.03] text-primary">
                            <Lightbulb className="w-32 h-32" style={{ color: '#2e5b60' }} />
                        </div>
                        <CardContent className="p-4 md:p-5 flex flex-col justify-center h-full space-y-2 relative">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-[#5F98A1]/10 rounded-full text-[#5F98A1]">
                                    <Lightbulb className="w-4 h-4" />
                                </div>
                                <h3 className="font-semibold text-sm text-foreground">Dica do Especialista</h3>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium line-clamp-3">
                                {totalProfit > 0 && profitMargin < 30 ? "Sua margem está abaixo de 30%. Avalie ajustar preços." : "Foque em vender mais combos!"}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Middle Section: Metrics + Charts (Restructured per image) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 align-stretch">
                {/* Left Column (2/3 width) - Metrics Row & Revenue Chart */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <RevenueMetrics
                        ordersCount={orders.length}
                        totalRevenue={totalRevenue}
                        totalProfit={totalProfit}
                        totalCost={totalCost}
                    />
                    <RevenueChart data={dailyData} />
                </div>

                {/* Right Column (1/3 width) - Cost Breakdown Donut - Stretched to fill height */}
                <div className="lg:col-span-1 h-full pt-4">
                    <CostBreakdownChart data={costBreakdownData} className="h-full" />
                </div>
            </div>

            {/* Bottom Section: Stock vs Top Products */}
            <div className="grid gap-4 md:grid-cols-2 pb-40">
                <StockDemandList stockAnalysis={stockAnalysis} />
                <TopProductsList topProfitableProducts={topProfitableProducts} products={products} />
            </div>
        </div>
    );
};


export default Dashboard;
