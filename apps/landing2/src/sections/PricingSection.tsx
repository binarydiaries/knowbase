import { PricingCard } from '@/components/PricingCard';
import { pricingPlans } from '@/data/landing';

export function PricingSection() {
  return (
    <section id="pricing" className="section-shell">
      <div className="section-heading">
        <p className="eyebrow">Pricing</p>
        <h2 className="section-title">Simple plans built for chatbot growth stages.</h2>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {pricingPlans.map((plan) => (
          <PricingCard key={plan.name} {...plan} />
        ))}
      </div>
    </section>
  );
}
