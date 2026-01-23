import { lazy, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/sections/HeroSection';

// Lazy load below-fold sections for better LCP
const AppShowcase = lazy(() => import('@/components/sections/AppShowcase'));
const BenefitsSection = lazy(() => import('@/components/sections/BenefitsSection'));
const PricingSection = lazy(() => import('@/components/sections/PricingSection'));
const AuthoritySection = lazy(() => import('@/components/sections/AuthoritySection'));
const FloatingFAQ = lazy(() => import('@/components/FloatingFAQ'));
const Footer = lazy(() => import('@/components/sections/Footer'));

// Minimal loading fallback (invisible, no jank)
const SectionFallback = () => <div className="min-h-[200px]" />;

const Index = () => {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      <main>
        {/* Hero with Mockups - Loaded Immediately for LCP */}
        <HeroSection />

        {/* Below-fold sections loaded lazily */}
        <Suspense fallback={<SectionFallback />}>
          <BenefitsSection />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <AppShowcase />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <PricingSection />
        </Suspense>

        <Suspense fallback={<SectionFallback />}>
          <AuthoritySection />
        </Suspense>


      </main>

      <Suspense fallback={<SectionFallback />}>
        <Footer />
      </Suspense>

      <Suspense fallback={null}>
        <FloatingFAQ />
      </Suspense>
    </div>
  );
};

export default Index;