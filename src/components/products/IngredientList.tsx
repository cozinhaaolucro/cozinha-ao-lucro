import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Download, Upload, Package, FileSpreadsheet, FileDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatUnit } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { getIngredients, createIngredient, updateIngredient, deleteIngredient, getOrders } from '@/lib/database';
import { exportToExcel, exportToCSV, importFromExcel } from '@/lib/excel';
import { Badge } from '@/components/ui/badge';
import type { Ingredient } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import BulkEditIngredientsDialog from './BulkEditIngredientsDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

import { presetIngredients } from '@/data/presetIngredients';
import { getIngredientIcon } from '@/lib/ingredientIcons';

const IngredientList = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const isMobile = useIsMobile();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [searchParams, setSearchParams] = useSearchParams();

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
    });
    const { toast } = useToast();

    // Bulk Selection State
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
    const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);

    // Package Mode State
    const [packageMode, setPackageMode] = useState(false);
    const [packageQty, setPackageQty] = useState(1);
    const [packageSize, setPackageSize] = useState(0);
    const [packageUnit, setPackageUnit] = useState<'grama' | 'ml' | 'unidade' | 'kg' | 'litro'>('grama');

    const loadIngredients = async () => {
        const { data, error } = await getIngredients();
        if (!error && data) {
            setIngredients(data);
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

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Calculate final stock quantity based on mode
        const finalStockQuantity = packageMode
            ? packageQty * packageSize
            : formData.stock_quantity;

        const submitData = {
            ...formData,
            stock_quantity: finalStockQuantity,
            // Use package unit when in package mode
            unit: packageMode ? packageUnit : formData.unit
        };

        if (editingIngredient) {
            const { error } = await updateIngredient(editingIngredient.id, submitData);
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
            }
        } else {
            const { error } = await createIngredient(submitData);
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
        setPackageMode(false);
        setPackageQty(1);
        setPackageSize(0);
        setPackageUnit('grama');
        setIsDialogOpen(false);
    };

    const openEditDialog = (ingredient: Ingredient) => {
        setEditingIngredient(ingredient);
        setFormData({
            name: ingredient.name,
            unit: ingredient.unit as any,
            cost_per_unit: ingredient.cost_per_unit,
            stock_quantity: ingredient.stock_quantity || 0,
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

    // ... Export/Import logic ...
    const handleExport = (format: 'excel' | 'csv') => {
        const dataToExport = ingredients.map(i => ({
            Nome: i.name,
            Unidade: i.unit,
            'Custo/Unidade': Number(i.cost_per_unit.toFixed(2)),
            Estoque: Number((i.stock_quantity || 0).toFixed(2))
        }));
        if (format === 'csv') {
            exportToCSV(dataToExport, 'ingredientes_cozinha_ao_lucro');
        } else {
            exportToExcel(dataToExport, 'ingredientes_cozinha_ao_lucro');
        }
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
                const unit = (['kg', 'litro', 'unidade', 'grama', 'ml'].includes(row['Unidade']?.toLowerCase()) ? row['Unidade'].toLowerCase() : 'unidade') as Ingredient['unit'];

                const { error } = await createIngredient({
                    name: name,
                    unit: unit,
                    cost_per_unit: Number(row['Custo/Unidade'] || row['cost_per_unit'] || 0),
                    stock_quantity: Number(row['Estoque'] || row['stock_quantity'] || 0),
                } as any);

                if (error) errorCount++;
                else successCount++;
            }
            toast({ title: 'Importação concluída', description: `${successCount} sucesso, ${errorCount} erros.` });
            loadIngredients();
        } catch (error) {
            toast({ title: 'Erro na importação', variant: 'destructive' });
        }
        e.target.value = '';
    };

    const [activeOrders, setActiveOrders] = useState<any[]>([]);

    useEffect(() => {
        const loadActiveOrders = async () => {
            const { data } = await getOrders();
            if (data) setActiveOrders(data.filter(o => ['pending', 'preparing'].includes(o.status)));
        };
        loadActiveOrders();
    }, []);

    const getDemand = (ingredientId: string) => {
        let demand = 0;
        activeOrders.forEach(order => {
            order.items?.forEach((item: any) => {
                item.product?.product_ingredients?.forEach((pi: any) => {
                    if (pi.ingredient_id === ingredientId) demand += pi.quantity * item.quantity;
                });
            });
        });
        return demand;
    };

    const getStatusType = (stock: number, demand: number) => {
        if (demand === 0) return stock > 0 ? 'good' : 'neutral';
        const ratio = stock / demand;
        if (ratio >= 1) return 'good';
        if (ratio >= 0.5) return 'warning';
        return 'critical';
    };

    const getStatusStyles = (type: string) => {
        switch (type) {
            case 'good': return { text: 'text-emerald-700', icon: 'text-emerald-600/80', bg: '' };
            case 'warning': return { text: 'text-amber-700', icon: 'text-amber-600/80', bg: '' };
            case 'critical': return { text: 'text-red-700', icon: 'text-red-600/80', bg: '' };
            default: return { text: 'text-muted-foreground', icon: 'text-muted-foreground/70', bg: '' };
        }
    };

    // --- FORM CONTENT ---
    const FormContent = (
        <div className="space-y-6 pb-20 sm:pb-0">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
                    <Package className="w-5 h-5 text-primary" />
                    <h3>Detalhes do Ingrediente</h3>
                </div>

                {!editingIngredient && (
                    <div className="space-y-2">
                        <Label>Preencher com modelo (Opcional)</Label>
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
                        className="h-10"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="unit">Unidade</Label>
                        <Select
                            value={formData.unit}
                            onValueChange={(value) => setFormData({ ...formData, unit: value as any })}
                        >
                            <SelectTrigger className="h-10">
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
                        <Label htmlFor="cost">Custo / Unidade (R$)</Label>
                        <Input
                            id="cost"
                            type="number"
                            step="0.01"
                            value={formData.cost_per_unit}
                            onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) })}
                            required
                            className="h-10"
                        />
                    </div>
                </div>

                {/* Stock Entry Mode Toggle */}
                <div className="space-y-4 p-3 bg-muted/10 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Modo de Entrada</Label>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs ${!packageMode ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Direto</span>
                            <Switch
                                checked={packageMode}
                                onCheckedChange={(checked) => {
                                    setPackageMode(checked);
                                    if (!checked) {
                                        // Reset package values when switching back to direct
                                        setPackageQty(1);
                                        setPackageSize(0);
                                    }
                                }}
                            />
                            <span className={`text-xs ${packageMode ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Pacotes</span>
                        </div>
                    </div>

                    {!packageMode ? (
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
                                className="h-10"
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="packageQty">Qtd. de Pacotes</Label>
                                    <Input
                                        id="packageQty"
                                        type="number"
                                        step="1"
                                        min="1"
                                        value={packageQty}
                                        onChange={(e) => setPackageQty(parseInt(e.target.value) || 1)}
                                        placeholder="Ex: 3"
                                        className="h-10"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="packageSize">Tamanho por Pacote</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="packageSize"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={packageSize}
                                            onChange={(e) => setPackageSize(parseFloat(e.target.value) || 0)}
                                            placeholder="Ex: 350"
                                            className="h-10 flex-1"
                                        />
                                        <Select
                                            value={packageUnit}
                                            onValueChange={(value) => setPackageUnit(value as any)}
                                        >
                                            <SelectTrigger className="h-10 w-24">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="grama">g</SelectItem>
                                                <SelectItem value="ml">ml</SelectItem>
                                                <SelectItem value="unidade">un</SelectItem>
                                                <SelectItem value="kg">kg</SelectItem>
                                                <SelectItem value="litro">L</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview */}
                            <div className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-200">
                                <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                                    <Package className="w-3.5 h-3.5" />
                                    Total calculado:
                                </span>
                                <span className="text-sm font-bold text-emerald-700">
                                    {(packageQty * packageSize).toFixed(2)} {packageUnit}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-[10px] text-muted-foreground p-2 bg-muted/20 rounded border">
                    Unidade de medida atual: <strong>{formData.unit}</strong>
                </p>
            </div>
        </div>
    );

    const FooterButtons = (
        <div className="flex items-center justify-between w-full gap-4 pt-2 border-t mt-auto bg-background/95 backdrop-blur">
            <div className="flex gap-2 w-full justify-end">
                <Button type="button" variant="ghost" onClick={resetForm}>
                    Cancelar
                </Button>
                {editingIngredient && (
                    <Button
                        type="button"
                        variant="outline"
                        className="text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
                        onClick={() => handleDelete(editingIngredient.id)}
                    >
                        Excluir
                    </Button>
                )}
                <Button onClick={() => handleSubmit()} className={editingIngredient ? "px-6" : "px-6 flex-1 sm:flex-none"}>
                    {editingIngredient ? 'Salvar Alterações' : 'Criar Ingrediente'}
                </Button>
            </div>
        </div>
    );

    // --- RENDER ---
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-3 sm:p-4 rounded-xl border border-border/50 shadow-sm border-l-4 border-l-primary/50">
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
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={handleImport}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9"
                        title="Importar Excel"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" title="Exportar / Baixar Modelo">
                                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Planilha</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleExport('excel')}>
                                <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('csv')}>
                                <FileText className="w-4 h-4 mr-2" /> CSV (.csv)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Template</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => import('@/lib/excel').then(mod => mod.downloadTemplate(['Nome', 'Unidade', 'Custo/Unidade', 'Estoque'], 'ingredientes'))}>
                                <FileDown className="w-4 h-4 mr-2" /> Modelo de Importação
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={() => setIsDialogOpen(true)} className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Novo</span> Ingrediente
                    </Button>
                </div>
            </div>

            {ingredients.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <Plus className="w-12 h-12 text-muted-foreground/20" />
                            <h3 className="font-bold text-lg">Sua dispensa está vazia</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                Cadastre seus ingredientes base (como farinha, açúcar, embalagens) para compor o custo dos seus produtos.
                            </p>
                            <Button className="mt-4 gap-2" onClick={() => setIsDialogOpen(true)}>
                                <Plus className="w-4 h-4" /> Cadastrar Ingrediente
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {ingredients.map((ingredient) => {
                        const demand = getDemand(ingredient.id);
                        const stock = ingredient.stock_quantity || 0;
                        const statusType = getStatusType(stock, demand);
                        const styles = getStatusStyles(statusType);

                        return (
                            <Card key={ingredient.id} className="group hover:scale-[1.01] transition-all duration-200">
                                <CardContent className="p-3">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={selectedIngredients.includes(ingredient.id)}
                                                onCheckedChange={() => toggleSelect(ingredient.id)}
                                            />
                                            {(() => {
                                                const Icon = getIngredientIcon(ingredient.name);
                                                return <Icon className={`w-4 h-4 ${styles.icon}`} />;
                                            })()}
                                            <CardTitle className={`text-sm font-medium line-clamp-1 ${styles.text}`}>
                                                {ingredient.name}
                                            </CardTitle>
                                        </div>
                                    </div>
                                    <div className="text-lg font-bold text-foreground/90">
                                        R$ {ingredient.cost_per_unit.toFixed(2)}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-xs font-semibold ${styles.text}`}>
                                            {Number(stock.toFixed(2))} {formatUnit(stock, ingredient.unit)}
                                        </p>
                                        {stock < 0 && (
                                            <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                                                Negativo
                                            </Badge>
                                        )}
                                        {stock === 0 && (
                                            <Badge variant="secondary" className="text-[10px] h-4 opacity-70 px-1.5">
                                                Esgotado
                                            </Badge>
                                        )}
                                    </div>
                                    {demand > 0 && (
                                        <p className="text-[10px] text-orange-600 mt-1">
                                            Demanda: {demand.toFixed(1)} {formatUnit(demand, ingredient.unit)}
                                        </p>
                                    )}
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
                        );
                    })}
                </div>
            )}

            {isMobile ? (
                <Drawer open={isDialogOpen} onOpenChange={(open) => {
                    if (!open) resetForm();
                    setIsDialogOpen(open);
                }}>
                    <DrawerContent className="h-[90vh] flex flex-col">
                        <DrawerHeader className="border-b pb-4">
                            <DrawerTitle>{editingIngredient ? 'Editar Ingrediente' : 'Novo Ingrediente'}</DrawerTitle>
                            <DrawerDescription>
                                {editingIngredient ? 'Faça alterações no ingrediente existente' : 'Cadastre um novo ingrediente para seu estoque'}
                            </DrawerDescription>
                        </DrawerHeader>
                        <ScrollArea className="flex-1 overflow-y-auto">
                            <div className="px-4 py-4 w-full max-w-md mx-auto">
                                {FormContent}
                            </div>
                        </ScrollArea>
                        <div className="p-4 border-t mt-auto">
                            {FooterButtons}
                        </div>
                    </DrawerContent>
                </Drawer>
            ) : (
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    if (!open) resetForm();
                    setIsDialogOpen(open);
                }}>
                    <DialogContent className="sm:max-w-[500px] flex flex-col p-0 max-h-[85vh]">
                        <DialogHeader className="p-6 pb-2 border-b bg-background z-10 rounded-t-lg">
                            <DialogTitle>{editingIngredient ? 'Editar Ingrediente' : 'Novo Ingrediente'}</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="flex-1 p-6 overflow-y-auto">
                            {FormContent}
                        </ScrollArea>
                        <div className="p-4 border-t bg-muted/10 rounded-b-lg">
                            {FooterButtons}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

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
