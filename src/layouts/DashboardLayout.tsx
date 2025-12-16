
import { useState, useEffect, useRef, Suspense } from 'react';
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
    Loader2,
    Bell,
    X,
    ShoppingCart,
    Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

import { useNotifications } from '@/contexts/NotificationContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SubscriptionBlocker } from '@/components/subscription/SubscriptionBlocker';
import { SpeedDial } from '@/components/layout/SpeedDial';
import { TourGuide } from '@/components/onboarding/TourGuide';
import { PageTransition } from '@/components/layout/PageTransition';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Dialogs for Speed Dial
import NewOrderDialog from '@/components/orders/NewOrderDialog';
import NewCustomerDialog from '@/components/customers/NewCustomerDialog';
import ProductBuilder from '@/components/products/ProductBuilder';
import NewIngredientDialog from '@/components/products/NewIngredientDialog';

const DashboardLayout = () => {
    const { signOut, user, profile, loading } = useAuth();
    const { unreadCount, markAllAsRead, notifications } = useNotifications();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Global Dialog States
    const [isOrderOpen, setIsOrderOpen] = useState(false);
    const [isClientOpen, setIsClientOpen] = useState(false);
    const [isProductOpen, setIsProductOpen] = useState(false);
    const [isIngredientOpen, setIsIngredientOpen] = useState(false);

    // Trial Logic
    const created = user?.created_at ? new Date(user.created_at) : new Date();
    const now = new Date();
    const trialDays = 7;
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = trialDays - Math.ceil(Math.abs(now.getTime() - created.getTime()) / msPerDay);
    const isTrialExpired = daysRemaining <= 0;
    const hasActiveSubscription = profile?.subscription_status === 'active';
    const isBlocked = isTrialExpired && !hasActiveSubscription;
    const showBanner = !isBlocked && daysRemaining <= 3 && !hasActiveSubscription;

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

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Redirecionando para login...</span>
                </div>
            </div>
        );
    }

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
        { path: '/app/dashboard', label: 'Visão Geral', icon: LayoutDashboard, id: 'nav-dashboard' },
        { path: '/app/painel', label: 'Produção em Tempo Real', icon: Monitor, id: 'nav-painel' },
        { path: '/app/pedidos', label: 'Pedidos', icon: ShoppingBag, id: 'nav-pedidos' },
        { path: '/app/clientes', label: 'Clientes', icon: Users, id: 'nav-clientes' },
        { path: '/app/produtos', label: 'Produtos', icon: ShoppingBag, id: 'nav-produtos' },
        { path: '/app/agenda', label: 'Agenda', icon: Calendar, id: 'nav-agenda' },
        { path: '/app/aprender', label: 'Aprender', icon: BookOpen, id: 'nav-aprender' },
        { path: '/app/settings', label: 'Configurações', icon: Settings, id: 'nav-settings' },
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

    const NotificationBell = () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notificações</span>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => markAllAsRead()} className="h-auto px-2 py-0.5 text-xs text-muted-foreground hover:text-primary">
                            Marcar lidas
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                            <Bell className="w-8 h-8 opacity-20" />
                            <p>Nenhuma notificação nova</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <DropdownMenuItem key={notif.id} className="cursor-pointer flex flex-col items-start gap-1 p-3 focus:bg-muted/50">
                                <span className={`font-medium text-sm ${!notif.read ? 'text-primary' : ''}`}>{notif.title}</span>
                                <span className="text-xs text-muted-foreground line-clamp-2">{notif.message}</span>
                                <span className="text-[10px] text-muted-foreground/60 w-full text-right mt-1">
                                    {new Date(notif.created_at).toLocaleDateString()}
                                </span>
                            </DropdownMenuItem>
                        ))
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <TourGuide />
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
                            id={item.id}
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

                <div className="flex items-center gap-2">
                    <NotificationBell />
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
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 animate-in fade-in-0 duration-300 relative">
                <div className="hidden md:flex absolute top-6 right-8 z-10">
                    <NotificationBell />
                </div>
                {/* Content Logic: Mutually Exclusive */}
                {!isBlocked ? (
                    <>
                        {/* Subscription Banner (Only for active users w/ generic trial ending soon) */}
                        {showBanner && (
                            <div className="mb-6 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center flex-shrink-0">
                                        <Loader2 className="w-5 h-5 text-orange-700 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-orange-900">
                                            {isTrialExpired ? 'Seu período gratuito acabou!' : `Seu período gratuito acaba em ${daysRemaining} dias!`}
                                        </h3>
                                        <p className="text-sm text-orange-800">
                                            {isTrialExpired ? 'Para continuar acessando seus dados e recursos, ative sua assinatura.' : 'Garanta o acesso contínuo às suas ferramentas de gestão.'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={async () => {
                                        try {
                                            const { iniciarPagamento } = await import('@/lib/pagamento');
                                            await iniciarPagamento();
                                        } catch (error) {
                                            console.error('Erro ao iniciar pagamento:', error);
                                        }
                                    }}
                                    className="bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-lg shadow-orange-600/20 whitespace-nowrap"
                                >
                                    Assinar Agora
                                </Button>
                            </div>
                        )}

                        <PageTransition key={location.pathname}>
                            <ErrorBoundary>
                                <Outlet />
                            </ErrorBoundary>
                        </PageTransition>
                    </>
                ) : null}
            </main>

            {/* Render Blocker OUTSIDE main if blocked */}
            {isBlocked && <SubscriptionBlocker />}



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

            <SpeedDial
                onNewOrder={() => setIsOrderOpen(true)}
                onNewClient={() => setIsClientOpen(true)}
                onNewProduct={() => setIsProductOpen(true)}
                onNewIngredient={() => setIsIngredientOpen(true)}
            />

            <NewOrderDialog
                open={isOrderOpen}
                onOpenChange={setIsOrderOpen}
                onSuccess={() => {
                    setIsOrderOpen(false);
                    if (location.pathname.includes('pedidos')) window.location.reload();
                }}
            />
            <NewCustomerDialog
                open={isClientOpen}
                onOpenChange={setIsClientOpen}
                onSuccess={() => {
                    setIsClientOpen(false);
                    if (location.pathname.includes('clientes')) window.location.reload();
                }}
            />
            <ProductBuilder
                open={isProductOpen}
                onOpenChange={setIsProductOpen}
                onSuccess={() => {
                    setIsProductOpen(false);
                    if (location.pathname.includes('produtos')) window.location.reload();
                }}
            />
            <NewIngredientDialog
                open={isIngredientOpen}
                onOpenChange={setIsIngredientOpen}
                onSuccess={() => {
                    setIsIngredientOpen(false);
                    if (location.pathname.includes('produtos')) window.location.reload();
                }}
            />


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
        </div >
    );
};

export default DashboardLayout;
