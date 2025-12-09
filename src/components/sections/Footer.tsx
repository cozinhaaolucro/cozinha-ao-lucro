import { Instagram, Facebook, Youtube } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-foreground text-background py-12 border-t border-white/10">
            <div className="container-max text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center shadow-glow">
                        <span className="text-primary-foreground font-bold text-lg">CL</span>
                    </div>
                </div>
                <p className="text-white/70 text-sm mb-8 max-w-md mx-auto leading-relaxed">
                    Transformando cozinhas em negócios lucrativos. O conteúdo mais completo para quem quer empreender com gastronomia.
                </p>
                <div className="flex justify-center gap-6 mb-8">
                    <a
                        href="https://www.instagram.com/cozinhaaolucro/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 group"
                        aria-label="Instagram"
                    >
                        <Instagram className="w-5 h-5 text-white/70 group-hover:text-white" />
                    </a>
                    <a
                        href="https://www.facebook.com/people/Cozinha-ao-Lucro/61583806174158/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 group"
                        aria-label="Facebook"
                    >
                        <Facebook className="w-5 h-5 text-white/70 group-hover:text-white" />
                    </a>
                    <a
                        href="https://www.youtube.com/channel/UCdOdbJ6g-hK7ktwB_sB1e0g"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 group"
                        aria-label="YouTube"
                    >
                        <Youtube className="w-5 h-5 text-white/70 group-hover:text-white" />
                    </a>
                </div>

                <div className="flex justify-center gap-8 text-sm text-white/50 mb-8">
                    <a href="#" className="hover:text-primary transition-colors duration-300">Termos de Uso</a>
                    <a href="#" className="hover:text-primary transition-colors duration-300">Política de Privacidade</a>
                    <a href="#" className="hover:text-primary transition-colors duration-300">Contato</a>
                </div>
                <p className="text-xs text-white/30">
                    © 2024 Cozinha ao Lucro. Todos os direitos reservados.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
