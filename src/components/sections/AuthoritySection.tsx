import { RevealOnScroll } from '@/components/RevealOnScroll';
import { Target } from 'lucide-react';

const AuthoritySection = () => {
    return (
        <section className="section-padding bg-white border-y border-border/40 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/pattern-grid.svg')] opacity-[0.03]"></div>
            <div className="container-max">
                <RevealOnScroll>
                    <div className="max-w-3xl mx-auto text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/10 rounded-2xl flex items-center justify-center border border-primary/10 shadow-lg">
                            <Target className="w-8 h-8 text-primary" />
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold text-foreground font-heading">
                            Criado para quem vive a <span className="text-primary text-glow">realidade da cozinha</span>
                        </h2>

                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                            O Cozinha ao Lucro nasceu para resolver o maior problema de quem vende comida: <strong className="text-foreground/90">não saber se está realmente ganhando dinheiro.</strong>
                        </p>

                        <p className="text-lg text-muted-foreground/80">
                            Aqui, cada número tem um motivo. Cada preço tem uma margem. Cada venda tem clareza.
                        </p>
                    </div>
                </RevealOnScroll>
            </div>
        </section>
    );
};

export default AuthoritySection;
