import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, CreditCard, Loader2 } from 'lucide-react';
import { iniciarPagamento } from '@/lib/pagamento';
import { toast } from 'sonner';

export const SubscriptionBlocker = () => {
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            await iniciarPagamento();
        } catch (error) {
            console.error('Erro ao processar pagamento:', error);
            toast.error('Erro ao iniciar pagamento. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <Card className="max-w-md w-full shadow-2xl border-primary/20">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">Acesso Bloqueado</CardTitle>
                    <CardDescription className="text-base mt-2">
                        Seu período de teste gratuito de 7 dias expirou.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        Para continuar gerenciando sua cozinha, tendo acesso aos pedidos, clientes e estoque, você precisa ativar sua assinatura.
                    </p>
                    <div className="bg-muted/50 p-4 rounded-lg text-sm text-left">
                        <p className="font-semibold mb-2">O que você vai perder se não assinar:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Gestão completa de pedidos</li>
                            <li>Controle automático de estoque</li>
                            <li>Cadastro ilimitado de receitas</li>
                            <li>Relatórios financeiros detalhados</li>
                        </ul>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-2">
                    <Button
                        size="lg"
                        className="w-full gap-2 text-lg font-semibold shadow-lg hover:shadow-primary/25 transition-all"
                        onClick={handleSubscribe}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5" />
                                Assinar Agora
                            </>
                        )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                        Pagamento seguro via Pagar.me. Cancele quando quiser.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};
