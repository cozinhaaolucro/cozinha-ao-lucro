import { RevealOnScroll } from '@/components/RevealOnScroll';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AppShowcase = () => {
    const navigate = useNavigate();

    return (
        <section className="section-padding bg-muted/30 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[20%] right-[0%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full transform-gpu will-change-transform"></div>
                <div className="absolute bottom-[20%] left-[0%] w-[40%] h-[40%] bg-financial/5 blur-[100px] rounded-full transform-gpu will-change-transform"></div>
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


                {/* Feature 2: Lista de Compras (Reversed) */}
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <RevealOnScroll direction="right" className="lg:order-2">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm">
                                Organização Total
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-foreground">
                                Lista de Compras <span className="text-primary">Gerada Automaticamente</span>
                            </h3>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Com base nos seus pedidos, o sistema gera a lista exata do que você precisa comprar. Evite idas desnecessárias ao mercado.
                            </p>
                            <ul className="space-y-4">
                                {['Agrupamento por setor', 'Checklist interativo', 'Histórico de compras'].map((item, i) => (
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

                    <RevealOnScroll direction="left" className="lg:order-1" delay={0.2}>
                        <div className="relative group perspective-1000">
                            {/* Mobile Mockup Style */}
                            <div className="relative max-w-[300px] mx-auto">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-accent rounded-[3rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                                <div className="relative rounded-[2.5rem] overflow-hidden border-8 border-background shadow-2xl bg-card transform-gpu">
                                    <picture>
                                        <source media="(max-width: 640px)" srcSet="/images/mockups/showcase_compras_mobile_284.webp" />
                                        <img
                                            src="/images/mockups/showcase_compras_mobile.webp"
                                            alt="Lista de Compras Mobile"
                                            width={300}
                                            height={600}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-auto object-cover will-change-transform hover:scale-105 transition-transform duration-500"
                                        />
                                    </picture>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>


                <div className="mt-24 text-center px-4">
                    <Button
                        onClick={() => navigate('/register')}
                        size="lg"
                        className="btn-primary w-full sm:w-auto text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-8 h-auto shadow-elegant hover:scale-105 transition-transform duration-300 whitespace-normal bg-gradient-to-r from-primary to-primary/90"
                    >
                        <span className="flex items-center justify-center gap-2">
                            Quero Organizar Minha Cozinha Agora
                            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                        </span>
                    </Button>
                </div>

            </div>
        </section>
    );
};

export default AppShowcase;
