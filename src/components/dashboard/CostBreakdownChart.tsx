import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface CostBreakdownChartProps {
    data: { name: string; value: number }[];
}

const COLORS = ['#2dd4bf', '#f472b6', '#facc15', '#a78bfa', '#fb923c', '#9ca3af'];

export const CostBreakdownChart = ({ data }: CostBreakdownChartProps) => {
    // Top 5 ingredients + text "Outros"
    const processData = () => {
        if (!data || data.length === 0) return [];
        const sorted = [...data].sort((a, b) => b.value - a.value);
        if (sorted.length <= 5) return sorted;

        const top5 = sorted.slice(0, 5);
        const others = sorted.slice(5).reduce((acc, curr) => acc + curr.value, 0);
        return [...top5, { name: 'Outros', value: others }];
    };

    const finalData = processData();

    return (
        <Card className="col-span-1 relative shadow-2xl overflow-hidden border z-10 border-t-white/30 border-l-white/20 border-r-white/10 border-b-white/5 backdrop-blur-2xl"
            style={{
                background: 'linear-gradient(120deg, hsla(182, 16%, 62%, 0.55) 0%, hsla(182, 20%, 40%, 0.65) 100%)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}>
            <div className="absolute inset-0 bg-white/5 pointer-events-none" />
            <CardHeader className="relative z-10">
                <CardTitle className="text-primary-foreground">Onde vai seu dinheiro?</CardTitle>
                <CardDescription className="text-white/60">Custos por ingrediente.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="h-[300px]">
                    {finalData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-white/50 text-sm">
                            Sem dados de custo suficiente.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={finalData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {finalData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        background: 'rgba(23, 23, 23, 0.95)'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend
                                    layout="horizontal"
                                    verticalAlign="bottom"
                                    align="center"
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: 'rgba(255,255,255,0.8)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
