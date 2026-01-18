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
import { addPdfHeader, addPdfFooter, autoTable } from '@/lib/pdfUtils';
import jsPDF from 'jspdf';
import { Printer } from 'lucide-react';

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
import { cn, formatUnit } from '@/lib/utils';
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
    package_size?: number;
    package_unit?: string;
};

// ... helpers logic remains ...
// Helper to determine available units based on base unit
const getUnitOptions = (baseUnit: string, ingredient?: any) => {
    const normalized = baseUnit.toLowerCase();
    const options: string[] = [];

    // Mass
    if (['kg', 'quilo', 'kilograma', 'g', 'grama'].includes(normalized)) {
        options.push('kg', 'g');
    }
    // Volume
    else if (['l', 'litro', 'ml', 'mililitro'].includes(normalized)) {
        options.push('l', 'ml');
    }
    // Unit
    else {
        options.push('un');
    }

    if (ingredient?.package_size) {
        options.push('pacote');
    }

    // Return unique options
    return [...new Set(options)];
};

// Helper to convert between units
const convertQuantity = (qty: number, fromUnit: string, toUnit: string, packageSize: number = 0): number => {
    if (fromUnit === toUnit) return qty;

    const from = fromUnit.toLowerCase();
    const to = toUnit.toLowerCase();

    // Package Logic
    if (from === 'pacote') {
        return qty * packageSize;
    }
    if (to === 'pacote') {
        if (packageSize === 0) return qty;
        return qty / packageSize;
    }

    // Normalize inputs
    const isKg = ['kg', 'quilo', 'kilograma'].includes(from);
    const isG = ['g', 'grama'].includes(from);
    const isL = ['l', 'litro'].includes(from);
    const isMl = ['ml', 'mililitro'].includes(from);

    const targetIsKg = ['kg', 'quilo', 'kilograma'].includes(to);
    const targetIsG = ['g', 'grama'].includes(to);
    const targetIsL = ['l', 'litro'].includes(to);
    const targetIsMl = ['ml', 'mililitro'].includes(to);

    if (isKg && targetIsG) return qty * 1000;
    if (isG && targetIsKg) return qty / 1000;
    if (isL && targetIsMl) return qty * 1000;
    if (isMl && targetIsL) return qty / 1000;

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
        hourly_rate: 0,
        is_highlight: false
    });
    const [isPriceManual, setIsPriceManual] = useState(false);
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
                    hourly_rate: productToEdit.hourly_rate || 0,
                    is_highlight: productToEdit.is_highlight || false,
                });
                setIsPriceManual(true);
                setImagePreview(productToEdit.image_url || null);

                // Populate ingredients
                if (productToEdit.product_ingredients) {
                    const mappedIngredients = productToEdit.product_ingredients.map((pi: any) => ({
                        ingredient_id: pi.ingredient.id,
                        name: pi.ingredient.name,
                        unit: pi.ingredient.unit, // Base unit from DB
                        cost: pi.ingredient.cost_per_unit,
                        quantity: pi.quantity, // Quantity in base unit
                        display_unit: pi.display_unit || pi.ingredient.unit, // Use saved display unit or fallback
                        display_quantity: pi.display_unit === 'pacote' && pi.ingredient.package_size
                            ? pi.quantity / pi.ingredient.package_size // Convert base->pakage for display if needed
                            : pi.display_unit && pi.display_unit !== pi.ingredient.unit
                                ? convertQuantity(pi.quantity, pi.ingredient.unit, pi.display_unit, pi.ingredient.package_size)
                                : pi.quantity,
                        package_size: pi.ingredient.package_size,
                        package_unit: pi.ingredient.package_unit
                    }));
                    setSelectedIngredients(mappedIngredients);
                }
            } else {
                // Reset for new product
                resetFields();
                setIsPriceManual(false);
            }
        }
    }, [open, productToEdit]);

    // Auto-update price with suggested margin if not manual
    const totalCostForEffect = selectedIngredients.reduce((acc, curr) => acc + (curr.cost * curr.quantity), 0);
    useEffect(() => {
        if (!isPriceManual && totalCostForEffect > 0) {
            // Default 60% margin: Price = Cost / 0.4
            const suggested = totalCostForEffect / 0.4;
            setFormData(prev => ({ ...prev, selling_price: parseFloat(suggested.toFixed(2)) }));
        }
    }, [totalCostForEffect, isPriceManual]);

    const loadIngredients = async () => {
        const { data, error } = await getIngredients();
        if (!error && data) {
            setIngredients(data);
        }
    };

    const addExistingIngredient = (ingredient: Ingredient) => {
        if (selectedIngredients.some(si => si.ingredient_id === ingredient.id)) {
            toast({ title: 'Ingrediente já adicionado!', variant: 'destructive' });
            return;
        }

        const isPackage = !!ingredient.package_size;
        const normalizedUnit = ingredient.unit === 'litro' ? 'l' : ingredient.unit === 'grama' ? 'g' : ingredient.unit === 'unidade' ? 'un' : ingredient.unit;

        setSelectedIngredients([
            ...selectedIngredients,
            {
                ingredient_id: ingredient.id,
                name: ingredient.name,
                unit: ingredient.unit,
                cost: ingredient.cost_per_unit,
                quantity: isPackage ? ingredient.package_size! : 1,
                display_unit: isPackage ? 'pacote' : normalizedUnit,
                display_quantity: 1,
                is_virtual: false,
                package_size: ingredient.package_size,
                package_unit: ingredient.package_unit
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

        // Calculate base quantity (what goes to DB stock deduction)
        // If display unit is pacote, convert Package -> Base
        // If display unit is g, convert g -> kg (if base is kg)
        const baseQty = convertQuantity(newDisplayQty, item.display_unit, item.unit, item.package_size);

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

        // When changing unit, we want to KEEP the physical quantity (item.quantity), but change the displayed number
        // e.g. 0.05kg -> 'pacote' (size 0.5kg) -> 0.1 pacote
        const newDisplayQty = convertQuantity(item.quantity, item.unit, newUnit, item.package_size);

        updated[index] = {
            ...item,
            display_unit: newUnit,
            display_quantity: parseFloat(newDisplayQty.toFixed(4))
        };
        setSelectedIngredients(updated);
    };

    const updateIngredientSelection = (index: number, ingredientId: string) => {
        const ingredient = ingredients.find(i => i.id === ingredientId);
        if (!ingredient) return;

        const updated = [...selectedIngredients];
        const isPackage = !!ingredient.package_size;
        const normalizedUnit = ingredient.unit === 'litro' ? 'l' : ingredient.unit === 'grama' ? 'g' : ingredient.unit === 'unidade' ? 'un' : ingredient.unit;

        updated[index] = {
            ...updated[index],
            ingredient_id: ingredient.id,
            name: ingredient.name,
            unit: ingredient.unit,
            cost: ingredient.cost_per_unit,
            is_virtual: false,
            // Defaults: prioritize package if exists
            display_unit: isPackage ? 'pacote' : normalizedUnit,
            display_quantity: 1,
            quantity: isPackage ? ingredient.package_size! : 1,
            // Package info
            package_size: ingredient.package_size,
            package_unit: ingredient.package_unit
        };
        setSelectedIngredients(updated);
    };

    const calculateTotalCost = () => {
        const ingredientsCost = selectedIngredients.reduce((total, si) => {
            return total + (si.cost * si.quantity);
        }, 0);

        const laborCost = (formData.preparation_time_minutes / 60) * formData.hourly_rate;
        return ingredientsCost + laborCost;
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

    const handleGeneratePDF = () => {
        const doc = new jsPDF();

        // Header
        addPdfHeader(doc, 'Ficha Técnica', formData.name);

        // Product Info
        doc.setFontSize(12);
        doc.setTextColor(50);
        doc.text(`Categoria: ${formData.category || 'Geral'}`, 14, 40);
        doc.text(`Preço de Venda: R$ ${formData.selling_price.toFixed(2)}`, 14, 46);
        doc.text(`Tempo de Preparo: ${formData.preparation_time_minutes} min`, 14, 52);

        // Financials
        const totalCost = selectedIngredients.reduce((acc, curr) => acc + (curr.cost * curr.quantity), 0);
        const margin = formData.selling_price - totalCost;
        const marginPercent = formData.selling_price > 0 ? (margin / formData.selling_price) * 100 : 0;

        doc.text(`Custo Total: R$ ${totalCost.toFixed(2)}`, 100, 46);
        doc.text(`Margem: ${marginPercent.toFixed(0)}% (R$ ${margin.toFixed(2)})`, 100, 52);

        // Description
        if (formData.description) {
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Descrição: ${formData.description}`, 14, 60);
        }

        // Ingredients Table
        const tableData = selectedIngredients.map(ing => [
            ing.name,
            `${ing.display_quantity} ${formatUnit(ing.display_quantity, ing.display_unit)}`,
            `R$ ${(ing.cost * ing.display_quantity).toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: formData.description ? 70 : 65,
            head: [['Ingrediente', 'Quantidade', 'Custo']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [41, 37, 36] }, // Stone-800
            styles: { fontSize: 10 }
        });

        addPdfFooter(doc);
        doc.save(`ficha-tecnica-${formData.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
        toast({ title: 'Ficha Técnica gerada!' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        // 1. Process ingredients (create virtual ones if needed)
        const finalIngredients: Array<{ ingredient_id: string; quantity: number; display_unit?: string }> = [];

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
                        stock_quantity: 0,
                    } as any);

                    if (error || !newIng) {
                        toast({ title: `Erro ao criar ingrediente: ${si.name}`, variant: 'destructive' });
                        setUploading(false);
                        return; // Stop process
                    }
                    ingredientId = newIng.id;
                }
            }

            if (ingredientId) {
                finalIngredients.push({
                    ingredient_id: ingredientId,
                    quantity: si.quantity,
                    display_unit: si.display_unit
                });
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
                    // @ts-ignore
                    // hourly_rate: formData.hourly_rate, // REMOVED to fix schema error
                    selling_unit: 'un',
                    is_highlight: formData.is_highlight,
                } as any,
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
                    // @ts-ignore
                    // hourly_rate: formData.hourly_rate, // REMOVED to fix schema error
                    selling_unit: 'un', // Default
                    is_highlight: formData.is_highlight,
                } as any, // Cast to any to bypass schema mismatch (hourly_rate)
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
        setFormData({ name: '', description: '', selling_price: 0, category: '', preparation_time_minutes: 0, hourly_rate: 0, is_highlight: false });
        setSelectedIngredients([]);
        setImageFile(null);
        setImagePreview(null);
    };

    const resetForm = () => {
        resetFields();
        onOpenChange(false);
    };

    const clearForm = () => {
        setFormData({ name: '', description: '', selling_price: 0, category: '', preparation_time_minutes: 0, hourly_rate: 0, is_highlight: false });
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
            hourly_rate: 0,
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

    const ActionButtons = () => (
        <div className="flex gap-3">
            {productToEdit && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleGeneratePDF}
                    className="gap-2"
                    title="Imprimir Ficha Técnica"
                >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Ficha</span>
                </Button>
            )}
            <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={clearForm}
                disabled={uploading}
            >
                Limpar
            </Button>
            <Button
                type="submit"
                className="flex-1"
                disabled={uploading}
                form="product-form"
            >
                {uploading ? 'Salvando...' : (productToEdit ? 'Atualizar' : 'Criar Produto')}
            </Button>
        </div>
    );

    const FormFields = (
        <div className="space-y-6 py-4 pb-24 sm:pb-4">
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
                            <Label htmlFor="hourly_rate">Valor da Hora (R$)</Label>
                            <Input
                                id="hourly_rate"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.hourly_rate}
                                onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                                className="h-10"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                                                onValueChange={(val) => {
                                                    const newArr = [...selectedIngredients];
                                                    const ing = ingredients.find(i => i.id === val);
                                                    if (ing) {
                                                        newArr[index] = {
                                                            ...si,
                                                            ingredient_id: ing.id,
                                                            name: ing.name,
                                                            unit: ing.unit,
                                                            cost: ing.cost_per_unit
                                                        };
                                                        setSelectedIngredients(newArr);
                                                    }
                                                }}
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
                                <CommandList className="max-h-[200px] overflow-y-auto">
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
    );

    const PricingSummary = () => (
        <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg mb-4">
            <div>
                <p className="text-xs text-muted-foreground">Custo Total</p>
                <p className="font-bold text-lg">R$ {totalCost.toFixed(2)}</p>
            </div>
            <div className="text-right">
                <div className="flex flex-col items-end">
                    <p className="text-xs text-muted-foreground">Preço (Margem {margin.toFixed(0)}%)</p>
                </div>
                <div className="flex items-center gap-2 justify-end">
                    <span className="text-sm font-medium text-muted-foreground">R$</span>
                    <Input
                        type="number"
                        value={formData.selling_price}
                        onChange={(e) => {
                            setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 });
                            setIsPriceManual(true);
                        }}
                        className="h-10 w-32 text-right font-bold bg-background text-lg"
                        step="0.01"
                    />
                </div>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="max-h-[95vh]">
                    <DrawerHeader className="text-left">
                        <DrawerTitle>{productToEdit ? 'Editar Produto' : 'Novo Produto'}</DrawerTitle>
                    </DrawerHeader>
                    <ScrollArea className="h-full overflow-y-auto px-4">
                        <form id="product-form" onSubmit={handleSubmit}>
                            {FormFields}
                        </form>
                    </ScrollArea>
                    <DrawerFooter className="pt-2 border-t bg-background z-50">
                        <PricingSummary />
                        <ActionButtons />
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle>{productToEdit ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1">
                        <form id="product-form" onSubmit={handleSubmit} className="px-6">
                            {FormFields}
                        </form>
                    </ScrollArea>
                    <div className="shrink-0 border-t bg-background p-6 space-y-4">
                        <PricingSummary />
                        <ActionButtons />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProductBuilder;
