
const steps = [
    {
        title: "Setup your Account",
        desc: "Create your workspace and get started in seconds. Sign up with minimal friction and access your dashboard instantly.",
        image: "/step1.png",
    },
    {
        title: "Create Your Chatbot",
        desc: "Define your chatbot’s purpose, tone, and behavior. Whether for support or learning, customize it easily.",
        image: "/step2.png",
    },
    {
        title: "Add Knowledge",
        desc: "Upload documents or add structured FAQs. Train your chatbot using real data that matters to you.",
        image: "/step3.png",
    },
    {
        title: "Customize Behavior",
        desc: "Control how your chatbot thinks and responds. Adjust tone, personality, and response style.",
        image: "/step4.png",
    },
    {
        title: "Embed & Share",
        desc: "Deploy your chatbot anywhere—website, app, or internal tools. Share instantly and start engaging users.",
        image: "/step5.png",
    },
];

const HowItWorksSection = () => {
    return (
        <section className="px-6 py-24">
            <div className="max-w-6xl mx-auto">

                {/* Container */}
                <div
                    className="relative rounded-3xl p-10 md:p-16 overflow-hidden bg-cover bg-center"
                    style={{
                        backgroundImage: "url('/how-bg.png')",
                    }}
                >

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]" />

                    {/* Content */}
                    <div className="relative z-10">

                        {/* Header */}
                        <div className="text-center mb-16">
                            <div className="inline-flex px-4 py-1 text-xs rounded-full bg-white/70 border border-[#301B69]/10 text-[#301B69] mb-4">
                                ✦ How it Works
                            </div>

                            <h2 className="text-3xl md:text-4xl font-bold text-[#301B69] mb-3">
                                Get Started in Minutes
                            </h2>

                            <p className="text-[#301B69]/70 max-w-xl mx-auto text-sm md:text-base">
                                Get started quickly and effortlessly with our intuitive process. Follow these easy steps to maximize productivity and collaboration.
                            </p>
                        </div>

                        {/* Timeline */}
                        <div className="relative">

                            {/* Vertical Line */}
                            <div className="hidden md:block absolute left-1/2 top-0 -translate-x-1/2 w-px h-full bg-[#301B69]/10" />

                            <div className="space-y-20">

                                {steps.map((step, index) => {
                                    const isLeft = index % 2 === 0;

                                    return (
                                        <div
                                            key={index}
                                            className={`flex flex-col md:flex-row items-center gap-10  ${
                                                isLeft ? "md:flex-row" : "md:flex-row-reverse"
                                            }`}
                                        >

                                            {/* Text */}
                                            <div className="w-full md:w-1/2">
                                                <h3 className="text-lg font-semibold text-[#301B69] mb-2">
                                                    {step.title}
                                                </h3>
                                                <p className="text-sm text-[#301B69]/70 leading-relaxed max-w-md">
                                                    {step.desc}
                                                </p>
                                            </div>

                                            {/* Center Dot */}
                                            <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#301B69]/10 shadow">
                                                <span className="text-xs text-[#301B69]">{index + 1}</span>
                                            </div>

                                            {/* Image */}
                                            <div className="w-full md:w-1/2">
                                                <div className="rounded-3xl overflow-hidden shadow-md border border-[#301B69]/10 bg-white">
                                                    <img
                                                        src={step.image}
                                                        alt={step.title}
                                                        className="w-full h-auto"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* CTA Card */}
                        <div className="mt-20">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/80 backdrop-blur rounded-2xl p-6 border border-[#301B69]/10 shadow-sm">

                                <div>
                                    <h3 className="text-lg font-semibold text-[#301B69] mb-1">
                                        Ready to Build Your First AI Chatbot?
                                    </h3>
                                    <p className="text-sm text-[#301B69]/70">
                                        Start for free. No setup. No complexity. No credit card.
                                    </p>
                                </div>

                                <button className="bg-[#301B69] text-white px-5 py-2.5 rounded-xl text-sm shadow hover:opacity-90">
                                    Get Started →
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
};

export default HowItWorksSection;