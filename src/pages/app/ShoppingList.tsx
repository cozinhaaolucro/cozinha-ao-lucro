import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { getOrders, getProducts, getIngredients } from '@/lib/database';
import { formatUnit } from '@/lib/utils';
import type { OrderWithDetails, ProductWithIngredients, Ingredient } from '@/types/database';
import { ShoppingCart, Calendar, Check, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-picker";
import { useOrders, useProducts, useIngredients } from '@/hooks/useQueries';

interface ShoppingItem {
    ingredientId: string;
    name: string;
    unit: string;
    currentStock: number;
    needed: number;
    toBuy: number;
    checked: boolean;
}

const ShoppingList = () => {
    // Default next 7 days
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: today,
        to: nextWeek
    });

    const [items, setItems] = useState<ShoppingItem[]>([]);

    // React Query Hooks (Concurrent Fetching)
    const { data: ordersData } = useOrders();
    const { data: productsData } = useProducts();
    const { data: ingredientsData } = useIngredients();

    const orders = ordersData || [];
    const products = productsData?.products || [];
    const ingredients = ingredientsData?.ingredients || [];

    // Removed manual state and effects
    // const [orders, setOrders] ...
    // const loadData = async () ...

    useEffect(() => {
        generateList();
    }, [dateRange, orders, products, ingredients]);

    const generateList = () => {
        if (!orders.length || !products.length || !ingredients.length) return;

        if (!dateRange?.from) return;

        const start = new Date(dateRange.from);
        start.setHours(0, 0, 0, 0);

        const end = dateRange.to ? new Date(dateRange.to) : new Date(start);
        end.setHours(23, 59, 59, 999);

        // 1. Filter Pending/Preparing Orders in range
        const relevantOrders = orders.filter(o => {
            if (!o.delivery_date) return false;
            // Fix: delivery_date is YYYY-MM-DD string
            const dDate = new Date(o.delivery_date + 'T12:00:00');
            return dDate >= start && dDate <= end && (o.status === 'pending' || o.status === 'preparing');
        });

        // 2. Calculate Demand
        const demandMap = new Map<string, number>();

        relevantOrders.forEach(o => {
            o.items?.forEach(item => {
                const prod = products.find(p => p.id === item.product_id);
                if (!prod?.product_ingredients) return;

                prod.product_ingredients.forEach(pi => {
                    const totalNeeded = pi.quantity * item.quantity;
                    demandMap.set(pi.ingredient_id, (demandMap.get(pi.ingredient_id) || 0) + totalNeeded);
                });
            });
        });

        // 3. Compare with Stock
        const shoppingList: ShoppingItem[] = [];

        ingredients.forEach(ing => {
            const needed = demandMap.get(ing.id) || 0;
            const currentStock = ing.stock_quantity || 0;
            const toBuy = Math.max(0, needed - currentStock);

            if (needed > 0) {
                shoppingList.push({
                    ingredientId: ing.id,
                    name: ing.name,
                    unit: ing.unit,
                    currentStock,
                    needed,
                    toBuy,
                    checked: false
                });
            }
        });

        // 4. Sort: Items strictly needing buy first
        shoppingList.sort((a, b) => b.toBuy - a.toBuy);

        setItems(shoppingList);
    };

    const toggleCheck = (id: string) => {
        setItems(items.map(i => i.ingredientId === id ? { ...i, checked: !i.checked } : i));
    };

    const exportList = () => {
        const data = items.map(i => ({
            Ingrediente: i.name,
            'Em Estoque': `${i.currentStock.toFixed(2)} ${formatUnit(i.currentStock, i.unit)}`,
            'Necessário': `${i.needed.toFixed(2)} ${formatUnit(i.needed, i.unit)}`,
            'Comprar': `${i.toBuy.toFixed(2)} ${formatUnit(i.toBuy, i.unit)}`
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Lista de Compras");
        XLSX.writeFile(wb, "lista_de_compras.xlsx");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lista de Compras Inteligente</h1>
                    <p className="text-muted-foreground">Planeje suas compras com base nos pedidos agendados.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={exportList} disabled={items.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Período de Produção
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <DateRangePicker
                            date={dateRange}
                            setDate={setDateRange}
                            className="w-[300px]"
                        />
                        <div className="flex-1 text-right text-sm text-muted-foreground items-center flex justify-end h-10">
                            {items.length} itens listados
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* To Buy List */}
                <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2" style={{ color: '#C76E60' }}>
                        <ShoppingCart className="w-5 h-5" />
                        Para Comprar (Falta Estoque)
                    </h3>
                    <div className="space-y-2">
                        {items.filter(i => i.toBuy > 0).length === 0 ? (
                            <div className="p-8 border rounded-lg text-center" style={{ borderColor: '#5F98A1', color: '#5F98A1', backgroundColor: 'rgba(95, 152, 161, 0.05)' }}>
                                <Check className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Tudo em ordem! Seu estoque cobre a demanda.</p>
                            </div>
                        ) : (
                            items.filter(i => i.toBuy > 0).map(item => (
                                <Card key={item.ingredientId} className={`transition-all ${item.checked ? 'opacity-50' : ''}`}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <Checkbox
                                            checked={item.checked}
                                            onCheckedChange={() => toggleCheck(item.ingredientId)}
                                        />
                                        <div className="flex-1">
                                            <p className="font-bold line-clamp-1">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Precisa: {item.needed.toFixed(2)} {formatUnit(item.needed, item.unit)} | Tem: {item.currentStock.toFixed(2)} {formatUnit(item.currentStock, item.unit)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-sm" style={{ color: '#C76E60' }}>
                                                +{item.toBuy.toFixed(2)} {formatUnit(item.toBuy, item.unit)}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                {/* Sufficient Stock List */}
                <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2" style={{ color: '#5F98A1' }}>
                        <Check className="w-5 h-5" />
                        Em Estoque (Suficiente)
                    </h3>
                    <div className="space-y-2 opacity-80">
                        {items.filter(i => i.toBuy <= 0).length === 0 ? (
                            <div className="p-8 border rounded-lg bg-muted text-center text-muted-foreground">
                                <p>Nenhum item com estoque suficiente listado para uso.</p>
                            </div>
                        ) : (
                            items.filter(i => i.toBuy <= 0).map(item => (
                                <Card key={item.ingredientId}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium line-clamp-1">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Vai usar: {item.needed.toFixed(2)} {formatUnit(item.needed, item.unit)}
                                            </p>
                                        </div>
                                        <div className="text-xs font-bold" style={{ color: '#2FBF71' }}>
                                            Tem {item.currentStock.toFixed(2)} {formatUnit(item.currentStock, item.unit)}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShoppingList;
