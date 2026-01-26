import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/ui/card';

interface CostBreakdownChartProps {
    data: { name: string; value: number }[];
}

const COLORS = ['#2e5b60', '#68A9CA', '#2FBF71', '#61888c', '#5F98A1'];

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
        <Card className="col-span-1 border-none shadow-none bg-transparent w-full mx-auto">
            <div className="flex flex-col items-center justify-center w-full">
                {/* Header Section - Centered */}
                <div className="text-center w-full pb-6 space-y-1">
                    <h3 className="font-semibold text-lg leading-tight text-foreground">
                        Onde vai seu dinheiro?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Custos por ingrediente.
                    </p>
                </div>

                {/* Chart Section - Centered */}
                <div className="w-full flex justify-center items-center">
                    {/* Fixed Max Width Container to guarantee centering on mobile */}
                    <div className="relative w-full max-w-[320px] h-[350px] mx-auto flex justify-center items-center">
                        {finalData.length === 0 ? (
                            <div className="flex items-center justify-center w-full h-full text-muted-foreground/50 text-sm">
                                Sem dados de custo suficiente.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={finalData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={94}
                                        outerRadius={126}
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
                                            background: '#fff',
                                            color: '#1f2937'
                                        }}
                                        itemStyle={{ color: '#1f2937' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        align="center"
                                        iconType="square"
                                        wrapperStyle={{
                                            paddingTop: '20px',
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            flexWrap: 'wrap',
                                            fontSize: '12px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};
