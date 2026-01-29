import { RevealOnScroll } from '@/components/RevealOnScroll';
import { Quote } from 'lucide-react';

const AuthoritySection = () => {
    return (
        <section className="py-12 md:py-16 bg-background relative overflow-hidden section-separator-top">
            {/* Visual Narrative: Stability (Solid Ground) */}
            <div className="absolute inset-0 bg-noise opacity-[0.15] pointer-events-none"></div>

            {/* Abstract Background Shapes */}


            <div className="container-max relative z-10">
                <RevealOnScroll>
                    <div className="max-w-6xl mx-auto text-center relative">
                        {/* Minimalist Quote Icon */}
                        <Quote className="w-10 h-10 text-primary/20 mx-auto mb-6" />

                        <h2 className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed tracking-tight">
                            O Cozinha ao Lucro nasceu para resolver o maior problema de quem vende comida:
                            <span className="text-primary font-bold"> não saber se está realmente ganhando dinheiro.</span>

                            <span className="block h-8"></span>

                            Aqui, cada preço tem uma margem e cada venda traz clareza.
                        </h2>
                    </div>
                </RevealOnScroll>
            </div>
        </section>
    );
};

export default AuthoritySection;
