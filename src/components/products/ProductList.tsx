import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, TrendingUp, Pencil, Download, Trash2, Copy } from 'lucide-react';
import { getProducts, deleteProduct, updateProduct, createProduct, getIngredients } from '@/lib/database';
import { exportToExcel, exportToCSV, importFromExcel } from '@/lib/excel';
import { PRESET_PRODUCTS } from '@/data/presets';
import type { Product, Ingredient } from '@/types/database';
import ProductBuilder from './ProductBuilder';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Upload, Image as ImageIcon, FileSpreadsheet, FileText, Info } from 'lucide-react';
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
    const [products, setProducts] = useState<ProductWithIngredients[]>([]);
    const [editingProduct, setEditingProduct] = useState<ProductWithIngredients | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadProducts = async () => {
        const { data, error } = await getProducts();
        if (!error && data) {
            setProducts(data as ProductWithIngredients[]);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    // ... calculation helpers ...
    const calculateTotalCost = (product: ProductWithIngredients) => {
        return product.product_ingredients.reduce((total, pi) => {
            return total + (pi.ingredient.cost_per_unit * pi.quantity);
        }, 0);
    };

    const calculateMargin = (cost: number, price: number) => {
        if (price === 0) return 0;
        return ((price - cost) / price) * 100;
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

        // Prepare new product data
        const productData = {
            name: `${product.name} (Cópia)`,
            description: product.description,
            selling_price: product.selling_price,
            preparation_time_minutes: product.preparation_time_minutes,
            image_url: product.image_url,
            active: true,
            selling_unit: product.selling_unit || 'unidade',
            hourly_rate: product.hourly_rate || 0,
            is_highlight: product.is_highlight || false,
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
            toast({ title: 'Erro ao duplicar produto', variant: 'destructive' });
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

    const handleFixImages = async () => {
        const productsWithoutImage = products.filter(p => !p.image_url);
        if (productsWithoutImage.length === 0) {
            toast({ title: 'Todos os produtos já possuem imagem.' });
            return;
        }

        let updatedCount = 0;
        for (const product of productsWithoutImage) {
            // Find a matching preset based on name similarity or exact match
            const preset = PRESET_PRODUCTS.find(p =>
                p.name.toLowerCase() === product.name.toLowerCase() ||
                product.name.toLowerCase().includes(p.name.toLowerCase()) ||
                p.name.toLowerCase().includes(product.name.toLowerCase())
            );

            if (preset && preset.image_url) {
                const { error } = await updateProduct(product.id, { image_url: preset.image_url }, null);
                if (!error) updatedCount++;
            }
        }

        if (updatedCount > 0) {
            toast({ title: `${updatedCount} imagens recuperadas de produtos padrão.` });
            loadProducts();
        } else {
            toast({ title: 'Não foi possível encontrar imagens compatíveis nos produtos padrão.' });
        }
    };

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
            <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-lg border shadow-sm">
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
                            <DropdownMenuLabel>Formato</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleExport('excel')}>
                                <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('csv')}>
                                <FileText className="w-4 h-4 mr-2" /> CSV (.csv)
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
                            <DropdownMenuItem onClick={() => handleExport('excel')}>Excel</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".xlsx, .xls"
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

                    <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={handleFixImages} title="Corrigir Imagens">
                        <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>

                    <Button className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4" onClick={onNewProduct}>
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Novo</span> Produto
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="p-8 text-center text-muted-foreground">
                            Nenhum produto cadastrado. Crie seu primeiro produto!
                        </CardContent>
                    </Card>
                ) : (
                    products.map((product) => {
                        const totalCost = calculateTotalCost(product);
                        const margin = product.selling_price ? calculateMargin(totalCost, product.selling_price) : 0;
                        const profit = (product.selling_price || 0) - totalCost;

                        return (
                            <Card key={product.id} className="hover:shadow-lg transition-shadow group">
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
                                                            // Optimistic update
                                                            const updatedProducts = products.map(p =>
                                                                p.id === product.id ? { ...p, active: newActive } : p
                                                            );
                                                            setProducts(updatedProducts);

                                                            const { error } = await updateProduct(product.id, { active: newActive }, null);
                                                            if (error) {
                                                                toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
                                                                loadProducts();
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
                                                    {product.product_ingredients.map((pi, idx) => (
                                                        <div key={idx} className="flex justify-between text-[10px] gap-4">
                                                            <span className="truncate">{pi.ingredient.name}</span>
                                                            <span className="font-mono text-green-600">R$ {(pi.ingredient.cost_per_unit * pi.quantity).toFixed(2)}</span>
                                                        </div>
                                                    ))}
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

                                    {product.product_ingredients.length > 0 && (
                                        <div className="text-xs text-muted-foreground border-t pt-2">
                                            <p className="font-medium mb-1">Ingredientes:</p>
                                            <ul className="space-y-0.5">
                                                {product.product_ingredients.map((pi, idx) => (
                                                    <li key={idx}>
                                                        • {pi.ingredient.name} ({pi.quantity} {pi.ingredient.unit})
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            <ProductBuilder
                open={!!editingProduct}
                onOpenChange={(open) => !open && setEditingProduct(null)}
                productToEdit={editingProduct}
                onSuccess={() => {
                    loadProducts();
                    setEditingProduct(null);
                }}
            />
        </div>
    );
};

export default ProductList;
