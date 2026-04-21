import {
    MessageSquare,
    GraduationCap,
    Database,
    Box,
} from "lucide-react";

const useCases = [
    {
        icon: MessageSquare,
        title: "Customer Support Agents",
        desc: "Automate repetitive queries and reduce support load. Provide instant, 24/7 assistance without growing your team.",
    },
    {
        icon: GraduationCap,
        title: "Study Assistants",
        desc: "Convert your notes into an interactive tutor. Ask questions and learn faster with AI-guided explanations.",
    },
    {
        icon: Database,
        title: "Internal Knowledge Agents",
        desc: "Help teams find answers across internal docs instantly. Reduce reliance on individuals and improve overall productivity.",
    },
    {
        icon: Box,
        title: "Product Assistants",
        desc: "Guide users through your product with AI-powered help. Boost conversions with contextual, real-time recommendations.",
    },
];

const UseCasesSection = () => {
    return (
        <section aria-labelledby="usecases-heading" className="px-6 pt-16">
            <div className="max-w-6xl mx-auto">
                <div
                    className="relative rounded-3xl p-10 md:p-14 overflow-hidden bg-cover bg-center"
                    style={{ backgroundImage: "url('/usecase-bg.png')" }}
                >
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" aria-hidden="true" />

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1 text-xs rounded-full bg-white/70 backdrop-blur text-[#301B69] mb-6" aria-hidden="true">
                            ✦ USE CASES
                        </div>

                        <h2 id="usecases-heading" className="text-3xl md:text-4xl font-bold text-[#301B69] mb-3">
                            Built for Every Use Case
                        </h2>

                        <p className="text-[#301B69]/70 max-w-2xl mb-10 text-sm md:text-base">
                            From personal productivity to enterprise automation—Agenvik adapts to your needs.
                        </p>

                        <ul className="relative grid md:grid-cols-2 gap-x-12 gap-y-10 list-none">
                            {useCases.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <li key={index} className="flex gap-4">
                                        <div className="mt-1 text-[#301B69]" aria-hidden="true">
                                            <Icon size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-[#301B69] mb-1 text-sm md:text-base">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs md:text-sm text-[#301B69]/80 leading-relaxed">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-[#301B69]/10" aria-hidden="true" />
                            <div className="hidden md:block absolute top-0 left-1/2 w-px h-full bg-[#301B69]/10" aria-hidden="true" />
                        </ul>

                        <div className="mt-12">
                            <a href="/signup" className="inline-block bg-[#301B69] text-white px-5 py-2.5 rounded-xl text-sm shadow-md hover:opacity-90 transition">
                                Get Started →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default UseCasesSection;
