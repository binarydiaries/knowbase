import { Button } from '@knowbase/ui/components/button';
import { Separator } from '@knowbase/ui/components/separator';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import CTABanner from '@/sections/CTABanner';
import ChannelBadges from '@/sections/ChannelBadges';
import FAQ from '@/sections/FAQ';
import FeaturesGrid from '@/sections/FeaturesGrid';
import Hero from '@/sections/Hero';
import HowItWorks from '@/sections/HowItWorks';
import PricingCards from '@/sections/PricingCards';

export default function HomePage() {
  return (
    <>
      <Hero />

      <Separator />

      <FeaturesGrid limit={6} />

      <Separator />

      <HowItWorks />

      <Separator />

      <ChannelBadges />

      <Separator />

      {/* Pricing preview */}
      <section className="bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-bold text-3xl tracking-tight md:text-4xl">
              Simple, transparent pricing
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

      <Separator />

      <FAQ />

      <Separator />

      <CTABanner />
    </>
  );
}
