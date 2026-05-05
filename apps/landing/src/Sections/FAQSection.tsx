import { useState } from "react";
import { ChevronDown } from "lucide-react";
import amplitude from "../lib/amplitude";

const faqs = [
    {
        question: "What is Agenvik?",
        answer:
            "Agenvik is a platform that lets you create AI-powered agents using your own data. Instead of generic answers, your agent responds based on your knowledge sources. It works for personal use, teams, and businesses—no coding required.",
    },
    {
        question: "What kind of data can I use?",
        answer:
            "You can currently add text content and structured FAQs to train your agent with precise information. Support for PDFs and additional formats is coming soon as we continue expanding supported sources.",
    },
    {
        question: "Do I need coding skills to use Agenvik?",
        answer:
            "No. Agenvik is built for everyone. You can create and manage agents without writing a single line of code. The interface is intuitive and beginner-friendly, with advanced features available for power users.",
    },
    {
        question: "Can I create multiple agents?",
        answer:
            "Yes. You can create multiple agents for different use cases. Each agent has its own knowledge base and behavior, making it ideal for teams, products, or distinct workflows. The number of agents depends on your selected plan.",
    },
    {
        question: "How accurate are the responses?",
        answer:
            "Responses are generated directly from your provided data, making them far more relevant than generic AI answers. Accuracy improves as you add well-structured knowledge, and you stay in full control of what your agent knows.",
    },
    {
        question: "Is my data secure?",
        answer:
            "Yes. Your data is private and scoped to your account. We do not expose your data publicly, and only you and your configured agents can access it. More advanced security controls are coming soon.",
    },
    {
        question: "Can I customize how the agent behaves?",
        answer:
            "Yes. You can control tone, style, and response behavior to match your brand voice or use case. Make your agent formal, friendly, or task-focused to deliver a consistent and on-brand experience.",
    },
    {
        question: "Where can I use my agent?",
        answer:
            "You can currently use your agent within Agenvik. Embedding and third-party integrations are coming soon, with future support for websites, apps, and APIs so your agent can be accessible everywhere.",
    },
    {
        question: "How does pricing work?",
        answer:
            "Agenvik offers straightforward subscription-based pricing with plans based on usage, agent limits, and features. You can start for free and upgrade as you grow—no hidden charges.",
    },
    {
        question: "What's coming next?",
        answer:
            "We are actively building new features including PDF support, integrations, APIs, and analytics. Our goal is to make Agenvik the most complete AI agent platform for individuals, teams, and enterprises.",
    },
];

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(1);

    const toggle = (index: number) => {
        const isOpening = openIndex !== index
        setOpenIndex(isOpening ? index : null)
        if (isOpening) {
            amplitude.track('FAQ Item Expanded', {
                question: faqs[index].question,
                question_index: index,
            })
        }
    };

    return (
        <section id="faq" aria-labelledby="faq-heading" className="px-6 pt-16">
            <div className="max-w-6xl mx-auto">
                <div
                    className="relative rounded-3xl p-10 md:p-14 overflow-hidden bg-cover bg-center"
                    style={{ backgroundImage: "url('/faq-bg.png')" }}
                >
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px]" aria-hidden="true" />

                    <div className="relative z-10">
                        <div className="text-center mb-12">
                            <div className="inline-flex px-4 py-1 text-xs rounded-full gap-2 bg-white/80 text-[#301B69] mb-4" aria-hidden="true">
                                <span className="px-1 rounded-full border border-[#301B69]">?</span> Frequently Asked Questions
                            </div>

                            <h2 id="faq-heading" className="text-3xl md:text-4xl font-bold text-[#301B69] mb-3">
                                Common Questions About Agenvik
                            </h2>

                            <p className="text-[#301B69]/70 text-sm md:text-base max-w-xl mx-auto">
                                Find answers to the most frequently asked questions about Agenvik—features, security, pricing, and more.
                            </p>
                        </div>

                        <dl className="space-y-4">
                            {faqs.map((faq, index) => {
                                const isOpen = openIndex === index;
                                const answerId = `faq-answer-${index}`;
                                const questionId = `faq-question-${index}`;

                                return (
                                    <div
                                        key={index}
                                        className="rounded-xl border border-[#301B69]/10 bg-white/80 backdrop-blur p-4"
                                    >
                                        <dt>
                                            <button
                                                id={questionId}
                                                aria-expanded={isOpen}
                                                aria-controls={answerId}
                                                onClick={() => toggle(index)}
                                                className="flex w-full justify-between items-center text-left cursor-pointer"
                                            >
                                                <span className="text-sm md:text-base font-medium text-[#301B69]">
                                                    {faq.question}
                                                </span>
                                                <ChevronDown
                                                    className={`w-5 h-5 text-[#301B69] transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        </dt>
                                        <dd
                                            id={answerId}
                                            role="region"
                                            aria-labelledby={questionId}
                                            hidden={!isOpen}
                                            className="mt-3 text-sm text-[#301B69]/70 leading-relaxed"
                                        >
                                            {faq.answer}
                                        </dd>
                                    </div>
                                );
                            })}
                        </dl>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
