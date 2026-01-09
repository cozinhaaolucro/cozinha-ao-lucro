import { Instagram, Facebook, Youtube } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-footer text-footer-foreground pb-6 pt-8 relative mt-4">
            {/* Top Separator */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <div className="max-w-sm mx-auto text-center relative px-6">
                <div className="flex flex-col items-center">
                    {/* Footer Icon - 1.5x */}
                    <div className="w-48 h-48 transform hover:scale-105 transition-all duration-500">
                        <img src="/images/footer-icon.png" alt="Cozinha ao Lucro" className="w-full h-full object-contain drop-shadow-lg" />
                    </div>

                    {/* Brand Logo - 4x, positioned right below icon */}
                    <img
                        src="/images/logo-full.png"
                        alt="Cozinha ao Lucro"
                        className="h-40 w-auto -mt-20 mb-2"
                    />

                    <p className="text-primary-foreground/90 text-sm mb-4 max-w-md mx-auto leading-relaxed">
                        Transformando cozinhas em negócios lucrativos. O conteúdo mais completo para quem quer empreender com gastronomia.
                    </p>
                    <div className="flex justify-center gap-6 mb-4">
                        <a
                            href="https://www.instagram.com/cozinhaaolucro/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-primary transition-all duration-300 group"
                            aria-label="Instagram"
                        >
                            <Instagram className="w-5 h-5 text-white/90 group-hover:text-primary" />
                        </a>
                        <a
                            href="https://www.facebook.com/people/Cozinha-ao-Lucro/61583806174158/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-primary transition-all duration-300 group"
                            aria-label="Facebook"
                        >
                            <Facebook className="w-5 h-5 text-white/90 group-hover:text-primary" />
                        </a>
                        <a
                            href="https://www.youtube.com/channel/UCdOdbJ6g-hK7ktwB_sB1e0g"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-primary transition-all duration-300 group"
                            aria-label="YouTube"
                        >
                            <Youtube className="w-5 h-5 text-white/90 group-hover:text-primary" />
                        </a>
                    </div>

                    <div className="flex justify-center gap-6 text-xs text-white/70 mb-3">
                        <a href="#" className="hover:text-white transition-colors duration-300">Termos de Uso</a>
                        <a href="#" className="hover:text-white transition-colors duration-300">Privacidade</a>
                        <a href="#" className="hover:text-white transition-colors duration-300">Contato</a>
                    </div>
                    <div className="text-white/50 text-xs">
                        © 2025 Cozinha ao Lucro. Todos os direitos reservados.
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
