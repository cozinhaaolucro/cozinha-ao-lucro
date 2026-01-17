import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
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
import { getOrders, getCustomers, getProducts, getIngredients } from '@/lib/database';
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

const Dashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<ProductWithIngredients[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [appliedRange, setAppliedRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    useEffect(() => {
        if (!dateRange || (dateRange.from && dateRange.to)) {
            setAppliedRange(dateRange);
        }
    }, [dateRange]);
    const [isLoading, setIsLoading] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        const checkSeeding = async () => {
            const shouldSeed = localStorage.getItem('should_seed_account');
            if (shouldSeed === 'true') {
                localStorage.removeItem('should_seed_account');
                await seedAccount();
            }
        };

        checkSeeding().then(() => loadData());

        // Real-time synchronization
        const channel = supabase
            .channel('dashboard_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                loadData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, () => {
                loadData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [dataLoaded, appliedRange]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [ordersRes, customersRes, productsRes, ingredientsRes] = await Promise.all([
                getOrders(),
                getCustomers(),
                getProducts(),
                getIngredients(),
            ]);
            if (ordersRes.data) setOrders(ordersRes.data);
            if (customersRes.data) setCustomers(customersRes.data);
            if (productsRes.data) setProducts(productsRes.data as ProductWithIngredients[]);
            if (ingredientsRes.data) setIngredients(ingredientsRes.data);
            setDataLoaded(true);
        } finally {
            // Small delay to ensure smooth transition
            setTimeout(() => setIsLoading(false), 100);
        }
    };

    // Helper: filter orders by selected date range
    const getFilteredOrders = () => {
        if (!appliedRange?.from) return orders;

        const start = new Date(appliedRange.from);
        start.setHours(0, 0, 0, 0);

        const end = appliedRange.to ? new Date(appliedRange.to) : new Date(start);
        end.setHours(23, 59, 59, 999);

        return orders.filter(o => {
            if (!o.created_at) return false;
            const d = new Date(o.created_at);
            return d >= start && d <= end && o.status !== 'cancelled';
        });
    };

    // Calculate product cost based on its recipe
    const getProductCost = (product: ProductWithIngredients): number => {
        if (!product.product_ingredients) return 0;
        return product.product_ingredients.reduce((total: number, r: ProductIngredientWithDetails) => {
            if (!r.ingredient) return total;
            return total + (r.ingredient.cost_per_unit ?? 0) * r.quantity;
        }, 0);
    };

    // Calculate total cost of an order
    const getOrderCost = (order: OrderWithDetails): number => {
        // Use historical cost if available (Bulletproof integrity)
        if (order.total_cost && Number(order.total_cost) > 0) {
            return Number(order.total_cost);
        }

        // Fallback for very old orders or orders not yet processed by trigger
        if (!order.items) return 0;
        return order.items.reduce((sum, item) => {
            const prod = products.find(p => p.id === item.product_id);
            if (!prod) return sum;
            const fallbackCost = getProductCost(prod);
            return sum + fallbackCost * item.quantity;
        }, 0);
    };

    // Stock vs demand analysis for pending orders (Future Demand)
    // Stock vs demand analysis for pending orders (Future Demand)
    const calculateStockDemand = (): StockDemandAnalysis[] => {
        // We ONLY look at 'pending' orders for demand forecast.
        // 'preparing' orders have ALREADY triggered the stock deduction in the DB.
        const pending = orders.filter(o => o.status === 'pending');
        const demandMap = new Map<string, number>();
        pending.forEach(order => {
            order.items?.forEach(item => {
                const prod = products.find(p => p.id === item.product_id);
                if (!prod?.product_ingredients) return;
                prod.product_ingredients.forEach((r: ProductIngredientWithDetails) => {
                    if (!r.ingredient) return;
                    const needed = r.quantity * item.quantity;
                    demandMap.set(r.ingredient.id, (demandMap.get(r.ingredient.id) || 0) + needed);
                });
            });
        });
        return ingredients.map(ing => {
            const stock = ing.stock_quantity ?? 0;
            const demand = demandMap.get(ing.id) ?? 0;
            const balance = stock - demand;

            let status: 'sufficient' | 'low' | 'critical' | 'unused' = 'sufficient';

            if (stock === 0 && demand === 0) {
                status = 'unused'; // Cinza: Sem estoque mas também sem demanda
            } else if (balance < 0) {
                status = 'critical'; // Vermelho: Demanda excedeu estoque
            } else {
                const initial = stock; // As reduction hasn't happened yet for pending orders, stock IS the "before" value.
                const ratio = initial > 0 ? balance / initial : 0;

                // User: "Amarelo(Para quando a demanda do dia fez o ingrediente ir para 30% do que era antes)"
                // This implies remaining stock is less than 30% of initial.
                if (ratio < 0.3) {
                    status = 'low'; // Amarelo
                } else {
                    status = 'sufficient'; // Verde: Estoque acima de 30%
                }
            }

            return { ingredient: ing, stock, demand, balance, status };
        }).filter(i => i.status !== 'unused' || i.stock > 0);
    };

    const filteredOrders = getFilteredOrders();

    // Financial metrics
    const totalRevenue = filteredOrders.reduce((s, o) => s + o.total_value, 0);
    const totalCost = filteredOrders.reduce((s, o) => s + getOrderCost(o), 0);
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = filteredOrders.length ? totalRevenue / filteredOrders.length : 0;
    const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;

    // Delivered orders revenue (confirmed sales)
    const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered');
    const deliveredRevenue = deliveredOrders.reduce((s, o) => s + o.total_value, 0);

    // Stock analysis
    const stockAnalysis = calculateStockDemand();
    const criticalStock = stockAnalysis.filter(s => s.status === 'critical');

    // Top profitable products
    const productSales = new Map<string, { name: string; quantity: number; revenue: number; cost: number; profit: number; margin: number }>();
    filteredOrders.forEach(order => {
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
    const topProfitableProducts = Array.from(productSales.values())
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5);

    // Last N days data for chart
    const getChartData = () => {
        const days: { date: string; revenue: number; profit: number; ordersCount: number; averageTicket: number }[] = [];

        // Determine range
        let start: Date;
        let end: Date;

        if (appliedRange?.from) {
            start = new Date(appliedRange.from);
            end = appliedRange.to ? new Date(appliedRange.to) : new Date(start);
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

            const dayOrders = filteredOrders.filter(o => {
                if (!o.created_at) return false;
                const od = new Date(o.created_at);
                return od.toDateString() === d.toDateString();
            });
            const rev = dayOrders.reduce((s, o) => s + o.total_value, 0);
            const cost = dayOrders.reduce((s, o) => s + getOrderCost(o), 0);
            const count = dayOrders.length;
            days.push({
                date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', ''),
                revenue: rev,
                profit: rev - cost,
                ordersCount: count,
                averageTicket: count > 0 ? rev / count : 0
            });
        }
        return days;
    };
    const dailyData = getChartData();

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
                                        <h3 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                                            R$ {totalRevenue.toFixed(2)}
                                        </h3>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            de <span className="text-foreground font-bold">R$ 10.000,00</span> projetados
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 w-full max-w-sm space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-medium">Progresso</span>
                                            <span className="text-lg font-bold text-primary">{((totalRevenue / 10000) * 100).toFixed(1)}%</span>
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
                                                background: 'linear-gradient(90deg, hsl(186, 35%, 28%) 0%, hsl(187, 29%, 58%) 100%)', // Primary to Secondary
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
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-secondary to-primary/60" />

                        {/* Subtle background decoration */}
                        <div className="absolute -right-6 -bottom-6 opacity-[0.03] text-primary">
                            <Lightbulb className="w-32 h-32" />
                        </div>

                        <CardContent className="p-5 flex flex-col justify-center h-full space-y-3 relative">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-secondary/10 rounded-full text-secondary">
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

                        {/* Receita Total - Minimalist */}
                        <Card className="relative overflow-hidden bg-white shadow-elegant border border-border/60 hover:shadow-hover transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-3 bg-transparent border-none shadow-none">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <DollarSign className="h-4 w-4 text-primary" />
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
                                    <span className="w-1 h-1 rounded-full bg-primary" /> Vendas brutas totais
                                </p>
                            </CardContent>
                        </Card>

                        {/* Lucro Líquido - Minimalist */}
                        <Card className="relative overflow-hidden bg-white shadow-elegant border border-border/60 hover:shadow-hover transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-3 bg-transparent border-none shadow-none">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <Wallet className="h-4 w-4 text-primary" />
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
                                    <span className="w-1 h-1 rounded-full bg-emerald-500" /> O que sobra no bolso
                                </p>
                            </CardContent>
                        </Card>

                        {/* Custo Total - Minimalist */}
                        <Card className="relative overflow-hidden bg-white shadow-elegant border border-border/60 hover:shadow-hover transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-3 bg-transparent border-none shadow-none">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <CreditCard className="h-4 w-4 text-primary" />
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
                                    <span className="w-1 h-1 rounded-full bg-red-500" /> Gasto com ingredientes
                                </p>
                            </CardContent>
                        </Card>

                        {/* Margem Bruta - Minimalist */}
                        <Card className="relative overflow-hidden bg-white shadow-elegant border border-border/60 hover:shadow-hover transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-3 bg-transparent border-none shadow-none">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <TrendingUp className="h-4 w-4 text-primary" />
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
                                    <span className="w-1 h-1 rounded-full bg-financial" /> Eficiência das vendas
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
                    {/* Main Charts */}
                    {/* Main Charts */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <RevenueChart data={dailyData} />
                        <CostBreakdownChart data={
                            filteredOrders.flatMap(o => o.items || []).reduce((acc, item) => {
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
                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                        <Package className="w-5 h-5 text-primary" />
                                    </div>
                                    Estoque vs Demanda
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                    {/* Critical Alerts Integration */}
                                    {criticalStock.length > 0 && (
                                        <div className="mb-4 space-y-2 border-b border-red-500/20 pb-4">
                                            <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2 animate-pulse">
                                                <AlertTriangle className="w-4 h-4" /> Ação Necessária
                                            </h4>
                                            {criticalStock.map(item => (
                                                <div key={`critical-${item.ingredient.id}`} className="flex items-center justify-between text-sm bg-white p-2 rounded border" style={{ borderColor: 'rgba(199, 110, 96, 1)' }}>
                                                    <div className="flex items-center gap-2">
                                                        <XCircle className="w-4 h-4 text-red-600" />
                                                        <span className="font-medium" style={{ color: '#62696f' }}>{item.ingredient.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge className="text-stone-50" style={{ backgroundColor: 'rgba(250, 250, 249, 1)', color: 'rgba(199, 110, 96, 1)', border: '1px solid rgba(199, 110, 96, 1)' }}>
                                                            -{Math.abs(item.balance).toFixed(1)} {item.ingredient.unit}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {stockAnalysis.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">Nenhum ingrediente em uso</p>
                                    ) : (
                                        stockAnalysis
                                            .filter(item => item.status !== 'critical') // Avoid dupes if we only want criticals at top
                                            .map(item => (
                                                <div key={item.ingredient.id} className="flex items-center justify-between border-b border-border/40 pb-2 p-2 rounded hover:bg-muted/30 transition-colors duration-200 group">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        {item.status === 'sufficient' && <CheckCircle className="w-4 h-4 text-success group-hover:scale-110 transition-transform" />}
                                                        {item.status === 'low' && <AlertCircle className="w-4 h-4 text-warning group-hover:scale-110 transition-transform" />}
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
                                                            item.status === 'sufficient' ? 'bg-success/10 text-success' :
                                                                item.status === 'low' ? 'bg-warning/10 text-warning' :
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
                                                    <div className={`text-sm font-bold ${p.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
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
