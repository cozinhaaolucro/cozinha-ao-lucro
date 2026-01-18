import { useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import { HelpCircle } from 'lucide-react';

const FAQSection = () => {
    const faqs = [
        {
            question: "Como a plataforma ajuda a aumentar meus lucros?",
            answer: "Ao eliminar a precificação baseada em 'achismo', você recupera margens perdidas imediatamente. O sistema identifica custos ocultos em cada receita e sugere o preço exato para garantir lucro real, não apenas faturamento."
        }, {
            question: "Funciona bem no celular?",
            answer: "O sistema foi desenhado para a realidade da cozinha. Você consegue lançar despesas, verificar pedidos e ajustar estoques direto pelo smartphone, com uma interface pensada para toques rápidos e facilidade de uso."
        }, {
            question: "Tenho garantia ou período de teste?",
            answer: "Você tem 7 dias de acesso irrestrito para validar se a ferramenta faz sentido para o seu negócio. Se não se adaptar, o cancelamento é feito com um clique, sem perguntas e sem letras miúdas."
        }, {
            question: "Consigo usar mesmo sem experiência?",
            answer: "Não é necessário nenhum conhecimento prévio em gestão ou tecnologia. O Cozinha ao Lucro guia você passo a passo, transformando tarefas complexas como 'fichas técnicas' em preenchimentos simples de formulário."
        }, {
            question: "Funciona para o meu tipo de negócio?",
            answer: "Seja marmitaria, confeitaria, salgados ou delivery, a lógica de precificação e estoque se adapta à sua produção. O sistema flexível atende desde quem trabalha sozinho em casa até pequenas operações com equipe."
        }
    ];

    useEffect(() => {
        const schema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            }))
        };
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schema);
        document.head.appendChild(script);
        return () => { document.head.removeChild(script); };
    }, []);

    return (
        <section id="faq" className="section-padding bg-background scroll-mt-20 relative overflow-hidden section-separator-top">
            <div className="absolute inset-0 bg-noise opacity-[0.15] pointer-events-none"></div>
            {/* Ambient Orbs */}
            <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="container-max relative z-10">
                <RevealOnScroll>
                    <div className="text-center mb-16">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-4 border border-primary/20">
                            <HelpCircle className="w-3 h-3" />
                            Tire suas Dúvidas
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground font-heading">
                            Perguntas Frequentes
                        </h2>
                        <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
                            Tudo o que você precisa saber para começar sua jornada com segurança.
                        </p>
                    </div>
                </RevealOnScroll>

                <div className="max-w-3xl mx-auto">
                    <Accordion type="single" collapsible className="space-y-4">
                        {faqs.map((faq, index) => (
                            <RevealOnScroll key={index} delay={index * 0.05}>
                                <AccordionItem
                                    value={`item-${index}`}
                                    className="group bg-card/40 backdrop-blur-sm shadow-sm rounded-2xl px-6 border border-white/10 transition-all duration-300 hover:bg-card/60 hover:shadow-lg hover:border-primary/20 data-[state=open]:bg-card/80 data-[state=open]:shadow-md data-[state=open]:border-primary/30"
                                >
                                    <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary hover:no-underline py-6 text-lg font-heading [&>svg]:text-muted-foreground group-hover:[&>svg]:text-primary transition-colors">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground leading-relaxed pb-6 text-base font-light">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            </RevealOnScroll>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
