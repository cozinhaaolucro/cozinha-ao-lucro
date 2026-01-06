import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, Calculator, Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';

const PRESETS = [
    { name: 'Brigadeiro Gourmet', cost: 0.80, price: 3.50, sales: 50 },
    { name: 'Bolo de Pote', cost: 3.50, price: 12.00, sales: 20 },
    { name: 'Brownie Recheado', cost: 2.50, price: 8.00, sales: 30 },
    { name: 'Marmita Fitness', cost: 7.00, price: 22.00, sales: 15 },
    { name: 'Trufa Artesanal', cost: 1.00, price: 4.00, sales: 45 },
    { name: 'Personalizado', cost: 0, price: 0, sales: 0 }
];

const ProfitCalculator = () => {
    const navigate = useNavigate();
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
        const total = dailyProfit * 24;
        setMonthlyProfit(total);

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
            if (timeLeft <= 0) return clearInterval(interval);
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
        <Card className="w-full max-w-lg mx-auto bg-card/50 backdrop-blur-lg border-primary/20 overflow-hidden relative shadow-2xl rounded-2xl transform-gpu backface-hidden will-change-transform">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary"></div>

            <CardHeader className="text-center pb-2 pt-4">
                <div className="mx-auto w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center mb-2 shadow-inner border border-primary/10">
                    <Calculator className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg md:text-xl font-bold text-foreground font-heading">
                    Simulador de Lucro Real
                </CardTitle>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Veja quanto você pode ganhar vendendo <span className="text-primary font-medium">{productName || 'seus produtos'}</span>
                </p>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
                {/* Inputs */}
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-foreground/80 text-sm font-medium">Escolha um produto:</Label>
                        <Select value={selectedPreset} onValueChange={handlePresetChange}>
                            <SelectTrigger className="h-10 text-sm border-white/10 bg-white/5 backdrop-blur-sm focus:ring-primary/20 text-foreground rounded-lg">
                                <SelectValue placeholder="Selecione..." />
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

                    <div className="min-h-[44px] relative">
                        {selectedPreset === 'Personalizado' && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 absolute w-full top-0 left-0 z-10">
                                <Label htmlFor="product" className="text-sm font-medium">Nome do Produto</Label>
                                <Input id="product" value={productName} onChange={(e) => setProductName(e.target.value)}
                                    className="h-10 text-sm border-white/10 focus:border-primary bg-white/5 text-foreground rounded-lg" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="cost" className="text-sm font-medium">Custo (R$)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="cost" type="number" step="0.10" value={costPerUnit}
                                    onChange={(e) => { setCostPerUnit(Number(e.target.value)); setSelectedPreset('Personalizado'); }}
                                    className="h-10 pl-8 text-sm border-white/10 bg-white/5 text-foreground rounded-lg" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="price" className="text-sm font-medium">Venda (R$)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="price" type="number" step="0.10" value={salePrice}
                                    onChange={(e) => { setSalePrice(Number(e.target.value)); setSelectedPreset('Personalizado'); }}
                                    className="h-10 pl-8 text-sm font-bold text-primary border-white/10 bg-white/5 rounded-lg" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                            <Label className="text-sm font-medium">Vendas por dia:</Label>
                            <span className="text-primary font-bold text-lg">{dailySales}</span>
                        </div>
                        <Slider value={[dailySales]} onValueChange={(val) => setDailySales(val[0])} max={200} step={1} className="py-2" />
                        <p className="text-[10px] text-muted-foreground text-center">*Calculado sobre 24 dias de trabalho/mês</p>
                    </div>
                </div>

                {/* Result Section */}
                <div className="w-full bg-gradient-to-br from-primary/15 via-background to-accent/10 rounded-xl p-5 flex flex-col items-center justify-center text-center border border-white/10 shadow-xl relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-28 h-28 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors"></div>

                    <div className="relative z-10 w-full">
                        <div className="mb-3 relative inline-block">
                            <TrendingUp className="w-10 h-10 text-primary" />
                            {monthlyProfit > 5000 && <Sparkles className="w-5 h-5 text-warning absolute -top-1 -right-1 animate-pulse" />}
                        </div>

                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Seu Potencial de Lucro Mensal</h3>
                        <div className="text-3xl md:text-4xl font-bold text-warning mb-4 tracking-tight font-heading">
                            {formatCurrency(monthlyProfit)}
                        </div>

                        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden mb-4 border border-white/5">
                            <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min((monthlyProfit / 8000) * 100, 100)}%` }}></div>
                        </div>

                        <p className={`text-sm font-medium transition-colors ${monthlyProfit > 3000 ? 'text-green-400' : monthlyProfit < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                            {monthlyProfit > 5000 ? '🚀 Você lucra mais que muito gerente!' :
                                monthlyProfit > 2000 ? '✨ Um ótimo começo para sua liberdade!' :
                                    monthlyProfit < 0 ? '⚠️ Custo maior que a venda!' : 'Comece pequeno e cresça rápido!'}
                        </p>
                    </div>
                </div>

                {/* Mandatory Copy Below Result */}
                <div className="text-center space-y-4 pt-4 border-t border-white/5">
                    <p className="text-lg font-bold text-foreground font-heading">
                        Esse valor não é sorte. É <span className="text-primary">controle.</span>
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                        O Cozinha ao Lucro te mostra exatamente como chegar nesse resultado todos os dias, com precificação correta, controle de pedidos e margem real.
                    </p>
                    <Button onClick={() => navigate('/register')} className="btn-primary w-full text-base py-5 shadow-lg group">
                        Começar a Controlar Meu Lucro
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <p className="text-xs text-muted-foreground/70 italic">
                        Sem achismo. Sem planilhas confusas. Sem prejuízo escondido.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProfitCalculator;
