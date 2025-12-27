import { useState, useRef, useEffect } from 'react';
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
import {
    User,
    CreditCard,
    CheckCircle,
    Mail,
    Lock,
    Camera,
    Phone,
    Store,
    Image as ImageIcon,
    Save
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
    const logoInputRef = useRef<HTMLInputElement>(null);

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

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !profile) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo_${user.id}_${Date.now()}.${fileExt}`;

            // Using product-images bucket for public access as configured
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

            const publicUrl = data.publicUrl;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setProfile({ ...profile, logo_url: publicUrl });
            toast.success('Logo atualizada com sucesso!');
        } catch (error) {
            console.error('Error uploading logo:', error);
            toast.error('Erro ao atualizar logo');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveMenuSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (!user || !profile) return;

        const formData = new FormData(e.target as HTMLFormElement);
        const businessName = formData.get('business_name') as string;
        const description = formData.get('description') as string;
        let slug = formData.get('slug') as string;
        slug = slug ? slug.toLowerCase().replace(/[^a-z0-9-]/g, '') : ''; // Sanitize

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    business_name: businessName,
                    description: description,
                    slug: slug || null,
                    facebook_pixel_id: formData.get('facebook_pixel_id') as string || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) {
                if (error.code === '23505') { // Unique violation
                    throw new Error('Este link personalizado já está em uso. Escolha outro.');
                }
                throw error;
            }

            setProfile({
                ...profile,
                business_name: businessName,
                description,
                slug: slug || null,
                facebook_pixel_id: formData.get('facebook_pixel_id') as string || null
            });
            toast.success('Configurações do cardápio salvas!');
        } catch (error) {
            console.error('Error saving menu settings:', error);
            toast.error('Erro ao salvar configurações');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-muted-foreground">Gerencie sua conta, assinatura e cardápio.</p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
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
                <TabsContent value="menu" className="space-y-2">
                    <Card>
                        <CardHeader className="p-3 sm:p-6 pb-2">
                            <CardTitle className="text-sm sm:text-xl">Cardápio Digital</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-6 pt-0">
                            <form onSubmit={handleSaveMenuSettings} className="space-y-2">
                                {/* Logo - inline */}
                                <div className="flex items-center gap-3 p-2 border rounded-lg bg-muted/20">
                                    <div className="relative group">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-background border flex items-center justify-center">
                                            {profile?.logo_url ? (
                                                <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <Store className="w-5 h-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => logoInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-white text-[10px]"
                                            disabled={uploading}
                                        >
                                            Alterar
                                        </button>
                                    </div>
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleLogoUpload}
                                    />
                                    <span className="text-xs text-muted-foreground">Clique para alterar</span>
                                </div>

                                {/* Name */}
                                <div>
                                    <Label htmlFor="business_name" className="text-xs">Nome do Estabelecimento</Label>
                                    <Input
                                        id="business_name"
                                        name="business_name"
                                        defaultValue={profile?.business_name || ''}
                                        placeholder="Ex: Doces da Maria"
                                        className="h-8"
                                        required
                                    />
                                </div>

                                {/* Slug */}
                                <div>
                                    <Label htmlFor="slug" className="text-xs">Link Personalizado</Label>
                                    <Input
                                        id="slug"
                                        name="slug"
                                        defaultValue={profile?.slug || ''}
                                        placeholder="doces-da-maria"
                                        className="h-8"
                                        pattern="^[a-z0-9-]+$"
                                    />
                                </div>


                                {/* Description */}
                                <div>
                                    <Label htmlFor="description" className="text-xs">Descrição</Label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        defaultValue={profile?.description || ''}
                                        className="flex min-h-[50px] w-full rounded-md border border-input bg-background px-2 py-1 text-xs resize-none"
                                        placeholder="Os melhores doces artesanais..."
                                    />
                                </div>

                                {/* Facebook Pixel */}
                                <div>
                                    <Label htmlFor="facebook_pixel_id" className="text-xs">Facebook Pixel ID</Label>
                                    <Input
                                        id="facebook_pixel_id"
                                        name="facebook_pixel_id"
                                        defaultValue={profile?.facebook_pixel_id || ''}
                                        placeholder="Ex: 1234567890"
                                        className="h-8"
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        Adicione o ID do seu Pixel para rastrear visitas no cardápio.
                                    </p>
                                </div>

                                <Button type="submit" disabled={loading} className="w-full h-8 text-sm">
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar Alterações
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Sharing Card */}
                    <Card>
                        <CardHeader className="p-3 sm:p-6 pb-2">
                            <CardTitle className="text-sm sm:text-xl">Compartilhar</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-6 pt-0 space-y-3">
                            <div className="bg-muted p-2 rounded-lg flex items-center justify-between gap-2">
                                <div className="truncate flex-1 font-mono text-xs bg-background p-1.5 rounded border">
                                    {window.location.origin}/menu/{profile?.slug || user?.id}
                                </div>
                                <Button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/menu/${profile?.slug || user?.id}`);
                                        toast.success('Link copiado!');
                                    }}
                                    variant="secondary"
                                    size="sm"
                                    className="h-7 text-xs"
                                >
                                    Copiar
                                </Button>
                            </div>

                            <div className="flex flex-col items-center text-center space-y-2">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white p-1 rounded-lg border shadow-sm">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/menu/${profile?.slug || user?.id}`)}`}
                                        alt="QR Code"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <Button variant="outline" className="w-full" onClick={() => window.open(`/menu/${profile?.slug || user?.id}`, '_blank')}>
                                    <Store className="w-4 h-4 mr-2" />
                                    Visualizar Cardápio Público
                                </Button>
                                {profile?.slug && (
                                    <p className="text-xs text-muted-foreground">
                                        Seu link personalizado está ativo!
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
};

export default Settings;
