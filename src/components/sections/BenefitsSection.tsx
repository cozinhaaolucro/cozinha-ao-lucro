import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Users, Clock, TrendingUp, Shield, Award, Sparkles } from 'lucide-react';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import { Tilt } from 'react-tilt';

const BenefitsSection = () => {
    const benefits = [
        {
            icon: DollarSign,
            title: "Precificação Estratégica",
            desc: "Aprenda métodos para definir preços que cubram custos e gerem margem justa de lucro.",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        }, {
            icon: Users,
            title: "Atrair Primeiros Clientes",
            desc: "Conquiste seus primeiros clientes sem gastar com anúncios, usando o poder do seu círculo social.",
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        }, {
            icon: Clock,
            title: "Organizar sua Rotina",
            desc: "Produza com eficiência, sem estresse e sem bagunçar a dinâmica da sua casa.",
            color: "text-amber-500",
            bg: "bg-amber-500/10"
        }, {
            icon: TrendingUp,
            title: "Crescimento Sustentável",
            desc: "Escale seu negócio de forma inteligente, aumentando seus lucros mês após mês.",
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        }, {
            icon: Shield,
            title: "Segurança Jurídica",
            desc: "Formalize seu negócio de forma simples e opere com total segurança legal.",
            color: "text-slate-500",
            bg: "bg-slate-500/10"
        }, {
            icon: Award,
            title: "Independência Financeira",
            desc: "Conquiste sua liberdade financeira trabalhando com o que ama, no conforto da sua casa.",
            color: "text-primary",
            bg: "bg-primary/10"
        }
    ];

    return (
        <section id="benefícios" className="section-padding bg-gradient-to-b from-background to-muted/20 relative overflow-hidden scroll-mt-20">
            {/* Ambient Background */}
            {/* Ambient Background & Growth */}
            <div className="absolute inset-0 bg-noise opacity-[0.15] pointer-events-none"></div>

            {/* Visual Narrative: Growth (Rising Sunrise) */}
            {/* Soft light rising from the bottom to represent growth/profit */}
            <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-[50%] bg-gradient-to-t from-primary/15 via-primary/5 to-transparent blur-[80px] animate-rise-slow mix-blend-screen"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-secondary/10 blur-[100px] rounded-full animate-rise-slow" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-[-20%] right-[20%] w-[60%] h-[60%] bg-financial/10 blur-[100px] rounded-full animate-rise-slow" style={{ animationDelay: '4s' }}></div>

            <div className="container-max relative z-10">
                <RevealOnScroll>
                    <div className="text-center mb-16 relative z-10">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-4 border border-primary/20">
                            <Sparkles className="w-3 h-3" />
                            O Método
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground font-heading tracking-tight leading-tight">
                            Por que este método <span className="text-primary italic">funciona para você?</span>
                        </h2>
                        <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
                            Transformamos complexidade em um sistema simples e prático para o seu sucesso.
                        </p>
                    </div>
                </RevealOnScroll>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {benefits.map((benefit, index) => (
                        <Tilt key={index} options={{ max: 5, scale: 1.01, speed: 1000, glare: true, "max-glare": 0.1 }} className="h-full">
                            <RevealOnScroll delay={index * 0.1} className="h-full">
                                <Card className="bg-card/40 backdrop-blur-md border border-white/10 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 text-left group cursor-default h-full min-h-[240px] relative overflow-hidden flex flex-col rounded-3xl">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                    <CardContent className="p-8 flex flex-col flex-1 h-full relative z-10">
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
            </div>
        </section>
    );
};

export default BenefitsSection;
