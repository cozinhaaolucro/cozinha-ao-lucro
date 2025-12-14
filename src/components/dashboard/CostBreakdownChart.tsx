import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';

interface CostData {
    name: string;
    value: number;
}

interface CostBreakdownChartProps {
    data: CostData[];
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

export const CostBreakdownChart = ({ data }: CostBreakdownChartProps) => {
    // Top 5 costs, others grouped
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    const top5 = sortedData.slice(0, 5);
    const others = sortedData.slice(5).reduce((acc, curr) => acc + curr.value, 0);

    const chartData = [...top5];
    if (others > 0) {
        chartData.push({ name: 'Outros', value: others });
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border rounded-lg shadow-lg p-3">
                    <p className="font-medium text-sm">{payload[0].name}</p>
                    <p className="font-bold text-red-600">
                        R$ {payload[0].value.toFixed(2)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <PieChartIcon className="w-4 h-4" />
                    Distribuição de Custos
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {data.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            Sem dados de custos
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
