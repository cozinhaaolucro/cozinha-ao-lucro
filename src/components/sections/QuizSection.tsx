import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import SimpleQuiz from '@/components/SimpleQuiz';
import DetailedQuiz from '@/components/DetailedQuiz';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QuizSection = () => {
    const [simpleQuizResult, setSimpleQuizResult] = useState<string | null>(null);
    const [detailedQuizResult, setDetailedQuizResult] = useState<string[] | null>(null);

    const allCompleted = simpleQuizResult && detailedQuizResult;

    return (
        <section className="section-padding bg-background relative overflow-hidden section-separator-top">
            <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full mix-blend-multiply"></div>
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-secondary/5 blur-[120px] rounded-full mix-blend-multiply"></div>

            <div className="container-max relative z-10">
                <RevealOnScroll>
                    <div className="text-center mb-12">
                        <Badge className="bg-primary/10 text-yellow-900 mb-4 hover:bg-primary/20 border-primary/20 px-4 py-1 text-sm font-bold relative overflow-hidden effect-shine shine-slow">
                            DESCUBRA SEU POTENCIAL
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                            Esta plataforma é para você?
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Faça os testes abaixo para receber um diagnóstico completo do seu perfil e potencial de lucro.
                        </p>
                    </div>
                </RevealOnScroll>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    <RevealOnScroll delay={0.1} className="h-full">
                        <SimpleQuiz onComplete={(res) => setSimpleQuizResult(res)} />
                    </RevealOnScroll>

                    <RevealOnScroll delay={0.3} className="h-full">
                        <DetailedQuiz onComplete={(res) => setDetailedQuizResult(res)} />
                    </RevealOnScroll>
                </div>

                <AnimatePresence>
                    {allCompleted && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-12 text-center"
                        >
                            <div className="bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 p-8 rounded-2xl border border-primary/30 backdrop-blur-sm max-w-3xl mx-auto shadow-elegant">
                                <div className="flex items-center justify-center gap-3 mb-4">
                                    <Sparkles className="w-6 h-6 text-yellow-600 animate-pulse" />
                                    <h3 className="text-2xl font-bold text-foreground">Diagnóstico Completo Liberado!</h3>
                                    <Sparkles className="w-6 h-6 text-yellow-600 animate-pulse" />
                                </div>
                                <p className="text-lg text-muted-foreground mb-6">
                                    Você tem o <strong>Perfil {simpleQuizResult === 'pro' ? 'Visionário' : simpleQuizResult === 'balanced' ? 'Empreendedor' : 'Iniciante'}</strong> com um plano claro para atingir sua meta. A plataforma Cozinha ao Lucro foi desenhada exatamente para pessoas como você.
                                </p>
                                <Button
                                    onClick={() => window.location.href = '/auth'}
                                    className="btn-primary px-8 py-6 text-lg shadow-xl hover:scale-105 transition-transform"
                                >
                                    <span className="md:hidden">Criar Conta Grátis</span>
                                    <span className="hidden md:inline">CRIAR MINHA CONTA GRÁTIS</span>
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

export default QuizSection;
