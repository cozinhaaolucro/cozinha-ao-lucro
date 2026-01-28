import { useState } from 'react';
import ProductList from '@/components/products/ProductList';
import ProductBuilder from '@/components/products/ProductBuilder';

const Produtos = () => {
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleProductCreated = () => {
        setRefreshKey(refreshKey + 1);
        setIsBuilderOpen(false);
    };

    return (
        <div className="space-y-6 pb-40">
            <ProductList key={`products-${refreshKey}`} onNewProduct={() => setIsBuilderOpen(true)} />

            <ProductBuilder
                open={isBuilderOpen}
                onOpenChange={setIsBuilderOpen}
                onSuccess={handleProductCreated}
            />
        </div>
    );
};

export default Produtos;
