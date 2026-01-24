import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calculator, Plus, PackageCheck, Trash2, Check, Cookie, Cake, Square, IceCream, Coffee, Utensils, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Ingredient } from '@/types/database';
import { SelectedIngredient } from './types';
import { getUnitOptions } from './utils';
import { PRESET_PRODUCTS } from '@/data/presets';

interface ProductIngredientsProps {
    selectedIngredients: SelectedIngredient[];
    ingredients: Ingredient[];
    addExistingIngredient: (ingredient: Ingredient) => void;
    removeIngredient: (index: number) => void;
    updateIngredientDisplayQuantity: (index: number, newDisplayQty: number) => void;
    updateIngredientDisplayUnit: (index: number, newUnit: string) => void;
    updateIngredientSelection: (index: number, ingredientId: string) => void;
    loadProductPreset: (productName: string) => void;
    clearForm: () => void;
    isOnboardingActive: boolean;
    currentStep: string;
    nextStep: () => void;
}

export const ProductIngredients = ({
    selectedIngredients,
    ingredients,
    addExistingIngredient,
    removeIngredient,
    updateIngredientDisplayQuantity,
    updateIngredientDisplayUnit,
    updateIngredientSelection,
    loadProductPreset,
    clearForm,
    isOnboardingActive,
    currentStep,
    nextStep
}: ProductIngredientsProps) => {
    const [openCombobox, setOpenCombobox] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Ingredientes</Label>

                <DropdownMenu onOpenChange={(open) => {
                    if (open && isOnboardingActive && currentStep === 'new-product-form') {
                        nextStep();
                    }
                }}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            id="onboarding-step-3-trigger"
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                        >
                            <Calculator className="w-3.5 h-3.5" />
                            <span className="sr-only sm:not-sr-only">Carregar Modelo</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56" id="onboarding-template-list">
                        <DropdownMenuItem onClick={clearForm} className="text-destructive">
                            Limpar Tudo
                        </DropdownMenuItem>
                        {PRESET_PRODUCTS.map((preset) => {
                            let Icon = Cookie; // Default
                            if (preset.icon === 'cake') Icon = Cake;
                            if (preset.icon === 'square') Icon = Square;
                            if (preset.icon === 'ice-cream') Icon = IceCream;
                            if (preset.icon === 'cup') Icon = Coffee;
                            if (preset.icon === 'utensils') Icon = Utensils;
                            if (preset.icon === 'circle') Icon = Circle;

                            return (
                                <DropdownMenuItem key={preset.name} onClick={() => {
                                    loadProductPreset(preset.name);
                                    if (isOnboardingActive && currentStep === 'template-list') {
                                        nextStep();
                                    }
                                }} className="cursor-pointer gap-2">
                                    <Icon className="w-4 h-4 text-primary/70" />
                                    <span>{preset.name.split(':')[0].split('(')[0]}</span>
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {selectedIngredients.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-muted/20 gap-3 text-center">
                    <PackageCheck className="w-10 h-10 text-muted-foreground/50" />
                    <div className="space-y-1">
                        <p className="font-medium">Nenhum ingrediente</p>
                        <p className="text-sm text-muted-foreground">Adicione ingredientes para calcular o custo.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {selectedIngredients.map((si, index) => (
                        <Card key={si.uniqueId} className="overflow-hidden border shadow-sm">
                            <div className="p-3 flex flex-col gap-3">
                                <div className="flex items-center justify-between gap-2">
                                    {si.is_virtual ? (
                                        <div className="flex items-center gap-2 font-medium">
                                            <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">Novo</span>
                                            {si.name}
                                        </div>
                                    ) : (
                                        <Select
                                            value={si.ingredient_id}
                                            onValueChange={(val) => updateIngredientSelection(index, val)}
                                        >
                                            <SelectTrigger className="h-8 flex-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ingredients.map(i => (
                                                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeIngredient(index)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="flex items-end justify-between gap-4">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-xs text-muted-foreground">Quantidade</p>
                                        <div className="flex">
                                            <Input
                                                type="number"
                                                value={si.display_quantity || ''}
                                                onChange={(e) => updateIngredientDisplayQuantity(index, parseFloat(e.target.value) || 0)}
                                                className="h-10 rounded-r-none border-r-0"
                                            />
                                            <Select
                                                value={si.display_unit}
                                                onValueChange={(val) => updateIngredientDisplayUnit(index, val)}
                                            >
                                                <SelectTrigger className="h-10 w-20 rounded-l-none bg-muted/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {getUnitOptions(si.unit, si).map(u => (
                                                        <SelectItem key={u} value={u}>
                                                            {u === 'pacote' && si.package_size
                                                                ? `Pacote (${si.package_size}${si.package_unit})`
                                                                : u}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="text-right min-w-[30%]">
                                        <p className="text-xs text-muted-foreground">Custo</p>
                                        <p className="font-semibold">R$ {(si.cost * si.quantity).toFixed(2)}</p>
                                        {si.display_unit === 'pacote' && si.package_size && (
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                = {(si.display_quantity * si.package_size).toFixed(2)} {si.package_unit || si.unit}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <div className="flex gap-2">
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-12 flex-1 border-dashed border-2 hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar Ingrediente
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Buscar ingrediente..." />
                            <CommandList className="max-h-[200px] overflow-y-auto">
                                <CommandEmpty>Nenhum ingrediente encontrado.</CommandEmpty>
                                <CommandGroup>
                                    {ingredients.map((ingredient) => (
                                        <CommandItem
                                            key={ingredient.id}
                                            value={ingredient.name}
                                            onSelect={() => {
                                                addExistingIngredient(ingredient);
                                                setOpenCombobox(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedIngredients.some(si => si.ingredient_id === ingredient.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex items-center justify-between w-full gap-2">
                                                <span>{ingredient.name}</span>
                                                <span className="text-xs text-muted-foreground tabular-nums">
                                                    {ingredient.stock_quantity ? Number(ingredient.stock_quantity.toFixed(2)) : 0} {ingredient.unit}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};
