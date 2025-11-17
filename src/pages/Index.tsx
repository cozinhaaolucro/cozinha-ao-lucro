import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, Star, Shield, Clock, TrendingUp, DollarSign, Users, Award } from 'lucide-react';
const Index = () => {
  const [isHovered, setIsHovered] = useState(false);
  const scrollToOffer = () => {
    const offerSection = document.getElementById('oferta-final');
    offerSection?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  return <div className="min-h-screen bg-background">
      {/* Seção Herói */}
      <section className="relative min-h-screen flex items-center justify-center hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10"></div>
        
        <div className="container-max relative z-10 text-center text-white px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Transforme seu Talento na Cozinha em um 
              <span className="text-primary-glow">Negócio Lucrativo</span> 
              que Fatura de R$ 5.000 a R$ 15.000 por Mês
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
              O passo a passo completo para você, que ama cozinhar, criar sua fonte de renda e conquistar a independência financeira, 
              <strong>mesmo que não entenda nada de negócios.</strong>
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
              <div className="relative">
                <img src="https://static-us-img.skywork.ai/prod/user/head_picture/1990306762284716032_logo com ebook.png?image_process=quality,q_90/resize,w_1280/format,webp" alt="Ebook Da Cozinha ao Lucro" className="w-64 md:w-80 shadow-glow rounded-lg transform hover:scale-105 transition-smooth sk-edit-loading h-[336px] object-cover" />
                <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold text-sm animate-pulse">
                  OFERTA ESPECIAL
                </div>
              </div>
            </div>
            
            <Button onClick={scrollToOffer} className="cta-button text-xl md:text-2xl py-6 px-12 mb-8" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
              QUERO COMEÇAR A LUCRAR COM MINHA COZINHA
            </Button>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-glow" />
                <span>Garantia de 7 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-glow" />
                <span>Acesso imediato</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-glow" />
                <span>Método comprovado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Dor */}
      <section className="section-padding bg-muted/30">
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Você se sente assim?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Se você se identifica com alguma dessas situações, este guia é para você:
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {["Recebe elogios pela sua comida, mas não ganha um real com isso?", "Sente que seu dia passa e você não produziu algo que te traga retorno financeiro?", "Sonha em ter seu próprio dinheiro, mas não sabe por onde começar?", "Ouve frases como 'Você não faz nada o dia todo?' e se sente desvalorizada?", "Tem medo de começar um negócio porque acha 'muito complicado'?", "Quer complementar a renda familiar mas não sabe como monetizar seu talento?"].map((pain, index) => <Card key={index} className="shadow-card hover:shadow-elegant transition-smooth border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                    <p className="text-foreground font-medium">{pain}</p>
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Seção de Apresentação da Solução */}
      <section className="section-padding">
        <div className="container-max">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              Chegou a Hora de Transformar sua Cozinha em sua 
              <span className="text-primary">Maior Fonte de Lucro</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              O ebook "Da Cozinha ao Lucro" é o mapa definitivo para você que tem talento culinário 
              transformar sua paixão em um negócio caseiro altamente lucrativo.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img src="https://static-us-img.skywork.ai/prod/user/head_picture/1990306438077345792_product_cozinha.png?image_process=quality,q_90/resize,w_1280/format,webp" alt="Ebook Da Cozinha ao Lucro" className="w-full max-w-md mx-auto shadow-elegant rounded-lg sk-edit-loading h-[252px] object-cover" />
            </div>
            
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-foreground mb-6">O que você vai aprender:</h3>
              
              {[{
              title: "Descobrindo seu Potencial",
              desc: "Identifique seus pontos fortes e encontre seu nicho perfeito"
            }, {
              title: "Escolhendo seu Nicho Lucrativo",
              desc: "Descubra quais produtos têm maior demanda e margem de lucro"
            }, {
              title: "Precificação que Gera Lucro",
              desc: "Aprenda a precificar corretamente para garantir lucro real"
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
      <section className="section-padding bg-gradient-to-br from-accent/30 to-secondary-light/20">
        <div className="container-max">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              O que você vai conquistar ao aplicar o método 
              <span className="text-primary">Da Cozinha ao Lucro:</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[{
            icon: DollarSign,
            title: "Precificar Corretamente",
            desc: "Nunca mais pagar para trabalhar. Garanta um lucro justo em cada venda com técnicas de precificação profissionais."
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
          }].map((benefit, index) => <Card key={index} className="shadow-card hover:shadow-elegant transition-smooth text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.desc}</p>
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
            name: "Júlia, RJ",
            result: "A lasanha mudou meu mês. 16 porções = R$ 320. Lucro líquido: R$ 204",
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
              <span className="text-primary">lucrar ainda mais rápido?</span>
            </h2>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <img src="https://static-us-img.skywork.ai/prod/user/head_picture/1990306834594516992_product_receitas.png?image_process=quality,q_90/resize,w_1280/format,webp" alt="Ebook Receitas que Vendem" className="w-full max-w-sm mx-auto lg:mx-0 shadow-elegant rounded-lg mb-6 sk-edit-loading h-[216px] object-cover" />
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
              Tenha Acesso Imediato a Todo Esse Conhecimento e 
              <span className="text-primary">Comece sua Jornada Rumo ao Lucro Hoje!</span>
            </h2>
          </div>
          
          <Card className="max-w-4xl mx-auto shadow-glow border-2 border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="text-center">
                  <div className="relative">
                    <img src="https://static-us-img.skywork.ai/prod/user/head_picture/1990306883780866048_product_cozinha.png?image_process=quality,q_90/resize,w_1280/format,webp" alt="Ebook Da Cozinha ao Lucro" className="w-48 mx-auto mb-4 shadow-elegant rounded-lg sk-edit-loading h-[108px] object-cover" />
                    <img src="https://static-us-img.skywork.ai/prod/user/head_picture/1990306925967429632_product_receitas.png?image_process=quality,q_90/resize,w_1280/format,webp" alt="Ebook Receitas que Vendem" className="w-32 absolute -bottom-4 -right-4 shadow-elegant rounded-lg sk-edit-loading h-[72px] object-cover" />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="text-center lg:text-left">
                    <h3 className="text-2xl font-bold text-foreground mb-4">Você vai receber:</h3>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                        <div>
                          <span className="font-semibold">Ebook "Da Cozinha ao Lucro"</span>
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
                    
                    <Button className="cta-button w-full text-xl py-6 mb-4" onClick={() => window.open('https://checkout.exemplo.com', '_blank')}>
                      SIM, QUERO GARANTIR MINHA VAGA E COMEÇAR A LUCRAR!
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
            © 2024 Da Cozinha ao Lucro. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>;
};
export default Index;