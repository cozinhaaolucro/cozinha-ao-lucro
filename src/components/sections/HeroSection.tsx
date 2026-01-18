import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, MessageCircle } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { LeadFormDialog } from '@/components/LeadFormDialog';

const HeroSection = () => {
    const navigate = useNavigate();
    return (
        <section className="relative pt-32 pb-32 md:pt-48 md:pb-40 overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[80%] h-[60%] spotlight-warm opacity-40 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow"></div>
            </div>

            <div className="container-max mobile-container relative z-10 text-center">
                {/* Text Content - Rendered Immediately for LCP */}
                <div className="max-w-4xl mx-auto space-y-8 mb-16 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm border border-primary/20 backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Gestão Inteligente v2.0
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-foreground tracking-tight [text-wrap:balance]">
                        Transforme sua cozinha em um negócio
                        <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#2D7A70] to-primary animate-shimmer bg-[length:200%_auto]">
                            Realmente Lucrativo
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                        Controlando custos, precificando certo e eliminando desperdícios em tempo real.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button
                            onClick={() => navigate('/register')}
                            size="lg"
                            className="btn-primary btn-shine text-lg px-10 py-8 h-auto w-full sm:w-auto shadow-elegant hover:scale-105"
                        >
                            Ver meu lucro real
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>

                        <LeadFormDialog>
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-auto px-8 py-8 w-full sm:w-auto text-lg border-2 hover:bg-primary hover:text-white hover:border-primary transition-all font-medium"
                            >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Falar com Especialista
                            </Button>
                        </LeadFormDialog>
                    </div>

                    <div className="flex items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" /> Sem cartão necessário
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" /> Setup em 2 minutos
                        </div>
                    </div>
                </div>

                {/* VISUAL MOCKUP HERO - Optimized for LCP */}
                <div className="relative mx-auto max-w-6xl perspective-1000 mt-12 group animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards">
                    {/* Desktop Mockup Container */}
                    <div className="relative rounded-2xl border-4 border-white/40 shadow-2xl bg-black/5 backdrop-blur-sm transform transition-all duration-700 hover:rotate-x-2 hover:scale-[1.01] rotate-x-6 origin-bottom">
                        {/* Mac Window Dots */}
                        <div className="absolute top-0 left-0 right-0 h-10 bg-muted/90 backdrop-blur border-b border-border/50 rounded-t-xl flex items-center px-4 gap-2 z-20">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>

                        <div className="pt-10 rounded-2xl overflow-hidden bg-background">
                            <picture>
                                <source media="(max-width: 640px)" srcSet="/images/mockups/hero_dashboard_desktop_324.webp" />
                                <img
                                    src="/images/mockups/hero_dashboard_desktop.webp"
                                    alt="Dashboard Cozinha ao Lucro"
                                    width={1200}
                                    height={800}
                                    loading="eager"
                                    fetchPriority="high"
                                    className="w-full h-auto object-cover"
                                />
                            </picture>
                        </div>

                        {/* Gloss Reflection */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-2xl"></div>
                    </div>

                    {/* Mobile Floating Mockup */}
                    <div className="absolute -bottom-16 -right-4 md:-right-12 w-[180px] md:w-[280px] animate-float" style={{ animationDelay: '1s' }}>
                        <div className="relative rounded-[2.5rem] border-[8px] border-gray-900 shadow-2xl bg-gray-900 overflow-hidden">
                            {/* Dynamic Island / Notch Area */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30%] h-[20px] bg-black rounded-b-xl z-20"></div>

                            <picture>
                                <source media="(max-width: 640px)" srcSet="/images/mockups/hero_mobile_pedidos_164.webp" />
                                <img
                                    src="/images/mockups/hero_mobile_pedidos.webp"
                                    alt="App Mobile Pedidos"
                                    width={300}
                                    height={600}
                                    loading="eager"
                                    className="w-full h-auto object-cover"
                                />
                            </picture>
                        </div>
                    </div>

                    {/* Floating Elements / Decoration */}
                    <div className="absolute -top-12 -left-12 w-24 h-24 bg-financial/20 rounded-full blur-2xl animate-pulse"></div>
                    <div className="absolute top-1/2 -right-20 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
