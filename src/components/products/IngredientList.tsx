import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getIngredients, createIngredient, updateIngredient, deleteIngredient } from '@/lib/database';
import type { Ingredient } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

const IngredientList = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        unit: 'kg' as 'kg' | 'litro' | 'unidade' | 'grama' | 'ml',
        cost_per_unit: 0,
        stock_quantity: 0,
    });
    const { toast } = useToast();

    const loadIngredients = async () => {
        const { data, error } = await getIngredients();
        if (!error && data) {
            setIngredients(data);
        }
    };

    useEffect(() => {
        loadIngredients();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingIngredient) {
            const { error } = await updateIngredient(editingIngredient.id, formData);
            if (!error) {
                toast({ title: 'Ingrediente atualizado' });
                loadIngredients();
                resetForm();
            } else {
                toast({
                    title: 'Erro ao atualizar ingrediente',
                    description: error.message,
                    variant: 'destructive'
                });
                console.error('Erro:', error);
            }
        } else {
            const { error } = await createIngredient(formData);
            if (!error) {
                toast({ title: 'Ingrediente criado' });
                loadIngredients();
                resetForm();
            } else {
                toast({
                    title: 'Erro ao criar ingrediente',
                    description: error.message,
                    variant: 'destructive'
                });
                console.error('Erro:', error);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este ingrediente?')) {
            const { error } = await deleteIngredient(id);
            if (!error) {
                toast({ title: 'Ingrediente excluído' });
                loadIngredients();
            }
        }
    };

    const resetForm = () => {
        setFormData({ name: '', unit: 'kg', cost_per_unit: 0, stock_quantity: 0 });
        setEditingIngredient(null);
        setIsDialogOpen(false);
    };

    const openEditDialog = (ingredient: Ingredient) => {
        setEditingIngredient(ingredient);
        setFormData({
            name: ingredient.name,
            unit: ingredient.unit as any,
            cost_per_unit: ingredient.cost_per_unit,
            stock_quantity: (ingredient as any).stock_quantity || 0,
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Ingredientes</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Novo Ingrediente
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingIngredient ? 'Editar' : 'Novo'} Ingrediente</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                        onValueChange={(value) => setFormData({ ...formData, unit: value as any })}
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
                                    {editingIngredient ? 'Atualizar' : 'Criar'}
                                </Button>
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-3">
                {ingredients.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            Nenhum ingrediente cadastrado. Comece adicionando seus ingredientes!
                        </CardContent>
                    </Card>
                ) : (
                    ingredients.map((ingredient) => (
                        <Card key={ingredient.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex-1">
                                    <h4 className="font-medium">{ingredient.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        R$ {ingredient.cost_per_unit.toFixed(2)} por {ingredient.unit}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Estoque: {((ingredient as any).stock_quantity || 0).toFixed(2)} {ingredient.unit}
                                        {(ingredient as any).stock_quantity <= 2 && (
                                            <span className="text-yellow-600 ml-2">⚠️ Estoque baixo</span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEditDialog(ingredient)}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(ingredient.id)}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default IngredientList;
