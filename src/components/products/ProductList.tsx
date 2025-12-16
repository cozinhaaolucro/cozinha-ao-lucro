import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, TrendingUp, Pencil, Download, Trash2, Copy } from 'lucide-react';
import { getProducts, deleteProduct, updateProduct } from '@/lib/database';
import { exportToExcel } from '@/lib/excel';
import type { Product, Ingredient } from '@/types/database';
// import EditProductDialog from './EditProductDialog'; // Removed
import ProductBuilder from './ProductBuilder';
import { useToast } from '@/hooks/use-toast';

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
            active: true
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

    const handleExport = () => {
        // ... existing export logic ...
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
        exportToExcel(dataToExport, 'produtos_cozinha_ao_lucro');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={products.length > 0 && selectedProducts.length === products.length}
                            onCheckedChange={toggleSelectAll}
                        />
                        <span className="text-sm text-muted-foreground">
                            {selectedProducts.length} selecionados
                        </span>
                    </div>
                    {selectedProducts.length > 0 && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                                const productToDupe = products.find(p => p.id === selectedProducts[0]);
                                if (productToDupe) handleDuplicateProduct(productToDupe);
                                if (selectedProducts.length > 1) {
                                    // Duplicate loop for others if needed, but keeping simple for now as per previous attempt logic
                                    const remaining = selectedProducts.slice(1);
                                    remaining.forEach(async id => {
                                        const p = products.find(prod => prod.id === id);
                                        if (p) await handleDuplicateProduct(p);
                                    });
                                }
                            }} className="gap-2">
                                <Copy className="w-4 h-4" />
                                Duplicar ({selectedProducts.length})
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete()} className="gap-2">
                                <Trash2 className="w-4 h-4" />
                                Excluir ({selectedProducts.length})
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={handleExport} title="Exportar Excel">
                        <Download className="w-4 h-4" />
                    </Button>
                    <Button className="gap-2" onClick={onNewProduct}>
                        <Plus className="w-4 h-4" />
                        Novo Produto
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
                            <Card key={product.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={selectedProducts.includes(product.id)}
                                                onCheckedChange={() => toggleSelect(product.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            {product.image_url ? (
                                                <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
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
                                    </div>
                                    {product.description && (
                                        <p className="text-sm text-muted-foreground">{product.description}</p>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Custo:</span>
                                        <span className="font-medium">R$ {totalCost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Preço de Venda:</span>
                                        <span className="font-bold text-primary">
                                            R$ {(product.selling_price || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm border-t pt-2">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            Lucro:
                                        </span>
                                        <span className={`font-bold ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            R$ {profit.toFixed(2)}
                                        </span>
                                    </div>

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
