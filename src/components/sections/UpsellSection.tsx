import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { RevealOnScroll } from '@/components/RevealOnScroll';

const UpsellSection = () => {
    return (
        <section className="section-padding bg-gradient-to-r from-secondary/5 to-primary/5 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>

            <div className="container-max relative z-10">
                <RevealOnScroll>
                    <div className="text-center mb-12">
                        <Badge className="bg-primary text-primary-foreground text-lg px-6 py-2 mb-4 shadow-lg animate-pulse">
                            BÔNUS ESPECIAL
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                            Quer acelerar seus resultados e
                            <span className="text-primary block mt-2"> lucrar ainda mais rápido?</span>
                        </h2>
                    </div>
                </RevealOnScroll>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <RevealOnScroll direction="right">
                        <div className="text-center lg:text-left relative group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent blur-2xl rounded-full group-hover:blur-3xl transition-all duration-500"></div>
                            <a href="https://pay.kiwify.com.br/TV099tr" target="_blank" rel="noopener noreferrer" className="relative block">
                                <img
                                    src="/images/ebook_receitas_que_vendem_20251117_062322.png"
                                    alt="Capa do Ebook Bônus Receitas que Vendem"
                                    className="w-full max-w-sm mx-auto lg:mx-0 shadow-elegant rounded-lg mb-6 h-[300px] object-cover cursor-pointer transform hover:scale-105 hover:rotate-1 transition-all duration-500 hover:shadow-2xl"
                                />
                            </a>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll direction="left">
                        <div>
                            <h3 className="text-2xl font-bold text-foreground mb-6">
                                Ebook "Receitas que Vendem"
                            </h3>

                            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                                O "arsenal secreto" para quem já decidiu empreender. Contém <strong>50 receitas testadas e aprovadas</strong>,
                                com foco em três pilares fundamentais:
                            </p>

                            <div className="space-y-4 mb-8">
                                {[{
                                    title: "Alto Lucro",
                                    desc: "Margem mínima de 60% garantida"
                                }, {
                                    title: "Baixo Custo",
                                    desc: "Ingredientes acessíveis e fáceis de encontrar"
                                }, {
                                    title: "Alta Demanda",
                                    desc: "Produtos que o mercado realmente quer"
                                }].map((pillar, index) => (
                                    <div key={index} className="flex items-center gap-4 p-4 bg-white/60 rounded-xl border border-white/50 hover:bg-white/90 transition-colors shadow-sm">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground">{pillar.title}</h4>
                                            <p className="text-muted-foreground text-sm">{pillar.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="text-lg text-foreground font-medium p-4 bg-primary/5 rounded-lg border border-primary/10">
                                A ferramenta perfeita para <span className="text-primary font-bold">acelerar os lucros iniciais</span> do seu negócio!
                            </p>
                        </div>
                    </RevealOnScroll>
                </div>
            </div>
        </section>
    );
};

export default UpsellSection;
