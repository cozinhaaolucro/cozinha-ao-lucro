
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createIngredient, updateIngredient, deleteIngredient } from '@/lib/database';
import type { Ingredient } from '@/types/database';
import { useToast } from '@/components/ui/use-toast';
import { presetIngredients } from '@/data/presetIngredients';

interface NewIngredientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    ingredient?: Ingredient | null; // If provided, used for editing
}

const NewIngredientDialog = ({ open, onOpenChange, onSuccess, ingredient }: NewIngredientDialogProps) => {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        unit: 'kg' as 'kg' | 'litro' | 'unidade' | 'grama' | 'ml',
        cost_per_unit: 0,
        stock_quantity: 0,
    });

    useEffect(() => {
        if (ingredient) {
            setFormData({
                name: ingredient.name,
                unit: ingredient.unit,
                cost_per_unit: ingredient.cost_per_unit,
                stock_quantity: ingredient.stock_quantity || 0,
            });
        } else {
            setFormData({ name: '', unit: 'kg', cost_per_unit: 0, stock_quantity: 0 });
        }
    }, [ingredient, open]);

    const handlePresetSelect = (presetName: string) => {
        const preset = presetIngredients.find(p => p.name === presetName);
        if (preset) {
            setFormData({
                ...formData,
                name: preset.name,
                unit: preset.unit as Ingredient['unit'],
                cost_per_unit: Number((preset.price * 1.15).toFixed(2)),
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (ingredient) {
            const { error } = await updateIngredient(ingredient.id, formData);
            if (!error) {
                toast({ title: 'Ingrediente atualizado' });
                onSuccess?.();
            } else {
                toast({
                    title: 'Erro ao atualizar',
                    description: error.message,
                    variant: 'destructive'
                });
            }
        } else {
            const { error } = await createIngredient(formData);
            if (!error) {
                toast({ title: 'Ingrediente criado' });
                onSuccess?.();
            } else {
                toast({
                    title: 'Erro ao criar',
                    description: error.message,
                    variant: 'destructive'
                });
            }
        }
    };

    const handleDelete = async () => {
        if (ingredient && confirm('Tem certeza que deseja excluir?')) {
            const { error } = await deleteIngredient(ingredient.id);
            if (!error) {
                toast({ title: 'Ingrediente excluído' });
                onSuccess?.();
                onOpenChange(false);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{ingredient ? 'Editar' : 'Novo'} Ingrediente</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!ingredient && (
                        <div>
                            <Label>Preencher com modelo</Label>
                            <Select onValueChange={handlePresetSelect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um ingrediente padrão..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {presetIngredients.map((preset) => (
                                        <SelectItem key={preset.name} value={preset.name}>
                                            {preset.name} - R$ {(preset.price * 1.15).toFixed(2)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div>
                        <Label htmlFor="name">Nome</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Leite Condensado"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="unit">Unidade</Label>
                            <Select
                                value={formData.unit}
                                onValueChange={(value) => setFormData({ ...formData, unit: value as Ingredient['unit'] })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="kg">Kg</SelectItem>
                                    <SelectItem value="litro">Litro</SelectItem>
                                    <SelectItem value="grama">Grama</SelectItem>
                                    <SelectItem value="ml">ML</SelectItem>
                                    <SelectItem value="unidade">Unidade</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="cost">Custo por Unidade (R$)</Label>
                            <Input
                                id="cost"
                                type="number"
                                step="0.01"
                                value={formData.cost_per_unit}
                                onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) })}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="stock">Quantidade em Estoque</Label>
                        <Input
                            id="stock"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.stock_quantity}
                            onChange={(e) => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) || 0 })}
                            placeholder="Ex: 5.5"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Quantidade disponível na mesma unidade ({formData.unit})
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" className="flex-1">
                            {ingredient ? 'Atualizar' : 'Criar'}
                        </Button>
                        {ingredient && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                            >
                                Excluir
                            </Button>
                        )}
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default NewIngredientDialog;
