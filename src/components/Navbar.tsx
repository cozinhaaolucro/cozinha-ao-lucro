import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, UserCircle } from 'lucide-react';
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
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-background/80 backdrop-blur-md shadow-sm py-4'
                : 'bg-transparent py-6'
                }`}
        >
            <div className="container-max px-4 md:px-8 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <img
                        src="/images/logo_cozinhaaolucro.png"
                        alt="Logo"
                        className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                    />
                    <span className={`font-bold text-xl font-playfair ${isScrolled ? 'text-foreground' : 'text-white drop-shadow-md'}`}>
                        Cozinha ao Lucro
                    </span>
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {['Benefícios', 'Depoimentos', 'FAQ'].map((item) => (
                        <button
                            key={item}
                            onClick={() => scrollToSection(item.toLowerCase())}
                            className={`text-sm font-medium transition-colors hover:text-primary ${isScrolled ? 'text-foreground/80' : 'text-white/90 hover:text-white'
                                }`}
                        >
                            {item}
                        </button>
                    ))}
                    <Button
                        onClick={() => window.open('https://pay.kiwify.com.br/TV099tr', '_blank')}
                        className="bg-primary hover:bg-primary-glow text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    >
                        COMPRAR AGORA
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/login')}
                        className={`font-medium gap-2 ${isScrolled ? 'text-foreground hover:bg-primary/10' : 'text-white hover:bg-white/10 hover:text-white'}`}
                    >
                        <UserCircle className="w-5 h-5" />
                        Entrar
                    </Button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-primary"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} className={isScrolled ? 'text-foreground' : 'text-white'} />}
                </button>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border p-6 md:hidden flex flex-col gap-4 shadow-xl animate-in slide-in-from-top-5">
                        {['Benefícios', 'Depoimentos', 'FAQ'].map((item) => (
                            <button
                                key={item}
                                onClick={() => scrollToSection(item.toLowerCase())}
                                className="text-lg font-medium text-foreground/80 hover:text-primary text-left py-2 border-b border-border/50"
                            >
                                {item}
                            </button>
                        ))}
                        <Button
                            onClick={() => window.open('https://pay.kiwify.com.br/TV099tr', '_blank')}
                            className="w-full mt-4 bg-primary text-primary-foreground font-bold py-6"
                        >
                            COMPRAR AGORA
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/login')}
                            className="w-full gap-2"
                        >
                            <UserCircle className="w-5 h-5" />
                            Área do Aluno
                        </Button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
