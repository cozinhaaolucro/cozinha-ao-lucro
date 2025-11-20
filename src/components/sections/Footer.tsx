const Footer = () => {
    return (
        <footer className="bg-foreground text-background py-12 border-t border-white/10">
            <div className="container-max text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center shadow-glow">
                        <span className="text-primary-foreground font-bold text-lg">CL</span>
                    </div>
                    <span className="font-bold text-2xl text-white tracking-tight">Cozinha ao Lucro</span>
                </div>
                <p className="text-white/70 text-sm mb-8 max-w-md mx-auto leading-relaxed">
                    Transformando cozinhas em negócios lucrativos. O conteúdo mais completo para quem quer empreender com gastronomia.
                </p>
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
