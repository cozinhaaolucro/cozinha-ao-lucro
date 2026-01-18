import { Instagram, Facebook, Youtube } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-footer text-footer-foreground pb-6 pt-8 relative mt-4">
            {/* Top Separator */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <div className="max-w-md mx-auto text-center relative px-6">
                <div className="flex flex-col items-center">
                    {/* Brand Logo */}
                    <img
                        src="/images/logo-footer.png"
                        alt="Cozinha ao Lucro"
                        className="h-52 w-auto mb-8 opacity-90"
                    />

                    <div className="flex justify-center gap-4 mb-6">
                        <a
                            href="https://www.instagram.com/cozinhaaolucro/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300 group"
                            aria-label="Instagram"
                        >
                            <Instagram className="w-5 h-5 text-white/70 group-hover:text-white" />
                        </a>
                        <a
                            href="https://www.facebook.com/people/Cozinha-ao-Lucro/61583806174158/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300 group"
                            aria-label="Facebook"
                        >
                            <Facebook className="w-5 h-5 text-white/70 group-hover:text-white" />
                        </a>
                        <a
                            href="https://www.youtube.com/channel/UCdOdbJ6g-hK7ktwB_sB1e0g"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300 group"
                            aria-label="YouTube"
                        >
                            <Youtube className="w-5 h-5 text-white/70 group-hover:text-white" />
                        </a>
                    </div>

                    <div className="flex justify-center gap-6 text-xs text-white/50 mb-4 font-medium">
                        <a href="#" className="hover:text-white transition-colors duration-300">Termos de Uso</a>
                        <a href="#" className="hover:text-white transition-colors duration-300">Privacidade</a>
                        <a href="#" className="hover:text-white transition-colors duration-300">Contato</a>
                    </div>
                    <div className="text-white/30 text-xs">
                        © 2026 Cozinha ao Lucro. Todos os direitos reservados.
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
