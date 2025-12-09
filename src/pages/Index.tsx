import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ReadingProgressBar from '@/components/ReadingProgressBar';
import SocialProofToast from '@/components/SocialProofToast';
import PricingSection from '@/components/sections/PricingSection';
import { Badge } from '@/components/ui/badge';

// Sections
import HeroSection from '@/components/sections/HeroSection';
import PainPointsSection from '@/components/sections/PainPointsSection';
import QuizSection from '@/components/sections/QuizSection';

import UpsellSection from '@/components/sections/UpsellSection';

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
          className="absolute pointer-events-none animate-ping z-0"
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





      <PricingSection />

      <UpsellSection />



      <FAQSection />

      <Footer />
    </div>
  );
};

export default Index;