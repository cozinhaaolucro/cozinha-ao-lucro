import { RevealOnScroll } from '@/components/RevealOnScroll';
import { Quote } from 'lucide-react';

const AuthoritySection = () => {
    return (
        <section className="section-padding bg-background relative overflow-hidden section-separator-top">
            {/* Visual Narrative: Stability (Solid Ground) */}
            <div className="absolute inset-0 bg-noise opacity-[0.15] pointer-events-none"></div>

            <div className="absolute inset-0 bg-noise opacity-[0.15] pointer-events-none"></div>

            <div className="container-max relative z-10">
                <RevealOnScroll>
                    <div className="max-w-4xl mx-auto">
                        <div className="relative bg-white/80 backdrop-blur-xl border border-primary/10 rounded-[2rem] p-8 md:p-12 text-center shadow-2xl shadow-primary/5">
                            {/* Decorative Quote Icon */}
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white backdrop-blur-xl border border-primary/10 p-4 rounded-full shadow-lg">
                                <Quote className="w-8 h-8 text-primary" />
                            </div>

                            <div className="mt-6 space-y-8">
                                <h2 className="text-2xl md:text-4xl font-bold text-foreground font-heading leading-tight tracking-tight">
                                    "O Cozinha ao Lucro nasceu para resolver o maior problema de quem vende comida:
                                    <span className="block mt-4 text-primary relative font-extrabold text-3xl md:text-5xl">
                                        não saber se está realmente ganhando dinheiro."
                                        <svg className="absolute w-full h-3 -bottom-9 left-0 text-primary/20 opacity-50" viewBox="0 0 100 10" preserveAspectRatio="none">
                                            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                                        </svg>
                                    </span>
                                </h2>

                                <div className="h-px w-full max-w-[200px] mx-auto bg-gradient-to-r from-transparent via-primary/20 to-transparent my-14 md:my-20"></div>

                                <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
                                    Chega de trabalhar no escuro. Aqui, cada número tem um motivo. <br className="hidden md:block" />
                                    Cada preço tem uma margem. <strong className="text-foreground font-semibold">Cada venda traz clareza.</strong>
                                </p>

                                <div className="pt-8 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                                    <span className="text-sm font-bold tracking-[0.2em] uppercase text-primary/80">
                                        Equipe Cozinha ao Lucro
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </RevealOnScroll>
            </div>
        </section>
    );
};

export default AuthoritySection;
