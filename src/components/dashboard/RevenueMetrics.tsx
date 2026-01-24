import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, DollarSign, Wallet, CreditCard, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RevenueMetricsProps {
    ordersCount: number;
    totalRevenue: number;
    totalProfit: number;
    totalCost: number;
}

export const RevenueMetrics = ({ ordersCount, totalRevenue, totalProfit, totalCost }: RevenueMetricsProps) => {
    return (
        <TooltipProvider>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4 mt-4">

                {/* Total Pedidos */}
                <Card className="relative overflow-hidden bg-white shadow-elegant border border-border/60 hover:shadow-hover transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-3 bg-transparent border-none shadow-none">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg transition-colors bg-[#61888c]/10">
                                <ShoppingCart className="h-4 w-4" style={{ color: '#61888c' }} />
                            </div>
                            <CardTitle className="text-xs font-bold text-muted-foreground">Total Pedidos</CardTitle>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground/50 hover:text-foreground cursor-help transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-popover text-popover-foreground border-border shadow-lg">
                                    <p className="w-64 text-xs">Quantidade total de pedidos realizados no período selecionado.</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                        <div className="text-lg font-bold text-foreground">{ordersCount}</div>
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Volume de vendas</p>
                    </CardContent>
                </Card>

                {/* Receita Total */}
                <Card className="relative overflow-hidden bg-white shadow-elegant border border-border/60 hover:shadow-hover transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-3 bg-transparent border-none shadow-none">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg transition-colors bg-[#C9A34F]/10">
                                <DollarSign className="h-4 w-4" style={{ color: '#C9A34F' }} />
                            </div>
                            <CardTitle className="text-xs font-bold text-muted-foreground">Receita Total</CardTitle>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground/50 hover:text-foreground cursor-help transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-popover text-popover-foreground border-border shadow-lg">
                                    <p className="w-64 text-xs">Soma de todos os pedidos finalizados (Entregues) e em produção no período selecionado.</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                        <div className="text-lg font-bold text-foreground">R$ {totalRevenue.toFixed(2)}</div>
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Vendas brutas totais</p>
                    </CardContent>
                </Card>

                {/* Lucro Líquido */}
                <Card className="relative overflow-hidden bg-white shadow-elegant border border-border/60 hover:shadow-hover transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-3 bg-transparent border-none shadow-none">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg transition-colors bg-[#4C9E7C]/10">
                                <Wallet className="h-4 w-4" style={{ color: '#4C9E7C' }} />
                            </div>
                            <CardTitle className="text-xs font-bold text-muted-foreground">Lucro Líquido</CardTitle>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground/50 hover:text-foreground cursor-help transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-popover text-popover-foreground border-border shadow-lg">
                                    <p className="w-64 text-xs">Quanto sobrou no seu bolso após descontar o custo dos ingredientes de cada venda.</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                        <div className="text-lg font-bold text-foreground">R$ {totalProfit.toFixed(2)}</div>
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">O que sobra no bolso</p>
                    </CardContent>
                </Card>

                {/* Custo Total */}
                <Card className="relative overflow-hidden bg-white shadow-elegant border border-border/60 hover:shadow-hover transition-all duration-300 group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-3 bg-transparent border-none shadow-none">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg transition-colors bg-[#68A9CA]/10">
                                <CreditCard className="h-4 w-4" style={{ color: '#68A9CA' }} />
                            </div>
                            <CardTitle className="text-xs font-bold text-muted-foreground">Custo Total</CardTitle>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground/50 hover:text-foreground cursor-help transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-popover text-popover-foreground border-border shadow-lg">
                                    <p className="w-64 text-xs">Total gasto em insumos e ingredientes para produzir as vendas do período.</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                        <div className="text-lg font-bold text-foreground">R$ {totalCost.toFixed(2)}</div>
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Gasto com ingredientes</p>
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
};
