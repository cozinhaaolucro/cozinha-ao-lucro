import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ReadingProgressBar from '@/components/ReadingProgressBar';
import SocialProofToast from '@/components/SocialProofToast';
import ProfitCalculator from '@/components/ProfitCalculator';
import { Badge } from '@/components/ui/badge';

// Sections
import HeroSection from '@/components/sections/HeroSection';
import PainPointsSection from '@/components/sections/PainPointsSection';
import QuizSection from '@/components/sections/QuizSection';
import SolutionSection from '@/components/sections/SolutionSection';
import BenefitsSection from '@/components/sections/BenefitsSection';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import UpsellSection from '@/components/sections/UpsellSection';
import FinalCTASection from '@/components/sections/FinalCTASection';
import FAQSection from '@/components/sections/FAQSection';
import Footer from '@/components/sections/Footer';
import { RevealOnScroll } from '@/components/RevealOnScroll';

const Index = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{ id: number, x: number, y: number, size: number, speed: number }>>([]);

  // Sistema de partículas que segue o mouse (Optimized)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Throttle particle creation
      if (Math.random() > 0.9) {
        const newParticle = {
          id: Date.now() + Math.random(),
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 4 + 1,
          speed: Math.random() * 1 + 0.5
        };
        setParticles(prev => [...prev.slice(-15), newParticle]);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden font-sans selection:bg-primary selection:text-primary-foreground">
      <ReadingProgressBar />
      <Navbar />
      <SocialProofToast />

      {/* Sistema de Partículas Global */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="fixed pointer-events-none animate-ping z-50"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)`,
            animationDuration: `${particle.speed}s`
          }}
        />
      ))}

      <HeroSection />

      <QuizSection />

      <PainPointsSection />

      <SolutionSection />

      {/* Seção de Calculadora (Mantida aqui por ser um componente interativo específico) */}
      <section className="section-padding bg-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-muted/30 to-transparent"></div>
        <div className="container-max relative z-10">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <Badge className="bg-green-600 text-white mb-4 hover:bg-green-700 px-4 py-1">NOVIDADE EXCLUSIVA</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                Quanto você quer ganhar por mês?
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Use nossa calculadora oficial e descubra o potencial real do seu negócio caseiro.
                <span className="block text-sm mt-2 text-primary font-bold">Faça a simulação abaixo 👇</span>
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.2}>
            <div className="transform hover:scale-[1.01] transition-transform duration-500">
              <ProfitCalculator />
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <BenefitsSection />

      <TestimonialsSection />

      <UpsellSection />

      <FinalCTASection />

      <FAQSection />

      <Footer />
    </div>
  );
};

export default Index;