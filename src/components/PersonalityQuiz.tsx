import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChefHat, Clock, DollarSign, ArrowRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const QUESTIONS = [
    {
        id: 1,
        question: "Quanto tempo você tem disponível por dia?",
        options: [
            { label: "Menos de 2 horas (Renda Extra)", type: "express" },
            { label: "4 a 6 horas (Meio Período)", type: "balanced" },
            { label: "O dia todo (Quero viver disso)", type: "pro" }
        ]
    },
    {
        id: 2,
        question: "Qual sua experiência na cozinha?",
        options: [
            { label: "Zero, queimo até água", type: "express" },
            { label: "Faço o básico para família", type: "balanced" },
            { label: "Amo cozinhar e testar receitas", type: "pro" }
        ]
    },
    {
        id: 3,
        question: "Qual seu objetivo financeiro inicial?",
        options: [
            { label: "Pagar uma conta ou outra (R$ 500+)", type: "express" },
            { label: "Um salário mínimo extra (R$ 1.500+)", type: "balanced" },
            { label: "Independência total (R$ 5.000+)", type: "pro" }
        ]
    }
];

const RESULTS = {
    express: {
        title: "Perfil: Confeiteira Express 🚀",
        description: "Você precisa de receitas rápidas, práticas e de alta margem. O ebook é perfeito pois ensina a fazer Brigadeiros e Brownies em menos de 40 min!",
        icon: Clock
    },
    balanced: {
        title: "Perfil: Empreendedora Equilibrada ⚖️",
        description: "Você tem potencial para crescer rápido. O método de Marmitas Fitness e Bolos de Pote vai se encaixar perfeitamente na sua rotina.",
        icon: DollarSign
    },
    pro: {
        title: "Perfil: Chef Visionária 👩‍🍳",
        description: "Você vai dominar o mercado! Com as técnicas avançadas e a planilha de precificação, você vai construir um império.",
        icon: ChefHat
    }
};

const PersonalityQuiz = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [resultType, setResultType] = useState<'express' | 'balanced' | 'pro'>('express');

    const handleAnswer = (type: string) => {
        const newAnswers = [...answers, type];
        setAnswers(newAnswers);

        if (currentQuestion < QUESTIONS.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            calculateResult(newAnswers);
        }
    };

    const calculateResult = (finalAnswers: string[]) => {
        const counts = finalAnswers.reduce((acc, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const winner = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        setResultType(winner as any);
        setShowResult(true);

        // Trigger confetti
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    };

    const ResultIcon = RESULTS[resultType].icon;

    return (
        <Card className="w-full max-w-2xl mx-auto glass-panel border-primary/20 overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl"></div>

            <CardHeader className="text-center pb-2 pt-8 relative z-10">
                <CardTitle className="text-xl md:text-2xl font-bold text-foreground flex items-center justify-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <ChefHat className="text-primary w-6 h-6" />
                    </div>
                    Descubra seu Perfil Lucrativo
                </CardTitle>
            </CardHeader>

            <CardContent className="p-6 min-h-[300px] flex flex-col justify-center relative z-10">
                <AnimatePresence mode="wait">
                    {!showResult ? (
                        <motion.div
                            key={currentQuestion}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <h3 className="text-lg md:text-xl font-medium text-center mb-6 text-foreground/90">
                                {QUESTIONS[currentQuestion].question}
                            </h3>
                            <div className="grid gap-3">
                                {QUESTIONS[currentQuestion].options.map((option, idx) => (
                                    <motion.button
                                        key={idx}
                                        whileHover={{ scale: 1.02, backgroundColor: "rgba(var(--primary), 0.05)" }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full py-4 px-6 text-left flex items-center gap-4 rounded-xl border border-border/50 bg-white/40 hover:border-primary/50 hover:shadow-md transition-all group"
                                        onClick={() => handleAnswer(option.type)}
                                    >
                                        <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center group-hover:border-primary transition-colors">
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <span className="text-foreground font-medium">{option.label}</span>
                                        <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 text-primary transition-opacity transform translate-x-[-10px] group-hover:translate-x-0" />
                                    </motion.button>
                                ))}
                            </div>
                            <div className="flex justify-center gap-2 mt-6">
                                {QUESTIONS.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all duration-500 ${idx <= currentQuestion ? 'w-8 bg-primary' : 'w-2 bg-muted/50'}`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", duration: 0.6 }}
                            className="text-center space-y-6"
                        >
                            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner animate-float">
                                <ResultIcon className="w-12 h-12 text-primary" />
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-foreground mb-2">
                                    {RESULTS[resultType].title}
                                </h3>
                                <div className="flex justify-center gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    ))}
                                </div>
                            </div>

                            <p className="text-lg text-muted-foreground leading-relaxed bg-white/50 p-4 rounded-lg border border-white/50">
                                {RESULTS[resultType].description}
                            </p>

                            <div className="bg-green-50/80 border border-green-200/50 rounded-xl p-4 mt-4 backdrop-blur-sm">
                                <p className="font-bold text-green-800 flex items-center justify-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    O Método Cozinha ao Lucro é 100% compatível com você!
                                </p>
                            </div>

                            <Button
                                onClick={() => window.open('https://pay.kiwify.com.br/TV099tr', '_blank')}
                                className="w-full btn-primary py-6 text-lg shadow-lg hover:shadow-primary/50 group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    QUERO COMEÇAR AGORA
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
};

export default PersonalityQuiz;
