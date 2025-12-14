import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
    const { user } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        setIsMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            const offset = 80; // Altura da navbar
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${isScrolled
                ? 'bg-background/80 backdrop-blur-md border-border/40 shadow-sm py-3'
                : 'bg-transparent border-transparent py-5'
                }`}
        >
            <div className="container-max px-4 md:px-8 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <div className="relative">
                        <div className="absolute inset-2 shadow-[0_0_30px_hsl(var(--primary)/0.6)] bg-transparent rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                        <img
                            src="/images/logo_circle.png"
                            alt="Logo"
                            className="relative h-20 w-auto object-contain"
                        />
                    </div>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex items-center gap-6 bg-background/5 backdrop-blur-sm px-6 py-2 rounded-full border border-white/5">
                        {[
                            { label: 'Preços', id: 'precos' },
                            { label: 'Benefícios', id: 'beneficios' },
                            { label: 'FAQ', id: 'faq' }
                        ].map((item) => (
                            <button
                                key={item.label}
                                onClick={() => scrollToSection(item.id)}
                                className={`text-sm font-medium transition-all hover:text-primary ${isScrolled ? 'text-foreground/80' : 'text-white/90 hover:text-white'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate(user ? '/app/dashboard' : '/login')}
                            className={`font-medium gap-2 hover:bg-white/10 ${isScrolled ? 'text-foreground' : 'text-white'}`}
                        >
                            {user ? 'Dashboard' : 'Entrar'}
                        </Button>
                        <Button
                            onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 text-white font-bold shadow-lg hover:shadow-primary/25 transition-all transform hover:-translate-y-0.5 px-6 rounded-full"
                        >
                            Começar Agora
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className={`md:hidden p-2 ${isScrolled ? 'text-foreground' : 'text-white'}`}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-2xl border-b border-border p-6 md:hidden flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top-5">
                        {[
                            { label: 'Preços', id: 'precos' },
                            { label: 'Benefícios', id: 'beneficios' },
                            { label: 'FAQ', id: 'faq' }
                        ].map((item) => (
                            <button
                                key={item.label}
                                onClick={() => scrollToSection(item.id)}
                                className="text-lg font-medium text-foreground/80 hover:text-primary text-left py-3 border-b border-border/50"
                            >
                                {item.label}
                            </button>
                        ))}
                        <Button
                            onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full mt-4 bg-gradient-to-r from-primary to-orange-600 text-white font-bold py-6 rounded-xl shadow-lg"
                        >
                            QUERO COMEÇAR
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate(user ? '/app/dashboard' : '/login')}
                            className="w-full gap-2 py-6"
                        >
                            <UserCircle className="w-5 h-5" />
                            {user ? 'Dashboard' : 'Área do Aluno'}
                        </Button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
