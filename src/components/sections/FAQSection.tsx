import { useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RevealOnScroll } from '@/components/RevealOnScroll';

const FAQSection = () => {
    const faqs = [
        {
            question: "Como a plataforma ajuda a aumentar meus lucros?",
            answer: "A plataforma elimina o 'achismo' na precificação. Você saberá exatamente o custo de cada receita e a margem de lucro real. Além disso, com a gestão eficiente de pedidos e estoque, você evita desperdícios e fideliza mais clientes."
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
        }, {
            question: "Consigo usar mesmo sem experiência?",
            answer: "Sim! O Cozinha ao Lucro foi criado para ser intuitivo. Você não precisa de formação em administração ou contabilidade. O sistema te guia passo a passo e calcula tudo automaticamente."
        }, {
            question: "Em quanto tempo começo a ver resultado?",
            answer: "A partir do momento em que você cadastra seus produtos e define os custos, já terá clareza sobre suas margens. Muitos usuários relatam identificar produtos com prejuízo logo no primeiro dia de uso."
        }, {
            question: "Funciona para marmitas, doces ou delivery?",
            answer: "Com certeza. A plataforma é flexível e se adapta a qualquer tipo de negócio de comida caseira: brigadeiros, bolos, marmitas fitness, delivery de refeições, salgados para festas, e muito mais."
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
            <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none"></div>
            <div className="container-max">
                <RevealOnScroll>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground font-heading">
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
                                <AccordionItem value={`item-${index}`} className="bg-card/50 backdrop-blur-sm shadow-md rounded-xl px-6 border border-white/10">
                                    <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary hover:no-underline py-6 text-lg font-heading">
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
