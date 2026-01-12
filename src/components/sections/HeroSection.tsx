import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, BarChart3, MessageCircle } from 'lucide-react';
import ProfitCalculator from '@/components/ProfitCalculator';
import { useNavigate } from 'react-router-dom';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import { LeadFormDialog } from '@/components/LeadFormDialog';

const HeroSection = () => {
    const navigate = useNavigate();
    return (
        <section className="relative pt-24 pb-16 md:pt-40 md:pb-28">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] spotlight-warm opacity-60 blur-3xl rounded-full mix-blend-screen animate-float"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] spotlight opacity-40 blur-3xl rounded-full mix-blend-overlay"></div>
            </div>

            <div className="container-max mobile-container relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-start">
                    {/* Left Column: Copy */}
                    <div className="text-center lg:text-left space-y-8">
                        <RevealOnScroll delay={0}>
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground [text-wrap:balance] font-heading transform-gpu antialiased drop-shadow-sm">
                                Transforme sua cozinha em um negócio
                                <span className="block text-primary mt-2 relative inline-block effect-shine px-4 py-1 -mx-4 leading-tight">
                                    Realmente Lucrativo
                                </span>
                            </h1>
                        </RevealOnScroll>

                        <RevealOnScroll delay={0.1}>
                            <p className="text-base md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                                Controle custos, acerte no preço e saiba exatamente quanto você lucra em cada venda — <strong className="text-foreground/90">mesmo começando do zero.</strong>
                            </p>
                        </RevealOnScroll>

                        <RevealOnScroll delay={0.2}>
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <Button
                                    onClick={() => navigate('/register')}
                                    size="lg"
                                    className="btn-primary btn-shine shine-delay-1 text-lg px-8 py-7 h-auto w-full sm:w-auto shadow-lg hover:shadow-glow group"
                                >
                                    <span className="md:hidden">Começar Agora</span>
                                    <span className="hidden md:inline">Começar a Lucrar Agora</span>
                                    <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                                </Button>

                                <LeadFormDialog>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-14 w-14 rounded-full bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-glow hover:scale-105 active:scale-95 transition-all duration-300 border border-white/40"
                                        title="Fale Conosco"
                                    >
                                        <MessageCircle className="w-6 h-6" />
                                    </Button>
                                </LeadFormDialog>
                            </div>
                        </RevealOnScroll>

                        <RevealOnScroll delay={0.3}>
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-muted-foreground pt-4">
                                {[
                                    'Precificação Automática',
                                    'Gestão de Pedidos',
                                    'Controle de Estoque'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-accent" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </RevealOnScroll>
                    </div>

                    {/* Right Column: Calculator */}
                    <RevealOnScroll delay={0.2} direction="right">
                        <div className="relative transform-gpu perspective-1000">
                            <div className="text-center mb-4">
                                <Button onClick={() => navigate('/register')} variant="ghost" size="sm" className="gap-2 hover:bg-primary/10 text-muted-foreground hover:text-primary">
                                    <BarChart3 className="w-4 h-4" />
                                    Ver Meu Lucro na Prática
                                </Button>
                            </div>
                            <ProfitCalculator />
                        </div>
                    </RevealOnScroll>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;

