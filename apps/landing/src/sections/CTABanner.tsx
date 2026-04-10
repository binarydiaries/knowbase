import { Button } from '@knowbase/ui/components/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CTABanner() {
  return (
    <section className="relative overflow-hidden px-6 py-24">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-purple-700" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-purple-300/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center text-white">
        <h2 className="mb-4 font-bold text-3xl tracking-tight md:text-4xl lg:text-5xl">
          Ready to Elevate Your AI Chatbot?
        </h2>
        <p className="mb-10 text-white/80 text-lg leading-relaxed">
          Offers your workflow with our exclusive platform. Sign up today to take your next step
          and get ahead easily, and your competition is far behind.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" variant="secondary" asChild>
            <a href="http://localhost:4001">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link to="/pricing">View pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
