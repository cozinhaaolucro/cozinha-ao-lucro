import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { createStockMovement } from '@/lib/database';
import type { OrderWithDetails, ProductWithIngredients, Ingredient } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface StockAlertBadgeProps {
    order: OrderWithDetails;
    products: ProductWithIngredients[];
    ingredients: Ingredient[];
    onStockUpdate: () => void;
}

export function StockAlertBadge({ order, products, ingredients, onStockUpdate }: StockAlertBadgeProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isFixing, setIsFixing] = useState(false);
    const { toast } = useToast();

    // 1. Calcular ingredientes problemáticos (estoque negativo) usados neste pedido
    const negativeIngredients = useMemo(() => {
        // Se o pedido já foi entregue ou cancelado, não alertamos
        if (order.status === 'delivered' || order.status === 'cancelled') return [];

        const problems = new Map<string, { ingredient: Ingredient; deficit: number }>();

        order.items.forEach(item => {
            const product = products.find(p => p.id === item.product_id);
            if (!product?.product_ingredients) return;

            product.product_ingredients.forEach((pi: any) => {
                const ingId = pi.ingredient_id;
                // Encontrar o ingrediente atualizado na lista global
                const ing = ingredients.find(i => i.id === ingId);

                if (ing && ing.stock_quantity < 0) {
                    // O déficit é o valor absoluto do estoque negativo
                    problems.set(ingId, {
                        ingredient: ing,
                        deficit: Math.abs(ing.stock_quantity)
                    });
                }
            });
        });

        return Array.from(problems.values());
    }, [order, products, ingredients]);

    if (negativeIngredients.length === 0) return null;

    const handleFixStock = async () => {
        setIsFixing(true);
        try {
            await Promise.all(negativeIngredients.map(async ({ ingredient, deficit }) => {
                // Criar entrada de estoque para zerar o déficit
                await createStockMovement({
                    ingredient_id: ingredient.id,
                    type: 'in',
                    quantity: deficit,
                    reason: `Regularização Automática (Pedido #${order.display_id || order.id.slice(0, 4)})`
                });
            }));

            toast({ title: 'Estoque regularizado com sucesso!' });
            setIsOpen(false);
            onStockUpdate(); // Recarregar dados
        } catch (error) {
            console.error('Erro ao regularizar estoque:', error);
            toast({ title: 'Erro ao regularizar estoque', variant: 'destructive' });
        } finally {
            setIsFixing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div
                    className="absolute -top-2 -right-2 cursor-pointer z-10 animate-in zoom-in duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Badge variant="destructive" className="h-6 w-6 rounded-full p-0 flex items-center justify-center shadow-md hover:bg-red-600 border-2 border-white">
                        <AlertTriangle className="h-3 w-3 fill-current" />
                    </Badge>
                </div>
            </DialogTrigger>
            <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                        Estoque Negativo Detectado
                    </DialogTitle>
                    <DialogDescription>
                        Este pedido utiliza ingredientes que estão com estoque negativo.
                        Isso significa que o consumo excedeu o registrado.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-3">
                    <p className="text-sm font-medium">Ingredientes para regularizar:</p>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        {negativeIngredients.map(({ ingredient, deficit }) => (
                            <div key={ingredient.id} className="flex justify-between items-center text-sm border-b border-muted/50 last:border-0 pb-2 last:pb-0">
                                <span className="text-muted-foreground">{ingredient.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-red-500 font-mono font-bold">
                                        {ingredient.stock_quantity.toFixed(2)}
                                    </span>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="text-green-600 font-bold">
                                        + {deficit.toFixed(2)} {ingredient.unit}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Ao confirmar, será lançada uma entrada de estoque para <strong>ZERAR</strong> o saldo negativo destes itens.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isFixing}>
                        Cancelar
                    </Button>
                    <Button onClick={handleFixStock} disabled={isFixing} className="bg-green-600 hover:bg-green-700">
                        {isFixing ? 'Regularizando...' : 'Regularizar Estoque'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
