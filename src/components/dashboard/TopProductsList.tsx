import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import type { Product } from '@/types/database';

interface TopProduct {
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
    margin: number;
}

interface TopProductsListProps {
    topProfitableProducts: TopProduct[];
    products: Product[]; // Passed to look up images, ideally we merge this data upstream
}

export const TopProductsList = ({ topProfitableProducts, products }: TopProductsListProps) => {
    return (
        <Card className="relative shadow-elegant overflow-hidden border border-border/60 z-10 bg-white">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    Produtos Mais Lucrativos
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {topProfitableProducts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma venda no período</p>
                    ) : (
                        topProfitableProducts.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between border-b border-border/40 pb-2">
                                <div className="flex items-center gap-2">
                                    {products.find(prod => prod.name === p.name)?.image_url ? (
                                        <div className="w-8 h-8 rounded overflow-hidden bg-muted ring-1 ring-border">
                                            <img
                                                src={products.find(prod => prod.name === p.name)?.image_url || undefined}
                                                alt={p.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <Badge variant="outline" className="font-bold bg-muted text-muted-foreground border-border">{idx + 1}º</Badge>
                                    )}
                                    <div>
                                        <p className="font-medium text-sm text-foreground">{p.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {p.quantity} un • Margem {p.margin.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-bold`} style={{ color: p.profit >= 0 ? '#2FBF71' : '#C76E60' }}>
                                        {p.profit > 0 ? '+' : ''}R$ {p.profit.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">R$ {p.revenue.toFixed(2)}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
