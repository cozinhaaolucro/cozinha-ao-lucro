import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Calculator } from 'lucide-react';
import { getIngredients, createProduct } from '@/lib/database';
import type { Ingredient } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

type ProductBuilderProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
};

const ProductBuilder = ({ open, onOpenChange, onSuccess }: ProductBuilderProps) => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        selling_price: 0,
    });
    const [selectedIngredients, setSelectedIngredients] = useState<Array<{ ingredient_id: string; quantity: number }>>
        ([]);
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

        const { error } = await createProduct(
            {
                name: formData.name,
                description: formData.description,
                selling_price: formData.selling_price,
                active: true,
                image_url: null,
            },
            selectedIngredients
        );

        if (!error) {
            toast({ title: 'Produto criado com sucesso!' });
            onSuccess();
            resetForm();
        } else {
            toast({ title: 'Erro ao criar produto', variant: 'destructive' });
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
                            <Button type="button" variant="outline" size="sm" onClick={addIngredient} className="gap-2">
                                <Plus className="w-4 h-4" />
                                Adicionar Ingrediente
                            </Button>
                        </div>

                        {selectedIngredients.length === 0 ? (
                            <Card>
                                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                                    Adicione os ingredientes que compõem este produto
                                </CardContent>
                            </Card>
                        ) : (
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
                                                placeholder="Qtd"
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
