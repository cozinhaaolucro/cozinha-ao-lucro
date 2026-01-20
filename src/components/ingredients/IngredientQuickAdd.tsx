import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createStockMovement } from "@/lib/database";
import type { Ingredient } from "@/types/database";
import { convertQuantity } from "@/components/products/builder/utils";

interface IngredientQuickAddProps {
    ingredient: Ingredient;
    onSuccess: () => void;
    minimal?: boolean;
}

export function IngredientQuickAdd({ ingredient, onSuccess, minimal }: IngredientQuickAddProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Mode: 'direct' or 'package'. Default to 'package' if available.
    // If package_size is 0 or null, it's 'direct'.
    const hasPackage = !!(ingredient.package_size && ingredient.package_size > 0);
    const [mode, setMode] = useState<'direct' | 'package'>(hasPackage ? 'package' : 'direct');

    // Direct inputs
    const [directQty, setDirectQty] = useState('');

    // Package inputs (defaults from ingredient if available)
    const [packQty, setPackQty] = useState('1');
    const [packSize, setPackSize] = useState(ingredient.package_size?.toString() || '');
    const [packUnit, setPackUnit] = useState(ingredient.package_unit || ingredient.unit);

    const handleAdd = async () => {
        let finalQty = 0;

        if (mode === 'direct') {
            finalQty = parseFloat(directQty);
        } else {
            const pQty = parseFloat(packQty);
            const pSize = parseFloat(packSize);
            if (pQty > 0 && pSize > 0) {
                // Calculate quantity in Base Unit using shared robust logic
                // convertQuantity(qty, from, to, pkgSize, pkgUnit)
                // Here we want Total Base Unit.
                // Logic: (PackQty * PackSize) -> This is total raw amount (e.g. 5 * 395g = 1975g).
                // Convert 1975g -> kg.

                // OR: 1 Pack = (PackSize * UnitFactor). Total = PackQty * (PackSize * UnitFactor).

                // Let's use convertQuantity directly on the Pack Size.
                const onePackInBase = convertQuantity(pSize, packUnit, ingredient.unit);
                finalQty = pQty * onePackInBase;
            }
        }

        if (!finalQty || finalQty <= 0) return;

        setIsLoading(true);
        try {
            await createStockMovement({
                ingredient_id: ingredient.id,
                type: 'in',
                quantity: finalQty,
                reason: mode === 'package' ? `Adição Rápida: ${packQty}x ${packSize}${packUnit}` : 'Adição Rápida'
            });

            // Artificial delay to ensure DB trigger propagation before reload
            await new Promise(resolve => setTimeout(resolve, 500));

            setOpen(false);
            setDirectQty('');
            // Keep package settings for convenience? Or reset? Let's reset qty but keep size.
            setPackQty('1');
            onSuccess();
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro ao atualizar', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={minimal ? "ghost" : "outline"}
                    size="icon"
                    className={minimal
                        ? "h-6 w-6 rounded-full text-muted-foreground hover:text-white hover:bg-[#5F98A1] transition-colors"
                        : "h-8 w-8 rounded-full bg-background border-border/60 text-primary shadow-sm transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    }
                >
                    <Plus className={minimal ? "w-4 h-4" : "w-5 h-5"} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="end" side="left">
                <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-8 mb-3">
                        <TabsTrigger value="direct" className="text-xs">Direto</TabsTrigger>
                        <TabsTrigger value="package" className="text-xs">Pacotes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="direct" className="space-y-3">
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <Label className="text-[10px] text-muted-foreground mb-1 block">Quantidade ({ingredient.unit})</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={directQty}
                                    onChange={(e) => setDirectQty(e.target.value)}
                                    className="h-8 text-sm"
                                    autoFocus
                                />
                            </div>
                            <Button size="sm" className="h-8 px-3" onClick={handleAdd} disabled={isLoading}>
                                {isLoading ? <span className="animate-spin">...</span> : <Plus className="w-4 h-4" />}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="package" className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-[10px] text-muted-foreground mb-1 block">
                                    {parseInt(packQty) === 1 ? 'Pacote' : 'Pacotes'}
                                </Label>
                                <Input
                                    type="number"
                                    value={packQty}
                                    onChange={(e) => setPackQty(e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div>
                                <Label className="text-[10px] text-muted-foreground mb-1 block">Tamanho</Label>
                                <div className="flex relative">
                                    <Input
                                        type="number"
                                        value={packSize}
                                        onChange={(e) => setPackSize(e.target.value)}
                                        className="h-8 text-sm pr-8"
                                        placeholder="Ex: 500"
                                    />
                                    <span className="absolute right-2 top-2 text-[10px] text-muted-foreground">
                                        {packUnit}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                            <div className="text-[10px] text-muted-foreground">
                                Total: <span className="font-bold text-foreground">
                                    {/* Display only logic */}
                                    {(parseFloat(packQty || '0') * parseFloat(packSize || '0')).toFixed(2)} {packUnit}
                                </span>
                            </div>
                            <Button size="sm" className="h-7 px-3 text-xs" onClick={handleAdd} disabled={isLoading}>
                                {isLoading ? 'Adicionando...' : 'Adicionar'}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </PopoverContent>
        </Popover>
    );
}
