import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@knowbase/ui/components/accordion';

const faqs = [
  {
    question: 'What is Knowbase?',
    answer:
      'Knowbase is an AI-powered chatbot platform that lets you create chatbots trained on your own content -- documents, FAQs, and Q&A pairs. You can deploy them on your website, WhatsApp, or Instagram without writing any code.',
  },
  {
    question: 'Which channels are supported?',
    answer:
      'Knowbase currently supports Web (embeddable widget), WhatsApp Business, and Instagram DMs. Each channel can be configured independently with the same underlying chatbot.',
  },
  {
    question: 'How does training work?',
    answer:
      'When you add or update knowledge sources, you trigger a training run. Knowbase indexes your documents in the background using AI embeddings. Training runs in the background -- your bot stays live while the new knowledge is processed.',
  },
  {
    question: 'What counts as a "message"?',
    answer:
      'Each time a user sends a message to your chatbot and receives a response counts as one message. System prompts and internal processing do not count toward your quota.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer:
      'Yes. You can change your plan at any time from the Subscription page in your dashboard. Upgrades take effect immediately; downgrades apply at the start of the next billing cycle.',
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes! The Free plan lets you create 1 chatbot with up to 10 knowledge sources and 100 messages per month -- no credit card required. It's a great way to explore the platform before committing.",
  },
  {
    question: 'How is my data stored?',
    answer:
      'All your knowledge sources, chatbot configurations, and conversation data are stored securely in our cloud infrastructure. We use encrypted connections and access controls to keep your data safe.',
  },
  {
    question: 'Do you offer enterprise or custom plans?',
    answer:
      'Yes. If your needs exceed the Pro plan -- more chatbots, sources, messages, or custom SLAs -- get in touch with us and we will put together a plan that fits.',
  },
];

export default function FAQ() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold text-3xl tracking-tight md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground text-lg">
            {"Can't find your answer? "}
            <a href="mailto:hello@knowbase.ai" className="underline underline-offset-4 hover:text-foreground">
              Get in touch
            </a>
            .
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={faq.question} value={`item-${i}`} className="rounded-lg border border-border px-4">
              <AccordionTrigger className="text-left font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
