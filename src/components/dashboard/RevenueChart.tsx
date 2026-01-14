import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface RevenueChartProps {
    data: any[];
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
    return (
        <Card className="col-span-2 relative shadow-2xl overflow-hidden border z-10 border-t-white/30 border-l-white/20 border-r-white/10 border-b-white/5 backdrop-blur-2xl"
            style={{
                background: 'linear-gradient(120deg, hsla(182, 16%, 50%, 0.65) 0%, hsla(182, 20%, 30%, 0.75) 100%)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}>
            <div className="absolute inset-0 bg-white/5 pointer-events-none" />
            <CardHeader className="relative z-10">
                <CardTitle className="text-primary-foreground">Receita x Custos</CardTitle>
                <CardDescription className="text-white/60">Acompanhe o desempenho financeiro diário.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="date"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value}
                                stroke="rgba(255,255,255,0.5)"
                            />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `R$${value}`}
                                stroke="rgba(255,255,255,0.5)"
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    background: 'rgba(23, 23, 23, 0.95)',
                                    color: '#fff'
                                }}
                                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                                labelStyle={{ color: '#aaa' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                name="Receita"
                                stroke="#2dd4bf"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                            <Area
                                type="monotone"
                                dataKey="cost"
                                name="Custos"
                                stroke="#f87171"
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
