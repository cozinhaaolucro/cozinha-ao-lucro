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




                    {/* Right Column: Visuals */}
                    <RevealOnScroll className="order-1 lg:order-2 relative" delay={0.2}>
                        {/* Mobile: Staggered overlapping layout */}
                        <div className="md:hidden relative h-[320px] w-full">
                            {/* Decorative blur */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-gradient-to-tr from-primary/15 to-secondary/15 blur-[40px] rounded-full pointer-events-none"></div>

                            {/* Card 1: Top left */}
                            <div className="absolute top-0 left-0 w-[65%] shadow-xl rounded-2xl z-10">
                                <div className="bg-white border border-gray-100 p-1 rounded-2xl overflow-hidden">
                                    <img
                                        src="/images/mockups/shopping-list.png"
                                        alt="Lista Inteligente"
                                        loading="lazy"
                                        className="w-full h-auto rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Card 2: Top right, overlapping */}
                            <div className="absolute top-[30px] right-0 w-[58%] shadow-xl rounded-2xl z-20">
                                <div className="bg-white border border-gray-100 p-1 rounded-2xl overflow-hidden">
                                    <img
                                        src="/images/mockups/cardapio-digital.png"
                                        alt="Cardápio Digital"
                                        loading="lazy"
                                        className="w-full h-auto rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Card 3: Bottom center, overlapping both */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] shadow-2xl rounded-2xl z-30">
                                <div className="bg-white border border-gray-100 p-1 rounded-2xl overflow-hidden">
                                    <img
                                        src="/images/mockups/estoque.png"
                                        alt="Controle de Estoque"
                                        loading="lazy"
                                        className="w-full h-auto rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Desktop: Triple layout */}
                        <div className="hidden md:block relative h-[550px] w-full">
                            {/* Abstract decorative blob behind */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/20 to-secondary/20 blur-[60px] rounded-full pointer-events-none"></div>

                            {/* Card 1: Lista Inteligente (Top Left) */}
                            <div className="absolute top-0 left-[8%] z-20 w-[42%] shadow-2xl rounded-2xl animate-float" style={{ animationDuration: '6s' }}>
                                <div className="bg-white/90 backdrop-blur-xl border border-white/40 p-1 rounded-2xl overflow-hidden">
                                    <img
                                        src="/images/mockups/shopping-list.png"
                                        alt="Lista Inteligente"
                                        className="w-full h-auto rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Card 2: Cardápio (Top Right) */}
                            <div className="absolute top-4 right-[8%] z-30 w-[42%] shadow-2xl rounded-2xl animate-float" style={{ animationDuration: '7s', animationDelay: '0.5s' }}>
                                <div className="bg-white/90 backdrop-blur-xl border border-white/40 p-1 rounded-2xl overflow-hidden">
                                    <img
                                        src="/images/mockups/cardapio-digital.png"
                                        alt="Cardápio Digital"
                                        className="w-full h-auto rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Card 3: Estoque (Bottom Center) */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-40 w-[50%] shadow-2xl rounded-2xl animate-float" style={{ animationDuration: '8s', animationDelay: '1s' }}>
                                <div className="bg-white/90 backdrop-blur-xl border border-white/40 p-1 rounded-2xl overflow-hidden">
                                    <img
                                        src="/images/mockups/estoque.png"
                                        alt="Controle de Estoque"
                                        className="w-full h-auto rounded-xl"
                                    />
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
