import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Ingredient } from '@/types/database';

interface StockDemandItem {
    ingredient: Ingredient;
    stock: number;
    demand: number;
    balance: number;
    status: 'sufficient' | 'low' | 'critical' | 'unused';
}

interface StockDemandListProps {
    stockAnalysis: StockDemandItem[];
}

export const StockDemandList = ({ stockAnalysis }: StockDemandListProps) => {
    return (
        <Card className="relative shadow-elegant overflow-hidden border border-border/60 z-10 bg-white">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <div className="p-1.5 bg-[#5F98A1]/10 rounded-lg">
                        <Package className="w-5 h-5 text-[#5F98A1]" />
                    </div>
                    Estoque vs Demanda
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {stockAnalysis.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">Nenhum ingrediente em uso</p>
                    ) : (
                        stockAnalysis.map(item => (
                            <div key={item.ingredient.id} className="flex items-center justify-between border-b border-border/40 pb-2 p-2 rounded hover:bg-muted/30 transition-colors duration-200 group">
                                <div className="flex items-center gap-3 flex-1">
                                    {item.status === 'sufficient' && <CheckCircle className="w-4 h-4 text-[#5F98A1] group-hover:scale-110 transition-transform" />}
                                    {(item.status === 'low' || item.status === 'critical') && <AlertCircle className="w-4 h-4 text-[#C76E60] group-hover:scale-110 transition-transform" />}
                                    {item.status === 'unused' && <AlertCircle className="w-4 h-4 text-muted-foreground/40" />}
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-foreground">{item.ingredient.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Estoque: <span className="font-mono text-foreground/80">{item.stock.toFixed(2)}</span> / Demanda: <span className="font-mono text-foreground/80">{item.demand.toFixed(2)}</span>
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "whitespace-nowrap border-0 font-bold",
                                        item.status === 'sufficient' ? 'bg-[#5F98A1]/10 text-[#5F98A1]' :
                                            (item.status === 'low' || item.status === 'critical') ? 'bg-[#C76E60]/10 text-[#C76E60]' :
                                                'bg-muted text-muted-foreground'
                                    )}
                                >
                                    {item.balance > 0 ? '+' : ''}{item.balance.toFixed(1)} {item.ingredient.unit}
                                </Badge>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
