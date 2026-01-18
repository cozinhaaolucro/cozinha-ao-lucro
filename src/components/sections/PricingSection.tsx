import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Shield, Zap } from 'lucide-react';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import { useNavigate } from 'react-router-dom';
import { LeadFormDialog } from '@/components/LeadFormDialog';
import { useState } from 'react';

const PricingSection = () => {
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

    return (
        <section id="precos" className="section-padding bg-background relative overflow-hidden section-separator-top">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-noise opacity-[0.15] pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/pattern-grid.svg')] opacity-[0.015]"></div>

            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="container-max relative z-10">
                <RevealOnScroll>
                    <div className="text-center mb-12">
                        <span className="text-sm font-semibold text-primary tracking-widest uppercase mb-3 block">Simples & Transparente</span>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground font-heading">
                            Planos que crescem <span className="text-primary relative inline-block effect-shine px-1 -mx-1 align-bottom">com você</span>
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed mb-8">
                            Escolha o plano ideal para o seu momento.
                        </p>

                        {/* Discreet Modern Toggle - Fixed Centering */}
                        <div className="relative inline-flex bg-secondary/5 p-1.5 rounded-full shadow-inner min-w-[300px]">
                            {/* Sliding Background */}
                            <div
                                className={`absolute inset-y-1.5 w-[calc(50%-6px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out ${billingCycle === 'monthly' ? 'translate-x-0' : 'translate-x-full'
                                    }`}
                            />

                            {/* Buttons Container */}
                            <div className="relative z-10 grid grid-cols-2 w-full text-sm font-medium">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`py-2.5 px-4 rounded-full transition-colors duration-300 text-center flex items-center justify-center ${billingCycle === 'monthly' ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    Mensal
                                </button>
                                <button
                                    onClick={() => setBillingCycle('annual')}
                                    className={`py-2.5 px-4 rounded-full transition-colors duration-300 flex items-center justify-center gap-2 ${billingCycle === 'annual' ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    Anual
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-tight transition-colors duration-300 leading-none ${billingCycle === 'annual' ? 'text-green-700 bg-green-100/80' : 'text-green-600/70 bg-green-100/50'
                                        }`}>
                                        -30%
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </RevealOnScroll>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-7 max-w-4xl mx-auto items-stretch">
                    {/* Plano Inicial */}
                    <RevealOnScroll delay={0.1} className="h-full flex flex-col">
                        <Card className="flex-1 flex flex-col relative overflow-hidden bg-card/60 backdrop-blur-md border border-primary/20 shadow-xl shadow-primary/5 rounded-[2.5rem] transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 group px-6 py-8">

                            {/* Floating Badge - Position Adjusted to avoid overlap */}
                            <div className="absolute top-6 right-6 z-20">
                                <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                    Recomendado
                                </span>
                            </div>

                            {/* Increased top padding to prevent badge overlap */}
                            <CardHeader className="text-center p-0 mb-8 pt-6">
                                <CardTitle className="text-xl font-bold text-foreground font-heading mb-3">Plano Inicial</CardTitle>
                                <p className="text-sm text-muted-foreground font-light mb-8">
                                    Para validar e organizar.
                                </p>
                                {/* Price Display */}
                                <div className="flex items-center justify-center gap-4 translate-x-2 relative transition-all duration-300">
                                    <span className="text-sm text-muted-foreground font-light mt-4">R$</span>
                                    <span className="text-7xl font-extrabold text-foreground font-heading tracking-wider leading-none">
                                        {billingCycle === 'monthly' ? '39' : '334'}
                                    </span>
                                    <div className="flex flex-col items-start -ml-1 mt-3">
                                        <span className="text-xl font-bold text-foreground leading-none">
                                            {billingCycle === 'monthly' ? ',90' : ',80'}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                                            /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                                        </span>
                                    </div>
                                </div>

                                {billingCycle === 'annual' && (
                                    <div className="mt-3 flex flex-col items-center animate-in fade-in slide-in-from-top-2 duration-300">
                                        <p className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-1">
                                            Equivalente a R$ 27,90/mês
                                        </p>
                                        <p className="text-[11px] text-muted-foreground line-through decoration-muted-foreground/50">
                                            Total parcelado: R$ 478,80
                                        </p>
                                    </div>
                                )}
                            </CardHeader>

                            <CardContent className="p-0 flex-1 flex flex-col">
                                <div className="w-16 h-1 bg-primary/10 rounded-full mx-auto mb-10"></div>

                                <ul className="space-y-5 flex-1 px-4">
                                    {[
                                        { text: "Até 200 Pedidos/mês", bold: true },
                                        { text: "Até 20 Produtos", bold: true },
                                        { text: "Até 150 Clientes", bold: true },
                                        { text: "Cardápio Digital Vip", bold: false },
                                        { text: "Gestão Financeira", bold: false },
                                        { text: "Controle de Estoque", bold: false }
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-4 text-sm group/item">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary group-hover/item:bg-primary group-hover/item:text-white transition-colors duration-300">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                            </div>
                                            <span className={item.bold ? "font-semibold text-foreground" : "font-light text-muted-foreground"}>
                                                {item.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-12">
                                    <Button
                                        onClick={() => navigate('/register')}
                                        className="btn-primary w-full h-14 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 font-bold text-base tracking-wide text-white"
                                    >
                                        Começar Agora
                                    </Button>
                                    <p className="text-[10px] text-center text-muted-foreground/60 mt-4 flex items-center justify-center gap-1.5 font-medium">
                                        <Shield className="w-3 h-3" />
                                        Garantia de 7 dias ou seu dinheiro de volta
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </RevealOnScroll>

                    {/* Plano Premium (Renamed) */}
                    <RevealOnScroll delay={0.2} className="h-full flex flex-col">
                        <Card className="flex-1 flex flex-col relative overflow-hidden bg-white/50 backdrop-blur-sm border border-border/40 shadow-lg shadow-gray-200/50 rounded-[2.5rem] transition-all duration-500 hover:border-primary/20 hover:bg-white/80 hover:shadow-xl group px-6 py-8">
                            <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="bg-secondary/10 text-secondary border border-secondary/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                    Sem Limites
                                </span>
                            </div>

                            <CardHeader className="text-center p-0 mb-8 pt-6">
                                <CardTitle className="text-xl font-bold text-foreground font-heading mb-3">Premium</CardTitle>
                                <p className="text-sm text-muted-foreground font-light mb-8">
                                    Liberdade total para crescer.
                                </p>
                                <div className="flex items-center justify-center gap-4 translate-x-2 relative transition-all duration-300">
                                    <span className="text-sm text-muted-foreground font-light mt-4">R$</span>
                                    <span className="text-7xl font-extrabold text-foreground font-heading tracking-wider leading-none">
                                        {billingCycle === 'monthly' ? '79' : '642'}
                                    </span>
                                    <div className="flex flex-col items-start -ml-1 mt-3">
                                        <span className="text-xl font-bold text-foreground leading-none">
                                            {billingCycle === 'monthly' ? ',90' : ',00'}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                                            /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                                        </span>
                                    </div>
                                </div>

                                {billingCycle === 'annual' && (
                                    <div className="mt-3 flex flex-col items-center animate-in fade-in slide-in-from-top-2 duration-300">
                                        <p className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-1">
                                            Equivalente a R$ 53,50/mês
                                        </p>
                                        <p className="text-[11px] text-muted-foreground line-through decoration-muted-foreground/50">
                                            Total parcelado: R$ 958,80
                                        </p>
                                    </div>
                                )}
                            </CardHeader>

                            <CardContent className="p-0 flex-1 flex flex-col">
                                <div className="w-16 h-1 bg-secondary/10 rounded-full mx-auto mb-10"></div>

                                <ul className="space-y-5 flex-1 px-4">
                                    {[
                                        { text: "Pedidos ILIMITADOS", bold: true, icon: Zap, iconColor: "text-secondary" },
                                        { text: "Produtos ILIMITADOS", bold: true },
                                        { text: "Clientes ILIMITADOS", bold: true },
                                        { text: "Suporte Prioritário", bold: false },
                                        { text: "Dicas de I.A.", bold: false },
                                        { text: "Selos Exclusivos", bold: false }
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-4 text-sm group/item">
                                            <div className={`w-6 h-6 rounded-full bg-secondary/5 flex items-center justify-center shrink-0 ${item.iconColor || "text-muted-foreground"} group-hover/item:bg-secondary group-hover/item:text-white transition-colors duration-300`}>
                                                {item.icon ? <item.icon className="w-3.5 h-3.5 fill-current" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                            </div>
                                            <span className={item.bold ? "font-bold text-foreground" : "font-light text-muted-foreground"}>
                                                {item.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-12">
                                    <Button
                                        onClick={() => navigate('/register')}
                                        variant="outline"
                                        className="w-full h-14 rounded-2xl border-2 border-transparent bg-secondary/5 text-secondary hover:bg-secondary hover:text-white hover:border-transparent transition-all duration-300 font-bold text-base tracking-wide"
                                    >
                                        Quero Ser Premium
                                    </Button>
                                    <p className="text-[10px] text-center text-muted-foreground/60 mt-4 flex items-center justify-center gap-1.5 font-medium">
                                        <Shield className="w-3 h-3" />
                                        Garantia de 7 dias ou seu dinheiro de volta
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </RevealOnScroll>
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
