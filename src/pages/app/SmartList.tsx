import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { getOrders, getIngredients } from '@/lib/database';
import type { OrderWithDetails, Ingredient } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { addPdfHeader, addPdfFooter, autoTable } from '@/lib/pdfUtils';


type ShoppingItem = {
    ingredientId: string;
    name: string;
    unit: string;
    needed: number;
    inStock: number;
    toBuy: number;
};

const SmartList = () => {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        calculateShoppingList();
    }, []);

    const calculateShoppingList = async () => {
        setLoading(true);
        try {
            // 1. Fetch 'pending' orders (A Fazer)
            const { data: orders, error: ordersError } = await getOrders();
            if (ordersError) throw ordersError;

            // Type assertion to OrderWithDetails
            const pendingOrders = (orders as OrderWithDetails[])?.filter(o => o.status === 'pending') || [];

            // 2. Fetch current ingredients stock
            const { data: ingredients, error: ingError } = await getIngredients();
            if (ingError) throw ingError;

            // 3. Aggregate needed ingredients
            const neededMap = new Map<string, number>(); // IngredientID -> Quantity

            pendingOrders.forEach(order => {
                // Verify if items exists (it should based on OrderWithDetails)
                if (order.items) {
                    order.items.forEach(item => {
                        if (item.product && item.product.product_ingredients) {
                            item.product.product_ingredients.forEach((pi: any) => {
                                // pi.ingredient might be populated or not, but we need ingredient_id and quantity
                                // getOrders usually returns product_ingredients with ingredient join.
                                // But we just need ingredient_id and quantity.
                                const ingredientId = pi.ingredient_id || pi.ingredient?.id;

                                if (ingredientId) {
                                    const totalNeededForThisItem = pi.quantity * item.quantity;
                                    const current = neededMap.get(ingredientId) || 0;
                                    neededMap.set(ingredientId, current + totalNeededForThisItem);
                                }
                            });
                        }
                    });
                }
            });

            // 4. Compare with Stock
            const shoppingList: ShoppingItem[] = [];

            ingredients?.forEach(ing => {
                const needed = neededMap.get(ing.id) || 0;
                // We only care if we need it OR if we want to show everything. 
                // Context: "Smart List based on demand". So only show if needed > 0 usually, 
                // OR if needed > stock (meaning we actually need to buy).
                // Let's show everything that is needed for the current batch, 
                // and highlight what needs to be bought.

                if (needed > 0 || ing.stock_quantity < 0) {
                    const toBuy = Math.max(0, needed - ing.stock_quantity);
                    shoppingList.push({
                        ingredientId: ing.id,
                        name: ing.name,
                        unit: ing.unit,
                        needed: Math.max(needed, toBuy),
                        inStock: ing.stock_quantity,
                        toBuy: toBuy
                    });
                }
            });

            setItems(shoppingList.sort((a, b) => b.toBuy - a.toBuy)); // Prioritize what needs buying

        } catch (error) {
            console.error('Error calculating smart list:', error);
            toast({ title: 'Erro ao gerar lista inteligente', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };


    const formatUnit = (quantity: number, unit: string) => {
        if (!unit) return '';
        if (unit.toLowerCase() === 'unidade' && quantity !== 1) {
            return 'unidades';
        }
        return unit;
    };


    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        addPdfHeader(doc, 'Lista Inteligente', 'Baseada nos pedidos "A Fazer"');

        const tableData = items
            .filter(item => item.toBuy > 0)
            .map(item => [
                item.name,
                `${item.toBuy.toFixed(2)} ${formatUnit(item.toBuy, item.unit)}`,
                `${item.inStock.toFixed(2)} ${formatUnit(item.inStock, item.unit)}`,
                `${item.needed.toFixed(2)} ${formatUnit(item.needed, item.unit)}`
            ]);

        if (tableData.length === 0) {
            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text('Parabéns! Nenhuma compra necessária para os pedidos atuais.', 14, 50);
        } else {
            autoTable(doc, {
                head: [['Ingrediente', 'Comprar', 'Em Estoque', 'Necessário']],
                body: tableData,
                startY: 40,
                theme: 'grid',
                headStyles: {
                    fillColor: [22, 163, 74], // Green-600
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [240, 253, 244] // Green-50
                },
                styles: {
                    fontSize: 10,
                    cellPadding: 4
                }
            });
        }

        addPdfFooter(doc);
        doc.save('lista-inteligente.pdf');
        toast({ title: 'PDF baixado com sucesso!' });
    };

    const itemsToBuy = items.filter(i => i.toBuy > 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lista Inteligente</h1>
                    <p className="text-muted-foreground">
                        Geração automática de compras baseada na demanda dos pedidos "A Fazer".
                    </p>
                </div>
                <Button onClick={handleDownloadPDF} disabled={loading || itemsToBuy.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar PDF
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className={`md:col-span-2 ${itemsToBuy.length === 0 ? 'border-green-200 bg-green-50' : ''}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {itemsToBuy.length === 0 ? (
                                <>
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <span className="text-green-700">Tudo em ordem!</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                    <span>Itens para Comprar ({itemsToBuy.length})</span>
                                </>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {itemsToBuy.length === 0
                                ? 'Seu estoque é suficiente para todos os pedidos pendentes.'
                                : 'Estes itens estão em falta ou insuficientes para a produção atual.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] pr-4">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            ) : itemsToBuy.length > 0 ? (
                                <div className="space-y-4">
                                    {itemsToBuy.map((item) => (
                                        <div key={item.ingredientId} className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm">
                                            <div>
                                                <p className="font-semibold">{item.name}</p>
                                                <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                                    <span>Estoque: {item.inStock} {formatUnit(item.inStock, item.unit)}</span>
                                                    <span>•</span>
                                                    <span>Necessário: {item.needed.toFixed(2)} {formatUnit(item.needed, item.unit)}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="destructive" className="text-lg py-1 px-3">
                                                    {item.toBuy.toFixed(2)} {formatUnit(item.toBuy, item.unit)}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                                    <CheckCircle2 className="h-12 w-12 text-green-200 mb-4" />
                                    <p>Nenhuma compra necessária no momento.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Summary / Stats Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Resumo do Estoque</CardTitle>
                        <CardDescription>Análise dos ingredientes utilizados</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total de Ingredientes Necessários</span>
                                <span className="font-medium">{items.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Itens em Falta</span>
                                <span className="font-medium text-red-600">{itemsToBuy.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Itens Suficientes</span>
                                <span className="font-medium text-green-600">{items.length - itemsToBuy.length}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <h4 className="font-medium mb-2 text-sm">Todos os Itens Necessários</h4>
                            <ScrollArea className="h-[200px]">
                                <ul className="space-y-2 text-sm">
                                    {items.map(item => (
                                        <li key={item.ingredientId} className="flex justify-between items-center text-muted-foreground">
                                            <span className="truncate max-w-[150px]">{item.name}</span>
                                            <span className={item.toBuy > 0 ? "text-amber-500 font-medium" : "text-green-600"}>
                                                {item.needed.toFixed(2)} {formatUnit(item.needed, item.unit)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SmartList;
