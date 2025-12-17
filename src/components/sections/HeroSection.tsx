import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import ProfitCalculator from '@/components/ProfitCalculator';

const HeroSection = () => {
    return (
        <section className="relative pt-24 pb-16 md:pt-32 md:pb-24">
            <div className="max-w-6xl mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column: Copy */}
                    <div className="text-center lg:text-left">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-foreground [text-wrap:balance]">
                            Gerencie sua Cozinha e
                            <span className="block text-primary mt-2">
                                Multiplique seus Lucros
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl mb-8 text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                            A plataforma completa para quem vende comida em casa. <strong>Precifique corretamente, controle pedidos e estoque</strong> em um só lugar.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                            <Button
                                onClick={() => window.location.href = '/register'}
                                size="lg"
                                className="text-lg px-8 py-6 h-auto w-full sm:w-auto"
                            >
                                Começar Agora
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            <p className="text-sm text-muted-foreground">
                                7 dias grátis
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
                    </div>

                    {/* Right Column: Calculator */}
                    <div className="relative">
                        <ProfitCalculator />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
