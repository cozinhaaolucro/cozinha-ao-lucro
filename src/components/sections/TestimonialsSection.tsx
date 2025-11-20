import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { RevealOnScroll } from '@/components/RevealOnScroll';

const TestimonialsSection = () => {
    const testimonials = [
        {
            name: "Ana, São Paulo",
            result: "Comecei vendendo docinhos aos finais de semana. Em 3 meses alcancei R$ 800/mês de renda extra.",
            rating: 5
        }, {
            name: "Mariana, SP",
            result: "Em 3 meses saí do zero para R$ 8.500/mês vendendo docinhos gourmet",
            rating: 5
        }, {
            name: "Ana Paula, MG",
            result: "Consegui formalizar meu negócio e hoje faturo R$ 12.000 mensais",
            rating: 5
        }, {
            name: "Carla, RS",
            result: "O método de precificação aumentou meu lucro em 150%",
            rating: 5
        }, {
            name: "Fernanda, BA",
            result: "Transformei minha paixão por bolos em uma renda de R$ 6.800/mês",
            rating: 5
        }, {
            name: "Patrícia, PR",
            result: "Finalmente tenho minha independência financeira. Obrigada!",
            rating: 5
        }
    ];

    return (
        <section id="depoimentos" className="section-padding scroll-mt-20 bg-background relative">
            <div className="container-max">
                <RevealOnScroll>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                            Veja o que empreendedoras como você estão dizendo:
                        </h2>
                    </div>
                </RevealOnScroll>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <RevealOnScroll key={index} delay={index * 0.1} className="h-full">
                            <Card className="glass-card hover:shadow-elegant transition-smooth h-full border-primary/10">
                                <CardContent className="p-6 flex flex-col h-full justify-between">
                                    <div>
                                        <div className="flex items-center gap-1 mb-3">
                                            {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-primary text-primary" />)}
                                        </div>
                                        <p className="text-foreground mb-4 italic text-lg">"{testimonial.result}"</p>
                                    </div>
                                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
                                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center text-white shadow-md">
                                            <span className="font-bold">{testimonial.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">{testimonial.name}</p>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Cliente verificada</p>
                                        </div>
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

export default TestimonialsSection;
