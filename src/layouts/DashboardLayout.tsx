
import { useState, useEffect, useRef, memo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    Calendar,
    BookOpen,
    LogOut,
    Menu,
    Settings,
    Camera,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const DashboardLayout = () => {
    const { signOut, user, loading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Carregando...</span>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    // Get user display name (first name only)
    const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
    const firstName = fullName.split(' ')[0];
    const avatarUrl = user?.user_metadata?.avatar_url;

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
            setIsPhotoDialogOpen(false);
            // Force reload to get new avatar
            window.location.reload();
        } catch (error) {
            console.error('Error uploading photo:', error);
            toast.error('Erro ao atualizar foto');
        } finally {
            setUploading(false);
        }
    };

    const navItems = [
        { path: '/app/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
        { path: '/app/pedidos', label: 'Pedidos', icon: ShoppingBag },
        { path: '/app/clientes', label: 'Clientes', icon: Users },
        { path: '/app/produtos', label: 'Produtos', icon: ShoppingBag },
        { path: '/app/agenda', label: 'Agenda', icon: Calendar },
        { path: '/app/aprender', label: 'Aprender', icon: BookOpen },
        { path: '/app/settings', label: 'Configurações', icon: Settings },
    ];

    const isActive = (path: string) => location.pathname === path;

    const UserAvatar = ({ size = 'md', clickable = false }: { size?: 'sm' | 'md' | 'lg', clickable?: boolean }) => {
        const sizeClasses = {
            sm: 'w-8 h-8',
            md: 'w-10 h-10',
            lg: 'w-16 h-16'
        };

        return (
            <div
                className={`${sizeClasses[size]} rounded-full overflow-hidden ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all' : ''} bg-primary/10 flex items-center justify-center`}
                onClick={clickable ? () => setIsPhotoDialogOpen(true) : undefined}
            >
                {avatarUrl ? (
                    <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-primary font-bold text-sm">{firstName.charAt(0).toUpperCase()}</span>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
                <div className="p-6 border-b flex items-center gap-3">
                    <UserAvatar size="md" clickable />
                    <div className="flex-1 min-w-0">
                        <span className="font-bold text-lg truncate block">{firstName}</span>
                        <span className="text-xs text-muted-foreground">Plano Pro</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.path)
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'hover:bg-muted text-muted-foreground hover:text-foreground hover:translate-x-1'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t">
                    <div className="mb-4 px-4">
                        <p className="text-sm font-medium truncate">{user?.email}</p>
                    </div>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={handleSignOut}>
                        <LogOut className="w-4 h-4" />
                        Sair
                    </Button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden h-16 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <UserAvatar size="sm" clickable />
                    <span className="font-bold text-lg">{firstName}</span>
                </div>

                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-6 h-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72">
                        <div className="p-6 border-b flex items-center gap-3">
                            <UserAvatar size="md" />
                            <div className="flex-1 min-w-0">
                                <span className="font-bold text-lg truncate block">{firstName}</span>
                                <span className="text-xs text-muted-foreground">Plano Pro</span>
                            </div>
                        </div>
                        <nav className="flex-1 p-4 space-y-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.path)
                                        ? 'bg-primary text-primary-foreground shadow-md'
                                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            ))}
                            <div className="pt-4 mt-4 border-t">
                                <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleSignOut}>
                                    <LogOut className="w-4 h-4" />
                                    Sair
                                </Button>
                            </div>
                        </nav>
                    </SheetContent>
                </Sheet>
            </header>

            {/* Main Content with smooth transition */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 animate-in fade-in-0 duration-300">
                <Outlet />
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t h-16 flex items-center justify-around z-50 px-2">
                {navItems.slice(0, 5).map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive(item.path)
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Photo Upload Dialog */}
            <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Alterar Foto do Perfil</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-6 py-4">
                        <div className="relative">
                            <UserAvatar size="lg" />
                            <div
                                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full"
                        >
                            {uploading ? 'Enviando...' : 'Escolher Nova Foto'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DashboardLayout;

