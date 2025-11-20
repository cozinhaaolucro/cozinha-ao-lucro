import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RevealOnScroll } from '@/components/RevealOnScroll';

const FAQSection = () => {
    const faqs = [
        {
            question: "Para quem é este ebook?",
            answer: "Este ebook é perfeito para mulheres que têm talento culinário e querem transformar essa habilidade em uma fonte de renda. Não importa se você é iniciante em negócios - o conteúdo é explicado de forma simples e prática."
        }, {
            question: "Como vou receber o acesso?",
            answer: "Após a confirmação do pagamento, você receberá um email com o link para download dos ebooks e todos os bônus. O acesso é imediato e vitalício."
        }, {
            question: "Preciso ter muito dinheiro para começar?",
            answer: "Não! Uma das grandes vantagens do negócio culinário caseiro é que você pode começar com pouco investimento. O ebook ensina como iniciar com o que você já tem em casa."
        }, {
            question: "E se eu não souber vender?",
            answer: "O ebook inclui um módulo completo sobre vendas e marketing simples, além de scripts prontos que você pode usar. Você aprenderá técnicas fáceis para atrair e conquistar clientes."
        }, {
            question: "A compra é segura?",
            answer: "Sim! Utilizamos plataformas de pagamento seguras e criptografadas. Além disso, oferecemos garantia incondicional de 7 dias. Se não ficar satisfeita, devolvemos 100% do seu dinheiro."
        }, {
            question: "Quanto tempo leva para ver resultados?",
            answer: "Muitas alunas começam a ter suas primeiras vendas já na primeira semana após aplicar as estratégias do ebook. Os resultados dependem da sua dedicação e aplicação do método."
        }
    ];

    return (
        <section id="faq" className="section-padding bg-muted/20 scroll-mt-20">
            <div className="container-max">
                <RevealOnScroll>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                            Dúvidas Frequentes
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            Tire suas dúvidas antes de começar sua jornada empreendedora
                        </p>
                    </div>
                </RevealOnScroll>

                <div className="max-w-3xl mx-auto">
                    <Accordion type="single" collapsible className="space-y-4">
                        {faqs.map((faq, index) => (
                            <RevealOnScroll key={index} delay={index * 0.05}>
                                <AccordionItem value={`item-${index}`} className="bg-white/80 backdrop-blur-sm shadow-sm rounded-lg px-6 border border-border/50">
                                    <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary hover:no-underline py-6 text-lg">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground leading-relaxed pb-6 text-base">
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
