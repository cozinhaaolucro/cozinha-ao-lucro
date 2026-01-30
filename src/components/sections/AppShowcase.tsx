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
                <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[200%] bg-gradient-to-br from-primary/10 via-transparent to-transparent -rotate-12 blur-3xl opacity-30 pointer-events-none"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[120%] bg-gradient-to-bl from-financial/10 via-transparent to-transparent rotate-12 blur-3xl opacity-20 pointer-events-none"></div>
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
                                    Tudo o que você precisa para organizar sua produção e enxergar o lucro real — em um único sistema simples de usar.
                                </p>
                            </div>

                            <ul className="space-y-6">
                                {[
                                    { title: "Pedidos organizados por status", desc: "Visualize tudo em um quadro simples: pendente, em produção, pronto e entregue." },
                                    { title: "Produtos com ficha técnica completa", desc: "Cada ingrediente, cada quantidade, cada custo — tudo calculado automaticamente." },
                                    { title: "Estoque com baixa automática", desc: "Ingredientes são descontados conforme os pedidos são finalizados." },
                                    { title: "Clientes com histórico e valor total gasto", desc: "Identifique seus melhores clientes e venda com mais estratégia." }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                                            <Check className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground text-lg">{item.title}</h4>
                                            <p className="text-muted-foreground leading-relaxed text-base">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-4">
                                <Button
                                    onClick={() => navigate('/register')}
                                    size="lg"
                                    className="bg-gradient-to-r from-[hsla(186,35%,28%,1)] to-[hsla(187,29%,45%,1)] hover:from-[hsla(186,35%,20%,1)] hover:to-[hsla(187,29%,40%,1)] text-white font-bold text-lg px-8 py-6 h-auto rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                                >
                                    Começar agora
                                    <ArrowRight className="ml-2 w-5 h-5 inline-block" />
                                </Button>
                                <p className="text-xs text-muted-foreground mt-3 font-medium opacity-80 pl-4">
                                    Cancele quando quiser.
                                </p>
                            </div>
                        </div>
                    </RevealOnScroll>




                    {/* Right Column: Visuals */}
                    <RevealOnScroll className="order-1 lg:order-2 relative" delay={0.2}>
                        {/* Mobile: Staggered overlapping layout */}
                        <div className="md:hidden relative h-[320px] w-full">
                            {/* Decorative blur */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-gradient-to-tr from-primary/5 to-secondary/5 blur-[40px] rounded-full pointer-events-none"></div>

                            {/* Card 1: Top left */}
                            <div className="absolute top-0 left-0 w-[65%] shadow-xl rounded-2xl z-10">
                                <div className="bg-white border border-gray-100 p-1 rounded-2xl overflow-hidden">
                                    <img
                                        src="/images/mockups/pedidos_showcase.jpg"
                                        alt="Pedidos"
                                        loading="lazy"
                                        className="w-full h-auto rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Card 2: Top right, overlapping */}
                            <div className="absolute top-[30px] right-0 w-[58%] shadow-xl rounded-2xl z-20">
                                <div className="bg-white border border-gray-100 p-1 rounded-2xl overflow-hidden">
                                    <img
                                        src="/images/mockups/estoque_showcase.jpg"
                                        alt="Estoque"
                                        loading="lazy"
                                        className="w-full h-auto rounded-xl"
                                    />
                                </div>
                            </div>

                            {/* Card 3: Bottom center, overlapping both */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] shadow-2xl rounded-2xl z-30">
                                <div className="bg-white border border-gray-100 p-1 rounded-2xl overflow-hidden">
                                    <img
                                        src="/images/mockups/central_showcase.jpg"
                                        alt="Visão Geral"
                                        loading="lazy"
                                        className="w-full h-auto rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Desktop: Mobile-Mirrored Layout (TopLeft, TopRight, BottomCenter) */}
                        <div className="hidden md:block relative h-[650px] w-full mt-10">
                            {/* Abstract decorative blob behind */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/10 to-secondary/10 blur-[60px] rounded-full pointer-events-none"></div>

                            {/* Card 1: Top Left (Back) */}
                            <div className="absolute top-0 left-[5%] z-10 w-[42%] shadow-2xl rounded-3xl">
                                <div className="bg-white border border-white/20 p-1 rounded-3xl overflow-hidden w-full h-full">
                                    <img
                                        src="/images/mockups/pedidos_showcase.jpg"
                                        alt="Pedidos"
                                        className="w-full h-auto rounded-2xl"
                                    />
                                </div>
                            </div>

                            {/* Card 2: Top Right (Front - Highest Z) */}
                            <div className="absolute top-[8%] right-[5%] z-30 w-[38%] shadow-2xl rounded-3xl">
                                <div className="bg-white border border-white/20 p-1 rounded-3xl overflow-hidden w-full h-full">
                                    <img
                                        src="/images/mockups/estoque_showcase.jpg"
                                        alt="Estoque"
                                        className="w-full h-auto rounded-2xl"
                                    />
                                </div>
                            </div>

                            {/* Card 3: Bottom Center (Mid Z) */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 w-[48%] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] rounded-3xl">
                                <div className="bg-white border border-white/40 p-1 rounded-3xl overflow-hidden w-full h-full">
                                    <img
                                        src="/images/mockups/central_showcase.jpg"
                                        alt="Card"
                                        className="w-full h-auto rounded-2xl"
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
