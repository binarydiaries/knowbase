import {
    User,
    Bot,
    Database,
    Settings,
    Share2,
} from "lucide-react";

const steps = [
    {
        title: "Set Up Your Account",
        desc: "Create your workspace and get started in seconds. Sign up with minimal friction and access your dashboard instantly. No complex onboarding—just a smooth entry into building AI agents. Everything is ready right out of the box.",
        image: "/step1.png", icon: User,
    },
    {
        title: "Create Your Agent",
        desc: "Define your agent's purpose, name, and identity. Whether it's for support, learning, or internal use—set the intent clearly. Each agent is independent and fully customizable. You can create multiple agents for different use cases.",
        image: "/step2.png", icon: Bot,
    },
    {
        title: "Add Knowledge",
        desc: "Upload your content or add structured FAQs. Train your agent using real data that matters to you. Your agent learns context, not just keywords. Continuously update its knowledge as your needs evolve.",
        image: "/step3.png", icon: Database,
    },
    {
        title: "Customize Behavior",
        desc: "Control how your agent thinks and responds. Adjust tone, personality, and response style. Fine-tune outputs to match your brand or use case. Make your AI feel truly yours.",
        image: "/step4.png", icon: Settings,
    },
    {
        title: "Embed & Share",
        desc: "Deploy your agent wherever your users are. Embed it on websites or use it internally with your team. Share access instantly—no complex integrations required. Your AI is ready to assist, anywhere.",
        image: "/step5.png", icon: Share2,
    },
];

const HowItWorksSection = () => {
    return (
        <section id="how-it-works" aria-labelledby="howitworks-heading" className="px-6 pt-16">
            <div className="max-w-6xl mx-auto">
                <div
                    className="relative rounded-3xl p-10 md:p-16 overflow-hidden bg-cover bg-center"
                    style={{ backgroundImage: "url('/how-bg.png')" }}
                >
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]" aria-hidden="true" />

                    <div className="relative z-10">
                        <div className="text-center mb-16">
                            <div className="inline-flex px-4 py-1 text-xs rounded-full bg-white/70 text-[#301B69] mb-4" aria-hidden="true">
                                ✦ How it Works
                            </div>

                            <h2 id="howitworks-heading" className="text-3xl md:text-4xl font-bold text-[#301B69] mb-3">
                                Get Started in Minutes
                            </h2>

                            <p className="text-[#301B69]/70 max-w-xl mx-auto text-sm md:text-base">
                                Follow these simple steps to build, train, and deploy your AI agent—no technical expertise required.
                            </p>
                        </div>

                        <div className="relative">
                            <div className="hidden md:block absolute left-1/2 top-0 -translate-x-1/2 w-px h-full bg-[#301B69]/10" aria-hidden="true" />

                            <ol className="space-y-5 list-none">
                                {steps.map((step, index) => {
                                    const isLeft = index % 2 === 0;
                                    const Icon = step.icon;
                                    return (
                                        <li
                                            key={index}
                                            className={`flex flex-col md:flex-row items-center gap-10 ${
                                                isLeft ? "md:flex-row" : "md:flex-row-reverse"
                                            }`}
                                        >
                                            <div className="w-full md:w-1/2">
                                                <h3 className="text-lg font-semibold text-[#301B69] mb-2">
                                                    {step.title}
                                                </h3>
                                                <p className="text-sm text-[#301B69]/70 leading-relaxed max-w-md">
                                                    {step.desc}
                                                </p>
                                            </div>

                                            <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#301B69]/10 shadow relative z-10" aria-hidden="true">
                                                <Icon size={16} className="text-[#301B69]" />
                                            </div>

                                            <div className="w-full md:w-1/2">
                                                <div className="rounded-3xl overflow-hidden shadow-md border border-[#301B69]/10 bg-white">
                                                    <img
                                                        src={step.image}
                                                        alt={`Step ${index + 1}: ${step.title}`}
                                                        className="w-full h-auto"
                                                    />
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>

                        <div className="mt-20">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/80 backdrop-blur rounded-2xl p-6 border border-[#301B69]/10 shadow-sm">
                                <div>
                                    <h3 className="text-lg font-semibold text-[#301B69] mb-1">
                                        Ready to Build Your First AI Agent?
                                    </h3>
                                    <p className="text-sm text-[#301B69]/70">
                                        Start for free. No setup. No complexity. No credit card required.
                                    </p>
                                </div>
                                <a href="/signup" className="bg-[#301B69] text-white px-5 py-2.5 rounded-xl text-sm shadow hover:opacity-90">
                                    Get Started →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
