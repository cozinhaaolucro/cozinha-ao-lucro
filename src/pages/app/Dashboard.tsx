import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { addDays, format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { DateRangePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from "@/lib/utils";
import {
    TrendingUp,
    DollarSign,
    Package,
    Users,
    AlertTriangle,
    TrendingDown,
    Percent,
    ShoppingCart,
    CheckCircle,
    XCircle,
    AlertCircle,
    Calendar,
    Wallet,
    CreditCard,
    Lightbulb,
    FileText,
    Target
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    ResponsiveContainer
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { getOrdersByDateRange, getActiveOrders, getCustomers, getProducts, getIngredients } from '@/lib/database';
import type { OrderWithDetails, Customer, Product, Ingredient, ProductWithIngredients, ProductIngredientWithDetails } from '@/types/database';

interface StockDemandAnalysis {
    ingredient: Ingredient;
    stock: number;
    demand: number;
    balance: number;
    status: 'sufficient' | 'low' | 'critical' | 'unused';
}

import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { CostBreakdownChart } from '@/components/dashboard/CostBreakdownChart';
import { DashboardInsights } from '@/components/dashboard/DashboardInsights';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { Info } from 'lucide-react';

import { seedAccount } from '@/lib/seeding';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

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
        chartData, // Revenue Chart Data from hook? The hook has getChartData but maybe needs checking
        // Actually the hook calculates chartData based on filteredOrders.
        // But Dashboard.tsx has its own 'dailyData' memo that is quite complex (average ticket etc).
        // Let's see if we can use the hook's data or if we keep the local memo for now but based on the hook's orders.
        // The hook returns 'orders' which are now filtered.
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

    // Helper to calculate product cost (still used in Top Profitable Products local calc if needed, 
    // but the hook might provide productPerformance. Let's iterate.
    // Dashboard.tsx has 'topProfitableProducts' memo. The hook has 'productPerformance'.
    // let's try to use the hook's returned data for everything possible to clean up.

    // For now, let's keep the local specific visualizations if they differ, but feed them with hook data.

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

    // Stock vs demand analysis for pending orders (Future Demand)
    // Stock vs demand analysis for pending orders (Future Demand)
    // Stock vs demand analysis for pending orders (Future Demand)
    // Stock vs demand analysis (Provided by hook)
    // const stockAnalysis = ... (Removed, using hook's stockAnalysis)

    // Financial metrics (Provided by hook)
    // const metric = ... (Removed, using hook's metrics)

    // Delivered orders revenue (confirmed sales)
    // Removed specific delivered calc if not used, or re-implement if needed. 
    // Assuming 'orders' (which are filtered by date) are the base for revenue.

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
    }, [orders, dateRange]); // Recompute when orders (data) or range (x-axis) changes

    // Custom tooltip component
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CustomTooltip = ({ active, payload, label, type }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border rounded-lg shadow-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    {type === 'orders' && (
                        <p className="font-bold text-lg">{payload[0].value} pedidos</p>
                    )}
                    {type === 'revenue' && (
                        <p className="font-bold text-lg text-success">R$ {payload[0].value.toFixed(2)}</p>
                    )}
                </div>
            );
        }
        return null;
    };



    const clearDateFilter = () => {
        setDateRange(undefined);
    };

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
                    <p className="text-sm text-muted-foreground">Análise completa do seu negócio</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <DateRangePicker
                        date={dateRange}
                        setDate={setDateRange}
                        className="w-[300px]"
                    />
                </div>


            </div>

            <DashboardInsights
                hasProducts={products.length > 0}
                hasOrders={orders.length > 0}
                hasStock={ingredients.some(i => (i.stock_quantity || 0) > 0)}
            />

            {/* Premium Goal Progress */}
            <div className="mt-4">
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Meta de Vendas - Neo-Glass Aurora Design */}
                    <Card className="md:col-span-2 relative overflow-hidden border border-border/60 shadow-elegant group bg-white">
                        {/* Subtle Premium Gradient Stroke - Top */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-50" />

                        {/* Glass Overlay & Border */}
                        <div className="absolute inset-0 border border-transparent transition-colors duration-500 rounded-xl" />

                        <CardContent className="p-6 relative z-10 flex flex-col justify-center h-full">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="space-y-3 text-center md:text-left flex-1">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 mb-2">
                                        <Target className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Meta Mensal</span>
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
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-medium">Progresso</span>
                                            <span className="text-lg font-bold" style={{ color: '#2e5b60' }}>{((totalRevenue / 10000) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-muted-foreground font-medium">Restante</span>
                                            <span className="text-sm font-bold text-foreground">R$ {Math.max(0, 10000 - totalRevenue).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="relative h-3 w-full bg-muted/50 rounded-full overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-1"
                                            style={{
                                                width: `${Math.min(100, (totalRevenue / 10000) * 100)}%`,
                                                background: 'linear-gradient(90deg, #2e5b60 0%, #5F98A1 100%)',
                                            }}
                                        >
                                            {/* Glow tip removed for minimalism */}
                                        </div>
                                    </div>

                                    <p className="text-center text-xs text-muted-foreground font-medium pt-1">
                                        {totalRevenue >= 10000 ? "🎉 Meta atingida com sucesso!" : "Continue acelerando!"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dica do Especialista - Clean White */}
                    <Card className="overflow-hidden border border-border/60 shadow-elegant relative bg-white">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#5F98A1] to-[#2e5b60]" />

                        {/* Subtle background decoration */}
                        <div className="absolute -right-6 -bottom-6 opacity-[0.03] text-primary">
                            <Lightbulb className="w-32 h-32" style={{ color: '#2e5b60' }} />
                        </div>

                        <CardContent className="p-5 flex flex-col justify-center h-full space-y-3 relative">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-[#5F98A1]/10 rounded-full text-[#5F98A1]">
                                    <Lightbulb className="w-4 h-4" />
                                </div>
                                <h3 className="font-semibold text-sm text-foreground">Dica do Especialista</h3>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium line-clamp-3">
                                {totalProfit > 0 && profitMargin < 30 ? (
                                    "Sua margem está abaixo de 30%. Avalie se é possível reduzir o desperdício de insumos ou ajustar o preço de seus pratos principais."
                                ) : totalRevenue > 5000 ? (
                                    "Excelentes vendas! Crie combos com seus produtos mais lucrativos para aumentar o ticket médio."
                                ) : ingredients.some(i => (i.stock_quantity ?? 0) <= (i.min_stock_threshold ?? 5)) ? (
                                    "Atenção ao estoque crítico! Reponha itens essenciais agora para garantir que sua produção não pare."
                                ) : (
                                    "Use o CRM para reconquistar inativos! Clientes que não compram há 30 dias podem voltar com um cupom especial."
                                )}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Financial cards */}
            <div className="mt-4">
                <TooltipProvider>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                        {/* Receita Total */}
                        <Card className="relative overflow-hidden bg-white shadow-elegant border border-border/60 hover:shadow-hover transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-3 bg-transparent border-none shadow-none">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg transition-colors bg-[#C9A34F]/10">
                                        <DollarSign className="h-4 w-4" style={{ color: '#C9A34F' }} />
                                    </div>
                                    <CardTitle className="text-xs font-bold text-muted-foreground">Receita Total</CardTitle>
                                    <UITooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3 w-3 text-muted-foreground/50 hover:text-foreground cursor-help transition-colors" />
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="bg-popover text-popover-foreground border-border shadow-lg">
                                            <p className="w-64 text-xs">
                                                Soma de todos os pedidos finalizados (Entregues) e em produção no período selecionado.
                                            </p>
                                        </TooltipContent>
                                    </UITooltip>
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-2">
                                <div className="text-lg font-bold text-foreground">R$ {totalRevenue.toFixed(2)}</div>
                                <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                    Vendas brutas totais
                                </p>
                            </CardContent>
                        </Card>

                        {/* Lucro Líquido */}
                        <Card className="relative overflow-hidden bg-white shadow-elegant border border-border/60 hover:shadow-hover transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-3 bg-transparent border-none shadow-none">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg transition-colors bg-[#4C9E7C]/10">
                                        <Wallet className="h-4 w-4" style={{ color: '#4C9E7C' }} />
                                    </div>
                                    <CardTitle className="text-xs font-bold text-muted-foreground">Lucro Líquido</CardTitle>
                                    <UITooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3 w-3 text-muted-foreground/50 hover:text-foreground cursor-help transition-colors" />
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="bg-popover text-popover-foreground border-border shadow-lg">
                                            <p className="w-64 text-xs">
                                                Quanto sobrou no seu bolso após descontar o custo dos ingredientes de cada venda.
                                            </p>
                                        </TooltipContent>
                                    </UITooltip>
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-2">
                                <div className="text-lg font-bold text-foreground">R$ {totalProfit.toFixed(2)}</div>
                                <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                    O que sobra no bolso
                                </p>
                            </CardContent>
                        </Card>

                        {/* Custo Total */}
                        <Card className="relative overflow-hidden bg-white shadow-elegant border border-border/60 hover:shadow-hover transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-3 bg-transparent border-none shadow-none">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg transition-colors bg-[#68A9CA]/10">
                                        <CreditCard className="h-4 w-4" style={{ color: '#68A9CA' }} />
                                    </div>
                                    <CardTitle className="text-xs font-bold text-muted-foreground">Custo Total</CardTitle>
                                    <UITooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3 w-3 text-muted-foreground/50 hover:text-foreground cursor-help transition-colors" />
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="bg-popover text-popover-foreground border-border shadow-lg">
                                            <p className="w-64 text-xs">
                                                Total gasto em insumos e ingredientes para produzir as vendas do período.
                                            </p>
                                        </TooltipContent>
                                    </UITooltip>
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-2">
                                <div className="text-lg font-bold text-foreground">R$ {totalCost.toFixed(2)}</div>
                                <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                    Gasto com ingredientes
                                </p>
                            </CardContent>
                        </Card>

                        {/* Margem Bruta */}
                        <Card className="relative overflow-hidden bg-white shadow-elegant border border-border/60 hover:shadow-hover transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-3 bg-transparent border-none shadow-none">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg transition-colors bg-[#61888c]/10">
                                        <TrendingUp className="h-4 w-4" style={{ color: '#61888c' }} />
                                    </div>
                                    <CardTitle className="text-xs font-bold text-muted-foreground">Margem Bruta</CardTitle>
                                    <UITooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3 w-3 text-muted-foreground/50 hover:text-foreground cursor-help transition-colors" />
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="bg-popover text-popover-foreground border-border shadow-lg">
                                            <p className="w-64 text-xs">
                                                A porcentagem do seu faturamento que é lucro. Maiores margens indicam maior eficiência.
                                            </p>
                                        </TooltipContent>
                                    </UITooltip>
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-2">
                                <div className="text-lg font-bold text-foreground">{profitMargin.toFixed(1)}%</div>
                                <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                    Eficiência das vendas
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TooltipProvider>
            </div>



            {/* Clean Charts Grid */}
            <div className="mt-4">
                <div className="space-y-6">
                    {/* Main Charts */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <RevenueChart data={dailyData} />
                        <CostBreakdownChart data={
                            orders.flatMap(o => o.items || []).reduce((acc, item) => {
                                const prod = products.find(p => p.id === item.product_id);
                                if (!prod?.product_ingredients) return acc;

                                prod.product_ingredients.forEach(pi => {
                                    if (!pi.ingredient) return;
                                    const cost = (pi.ingredient.cost_per_unit || 0) * pi.quantity * item.quantity;
                                    const existing = acc.find(x => x.name === pi.ingredient!.name);
                                    if (existing) existing.value += cost;
                                    else acc.push({ name: pi.ingredient.name, value: cost });
                                });
                                return acc;
                            }, [] as { name: string; value: number }[])
                        } />
                    </div>



                    {/* Stock vs demand and top products */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="relative shadow-elegant overflow-hidden border border-border/60 z-10 bg-white">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-foreground">
                                    <div className="p-1.5 bg-[#5F98A1]/10 rounded-lg">
                                        <Package className="w-5 h-5 text-[#5F98A1]" />
                                    </div>
                                    Estoque vs Demanda
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                    {stockAnalysis.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">Nenhum ingrediente em uso</p>
                                    ) : (
                                        stockAnalysis
                                            .map(item => (
                                                <div key={item.ingredient.id} className="flex items-center justify-between border-b border-border/40 pb-2 p-2 rounded hover:bg-muted/30 transition-colors duration-200 group">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        {item.status === 'sufficient' && <CheckCircle className="w-4 h-4 text-[#5F98A1] group-hover:scale-110 transition-transform" />}
                                                        {(item.status === 'low' || item.status === 'critical') && <AlertCircle className="w-4 h-4 text-[#C76E60] group-hover:scale-110 transition-transform" />}
                                                        {item.status === 'unused' && <AlertCircle className="w-4 h-4 text-muted-foreground/40" />}
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-sm text-foreground">{item.ingredient.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Estoque: <span className="font-mono text-foreground/80">{item.stock.toFixed(2)}</span> / Demanda: <span className="font-mono text-foreground/80">{item.demand.toFixed(2)}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "whitespace-nowrap border-0 font-bold",
                                                            item.status === 'sufficient' ? 'bg-[#5F98A1]/10 text-[#5F98A1]' :
                                                                (item.status === 'low' || item.status === 'critical') ? 'bg-[#C76E60]/10 text-[#C76E60]' :
                                                                    'bg-muted text-muted-foreground'
                                                        )}
                                                    >
                                                        {item.balance > 0 ? '+' : ''}{item.balance.toFixed(1)} {item.ingredient.unit}
                                                    </Badge>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="relative shadow-elegant overflow-hidden border border-border/60 z-10 bg-white">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-foreground">
                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                    </div>
                                    Produtos Mais Lucrativos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                    {topProfitableProducts.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma venda no período</p>
                                    ) : (
                                        topProfitableProducts.map((p, idx) => (
                                            <div key={idx} className="flex items-center justify-between border-b border-border/40 pb-2">
                                                <div className="flex items-center gap-2">
                                                    {products.find(prod => prod.name === p.name)?.image_url ? (
                                                        <div className="w-8 h-8 rounded overflow-hidden bg-muted ring-1 ring-border">
                                                            <img
                                                                src={products.find(prod => prod.name === p.name)?.image_url}
                                                                alt={p.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="font-bold bg-muted text-muted-foreground border-border">{idx + 1}º</Badge>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-sm text-foreground">{p.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {p.quantity} un • Margem {p.margin.toFixed(1)}%
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-sm font-bold`} style={{ color: p.profit >= 0 ? '#2FBF71' : '#C76E60' }}>
                                                        {p.profit > 0 ? '+' : ''}R$ {p.profit.toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">R$ {p.revenue.toFixed(2)}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>


                </div>
            </div>
        </div >
    );
};

export default Dashboard;
