import { Check } from "lucide-react";

const plans = [
    {
        name: "Basic",
        subtitle: "For Individuals",
        price: "$10",
        desc: "Perfect for individuals exploring AI agents for personal productivity or small-scale projects.",
        features: [
            "Up to 3 AI Agents",
            "Text & FAQ Knowledge Sources",
            "Real-time AI Responses",
            "Basic Usage Analytics",
            "Mobile Access",
            "Email Support",
        ],
        highlight: false,
    },
    {
        name: "Pro",
        subtitle: "For Startups",
        price: "$25",
        desc: "Ideal for growing teams that need advanced features and higher limits to scale their AI agents.",
        features: [
            "Up to 20 AI Agents",
            "PDF & Document Sources",
            "Advanced Analytics",
            "Custom Agent Behavior",
            "Priority Responses",
            "Priority Support",
        ],
        highlight: true,
    },
    {
        name: "Enterprise",
        subtitle: "For Large Teams",
        price: "$50",
        desc: "Built for organizations that need unlimited agents, custom integrations, and dedicated support.",
        features: [
            "Unlimited AI Agents",
            "Custom Integrations & APIs",
            "Customizable Dashboard",
            "Advanced Security Controls",
            "Dedicated Account Manager",
            "Onboarding Assistance",
        ],
        highlight: false,
    },
];

const PricingSection = () => {
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
                            {plans.map((plan, index) => (
                                <li
                                    key={index}
                                    className={`rounded-2xl p-6 border shadow-sm transition ${
                                        plan.highlight
                                            ? "bg-white shadow-lg border-[#301B69]/20"
                                            : "bg-white/80 border-[#301B69]/10"
                                    }`}
                                >
                                    <article aria-label={`${plan.name} plan`}>
                                        <div className="mb-4 flex items-start justify-between">
                                            <div>
                                                <p className="text-xs text-[#301B69]/60 mb-1">{plan.subtitle}</p>
                                                <h3 className="text-xl font-semibold text-[#301B69]">{plan.name}</h3>
                                            </div>
                                            {plan.highlight && (
                                                <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-[#301B69]/10 text-[#301B69]">
                                                    ✦ Most Popular ✦
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-[#301B69]/70 mb-6 leading-relaxed">{plan.desc}</p>

                                        <div className="mb-6">
                                            <span className="text-3xl font-bold text-[#301B69]">{plan.price}</span>
                                            <span className="text-sm text-[#301B69]/70">/month</span>
                                        </div>

                                        <div className="border-t border-[#301B69]/10 mb-6" />

                                        <ul className="space-y-3 mb-6 list-none">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <Check className="w-4 h-4 text-[#301B69]" aria-hidden="true" />
                                                    <span className="text-sm text-[#301B69]/80">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <a
                                            href="/signup"
                                            className={`block w-full py-2.5 rounded-xl text-sm text-center transition ${
                                                plan.highlight
                                                    ? "bg-[#301B69] text-white shadow-md"
                                                    : "bg-white border border-[#301B69]/20 text-[#301B69]"
                                            }`}
                                        >
                                            Get Started
                                        </a>
                                    </article>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
