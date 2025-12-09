import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, Shield, CreditCard, Lock, Star, ArrowRight, Quote } from 'lucide-react';
import { toast } from 'sonner';

const Checkout = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const plan = searchParams.get('plan') || 'monthly';
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('card');

    const planDetails = {
        monthly: {
            name: 'Assinatura Pro Mensal',
            price: '39,90',
            period: 'mês',
            savings: null
        },
        annual: {
            name: 'Assinatura Pro Anual',
            price: '399,00',
            period: 'ano',
            savings: 'Economize R$ 79,80'
        }
    };

    const selectedPlan = plan === 'annual' ? planDetails.annual : planDetails.monthly;

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate payment processing
        setTimeout(() => {
            setLoading(false);
            toast.success('Pagamento aprovado com sucesso! Bem-vindo(a)!');
            navigate('/app/dashboard');
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-background py-8 px-4">
            {/* Minimalist Header */}
            <div className="container max-w-6xl mx-auto mb-8 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <img src="/images/logo_cozinhaaolucro.png" alt="Logo" className="w-8 h-8 rounded-full" />
                    <span className="font-bold text-lg text-foreground">Cozinha<span className="text-primary">.Lucro</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border shadow-sm">
                    <Lock className="w-3 h-3 text-green-600" />
                    Ambiente 100% Seguro
                </div>
            </div>

            <div className="container max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* Left Column: Value Proposition & Summary */}
                    <div className="lg:col-span-5 space-y-8 order-2 lg:order-1">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-border/50">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="bg-primary/10 text-primary p-1.5 rounded-lg">
                                    <Star className="w-5 h-5 fill-primary" />
                                </span>
                                O que você vai receber:
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    "Acesso Imediato à Plataforma",
                                    "Precificação Automática de Receitas",
                                    "Gestão Completa de Pedidos",
                                    "Controle de Estoque Inteligente",
                                    "Bônus: Ebook Cozinha ao Lucro",
                                    "Bônus: 50 Receitas que Vendem",
                                    "Suporte VIP via WhatsApp"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Testimonial */}
                        <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 relative overflow-hidden">
                            <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />
                            <p className="text-sm italic text-foreground/80 mb-4 relative z-10">
                                "Desde que comecei a usar o Cozinha ao Lucro, parei de perder dinheiro. Finalmente sei exatamente quanto cobrar por cada bolo. A plataforma se pagou na primeira semana!"
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                                    AM
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Ana Maria</p>
                                    <p className="text-xs text-muted-foreground">Confeiteira há 5 anos</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground justify-center lg:justify-start opacity-70">
                            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Dados Criptografados</span>
                            <span>•</span>
                            <span>Primeiro Mês Grátis</span>
                            <span>•</span>
                            <span>Cancelamento Fácil</span>
                        </div>
                    </div>

                    {/* Right Column: Payment Form */}
                    <div className="lg:col-span-7 order-1 lg:order-2">
                        <Card className="border-0 shadow-2xl ring-1 ring-black/5 overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 p-6 border-b border-border/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Resumo do Pedido</p>
                                        <h2 className="text-2xl font-bold text-foreground">{selectedPlan.name}</h2>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-primary">R$ {selectedPlan.price}</p>
                                        <p className="text-sm text-muted-foreground">/{selectedPlan.period}</p>
                                    </div>
                                </div>
                                {selectedPlan.savings && (
                                    <div className="mt-2 inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-md">
                                        {selectedPlan.savings}
                                    </div>
                                )}
                            </div>

                            <CardContent className="p-6 md:p-8">
                                <form onSubmit={handleCheckout} className="space-y-8">
                                    <div className="space-y-4">
                                        <Label className="text-base font-semibold">Escolha como pagar</Label>
                                        <RadioGroup
                                            defaultValue="card"
                                            onValueChange={setPaymentMethod}
                                            className="grid grid-cols-2 gap-4"
                                        >
                                            <div>
                                                <RadioGroupItem value="card" id="card" className="peer sr-only" />
                                                <Label
                                                    htmlFor="card"
                                                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                                                >
                                                    <CreditCard className="mb-3 h-6 w-6" />
                                                    Cartão de Crédito
                                                </Label>
                                            </div>
                                            <div>
                                                <RadioGroupItem value="pix" id="pix" className="peer sr-only" />
                                                <Label
                                                    htmlFor="pix"
                                                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                                                >
                                                    <span className="mb-3 text-xl font-bold">PIX</span>
                                                    Pagamento Instantâneo
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {paymentMethod === 'card' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">Nome no Cartão</Label>
                                                <Input id="name" placeholder="Nome impresso no cartão" className="h-12 bg-gray-50 dark:bg-slate-900" required />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="number">Número do Cartão</Label>
                                                <div className="relative">
                                                    <Input id="number" placeholder="0000 0000 0000 0000" className="h-12 bg-gray-50 dark:bg-slate-900 pl-10" required />
                                                    <CreditCard className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="expiry">Validade</Label>
                                                    <Input id="expiry" placeholder="MM/AA" className="h-12 bg-gray-50 dark:bg-slate-900" required />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="cvc">CVC</Label>
                                                    <div className="relative">
                                                        <Input id="cvc" placeholder="123" className="h-12 bg-gray-50 dark:bg-slate-900 pl-10" required />
                                                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === 'pix' && (
                                        <div className="text-center p-8 bg-gray-50 dark:bg-slate-900 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
                                            <div className="w-32 h-32 bg-white p-2 mx-auto mb-4 rounded-lg shadow-sm">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QR Code Pix" className="w-full h-full opacity-80" />
                                            </div>
                                            <p className="text-sm font-medium mb-2">Escaneie o QR Code para pagar</p>
                                            <p className="text-xs text-muted-foreground">Aprovação imediata</p>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full btn-primary py-7 text-lg font-bold shadow-xl hover:shadow-primary/25 transition-all transform hover:-translate-y-0.5"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            'Processando...'
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Lock className="w-5 h-5" />
                                                Pagar R$ {selectedPlan.price}
                                            </span>
                                        )}
                                    </Button>

                                    <div className="flex items-center justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                                        <img src="/images/card-flags.png" alt="Bandeiras" className="h-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                                        <span className="text-xs text-muted-foreground">Pagamento processado com segurança</span>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
