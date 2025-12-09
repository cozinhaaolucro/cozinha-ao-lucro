import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    User,
    CreditCard,
    Bell,
    Shield,
    CheckCircle,
    Zap,
    LogOut,
    Mail,
    Lock
} from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            toast.success('Perfil atualizado com sucesso!');
        }, 1000);
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success('Senha alterada com sucesso!');
        }, 1000);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-muted-foreground">Gerencie sua conta e assinatura.</p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="general" className="gap-2">
                        <User className="w-4 h-4" />
                        Geral
                    </TabsTrigger>
                    <TabsTrigger value="subscription" className="gap-2">
                        <CreditCard className="w-4 h-4" />
                        Assinatura
                    </TabsTrigger>
                </TabsList>

                {/* General Settings Tab */}
                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Perfil</CardTitle>
                            <CardDescription>
                                Atualize suas informações pessoais.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nome Completo</Label>
                                    <div className="relative">
                                        <Input id="name" defaultValue="Maria da Silva" className="pl-10" />
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Input id="email" defaultValue={user?.email || ''} disabled className="pl-10 bg-muted" />
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Notificações por Email</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receba resumos semanais do seu negócio.
                                        </p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Segurança</CardTitle>
                            <CardDescription>
                                Altere sua senha de acesso.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="current-password">Senha Atual</Label>
                                    <div className="relative">
                                        <Input id="current-password" type="password" className="pl-10" />
                                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="new-password">Nova Senha</Label>
                                    <div className="relative">
                                        <Input id="new-password" type="password" className="pl-10" />
                                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <Button type="submit" variant="outline" disabled={loading}>
                                    Alterar Senha
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Subscription Tab */}
                <TabsContent value="subscription" className="space-y-6">
                    <Card className="border-primary/20 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap className="w-32 h-32 text-primary" />
                        </div>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl text-primary flex items-center gap-2">
                                        Plano Pro
                                        <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0">ATIVO</Badge>
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        Você tem acesso a todos os recursos premium.
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
                                    <p className="text-sm text-muted-foreground mb-1">Próxima Cobrança</p>
                                    <p className="text-2xl font-bold">07/01/2026</p>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-lg border">
                                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                                    <p className="text-2xl font-bold text-green-600">Em dia</p>
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
                                <CreditCard className="w-4 h-4" />
                                Visa terminado em 4242
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline">Gerenciar Pagamento</Button>
                                <Button variant="destructive">Cancelar Assinatura</Button>
                            </div>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Faturas</CardTitle>
                            <CardDescription>Baixe os comprovantes dos seus pagamentos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { date: "07/12/2025", amount: "R$ 39,90", status: "Pago" },
                                    { date: "07/11/2025", amount: "R$ 0,00", status: "Período Gratuito" },
                                ].map((invoice, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                <CheckCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{invoice.date}</p>
                                                <p className="text-sm text-muted-foreground">{invoice.status}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{invoice.amount}</p>
                                            <Button variant="link" className="h-auto p-0 text-xs">Download PDF</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Settings;
