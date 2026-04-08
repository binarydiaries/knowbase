import { Button } from '@knowbase/ui/components/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CTABanner() {
  return (
    <section className="bg-primary px-6 py-20 text-primary-foreground">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="mb-4 font-bold text-3xl tracking-tight md:text-4xl">
          Ready to build your first AI chatbot?
        </h2>
        <p className="mb-8 text-primary-foreground/80 text-lg">
          Get started for free today — no credit card, no engineers needed. Your first chatbot
          can be live in under 10 minutes.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" variant="secondary" asChild>
            <a href="http://localhost:4001">
              Start for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            asChild
          >
            <Link to="/pricing">View pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
