import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Shield, Zap } from 'lucide-react';
import { RevealOnScroll } from '@/components/RevealOnScroll';

import { useNavigate } from 'react-router-dom';

const PricingSection = () => {
    const navigate = useNavigate();
    return (
        <section id="precos" className="section-padding bg-background relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/pattern-grid.svg')] opacity-[0.03]"></div>

            <div className="container-max relative z-10">
                <RevealOnScroll>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                            Investimento que se Paga na <span className="text-primary">Primeira Venda</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Tenha acesso completo à plataforma de gestão e todo o conteúdo educativo por menos de uma pizza por mês.
                        </p>
                    </div>
                </RevealOnScroll>

                <div className="max-w-lg mx-auto">
                    <RevealOnScroll delay={0.2}>
                        <Card className="relative overflow-hidden border-2 border-primary shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
                            {/* Popular Badge */}
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg z-20">
                                MAIS ESCOLHIDO
                            </div>

                            <CardHeader className="text-center pt-10 pb-2">
                                <CardTitle className="text-2xl font-bold text-foreground">Assinatura Pro</CardTitle>
                                <div className="mt-4 flex items-baseline justify-center gap-1">
                                    <span className="text-sm text-muted-foreground line-through">R$ 97,00</span>
                                    <span className="text-5xl font-bold text-primary">R$ 39,90</span>
                                    <span className="text-muted-foreground">/mês</span>
                                </div>
                                <p className="text-sm text-green-600 font-medium mt-2 bg-green-50 inline-block px-3 py-1 rounded-full border border-green-100">
                                    Primeiro Mês Grátis
                                </p>
                            </CardHeader>

                            <CardContent className="p-8">
                                <ul className="space-y-4 mb-8">
                                    {[
                                        "Precificação Automática Ilimitada",
                                        "Gestão de Pedidos e Clientes",
                                        "Controle de Estoque Inteligente",
                                        "Relatórios de Lucro em Tempo Real",
                                        "Bônus: Ebook Cozinha ao Lucro",
                                        "Bônus: 50 Receitas que Vendem",
                                        "Suporte Prioritário"
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-foreground/80">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={() => navigate('/register?plan=monthly')}
                                    className="btn-primary w-full text-lg py-6 mb-4 shadow-lg group"
                                >
                                    COMEÇAR AGORA
                                    <Zap className="w-5 h-5 ml-2 group-hover:fill-current" />
                                </Button>

                                <div className="text-center space-y-3">
                                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                        <Shield className="w-3 h-3" />
                                        Cancelamento fácil a qualquer momento
                                    </p>

                                    <div className="pt-4 border-t border-border/50">
                                        <p className="text-sm font-medium text-foreground">Quer economizar?</p>
                                        <p className="text-sm text-muted-foreground">
                                            Plano Anual por <span className="font-bold text-primary">R$ 399,00</span> (2 meses grátis)
                                        </p>
                                    </div>
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
