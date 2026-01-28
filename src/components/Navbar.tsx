import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
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
        <nav className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-300 ${isScrolled ? 'bg-background/95 backdrop-blur-md border-b border-border/10 shadow-sm' : 'bg-transparent border-b border-transparent'}`}>
            <div className="container-max flex items-center justify-between h-full">

                {/* Logo Area */}
                <div
                    className="h-full py-1 w-auto cursor-pointer flex items-center relative z-10"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <img
                        src="/images/logo-logotipo-2026.png"
                        alt="Cozinha ao Lucro"
                        className="h-full w-auto object-contain scale-[2.0] origin-top-left -translate-y-6"
                    />
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <button
                        onClick={() => scrollToSection('precos')}
                        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                        Preços
                    </button>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/login')}
                            className="font-semibold text-sm text-muted-foreground hover:text-primary"
                        >
                            Entrar
                        </Button>
                        <Button
                            onClick={() => navigate('/register')}
                            className="bg-gradient-to-r from-[hsla(186,35%,28%,1)] to-[hsla(187,29%,58%,1)] hover:from-[hsla(186,35%,20%,1)] hover:to-[hsla(187,29%,50%,1)] text-white font-bold px-5 py-2 h-9 text-sm shadow-md transition-all duration-300 hover:scale-105"
                        >
                            Testar Grátis
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu Actions */}
                <div className="md:hidden flex items-center gap-4">
                    <button
                        className="p-2 text-foreground/80 hover:text-primary transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Abrir menu"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="absolute top-[64px] left-0 right-0 bg-background/98 backdrop-blur-xl border-t border-border/10 p-6 md:hidden flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top-2">
                        <button
                            onClick={() => scrollToSection('precos')}
                            className="text-lg font-medium text-foreground py-4 border-b border-border/5 text-left"
                        >
                            Preços
                        </button>

                        <div className="flex flex-col gap-3 mt-2">
                            <Button
                                onClick={() => navigate('/register')}
                                className="w-full bg-gradient-to-r from-[hsla(186,35%,28%,1)] to-[hsla(187,29%,58%,1)] hover:from-[hsla(186,35%,20%,1)] hover:to-[hsla(187,29%,50%,1)] text-white font-bold h-12 text-lg shadow-md transition-all duration-300"
                            >
                                Testar Grátis
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/login')}
                                className="w-full h-12 text-lg border-2"
                            >
                                Entrar
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
