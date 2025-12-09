import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Plus, X, Calculator, ChevronDown, Check } from 'lucide-react';
import { getIngredients, createProduct, createIngredient } from '@/lib/database';
import type { Ingredient } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { presetIngredients } from '@/data/presetIngredients';
import { cn } from '@/lib/utils';

type ProductBuilderProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
};

type SelectedIngredient = {
    ingredient_id?: string;
    name: string;
    unit: string;
    cost: number;
    quantity: number;
    is_virtual?: boolean;
};

const ProductBuilder = ({ open, onOpenChange, onSuccess }: ProductBuilderProps) => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        selling_price: 0,
    });
    const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
    const [openCombobox, setOpenCombobox] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            loadIngredients();
        }
    }, [open]);

    const loadIngredients = async () => {
        const { data, error } = await getIngredients();
        if (!error && data) {
            setIngredients(data);
        }
    };

    const addExistingIngredient = (ingredient: Ingredient) => {
        setSelectedIngredients([
            ...selectedIngredients,
            {
                ingredient_id: ingredient.id,
                name: ingredient.name,
                unit: ingredient.unit,
                cost: ingredient.cost_per_unit,
                quantity: 1,
                is_virtual: false
            }
        ]);
        setOpenCombobox(false);
    };

    const addPresetIngredient = (presetName: string) => {
        const preset = presetIngredients.find(p => p.name === presetName);
        if (!preset) return;

        // Check if already exists in DB to avoid virtual if possible
        const existing = ingredients.find(i => i.name.toLowerCase() === preset.name.toLowerCase());

        if (existing) {
            setSelectedIngredients([
                ...selectedIngredients,
                {
                    ingredient_id: existing.id,
                    name: existing.name,
                    unit: existing.unit,
                    cost: existing.cost_per_unit,
                    quantity: 1,
                    is_virtual: false
                }
            ]);
            toast({ title: 'Ingrediente existente adicionado!' });
        } else {
            // Add as virtual
            setSelectedIngredients([
                ...selectedIngredients,
                {
                    name: preset.name,
                    unit: preset.unit,
                    cost: Number((preset.price * 1.15).toFixed(2)),
                    quantity: 1,
                    is_virtual: true
                }
            ]);
        }
    };

    const removeIngredient = (index: number) => {
        setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
    };

    const updateIngredientQuantity = (index: number, quantity: number) => {
        const updated = [...selectedIngredients];
        updated[index] = { ...updated[index], quantity };
        setSelectedIngredients(updated);
    };

    const updateIngredientSelection = (index: number, ingredientId: string) => {
        const ingredient = ingredients.find(i => i.id === ingredientId);
        if (!ingredient) return;

        const updated = [...selectedIngredients];
        updated[index] = {
            ...updated[index],
            ingredient_id: ingredient.id,
            name: ingredient.name,
            unit: ingredient.unit,
            cost: ingredient.cost_per_unit,
            is_virtual: false
        };
        setSelectedIngredients(updated);
    };

    const calculateTotalCost = () => {
        return selectedIngredients.reduce((total, si) => {
            return total + (si.cost * si.quantity);
        }, 0);
    };

    const calculateMargin = () => {
        const cost = calculateTotalCost();
        if (formData.selling_price === 0) return 0;
        return ((formData.selling_price - cost) / formData.selling_price) * 100;
    };

    const getSuggestedPrice = () => {
        const cost = calculateTotalCost();
        return cost / 0.4; // 60% margin
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Process ingredients (create virtual ones if needed)
        const finalIngredients: Array<{ ingredient_id: string; quantity: number }> = [];

        for (const si of selectedIngredients) {
            let ingredientId = si.ingredient_id;

            if (si.is_virtual) {
                // Double check if it was created in the meantime (unlikely but safe)
                const existing = ingredients.find(i => i.name.toLowerCase() === si.name.toLowerCase());
                if (existing) {
                    ingredientId = existing.id;
                } else {
                    // Create new ingredient
                    const { data: newIng, error } = await createIngredient({
                        name: si.name,
                        unit: si.unit as Ingredient['unit'],
                        cost_per_unit: si.cost,
                        stock_quantity: 0
                    });

                    if (error || !newIng) {
                        toast({ title: `Erro ao criar ingrediente: ${si.name}`, variant: 'destructive' });
                        return; // Stop process
                    }
                    ingredientId = newIng.id;
                }
            }

            if (ingredientId) {
                finalIngredients.push({ ingredient_id: ingredientId, quantity: si.quantity });
            }
        }

        // 2. Create Product
        const { error } = await createProduct(
            {
                name: formData.name,
                description: formData.description,
                selling_price: formData.selling_price,
                active: true,
                image_url: null,
            },
            finalIngredients
        );

        if (!error) {
            toast({ title: 'Produto criado com sucesso!' });
            onSuccess();
            resetForm();
        } else {
            toast({ title: 'Erro ao criar produto', description: error.message, variant: 'destructive' });
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', selling_price: 0 });
        setSelectedIngredients([]);
        onOpenChange(false);
    };

    const totalCost = calculateTotalCost();
    const margin = calculateMargin();
    const suggestedPrice = getSuggestedPrice();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Criar Novo Produto</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nome do Produto</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Brigadeiro Gourmet"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Descrição (opcional)</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brigadeiro de chocolate belga com granulado..."
                            />
                        </div>
                    </div>

                    {/* Recipe (Ingredients) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Receita (Ingredientes)</Label>
                            <div className="flex gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="outline" size="sm" className="gap-2">
                                            + Rápido (Presets) <ChevronDown className="w-3 h-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 max-h-60 overflow-y-auto">
                                        {presetIngredients.map((preset) => (
                                            <DropdownMenuItem
                                                key={preset.name}
                                                onClick={() => addPresetIngredient(preset.name)}
                                            >
                                                {preset.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            role="combobox"
                                            aria-expanded={openCombobox}
                                            size="sm"
                                            className="gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Adicionar Existente
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Buscar ingrediente..." />
                                            <CommandList>
                                                <CommandEmpty>Nenhum ingrediente encontrado.</CommandEmpty>
                                                <CommandGroup>
                                                    {ingredients.map((ingredient) => (
                                                        <CommandItem
                                                            key={ingredient.id}
                                                            value={ingredient.name}
                                                            onSelect={() => addExistingIngredient(ingredient)}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedIngredients.some(si => si.ingredient_id === ingredient.id) ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {ingredient.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {selectedIngredients.length === 0 ? (
                            <Card>
                                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                                    Adicione os ingredientes que compõem este produto
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {selectedIngredients.map((si, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        {si.is_virtual ? (
                                            <div className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted/50 flex justify-between items-center">
                                                <span>{si.name} <span className="text-xs text-muted-foreground">(Novo)</span></span>
                                                <span className="text-xs text-muted-foreground">R$ {si.cost.toFixed(2)}/{si.unit}</span>
                                            </div>
                                        ) : (
                                            <Select
                                                value={si.ingredient_id}
                                                onValueChange={(value) => updateIngredientSelection(index, value)}
                                            >
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ingredients.map((ing) => (
                                                        <SelectItem key={ing.id} value={ing.id}>
                                                            {ing.name} (R$ {ing.cost_per_unit.toFixed(2)}/{ing.unit})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}

                                        <Input
                                            type="number"
                                            step="0.001"
                                            value={si.quantity}
                                            onChange={(e) => updateIngredientQuantity(index, parseFloat(e.target.value) || 0)}
                                            className="w-24"
                                            placeholder="Qtd"
                                        />
                                        <span className="text-sm text-muted-foreground w-12">{si.unit}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeIngredient(index)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pricing */}
                    <Card className="bg-muted/30">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Calculator className="w-4 h-4 text-primary" />
                                <span className="font-medium">Cálculo de Precificação</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Custo Total:</p>
                                    <p className="text-lg font-bold">R$ {totalCost.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Preço Sugerido (60% margem):</p>
                                    <p className="text-lg font-bold text-primary">R$ {suggestedPrice.toFixed(2)}</p>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="price">Preço de Venda</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        value={formData.selling_price}
                                        onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setFormData({ ...formData, selling_price: suggestedPrice })}
                                    >
                                        Usar Sugerido
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Margem: <span className={margin >= 60 ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                                        {margin.toFixed(1)}%
                                    </span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button type="submit" className="flex-1">
                            Criar Produto
                        </Button>
                        <Button type="button" variant="outline" onClick={resetForm}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ProductBuilder;
