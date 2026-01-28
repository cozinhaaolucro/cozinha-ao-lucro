import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ProductFormData } from './types';

interface ProductPricingSummaryProps {
    totalCost: number;
    margin: number;
    formData: ProductFormData;
    setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
    setIsPriceManual: (manual: boolean) => void;
}

export const ProductPricingSummary = ({
    totalCost,
    margin,
    formData,
    setFormData,
    setIsPriceManual
}: ProductPricingSummaryProps) => {
    return (
        <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg mb-4">
            <div>
                <p className="text-xs text-muted-foreground">Custo Total</p>
                <p className="font-bold text-lg">R$ {totalCost.toFixed(2)}</p>
            </div>
            <div className="text-right">
                <div className="flex flex-col items-end">
                    <p className="text-xs text-muted-foreground">Preço (Margem {margin.toFixed(0)}%)</p>
                </div>
                <div className="flex items-center gap-2 justify-end">
                    <span className="text-sm font-medium text-muted-foreground">R$</span>
                    <Input
                        type="number"
                        value={formData.selling_price}
                        onChange={(e) => {
                            setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 });
                            setIsPriceManual(true);
                        }}
                        className="h-10 w-32 text-right font-bold bg-background text-lg"
                        step="0.01"
                    />
                </div>
            </div>
        </div>
    );
};
