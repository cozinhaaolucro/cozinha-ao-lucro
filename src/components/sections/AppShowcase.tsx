import { RevealOnScroll } from '@/components/RevealOnScroll';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AppShowcase = () => {
    const navigate = useNavigate();

    return (
        <section className="section-padding bg-muted/30 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-[0.03]"></div>
                {/* Visual Narrative: The Bridge (Stream of Light) */}
                <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[200%] bg-gradient-to-br from-primary/10 via-transparent to-transparent -rotate-12 blur-3xl opacity-60 pointer-events-none"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[120%] bg-gradient-to-bl from-financial/10 via-transparent to-transparent rotate-12 blur-3xl opacity-40 pointer-events-none"></div>
            </div>

            <div className="container-max mobile-container relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* Left Column: Content */}
                    <RevealOnScroll className="order-2 lg:order-1 text-left">
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground tracking-tight leading-tight">
                                    O controle profissional que <span className="text-primary">sua cozinha merece</span>
                                </h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Esqueça planilhas complexas e cadernos bagunçados. Centralize gestão, estoque e vendas em uma única plataforma inteligente.
                                </p>
                            </div>

                            <ul className="space-y-4">
                                {['Lista de Compras Inteligente', 'Cardápio Digital Automático', 'Controle de Estoque em Tempo Real'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-foreground/90 font-medium">
                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                            <Check className="w-4 h-4 text-primary" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-4">
                                <Button
                                    onClick={() => navigate('/register')}
                                    size="lg"
                                    className="bg-gradient-to-r from-[hsla(186,35%,28%,1)] to-[hsla(187,29%,45%,1)] hover:from-[hsla(186,35%,20%,1)] hover:to-[hsla(187,29%,40%,1)] text-white font-bold text-lg px-8 py-6 h-auto rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                                >
                                    Começar Agora
                                    <ArrowRight className="ml-2 w-5 h-5 inline-block" />
                                </Button>
                                <p className="text-xs text-muted-foreground mt-3 font-medium opacity-80 pl-4">
                                    Teste grátis de 7 dias. Sem compromisso.
                                </p>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Right Column: Dual Visuals (Placeholders) */}
                    <RevealOnScroll className="order-1 lg:order-2 relative" delay={0.2}>
                        <div className="relative h-[400px] md:h-[500px] w-full">
                            {/* Abstract decorative blob behind */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/20 to-secondary/20 blur-[60px] rounded-full pointer-events-none"></div>

                            {/* Card 1: Lista Inteligente (Top Left) */}
                            <div className="absolute top-8 left-[5%] md:left-[15%] z-20 w-[45%] shadow-2xl rounded-2xl animate-float" style={{ animationDuration: '6s' }}>
                                <div className="bg-white/90 backdrop-blur-xl border border-white/40 p-1 rounded-2xl">
                                    {/* Placeholder Image Area */}
                                    <div className="bg-muted/50 rounded-xl aspect-[4/3] flex items-center justify-center border border-dashed border-muted-foreground/20">
                                        <span className="text-muted-foreground font-medium text-sm">Lista Inteligente (Img)</span>
                                    </div>
                                    <div className="p-3">
                                        <div className="h-2 w-1/3 bg-muted rounded mb-2"></div>
                                        <div className="h-2 w-2/3 bg-muted rounded"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Cardápio (Bottom Right) */}
                            <div className="absolute bottom-8 right-[5%] md:right-[15%] z-30 w-[45%] shadow-2xl rounded-2xl animate-float" style={{ animationDuration: '7s', animationDelay: '1s' }}>
                                <div className="bg-white/90 backdrop-blur-xl border border-white/40 p-1 rounded-2xl">
                                    {/* Placeholder Image Area */}
                                    <div className="bg-muted/50 rounded-xl aspect-[4/3] flex items-center justify-center border border-dashed border-muted-foreground/20">
                                        <span className="text-muted-foreground font-medium text-sm">Cardápio Digital (Img)</span>
                                    </div>
                                    <div className="p-3">
                                        <div className="h-2 w-1/2 bg-muted rounded mb-2"></div>
                                        <div className="h-2 w-3/4 bg-muted rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </div>
        </section>
    );
};

export default AppShowcase;
