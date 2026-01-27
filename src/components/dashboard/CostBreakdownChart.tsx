import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';

interface CostBreakdownChartProps {
    data: { name: string; value: number }[];
    className?: string;
}

const COLORS = ['#2e5b60', '#68A9CA', '#2FBF71', '#61888c', '#5F98A1'];

export const CostBreakdownChart = ({ data, className }: CostBreakdownChartProps) => {
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
        <Card className={`border-none shadow-none bg-transparent w-full mx-auto ${className || ''}`}>
            <div className="flex flex-col items-center justify-center w-full h-full">
                {/* Header Section - Centered */}
                <div className="text-center w-full pb-2 space-y-1">
                    <h3 className="font-semibold text-lg leading-tight text-foreground">
                        Onde vai seu dinheiro?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Custos por ingrediente.
                    </p>
                </div>

                {/* Chart Section */}
                <div className="w-full flex justify-center items-center">
                    <div className="relative w-full max-w-[320px] h-[220px]">
                        {finalData.length === 0 ? (
                            <div className="flex items-center justify-center w-full h-full text-muted-foreground/50 text-sm">
                                Sem dados de custo suficiente.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <defs>
                                        {finalData.map((entry, index) => {
                                            const color = entry.name === 'Outros' ? '#9CA3AF' : COLORS[index % COLORS.length];
                                            return (
                                                <linearGradient key={`grad-${index}`} id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={color} stopOpacity={1} />
                                                    <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                                                </linearGradient>
                                            );
                                        })}
                                    </defs>
                                    <Pie
                                        data={finalData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={74}
                                        outerRadius={102}
                                        paddingAngle={4}
                                        cornerRadius={6}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {finalData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={`url(#grad-${index})`}
                                                stroke="rgba(255,255,255,0.1)"
                                                strokeWidth={1}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.15)',
                                            background: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(4px)',
                                            color: '#1f2937',
                                            padding: '8px 12px'
                                        }}
                                        itemStyle={{ color: '#1f2937', fontWeight: 600, fontSize: '13px' }}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        {/* Central Label for Depth */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[135px] h-[135px] rounded-full bg-gradient-to-br from-white/5 to-transparent backdrop-blur-[1px]" />
                        </div>
                    </div>
                </div>

                {/* Custom Symmetrical Legend */}
                {finalData.length > 0 && (
                    <div className="grid grid-cols-3 gap-x-8 gap-y-2 mt-2 w-full max-w-[360px] px-2">
                        {finalData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-1.5 overflow-hidden">
                                <div
                                    className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                                    style={{ backgroundColor: entry.name === 'Outros' ? '#9CA3AF' : COLORS[index % COLORS.length] }}
                                />
                                <span className="text-[10px] text-muted-foreground truncate" title={entry.name}>
                                    {entry.name}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
};
