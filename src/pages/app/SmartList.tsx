import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { getOrders, getIngredients, updateIngredient, createStockMovement } from '@/lib/database';
import type { OrderWithDetails, Ingredient } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useOrders, useIngredients } from '@/hooks/useQueries';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addPdfHeader, addPdfFooter } from '@/lib/pdfUtils';
import { motion, useAnimation } from 'framer-motion';
import type { PanInfo } from 'framer-motion';

type ShoppingItem = {
    ingredientId: string;
    name: string;
    unit: string;
    needed: number;
    inStock: number;
    toBuy: number;
};

const SwipeButton = ({ onConfirm, disabled }: { onConfirm: () => void, disabled: boolean }) => {
    const controls = useAnimation();
    const [dragX, setDragX] = useState(0);

    const handleDragEnd = async (_: any, info: PanInfo) => {
        if (info.offset.x > 150) { // Threshold
            await controls.start({ x: 200, opacity: 0 }); // Swipe off
            onConfirm();
            // Reset after a delay if needed, but usually we just process
            setTimeout(() => {
                controls.set({ x: 0, opacity: 1 });
            }, 1000);
        } else {
            controls.start({ x: 0 }); // Snap back
        }
    };

    return (
        <div className={`relative h-12 w-72 bg-muted/50 dark:bg-muted/20 rounded-full overflow-hidden border border-border/50 select-none shadow-sm ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="absolute inset-0 flex items-center justify-center pl-10 text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] z-0">
                Deslize para Comprar
            </div>
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 200 }}
                dragElastic={0.1}
                dragMomentum={false}
                onDrag={(_, info) => setDragX(info.offset.x)}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="absolute top-1 bottom-1 left-1 w-14 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing z-10 shadow-lg"
                style={{ background: 'hsl(186, 35%, 28%)' }}
            >
                <CheckCircle2 className="text-white w-6 h-6" />
            </motion.div>
            <motion.div
                className="absolute inset-y-0 left-0 z-0"
                style={{ width: dragX + 30, background: 'hsla(186, 35%, 28%, 0.2)' }}
            />
        </div>
    );
};

const SmartList = () => {
    // const [loading, setLoading] = useState(true); // Derived
    const [localItems, setLocalItems] = useState<ShoppingItem[] | null>(null); // For override or just use Memo?
    // Actually, SmartList swipes to buy, which updates stock. 
    // If we rely purely on props, we need to ensure cache invalidation on mutation.

    const { toast } = useToast();

    // Hooks
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const { data: pendingOrdersData, isLoading: ordersLoading, refetch: refetchOrders } = useOrders({
        status: 'pending'
    });
    const { data: ingredientsData, isLoading: ingredientsLoading, refetch: refetchIngredients } = useIngredients();

    const pendingOrders = pendingOrdersData || [];
    const ingredients = ingredientsData?.ingredients || [];
    const loading = ordersLoading || ingredientsLoading;

    // Calculation (Memoized)
    const items = useMemo(() => {
        if (!ingredients.length) return [];

        const neededMap = new Map<string, number>();

        pendingOrders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    if (item.product && item.product.product_ingredients) {
                        item.product.product_ingredients.forEach((pi: any) => {
                            const ingredientId = pi.ingredient_id || pi.ingredient?.id;
                            if (ingredientId) {
                                const totalNeeded = pi.quantity * item.quantity;
                                neededMap.set(ingredientId, (neededMap.get(ingredientId) || 0) + totalNeeded);
                            }
                        });
                    }
                });
            }
        });

        const round = (num: number) => Math.round(num * 10000) / 10000;

        const list: ShoppingItem[] = [];
        ingredients.forEach(ing => {
            const rawNeeded = neededMap.get(ing.id) || 0;
            const stock = round(ing.stock_quantity);
            const needed = round(rawNeeded);

            // Only suggest buying if needed > stock (with tolerance)
            if (needed > stock || stock < 0) {
                const diff = needed - stock;
                const toBuy = diff > 0.0001 ? round(diff) : 0;

                if (toBuy > 0) {
                    list.push({
                        ingredientId: ing.id,
                        name: ing.name,
                        unit: ing.unit,
                        needed: round(Math.max(needed, toBuy)), // Visual help: if stock is negative, needed usually means "to buy"
                        inStock: stock,
                        toBuy: toBuy
                    });
                }
            }
        });

        return list.sort((a, b) => b.toBuy - a.toBuy);
    }, [pendingOrders, ingredients]);

    const queryClient = useQueryClient();

    // Manually refresh if needed (e.g. after swipe)
    const refreshData = () => {
        // Invalidate globally to update Stock/Overview pages too
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ingredients] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.orders] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard] });
    }

    // Remove calculateShoppingList
    // useEffect ... calculateShoppingList ...

    const handleRestock = async () => {
        const itemsToBuy = items.filter(i => i.toBuy > 0);
        if (itemsToBuy.length === 0) return;

        const confirm = window.confirm(`Confirmar a compra de ${itemsToBuy.length} itens ? Isso adicionará as quantidades ao estoque.`);
        if (!confirm) return;

        // setLoading(true); -> Managed by hook
        try {
            // Parallelize updates for speed
            const promises = itemsToBuy.map(item =>
                createStockMovement({
                    ingredient_id: item.ingredientId,
                    type: 'in', // Compra / Entrada
                    quantity: item.toBuy,
                    reason: 'Compra Automática via Lista Inteligente'
                })
            );

            await Promise.all(promises);

            toast({ title: 'Estoque atualizado!', description: `${itemsToBuy.length} ingredientes repostos.` });
            refreshData(); // Refresh
        } catch (error) {
            console.error('Batch update error', error);
            toast({ title: 'Erro ao atualizar estoque', variant: 'destructive' });
        } finally {
            // setLoading(false); // Handled by hook
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

        const itemsToBuy = items.filter(i => i.toBuy > 0);
        const tableData = itemsToBuy.map(item => [
            item.name,
            `${item.toBuy.toFixed(2)} ${formatUnit(item.toBuy, item.unit)} `,
            `${item.inStock.toFixed(2)} ${formatUnit(item.inStock, item.unit)} `,
            `${item.needed.toFixed(2)} ${formatUnit(item.needed, item.unit)} `
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
        <div className="space-y-6 animate-in fade-in duration-500 pb-40">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Lista Inteligente</h1>
                    <p className="text-sm text-muted-foreground">
                        Geração automática de compras baseada na demanda dos pedidos "A Fazer".
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={handleDownloadPDF} disabled={loading || itemsToBuy.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className={`md:col-span-2 bg-white shadow-elegant border ${itemsToBuy.length === 0 ? 'border-l-4 border-l-[#2FBF71]' : 'border-l-4 border-l-[#C76E60]'} flex flex-col`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                            {itemsToBuy.length === 0 ? (
                                <>
                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                    </div>
                                    <span>Tudo em ordem!</span>
                                </>
                            ) : (
                                <>
                                    <div className="p-1.5 bg-[#C9A34F]/10 rounded-lg">
                                        <AlertCircle className="h-5 w-5 text-[#C9A34F]" />
                                    </div>
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
                    <CardContent className="flex-1">
                        <ScrollArea className="h-[300px] pr-4" type="hover" scrollHideDelay={100}>
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
                                                    <span>Estoque: {item.inStock.toFixed(2)} {formatUnit(item.inStock, item.unit)}</span>
                                                    <span>•</span>
                                                    <span>Necessário: {item.needed.toFixed(2)} {formatUnit(item.needed, item.unit)}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge className="text-sm py-1 px-3 bg-[#C76E60]/10 text-[#C76E60] hover:bg-[#C76E60]/20 shadow-none border-0">
                                                    {item.toBuy.toFixed(2)} {formatUnit(item.toBuy, item.unit)}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                                    <CheckCircle2 className="h-12 w-12 text-[#2FBF71]/30 mb-4" />
                                    <p>Nenhuma compra necessária no momento.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                    {itemsToBuy.length > 0 && (
                        <div className="p-6 pt-0 mt-4 flex justify-end">
                            <SwipeButton onConfirm={handleRestock} disabled={loading} />
                        </div>
                    )}
                </Card>

                {/* Summary / Stats Card */}
                <Card className="bg-white shadow-elegant border">
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
                                <span className="font-medium text-[#2FBF71]">{items.length - itemsToBuy.length}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <h4 className="font-medium mb-2 text-sm">Todos os Itens Necessários</h4>
                            <ScrollArea className="h-[200px]" type="hover" scrollHideDelay={100}>
                                <ul className="space-y-2 text-sm">
                                    {items.map(item => (
                                        <li key={item.ingredientId} className="flex justify-between items-center text-muted-foreground">
                                            <span className="truncate max-w-[150px]">{item.name}</span>
                                            <span className={item.toBuy > 0 ? "text-[#C76E60] font-medium" : "text-[#2FBF71]"}>
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

