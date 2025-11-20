import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, ArrowRight } from 'lucide-react';
import { RevealOnScroll } from '@/components/RevealOnScroll';

const FinalCTASection = () => {
    return (
        <section id="oferta-final" className="section-padding bg-gradient-to-br from-primary/5 to-secondary/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/images/pattern-grid.svg')] opacity-[0.02]"></div>

            <div className="container-max relative z-10">
                <RevealOnScroll>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
                            Comece Sua Nova Vida Hoje
                            <span className="block text-lg md:text-xl font-normal text-primary mt-2">
                                Receba todo o material imediatamente no seu email
                            </span>
                        </h2>
                    </div>
                </RevealOnScroll>

                <RevealOnScroll delay={0.2}>
                    <Card className="max-w-4xl mx-auto shadow-2xl border-2 border-primary/20 overflow-hidden glass-panel">
                        <CardContent className="p-8 md:p-12">
                            <div className="grid lg:grid-cols-2 gap-8 items-center">
                                <div className="text-center relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent blur-3xl rounded-full"></div>
                                    <div className="relative inline-block z-10">
                                        <img
                                            src="/images/ebook_da_cozinha_ao_lucro_20251117_062259.png"
                                            alt="Kit Ebook Cozinha ao Lucro"
                                            className="w-56 mx-auto mb-4 shadow-elegant rounded-lg h-[150px] object-cover transform hover:scale-105 transition-all duration-500"
                                        />
                                        <img
                                            src="/images/ebook_receitas_que_vendem_20251117_062322.png"
                                            alt="Bônus Ebook Receitas que Vendem"
                                            className="w-36 absolute -bottom-6 -right-8 shadow-elegant rounded-lg h-[110px] object-cover transform hover:scale-110 hover:rotate-6 transition-all duration-500 border-2 border-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="text-center lg:text-left">
                                        <div className="flex items-center justify-center lg:justify-start gap-2 mb-4 bg-green-50 text-green-700 px-4 py-2 rounded-full inline-flex border border-green-100">
                                            <Shield className="w-5 h-5" />
                                            <span className="font-bold text-sm">Garantia Incondicional de 7 dias</span>
                                        </div>

                                        <p className="text-base text-muted-foreground mb-8">
                                            Seu risco é zero. Se não gostar, devolvemos 100% do seu dinheiro.
                                        </p>

                                        <Button
                                            className="btn-primary w-full text-xl py-8 mb-6 shadow-xl hover:shadow-primary/50 transition-all transform hover:scale-105 group"
                                            onClick={() => window.open('https://pay.kiwify.com.br/TV099tr', '_blank')}
                                        >
                                            QUERO LUCRAR AGORA!
                                            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                        </Button>

                                        <div className="text-center text-sm text-muted-foreground space-y-2 bg-muted/30 p-4 rounded-lg">
                                            <p className="flex items-center justify-center gap-2">⚡ Oferta por tempo limitado</p>
                                            <p className="flex items-center justify-center gap-2">🔒 Pagamento 100% seguro</p>
                                            <p className="flex items-center justify-center gap-2">📧 Acesso imediato por email</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </RevealOnScroll>
            </div>
        </section>
    );
};

export default FinalCTASection;
