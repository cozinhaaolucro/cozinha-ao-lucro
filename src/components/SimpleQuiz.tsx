import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChefHat, Clock, DollarSign, ArrowRight } from 'lucide-react';
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
        question: "Você já vendeu algo antes?",
        options: [
            { label: "Nunca, morro de vergonha", type: "express" },
            { label: "Já vendi para amigos/família", type: "balanced" },
            { label: "Sim, já tive um pequeno negócio", type: "pro" }
        ]
    }
];

const RESULTS = {
    express: {
        title: "Nível: Iniciante Promissora 🌱",
        description: "Você tem o perfil ideal para começar com receitas rápidas e de baixo custo. O método vai te ensinar a perder a vergonha e vender sem ser chata.",
        icon: Clock
    },
    balanced: {
        title: "Nível: Empreendedora em Potencial 🚀",
        description: "Você já tem uma base boa! O curso vai te dar a estrutura profissional para transformar esse hobby em uma fonte de renda consistente.",
        icon: DollarSign
    },
    pro: {
        title: "Nível: Pronta para Escalar 👑",
        description: "Você já tem a faca e o queijo na mão. O método vai te dar as estratégias de precificação e marketing para multiplicar seus lucros.",
        icon: ChefHat
    }
};

interface SimpleQuizProps {
    onComplete: (result: 'express' | 'balanced' | 'pro') => void;
}

const SimpleQuiz = ({ onComplete }: SimpleQuizProps) => {
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
        const finalResult = winner as 'express' | 'balanced' | 'pro';

        setResultType(finalResult);
        setShowResult(true);
        onComplete(finalResult);

        // Trigger confetti
        confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#D4AF37', '#F2D06B', '#ffffff']
        });
    };

    const ResultIcon = RESULTS[resultType].icon;

    return (
        <Card className="w-full h-full glass-panel border-primary/20 overflow-hidden shadow-2xl relative flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>

            <CardHeader className="text-center pb-2 pt-6 relative z-10">
                <CardTitle className="text-lg md:text-xl font-bold text-foreground flex items-center justify-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-full">
                        <Clock className="text-primary w-5 h-5" />
                    </div>
                    Quiz Rápido: Viabilidade
                </CardTitle>
            </CardHeader>

            <CardContent className="p-6 flex-1 flex flex-col justify-center relative z-10">
                <AnimatePresence mode="wait">
                    {!showResult ? (
                        <motion.div
                            key={currentQuestion}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            <h3 className="text-base font-medium text-center mb-4 text-foreground/90 min-h-[3rem] flex items-center justify-center">
                                {QUESTIONS[currentQuestion].question}
                            </h3>
                            <div className="grid gap-2">
                                {QUESTIONS[currentQuestion].options.map((option, idx) => (
                                    <motion.button
                                        key={idx}
                                        whileHover={{ scale: 1.01, backgroundColor: "rgba(var(--primary), 0.05)" }}
                                        whileTap={{ scale: 0.99 }}
                                        className="w-full py-3 px-4 text-left flex items-center gap-3 rounded-lg border border-border/50 bg-white/40 hover:border-primary/50 transition-all group"
                                        onClick={() => handleAnswer(option.type)}
                                    >
                                        <div className="w-4 h-4 rounded-full border border-muted-foreground/30 flex items-center justify-center group-hover:border-primary transition-colors">
                                            <div className="w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <span className="text-sm text-foreground font-medium">{option.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                            <div className="flex justify-center gap-1.5 mt-4">
                                {QUESTIONS.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1 rounded-full transition-all duration-500 ${idx <= currentQuestion ? 'w-6 bg-primary' : 'w-1.5 bg-muted/50'}`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", duration: 0.6 }}
                            className="text-center space-y-4"
                        >
                            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                                <ResultIcon className="w-8 h-8 text-primary" />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-foreground mb-1">
                                    {RESULTS[resultType].title}
                                </h3>
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed bg-white/50 p-3 rounded-lg border border-white/50">
                                {RESULTS[resultType].description}
                            </p>

                            <div className="bg-green-50/80 border border-green-200/50 rounded-lg p-2 mt-2">
                                <p className="text-xs font-bold text-green-800 flex items-center justify-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Compatível com você!
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
};

export default SimpleQuiz;
