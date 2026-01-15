import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Shield, Zap } from 'lucide-react';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import { useNavigate } from 'react-router-dom';
import { LeadFormDialog } from '@/components/LeadFormDialog';

const PricingSection = () => {
    const navigate = useNavigate();
    return (
        <section id="precos" className="section-padding bg-background relative overflow-hidden section-separator-top">
            <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/pattern-grid.svg')] opacity-[0.02]"></div>

            <div className="container-max relative z-10">
                <RevealOnScroll>
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground font-heading">
                            Investimento que se paga na <span className="text-primary relative inline-block effect-shine px-1 -mx-1 align-bottom">primeira venda</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Tenha acesso completo à plataforma de gestão por menos de uma pizza por mês.
                        </p>
                    </div>
                </RevealOnScroll>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Pro Plan */}
                    {/* Pro Plan */}
                    <RevealOnScroll delay={0.2} className="h-full">
                        <Card className="h-full relative overflow-hidden bg-card border-2 border-primary shadow-2xl rounded-2xl transform hover:scale-[1.02] transition-transform duration-300 flex flex-col hover:shadow-floating backface-hidden will-change-transform z-10">
                            {/* Popular Badge */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-6 py-2 rounded-b-xl z-20 shadow-lg overflow-hidden effect-shine shine-delay-2 whitespace-nowrap flex items-center justify-center min-w-[160px] tracking-wide uppercase">
                                Mais Escolhido
                            </div>

                            <CardHeader className="text-center pt-14 pb-4">
                                <CardTitle className="text-2xl font-bold text-foreground font-heading">Assinatura Pro</CardTitle>
                                <div className="mt-6 flex items-baseline justify-center gap-2">
                                    <span className="text-xl text-muted-foreground line-through opacity-70">R$ 97</span>
                                    <span className="text-6xl font-extrabold text-primary font-heading tracking-tight relative inline-block">R$ 39,90</span>
                                    <span className="text-muted-foreground font-medium">/mês</span>
                                </div>
                                <p className="text-sm text-emerald-600 font-bold mt-4 bg-emerald-500/10 inline-block px-4 py-1.5 rounded-full border border-emerald-500/20 shadow-sm animate-pulse-slow">
                                    7 Dias Grátis para Testar
                                </p>
                            </CardHeader>

                            <CardContent className="p-8 flex-1 flex flex-col">
                                <ul className="space-y-4 mb-10 flex-1">
                                    {[
                                        "Precificação Automática Ilimitada",
                                        "Gestão de Pedidos e Clientes",
                                        "Controle de Estoque Inteligente",
                                        "Relatórios de Lucro em Tempo Real",
                                        "Bônus: Ebook Cozinha ao Lucro",
                                        "Bônus: 50 Receitas que Vendem",
                                        "Suporte Prioritário"
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-foreground/80 font-medium">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <CheckCircle className="w-4 h-4 text-primary" />
                                            </div>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={() => navigate('/register')}
                                    className="btn-primary btn-shine shine-delay-2 w-full text-lg py-8 mb-4 shadow-xl group rounded-xl hover:scale-[1.02] transition-all"
                                >
                                    <span className="md:hidden">Assinar Agora</span>
                                    <span className="hidden md:inline">Quero Lucrar com Organização</span>
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

                    {/* Business Plan */}
                    <RevealOnScroll delay={0.3} className="h-full">
                        <Card className="h-full relative overflow-hidden bg-card border-border/60 shadow-lg rounded-2xl transform hover:scale-[1.02] transition-transform duration-300 flex flex-col border-2 hover:border-primary/20 backface-hidden will-change-transform effect-shine shine-delay-1">
                            <CardHeader className="text-center pt-12 pb-4">
                                <CardTitle className="text-2xl font-bold text-primary font-heading">Plano Business</CardTitle>
                                <div className="mt-5 flex items-baseline justify-center gap-2">
                                    <span className="text-5xl font-bold text-foreground font-heading">Sob Consulta</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-3 font-medium">
                                    Para quem busca escala e alta performance
                                </p>
                            </CardHeader>

                            <CardContent className="p-8 flex-1 flex flex-col">
                                <ul className="space-y-4 mb-10 flex-1">
                                    {[
                                        "Todos os recursos do Plano Pro",
                                        "Múltiplos Usuários e Perfis",
                                        "Dashboards de BI Avançados",
                                        "Relatórios de Performance por Unidade",
                                        "Gestor de Conta Dedicado",
                                        "Treinamento para Equipe",
                                        "Integração via API (Opcional)"
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-foreground/85">
                                            <CheckCircle className="w-5 h-5 text-icon flex-shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <LeadFormDialog>
                                    <Button
                                        variant="outline"
                                        className="w-full text-lg py-7 mb-5 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 group rounded-xl"
                                    >
                                        Solicitar Contato
                                        <Zap className="w-5 h-5 ml-2 group-hover:fill-current" />
                                    </Button>
                                </LeadFormDialog>

                                <div className="text-center space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        Solução ideal para <strong>Franquias e Dark Kitchens</strong>
                                    </p>
                                    <p className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5" />
                                        Contrato corporativo com faturamento
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
