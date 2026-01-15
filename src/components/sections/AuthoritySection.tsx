import { RevealOnScroll } from '@/components/RevealOnScroll';
import { Quote } from 'lucide-react';

const AuthoritySection = () => {
    return (
        <section className="section-padding bg-background relative overflow-hidden section-separator-top">
            <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/pattern-grid.svg')] opacity-[0.02]"></div>
            <div className="container-max">
                <RevealOnScroll>
                    <div className="max-w-4xl mx-auto text-center space-y-10">
                        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
                            <Quote className="w-8 h-8 text-primary opacity-50" />
                        </div>

                        <h2 className="text-3xl md:text-5xl font-bold text-foreground font-heading leading-tight">
                            "O Cozinha ao Lucro nasceu para resolver o maior problema de quem vende comida: <span className="text-primary">não saber se está realmente ganhando dinheiro.</span>"
                        </h2>

                        <div className="space-y-6 text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            <p>
                                Chega de trabalhar no escuro. Aqui, cada número tem um motivo. Cada preço tem uma margem. Cada venda traz clareza.
                            </p>
                        </div>

                        <div className="pt-8 flex flex-col items-center gap-4">
                            <div className="w-16 h-1 bg-primary/20 rounded-full"></div>
                            <span className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">Equipe Cozinha ao Lucro</span>
                        </div>
                    </div>
                </RevealOnScroll>
            </div>
        </section>
    );
};

export default AuthoritySection;
