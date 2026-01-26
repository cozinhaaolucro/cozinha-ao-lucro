import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Ingredient } from "@/types/database";
import { convertQuantity } from "@/components/products/builder/utils";
import { Package, TrendingUp, Edit2, Trash2 } from "lucide-react";
import { IngredientQuickAdd } from "./IngredientQuickAdd";
import { Checkbox } from "@/components/ui/checkbox";

interface IngredientCardProps {
    ingredient: Ingredient;
    demand: number;
    usageLevel: 'high' | 'medium' | 'low';
    isSelected: boolean;
    onSelect: (ing: Ingredient) => void;
    onEdit: (ing: Ingredient) => void;
    onDelete: (id: string) => void;
    onRefresh?: () => void; // Optional refresh callback
    activeOrdersCount?: number;
    isAdmin: boolean;
    selectionMode?: boolean;
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
    activeOrdersCount = 0,
    isAdmin,
    selectionMode
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
                {/* Header: Name + Actions */}
                <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        {/* Checkbox */}
                        <div
                            className={cn(
                                "flex items-center justify-center transition-all duration-200",
                                (isSelected || selectionMode) ? "w-5 opacity-100 mr-1" : "w-0 opacity-0 overflow-hidden"
                            )}
                            onClick={(e) => { e.stopPropagation(); onSelect(ingredient); }}
                        >
                            <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => onSelect(ingredient)}
                                className="h-4 w-4"
                            />
                        </div>

                        {/* Type Icon */}
                        <div className="mr-1">
                            {hasPackageInfo ? <Package className="w-4 h-4 text-gray-700" /> : <div className="w-3 h-3 rounded-full border-2 border-[#C9A34F] bg-[#C9A34F]/20 ml-0.5" />}
                        </div>
                        <CardTitle className="text-sm font-semibold leading-tight line-clamp-2 text-foreground" title={ingredient.name}>
                            {ingredient.name}
                        </CardTitle>
                    </div>

                    {/* Actions */}
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

                {/* Status Badges (Moved below Name) */}
                <div className="flex items-center gap-2 mb-auto">
                    {activeOrdersCount > 0 ? (
                        <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 shadow-sm border",
                            usageLevel === 'high'
                                ? "bg-red-100 text-red-700 border-red-200"
                                : usageLevel === 'medium'
                                    ? "bg-amber-100 text-amber-700 border-amber-200"
                                    : "bg-[#68A9CA]/15 text-[#68A9CA] border-[#68A9CA]/30"
                        )}>
                            Em uso ({activeOrdersCount})
                        </span>
                    ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-[#5F98A1]/10 text-[#5F98A1] border border-[#5F98A1]/20">
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
                                    stock < 0 ? "text-destructive font-bold" : "text-[#5F98A1]"
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
                                                return `${Number(packagesCount.toFixed(1))} ${packagesCount === 1 ? 'pct' : 'pcts'}`;
                                            })()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cost Display - Increased Size */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-medium w-12 shrink-0">Custo:</span>
                            <span className="font-bold text-sm text-foreground">
                                R$ {ingredient.cost_per_unit.toFixed(2)}
                                <span className="text-[10px] font-normal text-muted-foreground ml-0.5">/{ingredient.unit}</span>
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
