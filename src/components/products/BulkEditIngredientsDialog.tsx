import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

type BulkEditIngredientsDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCount: number;
    onSave: (updates: { unit?: string; cost_per_unit?: number; stock_quantity?: number }) => Promise<void>;
};

const BulkEditIngredientsDialog = ({ open, onOpenChange, selectedCount, onSave }: BulkEditIngredientsDialogProps) => {
    const [updates, setUpdates] = useState<{
        unit?: string;
        cost_per_unit?: string; // string for input handling
        stock_quantity?: string;
    }>({});

    // Toggle flags to know which fields to update
    const [updateUnit, setUpdateUnit] = useState(false);
    const [updateCost, setUpdateCost] = useState(false);
    const [updateStock, setUpdateStock] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        const finalUpdates: any = {};
        if (updateUnit && updates.unit) finalUpdates.unit = updates.unit;
        if (updateCost && updates.cost_per_unit) finalUpdates.cost_per_unit = parseFloat(updates.cost_per_unit);
        if (updateStock && updates.stock_quantity) finalUpdates.stock_quantity = parseFloat(updates.stock_quantity);

        await onSave(finalUpdates);
        setLoading(false);
        onOpenChange(false);
        // Reset form
        setUpdates({});
        setUpdateUnit(false);
        setUpdateCost(false);
        setUpdateStock(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar {selectedCount} Ingredientes</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-[auto_1fr] items-center gap-4">
                        <Checkbox
                            id="check-unit"
                            checked={updateUnit}
                            onCheckedChange={(c) => setUpdateUnit(!!c)}
                        />
                        <div className="space-y-1">
                            <Label htmlFor="unit" className={!updateUnit ? 'text-muted-foreground' : ''}>Nova Medida</Label>
                            <Select
                                disabled={!updateUnit}
                                value={updates.unit}
                                onValueChange={(v) => setUpdates({ ...updates, unit: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="kg">Quilo (kg)</SelectItem>
                                    <SelectItem value="litro">Litro (l)</SelectItem>
                                    <SelectItem value="unidade">Unidade (un)</SelectItem>
                                    <SelectItem value="grama">Grama (g)</SelectItem>
                                    <SelectItem value="ml">Mililitro (ml)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-[auto_1fr] items-center gap-4">
                        <Checkbox
                            id="check-stock"
                            checked={updateStock}
                            onCheckedChange={(c) => setUpdateStock(!!c)}
                        />
                        <div className="space-y-1">
                            <Label htmlFor="stock" className={!updateStock ? 'text-muted-foreground' : ''}>Nova Quantidade em Estoque</Label>
                            <Input
                                id="stock"
                                type="number"
                                disabled={!updateStock}
                                value={updates.stock_quantity || ''}
                                onChange={(e) => setUpdates({ ...updates, stock_quantity: e.target.value })}
                                placeholder="Ex: 5"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-[auto_1fr] items-center gap-4">
                        <Checkbox
                            id="check-cost"
                            checked={updateCost}
                            onCheckedChange={(c) => setUpdateCost(!!c)}
                        />
                        <div className="space-y-1">
                            <Label htmlFor="cost" className={!updateCost ? 'text-muted-foreground' : ''}>Novo Custo Unitário (R$)</Label>
                            <Input
                                id="cost"
                                type="number"
                                step="0.01"
                                disabled={!updateCost}
                                value={updates.cost_per_unit || ''}
                                onChange={(e) => setUpdates({ ...updates, cost_per_unit: e.target.value })}
                                placeholder="Ex: 10.50"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading || (!updateUnit && !updateCost && !updateStock)}>
                        {loading ? 'Salvando...' : 'Aplicar Alterações'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BulkEditIngredientsDialog;
