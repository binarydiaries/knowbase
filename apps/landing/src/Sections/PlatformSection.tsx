import {
    BarChart3,
    Database,
    Settings,
    ShieldCheck,
} from "lucide-react";

const platformFeatures = [
    {
        icon: BarChart3,
        title: "Usage Insights (Future-ready)",
        desc: "Track chatbot usage, queries, and performance. Understand how users interact with your AI.",
    },
    {
        icon: Database,
        title: "Knowledge Management",
        desc: "Organize, update, and control your knowledge base easily. Keep your chatbot accurate and always up to date.",
    },
    {
        icon: Settings,
        title: "Custom Bot Settings",
        desc: "Customize tone, behavior, and response style. Fine-tune your bot to match your exact needs.",
    },
    {
        icon: ShieldCheck,
        title: "Secure & Scalable",
        desc: "Your data stays private and securely handled. Built to scale from personal use to enterprise.",
    },
];

const PlatformSection = () => {
    return (
        <section className="px-6 pt-16">
            <div className="max-w-6xl mx-auto">

                {/* Container */}
                <div
                    className="relative rounded-3xl p-10 md:p-14 overflow-hidden  bg-cover bg-center"
                    style={{
                        backgroundImage: "url('/platform-bg.png')", // 👈 your bg
                    }}
                >

                    {/* Soft overlay */}
                    <div className="absolute inset-0 bg-white/45 backdrop-blur-[2px]" />

                    {/* Content */}
                    <div className="relative z-10">

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1 text-xs rounded-full bg-white/70 backdrop-blur border border-[#301B69]/10 text-[#301B69] mb-6">
                            ✦ PLATFORM
                        </div>

                        {/* Heading */}
                        <h2 className="text-3xl md:text-4xl font-bold text-[#301B69] mb-3">
                            Manage and Scale Your AI Bots Effortlessly
                        </h2>

                        {/* Subtext */}
                        <p className="text-[#301B69]/70 max-w-2xl mb-10 text-sm md:text-base">
                            Track usage, manage knowledge, and improve responses—all from a single dashboard.
                        </p>

                        {/* Grid */}
                        <div className="relative grid md:grid-cols-2 gap-x-12 gap-y-10">

                            {platformFeatures.map((item, index) => {
                                const Icon = item.icon;

                                return (
                                    <div key={index} className="flex gap-4">

                                        {/* Icon */}
                                        <div className="mt-1 text-[#301B69]">
                                            <Icon size={18} />
                                        </div>

                                        {/* Content */}
                                        <div>
                                            <h3 className="font-semibold text-[#301B69] mb-1 text-sm md:text-base">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs md:text-sm text-[#301B69]/70 leading-relaxed">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Divider lines */}
                            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-[#301B69]/10" />
                            <div className="hidden md:block absolute top-0 left-1/2 w-px h-full bg-[#301B69]/10" />
                        </div>

                        {/* CTA */}
                        <div className="mt-12">
                            <button className="bg-[#301B69] text-white px-5 py-2.5 rounded-xl text-sm shadow-md hover:opacity-90 transition">
                                Get Started →
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
};

export default PlatformSection;