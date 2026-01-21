import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IngredientList from '@/components/products/IngredientList';
import ProductList from '@/components/products/ProductList';
import ProductBuilder from '@/components/products/ProductBuilder';

const Produtos = () => {
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchParams, setSearchParams] = useSearchParams();

    // Sync tab with URL param, default to 'products'
    const currentTab = searchParams.get('tab') || 'products';

    const handleTabChange = (value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('tab', value);
            return newParams;
        });
    };

    const handleProductCreated = () => {
        setRefreshKey(refreshKey + 1);
        setIsBuilderOpen(false);
    };

    return (
        <div className="space-y-6 pb-40">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Produtos e Precificação</h1>
                <p className="text-muted-foreground">
                    Gerencie seus ingredientes e crie produtos com cálculo automático de custos
                </p>
            </div>

            <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="products">Produtos</TabsTrigger>
                    <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="mt-6" key={`products-${refreshKey}`}>
                    <ProductList onNewProduct={() => setIsBuilderOpen(true)} />
                </TabsContent>

                <TabsContent value="ingredients" className="mt-6">
                    <IngredientList />
                </TabsContent>
            </Tabs>

            <ProductBuilder
                open={isBuilderOpen}
                onOpenChange={setIsBuilderOpen}
                onSuccess={handleProductCreated}
            />
        </div>
    );
};

export default Produtos;
