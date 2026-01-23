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
    const mobileVideoRef = useRef<HTMLVideoElement>(null);

    const handleDesktopEnded = () => {
        // When desktop ends, reset it to start (so it waits at frame 0)
        if (desktopVideoRef.current) {
            desktopVideoRef.current.pause();
            desktopVideoRef.current.currentTime = 0;
        }
        // And play mobile
        if (mobileVideoRef.current) {
            mobileVideoRef.current.currentTime = 0;
            mobileVideoRef.current.play();
        }
    };

    const handleMobileEnded = () => {
        // When mobile ends, reset it to start (so it waits at frame 0)
        if (mobileVideoRef.current) {
            mobileVideoRef.current.pause();
            mobileVideoRef.current.currentTime = 0;
        }
        // And play desktop
        if (desktopVideoRef.current) {
            desktopVideoRef.current.currentTime = 0;
            desktopVideoRef.current.play();
        }
    };

    return (
        <section className="relative pt-32 pb-32 md:pt-20 md:pb-40 overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                {/* Modern SaaS Gradient Mesh (Aurora) - No lines, just pure light */}

                {/* Primary Deep Teal - Top Center (Base Atmosphere) */}
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[140%] h-[100%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background/0 to-transparent blur-[100px] mix-blend-normal animate-aurora"></div>

                {/* Financial Gold - Right Side (Strong) */}
                <div className="absolute top-[-5%] right-[-5%] w-[70%] h-[80%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-financial/30 via-background/0 to-transparent blur-[100px] mix-blend-multiply opacity-90 animate-aurora" style={{ animationDelay: '2s' }}></div>

                {/* Primary Teal - Left Side (Strong - Replaced Secondary) */}
                <div className="absolute top-[-5%] left-[-5%] w-[70%] h-[80%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/40 via-background/0 to-transparent blur-[100px] mix-blend-multiply opacity-90 animate-aurora" style={{ animationDelay: '5s', animationDirection: 'reverse' }}></div>
            </div>

            <div className="container-max mobile-container relative z-10 text-center">
                {/* Text Content - Rendered Immediately for LCP */}
                <div className="max-w-full mx-auto space-y-8 mb-8 animate-fade-in">


                    <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold leading-tight text-foreground tracking-tight">
                        Transforme sua cozinha em <br className="block md:hidden" />
                        um <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#2D7A70] to-primary animate-shimmer bg-[length:200%_auto]">Negócio Lucrativo</span>
                    </h1>

                    <p className="text-base md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                        Controlando custos, precificando certo e eliminando desperdícios em tempo real.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Button
                            onClick={() => navigate('/register')}
                            size="lg"
                            className="bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-500 text-white font-bold uppercase tracking-wide rounded-full text-xs sm:text-sm px-6 py-4 md:px-8 md:py-6 h-auto w-full sm:w-auto shadow-lg hover:scale-105 transition-all duration-300"
                        >
                            Testar grátis por 7 dias
                        </Button>

                        <div className="flex flex-col items-center gap-1 sm:hidden">
                            <span className="text-[10px] text-muted-foreground font-medium">Sem cartão de crédito • Cancele quando quiser</span>
                        </div>

                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setIsLeadFormOpen(true)}
                            className="h-auto px-6 py-4 md:px-8 md:py-6 w-full sm:w-auto text-sm md:text-base border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 rounded-full font-bold transition-all"
                        >
                            Ver como funciona
                        </Button>
                    </div>

                    <div className="hidden md:flex items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" /> Sem cartão de crédito
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" /> Acesso completo por 7 dias
                        </div>
                    </div>
                </div>

                {/* VISUAL MOCKUP HERO - Optimized for LCP */}
                <div className="relative mx-auto max-w-7xl mt-0 group animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards flex flex-col lg:flex-row items-center lg:items-center justify-center gap-8 lg:gap-12 px-4">
                    {/* Desktop Mockup Container */}
                    <div className="relative w-full lg:flex-1 rounded-2xl border-4 border-white/40 shadow-2xl bg-black/5 backdrop-blur-sm transform transition-all duration-700 hover:scale-[1.01] origin-bottom order-1 lg:order-1">
                        {/* Mac Window Dots */}
                        <div className="absolute top-0 left-0 right-0 h-10 bg-muted/90 backdrop-blur border-b border-border/50 rounded-t-xl flex items-center px-4 gap-2 z-20">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>

                        <div className="pt-10 rounded-2xl overflow-hidden bg-background">
                            <video
                                ref={desktopVideoRef}
                                src="/videos/hero_desktop.mp4"
                                autoPlay
                                muted
                                playsInline
                                preload="auto"
                                onEnded={handleDesktopEnded}
                                className="w-full h-auto object-cover"
                                width={1200}
                                height={800}
                            />
                        </div>

                        {/* Gloss Reflection */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-2xl"></div>
                    </div>

                    {/* Mobile Floating Mockup */}
                    <div className="relative w-[180px] md:w-[280px] shrink-0 animate-float order-2 lg:order-2" style={{ animationDelay: '1s' }}>
                        <div className="relative rounded-[2.5rem] border-[8px] border-gray-900 shadow-2xl bg-gray-900 overflow-hidden">
                            {/* Dynamic Island / Notch Area */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30%] h-[20px] bg-black rounded-b-xl z-20"></div>

                            <video
                                ref={mobileVideoRef}
                                src="/videos/hero_mobile.mp4"
                                muted
                                playsInline
                                preload="auto"
                                onEnded={handleMobileEnded}
                                className="w-full h-auto object-cover"
                                width={300}
                                height={600}
                            />
                        </div>
                    </div>

                    {/* Floating Elements / Decoration */}
                    <div className="absolute -top-12 -left-12 w-24 h-24 bg-financial/20 rounded-full blur-2xl animate-pulse pointer-events-none"></div>
                    <div className="absolute top-1/2 -right-20 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
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
