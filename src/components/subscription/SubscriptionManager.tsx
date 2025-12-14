import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    CreditCard,
    CheckCircle,
    Zap,
    Calendar,
    AlertCircle,
    FileText,
    Download
} from 'lucide-react';
import { toast } from 'sonner';
import { getInvoices, cancelSubscription, iniciarPagamento, Invoice } from '@/lib/pagamento';

export const SubscriptionManager = () => {
    const { user, profile } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    // Derived State
    const subscriptionStartDate = user?.created_at ? new Date(user.created_at) : new Date();
    // Default to 7 day trial if no specific subscription end in profile, else use profile date
    const subscriptionEndDate = profile?.subscription_end ? new Date(profile.subscription_end) : new Date(subscriptionStartDate.getTime() + (7 * 24 * 60 * 60 * 1000));

    const today = new Date();
    const isActive = profile?.subscription_status === 'active';
    const isTrial = !isActive && today < subscriptionEndDate; // Simplified logic: if not active paid, and within range, it's trial? 
    // Actually, if 'active' is false, we rely on dates. 
    // Let's assume: 
    // - If profile.subscription_status == 'active', it's PAID PRO.
    // - Else if today < creation + 7 days, it's TRIAL.
    // - Else, EXPIRED.

    const trialEndsAt = new Date(subscriptionStartDate.getTime() + (7 * 24 * 60 * 60 * 1000));
    const isTrialPeriod = today < trialEndsAt && profile?.subscription_status !== 'active';
    const isExpired = !isTrialPeriod && profile?.subscription_status !== 'active';

    // Display Date: If active, show Next Billing (End Date). If trial, show Trial End.
    const displayDate = profile?.subscription_status === 'active' ? subscriptionEndDate : trialEndsAt;

    const daysRemaining = Math.ceil((displayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            setLoadingInvoices(true);
            const data = await getInvoices();
            setInvoices(data);
        } catch (error) {
            console.error('Failed to load invoices', error);
        } finally {
            setLoadingInvoices(false);
        }
    };

    const handlePayment = async () => {
        try {
            toast.loading('Iniciando checkout...');
            await iniciarPagamento();
            toast.dismiss();
        } catch (error) {
            toast.error('Erro ao iniciar pagamento');
            toast.dismiss();
        }
    };

    const handleCancel = async () => {
        if (!confirm('Tem certeza que deseja cancelar a renovação automática?')) return;

        try {
            setCancelling(true);
            await cancelSubscription();
            toast.success('Renovação cancelada com sucesso.');
        } catch (error) {
            toast.error('Erro ao cancelar assinatura');
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-primary/20 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Zap className="w-32 h-32 text-primary" />
                </div>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl text-primary flex items-center gap-2">
                                Plano Pro
                                <Badge className={isTrialPeriod ? "bg-blue-500/20 text-blue-700 border-0" : isActive ? "bg-green-500/20 text-green-700 border-0" : "bg-red-500/20 text-red-700 border-0"}>
                                    {isTrialPeriod ? 'TRIAL GRATUITO' : isActive ? 'ATIVO' : 'EXPIRADO'}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="mt-2">
                                {isTrialPeriod
                                    ? `Você está aproveitando 7 dias grátis.`
                                    : isActive
                                        ? 'Sua assinatura está ativa e operando.'
                                        : 'Sua assinatura expirou. Renove para continuar.'
                                }
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg border">
                            <p className="text-sm text-muted-foreground mb-1">Valor</p>
                            <p className="text-2xl font-bold">R$ 29,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg border">
                            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {isActive ? 'Próxima Cobrança' : 'Expira em'}
                            </p>
                            <p className="text-2xl font-bold">{displayDate.toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg border">
                            <p className="text-sm text-muted-foreground mb-1">Status</p>
                            <p className={`text-2xl font-bold ${daysRemaining <= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                                {isExpired ? 'Inativo' : `${daysRemaining} dias`}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid sm:grid-cols-2 gap-3">
                        {[
                            "Precificação Ilimitada",
                            "Gestão de Pedidos",
                            "Relatórios Financeiros",
                            "Suporte Prioritário"
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="w-4 h-4 text-primary" />
                                {feature}
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-4 justify-between bg-muted/20 p-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CreditCard className="w-4 h-4" />
                        Pagamento via Cartão ou Pix
                    </div>
                    <div className="flex gap-2">
                        {isActive && (
                            <Button variant="outline" onClick={handleCancel} disabled={cancelling} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                {cancelling ? 'Cancelando...' : 'Cancelar Renovação'}
                            </Button>
                        )}
                        <Button
                            onClick={handlePayment}
                            className={!isActive ? "bg-primary hover:bg-primary/90" : ""}
                            variant={isActive ? "outline" : "default"}
                        >
                            {isActive ? 'Gerenciar Pagamento' : 'Assinar Agora'}
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Histórico de Faturas
                    </CardTitle>
                    <CardDescription>Baixe os comprovantes dos seus pagamentos.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingInvoices ? (
                        <div className="text-center py-8 text-muted-foreground">Carregando faturas...</div>
                    ) : invoices.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                            Nenhuma fatura encontrada.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {invoices.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{new Date(inv.created_at).toLocaleDateString('pt-BR')}</p>
                                            <p className="text-xs text-muted-foreground uppercase">{inv.status}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <p className="font-bold">R$ {(inv.amount / 100).toFixed(2).replace('.', ',')}</p>
                                        {inv.url && (
                                            <Button variant="ghost" size="icon" asChild>
                                                <a href={inv.url} target="_blank" rel="noopener noreferrer">
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
