import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, ChefHat, Package } from 'lucide-react';
import { PRESET_PRODUCTS, PRESET_INGREDIENTS } from '@/data/presets';
import { createProduct, getIngredients, createIngredient } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { Ingredient } from '@/types/database';

interface ProductTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function ProductTemplateDialog({ open, onOpenChange, onSuccess }: ProductTemplateDialogProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState<string | null>(null); // ID of product being created
    const { toast } = useToast();

    const filteredPresets = PRESET_PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUseTemplate = async (preset: typeof PRESET_PRODUCTS[0]) => {
        setLoading(preset.name);
        try {
            // 1. Get existing ingredients
            const { data: existingIngredients, error: ingError } = await getIngredients();
            if (ingError) throw ingError;

            const ingredientsPayload = [];

            // 2. Process each ingredient in the preset
            for (const presetIng of preset.ingredients) {
                // Find case-insensitive match
                let ingredient = existingIngredients?.find(i =>
                    i.name.toLowerCase() === presetIng.name.toLowerCase()
                );

                // If not found, create it based on PRESET_INGREDIENTS
                if (!ingredient) {
                    const templateIng = PRESET_INGREDIENTS.find(i =>
                        i.name.toLowerCase() === presetIng.name.toLowerCase()
                    );

                    if (templateIng) {
                        const { data: newIng, error: createError } = await createIngredient({
                            name: templateIng.name,
                            unit: templateIng.unit,
                            cost_per_unit: templateIng.cost_per_unit,
                            stock_quantity: 0
                        });

                        if (createError || !newIng) {
                            console.error("Failed to create ingredient", presetIng.name, createError);
                            // We might skip or fail. Let's fail safe - skip this ingredient
                            continue;
                        }
                        ingredient = newIng;
                    } else {
                        // Fallback if ingredient template not found (shouldn't happen given data consistency)
                        console.warn("Ingredient template not found for", presetIng.name);
                        continue;
                    }
                }

                if (ingredient) {
                    ingredientsPayload.push({
                        ingredient_id: ingredient.id,
                        quantity: presetIng.quantity
                    });
                }
            }

            // 3. Create Product
            const productData = {
                name: preset.name,
                description: preset.description,
                selling_price: preset.selling_price,
                active: true,
                image_url: preset.image_url,
                selling_unit: 'unidade', // Default for all presets currently
                category: 'Geral',
                preparation_time_minutes: 30
            } as any;

            const { error: createError } = await createProduct(productData, ingredientsPayload);
            if (createError) throw createError;

            toast({ title: 'Produto criado com sucesso!' });
            onSuccess();
            onOpenChange(false);

        } catch (error: any) {
            console.error(error);
            toast({
                title: 'Erro ao criar produto',
                description: error.message || 'Verifique o console para mais detalhes.',
                variant: 'destructive'
            });
        } finally {
            setLoading(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Biblioteca de Modelos</DialogTitle>
                    <DialogDescription>
                        Escolha um modelo pronto para adicionar ao seu cardápio com todos os ingredientes já configurados.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative my-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou ingrediente..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                        {filteredPresets.map((product, idx) => (
                            <Card key={idx} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                                <div className="h-40 bg-muted relative">
                                    {product.image_url ? (
                                        <div className="relative w-full h-full">
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Hide image and show fallback
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                                                }}
                                            />
                                            {/* Hidden fallback that shows on error */}
                                            <div className="fallback-icon hidden absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                                                <ChefHat className="w-12 h-12 opacity-20" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            <ChefHat className="w-12 h-12 opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full font-bold z-10">
                                        R$ {product.selling_price.toFixed(2)}
                                    </div>
                                </div>
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-base line-clamp-1" title={product.name}>
                                        {product.name}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]">
                                        {product.description}
                                    </p>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 flex-1">
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        <p className="font-semibold mb-1 flex items-center gap-1">
                                            <Package className="w-3 h-3" />
                                            {product.ingredients.length} Ingredientes:
                                        </p>
                                        <p className="line-clamp-2">
                                            {product.ingredients.map(i => i.name).join(', ')}
                                        </p>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    <Button
                                        size="sm"
                                        className="w-full h-8 text-xs gap-1.5"
                                        onClick={() => handleUseTemplate(product)}
                                        disabled={!!loading}
                                    >
                                        {loading === product.name ? (
                                            "Criando..."
                                        ) : (
                                            <>
                                                <Plus className="w-3.5 h-3.5" /> Usar Modelo
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    {filteredPresets.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            Nenhum modelo encontrado.
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
