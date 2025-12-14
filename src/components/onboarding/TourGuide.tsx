import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface Step {
    target: string;
    title: string;
    content: string;
    position?: 'right' | 'left' | 'top' | 'bottom';
}

const steps: Step[] = [
    {
        target: 'centered',
        title: 'Bem-vindo ao Cozinha ao Lucro!',
        content: 'Este é o seu novo painel de controle. Vamos fazer um tour rápido para você começar a lucrar mais.'
    },
    {
        target: 'nav-dashboard',
        title: 'Visão Geral',
        content: 'Aqui você acompanha o desempenho do seu negócio, custos e lucros em tempo real.',
        position: 'right'
    },
    {
        target: 'nav-pedidos',
        title: 'Gestão de Pedidos',
        content: 'Organize suas encomendas, datas de entrega e status de produção.',
        position: 'right'
    },
    {
        target: 'nav-produtos',
        title: 'Produtos & Fichas Técnicas',
        content: 'Cadastre seus insumos e deixe o sistema calcular o preço ideal de venda automaticamente.',
        position: 'right'
    },
    {
        target: 'nav-clientes',
        title: 'Seus Clientes',
        content: 'Mantenha um histórico detalhado de compras e conheça seus melhores clientes.',
        position: 'right'
    }
];

export const TourGuide = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState<{ top: number, left: number, width: number, height: number } | null>(null);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('has_seen_tour_v1');
        if (!hasSeenTour) {
            // Small delay to ensure layout
            setTimeout(() => setIsVisible(true), 1000);
        }
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const updatePosition = () => {
            const step = steps[currentStep];
            if (step.target === 'centered') {
                setCoords(null);
                return;
            }

            const element = document.getElementById(step.target);
            if (element) {
                const rect = element.getBoundingClientRect();
                setCoords({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [currentStep, isVisible]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('has_seen_tour_v1', 'true');
    };

    if (!isVisible) return null;

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 z-[100] flex flex-col">
            {/* Mask Layer */}
            {coords ? (
                // Spotlight mask using SVG or clip-path is hard, simpler approach:
                // Use 4 divs to dim everything around target
                <>
                    <div className="absolute top-0 left-0 right-0 bg-black/60 transition-all duration-300" style={{ height: coords.top }} />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 transition-all duration-300" style={{ top: coords.top + coords.height }} />
                    <div className="absolute left-0 bg-black/60 transition-all duration-300" style={{ top: coords.top, height: coords.height, width: coords.left }} />
                    <div className="absolute right-0 bg-black/60 transition-all duration-300" style={{ top: coords.top, height: coords.height, left: coords.left + coords.width }} />
                </>
            ) : (
                <div className="absolute inset-0 bg-black/60" />
            )}

            {/* Content Card */}
            <div
                className="absolute transition-all duration-500 z-[101]"
                style={
                    coords
                        ? {
                            top: coords.top,
                            left: coords.left + coords.width + 16,
                            // Ensure it fits screen right
                            // Simple logic for sidebar (always right)
                        }
                        : {
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                        }
                }
            >
                <Card className="w-[350px] shadow-2xl border-primary animate-in fade-in zoom-in-95 duration-300">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{step.title}</CardTitle>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClose}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{step.content}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                        <div className="flex gap-1">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full transition-colors ${i === currentStep ? 'bg-primary' : 'bg-muted'}`}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={handleBack} disabled={currentStep === 0}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button size="sm" onClick={handleNext}>
                                {currentStep === steps.length - 1 ? 'Começar' : 'Próximo'}
                                {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};
