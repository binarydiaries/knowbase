import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import CTABanner from '@/sections/CTABanner';
import FAQ from '@/sections/FAQ';
import FeaturesGrid from '@/sections/FeaturesGrid';
import Hero from '@/sections/Hero';
import HowItWorks from '@/sections/HowItWorks';
import PricingCards from '@/sections/PricingCards';
import SocialProof from '@/sections/SocialProof';
import Testimonials from '@/sections/Testimonials';

export default function HomePage() {
  return (
    <>
      <Hero />

      <SocialProof />

      <FeaturesGrid />

      <HowItWorks />

      {/* Pricing section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4">Plans</Badge>
            <h2 className="mb-4 font-bold text-3xl tracking-tight md:text-4xl">
              Simple, Transparent Plan and Pricing
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground text-lg">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </div>

          <PricingCards />

          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link to="/pricing">
                Compare all features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Testimonials />

      <FAQ />

      <CTABanner />
    </>
  );
}
