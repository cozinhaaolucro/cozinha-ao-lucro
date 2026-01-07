import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
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
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'py-4' : 'py-6'}`}
        >
            <div className="max-w-[1600px] mx-auto px-6 md:px-12 flex items-center justify-between pointer-events-none">
                {/* Logo Transformation */}
                <div
                    className={`flex items-center cursor-pointer relative transition-all duration-500 z-10 pointer-events-auto effect-logo-shine ${isScrolled ? 'h-12 w-12' : 'h-16 w-32 md:h-24 md:w-48'
                        }`}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    {/* Full Logo */}
                    <img
                        src="/images/logo-full.png"
                        alt="Cozinha ao Lucro"
                        className={`absolute left-0 top-1/2 -translate-y-1/2 transition-all duration-500 object-contain w-full h-full ${isScrolled ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100 md:scale-[1.3]'
                            }`}
                    />

                    {/* Icon Logo */}
                    <img
                        src="/images/logo-icon.png"
                        alt="Icone"
                        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 object-contain h-full w-auto drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] ${isScrolled ? 'opacity-100 scale-100 md:scale-[1.3]' : 'opacity-0 scale-50 pointer-events-none'
                            }`}
                    />
                </div>

                {/* Desktop Menu - Minimal / Minibar */}
                <div
                    className={`hidden md:flex items-center gap-8 transition-all duration-500 pointer-events-auto
                    ${isScrolled
                            ? 'bg-white/80 backdrop-blur-md shadow-lg rounded-full px-8 py-3 border border-white/20'
                            : 'bg-transparent p-0 border-transparent'
                        }`}
                >
                    <div className="flex items-center gap-6">
                        {[
                            { label: 'Preços', id: 'precos' },
                            { label: 'FAQ', id: 'faq' }
                        ].map((item) => (
                            <button
                                key={item.label}
                                onClick={() => scrollToSection(item.id)}
                                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors font-heading tracking-wide"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/login')}
                            className="text-sm font-medium"
                        >
                            Entrar
                        </Button>
                        <Button
                            onClick={() => navigate('/register')}
                            className="text-sm font-medium bg-primary hover:bg-primary/90"
                        >
                            Começar Grátis
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-foreground"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-md shadow-lg p-6 md:hidden flex flex-col gap-3 border-t border-white/10 animate-in slide-in-from-top-2">
                        {[
                            { label: 'Preços', id: 'precos' },
                            { label: 'FAQ', id: 'faq' }
                        ].map((item) => (
                            <button
                                key={item.label}
                                onClick={() => scrollToSection(item.id)}
                                className="text-base font-medium text-foreground/90 hover:text-primary text-left py-3 border-b border-white/5"
                            >
                                {item.label}
                            </button>
                        ))}
                        <div className="h-4"></div>
                        <Button
                            onClick={() => navigate('/register')}
                            className="w-full btn-primary"
                        >
                            Começar Grátis
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/login')}
                            className="w-full hover:bg-white/5"
                        >
                            Entrar
                        </Button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
