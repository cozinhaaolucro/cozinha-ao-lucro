import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RevealOnScroll } from '@/components/RevealOnScroll';

const FAQSection = () => {
    const faqs = [
        {
            question: "Como a plataforma ajuda a aumentar meus lucros?",
            answer: "A plataforma o ajuda a eliminar o 'achismo' na precificação. Você saberá exatamente o custo de cada receita e a margem de lucro real. Além disso, com a gestão eficiente de pedidos e estoque, você evita desperdícios e fideliza mais clientes."
        }, {
            question: "Preciso instalar algum programa no computador?",
            answer: "Não! O Cozinha ao Lucro é 100% online. Você pode acessar de qualquer lugar (computador, tablet ou celular) sem precisar baixar nada. Seus dados ficam salvos na nuvem com total segurança."
        }, {
            question: "Funciona bem no celular?",
            answer: "Sim! Desenvolvemos a interface pensando no seu dia a dia na cozinha. O sistema é totalmente responsivo e funciona perfeitamente no seu smartphone, permitindo que você controle seu negócio na palma da mão."
        }, {
            question: "Tenho garantia ou período de teste?",
            answer: "Com certeza. Oferecemos 7 dias totalmente grátis para você testar todas as funcionalidades da plataforma. Se não se adaptar, você pode cancelar a qualquer momento sem custo algum."
        }, {
            question: "Meus dados estão seguros?",
            answer: "Absolutamente. Utilizamos criptografia de ponta (a mesma usada por bancos) para proteger suas receitas, lista de clientes e dados financeiros. Sua privacidade é nossa prioridade."
        }, {
            question: "Serve para quem está começando agora?",
            answer: "Perfeito para iniciantes! A plataforma foi criada para simplificar a gestão, não complicar. Temos tutoriais passo a passo e você não precisa de conhecimentos avançados em administração para começar a usar."
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
                                <AccordionItem value={`item-${index}`} className="bg-card/60 backdrop-blur-sm shadow-sm rounded-lg px-6 border border-border/50">
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
