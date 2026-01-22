import { RevealOnScroll } from '@/components/RevealOnScroll';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AppShowcase = () => {
    const navigate = useNavigate();

    return (
        <section className="section-padding bg-muted/30 relative overflow-hidden">
            {/* Background Effects */}
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-[0.03]"></div>

                {/* Visual Narrative: The Bridge (Stream of Light) */}
                <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[200%] bg-gradient-to-br from-primary/10 via-transparent to-transparent -rotate-12 blur-3xl opacity-60 pointer-events-none"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[120%] bg-gradient-to-bl from-financial/10 via-transparent to-transparent rotate-12 blur-3xl opacity-40 pointer-events-none"></div>

                {/* Skewed Connector Removed */}
            </div>

            <div className="container-max mobile-container relative z-10">
                <RevealOnScroll>
                    <div className="text-center mb-24 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground tracking-tight">
                            O controle profissional que sua cozinha merece
                        </h2>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Esqueça planilhas complexas e cadernos bagunçados. O Cozinha ao Lucro centraliza toda a gestão do seu negócio em uma interface linda e intuitiva.
                        </p>
                    </div>
                </RevealOnScroll>


                <div className="grid lg:grid-cols-2 gap-16 items-center relative">
                    {/* Connecting Flow Line (Desktop only) */}
                    <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none z-0 opacity-20">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full stroke-primary/30 fill-none" strokeWidth="0.5">
                            <path d="M10,50 C30,40 50,60 70,50" vectorEffect="non-scaling-stroke" />
                        </svg>
                    </div>

                    <RevealOnScroll direction="right" className="lg:order-2 relative z-10">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm border border-primary/20 backdrop-blur-sm">
                                Vendas no Automático
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-foreground">
                                Seu Cardápio Digital <span className="text-primary">Profissional e Irresistível</span>
                            </h3>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Transforme visitantes em clientes fiéis. Tenha um link exclusivo para divulgar no Instagram e WhatsApp, permitindo que seus clientes façam pedidos sozinhos, sem erros e sem taxas de marketplace.
                            </p>
                            <ul className="space-y-4">
                                {['Sem taxas por pedido (100% seu)', 'Atendimento agilizado no WhatsApp', 'Fotos que dão água na boca'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-foreground/80">
                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                            <Check className="w-4 h-4 text-primary" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll direction="left" className="lg:order-1 relative z-10" delay={0.2}>
                        <div className="relative group perspective-1000">
                            {/* Glassmorphism Backdrop */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[110%] bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 -z-10 transform -rotate-6"></div>

                            {/* Mobile Mockup Style */}
                            <div className="relative max-w-[300px] mx-auto">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-accent rounded-[3rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                                <div className="relative rounded-[2.5rem] overflow-hidden border-8 border-background shadow-2xl bg-card transform-gpu">
                                    <img
                                        src="/images/mockups/cardapio_digital.png"
                                        alt="Cardápio Digital Mobile"
                                        width={300}
                                        height={600}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-auto object-cover will-change-transform hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>


                <div className="mt-24 text-center px-4">
                    <Button
                        onClick={() => navigate('/register')}
                        size="lg"
                        className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 w-full sm:w-auto text-white font-bold text-lg px-8 py-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                    >
                        Conheça o Cardápio Digital
                        <ArrowRight className="ml-2 w-5 h-5 inline-block" />
                    </Button>
                </div>

            </div>
        </section>
    );
};

export default AppShowcase;
