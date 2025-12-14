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
    Store,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager';

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
                    <TabsTrigger value="menu" className="gap-2">
                        <Store className="w-4 h-4" />
                        Cardápio
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
                <TabsContent value="subscription">
                    <SubscriptionManager />
                </TabsContent>

                {/* Digital Menu Tab */}
                <TabsContent value="menu" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cardápio Digital</CardTitle>
                            <CardDescription>
                                Compartilhe seu menu com seus clientes e receba pedidos no WhatsApp.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-muted p-4 rounded-lg flex items-center justify-between gap-4">
                                <div className="truncate flex-1 font-mono text-sm bg-background p-2 rounded border">
                                    {window.location.origin}/menu/{user?.id}
                                </div>
                                <Button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/menu/${user?.id}`);
                                        toast.success('Link copiado!');
                                    }}
                                    variant="secondary"
                                >
                                    Copiar
                                </Button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="border rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                                        {/* Placeholder for QR Code */}
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/menu/${user?.id}`)}`}
                                            alt="QR Code"
                                            className="w-full h-full object-contain mix-blend-multiply"
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground">Escaneie para testar</p>
                                    <Button variant="outline" className="w-full" onClick={() => window.open(`/menu/${user?.id}`, '_blank')}>
                                        Abrir Cardápio
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        Como funciona?
                                    </h4>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li>1. Seus produtos ativos aparecem automaticamente.</li>
                                        <li>2. O cliente monta o pedido no link.</li>
                                        <li>3. Ao finalizar, o pedido chega pronto no seu WhatsApp.</li>
                                        <li>4. Você combina o pagamento e entrega diretamente.</li>
                                    </ul>
                                    <div className="bg-orange-50 text-orange-800 p-4 rounded-lg text-sm">
                                        <p className="font-semibold mb-1">Dica:</p>
                                        Adicione o link na bio do seu Instagram para vender mais!
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

