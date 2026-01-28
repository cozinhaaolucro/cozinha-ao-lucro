import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, Clock, TrendingUp, Shield, Award, Sparkles } from 'lucide-react';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import { Tilt } from 'react-tilt';
import { useNavigate } from 'react-router-dom';

const BenefitsSection = () => {
    const navigate = useNavigate();
    const benefits = [
        {
            icon: DollarSign,
            title: "Precificação Estratégica",
            desc: "Aprenda métodos para definir preços que cubram custos e gerem margem justa de lucro.",
            color: "text-emerald-500",
            bg: "bg-muted/10"
        }, {
            icon: Users,
            title: "Atrair Primeiros Clientes",
            desc: "Conquiste seus primeiros clientes sem gastar com anúncios, usando o poder do seu círculo social.",
            color: "text-blue-500",
            bg: "bg-muted/10"
        }, {
            icon: Clock,
            title: "Organizar sua Rotina",
            desc: "Produza com eficiência, sem estresse e sem bagunçar a dinâmica da sua casa.",
            color: "text-amber-500",
            bg: "bg-muted/10"
        }, {
            icon: TrendingUp,
            title: "Crescimento Sustentável",
            desc: "Escale seu negócio de forma inteligente, aumentando seus lucros mês após mês.",
            color: "text-purple-500",
            bg: "bg-muted/10"
        }, {
            icon: Shield,
            title: "Segurança Jurídica",
            desc: "Formalize seu negócio de forma simples e opere com total segurança legal.",
            color: "text-slate-500",
            bg: "bg-muted/10"
        }, {
            icon: Award,
            title: "Independência Financeira",
            desc: "Conquiste sua liberdade financeira trabalhando com o que ama, no conforto da sua casa.",
            color: "text-primary",
            bg: "bg-muted/10"
        }
    ];

    return (
        <section id="benefícios" className="py-16 md:py-20 px-4 md:px-8 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden scroll-mt-20">
            {/* Ambient Background */}
            {/* Ambient Background & Growth */}
            <div className="absolute inset-0 bg-noise opacity-[0.05] pointer-events-none"></div>

            {/* Visual Narrative: Growth (Rising Sunrise) - Softened */}
            {/* Soft light rising from the bottom to represent growth/profit */}
            <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-[50%] bg-gradient-to-t from-primary/5 via-primary/0 to-transparent blur-[120px] animate-rise-slow mix-blend-screen opacity-50"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-secondary/5 blur-[150px] rounded-full animate-rise-slow opacity-30" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-[-20%] right-[20%] w-[60%] h-[60%] bg-financial/5 blur-[150px] rounded-full animate-rise-slow opacity-30" style={{ animationDelay: '4s' }}></div>

            <div className="container-max relative z-10">
                <RevealOnScroll>
                    <div className="text-center mb-12 relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground font-heading tracking-tight leading-tight">
                            Por que o Cozinha ao Lucro <span className="text-primary italic">funciona na prática?</span>
                        </h2>
                        <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
                            Porque ele foi criado para quem cozinha de verdade — e precisa tomar decisões financeiras claras todos os dias.
                        </p>
                    </div>
                </RevealOnScroll>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 px-4 md:px-8">
                    {[
                        {
                            icon: DollarSign,
                            title: "Preço certo antes de vender",
                            desc: "Saiba exatamente quanto custa cada produto antes de definir o preço. Nada de vender bem e descobrir depois que não sobrou lucro.",
                            color: "text-emerald-500",
                            bg: "bg-muted/10"
                        }, {
                            icon: Users,
                            title: "Mais clientes, sem bagunça",
                            desc: "Gerencie pedidos, prazos e produção sem perder o controle, mesmo com vários pedidos ao mesmo tempo.",
                            color: "text-blue-500",
                            bg: "bg-muted/10"
                        }, {
                            icon: Clock,
                            title: "Menos improviso na rotina",
                            desc: "Pedidos organizados por status, datas claras e visão do que está em produção, pronto ou entregue.",
                            color: "text-amber-500",
                            bg: "bg-muted/10"
                        }, {
                            icon: TrendingUp,
                            title: "Crescer sem perder o controle",
                            desc: "Acompanhe faturamento, custos e lucro conforme o volume aumenta — sem depender de planilhas.",
                            color: "text-purple-500",
                            bg: "bg-muted/10"
                        }, {
                            icon: Shield,
                            title: "Segurança nas decisões",
                            desc: "Entenda seus números e tome decisões com base em dados reais, não em sensação.",
                            color: "text-slate-500",
                            bg: "bg-muted/10"
                        }, {
                            icon: Award,
                            title: "Liberdade financeira",
                            desc: "Quando você sabe quanto ganha em cada venda, fica mais fácil crescer com tranquilidade.",
                            color: "text-primary",
                            bg: "bg-muted/10"
                        }
                    ].map((benefit, index) => (
                        <Tilt key={index} options={{ max: 5, scale: 1.01, speed: 1000, glare: true, "max-glare": 0.1 }} className="h-full">
                            <RevealOnScroll delay={index * 0.1} className="h-full">
                                <Card className="bg-card/40 backdrop-blur-md border border-white/10 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 text-left group cursor-default h-full min-h-[200px] relative overflow-hidden flex flex-col rounded-2xl">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                    <CardContent className="p-6 flex flex-col flex-1 h-full relative z-10">
                                        <div className={`w-14 h-14 ${benefit.bg} ${benefit.color} rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10 flex-shrink-0`}>
                                            <benefit.icon className="w-7 h-7 stroke-[2]" />
                                        </div>

                                        <h3 className="text-xl font-bold mb-3 text-foreground font-heading group-hover:text-primary transition-colors duration-300">
                                            {benefit.title}
                                        </h3>

                                        <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300 font-light">
                                            {benefit.desc}
                                        </p>
                                    </CardContent>
                                </Card>
                            </RevealOnScroll>
                        </Tilt>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <Button
                        onClick={() => navigate('/register')}
                        size="lg"
                        className="bg-gradient-to-r from-[hsla(186,35%,28%,1)] to-[hsla(187,29%,45%,1)] hover:from-[hsla(186,35%,20%,1)] hover:to-[hsla(187,29%,40%,1)] text-white border-0 font-bold rounded-full px-8 py-6 h-auto text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                        Testar grátis por 7 dias
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3">Sem compromisso.</p>
                </div>
            </div>
        </section>
    );
};

export default BenefitsSection;
