import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    User,
    CreditCard,
    CheckCircle,
    Mail,
    Lock,
    Camera,
    Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager';
import { Profile } from '@/types/database';

const Settings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const currentTab = searchParams.get('tab') || 'general';

    const handleTabChange = (value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('tab', value);
            return newParams;
        });
    };

    // Initial load of profile data
    useEffect(() => {
        if (user) {
            supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
                .then(({ data }) => {
                    if (data) setProfile(data);
                });
        }
    }, [user]);

    // Get user data
    const fullName = user?.user_metadata?.full_name || '';
    const phone = user?.user_metadata?.phone || '';
    const avatarUrl = user?.user_metadata?.avatar_url;

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

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-40 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div></div>

            <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
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
                <TabsContent value="subscription">
                    <SubscriptionManager />
                </TabsContent>
            </Tabs>
        </div >
    );
};

export default Settings;
