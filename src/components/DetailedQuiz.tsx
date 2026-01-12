import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Target, ShieldAlert, ChefHat, ArrowRight, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const QUESTIONS = [
    {
        id: 1,
        question: "Qual seu maior medo hoje?",
        options: [
            { label: "Não saber vender / Vergonha", type: "sales_fear" },
            { label: "Cozinhar errado / Desperdiçar", type: "cooking_fear" },
            { label: "Não ter lucro / Falir", type: "money_fear" }
        ]
    },
    {
        id: 2,
        question: "Quais equipamentos você já tem?",
        options: [
            { label: "Apenas o básico (Fogão/Geladeira)", type: "basic_gear" },
            { label: "Tenho batedeira/liquidificador simples", type: "mid_gear" },
            { label: "Cozinha completa / Semi-profissional", type: "pro_gear" }
        ]
    },
    {
        id: 3,
        question: "Quanto você precisa lucrar para mudar de vida?",
        options: [
            { label: "R$ 1.000 a R$ 2.000 (Ajuda nas contas)", type: "low_goal" },
            { label: "R$ 3.000 a R$ 5.000 (Salário digno)", type: "mid_goal" },
            { label: "Acima de R$ 5.000 (Independência)", type: "high_goal" }
        ]
    },
    {
        id: 4,
        question: "Você tem apoio da família?",
        options: [
            { label: "Não, acham que é 'bico'", type: "no_support" },
            { label: "Mais ou menos, se der certo apoiam", type: "neutral_support" },
            { label: "Sim, vão me ajudar!", type: "full_support" }
        ]
    }
];

interface DetailedQuizProps {
    onComplete: (result: string[]) => void;
}

const DetailedQuiz = ({ onComplete }: DetailedQuizProps) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [showResult, setShowResult] = useState(false);

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
        // Logic to determine the "Treasure Map" based on answers
        // For simplicity, we'll generate a generic map but customized text could be added here
        setShowResult(true);
        onComplete(finalAnswers);

        // Trigger confetti
        confetti({
            particleCount: 120,
            spread: 100,
            origin: { y: 0.7 },
            colors: ['#4ade80', '#22c55e', '#ffffff']
        });
    };

    return (
        <Card className="w-full h-full bg-card border-secondary/20 overflow-hidden shadow-elegant relative flex flex-col">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl"></div>

            <CardHeader className="text-center pb-2 pt-6 relative z-10">
                <CardTitle className="text-lg md:text-xl font-bold text-primary flex items-center justify-center gap-2 font-heading">
                    <div className="bg-icon/10 p-1.5 rounded-full">
                        <Search className="text-icon w-5 h-5" />
                    </div>
                    Quiz Detalhado: Seu Plano
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
                                        whileHover={{ scale: 1.01, backgroundColor: "rgba(var(--secondary), 0.05)" }}
                                        whileTap={{ scale: 0.99 }}
                                        className="w-full py-3 px-4 text-left flex items-center gap-3 rounded-lg border border-border/50 bg-white hover:border-secondary/50 transition-all group"
                                        onClick={() => handleAnswer(option.type)}
                                    >
                                        <div className="w-4 h-4 rounded-full border border-muted-foreground/30 flex items-center justify-center group-hover:border-secondary transition-colors">
                                            <div className="w-2 h-2 rounded-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <span className="text-sm text-foreground font-medium">{option.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                            <div className="flex justify-center gap-1.5 mt-4">
                                {QUESTIONS.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1 rounded-full transition-all duration-500 ${idx <= currentQuestion ? 'w-6 bg-secondary' : 'w-1.5 bg-muted/50'}`}
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
                            <div className="w-16 h-16 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                                <Target className="w-8 h-8 text-secondary" />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-foreground mb-1">
                                    Seu Mapa do Tesouro 🗺️
                                </h3>
                            </div>

                            <div className="bg-white/50 p-4 rounded-lg border border-white/50 text-left space-y-3 text-sm">
                                <div className="flex items-start gap-2">
                                    <div className="bg-primary/20 p-1 rounded mt-0.5"><Lock className="w-3 h-3 text-primary-700" /></div>
                                    <div>
                                        <p className="font-bold text-foreground">Passo 1: Desbloqueio</p>
                                        <p className="text-muted-foreground text-xs">O módulo de Mindset vai eliminar seu medo de {answers[0] === 'sales_fear' ? 'vender' : 'falhar'}.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="bg-secondary/20 p-1 rounded mt-0.5"><ChefHat className="w-3 h-3 text-secondary-700" /></div>
                                    <div>
                                        <p className="font-bold text-foreground">Passo 2: Produção</p>
                                        <p className="text-muted-foreground text-xs">Com {answers[1] === 'basic_gear' ? 'apenas o básico' : 'seus equipamentos'}, você fará receitas de alta margem.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="bg-yellow-100 p-1 rounded mt-0.5"><Target className="w-3 h-3 text-yellow-700" /></div>
                                    <div>
                                        <p className="font-bold text-foreground">Passo 3: Meta</p>
                                        <p className="text-muted-foreground text-xs">Plano prático para atingir seus {answers[2] === 'low_goal' ? 'R$ 2.000' : 'R$ 5.000+'} mensais.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
};

export default DetailedQuiz;
