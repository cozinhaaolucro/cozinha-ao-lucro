import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { lazy, Suspense, useState, useRef } from 'react';

// Lazy load dialog to save ~30kb from initial bundle
const LeadFormDialog = lazy(() => import('@/components/LeadFormDialog').then(module => ({ default: module.LeadFormDialog })));

const HeroSection = () => {
    const navigate = useNavigate();
    const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
    const desktopVideoRef = useRef<HTMLVideoElement>(null);

    return (
        <section className="relative pt-20 pb-10 md:pt-24 md:pb-16 overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                {/* Modern SaaS Gradient Mesh (Aurora) - No lines, just pure light */}

                {/* Primary Deep Teal - Top Center (Base Atmosphere) - REPLACED with LIGHTER TONE */}
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[140%] h-[100%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[hsla(183,16%,55%,1)]/20 via-background/0 to-transparent blur-[100px] mix-blend-normal animate-aurora"></div>

                {/* Financial Gold - Right Side (Strong) */}
                <div className="absolute top-[-5%] right-[-5%] w-[70%] h-[80%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-financial/30 via-background/0 to-transparent blur-[100px] mix-blend-multiply opacity-90 animate-aurora" style={{ animationDelay: '2s' }}></div>

                {/* Primary Teal - Left Side (Strong - Replaced Secondary) - REPLACED with LIGHTER TONE */}
                <div className="absolute top-[-5%] left-[-5%] w-[70%] h-[80%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[hsla(183,16%,55%,1)]/40 via-background/0 to-transparent blur-[100px] mix-blend-multiply opacity-90 animate-aurora" style={{ animationDelay: '5s', animationDirection: 'reverse' }}></div>
            </div>

            <div className="container-max mobile-container relative z-10 text-center flex flex-col items-center">
                {/* Text Content */}
                <div className="w-full max-w-[90vw] mx-auto space-y-6 mb-6 animate-fade-in order-1">
                    <h1 className="text-[1.65rem] sm:text-3xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground tracking-tight md:whitespace-nowrap">
                        Transforme sua cozinha em<br className="md:hidden" /> um <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#2D7A70] to-primary animate-shimmer bg-[length:200%_auto]">Negócio Lucrativo</span>
                    </h1>

                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                        Controlando custos, precificando certo e eliminando desperdícios em tempo real.
                    </p>
                </div>

                {/* VISUAL MOCKUP HERO - Optimized & Scaled Up by 20% */}
                <div className="relative w-full max-w-[95%] lg:max-w-6xl mt-2 mb-4 group animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards order-2">
                    {/* Desktop Mockup Container */}
                    <div className="relative w-full rounded-xl md:rounded-2xl border-[3px] md:border-4 border-white/40 shadow-2xl bg-black/5 backdrop-blur-sm transform transition-all duration-700 hover:scale-[1.005] origin-bottom aspect-video">
                        {/* Mac Window Dots */}
                        <div className="absolute top-0 left-0 right-0 h-6 md:h-10 bg-muted/90 backdrop-blur border-b border-border/50 rounded-t-lg md:rounded-t-xl flex items-center px-3 md:px-4 gap-1.5 md:gap-2 z-20">
                            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-400"></div>
                            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-400"></div>
                        </div>

                        <div className="pt-6 md:pt-10 h-full rounded-xl md:rounded-2xl overflow-hidden bg-background">
                            <video
                                ref={desktopVideoRef}
                                src="/videos/hero_desktop.mp4"
                                autoPlay
                                muted
                                playsInline
                                loop
                                preload="auto"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Gloss Reflection */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-xl md:rounded-2xl"></div>
                    </div>

                    {/* Floating Elements / Decoration (Subtler) */}
                    <div className="absolute -top-12 -left-12 w-24 h-24 bg-financial/20 rounded-full blur-3xl animate-pulse pointer-events-none opacity-50"></div>
                    <div className="absolute top-1/2 -right-20 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none opacity-50"></div>
                </div>

                {/* Buttons Area */}
                <div className="order-3 w-full flex flex-col items-center">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                        <Button
                            onClick={() => navigate('/register')}
                            size="lg"
                            className="bg-gradient-to-r from-[hsla(186,35%,28%,1)] to-[hsla(187,29%,45%,1)] hover:from-[hsla(186,35%,20%,1)] hover:to-[hsla(187,29%,40%,1)] text-white font-bold uppercase tracking-wide rounded-full text-sm px-8 py-3 sm:py-6 h-auto w-full sm:w-auto shadow-lg hover:scale-105 transition-all duration-300 flex flex-col items-center gap-1"
                        >
                            <span className="text-center">Testar grátis por 7 dias</span>
                            <span className="text-[8px] font-normal normal-case tracking-normal opacity-70 sm:hidden">Sem cartão de crédito • Cancele quando quiser</span>
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setIsLeadFormOpen(true)}
                            className="h-auto px-8 py-6 w-full sm:w-auto text-sm border-2 border-primary text-emerald-600 bg-primary/5 hover:bg-primary/10 hover:text-emerald-700 rounded-full font-bold transition-all"
                        >
                            Ver como funciona
                        </Button>
                    </div>

                    {/* Trust Indicators - Smaller & Lower */}
                    <div className="hidden md:flex items-center justify-center gap-6 mt-12 text-xs text-muted-foreground/60 font-medium">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-primary/70" /> Sem cartão de crédito
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-primary/70" /> Acesso completo por 7 dias
                        </div>
                    </div>
                </div>
            </div>

            {/* Lazy Loaded Dialog */}
            {isLeadFormOpen && (
                <Suspense fallback={null}>
                    <LeadFormDialog open={isLeadFormOpen} onOpenChange={setIsLeadFormOpen}>
                        {/* No trigger needed here, controlled mode */}
                    </LeadFormDialog>
                </Suspense>
            )}
        </section>
    );
};

export default HeroSection;
