import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface CostBreakdownChartProps {
    data: { name: string; value: number }[];
}

const COLORS = ['#2e5b60', '#68A9CA', '#4C9E7C', '#61888c', '#5F98A1'];

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
        <Card className="col-span-1 relative shadow-elegant overflow-hidden border border-border/60 z-10 bg-white">
            <CardHeader className="relative z-10">
                <CardTitle className="text-foreground">Onde vai seu dinheiro?</CardTitle>
                <CardDescription className="text-muted-foreground">Custos por ingrediente.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="h-[200px]">
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
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {finalData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.name === 'Outros' ? '#9CA3AF' : COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: '1px solid #D6D6D1',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        background: '#fff'
                                    }}
                                    itemStyle={{ color: '#1f2937' }}
                                />
                                <Legend
                                    layout="horizontal"
                                    verticalAlign="bottom"
                                    align="center"
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#8B8C88' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
