import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { convertQuantity, getUnitOptions } from "@/components/products/builder/utils";
import type { Ingredient } from "@/types/database";
import { Package, Scale, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

interface IngredientFormProps {
    initialData?: Ingredient | null;
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
}

export function IngredientForm({ initialData, onSave, onCancel }: IngredientFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mode: 'simple' (Bulk/Unit) or 'package' ( Retail Package)
    const [mode, setMode] = useState<'simple' | 'package'>('simple');

    // Form States
    const [name, setName] = useState(initialData?.name || "");

    // Simple Mode Inputs
    const [simpleUnit, setSimpleUnit] = useState(initialData?.unit || "kg");
    const [simpleCost, setSimpleCost] = useState(initialData?.cost_per_unit?.toString() || "");
    const [simpleStock, setSimpleStock] = useState(initialData?.stock_quantity?.toString() || "0");

    // Package Mode Inputs
    const [pkgSize, setPkgSize] = useState("");
    const [pkgUnit, setPkgUnit] = useState("g");
    const [pkgPrice, setPkgPrice] = useState(""); // Cost of the PACKAGE
    const [pkgCount, setPkgCount] = useState("1"); // How many packages to add to stock

    // Restore state from initialData if editing
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setSimpleStock(initialData.stock_quantity.toString());

            // Heuristic to detect Package Mode
            if (initialData.package_size && initialData.package_size > 0) {
                setMode('package');
                setPkgSize(initialData.package_size.toString());
                setPkgUnit(initialData.package_unit || initialData.unit); // Default to unit if pkg unit missing
                setPkgCount(""); // Editing usually implies changing details, but we can't easily reverse-engineer "count" unless we assume stock is perfect multiple. Let's leave blank or 0 for stock adjustment? 
                // Actually, for editing, we usually want to edit the METADATA (Cost/Size). Stock adjustment handles the Qty. 
                // But current form handles both.
                // Let's set pkgCount to 0 (no change) or try to calculate?
                // Calculate current packages in stock:
                const pSize = initialData.package_size;
                const pUnit = initialData.package_unit || initialData.unit;
                const base = initialData.unit;
                const sizeInBase = convertQuantity(pSize, pUnit, base);
                const currentPkgs = sizeInBase > 0 ? initialData.stock_quantity / sizeInBase : 0;
                setPkgCount(currentPkgs.toFixed(1));

                // Calculate Pkg Price from CostPerUnit
                // CostPerUnit (Base) * SizeInBase = PriceOfPackage
                const calculatedPkgPrice = initialData.cost_per_unit * sizeInBase;
                setPkgPrice(calculatedPkgPrice.toFixed(2));

                // Set Simple Unit match (for fallback)
                setSimpleUnit(initialData.unit);
            } else {
                setMode('simple');
                setSimpleUnit(initialData.unit);
                setSimpleCost(initialData.cost_per_unit.toFixed(2));
            }
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let finalData: any = {
                name,
            };

            if (mode === 'simple') {
                finalData = {
                    ...finalData,
                    unit: simpleUnit,
                    cost_per_unit: parseFloat(simpleCost) || 0,
                    stock_quantity: parseFloat(simpleStock) || 0,
                    package_size: null,
                    package_unit: null,
                    package_qty: null
                };
            } else {
                // PACKAGE LOGIC - Source of Truth Calculation
                const activePkgSize = parseFloat(pkgSize) || 0;
                const activePkgPrice = parseFloat(pkgPrice) || 0;
                const activePkgCount = parseFloat(pkgCount) || 0;

                // Determine Base Unit
                let baseUnit = 'kg'; // default
                if (['l', 'ml', 'litro', 'mililitro'].includes(pkgUnit.toLowerCase())) baseUnit = 'l';
                if (['un', 'unidade'].includes(pkgUnit.toLowerCase())) baseUnit = 'un'; // Pack of Units

                // Convert Package Size to Base Unit
                // e.g. 395g -> 0.395 kg
                const conversionFactor = convertQuantity(1, pkgUnit, baseUnit);
                const sizeInBase = activePkgSize * conversionFactor;

                // Calculate Cost Per Base Unit
                // Price 5.00 / 0.395kg = 12.66/kg
                const costPerBase = sizeInBase > 0 ? activePkgPrice / sizeInBase : 0;

                // Calculate Stock in Base Unit
                // 5 Boxes * 0.395kg = 1.975 kg
                const stockInBase = activePkgCount * sizeInBase;

                finalData = {
                    ...finalData,
                    unit: baseUnit,
                    cost_per_unit: costPerBase,
                    stock_quantity: stockInBase,
                    package_size: activePkgSize,
                    package_unit: pkgUnit,
                    package_qty: activePkgCount, // Storing 'Last Input Quantity' as metadata? Or Total? 
                    // The DB field package_qty is technically just metadata in the current schema (no stock movement logic here yet). 
                    // Let's store it as metadata for the UI helper.
                };
            }

            await onSave(finalData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label>Nome do Ingrediente</Label>
                <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Leite Condensado"
                    required
                />
            </div>

            <div className="bg-muted/30 p-4 rounded-lg border border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-medium flex items-center gap-2">
                        {mode === 'simple' ? <Scale className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        {mode === 'simple' ? 'Modo Simples (Granel/Unidade)' : 'Modo Pacote (Varejo)'}
                    </Label>
                    <Switch
                        checked={mode === 'package'}
                        onCheckedChange={(c) => setMode(c ? 'package' : 'simple')}
                    />
                </div>

                <p className="text-xs text-muted-foreground">
                    {mode === 'simple'
                        ? 'Ideal para itens comprados a granel, por peso ou itens únicos (ex: kg de farinha, dúzias).'
                        : 'Ideal para itens comprados em embalagens fechadas (ex: lata de 395g, garrafa de 500ml).'}
                </p>

                {mode === 'simple' ? (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                            <Label>Unidade Base</Label>
                            <Select value={simpleUnit} onValueChange={setSimpleUnit}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="kg">Quilo (kg)</SelectItem>
                                    <SelectItem value="g">Grama (g)</SelectItem>
                                    <SelectItem value="l">Litro (l)</SelectItem>
                                    <SelectItem value="ml">Mililitro (ml)</SelectItem>
                                    <SelectItem value="un">Unidade (un)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Custo ({simpleUnit})</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">R$</span>
                                <Input
                                    className="pl-8"
                                    type="number"
                                    step="0.01"
                                    value={simpleCost}
                                    onChange={e => setSimpleCost(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>Estoque Atual ({simpleUnit})</Label>
                            <Input
                                type="number"
                                step="0.001"
                                value={simpleStock}
                                onChange={e => setSimpleStock(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 pt-2">
                        <div className="flex gap-3">
                            <div className="space-y-2 flex-1">
                                <Label>Tamanho da Embalagem</Label>
                                <Input
                                    type="number"
                                    value={pkgSize}
                                    onChange={e => setPkgSize(e.target.value)}
                                    placeholder="Ex: 395"
                                />
                            </div>
                            <div className="space-y-2 w-24">
                                <Label>Unidade</Label>
                                <Select value={pkgUnit} onValueChange={setPkgUnit}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="g">g</SelectItem>
                                        <SelectItem value="ml">ml</SelectItem>
                                        <SelectItem value="kg">kg</SelectItem>
                                        <SelectItem value="l">l</SelectItem>
                                        <SelectItem value="un">un</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-primary font-medium">Preço da Embalagem</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">R$</span>
                                    <Input
                                        className="pl-8 border-primary/30 focus-visible:ring-primary/50"
                                        type="number"
                                        step="0.01"
                                        value={pkgPrice}
                                        onChange={e => setPkgPrice(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Quantidade (Embalagens)</Label>
                                <Input
                                    type="number"
                                    value={pkgCount}
                                    onChange={e => setPkgCount(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Preview Calculation */}
                        <div className="p-3 bg-secondary/30 rounded text-xs gap-2 flex flex-col border border-border/50">
                            <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                <Calculator className="w-3 h-3" />
                                <span>Simulação Automática:</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <div className="flex justify-between">
                                    <span>Base:</span>
                                    <span className="font-mono">{['g', 'ml'].includes(pkgUnit) ? (pkgUnit === 'g' ? 'kg' : 'l') : pkgUnit}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Custo Base:</span>
                                    <span className="font-mono">
                                        R$ {(() => {
                                            const size = parseFloat(pkgSize) || 0;
                                            const price = parseFloat(pkgPrice) || 0;
                                            // Quick calc
                                            let base = ['g', 'ml'].includes(pkgUnit) ? 1000 : 1;
                                            if (pkgUnit === 'un') base = 1;
                                            // if 1kg = 1000g. 395g. 395/1000 = 0.395 base.
                                            let factor = 1;
                                            if (['g', 'ml'].includes(pkgUnit)) factor = 0.001;

                                            const sizeBase = size * factor;
                                            return sizeBase > 0 ? (price / sizeBase).toFixed(2) : '0.00';
                                        })()} / {['g', 'ml'].includes(pkgUnit) ? (pkgUnit === 'g' ? 'kg' : 'l') : pkgUnit}
                                    </span>
                                </div>
                                <div className="flex justify-between col-span-2 pt-1 border-t border-border/30 mt-1">
                                    <span className="font-semibold text-primary">Estoque Total:</span>
                                    <span className="font-bold">
                                        {(() => {
                                            const count = parseFloat(pkgCount) || 0;
                                            const size = parseFloat(pkgSize) || 0;
                                            let factor = 1;
                                            if (['g', 'ml'].includes(pkgUnit)) factor = 0.001;
                                            return (count * size * factor).toFixed(3);
                                        })()} {['g', 'ml'].includes(pkgUnit) ? (pkgUnit === 'g' ? 'kg' : 'l') : pkgUnit}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : (initialData ? 'Atualizar Ingrediente' : 'Criar Ingrediente')}
                </Button>
            </div>
        </form>
    );
}
