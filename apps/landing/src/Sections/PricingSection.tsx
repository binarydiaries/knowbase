import { Check } from "lucide-react";

const plans = [
    {
        name: "Basic",
        subtitle: "For Individuals",
        price: "$10",
        desc: "Perfect for Small teams and individuals just starting out with project management.",
        features: [
            "Basic Task Management",
            "Team Collaboration",
            "Basic Reporting",
            "Real-Time Activity Feed",
            "Mobile Access",
            "Email Support",
        ],
        highlight: false,
    },
    {
        name: "Pro",
        subtitle: "For Startups",
        price: "$25",
        desc: "Perfect for growing teams that need advanced features to boost productivity.",
        features: [
            "Time Tracking",
            "Advanced Reporting",
            "Priority Levels",
            "Subtasks & Checklists",
            "Productivity Analytics",
            "Billable Hours",
        ],
        highlight: true,
    },
    {
        name: "Enterprise",
        subtitle: "For Big Companies",
        price: "$50",
        desc: "Perfect for large teams and enterprises with complex project management needs.",
        features: [
            "Custom Integrations",
            "Customizable Dashboard",
            "Unlimited Projects",
            "Milestone Monitoring",
            "Priority Support",
            "Onboarding Assistance",
        ],
        highlight: false,
    },
];

const PricingSection = () => {
    return (
        <section className="px-6 pt-16">
            <div className="max-w-6xl mx-auto">

                {/* Container */}
                <div
                    className="relative rounded-3xl p-10 md:p-14 overflow-hidden bg-cover bg-center"
                    style={{
                        backgroundImage: "url('/pricing-bg.png')", // 👈 your bg
                    }}
                >

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]" />

                    {/* Content */}
                    <div className="relative z-10">

                        {/* Header */}
                        <div className="text-center mb-16">
                            <div className="inline-flex px-4 py-1 text-xs rounded-full bg-white/70 text-[#301B69] mb-4">
                                ✦ Pricing
                            </div>

                            <h2 className="text-3xl md:text-4xl font-bold text-[#301B69] mb-4">
                                Simple, transparent pricing that <br/>scales with you
                            </h2>

                            <p className="text-[#301B69]/70 max-w-2xl mx-auto text-sm md:text-base">
                                Start for free and upgrade as your usage grows. No hidden fees, no complicated tiers—just,<br/> clear limits and value. Whether you're building a personal bot or scaling for a team,<br/> KnowBase adapts to your needs.
                            </p>
                        </div>

                        {/* Cards */}
                        <div className="grid md:grid-cols-3 gap-6">

                            {plans.map((plan, index) => (
                                <div
                                    key={index}
                                    className={`rounded-2xl p-6 border shadow-sm transition ${
                                        plan.highlight
                                            ? "bg-white shadow-lg border-[#301B69]/20 "
                                            : "bg-white/80 border-[#301B69]/10"
                                    }`}
                                >

                                    {/* Top */}
                                    <div className="mb-4 flex items-start justify-between flex-row">
                                        <div>
                                            <p className="text-xs text-[#301B69]/60 mb-1">
                                            {plan.subtitle}
                                        </p>

                                            <h3 className="text-xl font-semibold text-[#301B69]">
                                                {plan.name}
                                            </h3>
                                        </div>
                                        <div>
                                            {plan.highlight && (
                                                <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-[#301B69]/10 text-[#301B69]">
                                                ✦ Most Popular ✦
                                              </span>
                                            )}
                                        </div>


                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-[#301B69]/70 mb-6 leading-relaxed">
                                        {plan.desc}
                                    </p>

                                    {/* Price */}
                                    <div className="mb-6">
                    <span className="text-3xl font-bold text-[#301B69]">
                      {plan.price}
                    </span>
                                        <span className="text-sm text-[#301B69]/70">
                      /month
                    </span>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-[#301B69]/10 mb-6" />

                                    {/* Features */}
                                    <div className="space-y-3 mb-6">
                                        {plan.features.map((feature, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-[#301B69]" />
                                                <span className="text-sm text-[#301B69]/80">
                          {feature}
                        </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Button */}
                                    <button
                                        className={`w-full py-2.5 rounded-xl text-sm transition ${
                                            plan.highlight
                                                ? "bg-[#301B69] text-white shadow-md"
                                                : "bg-white border border-[#301B69]/20 text-[#301B69]"
                                        }`}
                                    >
                                        Contact Sales
                                    </button>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
};

export default PricingSection;