export interface FAQ {
  question: string;
  answer: string;
}

export interface FAQCategory {
  id: string;
  label: string;
  faqs: FAQ[];
}

// ── Homepage FAQs (4 questions, shown in homepage FAQ section) ─────────────
export const homepageFaqs: FAQ[] = [
  {
    question: 'Is this just another chatbot builder?',
    answer:
      'No. Most chatbot builders make you write scripts and decision trees. Agenvik learns from your actual documents and answers in natural language — so you upload your content once and it handles the rest.',
  },
  {
    question: "Will my customers know it's AI?",
    answer:
      "Yes. We believe that's a good thing — customers don't mind AI when it actually helps them.",
  },
  {
    question: 'What if it gives a wrong answer?',
    answer:
      "Agenvik only answers from content you provide. If the information isn't in your knowledge base, the agent says so rather than guessing. You can also see every conversation and add knowledge to fill gaps.",
  },
  {
    question: 'Do I need coding skills to set it up?',
    answer:
      "No. Upload your documents, configure your agent, and you're live in under 10 minutes. No technical knowledge needed.",
  },
];

// ── Full FAQ page — categorised ────────────────────────────────────────────
export const faqCategories: FAQCategory[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    faqs: [
      {
        question: 'What is Agenvik?',
        answer:
          "Agenvik is a platform that lets you build AI agents trained on your own content — documents, FAQs, websites. Once trained, your agent answers questions from customers, team members, or students over any channel you choose: website chat, WhatsApp, or Slack. It's different from generic AI chatbots because it only speaks from what you've given it. No hallucinations. No off-topic responses.",
      },
      {
        question: 'Do I need technical skills to use Agenvik?',
        answer:
          "No. Agenvik is designed for non-technical users. You upload documents, fill in a few settings, copy one line of code for the website widget, and you're done. The most technical thing you'll do is paste an embed snippet. If you do have technical skills, there's a developer API coming soon.",
      },
      {
        question: 'How long does it take to set up my first agent?',
        answer:
          'Most users go from sign-up to a live Agenvik agent in under 30 minutes. The core steps — uploading documents, naming your agent, configuring tone — take about 10 minutes. Getting it on your website takes another 2 minutes with the embed code. WhatsApp setup takes a bit longer (15–20 minutes) because it requires connecting a WhatsApp Business number.',
      },
      {
        question: "What's the difference between an AI agent and a regular chatbot?",
        answer:
          "Traditional chatbots follow scripts — you define every possible question and response in a flow diagram. If someone asks something slightly differently, the bot breaks. An Agenvik AI agent understands natural language. You don't pre-write every answer — instead, you give it your actual content and it figures out how to answer any question from that material. It's the difference between teaching someone a script and teaching them the subject.",
      },
      {
        question: 'Can I try Agenvik before paying?',
        answer:
          "Yes. Agenvik's free plan lets you create 1 agent, add up to 10 knowledge sources, and handle 100 conversations per month — forever. No credit card required. You only need to upgrade when you want more capacity or channels like WhatsApp.",
      },
      {
        question: 'Can I create multiple agents?',
        answer:
          'Yes. Each Agenvik agent is independent — its own name, knowledge base, tone, and channels. Starter gives you 3 agents, Growth gives you 10, Pro gives you 30. A common pattern: one agent for public customer support, a separate one for internal team knowledge, and a third as a sales qualifier.',
      },
    ],
  },
  {
    id: 'knowledge-training',
    label: 'Knowledge & Training',
    faqs: [
      {
        question: 'What types of content can I upload?',
        answer:
          'Agenvik supports four formats today: PDF documents (policy docs, manuals, guides, reports), plain text (paste any text directly), Q&A pairs (structured question-and-answer format for FAQs), and website URLs (point your agent at a URL and it reads and indexes the page content).',
      },
      {
        question: 'Can I train my agent on a PDF?',
        answer:
          "Yes. Upload the PDF in the Knowledge section. Agenvik breaks it into chunks, creates embeddings, and stores them. Your agent can then answer questions using the exact content in that document, and will cite the source in its responses.",
      },
      {
        question: 'How many documents can I upload?',
        answer:
          'The number of knowledge sources depends on your Agenvik plan: 10 on Free, 250 on Starter, 1,000 on Growth, 5,000 on Pro. One document counts as one knowledge source. One URL counts as one knowledge source.',
      },
      {
        question: 'Does it index my entire website if I give it a URL?',
        answer:
          'Currently, Agenvik indexes the specific URL you provide — not a full site crawl. To index multiple pages, add each URL as a separate knowledge source. Full site crawl with depth settings is on the roadmap.',
      },
      {
        question: 'How accurate are the answers?',
        answer:
          'Accuracy depends directly on the quality of your knowledge base. If your documents are clear, specific, and well-structured, your Agenvik agent answers accurately. Agenvik uses a RAG (Retrieval-Augmented Generation) architecture — answers are constructed from retrieved passages in your documents, not generated from the AI\'s general knowledge. This means the agent won\'t answer questions your documents don\'t cover, which is a feature, not a bug.',
      },
      {
        question: "What if my agent doesn't know the answer?",
        answer:
          'It says so. Agenvik agents are configured to respond with something like "I don\'t have that information — please contact [your email]" rather than guessing. You can customise this fallback message.',
      },
      {
        question: "Can I update my agent's knowledge after it's live?",
        answer:
          "Yes, at any time. Add new documents, delete outdated ones, edit text. After updating, click Train to re-index. Changes are live within a few minutes.",
      },
      {
        question: "How often should I update my agent's knowledge?",
        answer:
          "Whenever your source material changes. If you update your refund policy, upload the new version. If you launch a new product feature, add the documentation. Your Agenvik agent is only as accurate as the information you give it.",
      },
    ],
  },
  {
    id: 'channels-deployment',
    label: 'Channels & Deployment',
    faqs: [
      {
        question: 'Where can I deploy my agent?',
        answer:
          'Agenvik supports three channels today: (1) Website chat widget — embeds on any website with a single line of code, works on Webflow, Shopify, WordPress, and custom HTML. (2) WhatsApp — connect your WhatsApp Business number and your agent handles incoming messages automatically. (3) Slack — deploy inside your Slack workspace for internal team use.',
      },
      {
        question: 'Do I need a WhatsApp Business account?',
        answer:
          "Yes. You need a WhatsApp Business account and a dedicated phone number (not your personal WhatsApp). If you don't have one, it takes about 15 minutes to set up through Meta's Business Manager. Agenvik has a step-by-step guide in the docs.",
      },
      {
        question: 'Can the same agent work on both website and WhatsApp?',
        answer:
          'Yes. One Agenvik agent, multiple channels. The same knowledge base and tone works across all channels you enable. You can enable or disable channels without touching the knowledge base.',
      },
      {
        question: 'Can I customise what the chat widget looks like?',
        answer:
          'Basic customisation is available today: agent name, avatar, and greeting message. Full widget theming — colours, fonts, position — is on the roadmap.',
      },
      {
        question: 'Can my human team take over a conversation from the agent?',
        answer:
          "Not yet — human handoff is on the roadmap. Currently, when the Agenvik agent can't answer, it directs the user to your email or contact channel. Live handoff with a team inbox is coming.",
      },
    ],
  },
  {
    id: 'pricing-plans',
    label: 'Pricing & Plans',
    faqs: [
      {
        question: 'What does "messages per month" mean exactly?',
        answer:
          'One message = one question sent to your agent plus one response back. If a user sends 5 messages in one conversation, that counts as 5 messages toward your monthly limit. Test messages you send yourself from the Agenvik dashboard do not count.',
      },
      {
        question: 'What happens if I exceed my message limit?',
        answer:
          "Your agent stops responding to new incoming messages for the rest of that billing month. You'll receive an email warning at 80% of your limit so you have time to upgrade before hitting the cap. Your existing conversations complete normally.",
      },
      {
        question: 'Can I upgrade mid-month?',
        answer:
          'Yes. Upgrades apply immediately and you are charged a prorated amount for the remainder of the month.',
      },
      {
        question: 'Is there an annual billing discount?',
        answer:
          'Not yet. Annual plans with a discount are planned. Email hello@agenvik.com to be notified when they launch.',
      },
      {
        question: 'Do you offer refunds?',
        answer:
          'Yes. Within 7 days of upgrading to a paid Agenvik plan, email us and we will refund in full, no questions asked.',
      },
    ],
  },
  {
    id: 'data-security',
    label: 'Data & Security',
    faqs: [
      {
        question: 'Who can see my uploaded documents?',
        answer:
          'Only you and the agents you have created. Your data is scoped to your account and organisation. Agenvik staff do not access customer knowledge bases except when required to resolve a specific support issue you have raised, with your permission.',
      },
      {
        question: "Is my data used to train Agenvik's AI models?",
        answer:
          'No. Your documents are used only to answer questions for your own agents. Agenvik does not use your content to train any shared or general-purpose AI model.',
      },
      {
        question: 'Can I delete my data?',
        answer:
          'Yes. You can delete individual knowledge sources, entire agents, or your full account at any time. Deletion is permanent and immediate.',
      },
    ],
  },
];

// Flat list derived from categories (used for FAQPage schema on /faq)
export const allFaqs: FAQ[] = faqCategories.flatMap((c) => c.faqs);

// FAQPage schema for /faq page — all questions
export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: allFaqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

// Legacy flat export — kept for any component that still imports `faqs`
export const faqs = allFaqs;
