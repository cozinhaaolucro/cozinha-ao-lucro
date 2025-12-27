import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FadeIn } from '@/components/ui/fade-in';
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
    Calendar
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { getOrders, getCustomers, getProducts, getIngredients } from '@/lib/database';
import type { OrderWithDetails, Customer, Product, Ingredient, ProductWithIngredients, ProductIngredientWithDetails } from '@/types/database';

interface StockDemandAnalysis {
    ingredient: Ingredient;
    stock: number;
    demand: number;
    balance: number;
    status: 'sufficient' | 'low' | 'critical' | 'unused';
}

import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { CostBreakdownChart } from '@/components/dashboard/CostBreakdownChart';
import { DashboardInsights } from '@/components/dashboard/DashboardInsights';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

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
        // Only load data once when component mounts
        if (!dataLoaded) {
            checkSeeding().then(() => loadData());
        }
    }, [dataLoaded]);

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
            end = new Date(dateFilter.end);
            end.setHours(23, 59, 59, 999);
        } else {
            const daysAgo = parseInt(period);
            start = new Date();
            start.setDate(start.getDate() - daysAgo);
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
        if (!order.items) return 0;
        return order.items.reduce((sum, item) => {
            const prod = products.find(p => p.id === item.product_id);
            if (!prod) return sum;
            const cost = getProductCost(prod);
            return sum + cost * item.quantity;
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
            const cost = getProductCost(prod);
            const revenue = item.subtotal;
            const profit = revenue - cost * item.quantity;
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
            entry.cost += cost * item.quantity;
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

            {/* Financial cards */}
            <FadeIn delay={50}>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">R$ {totalRevenue.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">{filteredOrders.length} pedidos</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-red-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">R$ {totalCost.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Ingredientes e produção</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>R$ {totalProfit.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Receita - Custos</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
                            <Percent className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-purple-600' : 'text-red-600'}`}>{profitMargin.toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground">Lucro sobre receita</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-orange-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Receita Entregues</CardTitle>
                            <CheckCircle className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">R$ {deliveredRevenue.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">{deliveredOrders.length} pedidos entregues</p>
                        </CardContent>
                    </Card>
                </div>
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
                    <Card className="bg-gradient-to-r from-purple-50 to-background border-purple-100">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                        <ShoppingCart className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Ticket Médio</p>
                                        <p className="text-xl font-bold text-purple-600">R$ {averageOrderValue.toFixed(2)}</p>
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
                                                    variant={
                                                        item.status === 'sufficient' ? 'default' :
                                                            item.status === 'low' ? 'secondary' :
                                                                item.status === 'critical' ? 'destructive' : 'outline'
                                                    }
                                                    className={
                                                        item.status === 'sufficient' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                                            item.status === 'low' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                                                                item.status === 'unused' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : ''
                                                    }
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
                                                    <Badge variant="outline" className="font-bold">{idx + 1}º</Badge>
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
                            onClick={() => navigate('/app/shopping-list')} // Verify route
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Lista de Compras</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Lista de Compras</div>
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
