import { Card, CardContent } from '@/components/ui/card';
import { RevealOnScroll } from '@/components/RevealOnScroll';

const PainPointsSection = () => {
    const painPoints = [
        "Quer transformar sua habilidade culinária em fonte de renda?",
        "Busca estratégias práticas para empreender com produtos caseiros?",
        "Procura orientação sobre precificação e vendas de alimentos?",
        "Deseja aprender sobre legalização de negócio culinário?",
        "Busca métodos comprovados para empreendedorismo feminino?",
        "Quer complementar sua renda familiar de forma sustentável?"
    ];

    return (
        <section className="section-padding bg-muted/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/images/pattern-grid.svg')] opacity-5"></div>

            <div className="container-max relative z-10">
                <RevealOnScroll>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                            Cansada de contar moedas no fim do mês?
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Se você sonha em dar uma vida melhor para sua família usando o que já sabe fazer, este guia é para você:
                        </p>
                    </div>
                </RevealOnScroll>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {painPoints.map((benefit, index) => (
                        <RevealOnScroll key={index} delay={index * 0.1}>
                            <Card className="glass-card border-l-4 border-l-primary hover:border-l-primary-glow hover:-translate-y-1 transition-all duration-300 h-full">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0 animate-pulse"></div>
                                        <p className="text-foreground font-medium leading-relaxed">{benefit}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </RevealOnScroll>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PainPointsSection;
