import { Check } from 'lucide-react'
import { usePlans } from '@clerk/clerk-react/experimental'
import GetStartedButton from '../components/GetStartedButton'
import { usePostHog } from '@posthog/react'

const PLAN_META: Record<string, { highlight: boolean }> = {
    free:    { highlight: false },
    starter: { highlight: false },
    growth:  { highlight: true  },
    pro:     { highlight: false },
}

const resolveSlug = (slug: string) =>
    (['free', 'starter', 'growth', 'pro'] as const).find((s) => slug.toLowerCase().includes(s)) ?? 'free'

type BillingPlan = ReturnType<typeof usePlans>['data'] extends (infer T)[] | undefined ? T : never

const formatPrice = (plan: BillingPlan) => {
    if (!plan.hasBaseFee || plan.fee.amount === 0) return '$0'
    return `${plan.fee.currency === 'USD' ? '$' : plan.fee.currency}${plan.fee.amountFormatted}`
}

const PlanCardSkeleton = () => (
    <div className="rounded-2xl p-6 border bg-white/80 border-[#301B69]/10 animate-pulse">
        <div className="h-3 w-24 bg-[#301B69]/10 rounded mb-2" />
        <div className="h-5 w-20 bg-[#301B69]/15 rounded mb-4" />
        <div className="h-3 w-full bg-[#301B69]/10 rounded mb-1" />
        <div className="h-3 w-3/4 bg-[#301B69]/10 rounded mb-6" />
        <div className="h-8 w-16 bg-[#301B69]/15 rounded mb-6" />
        <div className="border-t border-[#301B69]/10 mb-6" />
        {[...Array(4)].map((_, i) => (
            <div key={i} className="h-3 w-full bg-[#301B69]/10 rounded mb-3" />
        ))}
        <div className="h-10 w-full bg-[#301B69]/10 rounded-xl mt-6" />
    </div>
)

const PricingSection = () => {
    const { data: plans, isLoading } = usePlans({ for: 'organization' })
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
                            {isLoading
                                ? [...Array(3)].map((_, i) => <li key={i}><PlanCardSkeleton /></li>)
                                : plans?.filter((plan) => resolveSlug(plan.slug) !== 'pro').map((plan) => {
                                    const slug = resolveSlug(plan.slug)
                                    const meta = PLAN_META[slug] ?? PLAN_META.free
                                    const isFree = !plan.hasBaseFee || plan.fee.amount === 0

                                    return (
                                        <li
                                            key={plan.id}
                                            className={`rounded-2xl p-6 border shadow-sm transition ${
                                                meta.highlight
                                                    ? 'bg-white shadow-lg border-[#301B69]/20'
                                                    : 'bg-white/80 border-[#301B69]/10'
                                            }`}
                                        >
                                            <article aria-label={`${plan.name} plan`}>
                                                <div className="mb-4 flex items-start justify-between">
                                                    <h3 className="text-xl font-semibold text-[#301B69]">{plan.name}</h3>
                                                    {meta.highlight && (
                                                        <span className="inline-block mt-1 text-xs px-2 py-1 rounded-full bg-[#301B69]/10 text-[#301B69]">
                                                            ✦ Most Popular ✦
                                                        </span>
                                                    )}
                                                </div>

                                                {plan.description && (
                                                    <p className="text-sm text-[#301B69]/70 mb-6 leading-relaxed">
                                                        {plan.description}
                                                    </p>
                                                )}

                                                <div className="mb-6">
                                                    <span className="text-3xl font-bold text-[#301B69]">
                                                        {formatPrice(plan)}
                                                    </span>
                                                    <span className="text-sm text-[#301B69]/70">
                                                        {isFree ? ' forever' : ' /month'}
                                                    </span>
                                                </div>

                                                <div className="border-t border-[#301B69]/10 mb-6" />

                                                <ul className="space-y-3 mb-6 list-none">
                                                    {plan.features.map((feature) => (
                                                        <li key={feature.id} className="flex items-center gap-2">
                                                            <Check className="w-4 h-4 text-[#301B69] flex-shrink-0" aria-hidden="true" />
                                                            <span className="text-sm text-[#301B69]/80">{feature.name}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                <div onClick={() => posthog?.capture('pricing_plan_clicked', {
                                                    plan_name: plan.name,
                                                    plan_slug: slug,
                                                    is_free: isFree,
                                                    price: formatPrice(plan),
                                                    is_highlighted: meta.highlight,
                                                })}>
                                                    <GetStartedButton
                                                        className={`w-full py-2.5 rounded-xl text-sm transition ${
                                                            meta.highlight
                                                                ? 'bg-[#301B69] text-white shadow-md'
                                                                : 'bg-white border border-[#301B69]/20 text-[#301B69]'
                                                        }`}
                                                    >
                                                        {isFree ? 'Get Started Free' : 'Get Started'}
                                                    </GetStartedButton>
                                                </div>
                                            </article>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default PricingSection
