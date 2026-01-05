import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, Calculator, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const PRESETS = [
    { name: 'Brigadeiro Gourmet', cost: 0.80, price: 3.50, sales: 50 },
    { name: 'Bolo de Pote', cost: 3.50, price: 12.00, sales: 20 },
    { name: 'Brownie Recheado', cost: 2.50, price: 8.00, sales: 30 },
    { name: 'Geladinho Gourmet', cost: 1.20, price: 5.00, sales: 40 },
    { name: 'Copo da Felicidade', cost: 5.00, price: 18.00, sales: 15 },
    { name: 'Marmita Fitness', cost: 7.00, price: 22.00, sales: 15 },
    { name: 'Trufa Artesanal', cost: 1.00, price: 4.00, sales: 45 },
    { name: 'Personalizado', cost: 0, price: 0, sales: 0 }
];

const ProfitCalculator = () => {
    const [selectedPreset, setSelectedPreset] = useState('Brigadeiro Gourmet');
    const [productName, setProductName] = useState('Brigadeiro Gourmet');
    const [costPerUnit, setCostPerUnit] = useState(0.80);
    const [salePrice, setSalePrice] = useState(3.50);
    const [dailySales, setDailySales] = useState(50);
    const [monthlyProfit, setMonthlyProfit] = useState(0);
    const [hasCelebrated, setHasCelebrated] = useState(false);

    useEffect(() => {
        const profitPerUnit = salePrice - costPerUnit;
        const dailyProfit = profitPerUnit * dailySales;
        // Considerando 24 dias de trabalho
        const total = dailyProfit * 24;
        setMonthlyProfit(total);

        // Trigger confetti if profit is high and hasn't celebrated yet
        if (total > 5000 && !hasCelebrated) {
            triggerConfetti();
            setHasCelebrated(true);
        } else if (total < 5000) {
            setHasCelebrated(false);
        }
    }, [costPerUnit, salePrice, dailySales, hasCelebrated]);

    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const random = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const handlePresetChange = (value: string) => {
        setSelectedPreset(value);
        const preset = PRESETS.find(p => p.name === value);
        if (preset && value !== 'Personalizado') {
            setProductName(preset.name);
            setCostPerUnit(preset.cost);
            setSalePrice(preset.price);
            setDailySales(preset.sales);
        } else if (value === 'Personalizado') {
            setProductName('');
            setCostPerUnit(0);
            setSalePrice(0);
            setDailySales(10);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <Card className="w-full max-w-2xl mx-auto glass-panel border-primary/20 overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary-glow to-secondary"></div>

            <CardHeader className="text-center pb-0 pt-4">
                <div className="mx-auto w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-2 shadow-inner border border-primary/10">
                    <Calculator className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-xl md:text-2xl font-bold text-foreground">
                    Simulador de Lucro Real
                </CardTitle>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Veja quanto você pode ganhar vendendo <span className="text-primary font-medium">{productName || 'seus produtos'}</span>
                </p>
            </CardHeader>

            <CardContent className="p-3 md:p-4 space-y-3">
                <div className="flex flex-col gap-3">
                    {/* Inputs */}
                    <div className="space-y-3">

                        <div className="space-y-1">
                            <Label className="text-foreground/80 text-xs">Escolha uma receita do Ebook:</Label>
                            <Select value={selectedPreset} onValueChange={handlePresetChange}>
                                <SelectTrigger className="h-9 text-sm border-primary/20 bg-white/5 backdrop-blur-sm focus:ring-primary/20 text-foreground">
                                    <SelectValue placeholder="Selecione uma receita" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRESETS.map(preset => (
                                        <SelectItem key={preset.name} value={preset.name} className="text-sm">
                                            {preset.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedPreset === 'Personalizado' && (
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                                <Label htmlFor="product" className="text-xs">Nome do Produto</Label>
                                <Input
                                    id="product"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    className="h-9 text-sm border-primary/20 focus:border-primary bg-white/5 text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="cost" className="text-xs">Custo (R$)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        id="cost"
                                        type="number"
                                        step="0.10"
                                        value={costPerUnit}
                                        onChange={(e) => {
                                            setCostPerUnit(Number(e.target.value));
                                            setSelectedPreset('Personalizado');
                                        }}
                                        className="h-9 pl-7 text-sm border-primary/20 bg-white/5 text-foreground"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="price" className="text-xs">Venda (R$)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.10"
                                        value={salePrice}
                                        onChange={(e) => {
                                            setSalePrice(Number(e.target.value));
                                            setSelectedPreset('Personalizado');
                                        }}
                                        className="h-9 pl-7 text-sm font-bold text-primary border-primary/20 bg-white/5"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-xs">Vendas por dia: <span className="text-primary font-bold text-base">{dailySales}</span></Label>
                            </div>
                            <Slider
                                value={[dailySales]}
                                onValueChange={(val) => {
                                    setDailySales(val[0]);
                                }}
                                max={200}
                                step={1}
                                className="py-2"
                            />
                            <p className="text-[10px] text-muted-foreground text-center">
                                *Calculado sobre 24 dias de trabalho/mês
                            </p>
                        </div>
                    </div>

                </div>

                {/* Resultado Visual */}
                <div className="w-full bg-gradient-to-br from-primary/10 via-white/5 to-secondary/10 rounded-xl p-3 flex flex-col items-center justify-center text-center border border-white/10 shadow-lg relative overflow-hidden group min-h-[140px]">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors"></div>

                    <div className="relative z-10 w-full max-w-lg mx-auto">
                        <div className="mb-2 relative inline-block">
                            <TrendingUp className="w-10 h-10 text-primary animate-bounce" />
                            {monthlyProfit > 5000 && (
                                <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                            )}
                        </div>

                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Seu Potencial de Lucro Mensal</h3>
                        <div className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight drop-shadow-sm truncate w-full px-2">
                            {formatCurrency(monthlyProfit)}
                        </div>

                        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden mb-3 border border-white/5">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out relative"
                                style={{ width: `${Math.min((monthlyProfit / 8000) * 100, 100)}%` }}
                            >
                                <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                            </div>
                        </div>

                        <p className={`text-sm font-medium mt-1 transition-colors duration-300 ${monthlyProfit > 3000 ? 'text-green-600' : monthlyProfit < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {monthlyProfit > 5000 ? '🚀 Você vai ganhar mais que muito gerente!' :
                                monthlyProfit > 2000 ? '✨ Um ótimo começo para sua independência!' :
                                    monthlyProfit < 0 ? '⚠️ Atenção: Custo maior que a venda!' :
                                        'Comece pequeno e cresça rápido!'}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProfitCalculator;
