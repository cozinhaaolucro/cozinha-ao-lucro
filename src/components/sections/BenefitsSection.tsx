import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Users, Clock, TrendingUp, Shield, Award } from 'lucide-react';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import { Tilt } from 'react-tilt';

const BenefitsSection = () => {
    const benefits = [
        {
            icon: DollarSign,
            title: "Precificação Estratégica",
            desc: "Aprenda métodos para definir preços que cubram custos e gerem margem justa de lucro."
        }, {
            icon: Users,
            title: "Atrair Primeiros Clientes",
            desc: "Conquiste seus primeiros clientes sem gastar com anúncios, usando o poder do seu círculo social."
        }, {
            icon: Clock,
            title: "Organizar sua Rotina",
            desc: "Produza com eficiência, sem estresse e sem bagunçar a dinâmica da sua casa."
        }, {
            icon: TrendingUp,
            title: "Crescimento Sustentável",
            desc: "Escale seu negócio de forma inteligente, aumentando seus lucros mês após mês."
        }, {
            icon: Shield,
            title: "Segurança Jurídica",
            desc: "Formalize seu negócio de forma simples e opere com total segurança legal."
        }, {
            icon: Award,
            title: "Independência Financeira",
            desc: "Conquiste sua liberdade financeira trabalhando com o que ama, no conforto da sua casa."
        }
    ];

    return (
        <section id="benefícios" className="section-padding bg-gradient-to-b from-white via-background to-white relative overflow-hidden scroll-mt-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/pattern-grid.svg')] opacity-[0.02]"></div>

            {/* Side Decorations */}
            {/* Side Decorations - Lighting */}
            <div className="absolute top-1/2 left-[-10%] w-[40%] h-[80%] bg-primary/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 mix-blend-multiply"></div>
            <div className="absolute top-1/2 right-[-10%] w-[40%] h-[80%] bg-accent/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 mix-blend-multiply"></div>

            {/* Center illumination */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none"></div>

            <div className="container-max mobile-container relative z-10">
                <RevealOnScroll>
                    <div className="text-center mb-16 relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                            Por que este método funciona para você?
                        </h2>
                    </div>
                </RevealOnScroll>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {benefits.map((benefit, index) => (
                        <Tilt key={index} options={{ max: 10, scale: 1.02, speed: 400 }} className="h-full">
                            <RevealOnScroll delay={index * 0.1} className="h-full">
                                <Card className="bg-card hover:shadow-elegant transition-all duration-300 text-center group cursor-pointer hover:border-primary/20 h-full">
                                    <CardContent className="p-8 flex flex-col items-center h-full">
                                        <div className="w-16 h-16 bg-icon/20 rounded-[4px] flex items-center justify-center mx-auto mb-6 transition-colors duration-300 transform shadow-sm">
                                            <benefit.icon className="w-8 h-8 text-icon stroke-[2]" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3 text-primary transition-colors duration-300">{benefit.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">{benefit.desc}</p>
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
