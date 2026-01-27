import { useState, useEffect } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingOverlay } from '@/components/onboarding/OnboardingOverlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Printer } from 'lucide-react';

import { getIngredients, createProduct, createIngredient, updateProduct, getProducts } from '@/lib/database';
import type { Ingredient, ProductWithIngredients, ProductIngredientWithDetails } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { PRESET_PRODUCTS, PRESET_INGREDIENTS } from '@/data/presets';
import { formatUnit } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// New Components & Types & Utils
import { ProductBasicInfo } from './builder/ProductBasicInfo';
import { ProductIngredients } from './builder/ProductIngredients';
import { ProductPricing } from './builder/ProductPricing';
import { ProductPricingSummary } from './builder/ProductPricingSummary';
import { convertQuantity } from './builder/utils';
import { ProductFormData, SelectedIngredient } from './builder/types';

type ProductBuilderProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    productToEdit?: ProductWithIngredients;
};

const ProductBuilder = ({ open, onOpenChange, onSuccess, productToEdit }: ProductBuilderProps) => {
    const isMobile = useIsMobile();
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        selling_price: 0,
        category: '',
        preparation_time_minutes: 0,
        hourly_rate: 0,
        is_highlight: false
    });
    const { isActive: isOnboardingActive, currentStep, nextStep } = useOnboarding();
    const [isPriceManual, setIsPriceManual] = useState(false);
    const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);

    // Image Upload State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        if (open) {
            loadIngredients();
            loadCategories();

            if (productToEdit) {
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

                if (productToEdit.product_ingredients) {
                    const mappedIngredients = productToEdit.product_ingredients
                        .map((pi: ProductIngredientWithDetails, idx: number): SelectedIngredient | null => {
                            if (!pi.ingredient) return null;
                            const selected: SelectedIngredient = {
                                uniqueId: `${pi.ingredient.id}_${Date.now()}_${idx}`, // Unique ID for key
                                ingredient_id: pi.ingredient.id,
                                name: pi.ingredient.name,
                                unit: pi.ingredient.unit,
                                cost: pi.ingredient.cost_per_unit,
                                quantity: pi.quantity,
                                display_unit: pi.display_unit || pi.ingredient.unit,
                                display_quantity: pi.display_unit === 'pacote' && pi.ingredient.package_size
                                    ? pi.quantity / pi.ingredient.package_size
                                    : pi.display_unit && pi.display_unit !== pi.ingredient.unit
                                        ? convertQuantity(pi.quantity, pi.ingredient.unit, pi.display_unit, pi.ingredient.package_size)
                                        : pi.quantity,
                                package_size: pi.ingredient.package_size,
                                package_unit: pi.ingredient.package_unit,
                                is_virtual: false
                            };
                            return selected;
                        })
                        .filter((item): item is SelectedIngredient => item !== null);
                    setSelectedIngredients(mappedIngredients);
                }
            } else {
                resetFields();
                setIsPriceManual(false);
            }
        }
    }, [open, productToEdit]);

    const totalCostForEffect = selectedIngredients.reduce((acc, curr) => acc + (curr.cost * curr.quantity), 0);
    useEffect(() => {
        if (!isPriceManual && totalCostForEffect > 0) {
            const suggested = totalCostForEffect / 0.4;
            setFormData(prev => ({ ...prev, selling_price: parseFloat(suggested.toFixed(2)) }));
        }
    }, [totalCostForEffect, isPriceManual]);

    const loadCategories = async () => {
        const { data } = await getProducts();
        if (data) {
            const cats = Array.from(new Set(data.map(p => p.category).filter(Boolean))) as string[];
            setAvailableCategories(cats);
        }
    };

    const loadIngredients = async () => {
        const { data, error } = await getIngredients();
        if (!error && data) {
            setIngredients(data);
        }
    };

    const addNewIngredient = (data: { name: string; unit: any; cost: number }) => {
        const isPackage = false; // Simple creation assumes basic units initially
        const normalizedUnit = data.unit === 'litro' ? 'l' : data.unit === 'grama' ? 'g' : data.unit === 'unidade' ? 'un' : data.unit;

        setSelectedIngredients([
            ...selectedIngredients,
            {
                uniqueId: `virtual_${Date.now()}_${Math.random()}`,
                ingredient_id: '',
                name: data.name,
                unit: normalizedUnit,
                cost: data.cost,
                quantity: 1,
                display_unit: normalizedUnit,
                display_quantity: 1,
                is_virtual: true,
                package_size: null,
                package_unit: null
            }
        ]);
    };

    const addExistingIngredient = (ingredient: Ingredient) => {
        // ALLOW duplicates as per user request (e.g. 1 package + 0.5 package)
        // if (selectedIngredients.some(si => si.ingredient_id === ingredient.id)) {
        //     toast({ title: 'Ingrediente já adicionado!', variant: 'destructive' });
        //     return;
        // }

        const isPackage = !!ingredient.package_size;
        const normalizedUnit = ingredient.unit === 'litro' ? 'l' : ingredient.unit === 'grama' ? 'g' : ingredient.unit === 'unidade' ? 'un' : ingredient.unit;

        setSelectedIngredients([
            ...selectedIngredients,
            {
                uniqueId: `${ingredient.id}_${Date.now()}`,
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
    };

    const removeIngredient = (index: number) => {
        setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
    };

    const updateIngredientDisplayQuantity = (index: number, newDisplayQty: number) => {
        const updated = [...selectedIngredients];
        const item = updated[index];
        const baseQty = convertQuantity(newDisplayQty, item.display_unit, item.unit, item.package_size, item.package_unit);

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
        const newDisplayQty = convertQuantity(item.quantity, item.unit, newUnit, item.package_size, item.package_unit);

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

        const initialBaseQty = isPackage
            ? convertQuantity(1, 'pacote', ingredient.unit, ingredient.package_size, ingredient.package_unit)
            : 1;

        updated[index] = {
            ...updated[index],
            ingredient_id: ingredient.id,
            name: ingredient.name,
            unit: ingredient.unit,
            cost: ingredient.cost_per_unit,
            is_virtual: false,
            display_unit: isPackage ? 'pacote' : normalizedUnit,
            display_quantity: 1,
            quantity: initialBaseQty,
            package_size: ingredient.package_size,
            package_unit: ingredient.package_unit
        };
        setSelectedIngredients(updated);
    };

    const calculateTotalCost = () => {
        const ingredientsCost = selectedIngredients.reduce((total, si) => total + (si.cost * si.quantity), 0);
        const laborCost = (formData.preparation_time_minutes / 60) * formData.hourly_rate;
        return ingredientsCost + laborCost;
    };

    const calculateMargin = () => {
        const cost = calculateTotalCost();
        if (formData.selling_price === 0) return 0;
        return ((formData.selling_price - cost) / formData.selling_price) * 100;
    };

    const imageSelectHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        }
    };

    const handleGeneratePDF = async () => {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const { addPdfHeader, addPdfFooter } = await import('@/lib/pdfUtils');

        const doc = new jsPDF();
        addPdfHeader(doc, 'Ficha Técnica', formData.name);

        doc.setFontSize(12);
        doc.setTextColor(50);
        doc.text(`Categoria: ${formData.category || 'Geral'}`, 14, 40);
        doc.text(`Preço de Venda: R$ ${formData.selling_price.toFixed(2)}`, 14, 46);
        doc.text(`Tempo de Preparo: ${formData.preparation_time_minutes} min`, 14, 52);

        const totalCost = selectedIngredients.reduce((acc, curr) => acc + (curr.cost * curr.quantity), 0);
        const margin = formData.selling_price - totalCost;
        const marginPercent = formData.selling_price > 0 ? (margin / formData.selling_price) * 100 : 0;

        doc.text(`Custo Total: R$ ${totalCost.toFixed(2)}`, 100, 46);
        doc.text(`Margem: ${marginPercent.toFixed(0)}% (R$ ${margin.toFixed(2)})`, 100, 52);

        if (formData.description) {
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Descrição: ${formData.description}`, 14, 60);
        }

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
            headStyles: { fillColor: [41, 37, 36] },
            styles: { fontSize: 10 }
        });

        addPdfFooter(doc);
        doc.save(`ficha-tecnica-${formData.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
        toast({ title: 'Ficha Técnica gerada!' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        const finalIngredients: Array<{ ingredient_id: string; quantity: number; display_unit?: string }> = [];

        for (const si of selectedIngredients) {
            let ingredientId = si.ingredient_id;

            if (si.is_virtual) {
                const existing = ingredients.find(i => i.name.toLowerCase() === si.name.toLowerCase());
                if (existing) {
                    ingredientId = existing.id;
                } else {
                    // Normalize unit before creation to prevent DB errors
                    const rawUnit = si.unit.toLowerCase();
                    const normalizedUnit = rawUnit === 'unidade' ? 'un'
                        : rawUnit === 'grama' ? 'g'
                            : rawUnit === 'litro' ? 'l'
                                : rawUnit === 'kilograma' ? 'kg'
                                    : rawUnit;

                    const { data: newIng, error } = await createIngredient({
                        name: si.name,
                        unit: normalizedUnit as any,
                        cost_per_unit: si.cost,
                        stock_quantity: 0,
                    });

                    if (error || !newIng) {
                        toast({ title: `Erro ao criar ingrediente: ${si.name}`, variant: 'destructive' });
                        setUploading(false);
                        return;
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

        let imageUrl: string | null = null;
        if (imageFile && user) {
            try {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, imageFile);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
                imageUrl = data.publicUrl;
            } catch (error) {
                console.error('Error uploading image:', error);
                toast({ title: 'Erro ao fazer upload da imagem', variant: 'destructive' });
                setUploading(false);
                return;
            }
        } else if (imagePreview && !imagePreview.startsWith('blob:')) {
            imageUrl = imagePreview; // No more lint error here
        }

        const productData = {
            name: formData.name,
            description: formData.description,
            selling_price: formData.selling_price,
            active: true,
            category: formData.category || null,
            preparation_time_minutes: formData.preparation_time_minutes,
            selling_unit: 'un',
            is_highlight: formData.is_highlight,
        };

        if (productToEdit) {
            const { error } = await updateProduct(
                productToEdit.id,
                { ...productData, ...(imageUrl ? { image_url: imageUrl } : {}) },
                finalIngredients
            );
            setUploading(false);
            if (!error) {
                toast({ title: 'Produto atualizado com sucesso!' });
                onSuccess();
                onOpenChange(false);
            } else {
                toast({ title: 'Erro ao atualizar produto', description: error.message, variant: 'destructive' });
            }
        } else {
            const { error } = await createProduct(
                { ...productData, image_url: imageUrl },
                finalIngredients
            );
            setUploading(false);
            if (!error) {
                toast({ title: 'Produto criado com sucesso!' });
                if (isOnboardingActive && currentStep === 'create-button') nextStep();
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

    const loadProductPreset = (productName: string) => {
        const preset = PRESET_PRODUCTS.find(p => p.name === productName);
        if (!preset) return;

        setFormData({
            name: preset.name,
            description: preset.description,
            selling_price: preset.selling_price,
            category: 'Lanches',
            preparation_time_minutes: 0,
            hourly_rate: 0,
            is_highlight: false
        });
        setImagePreview(preset.image_url);

        const newSelectedIngredients: SelectedIngredient[] = [];

        preset.ingredients.forEach((pi, index) => {
            const existingDb = ingredients.find(i => i.name.toLowerCase() === pi.name.toLowerCase());

            if (existingDb) {
                const isKg = (existingDb.unit as string) === 'kg' || (existingDb.unit as string) === 'kilograma';
                const isL = (existingDb.unit as string) === 'l' || (existingDb.unit as string) === 'litro';
                const useSubUnit = (isKg || isL) && pi.quantity < 1;
                let displayUnit: string = existingDb.unit;
                if (useSubUnit) displayUnit = isKg ? 'g' : 'ml';
                const displayQty = convertQuantity(pi.quantity, existingDb.unit, displayUnit);

                newSelectedIngredients.push({
                    uniqueId: `${existingDb.id}_${Date.now()}_${index}`,
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
                const presetIng = PRESET_INGREDIENTS.find(i => i.name.toLowerCase() === pi.name.toLowerCase());
                if (presetIng) {
                    const isKg = (presetIng.unit as string) === 'kg';
                    const isL = (presetIng.unit as string) === 'l' || (presetIng.unit as string) === 'litro';
                    const useSubUnit = (isKg || isL) && pi.quantity < 1;
                    let displayUnit: string = presetIng.unit;
                    if (useSubUnit) displayUnit = isKg ? 'g' : 'ml';
                    const displayQty = convertQuantity(pi.quantity, presetIng.unit, displayUnit);

                    newSelectedIngredients.push({
                        uniqueId: `virtual_${Date.now()}_${index}`,
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
                id="onboarding-create-product-btn"
                type="submit"
                className="flex-1"
                disabled={uploading}
                form="product-form"
            >
                {uploading ? 'Salvando...' : (productToEdit ? 'Atualizar' : 'Criar Produto')}
            </Button>
        </div>
    );

    const overlays = (
        <>
            <OnboardingOverlay
                stepName="create-button"
                targetId="onboarding-create-product-btn"
                message="Tudo pronto! O custo foi calculado automaticamente. Clique para criar."
                position="top"
            />
            <OnboardingOverlay
                stepName="new-product-form"
                targetId="onboarding-step-3-trigger"
                message="Para facilitar, vamos usar um modelo pronto de receita!"
                position="left"
                backdropClassName="bg-black/20"
            />
            <OnboardingOverlay
                stepName="template-list"
                targetId="onboarding-template-list"
                message="Escolha um destes produtos populares para começar."
                position="left"
                backdropClassName="bg-black/20"
            />
        </>
    );

    const FormFields = (
        <div className="space-y-6 py-4 pb-24 sm:pb-4">
            <ProductBasicInfo
                formData={formData}
                setFormData={setFormData}
                imagePreview={imagePreview}
                handleImageSelect={imageSelectHandler}
                availableCategories={availableCategories}
            />
            <ProductIngredients
                selectedIngredients={selectedIngredients}
                ingredients={ingredients}
                addExistingIngredient={addExistingIngredient}
                addNewIngredient={addNewIngredient}
                removeIngredient={removeIngredient}
                updateIngredientDisplayQuantity={updateIngredientDisplayQuantity}
                updateIngredientDisplayUnit={updateIngredientDisplayUnit}
                updateIngredientSelection={updateIngredientSelection}
                loadProductPreset={loadProductPreset}
                clearForm={clearForm}
                isOnboardingActive={isOnboardingActive}
                currentStep={currentStep}
                nextStep={nextStep}
            />
            <ProductPricing
                formData={formData}
                setFormData={setFormData}
            />
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
                        <ProductPricingSummary
                            totalCost={totalCost}
                            margin={margin}
                            formData={formData}
                            setFormData={setFormData}
                            setIsPriceManual={setIsPriceManual}
                        />
                        <ActionButtons />
                    </DrawerFooter>
                    {overlays}
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
                        <ProductPricingSummary
                            totalCost={totalCost}
                            margin={margin}
                            formData={formData}
                            setFormData={setFormData}
                            setIsPriceManual={setIsPriceManual}
                        />
                        <ActionButtons />
                    </div>
                </div>
            </DialogContent>
            {overlays}
        </Dialog >
    );
};

export default ProductBuilder;
