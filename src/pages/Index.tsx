import Navbar from '@/components/Navbar';
import HeroSection from '@/components/sections/HeroSection';
import QuizSection from '@/components/sections/QuizSection';
import PricingSection from '@/components/sections/PricingSection';
import FAQSection from '@/components/sections/FAQSection';
import Footer from '@/components/sections/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      {/* Hero with Calculator */}
      <HeroSection />

      {/* Interactive Quiz */}
      <QuizSection />

      {/* Pricing */}
      <PricingSection />

      {/* FAQ */}
      <FAQSection />

      {/* Footer with Persona */}
      <Footer />
    </div>
  );
};

export default Index;