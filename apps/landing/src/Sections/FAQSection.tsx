import  { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
    {
        question: "Can I upgrade or downgrade my plan at any time?",
        answer:
            "Yes, you can change your plan anytime. Your billing will be adjusted accordingly.",
    },
    {
        question: "Is there a free trial available?",
        answer:
            "Yes, we offer a 14-day free trial for all our plans. You can sign up without any commitment and explore all features.",
    },
    {
        question: "Is there a discount for annual subscriptions?",
        answer:
            "Yes, we offer discounts for annual plans. You can save more by choosing yearly billing.",
    },
    {
        question: "How secure is my data?",
        answer:
            "Your data is encrypted and securely stored. We follow industry best practices to ensure safety.",
    },
    {
        question: "Can I integrate this tool with other software we use?",
        answer:
            "Yes, we support integrations with multiple platforms and tools to fit your workflow.",
    },
    {
        question: "What kind of support is available?",
        answer:
            "We provide email, chat, and priority support depending on your plan.",
    },
];

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(1);

    const toggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="px-6 py-24">
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
                            <div className="inline-flex px-4 py-1 text-xs rounded-full bg-white/70 border border-[#301B69]/10 text-[#301B69] mb-4">
                                ✦ Frequently Asked Questions
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