import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChefHat, Clock, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    };

    const ResultIcon = RESULTS[resultType].icon;

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-elegant border-primary/20 overflow-hidden bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl md:text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                    <ChefHat className="text-primary" />
                    Descubra seu Perfil Lucrativo
                </CardTitle>
            </CardHeader>

            <CardContent className="p-6 min-h-[300px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    {!showResult ? (
                        <motion.div
                            key={currentQuestion}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h3 className="text-lg md:text-xl font-medium text-center mb-6">
                                {QUESTIONS[currentQuestion].question}
                            </h3>
                            <div className="grid gap-3">
                                {QUESTIONS[currentQuestion].options.map((option, idx) => (
                                    <Button
                                        key={idx}
                                        variant="outline"
                                        className="w-full py-6 text-left justify-start hover:border-primary hover:bg-primary/5 transition-all text-base"
                                        onClick={() => handleAnswer(option.type)}
                                    >
                                        <div className="w-6 h-6 rounded-full border-2 border-muted-foreground mr-3 flex items-center justify-center group-hover:border-primary">
                                            <div className="w-3 h-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        {option.label}
                                    </Button>
                                ))}
                            </div>
                            <div className="flex justify-center gap-1 mt-4">
                                {QUESTIONS.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx <= currentQuestion ? 'w-8 bg-primary' : 'w-2 bg-muted'}`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-6"
                        >
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ResultIcon className="w-10 h-10 text-primary" />
                            </div>

                            <h3 className="text-2xl font-bold text-primary">
                                {RESULTS[resultType].title}
                            </h3>

                            <p className="text-lg text-muted-foreground">
                                {RESULTS[resultType].description}
                            </p>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                                <p className="font-bold text-green-800 flex items-center justify-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    O Método Cozinha ao Lucro é 100% compatível com você!
                                </p>
                            </div>

                            <Button
                                onClick={() => window.open('https://pay.kiwify.com.br/TV099tr', '_blank')}
                                className="w-full bg-primary hover:bg-primary-glow text-white font-bold py-6 text-lg shadow-lg animate-pulse"
                            >
                                QUERO COMEÇAR AGORA
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
};

export default PersonalityQuiz;
