import { useEffect, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const FloatingFAQ = () => {
    const [open, setOpen] = useState(false);

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
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    size="lg"
                    className={`fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 p-0 bg-white border-2 border-primary/20 hover:border-primary text-primary hover:bg-white`}
                    aria-label="Dúvidas Frequentes"
                >
                    <HelpCircle className="h-8 w-8" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[350px] md:w-[450px] p-0 mr-6 mb-2 bg-white border-primary/20 shadow-2xl rounded-xl overflow-hidden"
                side="top"
                align="end"
            >
                <div className="bg-primary/5 p-4 border-b border-primary/10 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-lg text-primary">Dúvidas Frequentes</h3>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                    <Accordion type="single" collapsible className="space-y-2" defaultValue="item-0">
                        {faqs.map((faq, index) => (
                            <AccordionItem
                                key={index}
                                value={`item-${index}`}
                                className="group bg-transparent border-b border-primary/10 last:border-0 px-1"
                            >
                                <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-primary hover:no-underline py-3 text-sm [&>svg]:text-primary/40 group-hover:[&>svg]:text-primary transition-colors">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-500 leading-relaxed pb-3 text-sm">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default FloatingFAQ;
