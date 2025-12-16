import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
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
import { Plus, X, Calculator, ChevronDown, Check, Camera, Image as ImageIcon } from 'lucide-react';
import { getIngredients, createProduct, createIngredient, updateProduct } from '@/lib/database';
import type { Ingredient, Product } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { PRESET_PRODUCTS, PRESET_INGREDIENTS } from '@/data/presets';
import { cn } from '@/lib/utils';

type ProductBuilderProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    productToEdit?: any; // Product with ingredients
};

type SelectedIngredient = {
    ingredient_id?: string;
    name: string;
    unit: string;
    cost: number;
    quantity: number;
    display_unit: string;
    display_quantity: number;
    is_virtual?: boolean;
};

// ... helpers logic remains ...
// Helper to determine available units based on base unit
const getUnitOptions = (baseUnit: string) => {
    const normalized = baseUnit.toLowerCase();
    if (['kg', 'quilo', 'kilograma'].includes(normalized)) return ['kg', 'g'];
    if (['l', 'litro'].includes(normalized)) return ['l', 'ml'];
    return [baseUnit];
};

// Helper to convert between units
const convertQuantity = (qty: number, fromUnit: string, toUnit: string): number => {
    if (fromUnit === toUnit) return qty;
    if (fromUnit === 'kg' && toUnit === 'g') return qty * 1000;
    if (fromUnit === 'g' && toUnit === 'kg') return qty / 1000;
    if (fromUnit === 'l' && toUnit === 'ml') return qty * 1000;
    if (fromUnit === 'ml' && toUnit === 'l') return qty / 1000;
    return qty;
};

