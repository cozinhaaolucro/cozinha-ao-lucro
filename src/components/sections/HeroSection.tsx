import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, ChefHat, DollarSign, TrendingUp, Utensils, ShoppingBag, Star, Heart, Coffee, Award } from 'lucide-react';

const HeroSection = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-24">
            {/* Background Elements - Thematic Floating Icons */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/20 z-0"></div>

            {/* Floating Icons - More elements added */}
            <div className="absolute top-20 left-[10%] text-primary/10 animate-float" style={{ animationDelay: '0s' }}>
                <ChefHat size={120} />
            </div>
            <div className="absolute top-40 right-[15%] text-secondary/10 animate-float" style={{ animationDelay: '2s' }}>
                <DollarSign size={100} />
            </div>
            <div className="absolute bottom-32 left-[20%] text-primary/10 animate-float" style={{ animationDelay: '4s' }}>
                <TrendingUp size={80} />
            </div>
            <div className="absolute bottom-20 right-[10%] text-secondary/10 animate-float" style={{ animationDelay: '1s' }}>
                <Utensils size={90} />
            </div>

            {/* New Icons */}
            <div className="absolute top-1/4 left-[5%] text-primary/5 animate-float" style={{ animationDelay: '3s' }}>
                <ShoppingBag size={60} />
            </div>
            <div className="absolute top-1/3 right-[5%] text-secondary/5 animate-float" style={{ animationDelay: '5s' }}>
                <Star size={50} />
            </div>
            <div className="absolute bottom-1/4 left-[15%] text-primary/5 animate-float" style={{ animationDelay: '1.5s' }}>
                <Heart size={40} />
            </div>
            <div className="absolute top-[15%] right-[25%] text-secondary/5 animate-float" style={{ animationDelay: '3.5s' }}>
                <Coffee size={55} />
            </div>
            <div className="absolute bottom-[10%] left-[40%] text-primary/5 animate-float" style={{ animationDelay: '2.5s' }}>
                <Award size={45} />
            </div>

            <div className="container-max relative z-10 px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-4xl mx-auto"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="inline-block mb-6 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary-foreground font-medium text-sm"
                    >
                        <span className="text-primary-foreground dark:text-primary-foreground text-yellow-900 font-bold">
                            ✨ Método Comprovado por +5.000 Alunas
                        </span>
                    </motion.div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-foreground">
                        Transforme sua Cozinha em uma
                        <span className="block text-gradient-gold mt-2">
                            Máquina de Lucros
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        O guia definitivo para quem quer <strong>renda extra sem sair de casa</strong>. Aprenda receitas lucrativas, precificação correta e como vender todos os dias.
                    </p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12"
                    >
                        <Button
                            onClick={() => window.open('https://pay.kiwify.com.br/TV099tr', '_blank')}
                            className="btn-primary text-lg px-8 py-6 h-auto group"
                        >
                            QUERO MINHA INDEPENDÊNCIA
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Oferta disponível hoje
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
                        className="relative max-w-sm mx-auto"
                    >
                        <img
                            src="/images/logo_cozinhaaolucro.png"
                            alt="Cozinha ao Lucro Preview"
                            className="w-full h-auto rounded-2xl shadow-elegant border border-white/20 glass-panel"
                        />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
