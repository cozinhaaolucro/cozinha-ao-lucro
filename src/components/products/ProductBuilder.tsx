import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
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
import { Plus, X, Calculator, ChevronDown, Check, Camera, Image as ImageIcon, Trash2, PackageCheck } from 'lucide-react';
import { getIngredients, createProduct, createIngredient, updateProduct } from '@/lib/database';
import type { Ingredient, Product } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { PRESET_PRODUCTS, PRESET_INGREDIENTS } from '@/data/presets';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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

const CATEGORY_PRESETS = ['Lanches', 'Bebidas', 'Sobremesas', 'Porções', 'Combos', 'Pizzas', 'Açaí'];

const ProductBuilder = ({ open, onOpenChange, onSuccess, productToEdit }: ProductBuilderProps) => {
    const isMobile = useIsMobile();
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        selling_price: 0,
        category: '',
        preparation_time_minutes: 0,
        is_highlight: false
    });
    const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);
    const [openCombobox, setOpenCombobox] = useState(false);

    // Category Combobox State
    const [openCategoryCombobox, setOpenCategoryCombobox] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

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
                    category: productToEdit.category || '',
                    preparation_time_minutes: productToEdit.preparation_time_minutes || 0,
                    is_highlight: productToEdit.is_highlight || false,
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
                    category: formData.category || null,
                    preparation_time_minutes: formData.preparation_time_minutes,
                    is_highlight: formData.is_highlight,
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
                    category: formData.category || null,
                    preparation_time_minutes: formData.preparation_time_minutes,
                    is_highlight: formData.is_highlight,
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
        setFormData({ name: '', description: '', selling_price: 0, category: '', preparation_time_minutes: 0, is_highlight: false });
        setSelectedIngredients([]);
        setImageFile(null);
        setImagePreview(null);
    };

    const resetForm = () => {
        resetFields();
        onOpenChange(false);
    };

    const clearForm = () => {
        setFormData({ name: '', description: '', selling_price: 0, category: '', preparation_time_minutes: 0, is_highlight: false });
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
            selling_price: preset.selling_price,
            category: 'Lanches', // Default preset category
            preparation_time_minutes: 0,
            is_highlight: false
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

    const FormContent = (
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6">
                <div className="space-y-6 py-4">
                    {/* 1. Basic Info Section */}
                    <Card className="border-none shadow-none sm:border sm:shadow-sm">
                        <CardContent className="p-0 sm:p-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-base font-semibold">Nome do Produto</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Brigadeiro Gourmet"
                                    className="h-11 text-lg"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detalhes sobre o produto..."
                                    className="resize-none"
                                    rows={2}
                                />
                            </div>

                            <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/50">
                                <Switch
                                    id="is_highlight"
                                    checked={formData.is_highlight}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_highlight: checked })}
                                />
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_highlight" className="text-base cursor-pointer">
                                        Destaque no Cardápio (Sugestão)
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Exibe este produto na vitrine de cima do cardápio digital (Modo Vitrine).
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Categoria</Label>
                                <Popover open={openCategoryCombobox} onOpenChange={setOpenCategoryCombobox}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCategoryCombobox}
                                            className="w-full justify-between font-normal"
                                        >
                                            {formData.category || "Selecione ou digite uma categoria..."}
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Buscar ou criar categoria..." onValueChange={setCategorySearch} />
                                            <CommandList>
                                                <CommandEmpty>
                                                    <div className="p-2 text-sm text-center">
                                                        <p className="text-muted-foreground mb-2">Nenhuma categoria encontrada.</p>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="w-full"
                                                            onClick={() => {
                                                                setFormData({ ...formData, category: categorySearch });
                                                                setOpenCategoryCombobox(false);
                                                            }}
                                                        >
                                                            Criar "{categorySearch}"
                                                        </Button>
                                                    </div>
                                                </CommandEmpty>
                                                <CommandGroup heading="Sugestões">
                                                    {CATEGORY_PRESETS.map((category) => (
                                                        <CommandItem
                                                            key={category}
                                                            value={category}
                                                            onSelect={(currentValue) => {
                                                                setFormData({ ...formData, category: currentValue === formData.category ? "" : currentValue })
                                                                setOpenCategoryCombobox(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.category === category ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {category}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="prep_time">Tempo de Preparo</Label>
                                    <div className="relative">
                                        <Input
                                            id="prep_time"
                                            type="number"
                                            min="0"
                                            value={formData.preparation_time_minutes}
                                            onChange={(e) => setFormData({ ...formData, preparation_time_minutes: parseInt(e.target.value) || 0 })}
                                            className="h-10 pr-10"
                                        />
                                        <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">Min</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Imagem</Label>
                                    <label
                                        htmlFor="product-image"
                                        className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                                    >
                                        <span className="flex items-center gap-2 truncate">
                                            {imagePreview ? (
                                                <>
                                                    <img src={imagePreview} alt="Preview" className="h-6 w-6 rounded object-cover" />
                                                    <span className="text-muted-foreground">Alterar</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ImageIcon className="h-4 w-4" />
                                                    <span>Adicionar Foto</span>
                                                </>
                                            )}
                                        </span>
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
                        </CardContent>
                    </Card>

                    {/* 2. Ingredients Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Ingredientes</Label>

                            {/* Presets Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="outline" size="sm" className="h-8 gap-1">
                                        <Calculator className="w-3.5 h-3.5" />
                                        <span className="sr-only sm:not-sr-only">Carregar Modelo</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem onClick={clearForm} className="text-destructive">
                                        Limpar Tudo
                                    </DropdownMenuItem>
                                    {PRESET_PRODUCTS.map((preset) => (
                                        <DropdownMenuItem key={preset.name} onClick={() => loadProductPreset(preset.name)}>
                                            {preset.name}
                                        </DropdownMenuItem>
                                    ))}
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
                                    <Card key={index} className="overflow-hidden border shadow-sm">
                                        <div className="p-3 flex flex-col gap-3">
                                            <div className="flex items-center justify-between gap-2">
                                                {/* Ingredient Selector on Mobile can be a modal or just text if locked. 
                                                    Currently implementation allows changing ingredient in place.
                                                    For simplicity in this overhaul, let's keep it robust.
                                                */}
                                                {si.is_virtual ? (
                                                    <div className="flex items-center gap-2 font-medium">
                                                        <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">Novo</span>
                                                        {si.name}
                                                    </div>
                                                ) : (
                                                    <Select
                                                        value={si.ingredient_id}
                                                        onValueChange={(value) => updateIngredientSelection(index, value)}
                                                    >
                                                        <SelectTrigger className="h-8 border-none shadow-none p-0 font-medium bg-transparent hover:bg-transparent w-auto gap-2 focus:ring-0">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {ingredients.map((ing) => (
                                                                <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive -mr-2"
                                                    onClick={() => removeIngredient(index)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center">
                                                        <Input
                                                            type="number"
                                                            step="0.001"
                                                            value={si.display_quantity}
                                                            onChange={(e) => updateIngredientDisplayQuantity(index, parseFloat(e.target.value) || 0)}
                                                            className="h-10 rounded-r-none border-r-0 text-center text-lg font-medium"
                                                        />
                                                        {getUnitOptions(si.unit).length > 1 ? (
                                                            <Select
                                                                value={si.display_unit}
                                                                onValueChange={(val) => updateIngredientDisplayUnit(index, val)}
                                                            >
                                                                <SelectTrigger className="h-10 w-20 rounded-l-none border-l-0 bg-muted/50">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {getUnitOptions(si.unit).map(u => (
                                                                        <SelectItem key={u} value={u}>{u}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <div className="h-10 w-16 flex items-center justify-center bg-muted/50 border border-l-0 rounded-r-md text-sm font-medium text-muted-foreground">
                                                                {si.display_unit}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right min-w-[30%]">
                                                    <p className="text-xs text-muted-foreground">Custo</p>
                                                    <p className="font-semibold">R$ {(si.cost * si.quantity).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Add Buttons */}
                        {/* Add Buttons */}
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
                </div>
            </div>

            {/* Sticky Footer for Pricing and Action */}
            <div className="shrink-0 border-t bg-background p-6 space-y-4">
                <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg">
                    <div>
                        <p className="text-xs text-muted-foreground">Custo Total</p>
                        <p className="font-bold text-lg">R$ {totalCost.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Preço (Margem {margin.toFixed(0)}%)</p>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={formData.selling_price}
                                onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                                className="h-8 w-24 text-right font-bold bg-background"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={resetForm} className="flex-1 h-12">
                        Cancelar
                    </Button>
                    <Button type="submit" className="flex-[2] h-12 text-base" disabled={uploading}>
                        {uploading ? 'Salvando...' : (productToEdit ? 'Salvar Alterações' : 'Criar Produto')}
                    </Button>
                </div>
            </div>
        </form >
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="h-[95vh]">
                    <DrawerHeader className="text-left">
                        <DrawerTitle>{productToEdit ? 'Editar Produto' : 'Novo Produto'}</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 h-full pb-4">
                        {FormContent}
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle>{productToEdit ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-hidden">
                    {FormContent}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProductBuilder;
