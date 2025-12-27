import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    ChefHat,
    Package,
    ShoppingCart,
    CheckCircle2,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    action: () => void;
    actionLabel: string;
    completed: boolean;
}

const ONBOARDING_STORAGE_KEY = 'cozinha_onboarding_completed';
const ONBOARDING_STEP_KEY = 'cozinha_onboarding_step';

const OnboardingModal = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);

    // Check if user should see onboarding
    // Check if user should see onboarding
    useEffect(() => {
        if (!user) return;

        const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);

        if (!hasCompletedOnboarding) {
            setIsOpen(true);
            if (savedStep) {
                setCurrentStep(parseInt(savedStep));
            }
        }
    }, [user]);

    const handleStepComplete = (stepId: string) => {
        const newCompleted = [...completedSteps, stepId];
        setCompletedSteps(newCompleted);

        if (currentStep < steps.length - 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            localStorage.setItem(ONBOARDING_STEP_KEY, nextStep.toString());
        } else {
            // All steps completed
            localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
            setIsOpen(false);
        }
    };

    const handleSkip = () => {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        setIsOpen(false);
    };

    const steps: OnboardingStep[] = [
        {
            id: 'product',
            title: 'Crie seu primeiro produto',
            description: 'Adicione uma receita com ingredientes e custos para começar a precificar corretamente.',
            icon: <Package className="w-8 h-8" />,
            action: () => {
                navigate('/app/produtos');
                handleStepComplete('product');
            },
            actionLabel: 'Criar Produto',
            completed: completedSteps.includes('product'),
        },
        {
            id: 'order',
            title: 'Registre um pedido',
            description: 'Simule um pedido para ver como o sistema calcula custos e lucros automaticamente.',
            icon: <ShoppingCart className="w-8 h-8" />,
            action: () => {
                navigate('/app/pedidos');
                handleStepComplete('order');
            },
            actionLabel: 'Criar Pedido',
            completed: completedSteps.includes('order'),
        },
        {
            id: 'dashboard',
            title: 'Veja seu Dashboard',
            description: 'Explore as métricas e relatórios que vão ajudar você a tomar melhores decisões.',
            icon: <ChefHat className="w-8 h-8" />,
            action: () => {
                navigate('/app/dashboard');
                handleStepComplete('dashboard');
            },
            actionLabel: 'Ver Dashboard',
            completed: completedSteps.includes('dashboard'),
        },
    ];

    const progress = (completedSteps.length / steps.length) * 100;
    const currentStepData = steps[currentStep];

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md p-0 overflow-hidden">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5" />
                            <Badge variant="secondary" className="bg-white/20 text-white border-0">
                                Passo {currentStep + 1} de {steps.length}
                            </Badge>
                        </div>
                        <DialogTitle className="text-2xl font-bold text-white">
                            Bem-vindo ao Cozinha ao Lucro! 🎉
                        </DialogTitle>
                        <DialogDescription className="text-white/80 text-base">
                            Configure seu negócio em 3 passos simples.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Progress bar */}
                    <div className="mt-4">
                        <Progress value={progress} className="h-2 bg-white/20" />
                    </div>
                </div>

                {/* Current step content */}
                <div className="p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className={`p-3 rounded-xl ${currentStepData.completed ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                            {currentStepData.completed ? <CheckCircle2 className="w-8 h-8" /> : currentStepData.icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-1">{currentStepData.title}</h3>
                            <p className="text-muted-foreground">{currentStepData.description}</p>
                        </div>
                    </div>

                    {/* Step indicators */}
                    <div className="flex justify-center gap-2 mb-6">
                        {steps.map((step, index) => (
                            <div
                                key={step.id}
                                className={`w-3 h-3 rounded-full transition-colors ${index === currentStep
                                    ? 'bg-primary'
                                    : completedSteps.includes(step.id)
                                        ? 'bg-green-500'
                                        : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            className="flex-1 text-muted-foreground hover:text-foreground"
                            onClick={handleSkip}
                        >
                            Pular Introdução
                        </Button>
                        <Button
                            className="flex-1 gap-2"
                            onClick={currentStepData.action}
                        >
                            {currentStepData.actionLabel}
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default OnboardingModal;
