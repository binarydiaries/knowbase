export const faqs = [
  {
    question: 'What is Agenvik?',
    answer:
      'Agenvik is a platform that lets you create AI-powered agents using your own data. Instead of generic answers, your agent responds based on your knowledge sources. It works for personal use, teams, and businesses—no coding required.',
  },
  {
    question: 'What kind of data can I use?',
    answer:
      'You can upload PDFs, paste plain text, add structured Q&A pairs, or point your agent at a website URL. All four formats are supported today.',
  },
  {
    question: 'Do I need coding skills to use Agenvik?',
    answer:
      'No. Agenvik is built for everyone. You can create and manage agents without writing a single line of code. The interface is intuitive and beginner-friendly, with advanced features available for power users.',
  },
  {
    question: 'Can I create multiple agents?',
    answer:
      'Yes. You can create multiple agents for different use cases. Each agent has its own knowledge base and behavior, making it ideal for teams, products, or distinct workflows. The number of agents depends on your selected plan.',
  },
  {
    question: 'How accurate are the responses?',
    answer:
      'Responses are generated directly from your provided data, making them far more relevant than generic AI answers. Accuracy improves as you add well-structured knowledge, and you stay in full control of what your agent knows.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. Your data is private and scoped to your account. We do not expose your data publicly, and only you and your configured agents can access it. More advanced security controls are coming soon.',
  },
  {
    question: 'Can I customize how the agent behaves?',
    answer:
      'Yes. You can control tone, style, and response behavior to match your brand voice or use case. Make your agent formal, friendly, or task-focused to deliver a consistent and on-brand experience.',
  },
  {
    question: 'Where can I use my agent?',
    answer:
      'On your website via an embed widget, on WhatsApp, and on Slack — all three channels are live today. Add a chat widget to your site in one line of code, or connect your WhatsApp business number and your agent handles customer messages automatically.',
  },
  {
    question: 'How does pricing work?',
    answer:
      'Agenvik offers straightforward subscription-based pricing with plans based on usage, agent limits, and features. You can start for free and upgrade as you grow—no hidden charges.',
  },
  {
    question: "What's coming next?",
    answer:
      'Lead capture webhooks for CRM integration, REST API access, and a human handoff inbox so your team can take over conversations when needed. We ship new features every week.',
  },
];

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};
