import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import {
    Sparkles,
    ArrowRight,
    CheckCircle,
    ChefHat,
    Clock,
    Target,
    TrendingUp,
    ShieldCheck,
    Utensils,
    Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// --- Quiz Data ---
const QUESTIONS = [
    {
        id: 1,
        question: "Qual sua experiência atual na cozinha?",
        icon: ChefHat,
        options: [
            { id: 'beginner', label: "Zero. Queimo até água.", points: { express: 2, balanced: 0, pro: 0 } },
            { id: 'intermediate', label: "Me viro bem, faço o básico.", points: { express: 1, balanced: 2, pro: 0 } },
            { id: 'advanced', label: "Amo cozinhar e testar receitas.", points: { express: 0, balanced: 1, pro: 2 } }
        ]
    },
    {
        id: 2,
        question: "Quanto tempo você pode dedicar por dia?",
        icon: Clock,
        options: [
            { id: 'little', label: "Menos de 2 horas (Renda Extra)", points: { express: 2, balanced: 0, pro: 0 } },
            { id: 'medium', label: "De 2 a 4 horas (Meio Período)", points: { express: 0, balanced: 2, pro: 0 } },
            { id: 'all_day', label: "O dia todo (Quero viver disso)", points: { express: 0, balanced: 0, pro: 2 } }
        ]
    },
    {
        id: 3,
        question: "Qual sua principal barreira hoje?",
        icon: ShieldCheck,
        options: [
            { id: 'sales', label: "Vergonha ou não sei vender", points: { express: 1, balanced: 1, pro: 0 } },
            { id: 'money', label: "Medo de perder dinheiro", points: { express: 2, balanced: 0, pro: 0 } },
            { id: 'technique', label: "Medo de errar as receitas", points: { express: 0, balanced: 1, pro: 1 } }
        ]
    },
    {
        id: 4,
        question: "Quanto você quer faturar em 3 meses?",
        icon: Target,
        options: [
            { id: 'extra', label: "R$ 1.000 a R$ 2.000 complementares", points: { express: 2, balanced: 1, pro: 0 } },
            { id: 'salary', label: "R$ 3.000 a R$ 5.000 (Viver disto)", points: { express: 0, balanced: 2, pro: 1 } },
            { id: 'empire', label: "Acima de R$ 5.000 (Escalar negócio)", points: { express: 0, balanced: 0, pro: 2 } }
        ]
    },
    {
        id: 5,
        question: "O que você já tem de equipamento?",
        icon: Utensils,
        options: [
            { id: 'basic', label: "Apenas o fogão e geladeira de casa", points: { express: 2, balanced: 1, pro: 0 } },
            { id: 'some', label: "Tenho batedeira e alguns utensílios", points: { express: 0, balanced: 2, pro: 0 } },
            { id: 'pro', label: "Cozinha semi-equipada ou completa", points: { express: 0, balanced: 0, pro: 2 } }
        ]
    }
];

const ARCHETYPES = {
    express: {
        title: "Confeiteira Express",
        badge: "Renda Rápida",
        color: "text-amber-600 bg-amber-50 border-amber-200",
        description: "Seu perfil é ideal para produtos de alta saída e produção rápida. Você não precisa de equipamentos caros, apenas do método certo para vender sem vergonha.",
        plan: [
            "Focar em Brownies e Cookies (Lucro Rápido)",
            "Usar o Script de Vendas p/ Tímidos",
            "Meta: R$ 1.500 no primeiro mês"
        ]
    },
    balanced: {
        title: "Empreendedora Águia",
        badge: "Crescimento Sólido",
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        description: "Você tem a visão perfeita para construir um negócio duradouro. Com poucas horas, você pode montar um cardápio inteligente que vende todos os dias.",
        plan: [
            "Cardápio Semanal de Marmitas/Bolos",
            "Fidelização via WhatsApp Automático",
            "Meta: R$ 3.500 recorrentes"
        ]
    },
    pro: {
        title: "Visionária Master",
        badge: "Alta Escala",
        color: "text-purple-600 bg-purple-50 border-purple-200",
        description: "Você está pronta para jogar o jogo grande. Seu foco deve ser gestão, precificação profissional e escala. O céu é o limite para sua produção.",
        plan: [
            "Linha Premium & Eventos",
            "Precificação Técnica (Ficha Técnica)",
            "Meta: R$ 7.000+ e contratação de ajudante"
        ]
    }
};

const QuizSection = () => {
    const [step, setStep] = useState(0); // 0 = Intro, 1-5 = Questions, 6 = Analyzing, 7 = Result
    const [answers, setAnswers] = useState<Record<string, number>>({ express: 0, balanced: 0, pro: 0 });
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [result, setResult] = useState<keyof typeof ARCHETYPES>('express');

    const handleStart = () => setStep(1);

    const handleAnswer = (points: Record<string, number>) => {
        setAnswers(prev => ({
            express: prev.express + points.express,
            balanced: prev.balanced + points.balanced,
            pro: prev.pro + points.pro
        }));

        if (step < QUESTIONS.length) {
            setStep(s => s + 1);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = () => {
        setStep(6);
        // Determine winner
        const winner = Object.keys(answers).reduce((a, b) => answers[a as keyof typeof answers] > answers[b as keyof typeof answers] ? a : b) as keyof typeof ARCHETYPES;
        setResult(winner);

        // Fake analysis loading
        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            setLoadingProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setStep(7);
                triggerConfetti();
            }
        }, 50);
    };

    const triggerConfetti = () => {
        const colors = result === 'express' ? ['#d97706', '#fbbf24'] : result === 'balanced' ? ['#059669', '#34d399'] : ['#7c3aed', '#a78bfa'];
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: [...colors, '#ffffff']
        });
    };

    const scrollToPricing = () => {
        document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="section-padding bg-background relative overflow-hidden section-separator-top" id="quiz-section">
            <div className="absolute inset-0 bg-noise opacity-[0.15] pointer-events-none"></div>
            {/* Ambient Backgrounds based on state */}
            <div className={`absolute top-0 right-0 w-3/4 h-3/4 bg-primary/5 blur-[120px] rounded-full mix-blend-multiply transition-colors duration-1000 ${step === 7 ? 'bg-green-100/20' : ''}`}></div>
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-secondary/5 blur-[120px] rounded-full mix-blend-multiply"></div>

            <div className="container-max relative z-10">
                <div className="max-w-3xl mx-auto">

                    {/* Header (Only show before Result) */}
                    {step < 7 && (
                        <RevealOnScroll>
                            <div className="text-center mb-10">
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-4 border border-primary/20">
                                    <Sparkles className="w-3 h-3" />
                                    Análise de Perfil Gratuita
                                </span>
                                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground font-heading">
                                    Descubra seu <span className="text-primary">Potencial Lucrativo</span>
                                </h2>
                                <p className="text-muted-foreground font-light text-lg">
                                    {step === 0
                                        ? "Responda 5 perguntas rápidas e receba um plano personalizado para começar."
                                        : step === 6
                                            ? "Nossa inteligência está desenhando seu plano..."
                                            : `Pergunta ${step} de ${QUESTIONS.length}`
                                    }
                                </p>
                            </div>
                        </RevealOnScroll>
                    )}

                    {/* Quiz Container */}
                    <div className="relative min-h-[400px]">
                        <AnimatePresence mode="wait">

                            {/* STEP 0: INTRO */}
                            {step === 0 && (
                                <motion.div
                                    key="intro"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="text-center"
                                >
                                    <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-xl overflow-hidden group hover:border-primary/30 transition-all duration-500">
                                        <CardContent className="p-8 md:p-12">
                                            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
                                                <Rocket className="w-10 h-10 text-primary" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
                                                {[
                                                    { icon: CheckCircle, text: "Diagnóstico Personalizado" },
                                                    { icon: TrendingUp, text: "Estimativa de Ganhos" },
                                                    { icon: Target, text: "Plano de Ação Prático" }
                                                ].map((feat, i) => (
                                                    <div key={i} className="flex items-center gap-3 bg-background/50 p-4 rounded-xl border border-border/50">
                                                        <feat.icon className="w-5 h-5 text-secondary" />
                                                        <span className="text-sm font-medium text-foreground">{feat.text}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button
                                                onClick={handleStart}
                                                className="btn-primary w-full md:w-auto px-10 py-6 text-lg rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all"
                                            >
                                                Começar Análise Agora
                                                <ArrowRight className="ml-2 w-5 h-5" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {/* STEPS 1-5: QUESTIONS */}
                            {step >= 1 && step <= 5 && (
                                <motion.div
                                    key={`q-${step}`}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="mb-6">
                                        <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-primary"
                                                initial={{ width: `${((step - 1) / QUESTIONS.length) * 100}%` }}
                                                animate={{ width: `${(step / QUESTIONS.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4">
                                        {QUESTIONS[step - 1].options.map((option, idx) => (
                                            <motion.button
                                                key={idx}
                                                whileHover={{ scale: 1.01, backgroundColor: 'rgba(var(--primary), 0.03)' }}
                                                whileTap={{ scale: 0.99 }}
                                                onClick={() => handleAnswer(option.points)}
                                                className="w-full text-left p-5 rounded-2xl border border-border bg-card/80 hover:border-primary/40 hover:shadow-md transition-all group flex items-center gap-4"
                                            >
                                                <div className="w-8 h-8 rounded-full border-2 border-muted flex items-center justify-center group-hover:border-primary transition-colors shrink-0">
                                                    <div className="w-3 h-3 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <span className="text-lg font-medium text-foreground">{option.label}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 6: LOADING */}
                            {step === 6 && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center py-12"
                                >
                                    <div className="relative w-24 h-24 mx-auto mb-8">
                                        <div className="absolute inset-0 border-4 border-muted/30 rounded-full"></div>
                                        <motion.div
                                            className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent"
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-primary">
                                            {loadingProgress}%
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Processando suas respostas...</h3>
                                    <p className="text-muted-foreground">Cruzando dados com estratégias de alta conversão.</p>

                                    <div className="max-w-md mx-auto mt-8 space-y-2 text-sm text-left opacity-70">
                                        <div className="flex items-center gap-2">
                                            {loadingProgress > 20 && <CheckCircle className="w-4 h-4 text-green-500" />}
                                            <span className={loadingProgress > 20 ? "text-foreground" : "text-muted"}>Analisando perfil de experiência...</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {loadingProgress > 50 && <CheckCircle className="w-4 h-4 text-green-500" />}
                                            <span className={loadingProgress > 50 ? "text-foreground" : "text-muted"}>Calculando potencial de lucro...</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {loadingProgress > 80 && <CheckCircle className="w-4 h-4 text-green-500" />}
                                            <span className={loadingProgress > 80 ? "text-foreground" : "text-muted"}>Gerando mapa estratégico...</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 7: RESULT */}
                            {step === 7 && (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative"
                                >
                                    <Card className="overflow-hidden border-2 border-primary/20 shadow-2xl bg-white/80 backdrop-blur-md">
                                        {/* Header Banner */}
                                        <div className={`p-6 text-center border-b ${ARCHETYPES[result].color.replace('text-', 'border-').split(' ')[2]} bg-opacity-30`}>
                                            <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${ARCHETYPES[result].color}`}>
                                                {ARCHETYPES[result].badge}
                                            </span>
                                            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                                                {ARCHETYPES[result].title}
                                            </h3>
                                            <p className="text-muted-foreground">
                                                Seu perfil foi analisado com sucesso
                                            </p>
                                        </div>

                                        <CardContent className="p-6 md:p-8">
                                            <div className="mb-8">
                                                <p className="text-lg text-foreground/80 leading-relaxed text-center font-medium">
                                                    "{ARCHETYPES[result].description}"
                                                </p>
                                            </div>

                                            <div className="bg-secondary/5 rounded-2xl p-6 border border-secondary/20 mb-8">
                                                <h4 className="flex items-center gap-2 font-bold text-secondary mb-4 uppercase text-sm tracking-wide">
                                                    <Target className="w-5 h-5" />
                                                    Seu Plano de Ação:
                                                </h4>
                                                <ul className="space-y-4">
                                                    {ARCHETYPES[result].plan.map((item, i) => (
                                                        <li key={i} className="flex items-start gap-4 p-3 bg-white rounded-xl shadow-sm border border-border/50">
                                                            <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 text-secondary font-bold text-sm">
                                                                {i + 1}
                                                            </div>
                                                            <span className="text-foreground font-medium">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="text-center">
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    Para executar esse plano, você precisa do <strong>Método Cozinha ao Lucro</strong>.
                                                </p>
                                                <Button
                                                    onClick={scrollToPricing}
                                                    className="btn-primary w-full py-7 text-xl rounded-xl shadow-xl shadow-primary/30 animate-pulse hover:animate-none hover:scale-[1.02] transition-transform"
                                                >
                                                    ACESSAR MEU PLANO AGORA
                                                    <ArrowRight className="ml-2 w-6 h-6" />
                                                </Button>
                                                <p className="text-xs text-muted-foreground mt-4 opacity-70">
                                                    Oferta exclusiva desbloqueada para seu perfil.
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default QuizSection;
