import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Ingredient } from "@/types/database";
import { convertQuantity } from "@/components/products/builder/utils";
import { Package, TrendingUp, Edit2, Trash2 } from "lucide-react";
import { IngredientQuickAdd } from "./IngredientQuickAdd";

interface IngredientCardProps {
    ingredient: Ingredient;
    demand: number;
    usageLevel: 'high' | 'medium' | 'low';
    isSelected: boolean;
    onSelect: (ing: Ingredient) => void;
    onEdit: (ing: Ingredient) => void;
    onDelete: (id: string) => void;
    onRefresh?: () => void; // Optional refresh callback
    isAdmin: boolean;
}

export function IngredientCard({
    ingredient,
    demand,
    usageLevel,
    isSelected,
    onSelect,
    onEdit,
    onDelete,
    onRefresh,
    isAdmin
}: IngredientCardProps) {
    const stock = ingredient.stock_quantity;
    const hasPackageInfo = !!(ingredient.package_size && ingredient.package_size > 0);

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-all duration-300 hover:shadow-md border-border/60",
                isSelected ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:border-primary/50",
                "cursor-pointer"
            )}
            onClick={() => onSelect(ingredient)}
        >
            <CardContent className="p-3 flex flex-col h-full min-h-[140px]">
                {/* Header: Status + Actions */}
                <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        {/* Status Tag */}
                        {demand > 0 ? (
                            <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 shadow-sm border",
                                usageLevel === 'high'
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : usageLevel === 'medium'
                                        ? "bg-amber-100 text-amber-700 border-amber-200"
                                        : "bg-emerald-100 text-emerald-700 border-emerald-200"
                            )}>
                                {usageLevel === 'high' ? 'Crítico' : usageLevel === 'medium' ? 'Atenção' : 'Ok'}
                            </span>
                        ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-secondary text-secondary-foreground border border-border/50">
                                Sem Uso
                            </span>
                        )}

                        {hasPackageInfo && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded border border-border/30">
                                <Package className="w-3 h-3" />
                                <span>{ingredient.package_size}{ingredient.package_unit || ingredient.unit}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions (Edit/Delete) - Only visible on hover or if admin */}
                    {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(ingredient)}>
                                <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(ingredient.id)}>
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Name */}
                <CardTitle className="text-sm font-semibold leading-tight line-clamp-2 text-foreground mb-auto" title={ingredient.name}>
                    {ingredient.name}
                </CardTitle>

                {/* Info Grid */}
                <div className="flex items-end justify-between pt-2 border-t border-dashed border-border/40 mt-3">
                    <div className="flex flex-col w-full gap-1">
                        {/* Stock Display */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-medium w-12 shrink-0">Estoque:</span>
                            <div className="flex flex-col">
                                {/* Primary: Base Unit */}
                                <span className={cn(
                                    "font-medium text-xs transition-colors",
                                    stock < 0 ? "text-destructive font-bold" : "text-foreground/90"
                                )}>
                                    {Number(stock.toFixed(2))} <span className="text-[10px] text-muted-foreground">{ingredient.unit}</span>
                                </span>

                                {/* Secondary: Calculated Packages Helper */}
                                {hasPackageInfo && (
                                    <div className="flex items-center gap-1 pl-2 mt-0.5">
                                        <Package className="w-3 h-3 text-muted-foreground/70" />
                                        <span className="text-[10px] text-muted-foreground">
                                            {(() => {
                                                const pSize = ingredient.package_size!;
                                                const pUnit = ingredient.package_unit || ingredient.unit;
                                                const baseUnit = ingredient.unit;
                                                const sizeInBase = convertQuantity(pSize, pUnit, baseUnit);
                                                const packagesCount = sizeInBase > 0 ? stock / sizeInBase : 0;
                                                // e.g. "2.0 pcts"
                                                return `${Number(packagesCount.toFixed(1))} ${packagesCount === 1 ? 'pct' : 'pcts'}`;
                                            })()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cost Display */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-medium w-12 shrink-0">Custo:</span>
                            <span className="font-semibold text-xs text-foreground">
                                R$ {ingredient.cost_per_unit.toFixed(2)}
                                <span className="text-[9px] font-normal text-muted-foreground ml-0.5">/{ingredient.unit}</span>
                            </span>
                        </div>
                    </div>

                    {/* Quick Add Button */}
                    <div className="pl-2" onClick={e => e.stopPropagation()}>
                        <IngredientQuickAdd
                            ingredient={ingredient}
                            onSuccess={() => onRefresh?.()}
                            minimal
                        />
                    </div>
                </div>

                {/* Demand Alert */}
                {demand > 0 && (
                    <div className="mt-2 text-[10px] text-orange-600/90 bg-orange-50/50 px-2 py-1 rounded-sm flex items-center justify-center gap-1.5 font-medium border border-orange-100/50">
                        <TrendingUp className="w-3 h-3" />
                        Demanda: {demand.toFixed(1)} {ingredient.unit}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
