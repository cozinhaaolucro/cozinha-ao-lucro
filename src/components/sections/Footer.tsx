import { Instagram, Facebook, Youtube } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-footer text-footer-foreground pb-12 pt-20 relative mt-20">
            {/* Top Separator */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            <div className="container-max text-center relative">
                {/* Super Icon Bridge */}
                <div className="absolute -top-36 left-1/2 -translate-x-1/2 z-20">
                    <div className="w-36 h-36 bg-footer rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(46,92,107,0.6)] relative group transform hover:scale-110 transition-all duration-500 backface-hidden">
                        <img src="/images/logo-icon.png" alt="Cozinha ao Lucro" className="w-full h-full object-cover relative z-10" />
                    </div>
                </div>

                <div className="pt-6">
                    <p className="text-primary-foreground/90 text-sm mb-8 max-w-md mx-auto leading-relaxed">
                        Transformando cozinhas em negócios lucrativos. O conteúdo mais completo para quem quer empreender com gastronomia.
                    </p>
                    <div className="flex justify-center gap-6 mb-8">
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

                    <div className="flex justify-center gap-8 text-sm text-white/70 mb-8">
                        <a href="#" className="hover:text-white transition-colors duration-300">Termos de Uso</a>
                        <a href="#" className="hover:text-white transition-colors duration-300">Política de Privacidade</a>
                        <a href="#" className="hover:text-white transition-colors duration-300">Contato</a>
                    </div>
                    <div className="text-white/50 text-sm">
                        © 2025 Cozinha ao Lucro. Todos os direitos reservados.
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
