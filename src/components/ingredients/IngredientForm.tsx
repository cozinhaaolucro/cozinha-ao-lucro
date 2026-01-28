
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { convertQuantity } from "@/components/products/builder/utils";
import type { Ingredient } from "@/types/database";
import { Package, Scale, Calculator, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface IngredientFormProps {
    initialData?: Ingredient | null;
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
}

export function IngredientForm({ initialData, onSave, onCancel }: IngredientFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mode: 'simple' (Bulk/Unit) or 'package' (Retail Package)
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

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setSimpleStock(initialData.stock_quantity.toString());

            // Heuristic to detect Package Mode
            if (initialData.package_size && initialData.package_size > 0) {
                setMode('package');
                setPkgSize(initialData.package_size.toString());
                setPkgUnit(initialData.package_unit || initialData.unit);
                // Calculate current packages in stock
                const pSize = initialData.package_size;
                const pUnit = initialData.package_unit || initialData.unit;
                const base = initialData.unit;
                const sizeInBase = convertQuantity(pSize, pUnit, base);
                const currentPkgs = sizeInBase > 0 ? initialData.stock_quantity / sizeInBase : 0;
                setPkgCount(currentPkgs.toFixed(1));

                // Calculate Pkg Price
                const calculatedPkgPrice = initialData.cost_per_unit * sizeInBase;
                setPkgPrice(calculatedPkgPrice.toFixed(2));
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
            let finalData: any = { name };

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
                const activePkgSize = parseFloat(pkgSize) || 0;
                const activePkgPrice = parseFloat(pkgPrice) || 0;
                const activePkgCount = parseFloat(pkgCount) || 0;

                let baseUnit = 'kg';
                if (['l', 'ml', 'litro', 'mililitro'].includes(pkgUnit.toLowerCase())) baseUnit = 'l';
                if (['un', 'unidade'].includes(pkgUnit.toLowerCase())) baseUnit = 'un';

                const conversionFactor = convertQuantity(1, pkgUnit, baseUnit);
                const sizeInBase = activePkgSize * conversionFactor;
                const costPerBase = sizeInBase > 0 ? activePkgPrice / sizeInBase : 0;
                const stockInBase = activePkgCount * sizeInBase;

                finalData = {
                    ...finalData,
                    unit: baseUnit,
                    cost_per_unit: costPerBase,
                    stock_quantity: stockInBase,
                    package_size: activePkgSize,
                    package_unit: pkgUnit,
                    package_qty: activePkgCount,
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
        <form onSubmit={handleSubmit} className="space-y-6 py-2">

            {/* Name Section */}
            <div className="space-y-3">
                <Label className="text-base font-semibold">Nome do Ingrediente</Label>
                <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Leite Condensado, Farinha de Trigo..."
                    required
                    className="h-11 text-base"
                />
            </div>

            {/* Mode Selection */}
            <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tipo de Compra</Label>
                <div className="grid grid-cols-2 gap-4">
                    <div
                        className={cn(
                            "cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-accent hover:border-accent-foreground/20",
                            mode === 'simple' ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-background"
                        )}
                        onClick={() => setMode('simple')}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Scale className={cn("w-5 h-5", mode === 'simple' ? "text-primary" : "text-muted-foreground")} />
                            <span className={cn("font-semibold", mode === 'simple' ? "text-foreground" : "text-muted-foreground")}>Granel / Unidade</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Para itens pesados ou contados (kg, g, un). Ex: Frutas, Carnes.
                        </p>
                    </div>

                    <div
                        className={cn(
                            "cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-accent hover:border-accent-foreground/20",
                            mode === 'package' ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-background"
                        )}
                        onClick={() => setMode('package')}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Package className={cn("w-5 h-5", mode === 'package' ? "text-primary" : "text-muted-foreground")} />
                            <span className={cn("font-semibold", mode === 'package' ? "text-foreground" : "text-muted-foreground")}>Embalagem Fechada</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Para itens industriais (Lata, Caixa, Garrafa). O sistema calcula o custo base.
                        </p>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Dynamic Content */}
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {mode === 'simple' ? (
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label>Unidade de Medida</Label>
                            <Select value={simpleUnit} onValueChange={setSimpleUnit}>
                                <SelectTrigger className="h-10">
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
                            <Label>Custo por {simpleUnit}</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                                <Input
                                    className="pl-9 h-10"
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
                                className="h-10 border-primary/20 focus-visible:ring-primary/40"
                                type="number"
                                step="0.001"
                                value={simpleStock}
                                onChange={e => setSimpleStock(e.target.value)}
                                placeholder="0.00"
                            />
                            <p className="text-[11px] text-muted-foreground">Quantidade total disponível no seu estoque.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="grid grid-cols-[1fr_120px] gap-4">
                            <div className="space-y-2">
                                <Label>Tamanho da Embalagem</Label>
                                <Input
                                    type="number"
                                    value={pkgSize}
                                    onChange={e => setPkgSize(e.target.value)}
                                    placeholder="Ex: 395"
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Unidade</Label>
                                <Select value={pkgUnit} onValueChange={setPkgUnit}>
                                    <SelectTrigger className="h-10">
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
                                <Label className="text-primary font-medium">Preço Pago (Unidade)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">R$</span>
                                    <Input
                                        className="pl-9 h-10 border-primary/30 focus-visible:ring-primary/50 bg-primary/5"
                                        type="number"
                                        step="0.01"
                                        value={pkgPrice}
                                        onChange={e => setPkgPrice(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Quantidade Comprada</Label>
                                <Input
                                    type="number"
                                    value={pkgCount}
                                    onChange={e => setPkgCount(e.target.value)}
                                    placeholder="Ex: 2"
                                    className="h-10"
                                />
                            </div>
                        </div>

                        {/* Simulation Card */}
                        <Card className="bg-muted/30 border-dashed border-border shadow-none">
                            <CardContent className="p-3 pt-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <Calculator className="w-4 h-4 text-primary" />
                                    Cálculo Automático
                                </div>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span>Base Convertida:</span>
                                        <span className="text-foreground font-mono">
                                            {['g', 'ml'].includes(pkgUnit) ? (pkgUnit === 'g' ? 'kg' : 'l') : pkgUnit}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span>Custo Real:</span>
                                        <span className="text-foreground font-mono font-medium">
                                            R$ {(() => {
                                                const size = parseFloat(pkgSize) || 0;
                                                const price = parseFloat(pkgPrice) || 0;
                                                let factor = 1;
                                                if (['g', 'ml'].includes(pkgUnit)) factor = 0.001;
                                                const sizeBase = size * factor;
                                                return sizeBase > 0 ? (price / sizeBase).toFixed(2) : '0.00';
                                            })()}
                                            <span className="text-xs text-muted-foreground ml-1">/{['g', 'ml'].includes(pkgUnit) ? (pkgUnit === 'g' ? 'kg' : 'l') : pkgUnit}</span>
                                        </span>
                                    </div>
                                    <div className="col-span-2 pt-2 mt-1 border-t flex justify-between items-center">
                                        <span className="font-semibold text-primary">Estoque Total Gerado:</span>
                                        <span className="font-bold text-lg">
                                            {(() => {
                                                const count = parseFloat(pkgCount) || 0;
                                                const size = parseFloat(pkgSize) || 0;
                                                let factor = 1;
                                                if (['g', 'ml'].includes(pkgUnit)) factor = 0.001;
                                                return (count * size * factor).toFixed(3);
                                            })()}
                                            <span className="text-sm font-normal text-muted-foreground ml-1">
                                                {['g', 'ml'].includes(pkgUnit) ? (pkgUnit === 'g' ? 'kg' : 'l') : pkgUnit}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <Button variant="outline" type="button" onClick={onCancel} className="h-10 px-6">
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md">
                    {isSubmitting ? 'Salvando...' : (initialData ? 'Atualizar Ingrediente' : 'Criar Ingrediente')}
                </Button>
            </div>
        </form>
    );
}
