import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface FinancialData {
    date: string;
    revenue: number;
    cost: number;
    profit: number;
}

interface RevenueChartProps {
    data: FinancialData[];
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border rounded-lg shadow-lg p-3">
                    <p className="text-xs text-muted-foreground mb-2">{label}</p>
                    {payload.map((entry: any) => (
                        <div key={entry.name} className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-sm capitalize">{entry.name === 'revenue' ? 'Receita' : entry.name === 'cost' ? 'Custos' : 'Lucro'}:</span>
                            <span className="font-bold text-sm">R$ {entry.value.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                    Faturamento Diário
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {data.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            Sem dados financeiros
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#9ca3af' }}
                                />
                                <YAxis
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#9ca3af' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Receita"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="cost"
                                    name="Custos"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
