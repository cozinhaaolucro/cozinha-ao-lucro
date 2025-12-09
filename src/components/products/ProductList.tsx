import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Pencil } from 'lucide-react';
import { getProducts } from '@/lib/database';
import type { Product, Ingredient } from '@/types/database';
import EditProductDialog from './EditProductDialog';

type ProductWithIngredients = Product & {
    product_ingredients: Array<{
        quantity: number;
        ingredient: Ingredient;
    }>;
};

const ProductList = ({ onNewProduct }: { onNewProduct: () => void }) => {
    const [products, setProducts] = useState<ProductWithIngredients[]>([]);
    const [editingProduct, setEditingProduct] = useState<ProductWithIngredients | null>(null);

    const loadProducts = async () => {
        const { data, error } = await getProducts();
        if (!error && data) {
            setProducts(data as ProductWithIngredients[]);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const calculateTotalCost = (product: ProductWithIngredients) => {
        return product.product_ingredients.reduce((total, pi) => {
            return total + (pi.ingredient.cost_per_unit * pi.quantity);
        }, 0);
    };

    const calculateMargin = (cost: number, price: number) => {
        if (price === 0) return 0;
        return ((price - cost) / price) * 100;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Produtos</h3>
                <Button className="gap-2" onClick={onNewProduct}>
                    <Plus className="w-4 h-4" />
                    Novo Produto
                </Button>
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
                                        <CardTitle className="text-lg">{product.name}</CardTitle>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditingProduct(product)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Badge variant={margin >= 60 ? "default" : "secondary"}>
                                                {margin.toFixed(0)}% margem
                                            </Badge>
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

            <EditProductDialog
                product={editingProduct}
                open={!!editingProduct}
                onOpenChange={(open) => !open && setEditingProduct(null)}
                onSuccess={() => {
                    loadProducts();
                    setEditingProduct(null);
                }}
            />
        </div>
    );
};

export default ProductList;
