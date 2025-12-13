import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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
    CheckCircle,
    Zap,
    LogOut,
    Mail,
    Lock,
    Camera,
    Phone,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get user data
    const fullName = user?.user_metadata?.full_name || '';
    const phone = user?.user_metadata?.phone || '';
    const avatarUrl = user?.user_metadata?.avatar_url;

    // Subscription data (could be fetched from profiles table)
    const subscriptionStartDate = user?.created_at ? new Date(user.created_at) : new Date();
    const trialEndDate = new Date(subscriptionStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    const nextBillingDate = new Date(trialEndDate);
    const today = new Date();
    const isTrialPeriod = today < trialEndDate;
    const daysUntilBilling = Math.ceil((nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isDueToday = daysUntilBilling <= 0;

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get('name') as string;
        const phoneValue = formData.get('phone') as string;

        try {
            await supabase.auth.updateUser({
                data: {
                    full_name: name,
                    phone: phoneValue
                }
            });
            toast.success('Perfil atualizado com sucesso!');
        } catch (error) {
            toast.error('Erro ao atualizar perfil');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.target as HTMLFormElement);
        const newPassword = formData.get('new-password') as string;

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success('Senha alterada com sucesso!');
            (e.target as HTMLFormElement).reset();
        } catch (error) {
            toast.error('Erro ao alterar senha');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            await supabase.auth.updateUser({
                data: { avatar_url: data.publicUrl + '?t=' + Date.now() }
            });

            toast.success('Foto atualizada com sucesso!');
            window.location.reload();
        } catch (error) {
            console.error('Error uploading photo:', error);
            toast.error('Erro ao atualizar foto');
        } finally {
            setUploading(false);
        }
    };

    const handlePayment = () => {
        // TODO: Replace with actual Stripe payment link
        toast.info('Redirecionando para pagamento...');
        // window.open('STRIPE_PAYMENT_LINK', '_blank');
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
                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                {/* Profile Photo */}
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-8 h-8 text-primary" />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
                                            disabled={uploading}
                                        >
                                            <Camera className="w-4 h-4" />
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePhotoUpload}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-medium">{fullName || 'Seu Nome'}</p>
                                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-sm text-primary hover:underline mt-1"
                                            disabled={uploading}
                                        >
                                            {uploading ? 'Enviando...' : 'Alterar foto'}
                                        </button>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nome Completo</Label>
                                        <div className="relative">
                                            <Input id="name" name="name" defaultValue={fullName} className="pl-10" />
                                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Telefone</Label>
                                        <div className="relative">
                                            <Input id="phone" name="phone" defaultValue={phone} className="pl-10" placeholder="(11) 98765-4321" />
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Input id="email" defaultValue={user?.email || ''} disabled className="pl-10 bg-muted" />
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        </div>
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
                                    <Label htmlFor="new-password">Nova Senha</Label>
                                    <div className="relative">
                                        <Input id="new-password" name="new-password" type="password" className="pl-10" minLength={6} required />
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
                                    <p className="text-2xl font-bold">{nextBillingDate.toLocaleDateString('pt-BR')}</p>
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
                                <Button
                                    onClick={async () => {
                                        try {
                                            const { iniciarPagamento } = await import('@/lib/pagamento');
                                            await iniciarPagamento();
                                        } catch (error) {
                                            console.error('Erro ao iniciar pagamento:', error);
                                            toast.error('Erro ao processar pagamento');
                                        }
                                    }}
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
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{subscriptionStartDate.toLocaleDateString('pt-BR')}</p>
                                            <p className="text-sm text-muted-foreground">Início do Período Gratuito</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">R$ 0,00</p>
                                        <Badge variant="secondary" className="text-xs">Cortesia</Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Settings;

