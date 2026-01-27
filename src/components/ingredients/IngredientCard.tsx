import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Ingredient } from "@/types/database";
import { convertQuantity } from "@/components/products/builder/utils";
import { Package, Edit2, Trash2, Milk, Candy, Wheat, Sparkles, Square, Egg, Cloud, CupSoda, Circle, Box, Drumstick, Leaf, Carrot, Beef, Droplet, GlassWater, Cookie, Asterisk, Heart, Snowflake, Salad } from "lucide-react";
import { IngredientQuickAdd } from "./IngredientQuickAdd";
import { Checkbox } from "@/components/ui/checkbox";
import { PRESET_INGREDIENTS } from "@/data/presets";

// Icon mapping for preset ingredients
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    'milk': Milk,
    'droplet': Droplet,
    'candy': Candy,
    'wheat': Wheat,
    'sparkles': Sparkles,
    'square': Square,
    'egg': Egg,
    'glass-water': GlassWater,
    'cookie': Cookie,
    'asterisk': Asterisk,
    'cloud': Cloud,
    'heart': Heart,
    'package': Package,
    'cup-soda': CupSoda,
    'circle': Circle,
    'snowflake': Snowflake,
    'box': Box,
    'salad': Salad,
    'drumstick': Drumstick,
    'leaf': Leaf,
    'carrot': Carrot,
    'beef': Beef,
};

// Get icon for ingredient by name
const getIngredientIcon = (name: string): React.ComponentType<{ className?: string }> | null => {
    const preset = PRESET_INGREDIENTS.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (preset?.icon && ICON_MAP[preset.icon]) {
        return ICON_MAP[preset.icon];
    }
    return null;
};

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
    const PresetIcon = getIngredientIcon(ingredient.name);

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
                <div className="flex justify-between items-start gap-2 mb-auto">
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

                        {/* Type Icon - Preset icon or Package/Circle */}
                        <div className="mr-1">
                            {PresetIcon ? (
                                <PresetIcon className="w-4 h-4 text-primary/70" />
                            ) : hasPackageInfo ? (
                                <Package className="w-4 h-4 text-gray-700" />
                            ) : (
                                <div className="w-3 h-3 rounded-full border border-gray-700 bg-gray-700/20 ml-0.5" />
                            )}
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

                {/* Status Badges (Restored) */}
                <div className="flex items-center gap-2 mb-auto">
                    {activeOrdersCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 shadow-sm border bg-blue-50 text-blue-400 border-blue-100">
                            Em uso ({activeOrdersCount})
                        </span>
                    )}

                    {hasPackageInfo && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-transparent px-1.5 py-0.5 rounded border border-border">
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
                                    stock < 0 ? "text-destructive font-bold" : "text-foreground"
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
            </CardContent>
        </Card>
    );
}
