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
        title: 'Seu Painel de Controle',
        description: 'Visão geral do negócio: lucros, receitas e atalhos rápidos.',
        position: 'right'
    },
    {
        targetId: 'nav-pedidos',
        title: 'Central de Pedidos',
        description: 'Gerencie novos pedidos, mude status e organize suas entregas.',
        position: 'right'
    },
    {
        targetId: 'nav-agenda',
        title: 'Agenda Inteligente',
        description: 'Visualize suas entregas em um calendário e sincronize com o Google Agenda.',
        position: 'right'
    },
    {
        targetId: 'nav-produtos',
        title: 'Produtos & Fichas Técnicas',
        description: 'Cadastre suas receitas com custos automáticos e defina seus preços de venda.',
        position: 'right'
    },
    {
        targetId: 'nav-financeiro',
        title: 'Fluxo de Caixa',
        description: 'Controle todas as entradas e saídas e veja relatórios detalhados.',
        position: 'right'
    },
    {
        targetId: 'nav-menu',
        title: 'Seu Cardápio Digital',
        description: 'Configure como seus clientes veem seus produtos e compartilhe seu link.',
        position: 'right'
    },
    {
        targetId: 'nav-aprender',
        title: 'Área de Estudo',
        description: 'Acesse materiais educativos para crescer seu negócio.',
        position: 'right'
    }
];

export const TourGuide = () => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const { user } = useAuth();
    const STORAGE_KEY = `has_seen_tour_${user?.id}_v1`;

    useEffect(() => {
        const hasSeen = localStorage.getItem(STORAGE_KEY);
        if (!hasSeen) {
            // Delay slightly to ensure layout is mounted
            setTimeout(() => setIsVisible(true), 1500);
        }
    }, [user]);

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

    // Calculate position (simple version - ideally use Popper.js or Floating UI)
    // For now, we will use a fixed overlay centered or cornered if simple logic fails,
    // but let's try to highlight the element.
    // Actually, a simple fixed card is safer than complex coordinate math without a library.
    // Let's use a fixed modal-like card but pointing to the general area if possible,
    // or just a nice bottom-right floating card.

    // Better: Highlight the sidebar elements if possible by ID, but that requires DOM manipulation.
    // Strategy: Simple Fixed Card for Reliability.

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
            <div className="absolute inset-0" onClick={handleClose} />
            <Card className="w-[400px] relative z-60 animate-in zoom-in-95 duration-200">
                <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={handleClose}>
                    <X className="w-4 h-4" />
                </Button>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground text-xs w-6 h-6 rounded-full flex items-center justify-center">
                            {currentStepIndex + 1}
                        </span>
                        {currentStep.title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{currentStep.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="ghost" onClick={handleClose}>Pular Tour</Button>
                    <Button onClick={handleNext} className="gap-2">
                        {currentStepIndex === steps.length - 1 ? 'Concluir' : 'Próximo'}
                        {currentStepIndex === steps.length - 1 ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};
