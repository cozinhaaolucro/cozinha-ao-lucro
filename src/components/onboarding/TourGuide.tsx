import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Step {
    targetId: string;
    title: string;
    description: string;
    position: 'bottom' | 'right' | 'left' | 'top';
}

const steps: Step[] = [
    {
        targetId: 'nav-dashboard',
        title: 'Seu Quartel General',
        description: 'Aqui é onde a mágica acontece! Acompanhe seu lucro em tempo real, veja o faturamento do dia e tenha controle total do seu negócio em uma única tela vibrante.',
        position: 'right'
    },
    {
        targetId: 'nav-pedidos',
        title: 'Central de Vendas',
        description: 'O coração da sua operação! Arraste pedidos para organizar a produção e nunca mais perca um prazo. Tudo visual e ágil.',
        position: 'right'
    },
    {
        targetId: 'nav-agenda',
        title: 'Agenda Inteligente',
        description: 'Sua rotina otimizada! Visualize entregas no calendário e sincronize com o Google Agenda com um clique.',
        position: 'right'
    },
    {
        targetId: 'nav-produtos',
        title: 'Fábrica de Lucros',
        description: 'Esqueça contas manuais! O sistema calcula automaticamente o custo da receita e sugere o preço ideal para garantir seu lucro.',
        position: 'right'
    },
    {
        targetId: 'nav-financeiro',
        title: 'Controle de Caixa',
        description: 'Dinheiro no bolso! Monitore cada centavo que entra e sai com gráficos claros. Saiba exatamente quanto você está lucrando.',
        position: 'right'
    },
    {
        targetId: 'nav-menu',
        title: 'Seu Cardápio Digital',
        description: 'Sua vitrine virtual! Configure um cardápio lindo e compartilhe seu link exclusivo para receber pedidos.',
        position: 'right'
    },
    {
        targetId: 'nav-aprender',
        title: 'Escola de Negócios',
        description: 'Cresça todo dia! Acesse e-books e materiais exclusivos que vão te transformar em um empresário de sucesso.',
        position: 'right'
    }
];

export const TourGuide = () => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const { user } = useAuth();
    const STORAGE_KEY = `has_seen_tour_${user?.id}_v2`; // Bumped version to force reshow

    useEffect(() => {
        const hasSeen = localStorage.getItem(STORAGE_KEY);
        if (!hasSeen) {
            setTimeout(() => setIsVisible(true), 1500);
        }
    }, [user]);

    // Highlight effect
    useEffect(() => {
        if (!isVisible) return;

        const step = steps[currentStepIndex];
        const element = document.getElementById(step.targetId);

        if (element) {
            // Add highlight styles
            const originalBoxShadow = element.style.boxShadow;
            const originalZIndex = element.style.zIndex;
            const originalPosition = element.style.position;
            const originalTransition = element.style.transition;

            element.style.transition = 'all 0.3s ease';
            element.style.boxShadow = '0 0 0 4px rgba(255, 165, 0, 0.6), 0 0 20px rgba(255, 165, 0, 0.4)';
            element.style.zIndex = '50';
            if (getComputedStyle(element).position === 'static') {
                element.style.position = 'relative';
            }

            // Scroll into view if needed
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            return () => {
                // Cleanup
                element.style.boxShadow = originalBoxShadow;
                element.style.zIndex = originalZIndex;
                element.style.position = originalPosition;
                element.style.transition = originalTransition;
            };
        }
    }, [currentStepIndex, isVisible]);

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem(STORAGE_KEY, 'true');
    };

    if (!isVisible) return null;

    const currentStep = steps[currentStepIndex];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            {/* Click outside to close could be annoying, so disabled */}
            <Card className="w-[400px] relative animate-in zoom-in-95 duration-200 border-primary/20 shadow-2xl">
                <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={handleClose}>
                    <X className="w-4 h-4" />
                </Button>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-primary">
                        <span className="bg-primary text-primary-foreground text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
                            {currentStepIndex + 1}
                        </span>
                        {currentStep.title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{currentStep.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4 mt-2">
                    <Button variant="ghost" onClick={handleClose} className="text-muted-foreground hover:text-foreground">Pular</Button>
                    <Button onClick={handleNext} className="gap-2 shadow-lg hover:shadow-xl transition-all">
                        {currentStepIndex === steps.length - 1 ? 'Vamos Começar!' : 'Próximo'}
                        {currentStepIndex === steps.length - 1 ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};
