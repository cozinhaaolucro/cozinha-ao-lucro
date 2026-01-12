import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox'; // Added
import { getIngredients, createIngredient, updateIngredient, deleteIngredient, getOrders } from '@/lib/database';
import { exportToExcel, importFromExcel } from '@/lib/excel';
import { Badge } from '@/components/ui/badge';
import type { Ingredient } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import BulkEditIngredientsDialog from './BulkEditIngredientsDialog'; // Added

import { presetIngredients } from '@/data/presetIngredients';



const IngredientList = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();

    // Check for 'new' action ONLY if we are on the ingredients tab (checked implicitly by parent or URL context)
    // Actually simpler: if this component is mounted and action=new matches requirements
    useEffect(() => {
        if (searchParams.get('action') === 'new' && searchParams.get('tab') === 'ingredients') {
            setIsDialogOpen(true);
            searchParams.delete('action');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        unit: 'kg' as 'kg' | 'litro' | 'unidade' | 'grama' | 'ml',
        cost_per_unit: 0,
        stock_quantity: 0,
        min_stock_threshold: 0,
    });
    const { toast } = useToast();

    // Bulk Selection State
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
    const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);







    const loadIngredients = async () => {
        const { data, error } = await getIngredients();
        if (!error && data) {
            // Auto-fix negative stock
            const negativeStock = data.filter(i => (i.stock_quantity || 0) < 0);
            if (negativeStock.length > 0) {
                console.log('Detectado estoque negativo. Corrigindo...', negativeStock);
                await Promise.all(negativeStock.map(ing =>
                    updateIngredient(ing.id, { stock_quantity: 0 })
                ));
                // Reflect change in local state logic by overriding the fetches
                const fixedData = data.map(i => (i.stock_quantity || 0) < 0 ? { ...i, stock_quantity: 0 } : i);
                setIngredients(fixedData);
            } else {
                setIngredients(data);
            }
        }
    };

    useEffect(() => {
        loadIngredients();
    }, []);

    const handlePresetSelect = (presetName: string) => {
        const preset = presetIngredients.find(p => p.name === presetName);
        if (preset) {
            setFormData({
                ...formData,
                name: preset.name,
                unit: preset.unit as any,
                cost_per_unit: Number((preset.price * 1.15).toFixed(2)),
            });
        }
    };

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
        setFormData({ name: '', unit: 'kg', cost_per_unit: 0, stock_quantity: 0, min_stock_threshold: 0 });
        setEditingIngredient(null);
        setIsDialogOpen(false);
    };

    const openEditDialog = (ingredient: Ingredient) => {
        setEditingIngredient(ingredient);
        setFormData({
            name: ingredient.name,
            unit: ingredient.unit as any,
            cost_per_unit: ingredient.cost_per_unit,
            stock_quantity: ingredient.stock_quantity || 0,
            min_stock_threshold: ingredient.min_stock_threshold || 0,
        });
        setIsDialogOpen(true);
    };

    // Bulk Actions
    const toggleSelectAll = () => {
        if (selectedIngredients.length === ingredients.length) {
            setSelectedIngredients([]);
        } else {
            setSelectedIngredients(ingredients.map(i => i.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIngredients.includes(id)) {
            setSelectedIngredients(selectedIngredients.filter(sid => sid !== id));
        } else {
            setSelectedIngredients([...selectedIngredients, id]);
        }
    };

    const handleBulkSave = async (updates: any) => {
        let errorCount = 0;
        for (const id of selectedIngredients) {
            const { error } = await updateIngredient(id, updates);
            if (error) errorCount++;
        }

        if (errorCount > 0) {
            toast({ title: `Atualização concluída com ${errorCount} erros`, variant: 'destructive' });
        } else {
            toast({ title: 'Ingredientes atualizados com sucesso!' });
            loadIngredients();
            setSelectedIngredients([]);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Excluir ${selectedIngredients.length} ingredientes?`)) return;

        let errorCount = 0;
        for (const id of selectedIngredients) {
            const { error } = await deleteIngredient(id);
            if (error) errorCount++;
        }

        if (errorCount > 0) {
            toast({ title: 'Erro ao excluir alguns itens', variant: 'destructive' });
        } else {
            toast({ title: 'Ingredientes excluídos' });
            loadIngredients();
            setSelectedIngredients([]);
        }
    };

    // ... existing export/import ...
    const handleExport = () => {
        const dataToExport = ingredients.map(i => ({
            Nome: i.name,
            Unidade: i.unit,
            'Custo/Unidade': Number(i.cost_per_unit.toFixed(2)),
            Estoque: Number((i.stock_quantity || 0).toFixed(2))
        }));
        exportToExcel(dataToExport, 'ingredientes_cozinha_ao_lucro');
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data: any[] = await importFromExcel(file);
            let successCount = 0;
            let errorCount = 0;

            for (const row of data) {
                const name = row['Nome'] || row['name'] || row['Name'];
                if (!name) continue;

                // Simple handling of unit/cost - defaulting if missing/invalid
                const unit = (['kg', 'litro', 'unidade', 'grama', 'ml'].includes(row['Unidade']?.toLowerCase()) ? row['Unidade'].toLowerCase() : 'unidade') as Ingredient['unit'];

                const { error } = await createIngredient({
                    name: name,
                    unit: unit,
                    cost_per_unit: Number(row['Custo/Unidade'] || row['cost_per_unit'] || 0),
                    stock_quantity: Number(row['Estoque'] || row['stock_quantity'] || 0),
                    min_stock_threshold: Number(row['Estoque Mínimo'] || row['min_stock_threshold'] || 0)
                });

                if (error) errorCount++;
                else successCount++;
            }

            toast({
                title: 'Importação concluída',
                description: `${successCount} ingredientes importados. ${errorCount > 0 ? `${errorCount} falhas.` : ''}`
            });
            loadIngredients();
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro na importação', description: 'Verifique o formato do arquivo.', variant: 'destructive' });
        }

        e.target.value = '';
    };


    const [activeOrders, setActiveOrders] = useState<any[]>([]);

    useEffect(() => {
        const loadActiveOrders = async () => {
            const { data } = await getOrders();
            if (data) {
                setActiveOrders(data.filter(o => ['pending', 'preparing'].includes(o.status)));
            }
        };
        loadActiveOrders();
    }, []);

    const getDemand = (ingredientId: string) => {
        let demand = 0;
        activeOrders.forEach(order => {
            order.items?.forEach((item: any) => {
                // Check if product has ingredients (needs to be fetched with product details in getOrders, which it is)
                item.product?.product_ingredients?.forEach((pi: any) => {
                    if (pi.ingredient_id === ingredientId) {
                        demand += pi.quantity * item.quantity;
                    }
                });
            });
        });
        return demand;
    };

    const getStatusColor = (stock: number, demand: number) => {
        if (demand === 0) return stock > 0 ? 'bg-green-500/5 border-l-green-500' : 'bg-gray-100 border-l-gray-300'; // No demand: Green if stock exists, else Grey

        const ratio = stock / demand;
        if (ratio >= 1) return 'bg-green-500/10 border-l-green-500'; // Sufficient stock
        if (ratio >= 0.5) return 'bg-yellow-500/10 border-l-yellow-500'; // Low/Tight stock
        return 'bg-red-500/10 border-l-red-500'; // Critical shortage
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            {/* ... toolbar ... */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-lg border shadow-sm">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={ingredients.length > 0 && selectedIngredients.length === ingredients.length}
                            onCheckedChange={toggleSelectAll}
                        />
                        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                            {selectedIngredients.length} selecionados
                        </span>
                    </div>
                    {selectedIngredients.length > 0 && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => setIsBulkEditDialogOpen(true)}>
                                <Pencil className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                <span className="hidden xs:inline">Editar</span>
                            </Button>
                            <Button variant="destructive" size="sm" className="text-xs sm:text-sm" onClick={handleBulkDelete}>
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                <span className="hidden xs:inline">Excluir</span>
                            </Button>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 ml-auto">
                    <div className="relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleImport}
                            title="Importar Excel"
                        />
                        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" title="Importar Excel">
                            <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={handleExport} title="Exportar Excel">
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button onClick={() => setIsDialogOpen(true)} className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Novo</span> Ingrediente
                    </Button>
                </div>
            </div>

            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {ingredients.map((ingredient) => {
                    const demand = getDemand(ingredient.id);
                    const stock = Math.max(0, ingredient.stock_quantity || 0);
                    const statusClass = getStatusColor(stock, demand);

                    return (
                        <Card key={ingredient.id} className={`border-l-4 ${statusClass} group`}>
                            <CardContent className="p-3">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={selectedIngredients.includes(ingredient.id)}
                                            onCheckedChange={() => toggleSelect(ingredient.id)}
                                        />
                                        <CardTitle className="text-sm font-medium line-clamp-1">
                                            {ingredient.name}
                                        </CardTitle>
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-primary">
                                    R$ {ingredient.cost_per_unit.toFixed(2)}
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        {stock} {ingredient.unit}
                                    </p>
                                    {stock <= (ingredient.min_stock_threshold || 0) && stock > 0 && (
                                        <Badge variant="outline" className="text-[10px] h-4 bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse">
                                            Baixo
                                        </Badge>
                                    )}
                                    {stock === 0 && (
                                        <Badge variant="destructive" className="text-[10px] h-4 animate-bounce">
                                            Esgotado
                                        </Badge>
                                    )}
                                </div>
                                {demand > 0 && (
                                    <p className="text-[10px] text-orange-600 mt-1">
                                        Demanda: {demand.toFixed(1)} {ingredient.unit}
                                    </p>
                                )}
                                {/* Desktop: hover-only */}
                                <div className="mt-2 hidden md:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-7 text-xs"
                                        onClick={() => openEditDialog(ingredient)}
                                    >
                                        <Pencil className="w-3 h-3 mr-1" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(ingredient.id)}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                                {/* Mobile: always visible */}
                                <div className="mt-2 flex md:hidden">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-7 text-xs"
                                        onClick={() => openEditDialog(ingredient)}
                                    >
                                        <Pencil className="w-3 h-3 mr-1" />
                                        Editar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (!open) resetForm();
                setIsDialogOpen(open);
            }}>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingIngredient ? 'Editar' : 'Novo'} Ingrediente</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!editingIngredient && (
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
                        <div className="grid grid-cols-2 gap-4">
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
                            </div>
                            <div>
                                <Label htmlFor="threshold">Estoque Mínimo</Label>
                                <Input
                                    id="threshold"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.min_stock_threshold}
                                    onChange={(e) => setFormData({ ...formData, min_stock_threshold: parseFloat(e.target.value) || 0 })}
                                    placeholder="Aviso em:"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground -mt-2">
                            Unidade de medida: {formData.unit}
                        </p>
                        <div className="flex gap-2">
                            <Button type="submit" className="flex-1">
                                {editingIngredient ? 'Atualizar' : 'Criar'}
                            </Button>
                            {editingIngredient && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => handleDelete(editingIngredient.id)}
                                >
                                    Excluir
                                </Button>
                            )}
                            <Button type="button" variant="outline" onClick={resetForm}>
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <BulkEditIngredientsDialog
                open={isBulkEditDialogOpen}
                onOpenChange={setIsBulkEditDialogOpen}
                selectedCount={selectedIngredients.length}
                onSave={handleBulkSave}
            />
        </div>
    );
};

export default IngredientList;
