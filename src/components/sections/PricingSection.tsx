import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Shield, Zap } from 'lucide-react';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import { useNavigate } from 'react-router-dom';

const PricingSection = () => {
    const navigate = useNavigate();
    return (
        <section id="precos" className="section-padding bg-background relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/pattern-grid.svg')] opacity-[0.02]"></div>

            <div className="container-max relative z-10">
                <RevealOnScroll>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground font-heading">
                            Investimento que se paga na <span className="text-primary">primeira venda</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Tenha acesso completo à plataforma de gestão por menos de uma pizza por mês.
                        </p>
                    </div>
                </RevealOnScroll>

                <div className="max-w-lg mx-auto">
                    <RevealOnScroll delay={0.2}>
                        <Card className="relative overflow-hidden border border-primary/20 shadow-2xl bg-card/50 backdrop-blur-xl rounded-2xl transform hover:scale-[1.02] transition-transform duration-300">
                            {/* Popular Badge */}
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-bl-xl z-20 shadow-md">
                                MAIS ESCOLHIDO
                            </div>

                            <CardHeader className="text-center pt-12 pb-4">
                                <CardTitle className="text-2xl font-bold text-foreground font-heading">Assinatura Pro</CardTitle>
                                <div className="mt-5 flex items-baseline justify-center gap-2">
                                    <span className="text-lg text-muted-foreground line-through">R$ 97,00</span>
                                    <span className="text-5xl font-bold text-primary font-heading">R$ 39,90</span>
                                    <span className="text-muted-foreground">/mês</span>
                                </div>
                                <p className="text-sm text-green-400 font-semibold mt-3 bg-green-500/10 inline-block px-4 py-1.5 rounded-full border border-green-500/20 shadow-sm">
                                    7 Dias Grátis para Testar
                                </p>
                            </CardHeader>

                            <CardContent className="p-8">
                                <ul className="space-y-4 mb-10">
                                    {[
                                        "Precificação Automática Ilimitada",
                                        "Gestão de Pedidos e Clientes",
                                        "Controle de Estoque Inteligente",
                                        "Relatórios de Lucro em Tempo Real",
                                        "Bônus: Ebook Cozinha ao Lucro",
                                        "Bônus: 50 Receitas que Vendem",
                                        "Suporte Prioritário"
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-foreground/85">
                                            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={() => navigate('/register')}
                                    className="btn-primary w-full text-lg py-7 mb-5 shadow-xl group rounded-xl"
                                >
                                    Quero Lucrar com Organização
                                    <Zap className="w-5 h-5 ml-2 group-hover:fill-current" />
                                </Button>

                                <div className="text-center space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        Comece hoje por menos de <strong className="text-foreground">R$ 1,35 por dia</strong>
                                    </p>
                                    <p className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5" />
                                        Cancelamento fácil a qualquer momento
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </RevealOnScroll>
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
