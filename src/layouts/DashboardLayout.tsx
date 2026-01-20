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
    Monitor,
    Search,
    Command,
    Store,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import '@/styles/dashboard.css';

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

import { PageTransition } from '@/components/layout/PageTransition';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import CommandPalette from '@/components/CommandPalette';


// Dialogs for Speed Dial
import NewOrderDialog from '@/components/orders/NewOrderDialog';
import NewCustomerDialog from '@/components/customers/NewCustomerDialog';
import ProductBuilder from '@/components/products/ProductBuilder';
import ProductionStatusWidget from '@/components/production/ProductionStatusWidget'; // New Widget

import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingOverlay } from '@/components/onboarding/OnboardingOverlay';

// ... imports remain ...

const DashboardLayout = () => {
    const { signOut, user, profile, loading } = useAuth();
    const { checkEligibility, isActive: isOnboardingActive, currentStep, nextStep } = useOnboarding();
    const navigate = useNavigate();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Global Dialog States
    const [isOrderOpen, setIsOrderOpen] = useState(false);
    const [isClientOpen, setIsClientOpen] = useState(false);
    const [isProductOpen, setIsProductOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    // Global keyboard shortcut for Command Palette removed as per user request

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
        if (user) {
            checkEligibility();
        }
    }, [user, checkEligibility]);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    // Redirecionar se não autenticado (após loading completo)
    if (!loading && !user) {
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
        { path: '/app/dashboard', label: 'Visão Geral', shortLabel: 'Visão', icon: LayoutDashboard, id: 'nav-dashboard' },
        { path: '/app/pedidos', label: 'Pedidos', shortLabel: 'Pedidos', icon: ShoppingBag, id: 'nav-pedidos' },
        { path: '/app/clientes', label: 'Clientes', shortLabel: 'Clientes', icon: Users, id: 'nav-clientes' },
        { path: '/app/produtos', label: 'Produtos', shortLabel: 'Produtos', icon: ShoppingBag, id: 'nav-produtos' },
        { path: '/app/agenda', label: 'Agenda', shortLabel: 'Agenda', icon: Calendar, id: 'nav-agenda' },
        { path: '/app/lista-inteligente', label: 'Lista Inteligente', shortLabel: 'Lista', icon: FileText, id: 'nav-smart-list' },
        { path: '/app/cardapio-digital', label: 'Cardápio Digital', shortLabel: 'Cardápio', icon: Store, id: 'nav-public-menu' },
        { path: '/app/aprender', label: 'Aprender', shortLabel: 'Aprender', icon: BookOpen, id: 'nav-aprender' },
        { path: '/app/settings', label: 'Configurações', shortLabel: 'Config', icon: Settings, id: 'nav-settings' },
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
        <div className="h-[100dvh] overflow-hidden bg-background flex flex-col md:flex-row">
            {/* Desktop Sidebar */}


            <aside className="hidden md:flex w-52 flex-col border-r bg-card h-full overflow-y-auto">
                <div className="p-6 border-b flex flex-col items-center justify-center shrink-0">
                    <img src="/images/logo-icon-2026.png" alt="Ícone Cozinha ao Lucro" className="h-24 w-auto drop-shadow-md" />
                </div>

                {/* Search Bar Removed as per user request */}

                <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const isSpecial = item.id === 'nav-painel';
                        return (
                            <Link
                                key={item.path}
                                id={item.id}
                                to={item.path}
                                onClick={() => {
                                    if (item.id === 'nav-produtos' && isOnboardingActive && currentStep === 'dashboard-overview') {
                                        nextStep();
                                    }
                                }}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-300 relative overflow-hidden group ${isSpecial
                                    ? 'bg-gradient-to-r from-blue-700 to-purple-800 text-white shadow-lg hover:shadow-blue-900/40 active:scale-[0.98] border border-white/10'
                                    : isActive(item.path)
                                        ? 'bg-primary text-primary-foreground shadow-md'
                                        : 'hover:bg-muted text-muted-foreground hover:text-foreground hover:translate-x-1'
                                    }`}
                            >
                                {isSpecial && (
                                    <div className={`absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite] pointer-events-none`} />
                                )}
                                <item.icon className="w-5 h-5" />
                                <span className={`font-medium ${isSpecial ? 'font-bold' : ''}`}>{item.label}</span>
                                {isSpecial && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t shrink-0 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <UserAvatar size="md" clickable />
                        <div className="flex-1 min-w-0">
                            <span className="font-bold text-sm truncate block">{firstName}</span>
                            <span className="text-xs text-muted-foreground">Plano Pro</span>
                        </div>
                    </div>

                    <div className="px-1">
                        <p className="text-xs text-muted-foreground truncate mb-2">{user?.email}</p>
                        <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-8" onClick={handleSignOut}>
                            <LogOut className="w-3 h-3" />
                            Sair
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden h-16 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <UserAvatar size="sm" clickable />
                    <span className="font-bold text-lg">{firstName}</span>
                </div>

                <div className="flex items-center gap-2">

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
                                {navItems.map((item) => {
                                    const isSpecial = item.id === 'nav-painel';
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.path)
                                                ? isSpecial
                                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                                    : 'bg-primary text-primary-foreground shadow-md'
                                                : isSpecial
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium">{item.label}</span>
                                        </Link>
                                    );
                                })}
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
            <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-32 relative safe-area-bottom">
                {/* Loading State - apenas no conteúdo, não na sidebar */}
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Carregando...</span>
                        </div>
                    </div>
                )}

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
                                    className="bg-orange-600 hover:bg-[hsl(182,16%,55%)] hover:text-white border-0 shadow-lg shadow-orange-600/20 whitespace-nowrap"
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
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t h-16 flex items-center justify-around z-30 px-2">
                {navItems.slice(0, 5).map((item) => (
                    <Link
                        key={item.path}
                        id={`mobile-${item.id}`} // Prefix to avoid duplicate IDs with sidebar if both render
                        to={item.path}
                        onClick={(e) => {
                            if (item.id === 'nav-produtos' && isOnboardingActive && currentStep === 'dashboard-overview') {
                                nextStep();
                            }
                        }}
                        className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${isActive(item.path)
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'fill-current' : ''}`} />
                        <span className="text-[9px] font-medium text-center leading-tight">{item.shortLabel}</span>
                    </Link>
                ))}            </nav>

            <SpeedDial
                onNewOrder={() => setIsOrderOpen(true)}
                onNewClient={() => setIsClientOpen(true)}
                onNewProduct={() => setIsProductOpen(true)}
                onNewIngredient={() => navigate('/app/produtos?tab=ingredients&action=new')}
            />

            <ProductionStatusWidget />

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

            {/* Command Palette Removed */}

            <OnboardingOverlay
                stepName="dashboard-overview"
                targetId="nav-produtos"
                message="Cadastre seu primeiro produto para começar a controlar seus custos e lucros."
                position="right"
            />
        </div >
    );
};

export default DashboardLayout;
