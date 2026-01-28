import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Calendar, CreditCard, Zap, FileText } from 'lucide-react';
import { getInvoices, cancelSubscription, iniciarPagamento } from '@/lib/pagamento';
import { toast } from 'sonner';

export const SubscriptionManager = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState<any[]>([]);

    // Derived state
    const subscriptionStartDate = user?.created_at ? new Date(user.created_at) : new Date();
    const trialEndDate = new Date(subscriptionStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    const today = new Date();
    const isTrialPeriod = today < trialEndDate;
    const daysUntilBilling = Math.ceil((trialEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isDueToday = daysUntilBilling <= 0;

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            // Em MVP, se falhar (ex: função não deployada), não quebra a UI
            const data = await getInvoices().catch(() => []);
            setInvoices(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Deseja realmente cancelar a renovação automática?')) return;
        setLoading(true);
        try {
            await cancelSubscription();
            toast.success('Assinatura cancelada com sucesso.');
        } catch (error) {
            toast.error('Erro ao cancelar.');
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async () => {
        setLoading(true);
        try {
            await iniciarPagamento();
        } catch (e) {
            toast.error('Erro ao iniciar pagamento');
        } finally {
            setLoading(false);
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
                                <Badge className={isTrialPeriod ? "bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 border-0" : "bg-primary/20 text-primary hover:bg-primary/30 border-0"}>
                                    {isTrialPeriod ? 'PERÍODO GRATUITO' : 'ATIVO'}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="mt-2">
                                {isTrialPeriod
                                    ? `Você está no período gratuito. Aproveite todos os recursos!`
                                    : 'Você tem acesso a todos os recursos premium.'
                                }
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg border">
                            <p className="text-sm text-muted-foreground mb-1">Valor</p>
                            <p className="text-2xl font-bold">R$ 39,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg border">
                            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {isTrialPeriod ? 'Fim do Período Grátis' : 'Próxima Cobrança'}
                            </p>
                            <p className="text-2xl font-bold">{trialEndDate.toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg border">
                            <p className="text-sm text-muted-foreground mb-1">Status</p>
                            <p className={`text-2xl font-bold ${isDueToday ? 'text-orange-600' : 'text-green-600'}`}>
                                {isDueToday ? 'Pagamento Pendente' : isTrialPeriod ? `${daysUntilBilling} dias restantes` : 'Em dia'}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Recursos Inclusos
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {[
                                "Precificação Automática Ilimitada",
                                "Gestão de Pedidos Completa",
                                "Controle de Estoque Avançado",
                                "Relatórios Financeiros Detalhados",
                                "Suporte Prioritário",
                                "Acesso aos Ebooks Exclusivos"
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-4 justify-between bg-muted/20 p-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {isDueToday ? (
                            <>
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                Pagamento necessário para continuar
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-4 h-4" />
                                Primeiro mês gratuito
                            </>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {!isDueToday && (
                            <Button variant="outline" onClick={handleCancel} disabled={loading} className="text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50">
                                Cancelar Renovação
                            </Button>
                        )}
                        <Button
                            onClick={handlePay}
                            disabled={loading}
                            variant={isDueToday ? "default" : "outline"}
                            className={isDueToday ? "bg-primary hover:bg-primary/90" : ""}
                        >
                            {isDueToday ? 'Efetuar Pagamento' : 'Antecipar Pagamento'}
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Faturas</CardTitle>
                    <CardDescription>Baixe os comprovantes dos seus pagamentos.</CardDescription>
                </CardHeader>
                <CardContent>
                    {invoices.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            Nenhuma fatura encontrada.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {invoices.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">Fatura #{inv.id.slice(0, 8)}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">R$ {inv.amount.toFixed(2)}</p>
                                        <Badge variant="outline" className="text-xs">{inv.status}</Badge>
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
