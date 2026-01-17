import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, TrendingUp, Pencil, Download, Trash2, Copy, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { getProducts, deleteProduct, updateProduct, createProduct, getIngredients } from '@/lib/database';
import { exportToExcel, exportToCSV, importFromExcel } from '@/lib/excel';
import { PRESET_PRODUCTS } from '@/data/presets';
import type { Product, Ingredient } from '@/types/database';
import ProductBuilder from './ProductBuilder';
import ProductTemplateDialog from './ProductTemplateDialog';
import NewOrderDialog from '../orders/NewOrderDialog';
import { useToast } from '@/hooks/use-toast';
import { useProducts, useIngredients } from '@/hooks/useQueries';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Upload, Image as ImageIcon, FileSpreadsheet, FileText, Info, FileDown, Package } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

type ProductWithIngredients = Product & {
    product_ingredients: Array<{
        quantity: number;
        ingredient: Ingredient;
    }>;
};

const ProductList = ({ onNewProduct }: { onNewProduct: () => void }) => {
    // const [products, setProducts] = useState<ProductWithIngredients[]>([]); // Derived
    // const [ingredients, setIngredients] = useState<Ingredient[]>([]); // Derived
    const [editingProduct, setEditingProduct] = useState<ProductWithIngredients | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [showAllIngredients, setShowAllIngredients] = useState(false);
    const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
    const [orderDialogOpen, setOrderDialogOpen] = useState(false);
    const [productForOrder, setProductForOrder] = useState<string | null>(null);

    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [page, setPage] = useState(1);
    const [limit] = useState(18); // Multipie of 2 and 3 for grid

    // React Query Hooks
    const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useProducts(page, limit);
    const { data: ingredientsData, isLoading: ingredientsLoading, refetch: refetchIngredients } = useIngredients();

    // Derived
    const products = productsData?.products || [];
    const totalCount = productsData?.count || 0;
    const ingredients = ingredientsData?.ingredients || [];
    const isLoading = productsLoading || ingredientsLoading;

    // Helper to refresh everything
    const loadProducts = () => {
        refetchProducts();
        refetchIngredients();
    };

    // Remove manual loadProducts async function and effect
    // const loadProducts = async () ...
    // useEffect ...

    // ... calculation helpers ...
    const calculateTotalCost = (product: ProductWithIngredients) => {
        return product.product_ingredients.reduce((total, pi) => {
            if (!pi.ingredient) return total;
            return total + ((pi.ingredient.cost_per_unit || 0) * pi.quantity);
        }, 0);
    };

    const calculateMargin = (cost: number, price: number) => {
        if (price === 0) return 0;
        return ((price - cost) / price) * 100;
    };

    // Calculate how many units of a product can be produced with current stock
    // Helper to convert quantity for display
    const getDisplayQuantity = (qty: number, baseUnit: string, displayUnit?: string, packageSize?: number) => {
        if (!displayUnit) return { value: qty, unit: baseUnit };

        const base = baseUnit.toLowerCase();
        const display = displayUnit.toLowerCase();

        if (display === base) return { value: qty, unit: baseUnit };

        if (display === 'pacote' && packageSize) {
            return { value: qty / packageSize, unit: 'pacote(s)' };
        }

        const isKg = ['kg', 'quilo', 'kilograma'].includes(base);
        const isG = ['g', 'grama'].includes(base);
        const isL = ['l', 'litro'].includes(base);
        const isMl = ['ml', 'mililitro'].includes(base);

        const targetIsKg = ['kg', 'quilo', 'kilograma'].includes(display);
        const targetIsG = ['g', 'grama'].includes(display);
        const targetIsL = ['l', 'litro'].includes(display);
        const targetIsMl = ['ml', 'mililitro'].includes(display);

        if (isKg && targetIsG) return { value: qty * 1000, unit: 'g' };
        if (isG && targetIsKg) return { value: qty / 1000, unit: 'kg' };
        if (isL && targetIsMl) return { value: qty * 1000, unit: 'ml' };
        if (isMl && targetIsL) return { value: qty / 1000, unit: 'l' };

        return { value: qty, unit: displayUnit };
    };

    const calculateProducibleUnits = (product: ProductWithIngredients) => {
        if (!product.product_ingredients.length) return Infinity;

        let minUnits = Infinity;
        for (const pi of product.product_ingredients) {
            if (!pi.ingredient || !pi.quantity) continue;
            const ingredient = ingredients.find(i => i.id === pi.ingredient.id);
            if (!ingredient) continue;
            const stock = ingredient.stock_quantity || 0;
            const unitsFromThisIngredient = Math.floor(stock / pi.quantity);
            minUnits = Math.min(minUnits, unitsFromThisIngredient);
        }
        return minUnits === Infinity ? 0 : minUnits;
    };

    // Bulk Actions
    const toggleSelectAll = () => {
        if (selectedProducts.length === products.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(products.map(p => p.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedProducts.includes(id)) {
            setSelectedProducts(selectedProducts.filter(pid => pid !== id));
        } else {
            setSelectedProducts([...selectedProducts, id]);
        }
    };

    const handleDelete = async (id?: string) => {
        const idsToDelete = id ? [id] : selectedProducts;

        if (idsToDelete.length === 0) return;

        if (!confirm(`Tem certeza que deseja excluir ${idsToDelete.length} produto(s)?`)) return;

        let errorOccurred = false;
        for (const pid of idsToDelete) {
            const { error } = await deleteProduct(pid);
            if (error) errorOccurred = true;
        }

        if (errorOccurred) {
            toast({ title: 'Erro ao excluir alguns produtos', variant: 'destructive' });
        } else {
            toast({ title: 'Produtos excluídos com sucesso' });
            setSelectedProducts([]);
            loadProducts();
        }
    };

    const handleDuplicateProduct = async (product: ProductWithIngredients) => {
        const confirmDuplicate = confirm(`Deseja duplicar o produto "${product.name}"?`);
        if (!confirmDuplicate) return;

        // Prepare new product data - only include columns that exist in the database
        const productData = {
            name: `${product.name} (Cópia)`,
            description: product.description,
            selling_price: product.selling_price,
            preparation_time_minutes: product.preparation_time_minutes,
            image_url: product.image_url,
            active: true,
            selling_unit: product.selling_unit || 'unidade',
            category: product.category || 'Geral'
        };

        const ingredientsPayload = product.product_ingredients.map(pi => ({
            ingredient_id: pi.ingredient.id,
            quantity: pi.quantity
        }));

        const { error } = await createProduct(productData, ingredientsPayload);

        if (!error) {
            toast({ title: 'Produto duplicado com sucesso!' });
            loadProducts();
        } else {
            console.error('Error duplicating product:', error);
            toast({ title: 'Erro ao duplicar produto', description: error?.message, variant: 'destructive' });
        }
    };

    const handleExport = (format: 'excel' | 'csv') => {
        const dataToExport = products.map(p => {
            const totalCost = calculateTotalCost(p);
            const profit = (p.selling_price || 0) - totalCost;
            return {
                Nome: p.name,
                Descrição: p.description || '',
                'Preço Venda': p.selling_price ? Number(p.selling_price.toFixed(2)) : 0,
                'Custo Total': Number(totalCost.toFixed(2)),
                'Lucro Estimado': Number(profit.toFixed(2)),
                'Ingredientes': p.product_ingredients.map(pi => `${pi.ingredient.name} (${pi.quantity}${pi.ingredient.unit})`).join(', ')
            };
        });

        if (format === 'excel') {
            exportToExcel(dataToExport, 'produtos_cozinha_ao_lucro');
        } else {
            exportToCSV(dataToExport, 'produtos_cozinha_ao_lucro');
        }
    };

    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await importFromExcel(file);
            const { data: allIngredients } = await getIngredients(); // Pre-load ingredients

            let importedCount = 0;
            let errorCount = 0;

            for (const row of data) {
                // Basic validation and mapping
                const name = row['Nome'] || row['name'] || row['Name'];
                if (!name) continue;

                // Parse Ingredients if present
                // Format matches export: "Leite (2litro), Ovo (12unidade)"
                const ingredientsPayload: any[] = [];
                const ingredientsStr = row['Ingredientes'] || row['ingredients'] || '';

                if (ingredientsStr && allIngredients) {
                    const parts = ingredientsStr.split(',').map((s: string) => s.trim());
                    for (const part of parts) {
                        try {
                            // Regex to capture Name and Quantity+Unit inside parens
                            // Example: "Leite Condensado (2kg)" -> Name: "Leite Condensado", QtyUnit: "2kg"
                            // We need to be careful with regex.
                            // Let's try matching the last parenthesis group
                            const match = part.match(/^(.*)\s\(([\d\.]+)(.*)\)$/);
                            if (match) {
                                const iName = match[1].trim();
                                const qty = parseFloat(match[2]);
                                // unit is match[3] but we rely on the ingredient's default unit usually, 
                                // or we can check if it matches. For now, we trust the ingredient name mapping.

                                const ingredient = allIngredients.find(i => i.name.toLowerCase() === iName.toLowerCase());
                                if (ingredient) {
                                    ingredientsPayload.push({
                                        ingredient_id: ingredient.id,
                                        quantity: qty
                                    });
                                }
                            }
                        } catch (e) {
                            console.warn("Failed to parse ingredient part:", part);
                        }
                    }
                }

                const productData = {
                    name: name,
                    description: row['Descrição'] || row['description'] || row['Description'] || '',
                    selling_price: parseFloat(row['Preço Venda'] || row['selling_price'] || row['Price'] || '0'),
                    preparation_time_minutes: 30, // Default
                    active: true,
                    image_url: null,
                    selling_unit: 'unidade',
                    hourly_rate: 0,
                    is_highlight: false,
                    category: 'Importado'
                };

                const { error } = await createProduct(productData, ingredientsPayload);
                if (error) {
                    console.error("Error importing row", row, error);
                    errorCount++;
                } else {
                    importedCount++;
                }
            }

            toast({
                title: 'Importação concluída',
                description: `${importedCount} produtos importados. ${errorCount} erros.`,
                variant: errorCount > 0 ? 'destructive' : 'default'
            });
            loadProducts();

        } catch (error) {
            console.error("Import error", error);
            toast({ title: 'Erro ao ler arquivo Excel', variant: 'destructive' });
        }

        // Reset input
        e.target.value = '';
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-3 sm:p-4 rounded-xl border border-border/50 shadow-sm border-l-4 border-l-primary/50">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={products.length > 0 && selectedProducts.length === products.length}
                            onCheckedChange={toggleSelectAll}
                        />
                        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                            {selectedProducts.length} selecionados
                        </span>
                    </div>
                    {selectedProducts.length > 0 && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => {
                                const productToDupe = products.find(p => p.id === selectedProducts[0]);
                                if (productToDupe) handleDuplicateProduct(productToDupe);
                                if (selectedProducts.length > 1) {
                                    const remaining = selectedProducts.slice(1);
                                    remaining.forEach(async id => {
                                        const p = products.find(prod => prod.id === id);
                                        if (p) await handleDuplicateProduct(p);
                                    });
                                }
                            }}>
                                <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                <span className="hidden xs:inline">Duplicar</span>
                            </Button>
                            <Button variant="destructive" size="sm" className="text-xs sm:text-sm" onClick={() => handleDelete()}>
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                <span className="hidden xs:inline">Excluir</span>
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 ml-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                                <Download className="w-4 h-4" />
                                Exportar
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
                            <DropdownMenuItem onClick={() => import('@/lib/excel').then(mod => mod.downloadTemplate(['Nome', 'Descrição', 'Preço Venda', 'Ingredientes'], 'produtos'))}>
                                <FileDown className="w-4 h-4 mr-2" /> Modelo de Importação
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mobile Export Icon Only */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="flex sm:hidden h-8 w-8">
                                <Download className="w-3 h-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport('excel')}>Planilha Excel</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('csv')}>Planilha CSV</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => import('@/lib/excel').then(mod => mod.downloadTemplate(['Nome', 'Descrição', 'Preço Venda', 'Ingredientes'], 'produtos'))}>Template</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

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

                    <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => setIsTemplateDialogOpen(true)} title="Biblioteca de Modelos">
                        <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>

                    <Button className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4" onClick={onNewProduct}>
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Novo</span> Produto
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9"
                        onClick={() => setShowAllIngredients(!showAllIngredients)}
                        title={showAllIngredients ? "Ocultar detalhes" : "Mostrar detalhes"}
                    >
                        {showAllIngredients ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                {products.length === 0 ? (
                    <Card className="col-span-full border-dashed">
                        <CardContent className="p-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                                <TrendingUp className="w-12 h-12 text-muted-foreground/20" />
                                <h3 className="font-bold text-lg">Nenhum produto cadastrado</h3>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                    Crie seu primeiro produto para começar a calcular seus lucros e gerenciar suas vendas com precisão.
                                </p>
                                <Button className="mt-4 gap-2" onClick={onNewProduct}>
                                    <Plus className="w-4 h-4" /> Criar Meu Primeiro Produto
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    products.map((product) => {
                        const totalCost = calculateTotalCost(product);
                        const margin = product.selling_price ? calculateMargin(totalCost, product.selling_price) : 0;
                        const profit = (product.selling_price || 0) - totalCost;

                        return (
                            <Card
                                key={product.id}
                                className="hover:shadow-lg transition-shadow group"
                                onMouseEnter={() => setHoveredProductId(product.id)}
                                onMouseLeave={() => setHoveredProductId(null)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={selectedProducts.includes(product.id)}
                                                onCheckedChange={() => toggleSelect(product.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            {product.image_url ? (
                                                <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shadow-sm border border-gray-100">
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium border border-gray-100">
                                                    Foto
                                                </div>
                                            )}
                                            <div>
                                                <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant={margin >= 60 ? "default" : "secondary"}>
                                                        {margin.toFixed(0)}% margem
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={product.active !== false}
                                                        onChange={async (e) => {
                                                            const newActive = e.target.checked;
                                                            // Optimistic update removed (requires mutation cache update)
                                                            // setProducts(updatedProducts); -> Removed

                                                            const { error } = await updateProduct(product.id, { active: newActive }, null);
                                                            if (error) {
                                                                toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
                                                            } else {
                                                                loadProducts(); // Refetch to show new state
                                                            }
                                                        }}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                                </label>
                                            </div>
                                            {/* Desktop: hover-only */}
                                            <div className="hidden md:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditingProduct(product)}
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive/90"
                                                    onClick={() => handleDelete(product.id)}
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            {/* Mobile: always visible */}
                                            <div className="flex md:hidden gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditingProduct(product)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    {product.description && (
                                        <p className="text-sm text-muted-foreground">{product.description}</p>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center justify-between text-sm cursor-help hover:bg-muted/30 p-1 -mx-1 rounded transition-colors">
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        Custo
                                                        <Info className="w-3 h-3 opacity-50" />
                                                    </span>
                                                    <span className="font-medium">R$ {totalCost.toFixed(2)}</span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-[250px]">
                                                <p className="font-semibold text-xs mb-2">Composição do Custo:</p>
                                                <div className="space-y-1">
                                                    {product.product_ingredients.map((pi, idx) => {
                                                        if (!pi.ingredient) return null;
                                                        const display = getDisplayQuantity(pi.quantity, pi.ingredient.unit, pi.display_unit, pi.ingredient.package_size);
                                                        return (
                                                            <div key={idx} className="flex justify-between text-[10px] gap-4">
                                                                <span className="truncate">
                                                                    {pi.ingredient.name}
                                                                    <span className="text-muted-foreground ml-1">
                                                                        ({display.value < 0.01 ? display.value.toExponential(1) : parseFloat(display.value.toFixed(3))} {display.unit})
                                                                    </span>
                                                                </span>
                                                                <span className="font-mono text-green-600">R$ {((pi.ingredient.cost_per_unit || 0) * pi.quantity).toFixed(2)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                    <div className="border-t mt-1 pt-1 flex justify-between text-[11px] font-bold">
                                                        <span>Total</span>
                                                        <span>R$ {totalCost.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Preço de Venda:</span>
                                            <span className="font-bold text-primary">
                                                R$ {(product.selling_price || 0).toFixed(2)}
                                            </span>
                                        </div>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center justify-between text-sm border-t pt-2 cursor-help hover:bg-muted/30 p-1 -mx-1 rounded transition-colors">
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <TrendingUp className="w-3 h-3" />
                                                        Lucro:
                                                    </span>
                                                    <span className={`font-bold ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        R$ {profit.toFixed(2)}
                                                    </span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">
                                                    {profit > 0
                                                        ? `Você ganha R$ ${profit.toFixed(2)} por unidade vendida.`
                                                        : 'Atenção! Este produto está dando prejuízo.'}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>



                                    {(showAllIngredients || hoveredProductId === product.id) && product.product_ingredients.length > 0 && (
                                        <div className="text-xs text-muted-foreground border-t pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                            <p className="font-medium mb-1">Ingredientes:</p>
                                            <ul className="space-y-0.5">
                                                {product.product_ingredients.map((pi, idx) => {
                                                    if (!pi.ingredient) return null;
                                                    const display = getDisplayQuantity(pi.quantity, pi.ingredient.unit, pi.display_unit, pi.ingredient.package_size);
                                                    return (
                                                        <li key={idx}>
                                                            • {pi.ingredient.name} ({display.value < 0.01 ? display.value.toExponential(1) : parseFloat(display.value.toFixed(3))} {display.unit})
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Producible Units Indicator */}
                                    {(() => {
                                        const producibleUnits = calculateProducibleUnits(product);
                                        const hasIngredients = product.product_ingredients.length > 0;
                                        if (!hasIngredients) return null;

                                        // Build ingredient usage breakdown for tooltip
                                        const ingredientBreakdown = product.product_ingredients
                                            .filter(pi => pi.ingredient && pi.quantity)
                                            .map(pi => {
                                                const ingredient = ingredients.find(i => i.id === pi.ingredient.id);
                                                const stock = ingredient?.stock_quantity || 0;
                                                const usagePerUnit = pi.quantity;
                                                const totalUsage = producibleUnits > 0 ? usagePerUnit * producibleUnits : 0;
                                                return {
                                                    name: pi.ingredient.name,
                                                    usagePerUnit,
                                                    totalUsage,
                                                    stock,
                                                    unit: pi.ingredient.unit,
                                                    displayUnit: pi.display_unit,
                                                    ingredient: pi.ingredient
                                                };
                                            });

                                        const hasStock = producibleUnits > 0;

                                        return (
                                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-border/40">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Badge
                                                                variant="secondary"
                                                                className={`text-xs font-medium gap-1.5 cursor-help ${hasStock
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                                    : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                                                                    }`}
                                                            >
                                                                <Package className="w-3 h-3" />
                                                                {hasStock
                                                                    ? `${producibleUnits > 999 ? "999+" : producibleUnits} possíveis`
                                                                    : "Adicione ingredientes"
                                                                }
                                                            </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-[280px]">
                                                            {hasStock ? (
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-medium">
                                                                        Para produzir {producibleUnits} unidade(s):
                                                                    </p>
                                                                    <div className="space-y-1">
                                                                        {ingredientBreakdown.map((item, idx) => {
                                                                            const display = getDisplayQuantity(item.totalUsage, item.unit, item.displayUnit, item.ingredient?.package_size);
                                                                            return (
                                                                                <div key={idx} className="flex justify-between text-[10px] gap-4">
                                                                                    <span className="truncate">{item.name}</span>
                                                                                    <span className="font-mono text-emerald-600 whitespace-nowrap">
                                                                                        {parseFloat(display.value.toFixed(2))} {display.unit}
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-medium">
                                                                        Estoque atual:
                                                                    </p>
                                                                    <div className="space-y-1">
                                                                        {ingredientBreakdown.map((item, idx) => (
                                                                            <div key={idx} className="flex justify-between text-[10px] gap-4">
                                                                                <span className="truncate">{item.name}</span>
                                                                                <span className="font-mono text-muted-foreground whitespace-nowrap">
                                                                                    {item.stock.toFixed(1)} {item.unit}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <p className="text-[10px] text-muted-foreground pt-1 border-t">
                                                                        Adicione ingredientes ao estoque.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {(showAllIngredients || hoveredProductId === product.id) && (
                                                    <Button
                                                        size="sm"
                                                        className="h-7 text-xs gap-1.5 animate-in fade-in zoom-in duration-200"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setProductForOrder(product.id);
                                                            setOrderDialogOpen(true);
                                                        }}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Criar Pedido
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Pagination Controls */}
            {
                totalCount > 0 && (
                    <div className="flex items-center justify-between border-t pt-4 mt-4">
                        <div className="text-sm text-muted-foreground">
                            Mostrando {products.length} de {totalCount} produtos
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || isLoading}
                            >
                                <ChevronDown className="h-4 w-4 rotate-90 mr-1" />
                                Anterior
                            </Button>
                            <div className="text-sm font-medium min-w-[3rem] text-center">
                                Pág. {page}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={products.length < limit || (page * limit) >= totalCount || isLoading}
                            >
                                Próximo
                                <ChevronDown className="h-4 w-4 -rotate-90 ml-1" />
                            </Button>
                        </div>
                    </div>
                )
            }

            {/* Pagination Controls */}
            {
                totalCount > 0 && (
                    <div className="flex items-center justify-between border-t pt-4 mt-4">
                        <div className="text-sm text-muted-foreground">
                            Mostrando {products.length} de {totalCount} produtos
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || isLoading}
                            >
                                <ChevronDown className="h-4 w-4 rotate-90 mr-1" />
                                Anterior
                            </Button>
                            <div className="text-sm font-medium min-w-[3rem] text-center">
                                Pág. {page}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={products.length < limit || (page * limit) >= totalCount || isLoading}
                            >
                                Próximo
                                <ChevronDown className="h-4 w-4 -rotate-90 ml-1" />
                            </Button>
                        </div>
                    </div>
                )
            }

            <ProductBuilder
                open={!!editingProduct}
                onOpenChange={(open) => !open && setEditingProduct(null)}
                productToEdit={editingProduct}
                onSuccess={() => {
                    loadProducts();
                    setEditingProduct(null);
                }}
            />

            <ProductTemplateDialog
                open={isTemplateDialogOpen}
                onOpenChange={setIsTemplateDialogOpen}
                onSuccess={loadProducts}
            />

            <NewOrderDialog
                open={orderDialogOpen}
                onOpenChange={(open) => {
                    setOrderDialogOpen(open);
                    if (!open) setProductForOrder(null);
                }}
                onSuccess={() => {
                    setOrderDialogOpen(false);
                    setProductForOrder(null);
                    // Optional: You could navigate to orders or show a link
                    toast({ title: "Pedido criado! Verifique na aba Pedidos." });
                }}
                initialProductId={productForOrder}
            />
        </div>
    );
};

export default ProductList;
