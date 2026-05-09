import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import GetStartedButton from '../components/GetStartedButton';
import amplitude from '../lib/amplitude';

type PlanItem = {
  slug: string;
  name: string;
  priceDisplay: string;
  period: string;
  priceMonthlyPaise: number;
  highlight: boolean;
  features: string[];
};

const API_BASE = import.meta.env.VITE_API_BASE;

function usePlans() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/subscriptions/plans`)
      .then((res) => res.json())
      .then((data) => {
        const fetched = data.plans ?? []
        setPlans(fetched)
        if (fetched.length > 0) {
          amplitude.track('Pricing Plan Viewed', {
            plan_count: fetched.length,
            plan_names: fetched.map((p: PlanItem) => p.name),
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { plans, loading };
}

const PricingSection = () => {
  const { plans, loading } = usePlans();

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="px-6 pt-16"
    >
      <div className="max-w-6xl mx-auto">
        <div
          className="relative rounded-3xl p-10 md:p-14 overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: "url('/pricing-bg.png')" }}
        >
          <div
            className="absolute inset-0 bg-white/50 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          <div className="relative z-10">
            <div className="text-center mb-16">
              <div
                className="inline-flex px-4 py-1 text-xs rounded-full bg-white/70 text-[#301B69] mb-4"
                aria-hidden="true"
              >
                ✦ Pricing
              </div>
              <h2
                id="pricing-heading"
                className="text-3xl md:text-4xl font-bold text-[#301B69] mb-4"
              >
                Simple, transparent pricing
                <br />
                that scales with you
              </h2>
              <p className="text-[#301B69]/70 max-w-2xl mx-auto text-sm md:text-base">
                Start for free and upgrade as your usage grows. No hidden fees,
                no complicated tiers—just clear limits and real value. Whether
                you're building a personal agent or scaling for an enterprise,
                Agenvik grows with you.
              </p>
            </div>

            {loading ? (
              <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 list-none">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li
                    key={i}
                    className="rounded-2xl bg-white/60 animate-pulse h-80"
                  />
                ))}
              </ul>
            ) : (
              <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 list-none">
                {plans.map((plan) => {
                  const isFree = plan.priceMonthlyPaise === 0;
                  return (
                    <li
                      key={plan.slug}
                      className={`rounded-2xl p-6 border shadow-sm transition ${
                        plan.highlight
                          ? 'bg-white shadow-lg border-[#301B69]/20'
                          : 'bg-white/80 border-[#301B69]/10'
                      }`}
                    >
                      <article aria-label={`${plan.name} plan`}>
                        <div className="mb-4 flex items-start justify-between">
                          <h3 className="text-xl font-semibold text-[#301B69]">
                            {plan.name}
                          </h3>
                          {plan.highlight && (
                            <span className="inline-block mt-1 text-xs px-2 py-1 rounded-full bg-[#301B69]/10 text-[#301B69]">
                              ✦ Most Popular ✦
                            </span>
                          )}
                        </div>

                        <div className="mb-6">
                          <span className="text-3xl font-bold text-[#301B69]">
                            {plan.priceDisplay}
                          </span>
                          <span className="text-sm text-[#301B69]/70">
                            {isFree ? ' forever' : ` ${plan.period}`}
                          </span>
                        </div>

                        <div className="border-t border-[#301B69]/10 mb-6" />

                        <ul className="space-y-3 mb-6 list-none">
                          {plan.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-center gap-2"
                            >
                              <Check
                                className="w-4 h-4 text-[#301B69] flex-shrink-0"
                                aria-hidden="true"
                              />
                              <span className="text-sm text-[#301B69]/80">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <div>
                          <GetStartedButton
                            source="pricing"
                            planName={plan.name}
                            className={`w-full p-2.5 rounded-xl text-sm transition ${
                              plan.highlight
                                ? 'bg-[#301B69] text-white shadow-md'
                                : 'bg-white border border-[#301B69]/20 text-[#301B69]'
                            }`}
                          >
                            {isFree ? 'Get Started Free' : 'Get Started'}
                          </GetStartedButton>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
