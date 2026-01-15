import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface RevenueChartProps {
    data: any[];
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
    return (
        <Card className="col-span-2 relative shadow-elegant overflow-hidden border border-border/60 z-10 bg-white">
            <CardHeader className="relative z-10">
                <CardTitle className="text-foreground">Receita x Custos</CardTitle>
                <CardDescription className="text-muted-foreground">Acompanhe o desempenho financeiro diário.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2E5F65" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#2E5F65" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D66050" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#D66050" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis
                                dataKey="date"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value}
                                stroke="#8B8C88"
                            />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `R$${value}`}
                                stroke="#8B8C88"
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: '1px solid #D6D6D1',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    background: '#fff',
                                    color: '#1f2937'
                                }}
                                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                                labelStyle={{ color: '#8B8C88' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                name="Receita"
                                stroke="#2E5F65"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                            <Area
                                type="monotone"
                                dataKey="cost"
                                name="Custos"
                                stroke="#D66050"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorCost)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
