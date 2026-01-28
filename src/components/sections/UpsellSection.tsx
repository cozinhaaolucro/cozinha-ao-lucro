import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, DollarSign, Users, Clock, TrendingUp, Shield, Award, ArrowRight } from 'lucide-react';
import { RevealOnScroll } from '@/components/RevealOnScroll';

const UpsellSection = () => {
    return (
        <section id="beneficios" className="section-padding bg-gradient-to-r from-secondary/5 to-primary/5 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>

            <div className="container-max relative z-10">
                <RevealOnScroll>
                    <div className="text-center mb-12">
                        <Badge className="bg-primary text-primary-foreground text-lg px-6 py-2 mb-4 shadow-lg animate-pulse">
                            TUDO ISSO INCLUSO NA ASSINATURA
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                            O Ecossistema Completo para seu Sucesso
                        </h2>
                    </div>
                </RevealOnScroll>

                <div className="grid lg:grid-cols-2 gap-12 items-start mb-20">
                    <RevealOnScroll direction="right">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-lg group-hover:blur-2xl transition-all duration-500"></div>
                                <img
                                    src="/images/ebook_da_cozinha_ao_lucro_20251117_062259.png"
                                    alt="Ebook Cozinha ao Lucro"
                                    className="relative w-full rounded-lg shadow-lg transform group-hover:-translate-y-2 transition-transform duration-300"
                                />
                            </div>
                            <div className="relative group mt-8">
                                <div className="absolute inset-0 bg-secondary/20 blur-xl rounded-lg group-hover:blur-2xl transition-all duration-500"></div>
                                <img
                                    src="/images/ebook_receitas_que_vendem_20251117_062322.png"
                                    alt="Ebook Receitas que Vendem"
                                    className="relative w-full rounded-lg shadow-lg transform group-hover:-translate-y-2 transition-transform duration-300"
                                />
                            </div>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll direction="left">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-2xl font-bold text-foreground mb-4">
                                    O Que Você Vai Receber
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    A plataforma completa para transformar sua cozinha em um negócio lucrativo.
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                {[
                                    {
                                        title: "Precificação Automática",
                                        desc: "Saiba exatamente quanto cobrar."
                                    },
                                    {
                                        title: "Gestão de Pedidos",
                                        desc: "Painel visual e profissional."
                                    },
                                    {
                                        title: "Controle de Estoque",
                                        desc: "Evite desperdícios."
                                    },
                                    {
                                        title: "Cadastro de Clientes",
                                        desc: "Fidelize com facilidade."
                                    },
                                    {
                                        title: "Relatórios de Lucro",
                                        desc: "Visualize seus ganhos."
                                    },
                                    {
                                        title: "Ebook: Receitas que Vendem",
                                        desc: "50 receitas validadas."
                                    },
                                    {
                                        title: "Ebook: Cozinha ao Lucro",
                                        desc: "Guia de gestão completo."
                                    },
                                    {
                                        title: "Suporte Especializado",
                                        desc: "Tire suas dúvidas."
                                    }
                                ].map((item, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-white/60 rounded-xl border border-white/50 hover:bg-white/90 transition-colors shadow-sm">
                                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                                            <p className="text-muted-foreground text-xs">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6">
                                <Button
                                    className="btn-primary w-full text-xl py-8 shadow-xl hover:shadow-primary/50 transition-all transform hover:scale-105 group"
                                    onClick={() => document.getElementById('precos')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    ACESSAR PLATAFORMA
                                    <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <p className="text-center text-sm text-muted-foreground mt-4">
                                    Acesso imediato • 7 dias grátis • Cancelamento fácil
                                </p>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>

                {/* Benefits Integration */}
                <RevealOnScroll>
                    <div className="text-center mb-12">
                        <h3 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
                            Por que este método funciona para você?
                        </h3>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: DollarSign,
                                title: "Precificação Estratégica",
                                desc: "Aprenda métodos para definir preços que cubram custos e gerem margem justa de lucro."
                            }, {
                                icon: Users,
                                title: "Atrair Primeiros Clientes",
                                desc: "Conquiste seus primeiros clientes sem gastar com anúncios, usando o poder do seu círculo social."
                            }, {
                                icon: Clock,
                                title: "Organizar sua Rotina",
                                desc: "Produza com eficiência, sem estresse e sem bagunçar a dinâmica da sua casa."
                            }, {
                                icon: TrendingUp,
                                title: "Crescimento Sustentável",
                                desc: "Escale seu negócio de forma inteligente, aumentando seus lucros mês após mês."
                            }, {
                                icon: Shield,
                                title: "Segurança Jurídica",
                                desc: "Formalize seu negócio de forma simples e opere com total segurança legal."
                            }, {
                                icon: Award,
                                title: "Independência Financeira",
                                desc: "Conquiste sua liberdade financeira trabalhando com o que ama, no conforto da sua casa."
                            }
                        ].map((benefit, index) => (
                            <div key={index} className="glass-panel p-6 rounded-xl hover:shadow-lg transition-all duration-300 border border-white/20">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                                    <benefit.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h4 className="font-bold text-foreground text-center mb-2">{benefit.title}</h4>
                                <p className="text-sm text-muted-foreground text-center">{benefit.desc}</p>
                            </div>
                        ))}
                    </div>
                </RevealOnScroll>
            </div>
        </section>
    );
};

export default UpsellSection;
