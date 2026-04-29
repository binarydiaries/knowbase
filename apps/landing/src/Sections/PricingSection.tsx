import { Check } from 'lucide-react'
import GetStartedButton from '../components/GetStartedButton'
import { usePostHog } from '@posthog/react'

const PLANS = [
    {
        slug: 'free',
        name: 'Free',
        price: '₹0',
        priceSuffix: ' forever',
        isFree: true,
        highlight: false,
        features: [
            '1 active agent',
            '10 knowledge sources',
            '100 messages / month',
            '3 training runs / day',
        ],
    },
    {
        slug: 'starter',
        name: 'Starter',
        price: '₹499',
        priceSuffix: ' /month',
        isFree: false,
        highlight: false,
        features: [
            '3 active agents',
            '250 knowledge sources',
            '500 messages / month',
            '10 training runs / day',
            'WhatsApp & Instagram channels',
            'Lead generation',
        ],
    },
    {
        slug: 'growth',
        name: 'Growth',
        price: '₹1,499',
        priceSuffix: ' /month',
        isFree: false,
        highlight: true,
        features: [
            '10 active agents',
            '1,000 knowledge sources',
            '2,000 messages / month',
            '20 training runs / day',
            'WhatsApp & Instagram channels',
            'Lead generation',
            'Analytics',
        ],
    },
] as const

const PricingSection = () => {
    const posthog = usePostHog()

    return (
        <section id="pricing" aria-labelledby="pricing-heading" className="px-6 pt-16">
            <div className="max-w-6xl mx-auto">
                <div
                    className="relative rounded-3xl p-10 md:p-14 overflow-hidden bg-cover bg-center"
                    style={{ backgroundImage: "url('/pricing-bg.png')" }}
                >
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]" aria-hidden="true" />

                    <div className="relative z-10">
                        <div className="text-center mb-16">
                            <div className="inline-flex px-4 py-1 text-xs rounded-full bg-white/70 text-[#301B69] mb-4" aria-hidden="true">
                                ✦ Pricing
                            </div>
                            <h2 id="pricing-heading" className="text-3xl md:text-4xl font-bold text-[#301B69] mb-4">
                                Simple, transparent pricing<br />that scales with you
                            </h2>
                            <p className="text-[#301B69]/70 max-w-2xl mx-auto text-sm md:text-base">
                                Start for free and upgrade as your usage grows. No hidden fees, no complicated tiers—just clear limits and real value. Whether you're building a personal agent or scaling for an enterprise, Agenvik grows with you.
                            </p>
                        </div>

                        <ul className="grid md:grid-cols-3 gap-6 list-none">
                            {PLANS.map((plan) => (
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
                                            <h3 className="text-xl font-semibold text-[#301B69]">{plan.name}</h3>
                                            {plan.highlight && (
                                                <span className="inline-block mt-1 text-xs px-2 py-1 rounded-full bg-[#301B69]/10 text-[#301B69]">
                                                    ✦ Most Popular ✦
                                                </span>
                                            )}
                                        </div>

                                        <div className="mb-6">
                                            <span className="text-3xl font-bold text-[#301B69]">
                                                {plan.price}
                                            </span>
                                            <span className="text-sm text-[#301B69]/70">
                                                {plan.priceSuffix}
                                            </span>
                                        </div>

                                        <div className="border-t border-[#301B69]/10 mb-6" />

                                        <ul className="space-y-3 mb-6 list-none">
                                            {plan.features.map((feature) => (
                                                <li key={feature} className="flex items-center gap-2">
                                                    <Check className="w-4 h-4 text-[#301B69] flex-shrink-0" aria-hidden="true" />
                                                    <span className="text-sm text-[#301B69]/80">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <div onClick={() => posthog?.capture('pricing_plan_clicked', {
                                            plan_name: plan.name,
                                            plan_slug: plan.slug,
                                            is_free: plan.isFree,
                                            price: plan.price,
                                            is_highlighted: plan.highlight,
                                        })}>
                                            <GetStartedButton
                                                className={`w-full py-2.5 rounded-xl text-sm transition ${
                                                    plan.highlight
                                                        ? 'bg-[#301B69] text-white shadow-md'
                                                        : 'bg-white border border-[#301B69]/20 text-[#301B69]'
                                                }`}
                                            >
                                                {plan.isFree ? 'Get Started Free' : 'Get Started'}
                                            </GetStartedButton>
                                        </div>
                                    </article>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default PricingSection
