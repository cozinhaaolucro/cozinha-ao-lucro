import { Instagram, Facebook, Youtube } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-background text-foreground pb-12 pt-16 relative">
            {/* Top Separator - Removed as we have border-t now */}

            <div className="max-w-md mx-auto text-center relative px-6">
                <div className="flex flex-col items-center">
                    {/* Brand Logo */}
                    <img
                        src="/images/logo-footer-2026.png"
                        alt="Cozinha ao Lucro"
                        className="h-28 w-auto mb-8 opacity-100"
                    />

                    <div className="flex justify-center gap-4 mb-8">
                        <a
                            href="https://www.instagram.com/cozinhaaolucro/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-muted hover:bg-primary/10 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 group"
                            aria-label="Instagram"
                        >
                            <Instagram className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </a>
                        <a
                            href="https://www.facebook.com/people/Cozinha-ao-Lucro/61583806174158/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-muted hover:bg-primary/10 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 group"
                            aria-label="Facebook"
                        >
                            <Facebook className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </a>
                        <a
                            href="https://www.youtube.com/channel/UCdOdbJ6g-hK7ktwB_sB1e0g"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-muted hover:bg-primary/10 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 group"
                            aria-label="YouTube"
                        >
                            <Youtube className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </a>
                    </div>

                    <div className="flex justify-center gap-6 text-sm text-muted-foreground mb-4 font-medium">
                        <a href="#" className="hover:text-primary transition-colors duration-300">Termos de Uso</a>
                        <a href="#" className="hover:text-primary transition-colors duration-300">Privacidade</a>
                        <a href="#" className="hover:text-primary transition-colors duration-300">Contato</a>
                    </div>
                    <div className="text-muted-foreground/60 text-xs">
                        © 2026 Cozinha ao Lucro. Todos os direitos reservados.
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
