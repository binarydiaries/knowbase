import {
    FileText,
    Zap,
    Boxes,
    Link as LinkIcon,
} from "lucide-react";

const features = [
    {
        icon: FileText,
        title: "Knowledge Sources",
        desc: "Import your data from text, FAQs, and documents. Continuously expand your bot's knowledge as you grow.",
    },
    {
        icon: Zap,
        title: "Instant Chatbot Creation",
        desc: "Spin up AI chatbots in seconds with zero setup. No coding, no configs—just define and go live.",
    },
    {
        icon: Boxes,
        title: "Real-time Responses",
        desc: "Deliver fast, accurate answers instantly. Optimized for low latency and high relevance.",
    },
    {
        icon: LinkIcon,
        title: "Smart Retrieval",
        desc: "AI intelligently fetches answers from your data. Context-aware responses that actually make sense.",
    },
];

const CoreValueSection = () => {
    return (
        <section className="px-6 pt-6">
            <div className="max-w-6xl mx-auto">

                {/* Container with BG image */}
                <div
                    className="relative rounded-3xl p-10 md:p-14  bg-cover bg-center overflow-hidden"
                    style={{
                        backgroundImage: "url('/core-bg.png')", // 👈 your bg image
                    }}
                >

                    {/* Soft overlay */}
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]" />

                    {/* Optional glow */}
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#301B69]/20 blur-[120px] opacity-30" />

                    {/* Content */}
                    <div className="relative z-10">

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1 text-sm rounded-full bg-white/70 backdrop-blur border border-[#301B69]/10 text-[#301B69] mb-6">
                            ✦ CORE VALUE
                        </div>

                        {/* Heading */}
                        <h2 className="text-3xl md:text-4xl font-bold text-[#301B69] mb-4">
                            AI Chatbots Built on Your Knowledge
                        </h2>

                        {/* Subtext */}
                        <p className="text-[#301B69]/70 max-w-2xl mb-10 leading-relaxed">
                            KnowBase lets you create intelligent chatbots trained on your own
                            data—so responses are accurate, contextual, and useful.
                        </p>

                        {/* Features Grid */}
                        <div className="relative grid md:grid-cols-2 gap-x-12 gap-y-10">

                            {features.map((item, index) => {
                                const Icon = item.icon;

                                return (
                                    <div key={index} className="flex gap-4">

                                        {/* Icon */}
                                        <div className="mt-1 text-[#301B69]">
                                            <Icon size={20} />
                                        </div>

                                        {/* Text */}
                                        <div>
                                            <h3 className="font-semibold text-[#301B69] mb-1">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-[#301B69]/70 leading-relaxed">
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
                            <button className="bg-[#301B69] text-white px-6 py-3 rounded-xl shadow-md hover:opacity-90 transition">
                                Create Your First Chatbot →
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
};

export default CoreValueSection;