import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, Star, Shield, Clock, TrendingUp, DollarSign, Users, Award } from 'lucide-react';
const Index = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, speed: number}>>([]);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const [hasStarted, setHasStarted] = useState(false);

  // Refs para os elementos que serão animados
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  // Sistema de partículas que segue o mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Cria novas partículas
      if (Math.random() > 0.8) {
        const newParticle = {
          id: Date.now() + Math.random(),
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 6 + 2,
          speed: Math.random() * 2 + 1
        };
        setParticles(prev => [...prev.slice(-20), newParticle]);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Hook para Intersection Observer
  const useIntersectionObserver = (elementRef: React.RefObject<Element>, elementId: string) => {
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && hasStarted) {
            setVisibleElements(prev => new Set([...prev, elementId]));
          }
        },
        { threshold: 0.3, rootMargin: '-50px' }
      );
      
      if (elementRef.current) {
        observer.observe(elementRef.current);
      }
      
      return () => observer.disconnect();
    }, [elementRef, elementId, hasStarted]);
  };

  // Animação sequencial de entrada
  useEffect(() => {
    const sequence = [
      () => setVisibleElements(prev => new Set([...prev, 'hero-bg'])),
      () => setVisibleElements(prev => new Set([...prev, 'title'])),
      () => setVisibleElements(prev => new Set([...prev, 'subtitle'])),
      () => setVisibleElements(prev => new Set([...prev, 'image'])),
      () => setVisibleElements(prev => new Set([...prev, 'button'])),
      () => setVisibleElements(prev => new Set([...prev, 'features'])),
      () => setVisibleElements(prev => new Set([...prev, 'pricing']))
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < sequence.length) {
        sequence[currentStep]();
        currentStep++;
      } else {
        clearInterval(interval);
        setHasStarted(true);
      }
    }, 350); // Reduzido de 600ms para 350ms

    return () => clearInterval(interval);
  }, []);

  // Aplicar observers
  useIntersectionObserver(heroRef, 'hero');
  useIntersectionObserver(titleRef, 'title-scroll');
  useIntersectionObserver(subtitleRef, 'subtitle-scroll');
  useIntersectionObserver(imageRef, 'image-scroll');
  useIntersectionObserver(buttonRef, 'button-scroll');
  useIntersectionObserver(featuresRef, 'features-scroll');
  useIntersectionObserver(pricingRef, 'pricing-scroll');

  const scrollToOffer = () => {
    const offerSection = document.getElementById('oferta-final');
    offerSection?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Sistema de Partículas */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute pointer-events-none animate-ping"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, hsl(var(--primary-glow)) 0%, transparent 70%)`,
            animationDuration: `${particle.speed}s`
          }}
        />
      ))}
      {/* Seção Herói */}
      <section ref={heroRef} className={`relative min-h-screen flex items-center justify-center hero-gradient overflow-hidden transition-all duration-1000 ${visibleElements.has('hero-bg') ? 'opacity-100' : 'opacity-0'}`}>
        {/* Formas Morphing */}
        <div className="absolute inset-0">
          <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="morphGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary) / 0.1)" />
                <stop offset="50%" stopColor="hsl(var(--secondary) / 0.1)" />
                <stop offset="100%" stopColor="hsl(var(--primary-glow) / 0.1)" />
              </linearGradient>
            </defs>
            
            {/* Forma 1 - Círculo que vira quadrado */}
            <path d="M300,200 Q400,100 500,200 Q600,300 500,400 Q400,500 300,400 Q200,300 300,200" 
                  fill="url(#morphGradient)" className="animate-morph-1">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0 400 300;360 400 300"
                dur="20s"
                repeatCount="indefinite"/>
            </path>
            
            {/* Forma 2 - Triângulo que vira estrela */}
            <path d="M700,150 L750,250 L650,200 L750,200 L700,300 Z" 
                  fill="url(#morphGradient)" className="animate-morph-2" opacity="0.6">
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1 1;1.2 0.8;0.8 1.2;1 1"
                dur="8s"
                repeatCount="indefinite"/>
            </path>
          </svg>
        </div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10"></div>
        
        {/* ✨ Elementos decorativos sutis */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-primary/20 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-32 right-20 w-6 h-6 bg-secondary/15 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-16 w-3 h-3 bg-primary/25 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-12 w-5 h-5 bg-secondary/20 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
        
        <div className="container-max relative z-10 text-center text-white px-4">
          <div className="max-w-4xl mx-auto">
            {/* Título com efeito mais dinâmico */}
            <h1 ref={titleRef} className={`text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight transition-all duration-700 transform ${visibleElements.has('title') ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'}`}>
              Cozinha ao Lucro
              <span className="block text-2xl md:text-3xl lg:text-4xl font-normal text-primary-glow mt-2">
                Guia Digital para Empreendedorismo Culinário Caseiro
              </span>
            </h1>
            
            {/* Subtítulo com entrada mais suave */}
            <p ref={subtitleRef} className={`text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed transition-all duration-600 transform ${visibleElements.has('subtitle') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`} style={{transitionDelay: '0.1s'}}>
              Aprenda estratégias práticas para transformar sua habilidade culinária em fonte de renda. 
              <strong> Ebook digital com métodos comprovados, planilhas de custos e suporte por 30 dias.</strong>
            </p>
            
            {/* Imagem com efeito elástico dramático */}
            {/* Volte para a versão simples e funcional */}
            <div ref={imageRef} className={`flex flex-col md:flex-row items-center justify-center gap-8 mb-12 transition-all duration-800 transform ${visibleElements.has('image') ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-90 rotate-1'}`} style={{transitionDelay: '0.2s'}}>
              <div className="relative">
                <a href="https://pay.kiwify.com.br/TV099tr" target="_blank" rel="noopener noreferrer" className="block">
                  <img 
                    src="/images/logo_cozinhaaolucro.png" 
                    alt="Ebook Da Cozinha ao Lucro" 
                    className="w-64 md:w-80 shadow-glow rounded-lg hover:scale-105 transition-all duration-400 h-[336px] object-cover" 
                  />
                </a>
                <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold text-sm animate-pulse-fast">
                  OFERTA ESPECIAL
                </div>
              </div>
            </div>
            
            {/* Botão com efeito de slide */}
            <div ref={buttonRef} className={`transition-all duration-500 transform ${visibleElements.has('button') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`} style={{transitionDelay: '0.3s'}}>
              <Button onClick={() => window.open('https://pay.kiwify.com.br/TV099tr', '_blank')} className="cta-button-enhanced text-xl md:text-2xl py-6 px-12 mb-8" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                QUERO COMEÇAR A LUCRAR COM MINHA COZINHA
              </Button>
            </div>
            
            {/* Features com entrada escalonada mais rápida */}
            <div ref={featuresRef} className={`flex flex-wrap justify-center gap-4 text-sm transition-all duration-400 transform ${visibleElements.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`} style={{transitionDelay: '0.4s'}}>
              <div className="flex items-center gap-2 animate-slide-in-left-fast" style={{animationDelay: '0.05s'}}>
                <Shield className="w-5 h-5 text-primary-glow" />
                <span>Garantia de 7 dias</span>
              </div>
              <div className="flex items-center gap-2 animate-slide-in-left-fast" style={{animationDelay: '0.1s'}}>
                <Clock className="w-5 h-5 text-primary-glow" />
                <span>Acesso imediato</span>
              </div>
              <div className="flex items-center gap-2 animate-slide-in-left-fast" style={{animationDelay: '0.15s'}}>
                <Award className="w-5 h-5 text-primary-glow" />
                <span>Método comprovado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Dor com animação mais rápida */}
      <section className="section-padding bg-muted/30">
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground animate-fade-in-up-fast">
              Você se sente assim?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in-up-fast" style={{animationDelay: '0.1s'}}>
              Se você se identifica com alguma dessas situações, este guia é para você:
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-animation-fast">
            {["Quer transformar sua habilidade culinária em fonte de renda?", "Busca estratégias práticas para empreender com produtos caseiros?", "Procura orientação sobre precificação e vendas de alimentos?", "Deseja aprender sobre legalização de negócio culinário?", "Busca métodos comprovados para empreendedorismo feminino?", "Quer complementar sua renda familiar de forma sustentável?"].map((benefit, index) => (
              <Card key={index} className="shadow-card hover:shadow-elegant fast-transition border-l-4 border-l-primary hover:border-l-primary-glow hover:-translate-y-1 hover:scale-[1.02] interactive-element">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0 animate-pulse-fast"></div>
                    <p className="text-foreground font-medium">{benefit}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Apresentação da Solução */}
      <section className="section-padding animated-gradient-bg">
        <div className="container-max">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              Conteúdo do Ebook Digital
              <span className="block text-lg md:text-xl font-normal text-primary mt-2">
                Estratégias práticas para empreendedorismo culinário
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              O ebook "Cozinha ao Lucro" é o mapa definitivo para você que tem talento culinário 
              transformar sua paixão em um negócio caseiro altamente lucrativo.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <a href="https://pay.kiwify.com.br/TV099tr" target="_blank" rel="noopener noreferrer">
                <img src="/images/ebook_da_cozinha_ao_lucro_20251117_062259.png" alt="Ebook Da Cozinha ao Lucro" className="w-full max-w-md mx-auto shadow-elegant rounded-lg h-[300px] object-cover cursor-pointer transform hover:scale-105 hover:-rotate-2 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20" />
              </a>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-foreground mb-6">O que você vai aprender:</h3>
              
              {[{
              title: "Avaliação de Habilidades",
              desc: "Identifique suas especialidades culinárias e preferências de público"
            }, {
              title: "Análise de Mercado",
              desc: "Estude demanda local e concorrência para escolher seu nicho"
            }, {
              title: "Precificação Estratégica",
              desc: "Aprenda métodos para definir preços que cubram custos e gerem margem justa de lucro."
            }, {
              title: "Marketing Sem Gastar Muito",
              desc: "Estratégias simples para atrair clientes sem investir em anúncios"
            }, {
              title: "Organização e Rotina",
              desc: "Como estruturar seu negócio sem bagunçar a dinâmica da casa"
            }, {
              title: "Legalização Simplificada",
              desc: "Passo a passo para formalizar seu negócio de forma simples"
            }].map((module, index) => <div key={index} className="flex items-start gap-4 p-4 bg-accent/50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{module.title}</h4>
                    <p className="text-muted-foreground">{module.desc}</p>
                  </div>
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Benefícios */}
      <section className="section-padding bg-gradient-to-br from-accent/30 to-secondary-light/20 animated-gradient-bg">
        <div className="container-max">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              O que você vai conquistar ao aplicar o método  
              <span className="text-primary"> Cozinha ao Lucro:</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[{
            icon: DollarSign,
            title: "Precificação Estratégica",
            desc: "Aprenda métodos para definir preços que cubram custos e gerem margem justa de lucro."
          }, {
            icon: Users,
            title: "Atrair Primeiros Clientes",
            desc: "Conquiste seus primeiros clientes sem gastar com anúncios, usando o poder do seu círculo social e estratégias simples."
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
          }].map((benefit, index) => <Card key={index} className="shadow-card hover:shadow-elegant transition-all duration-300 text-center hover:-translate-y-2 hover:scale-[1.02] group cursor-pointer border-l-4 border-l-primary hover:border-l-primary-glow parallax-element">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors duration-300 group-hover:scale-110 transform">
                    <benefit.icon className="w-8 h-8 text-primary group-hover:text-primary-glow transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">{benefit.desc}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Seção de Prova Social */}
      <section className="section-padding">
        <div className="container-max">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Veja o que empreendedoras como você estão dizendo:
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[{
            name: "Ana, São Paulo",
            result: "Comecei vendendo docinhos aos finais de semana. Em 3 meses alcancei R$ 800/mês de renda extra.",
            rating: 5
          }, {
            name: "Mariana, SP",
            result: "Em 3 meses saí do zero para R$ 8.500/mês vendendo docinhos gourmet",
            rating: 5
          }, {
            name: "Ana Paula, MG",
            result: "Consegui formalizar meu negócio e hoje faturo R$ 12.000 mensais",
            rating: 5
          }, {
            name: "Carla, RS",
            result: "O método de precificação aumentou meu lucro em 150%",
            rating: 5
          }, {
            name: "Fernanda, BA",
            result: "Transformei minha paixão por bolos em uma renda de R$ 6.800/mês",
            rating: 5
          }, {
            name: "Patrícia, PR",
            result: "Finalmente tenho minha independência financeira. Obrigada!",
            rating: 5
          }].map((testimonial, index) => <Card key={index} className="shadow-card hover:shadow-elegant transition-smooth">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-primary text-primary" />)}
                  </div>
                  <p className="text-foreground mb-4 italic">"{testimonial.result}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold">{testimonial.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">Cliente verificada</p>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Seção da Oferta do Upsell */}
      <section className="section-padding bg-gradient-to-r from-secondary/10 to-primary/10">
        <div className="container-max">
          <div className="text-center mb-12">
            <Badge className="bg-primary text-primary-foreground text-lg px-6 py-2 mb-4">
              BÔNUS ESPECIAL
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Quer acelerar seus resultados e 
              <span className="text-primary"> lucrar ainda mais rápido?</span>
            </h2>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <a href="https://pay.kiwify.com.br/TV099tr" target="_blank" rel="noopener noreferrer">
                <img src="/images/ebook_receitas_que_vendem_20251117_062322.png" alt="Ebook Receitas que Vendem" className="w-full max-w-sm mx-auto lg:mx-0 shadow-elegant rounded-lg mb-6 h-[216px] object-cover cursor-pointer transform hover:scale-110 hover:rotate-1 transition-all duration-500 hover:shadow-2xl hover:shadow-secondary/20 group-hover:animate-pulse" />
              </a>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">
                Ebook "Receitas que Vendem"
              </h3>
              
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                O "arsenal secreto" para quem já decidiu empreender. Contém <strong>50 receitas testadas e aprovadas</strong>, 
                com foco em três pilares fundamentais:
              </p>
              
              <div className="space-y-4 mb-8">
                {[{
                title: "Alto Lucro",
                desc: "Margem mínima de 60% garantida"
              }, {
                title: "Baixo Custo",
                desc: "Ingredientes acessíveis e fáceis de encontrar"
              }, {
                title: "Alta Demanda",
                desc: "Produtos que o mercado realmente quer"
              }].map((pillar, index) => <div key={index} className="flex items-center gap-4 p-4 bg-white/50 rounded-lg">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{pillar.title}</h4>
                      <p className="text-muted-foreground">{pillar.desc}</p>
                    </div>
                  </div>)}
              </div>
              
              <p className="text-lg text-foreground font-medium">
                A ferramenta perfeita para <span className="text-primary font-bold">acelerar os lucros iniciais</span> do seu negócio!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção da Chamada para Ação Final */}
      <section id="oferta-final" className="section-padding bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              Adquira seu Acesso Digital Agora
              <span className="block text-lg md:text-xl font-normal text-primary mt-2">
                Conteúdo entregue por email + suporte por 30 dias
              </span>
            </h2>
          </div>
          
          <Card className="max-w-4xl mx-auto shadow-glow border-2 border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="text-center">
                  <div className="relative">
                    <img src="/images/ebook_da_cozinha_ao_lucro_20251117_062259.png" alt="Ebook Cozinha ao Lucro" className="w-48 mx-auto mb-4 shadow-elegant rounded-lg h-[130px] object-cover transform hover:scale-110 hover:-rotate-3 transition-all duration-500 hover:shadow-xl hover:shadow-primary/30" />
                    <img src="/images/ebook_receitas_que_vendem_20251117_062322.png" alt="Ebook Receitas que Vendem" className="w-32 absolute -bottom-4 -right-4 shadow-elegant rounded-lg h-[100px] object-cover transform hover:scale-125 hover:rotate-6 transition-all duration-500 hover:shadow-xl hover:shadow-secondary/30 hover:z-10" />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="text-center lg:text-left">
                    <h3 className="text-2xl font-bold text-foreground mb-4">Você vai receber:</h3>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                        <div>
                          <span className="font-semibold">Ebook "Cozinha ao Lucro"</span>
                          <div className="text-sm text-muted-foreground">
                            <span className="line-through">de R$ 127,00</span> por <span className="text-primary font-bold text-lg">R$ 67,00</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                        <div>
                          <span className="font-semibold">Bônus: "Receitas que Vendem"</span>
                          <div className="text-sm text-primary font-bold">por apenas R$ 29,90</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                        <span className="font-semibold">Planilha de Custos Exclusiva</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                        <span className="font-semibold">Scripts de Vendas Prontos</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                        <span className="font-semibold">Suporte por 30 dias</span>
                      </div>
                    </div>
                    
                    <div className="bg-primary/10 p-4 rounded-lg mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-6 h-6 text-primary" />
                        <span className="font-bold text-foreground">Garantia Incondicional de 7 dias</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Seu risco é zero. Se não gostar, devolvemos 100% do seu dinheiro.
                      </p>
                    </div>
                    
                    <Button className="cta-button w-full text-xl py-6 mb-4" onClick={() => window.open('https://pay.kiwify.com.br/TV099tr', '_blank')}>
                      COMEÇAR A LUCRAR!
                    </Button>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      <p>⚡ Oferta por tempo limitado</p>
                      <p>🔒 Pagamento 100% seguro</p>
                      <p>📧 Acesso imediato por email</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Seção de FAQ */}
      <section className="section-padding bg-muted/20">
        <div className="container-max">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Dúvidas Frequentes
            </h2>
            <p className="text-xl text-muted-foreground">
              Tire suas dúvidas antes de começar sua jornada empreendedora
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {[{
              question: "Para quem é este ebook?",
              answer: "Este ebook é perfeito para mulheres que têm talento culinário e querem transformar essa habilidade em uma fonte de renda. Não importa se você é iniciante em negócios - o conteúdo é explicado de forma simples e prática."
            }, {
              question: "Como vou receber o acesso?",
              answer: "Após a confirmação do pagamento, você receberá um email com o link para download dos ebooks e todos os bônus. O acesso é imediato e vitalício."
            }, {
              question: "Preciso ter muito dinheiro para começar?",
              answer: "Não! Uma das grandes vantagens do negócio culinário caseiro é que você pode começar com pouco investimento. O ebook ensina como iniciar com o que você já tem em casa."
            }, {
              question: "E se eu não souber vender?",
              answer: "O ebook inclui um módulo completo sobre vendas e marketing simples, além de scripts prontos que você pode usar. Você aprenderá técnicas fáceis para atrair e conquistar clientes."
            }, {
              question: "A compra é segura?",
              answer: "Sim! Utilizamos plataformas de pagamento seguras e criptografadas. Além disso, oferecemos garantia incondicional de 7 dias. Se não ficar satisfeita, devolvemos 100% do seu dinheiro."
            }, {
              question: "Quanto tempo leva para ver resultados?",
              answer: "Muitas alunas começam a ter suas primeiras vendas já na primeira semana após aplicar as estratégias do ebook. Os resultados dependem da sua dedicação e aplicação do método."
            }].map((faq, index) => <AccordionItem key={index} value={`item-${index}`} className="bg-white shadow-card rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>)}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-8">
        <div className="container-max text-center">
          <p className="text-sm opacity-80">
            © 2024 Cozinha ao Lucro - Conteúdo educacional para empreendedorismo culinário.
          </p>
        </div>
      </footer>
    </div>
  );
};
export default Index;