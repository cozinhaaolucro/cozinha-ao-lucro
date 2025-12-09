import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Star } from 'lucide-react';
import ProfitCalculator from '@/components/ProfitCalculator';

const HeroSection = () => {
    return (
        <section className="relative min-h-screen flex items-start justify-center overflow-hidden pt-32 md:pt-40 pb-16">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/10 z-0"></div>
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-secondary/5 blur-[120px] rounded-full"></div>

            <div className="container-max relative z-10 px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column: Copy */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-center lg:text-left"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="inline-block mb-6 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary-foreground font-medium text-sm"
                        >
                            <span className="text-primary-foreground dark:text-primary-foreground text-yellow-900 font-bold flex items-center gap-2">
                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                Plataforma #1 para Confeitaria Caseira
                            </span>
                        </motion.div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-foreground">
                            Gerencie sua Cozinha e
                            <span className="block text-gradient-gold mt-2">
                                Multiplique seus Lucros
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl mb-8 text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                            A plataforma completa para quem vende comida em casa. <strong>Precifique corretamente, controle pedidos e estoque</strong> em um só lugar.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                            <Button
                                onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}
                                className="btn-primary text-lg px-8 py-6 h-auto w-full sm:w-auto group shadow-xl hover:shadow-primary/20"
                            >
                                COMEÇAR TESTE GRÁTIS
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <p className="text-sm text-muted-foreground">
                                ⚡ Primeiro mês grátis para testar
                            </p>
                        </div>

                        <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Precificação Automática</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>Gestão de Pedidos</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Calculator */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                        className="relative"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-20 animate-pulse"></div>
                        <div className="relative transform hover:scale-[1.01] transition-transform duration-500">
                            <ProfitCalculator />
                        </div>

                        {/* Floating Badge */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1, type: "spring" }}
                            className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-elegant border border-border/50 hidden md:block"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-xl">💰</span>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Potencial de Lucro</p>
                                    <p className="text-sm font-bold text-green-600">Comprovado</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
