import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FadeIn } from '@/components/ui/fade-in';
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
    FileText
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
    const [period, setPeriod] = useState('30');
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
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
    }, [dataLoaded, period, dateFilter]);

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

    // Helper: filter orders by selected period or date range
    const getFilteredOrders = () => {
        let start: Date;
        let end: Date = new Date();

        if (dateFilter.start && dateFilter.end) {
            start = new Date(dateFilter.start);
            start.setHours(0, 0, 0, 0); // Include full start day
            end = new Date(dateFilter.end);
            end.setHours(23, 59, 59, 999);
        } else {
            const daysAgo = parseInt(period);
            start = new Date();
            start.setDate(start.getDate() - daysAgo);
            start.setHours(0, 0, 0, 0); // Include full first day of period
        }

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
        const numDays = dateFilter.start && dateFilter.end ?
            Math.ceil((new Date(dateFilter.end).getTime() - new Date(dateFilter.start).getTime()) / (1000 * 60 * 60 * 24)) + 1 :
            Math.min(parseInt(period), 14);

        for (let i = numDays - 1; i >= 0; i--) {
            const d = new Date();
            if (dateFilter.start && dateFilter.end) {
                d.setTime(new Date(dateFilter.start).getTime() + (numDays - 1 - i) * 24 * 60 * 60 * 1000);
            } else {
                d.setDate(d.getDate() - i);
            }
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
                        <p className="font-bold text-lg text-green-600">R$ {payload[0].value.toFixed(2)}</p>
                    )}
                </div>
            );
        }
        return null;
    };



    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const clearDateFilter = () => {
        setDateFilter({ start: '', end: '' });
    };

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
                    <p className="text-muted-foreground">Análise completa do seu negócio</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={dateFilter.start}
                            onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                            className="w-36 h-9"
                        />
                        <span className="text-sm text-muted-foreground">até</span>
                        <Input
                            type="date"
                            value={dateFilter.end}
                            onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                            className="w-36 h-9"
                        />
                    </div>
                    {(dateFilter.start || dateFilter.end) ? (
                        <Button variant="ghost" size="sm" onClick={clearDateFilter}>Limpar</Button>
                    ) : (
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-[140px] h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">7 dias</SelectItem>
                                <SelectItem value="30">30 dias</SelectItem>
                                <SelectItem value="90">90 dias</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>


            </div>

            <DashboardInsights
                hasProducts={products.length > 0}
                hasOrders={orders.length > 0}
                hasStock={ingredients.some(i => (i.stock_quantity || 0) > 0)}
            />

            {/* Premium Goal Progress */}
            <FadeIn delay={75}>
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Meta de Vendas - Gradient Blue (Secondary based) */}
                    <Card className="md:col-span-2 overflow-hidden border z-10 relative shadow-xl group border-white/20"
                        style={{ background: 'linear-gradient(135deg, hsl(182, 16%, 62%) 0%, hsl(182, 20%, 50%) 100%)' }}>
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay" />
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                        <CardContent className="p-6 relative">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-1 text-center md:text-left">
                                    <h3 className="text-lg font-semibold flex items-center gap-2 justify-center md:justify-start text-white drop-shadow-sm">
                                        Meta de Vendas do Mês 🎯
                                    </h3>
                                    <p className="text-sm text-white/90">
                                        Você atingiu <span className="font-bold text-white drop-shadow-sm">R$ {totalRevenue.toFixed(2)}</span> de uma meta de <span className="font-bold">R$ 10.000,00</span>
                                    </p>
                                </div>
                                <div className="flex-1 w-full max-w-md space-y-2">
                                    <div className="flex justify-between text-xs font-medium text-white/90">
                                        <span>{((totalRevenue / 10000) * 100).toFixed(1)}%</span>
                                        <span>R$ 10.000,00</span>
                                    </div>
                                    <Progress value={(totalRevenue / 10000) * 100} className="h-3 shadow-inner bg-black/20 [&>div]:bg-[hsl(186,35%,28%)] [&>div]:shadow-lg" />
                                </div>
                                {/* Mini Block - No BG, Just White Text */}
                                <div className="hidden lg:block text-right p-3">
                                    <p className="text-sm font-medium text-white/80">Faltam apenas</p>
                                    <p className="text-2xl font-bold text-white drop-shadow-sm">R$ {Math.max(0, 10000 - totalRevenue).toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dica do Especialista - Gradient Teal (Primary based lightened) */}
                    <Card className="overflow-hidden border z-10 relative shadow-xl border-white/20"
                        style={{ background: 'linear-gradient(135deg, hsl(188, 30%, 45%) 0%, hsl(188, 34%, 35%) 100%)' }}>
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

                        <CardContent className="p-6 flex flex-col justify-center h-full space-y-3 relative">
                            <div className="flex items-center gap-2 text-white">
                                <div className="p-1.5 bg-white/20 rounded-full shadow-inner backdrop-blur-sm">
                                    <Lightbulb className="w-4 h-4 text-yellow-300 animate-pulse" />
                                </div>
                                <h3 className="font-bold text-white drop-shadow-sm">Dica do Especialista</h3>
                            </div>
                            <p className="text-sm text-white/90 leading-relaxed font-medium">
                                {totalProfit > 0 && profitMargin < 30 ? (
                                    "Sua margem está abaixo de 30%. Avalie se é possível reduzir o desperdício de insumos ou ajustar o preço de seus pratos principais."
                                ) : totalRevenue > 5000 ? (
                                    "Excelentes vendas! Crie combos com seus produtos mais lucrativos para aumentar o ticket médio e fidelizar clientes."
                                ) : ingredients.some(i => (i.stock_quantity ?? 0) <= (i.min_stock_threshold ?? 5)) ? (
                                    "Atenção ao estoque crítico! Reponha itens essenciais agora para garantir que sua produção não pare."
                                ) : (
                                    "Use o CRM para reconquistar inativos! Clientes que não compram há 30 dias podem voltar com um cupom especial."
                                )}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </FadeIn>

            {/* Financial cards */}
            <FadeIn delay={100}>
                <TooltipProvider>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                                    <UITooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="w-64 text-xs">
                                                Soma de todos os pedidos finalizados (Entregues) e em produção no período selecionado.
                                            </p>
                                        </TooltipContent>
                                    </UITooltip>
                                </div>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">Vendas brutas totais</p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                                    <UITooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="w-64 text-xs">
                                                Quanto sobrou no seu bolso após descontar o custo dos ingredientes de cada venda.
                                            </p>
                                        </TooltipContent>
                                    </UITooltip>
                                </div>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">R$ {totalProfit.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">O que sobra no bolso</p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                                    <UITooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="w-64 text-xs">
                                                Total gasto em insumos e ingredientes para produzir as vendas do período.
                                            </p>
                                        </TooltipContent>
                                    </UITooltip>
                                </div>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">R$ {totalCost.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">Gasto com ingredientes</p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-sm font-medium">Margem Bruta</CardTitle>
                                    <UITooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="w-64 text-xs">
                                                A porcentagem do seu faturamento que é lucro. Maiores margens indicam maior eficiência.
                                            </p>
                                        </TooltipContent>
                                    </UITooltip>
                                </div>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{profitMargin.toFixed(1)}%</div>
                                <p className="text-xs text-muted-foreground">Eficiência das vendas</p>
                            </CardContent>
                        </Card>
                    </div>
                </TooltipProvider>
            </FadeIn>

            {/* Critical stock alerts */}
            {criticalStock.length > 0 && (
                <FadeIn delay={100}>
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-800">
                                <AlertTriangle className="w-5 h-5" />
                                🚨 Estoque Insuficiente para Demanda Atual
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {criticalStock.map(item => (
                                    <div key={item.ingredient.id} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                                        <div className="flex items-center gap-2">
                                            <XCircle className="w-4 h-4 text-red-600" />
                                            <span className="font-medium">{item.ingredient.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-muted-foreground">Estoque: {item.stock.toFixed(2)} {item.ingredient.unit}</span>
                                            <span className="text-xs text-muted-foreground">Demanda: {item.demand.toFixed(2)} {item.ingredient.unit}</span>
                                            <Badge variant="destructive">Faltam {Math.abs(item.balance).toFixed(2)} {item.ingredient.unit}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </FadeIn>
            )}

            {/* Clean Charts Grid */}
            <FadeIn delay={150}>
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

                    {/* Ticket médio - subtle indicator */}
                    <Card className="bg-gradient-to-r from-[hsl(41,53%,95%)] to-background border-[hsl(41,53%,75%)]">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'hsl(41, 53%, 85%)' }}>
                                        <ShoppingCart className="w-5 h-5" style={{ color: 'hsl(41, 53%, 55%)' }} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ticket Médio</p>
                                        <p className="text-xl font-bold" style={{ color: 'hsl(41, 53%, 55%)' }}>R$ {averageOrderValue.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                    <p>Valor médio por pedido</p>
                                    <p>no período selecionado</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stock vs demand and top products */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Estoque vs Demanda
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[280px] overflow-y-auto">
                                    {stockAnalysis.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">Nenhum ingrediente em uso</p>
                                    ) : (
                                        stockAnalysis.map(item => (
                                            <div key={item.ingredient.id} className="flex items-center justify-between border-b pb-2">
                                                <div className="flex items-center gap-2 flex-1">
                                                    {item.status === 'sufficient' && <CheckCircle className="w-4 h-4 text-green-600" />}
                                                    {item.status === 'low' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                                                    {item.status === 'critical' && <XCircle className="w-4 h-4 text-red-600" />}
                                                    {item.status === 'unused' && <AlertCircle className="w-4 h-4 text-gray-400" />}
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">{item.ingredient.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.stock.toFixed(2)} / {item.demand.toFixed(2)} {item.ingredient.unit}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "whitespace-nowrap",
                                                        item.status === 'sufficient' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                                            item.status === 'low' ? 'bg-yellow-100 text-yellow-800 hover:bg-[hsl(182,16%,55%)] hover:text-white' :
                                                                item.status === 'critical' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                                                    'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5" />
                                    Produtos Mais Lucrativos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-[280px] overflow-y-auto">
                                    {topProfitableProducts.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma venda no período</p>
                                    ) : (
                                        topProfitableProducts.map((p, idx) => (
                                            <div key={idx} className="flex items-center justify-between border-b pb-2">
                                                <div className="flex items-center gap-2">
                                                    {products.find(prod => prod.name === p.name)?.image_url ? (
                                                        <div className="w-8 h-8 rounded overflow-hidden bg-muted">
                                                            <img
                                                                src={products.find(prod => prod.name === p.name)?.image_url}
                                                                alt={p.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="font-bold">{idx + 1}º</Badge>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-sm">{p.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {p.quantity} un • Margem {p.margin.toFixed(1)}%
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-sm font-bold ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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

                    {/* Additional metrics */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => navigate('/app/pedidos')}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pedidos Ativos</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{pendingOrdersCount}</div>
                                <p className="text-xs text-muted-foreground">Em produção/pendentes</p>
                            </CardContent>
                        </Card>
                        <Card
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => navigate('/app/clientes')}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{customers.length}</div>
                                <p className="text-xs text-muted-foreground">Total cadastrados</p>
                            </CardContent>
                        </Card>
                        <Card
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => navigate('/app/agenda')}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Agenda</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Ver Agenda</div>
                                <p className="text-xs text-muted-foreground">Organize sua produção</p>
                            </CardContent>
                        </Card>
                        <Card
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => navigate('/app/lista-inteligente')}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Lista Inteligente</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Lista Inteligente</div>
                                <p className="text-xs text-muted-foreground">Baseada em pedidos</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </FadeIn>
        </div>
    );
};

export default Dashboard;
