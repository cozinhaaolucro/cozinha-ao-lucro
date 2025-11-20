import { CheckCircle } from 'lucide-react';
import { RevealOnScroll } from '@/components/RevealOnScroll';

const SolutionSection = () => {
    const modules = [
        {
            title: "Avaliação de Habilidades",
            desc: "Identifique suas especialidades culinárias e preferências de público"
        }, {
            title: "Análise de Mercado",
            desc: "Estude demanda local e concorrência para escolher seu nicho"
        }, {
            title: "Precificação Estratégica",
            desc: "Aprenda métodos para definir preços que cubram custos e gerem margem justa de lucro."
        }, {
            title: "Marketing Sem Gastar Muito",
            desc: "Estratégias simples para atrair clientes sem investir em anúncios"
        }, {
            title: "Organização e Rotina",
            desc: "Como estruturar seu negócio sem bagunçar a dinâmica da casa"
        }, {
            title: "Legalização Simplificada",
            desc: "Passo a passo para formalizar seu negócio de forma simples"
        }
    ];

    return (
        <section className="section-padding bg-gradient-to-b from-background to-muted/30">
            <div className="container-max">
                <RevealOnScroll>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
                            O Que Você Vai Receber
                            <span className="block text-lg md:text-xl font-normal text-primary mt-2">
                                Tudo o que você precisa para começar a lucrar em 7 dias
                            </span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                            O ebook "Cozinha ao Lucro" não é só um livro de receitas. É um <strong>mapa completo</strong> para transformar sua paixão em um negócio de verdade.
                        </p>
                    </div>
                </RevealOnScroll>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <RevealOnScroll direction="right">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full transform group-hover:scale-105 transition-transform duration-500"></div>
                            <a href="https://pay.kiwify.com.br/TV099tr" target="_blank" rel="noopener noreferrer" className="relative block">
                                <img
                                    src="/images/ebook_da_cozinha_ao_lucro_20251117_062259.png"
                                    alt="Capa do Ebook Cozinha ao Lucro em 3D"
                                    className="w-full max-w-md mx-auto shadow-elegant rounded-lg h-[400px] object-cover cursor-pointer transform hover:scale-105 hover:-rotate-2 transition-all duration-500 hover:shadow-2xl"
                                />
                            </a>
                        </div>
                    </RevealOnScroll>

                    <div className="space-y-6">
                        <RevealOnScroll direction="left" delay={0.2}>
                            <h3 className="text-2xl font-bold text-foreground mb-6">O que você vai aprender:</h3>
                            <div className="space-y-4">
                                {modules.map((module, index) => (
                                    <div key={index} className="flex items-start gap-4 p-4 bg-white/60 rounded-lg border border-white/40 hover:bg-white/80 transition-colors">
                                        <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-semibold text-foreground mb-1">{module.title}</h4>
                                            <p className="text-muted-foreground text-sm">{module.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </RevealOnScroll>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SolutionSection;
