import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, BarChart3 } from 'lucide-react';
import ProfitCalculator from '@/components/ProfitCalculator';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
    const navigate = useNavigate();
    return (
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-28">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] spotlight-warm opacity-60 blur-3xl rounded-full mix-blend-screen animate-float"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] spotlight opacity-40 blur-3xl rounded-full mix-blend-overlay"></div>
            </div>

            <div className="container-max relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-start">
                    {/* Left Column: Copy */}
                    <div className="text-center lg:text-left space-y-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground [text-wrap:balance] font-heading transform-gpu antialiased drop-shadow-sm">
                                Transforme sua cozinha em um negócio
                                <span className="block text-primary mt-2 text-glow relative inline-block">
                                    realmente lucrativo
                                </span>
                            </h1>
                        </div>

                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                            Controle custos, acerte no preço e saiba exatamente quanto você lucra em cada venda — <strong className="text-foreground/90">mesmo começando do zero.</strong>
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <Button
                                onClick={() => navigate('/register')}
                                size="lg"
                                className="btn-primary text-lg px-8 py-7 h-auto w-full sm:w-auto shadow-lg hover:shadow-glow animate-in fade-in slide-in-from-bottom-4 duration-500"
                            >
                                Começar a Lucrar Agora
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-muted-foreground pt-4">
                            {[
                                'Precificação Automática',
                                'Gestão de Pedidos',
                                'Controle de Estoque'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-accent" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Calculator */}
                    <div className="relative animate-in slide-in-from-right-8 duration-700 fade-in transform-gpu perspective-1000">
                        <div className="text-center mb-4">
                            <Button onClick={() => navigate('/register')} variant="ghost" size="sm" className="gap-2 hover:bg-primary/10 text-muted-foreground hover:text-primary">
                                <BarChart3 className="w-4 h-4" />
                                Ver Meu Lucro na Prática
                            </Button>
                        </div>
                        <ProfitCalculator />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
