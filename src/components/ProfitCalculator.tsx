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

            <CardHeader className="text-center pb-2 pt-8">
                <div className="mx-auto w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-4 shadow-inner border border-primary/10">
                    <Calculator className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
                    Simulador de Lucro Real
                </CardTitle>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Veja quanto você pode ganhar vendendo <span className="text-primary font-medium">{productName || 'seus produtos'}</span>
                </p>
            </CardHeader>

            <CardContent className="p-6 md:p-8 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Inputs */}
                    <div className="space-y-6">

                        <div className="space-y-2">
                            <Label className="text-foreground/80">Escolha uma receita do Ebook:</Label>
                            <Select value={selectedPreset} onValueChange={handlePresetChange}>
                                <SelectTrigger className="border-primary/20 bg-white/50 backdrop-blur-sm focus:ring-primary/20">
                                    <SelectValue placeholder="Selecione uma receita" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRESETS.map(preset => (
                                        <SelectItem key={preset.name} value={preset.name}>
                                            {preset.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedPreset === 'Personalizado' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <Label htmlFor="product">Nome do Produto</Label>
                                <Input
                                    id="product"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    className="border-primary/20 focus:border-primary bg-white/50"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cost">Custo (R$)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="cost"
                                        type="number"
                                        step="0.10"
                                        value={costPerUnit}
                                        onChange={(e) => {
                                            setCostPerUnit(Number(e.target.value));
                                            setSelectedPreset('Personalizado');
                                        }}
                                        className="pl-8 border-primary/20 bg-white/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Venda (R$)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.10"
                                        value={salePrice}
                                        onChange={(e) => {
                                            setSalePrice(Number(e.target.value));
                                            setSelectedPreset('Personalizado');
                                        }}
                                        className="pl-8 font-bold text-primary border-primary/20 bg-white/50"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <Label>Vendas por dia: <span className="text-primary font-bold text-lg">{dailySales}</span></Label>
                            </div>
                            <Slider
                                value={[dailySales]}
                                onValueChange={(val) => {
                                    setDailySales(val[0]);
                                }}
                                max={200}
                                step={1}
                                className="py-4"
                            />
                            <p className="text-xs text-muted-foreground text-center">
                                *Calculado sobre 24 dias de trabalho/mês
                            </p>
                        </div>
                    </div>

                    {/* Resultado Visual */}
                    <div className="bg-gradient-to-br from-primary/10 via-white/50 to-secondary/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-white/60 shadow-lg relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors"></div>

                        <div className="relative z-10">
                            <div className="mb-4 relative inline-block">
                                <TrendingUp className="w-12 h-12 text-primary animate-bounce" />
                                {monthlyProfit > 5000 && (
                                    <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
                                )}
                            </div>

                            <h3 className="text-lg font-medium text-muted-foreground mb-2">Seu Potencial de Lucro Mensal</h3>
                            <div className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight drop-shadow-sm">
                                {formatCurrency(monthlyProfit)}
                            </div>

                            <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden mb-4 border border-white/40">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out relative"
                                    style={{ width: `${Math.min((monthlyProfit / 8000) * 100, 100)}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                                </div>
                            </div>

                            <p className={`text-sm font-medium mt-2 transition-colors duration-300 ${monthlyProfit > 3000 ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {monthlyProfit > 5000 ? '🚀 Você vai ganhar mais que muito gerente!' :
                                    monthlyProfit > 2000 ? '✨ Um ótimo começo para sua independência!' :
                                        'Comece pequeno e cresça rápido!'}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProfitCalculator;
