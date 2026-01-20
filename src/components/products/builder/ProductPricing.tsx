import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductFormData } from './types';

interface ProductPricingProps {
    formData: ProductFormData;
    setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
}

export const ProductPricing = ({ formData, setFormData }: ProductPricingProps) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="prep_time">Tempo de Preparo</Label>
                <div className="relative">
                    <Input
                        id="prep_time"
                        type="number"
                        min="0"
                        value={formData.preparation_time_minutes}
                        onChange={(e) => setFormData({ ...formData, preparation_time_minutes: parseInt(e.target.value) || 0 })}
                        className="h-10 pr-10"
                    />
                    <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">Min</span>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="hourly_rate">Valor da Hora (R$)</Label>
                <Input
                    id="hourly_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="h-10"
                />
            </div>
        </div>
    );
};
