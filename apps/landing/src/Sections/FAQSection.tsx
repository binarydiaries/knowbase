import  { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
    {
        question: "What is KnowBase?",
        answer:
            "KnowBase is a platform that lets you create AI-powered chatbots using your own data. Instead of generic answers, your chatbot responds based on your knowledge sources. It works for personal use, teams, and businesses with no coding required.",
    },
    {
        question: "What kind of data can I use?",
        answer:
            "You can currently add text content and structured FAQs to train your chatbot with precise information. Support for PDFs and additional formats is coming soon as we continue expanding supported sources.",
    },
    {
        question: "Do I need coding skills to use KnowBase?",
        answer:
            "No, KnowBase is built for everyone. You can create and manage chatbots without writing any code. The interface is simple and beginner-friendly, with advanced features coming later for power users.",
    },
    {
        question: "Can I create multiple chatbots?",
        answer:
            "Yes, you can create multiple chatbots for different use cases. Each chatbot can have its own knowledge and behavior, making it useful for teams, products, or workflows. Limits depend on your selected plan.",
    },
    {
        question: "How accurate are the responses?",
        answer:
            "Responses are generated based on your provided data, making them more relevant than generic AI answers. Accuracy improves as you add better structured knowledge, and you stay in control of what your bot knows.",
    },
    {
        question: "Is my data secure?",
        answer:
            "Yes, your data is private and scoped to your account. We prioritize security and do not expose your data publicly. Only you and your configured bots can access it, with more advanced controls coming soon.",
    },
    {
        question: "Can I customize how the chatbot behaves?",
        answer:
            "Yes, you can control tone, style, and responses to match your brand voice or use case. You can make your bot formal, friendly, or task-focused to ensure a consistent experience.",
    },
    {
        question: "Where can I use my chatbot?",
        answer:
            "You can currently use your chatbot within KnowBase. Embedding and integrations are coming soon, with future support for websites, apps, and APIs to make your chatbot accessible everywhere.",
    },
    {
        question: "How does pricing work?",
        answer:
            "KnowBase offers simple subscription-based pricing with plans based on usage, limits, and features. You can start for free and upgrade as you grow, with no hidden charges.",
    },
    {
        question: "What’s coming next?",
        answer:
            "We are actively building new features including PDF support, integrations, APIs, and analytics. Our goal is to make KnowBase a complete AI platform for individuals, teams, and businesses.",
    },
];
const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(1);

    const toggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq"  className="px-6 pt-16">
            <div className="max-w-6xl mx-auto">

                {/* Container */}
                <div
                    className="relative rounded-3xl p-10 md:p-14 overflow-hidden  bg-cover bg-center"
                    style={{
                        backgroundImage: "url('/faq-bg.png')", // 👈 your bg
                    }}
                >

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]" />

                    {/* Content */}
                    <div className="relative z-10">

                        {/* Header */}
                        <div className="text-center mb-12">
                            <div className="inline-flex px-4 py-1 text-xs rounded-full gap-2 bg-white/80 text-[#301B69] mb-4">
                                <div className={"px-1  rounded-full border border-[#301B69]"}>?</div>  Frequently Asked Questions
                            </div>

                            <h2 className="text-3xl md:text-4xl font-bold text-[#301B69] mb-3">
                                Explore Common Questions <br />
                                About Our Finance SaaS
                            </h2>

                            <p className="text-[#301B69]/70 text-sm md:text-base max-w-xl mx-auto">
                                Find answers to frequently asked questions about Genie. Learn about features, security, support options, and more.
                            </p>
                        </div>

                        {/* Accordion */}
                        <div className="space-y-4">

                            {faqs.map((faq, index) => {
                                const isOpen = openIndex === index;

                                return (
                                    <div
                                        key={index}
                                        className="rounded-xl border border-[#301B69]/10 bg-white/80 backdrop-blur p-4 cursor-pointer transition"
                                        onClick={() => toggle(index)}
                                    >

                                        {/* Question */}
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-sm md:text-base font-medium text-[#301B69]">
                                                {faq.question}
                                            </h3>

                                            <ChevronDown
                                                className={`w-5 h-5 text-[#301B69] transition-transform ${
                                                    isOpen ? "rotate-180" : ""
                                                }`}
                                            />
                                        </div>

                                        {/* Answer */}
                                        {isOpen && (
                                            <p className="mt-3 text-sm text-[#301B69]/70 leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}

                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
};

export default FAQSection;