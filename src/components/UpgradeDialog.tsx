import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Rocket, Crown } from 'lucide-react';
import { PLANS } from '@/config/plans';

interface UpgradeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentPlanId: string;
    resourceName: string; // "Pedidos", "Produtos", etc.
}

export function UpgradeDialog({ open, onOpenChange, currentPlanId, resourceName }: UpgradeDialogProps) {
    // Defines target plan: If FREE -> PRO ($49). If PRO -> PREMIUM ($97).
    const isFree = currentPlanId === 'free';
    const targetPlan = isFree ? PLANS.pro : PLANS.premium;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        {isFree ? <Rocket className="w-6 h-6 text-primary" /> : <Crown className="w-6 h-6 text-[#C9A34F]" />}
                    </div>
                    <DialogTitle className="text-2xl font-bold">
                        {isFree ? 'Desbloqueie seu Potencial' : 'Vire um Mestre da Cozinha'}
                    </DialogTitle>
                    <DialogDescription className="text-base pt-2">
                        Você atingiu o limite de <span className="font-semibold text-foreground">{resourceName}</span> do seu plano atual.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="bg-muted/40 p-4 rounded-lg border border-border/50">
                        <div className="flex justify-between items-baseline mb-3">
                            <span className="font-bold text-lg">Plano {targetPlan.name}</span>
                            <span className="text-2xl font-extrabold text-primary">R$ {targetPlan.price.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/mês</span></span>
                        </div>

                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-500" />
                                {targetPlan.limits.orders === Infinity ? 'Pedidos Ilimitados' : `Até ${targetPlan.limits.orders} pedidos/mês`}
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-500" />
                                {targetPlan.limits.products === Infinity ? 'Produtos Ilimitados' : `Até ${targetPlan.limits.products} produtos`}
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-500" />
                                {targetPlan.features.ai_insights ? 'Inteligência Artificial (Dica do Especialista)' : 'Dashboard Básico'}
                            </li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button size="lg" className="w-full font-bold text-lg" onClick={() => window.open('https://pagar.me/checkout_link_placeholder', '_blank')}>
                        Fazer Upgrade Agora
                    </Button>
                    <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => onOpenChange(false)}>
                        Talvez depois
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
