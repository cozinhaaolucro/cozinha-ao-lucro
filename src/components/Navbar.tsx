import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, ChefHat } from 'lucide-react';
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
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'bg-white/95 backdrop-blur-sm shadow-sm py-3'
                    : 'bg-transparent py-4'
                }`}
        >
            <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
                {/* Logo - Clean & Minimal */}
                <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <img
                        src="/images/logo_circle.png"
                        alt="Cozinha ao Lucro"
                        className="h-12 w-auto"
                    />
                </div>

                {/* Desktop Menu - Minimal */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex items-center gap-6">
                        {[
                            { label: 'Preços', id: 'precos' },
                            { label: 'FAQ', id: 'faq' }
                        ].map((item) => (
                            <button
                                key={item.label}
                                onClick={() => scrollToSection(item.id)}
                                className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
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
                    <div className="absolute top-full left-0 right-0 bg-white shadow-lg p-6 md:hidden flex flex-col gap-3 border-t">
                        {[
                            { label: 'Preços', id: 'precos' },
                            { label: 'FAQ', id: 'faq' }
                        ].map((item) => (
                            <button
                                key={item.label}
                                onClick={() => scrollToSection(item.id)}
                                className="text-base font-medium text-foreground/80 hover:text-primary text-left py-2"
                            >
                                {item.label}
                            </button>
                        ))}
                        <hr className="my-2" />
                        <Button
                            onClick={() => navigate('/register')}
                            className="w-full"
                        >
                            Começar Grátis
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/login')}
                            className="w-full"
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
