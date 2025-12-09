import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    BarChart3,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
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
    status: 'sufficient' | 'low' | 'critical';
}

const Dashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<ProductWithIngredients[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [period, setPeriod] = useState('30');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
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
    };

    // Helper: filter orders by selected period (days)
    const getFilteredOrders = () => {
        const daysAgo = parseInt(period);
        const start = new Date();
        start.setDate(start.getDate() - daysAgo);
        return orders.filter(o => {
            if (!o.created_at) return false;
            const d = new Date(o.created_at);
            return d >= start && o.status !== 'cancelled';
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

    // Stock vs demand analysis for pending/preparing orders
    const calculateStockDemand = (): StockDemandAnalysis[] => {
        const pending = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
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
            let status: 'sufficient' | 'low' | 'critical' = 'sufficient';
            if (balance < 0) status = 'critical';
            else if (balance < stock * 0.2) status = 'low';
            return { ingredient: ing, stock, demand, balance, status };
        }).filter(i => i.demand > 0 || i.stock > 0);
    };

    const filteredOrders = getFilteredOrders();

    // Financial metrics
    const totalRevenue = filteredOrders.reduce((s, o) => s + o.total_value, 0);
    const totalCost = filteredOrders.reduce((s, o) => s + getOrderCost(o), 0);
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = filteredOrders.length ? totalRevenue / filteredOrders.length : 0;
    const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;

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

    // Last 14 days data for chart
    // Last 14 days data for chart
    const getLast14Days = () => {
        const days: { date: string; revenue: number; profit: number; ordersCount: number; averageTicket: number }[] = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayOrders = filteredOrders.filter(o => {
                if (!o.created_at) return false;
                const od = new Date(o.created_at);
                return od.toDateString() === d.toDateString();
            });
            const rev = dayOrders.reduce((s, o) => s + o.total_value, 0);
            const cost = dayOrders.reduce((s, o) => s + getOrderCost(o), 0);
            const count = dayOrders.length;
            days.push({
                date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                revenue: rev,
                profit: rev - cost,
                ordersCount: count,
                averageTicket: count > 0 ? rev / count : 0
            });
        }
        return days;
    };
    const dailyData = getLast14Days();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
                    <p className="text-muted-foreground">Análise completa do seu negócio</p>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                        <SelectItem value="90">Últimos 90 dias</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Financial cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">R$ {totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">{filteredOrders.length} pedidos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">R$ {totalCost.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Ingredientes e produção</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>R$ {totalProfit.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Receita - Custos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
                        <Percent className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-purple-600' : 'text-red-600'}`}>{profitMargin.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Lucro sobre receita</p>
                    </CardContent>
                </Card>
            </div>

            {/* Critical stock alerts */}
            {criticalStock.length > 0 && (
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
            )}

            {/* Compact chart */}
            {/* Charts Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Pedidos no Período</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        itemStyle={{ color: '#000' }}
                                        cursor={{ fill: '#f1f5f9' }}
                                    />
                                    <Bar dataKey="ordersCount" name="Pedidos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Receita no Período</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        itemStyle={{ color: '#000' }}
                                        cursor={{ fill: '#f1f5f9' }}
                                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                                    />
                                    <Bar dataKey="revenue" name="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                        itemStyle={{ color: '#000' }}
                                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Ticket Médio']}
                                    />
                                    <Line type="monotone" dataKey="averageTicket" name="Ticket Médio" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                                                        'destructive'
                                            }
                                            className={
                                                item.status === 'sufficient' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                                    item.status === 'low' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                                                        ''
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
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {averageOrderValue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Valor médio por pedido</p>
                    </CardContent>
                </Card>

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
            </div>
        </div >
    );
};

export default Dashboard;
