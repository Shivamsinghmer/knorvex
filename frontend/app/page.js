import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import MetricsSection from '@/components/landing/MetricsSection';
import CategorySection from '@/components/landing/CategorySection';
import FAQSection from '@/components/landing/FAQSection';
import CTASection from '@/components/landing/CTASection';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata = {
  title: "Knorvex — India's Skill Exchange Platform",
  description: "Teach what you know, learn what you don't. Peer-to-peer skill bartering powered by AI matching and SkillCoins.",
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <MetricsSection />
      <CategorySection />
      <FAQSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
