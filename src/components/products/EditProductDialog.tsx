import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Calculator } from 'lucide-react';
import { getIngredients } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import type { Ingredient, Product } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

type ProductWithIngredients = Product & {
    product_ingredients: Array<{
        quantity: number;
        ingredient: Ingredient;
    }>;
};

type EditProductDialogProps = {
    product: ProductWithIngredients | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
};

const EditProductDialog = ({ product, open, onOpenChange, onSuccess }: EditProductDialogProps) => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        selling_price: 0,
        selling_unit: 'unidade',
    });
    const [selectedIngredients, setSelectedIngredients] = useState<Array<{ ingredient_id: string; quantity: number }>>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            loadIngredients();
            if (product) {
                setFormData({
                    name: product.name,
                    description: product.description || '',
                    selling_price: product.selling_price || 0,
                    selling_unit: (product as ProductWithIngredients & { selling_unit?: string }).selling_unit || 'unidade',
                });
                setSelectedIngredients(
                    product.product_ingredients?.map(pi => ({
                        ingredient_id: pi.ingredient.id,
                        quantity: pi.quantity,
                    })) || []
                );
            }
        }
    }, [open, product]);

    const loadIngredients = async () => {
        const { data, error } = await getIngredients();
        if (!error && data) {
            setIngredients(data);
        }
    };

    const addIngredient = () => {
        if (ingredients.length === 0) {
            toast({ title: 'Cadastre ingredientes primeiro!', variant: 'destructive' });
            return;
        }
        setSelectedIngredients([...selectedIngredients, { ingredient_id: ingredients[0].id, quantity: 1 }]);
    };

    const removeIngredient = (index: number) => {
        setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
    };

    const updateIngredient = (index: number, field: 'ingredient_id' | 'quantity', value: string | number) => {
        const updated = [...selectedIngredients];
        updated[index] = { ...updated[index], [field]: value };
        setSelectedIngredients(updated);
    };

    const calculateTotalCost = () => {
        return selectedIngredients.reduce((total, si) => {
            const ingredient = ingredients.find((ing) => ing.id === si.ingredient_id);
            if (!ingredient) return total;
            return total + (ingredient.cost_per_unit * si.quantity);
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
        if (!product) return;

        // Update product
        const { error: productError } = await supabase
            .from('products')
            .update({
                name: formData.name,
                description: formData.description,
                selling_price: formData.selling_price,
                selling_unit: formData.selling_unit,
                updated_at: new Date().toISOString(),
            })
            .eq('id', product.id);

        if (productError) {
            toast({ title: 'Erro ao atualizar produto', description: productError.message, variant: 'destructive' });
            return;
        }

        // Delete old ingredients
        await supabase.from('product_ingredients').delete().eq('product_id', product.id);

        // Insert new ingredients
        if (selectedIngredients.length > 0) {
            const { error: ingredientsError } = await supabase
                .from('product_ingredients')
                .insert(
                    selectedIngredients.map((ing) => ({
                        product_id: product.id,
                        ingredient_id: ing.ingredient_id,
                        quantity: ing.quantity,
                    }))
                );

            if (ingredientsError) {
                toast({ title: 'Erro ao atualizar ingredientes', description: ingredientsError.message, variant: 'destructive' });
                return;
            }
        }

        toast({ title: 'Produto atualizado com sucesso!' });
        onSuccess();
        onOpenChange(false);
    };

    const handleDelete = async () => {
        if (!product) return;
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', product.id);

        if (error) {
            toast({ title: 'Erro ao excluir produto', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Produto excluído com sucesso' });
            onSuccess();
            onOpenChange(false);
        }
    };

    if (!product) return null;

    const totalCost = calculateTotalCost();
    const margin = calculateMargin();
    const suggestedPrice = getSuggestedPrice();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Produto</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nome do Produto *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="selling_unit">Unidade de Venda</Label>
                            <Select value={formData.selling_unit} onValueChange={(value) => setFormData({ ...formData, selling_unit: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unidade">Unidade</SelectItem>
                                    <SelectItem value="kg">Kg</SelectItem>
                                    <SelectItem value="pacote">Pacote</SelectItem>
                                    <SelectItem value="duzia">Dúzia</SelectItem>
                                    <SelectItem value="caixa">Caixa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Receita (Ingredientes)</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addIngredient} className="gap-2">
                                <Plus className="w-4 h-4" />
                                Adicionar Ingrediente
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {selectedIngredients.map((si, index) => {
                                const ingredient = ingredients.find((ing) => ing.id === si.ingredient_id);
                                return (
                                    <div key={index} className="flex items-center gap-2">
                                        <Select
                                            value={si.ingredient_id}
                                            onValueChange={(value) => updateIngredient(index, 'ingredient_id', value)}
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
                                        <Input
                                            type="number"
                                            step="0.001"
                                            value={si.quantity}
                                            onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="w-32"
                                        />
                                        <span className="text-sm text-muted-foreground w-16">{ingredient?.unit || ''}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeIngredient(index)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

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
                                <Label htmlFor="price">Preço de Venda *</Label>
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

                    <div className="flex gap-2">
                        <Button type="submit" className="flex-1">Salvar Alterações</Button>
                        <Button type="button" variant="destructive" onClick={handleDelete}>Excluir</Button>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditProductDialog;
