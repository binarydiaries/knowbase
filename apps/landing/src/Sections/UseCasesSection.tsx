import {
    MessageSquare,
    GraduationCap,
    Database,
    Box,
} from "lucide-react";

const useCases = [
    {
        icon: MessageSquare,
        title: "Customer Support Bots",
        desc: "Automate repetitive queries and reduce support load. Provide 24/7 instant help without scaling your team.",
    },
    {
        icon: GraduationCap,
        title: "Study Assistants",
        desc: "Convert your notes into an interactive tutor. Ask questions and learn faster with AI guidance.",
    },
    {
        icon: Database,
        title: "Internal Knowledge Bots",
        desc: "Help teams find answers across internal docs instantly. Reduce dependency on people and improve productivity.",
    },
    {
        icon: Box,
        title: "Product Assistants (Future-ready)",
        desc: "Guide users through products with AI-powered help. Boost conversions with contextual recommendations.",
    },
];

const UseCasesSection = () => {
    return (
        <section className="px-6 pt-16">
            <div className="max-w-6xl mx-auto">

                {/* Container */}
                <div
                    className="relative rounded-3xl p-10 md:p-14 overflow-hidden  bg-cover bg-center"
                    style={{
                        backgroundImage: "url('/usecase-bg.png')", // 👈 add your bg here
                    }}
                >

                    {/* Overlay (soft cloudy look) */}
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />

                    {/* Content */}
                    <div className="relative z-10">

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1 text-xs rounded-full bg-white/70 backdrop-blur  text-[#301B69] mb-6">
                            ✦ USE CASES
                        </div>

                        {/* Heading */}
                        <h2 className="text-3xl md:text-4xl font-bold text-[#301B69] mb-3">
                            Built for Every Use Case
                        </h2>

                        {/* Subtext */}
                        <p className="text-[#301B69]/70 max-w-2xl mb-10 text-sm md:text-base">
                            From personal productivity to business automation—KnowBase adapts to your needs.
                        </p>

                        {/* Grid */}
                        <div className="relative grid md:grid-cols-2 gap-x-12 gap-y-10">

                            {useCases.map((item, index) => {
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
                                            <p className="text-xs md:text-sm text-[#301B69]/80 leading-relaxed">
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

export default UseCasesSection;