const ProductBuilder = ({ open, onOpenChange, onSuccess, productToEdit }: ProductBuilderProps) => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        selling_price: 0,
        preparation_time_minutes: 0,
    });
    const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
    const [openCombobox, setOpenCombobox] = useState(false);

    // Image Upload State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        if (open) {
            loadIngredients();

            if (productToEdit) {
                // Populate form for editing
                setFormData({
                    name: productToEdit.name,
                    description: productToEdit.description || '',
                    selling_price: productToEdit.selling_price || 0,
                    preparation_time_minutes: productToEdit.preparation_time_minutes || 0,
                });
                setImagePreview(productToEdit.image_url || null);

                // Populate ingredients
                if (productToEdit.product_ingredients) {
                    const mappedIngredients = productToEdit.product_ingredients.map((pi: any) => ({
                        ingredient_id: pi.ingredient.id,
                        name: pi.ingredient.name,
                        unit: pi.ingredient.unit, // Base unit from DB
                        cost: pi.ingredient.cost_per_unit,
                        quantity: pi.quantity, // Quantity in base unit
                        display_unit: pi.ingredient.unit, // Default to base unit
                        display_quantity: pi.quantity,
                    }));
                    setSelectedIngredients(mappedIngredients);
                }
            } else {
                // Reset for new product
                resetFields();
            }
        }
    }, [open, productToEdit]);

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
                display_unit: ingredient.unit,
                display_quantity: 1,
                is_virtual: false
            }
        ]);
        setOpenCombobox(false);
    };

    const addPresetIngredient = (presetName: string) => {
        const preset = PRESET_INGREDIENTS.find(p => p.name === presetName);
        if (!preset) return;

        // Auto-select best display unit (e.g. use 'g' if base is 'kg')
        const baseUnit = preset.unit.toLowerCase();
        let initialDisplayUnit = baseUnit;
        if (baseUnit === 'kg') initialDisplayUnit = 'g';
        if (baseUnit === 'l' || baseUnit === 'litro') initialDisplayUnit = 'ml';

        // Check if already exists in DB
        const existing = ingredients.find(i => i.name.toLowerCase() === preset.name.toLowerCase());

        if (existing) {
            setSelectedIngredients([
                ...selectedIngredients,
                {
                    ingredient_id: existing.id,
                    name: existing.name,
                    unit: existing.unit,
                    cost: existing.cost_per_unit,
                    quantity: existing.unit === 'kg' ? 0.001 : 1, // Default 1g or 1un
                    display_unit: existing.unit === 'kg' ? 'g' : existing.unit,
                    display_quantity: 1,
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
                    cost: Number((preset.cost_per_unit * 1.15).toFixed(2)),
                    quantity: preset.unit === 'kg' ? 0.001 : 1,
                    display_unit: initialDisplayUnit,
                    display_quantity: 1,
                    is_virtual: true
                }
            ]);
        }
    };

    const removeIngredient = (index: number) => {
        setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
    };

    const updateIngredientDisplayQuantity = (index: number, newDisplayQty: number) => {
        const updated = [...selectedIngredients];
        const item = updated[index];

        // Calculate base quantity
        const baseQty = convertQuantity(newDisplayQty, item.display_unit, item.unit);

        updated[index] = {
            ...item,
            display_quantity: newDisplayQty,
            quantity: baseQty
        };
        setSelectedIngredients(updated);
    };

    const updateIngredientDisplayUnit = (index: number, newUnit: string) => {
        const updated = [...selectedIngredients];
        const item = updated[index];

        // When changing unit, we want to KEEP the physical quantity, but change the displayed number
        // e.g. 0.05kg (50g) -> switch to 'g' -> should display 50
        const newDisplayQty = convertQuantity(item.quantity, item.unit, newUnit);

        updated[index] = {
            ...item,
            display_unit: newUnit,
            display_quantity: parseFloat(newDisplayQty.toFixed(4)) // Avoid rough floating point math
        };
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
            is_virtual: false,
            // Reset to defaults for the new ingredient type
            display_unit: ingredient.unit,
            display_quantity: 1,
            quantity: 1
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

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

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
                        setUploading(false);
                        return; // Stop process
                    }
                    ingredientId = newIng.id;
                }
            }

            if (ingredientId) {
                finalIngredients.push({ ingredient_id: ingredientId, quantity: si.quantity });
            }
        }

        // 2. Upload Image (if any)
        let imageUrl = null;
        if (imageFile && user) {
            try {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, imageFile);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                imageUrl = data.publicUrl;
            } catch (error) {
                console.error('Error uploading image:', error);
                toast({ title: 'Erro ao fazer upload da imagem', variant: 'destructive' });
                setUploading(false);
                return;
            }
        }

        // 3. Create Product
        // 3. Create or Update Product
        if (productToEdit) {
            const { error } = await updateProduct(
                productToEdit.id,
                {
                    name: formData.name,
                    description: formData.description,
                    selling_price: formData.selling_price,
                    active: true,
                    // Only update image if new one uploaded, else keep existing
                    ...(imageUrl ? { image_url: imageUrl } : {}),
                    preparation_time_minutes: formData.preparation_time_minutes,
                },
                // For update, we pass ingredients to be replaced
                finalIngredients
            );

            setUploading(false);

            if (!error) {
                toast({ title: 'Produto atualizado com sucesso!' });
                onSuccess();
                // Don't reset form fully here, maybe close dialog or let parent handle?
                // Parent handles closing via onOpenChange(false) which is triggered by onSuccess usually? 
                // No, onSuccess usually just reloads data.
                onOpenChange(false);
            } else {
                toast({ title: 'Erro ao atualizar produto', description: error.message, variant: 'destructive' });
            }
        } else {
            const { error } = await createProduct(
                {
                    name: formData.name,
                    description: formData.description,
                    selling_price: formData.selling_price,
                    active: true,
                    image_url: imageUrl,
                    preparation_time_minutes: formData.preparation_time_minutes,
                },
                finalIngredients
            );

            setUploading(false);

            if (!error) {
                toast({ title: 'Produto criado com sucesso!' });
                onSuccess();
                resetForm();
            } else {
                toast({ title: 'Erro ao criar produto', description: error.message, variant: 'destructive' });
            }
        }
    };

    const resetFields = () => {
        setFormData({ name: '', description: '', selling_price: 0, preparation_time_minutes: 0 });
        setSelectedIngredients([]);
        setImageFile(null);
        setImagePreview(null);
    };

    const resetForm = () => {
        resetFields();
        onOpenChange(false);
    };

    const clearForm = () => {
        setFormData({ name: '', description: '', selling_price: 0 });
        setSelectedIngredients([]);
        setImageFile(null);
        setImagePreview(null);
        toast({ title: 'Formulário limpo!' });
    };

    const totalCost = calculateTotalCost();
    const margin = calculateMargin();
    const suggestedPrice = getSuggestedPrice();

    const loadProductPreset = (productName: string) => {
        const preset = PRESET_PRODUCTS.find(p => p.name === productName);
        if (!preset) return;

        // 1. Set basic info
        setFormData({
            name: preset.name,
            description: preset.description,
            selling_price: preset.selling_price
        });

        // 2. Map ingredients
        const newSelectedIngredients: SelectedIngredient[] = [];

        preset.ingredients.forEach(pi => {
            // Try to find in DB first
            const existingDb = ingredients.find(i => i.name.toLowerCase() === pi.name.toLowerCase());

            if (existingDb) {
                // Smart Unit Logic for EXISTING DB ingredients
                const isKg = (existingDb.unit as string) === 'kg' || (existingDb.unit as string) === 'kilograma';
                const isL = (existingDb.unit as string) === 'l' || (existingDb.unit as string) === 'litro';

                const useSubUnit = (isKg || isL) && pi.quantity < 1;
                let displayUnit: string = existingDb.unit;
                if (useSubUnit) {
                    displayUnit = isKg ? 'g' : 'ml';
                }

                const displayQty = convertQuantity(pi.quantity, existingDb.unit, displayUnit);

                newSelectedIngredients.push({
                    ingredient_id: existingDb.id,
                    name: existingDb.name,
                    unit: existingDb.unit,
                    cost: existingDb.cost_per_unit,
                    quantity: pi.quantity,
                    display_unit: displayUnit,
                    display_quantity: parseFloat(displayQty.toFixed(3)),
                    is_virtual: false
                });
            } else {
                // Find in PRESET_INGREDIENTS to get cost/unit
                const presetIng = PRESET_INGREDIENTS.find(i => i.name.toLowerCase() === pi.name.toLowerCase());

                if (presetIng) {
                    // Smart Unit Logic for VIRTUAL ingredients
                    const isKg = (presetIng.unit as string) === 'kg';
                    const isL = (presetIng.unit as string) === 'l' || (presetIng.unit as string) === 'litro';

                    const useSubUnit = (isKg || isL) && pi.quantity < 1;
                    let displayUnit: string = presetIng.unit;
                    if (useSubUnit) {
                        displayUnit = isKg ? 'g' : 'ml';
                    }

                    const displayQty = convertQuantity(pi.quantity, presetIng.unit, displayUnit);

                    newSelectedIngredients.push({
                        name: presetIng.name,
                        unit: presetIng.unit,
                        cost: Number((presetIng.cost_per_unit * 1.15).toFixed(2)),
                        quantity: pi.quantity,
                        display_unit: displayUnit,
                        display_quantity: parseFloat(displayQty.toFixed(3)),
                        is_virtual: true
                    });
                }
            }
        });

        setSelectedIngredients(newSelectedIngredients);
        toast({ title: 'Modelo carregado!', description: 'Receita preenchida com sucesso.' });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Criar Novo Produto</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info & Image */}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
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

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="description">Descrição (opcional)</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brigadeiro de chocolate belga com granulado..."
                                        className="h-[100px]"
                                    />
                                </div>
                                <div className="w-[140px]">
                                    <Label htmlFor="prep_time">Tempo (min)</Label>
                                    <div className="relative">
                                        <Input
                                            id="prep_time"
                                            type="number"
                                            min="0"
                                            value={formData.preparation_time_minutes}
                                            onChange={(e) => setFormData({ ...formData, preparation_time_minutes: parseInt(e.target.value) || 0 })}
                                            className="h-[100px] text-center text-3xl font-bold"
                                        />
                                        <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-muted-foreground">
                                            Minutos
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Image Upload Area */}
                        <div className="flex flex-col gap-2">
                            <Label>Imagem do Produto</Label>
                            <label
                                htmlFor="product-image"
                                className="flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-muted/50 transition-colors relative overflow-hidden group min-h-[140px]"
                            >
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center space-y-2 text-muted-foreground">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs">Clique para adicionar</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="product-image"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageSelect}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Presets Button */}
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="secondary" className="gap-2 w-full sm:w-auto">
                                    <Calculator className="w-4 h-4" />
                                    Carregar Modelo de Produto
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[300px]">
                                <DropdownMenuItem
                                    onClick={clearForm}
                                    className="flex items-center gap-2 py-2 text-destructive focus:text-destructive"
                                >
                                    <span className="font-medium">Limpar Tudo</span>
                                </DropdownMenuItem>
                                {PRESET_PRODUCTS.map((preset) => (
                                    <DropdownMenuItem
                                        key={preset.name}
                                        onClick={() => loadProductPreset(preset.name)}
                                        className="flex flex-col items-start py-2"
                                    >
                                        <span className="font-medium">{preset.name}</span>
                                        <span className="text-xs text-muted-foreground line-clamp-1">{preset.description}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                                        {PRESET_INGREDIENTS.map((preset) => (
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
                                        <div className="flex-1 min-w-[180px]">
                                            {si.is_virtual ? (
                                                <div className="px-3 py-2 text-sm border rounded-md bg-muted/50 flex justify-between items-center h-10">
                                                    <span>{si.name} <span className="text-xs text-muted-foreground">(Novo)</span></span>
                                                    <span className="text-xs text-muted-foreground">R$ {si.cost.toFixed(2)}/{si.unit}</span>
                                                </div>
                                            ) : (
                                                <Select
                                                    value={si.ingredient_id}
                                                    onValueChange={(value) => updateIngredientSelection(index, value)}
                                                >
                                                    <SelectTrigger className="h-10">
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
                                        </div>

                                        <div className="flex items-center gap-2 w-[180px]">
                                            <Input
                                                type="number"
                                                step="0.001"
                                                value={si.display_quantity}
                                                onChange={(e) => updateIngredientDisplayQuantity(index, parseFloat(e.target.value) || 0)}
                                                className="w-20 text-right h-10"
                                                placeholder="Qtd"
                                            />

                                            {getUnitOptions(si.unit).length > 1 ? (
                                                <Select
                                                    value={si.display_unit}
                                                    onValueChange={(val) => updateIngredientDisplayUnit(index, val)}
                                                >
                                                    <SelectTrigger className="w-20 h-10 px-2">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {getUnitOptions(si.unit).map(u => (
                                                            <SelectItem key={u} value={u}>{u}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="w-20 px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md h-10 flex items-center justify-center border">
                                                    {si.display_unit}
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-xs text-muted-foreground w-16 text-right">
                                            R$ {(si.cost * si.quantity).toFixed(2)}
                                        </div>

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                                        onClick={() => setFormData({ ...formData, selling_price: parseFloat(suggestedPrice.toFixed(2)) })}
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
                        <Button type="submit" className="flex-1" disabled={uploading}>
                            {uploading ? (productToEdit ? 'Salvando...' : 'Criando...') : (productToEdit ? 'Salvar Alterações' : 'Criar Produto')}
                        </Button>
                        <Button type="button" variant="outline" onClick={resetForm}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog >
    );
};

export default ProductBuilder;
