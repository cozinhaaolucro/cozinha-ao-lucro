import { Badge } from '@/components/ui/badge';
import PersonalityQuiz from '@/components/PersonalityQuiz';
import { RevealOnScroll } from '@/components/RevealOnScroll';

const QuizSection = () => {
    return (
        <section className="section-padding bg-background relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full"></div>

            <div className="container-max relative z-10">
                <RevealOnScroll>
                    <div className="text-center mb-12">
                        <Badge className="bg-primary/10 text-yellow-900 mb-4 hover:bg-primary/20 border-primary/20 px-4 py-1 text-sm font-bold">
                            DESCUBRA SEU POTENCIAL
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                            Este método é para você?
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Faça o teste rápido e descubra qual perfil de confeiteira lucrativa você tem.
                        </p>
                    </div>
                </RevealOnScroll>

                <RevealOnScroll delay={0.2}>
                    <PersonalityQuiz />
                </RevealOnScroll>
            </div>
        </section>
    );
};

export default QuizSection;
