export type ContentBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'quote'; text: string; author?: string };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: ContentBlock[];
  author: string;
  publishedAt: string;
  readTime: number;
  tags: string[];
  gradient: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'build-ai-customer-support-agent',
    title: 'How to Build an AI Customer Support Agent in 5 Minutes',
    excerpt:
      'Step-by-step walkthrough of creating a fully functional AI support agent using your existing documentation — no coding required.',
    author: 'Agenvik Team',
    publishedAt: '2026-04-28',
    readTime: 5,
    tags: ['Tutorial', 'Customer Support'],
    gradient: 'from-[#301B69] to-[#7B4FA6]',
    content: [
      {
        type: 'p',
        text: 'Customer support is one of the highest-leverage places to deploy an AI agent. A well-configured agent can handle 60–80% of incoming queries instantly, around the clock, without any human intervention. The best part? You can have one running in under five minutes with Agenvik.',
      },
      {
        type: 'h2',
        text: 'What You Need Before Starting',
      },
      {
        type: 'ul',
        items: [
          'An Agenvik account (free tier works)',
          'Your existing support documentation, FAQs, or knowledge base (PDF, DOCX, or plain text)',
          'Five minutes of your time',
        ],
      },
      {
        type: 'h2',
        text: 'Step 1: Create Your Agent',
      },
      {
        type: 'p',
        text: 'Log in to your Agenvik dashboard and click "New Agent". Give it a name and a short description of what it should help with — for example, "Support Bot for Acme SaaS". This description is used by the AI to stay on-topic.',
      },
      {
        type: 'h2',
        text: 'Step 2: Upload Your Knowledge',
      },
      {
        type: 'p',
        text: 'Navigate to the Knowledge tab and drag-and-drop your support documents. Agenvik accepts PDFs, Word docs, plain text files, and even raw URLs. The platform automatically chunks, embeds, and indexes your content using semantic search — so your agent can find the right answer even when the user phrases their question differently.',
      },
      {
        type: 'quote',
        text: 'Semantic search means your agent understands what users mean, not just what they literally typed. A question like "how do I cancel?" will match your "Subscription Management" documentation even if the word "cancel" never appears.',
      },
      {
        type: 'h2',
        text: 'Step 3: Customize Behaviour',
      },
      {
        type: 'p',
        text: 'Head to the Behaviour tab to set the agent\'s tone, escalation rules, and fallback messages. You can instruct the agent to always recommend a human handoff for billing questions, or to collect the user\'s email before answering certain topics.',
      },
      {
        type: 'h2',
        text: 'Step 4: Embed on Your Site',
      },
      {
        type: 'p',
        text: 'Copy the one-line embed snippet from the Channels tab and paste it into your website\'s HTML. The chat widget appears automatically. You can also deploy to WhatsApp or Slack from the same screen.',
      },
      {
        type: 'h2',
        text: 'Step 5: Monitor and Improve',
      },
      {
        type: 'p',
        text: 'Check the Analytics tab after a few days. You\'ll see which questions are answered confidently, where the agent struggles, and what topics users ask about most. Add more documents or refine your instructions to close the gaps.',
      },
      {
        type: 'h2',
        text: 'Results You Can Expect',
      },
      {
        type: 'ul',
        items: [
          'Response time drops from hours to milliseconds',
          '60–80% of tickets handled without human involvement',
          '24/7 availability across all time zones',
          'Consistent, on-brand answers every time',
        ],
      },
      {
        type: 'p',
        text: 'Building a great AI support agent is no longer a months-long engineering project. With Agenvik, it\'s an afternoon task — and your customers will notice the difference immediately.',
      },
    ],
  },
  {
    slug: 'rag-vs-fine-tuning',
    title: 'RAG vs Fine-tuning: Which Approach Is Right for Your AI Chatbot?',
    excerpt:
      'A clear breakdown of retrieval-augmented generation and fine-tuning — when to use each, what the trade-offs are, and why most products should start with RAG.',
    author: 'Agenvik Team',
    publishedAt: '2026-04-15',
    readTime: 7,
    tags: ['AI', 'Technical'],
    gradient: 'from-[#1a3a6e] to-[#4A90D9]',
    content: [
      {
        type: 'p',
        text: 'When building an AI chatbot for your product, you\'ll quickly encounter two schools of thought: retrieval-augmented generation (RAG) and fine-tuning. Both can produce accurate, relevant answers — but they work in fundamentally different ways and suit different situations. Getting this choice right will save you weeks of engineering time and thousands of dollars.',
      },
      {
        type: 'h2',
        text: 'What Is Fine-tuning?',
      },
      {
        type: 'p',
        text: 'Fine-tuning means taking a base language model and continuing to train it on your specific data. The model\'s weights are updated so it "bakes in" knowledge about your product, your tone, and your domain. Once trained, the knowledge is part of the model itself.',
      },
      {
        type: 'h3',
        text: 'Strengths of fine-tuning',
      },
      {
        type: 'ul',
        items: [
          'Excellent for learning style, tone, and format (e.g., always respond in bullet points)',
          'No retrieval step needed at inference time — faster latency',
          'Great for highly repetitive, stable knowledge that never changes',
        ],
      },
      {
        type: 'h3',
        text: 'Weaknesses of fine-tuning',
      },
      {
        type: 'ul',
        items: [
          'Expensive and slow — requires GPU time and ML expertise',
          'Static: when your knowledge changes, you must retrain',
          'Poor at citing sources or showing where an answer came from',
          'Can hallucinate confidently if the training data had gaps',
        ],
      },
      {
        type: 'h2',
        text: 'What Is RAG?',
      },
      {
        type: 'p',
        text: 'RAG keeps the base language model frozen and instead retrieves relevant chunks of your documents at query time, then passes them to the model as context. The model generates an answer grounded in those retrieved chunks — not from its parametric memory.',
      },
      {
        type: 'h3',
        text: 'Strengths of RAG',
      },
      {
        type: 'ul',
        items: [
          'Knowledge can be updated instantly — add a new document and the agent knows it immediately',
          'Answers are grounded in real source material, dramatically reducing hallucination',
          'No retraining required — swap documents, not models',
          'Easy to audit: you can always see which chunks informed the answer',
          'Much cheaper to operate than a continuously fine-tuned model',
        ],
      },
      {
        type: 'h3',
        text: 'Weaknesses of RAG',
      },
      {
        type: 'ul',
        items: [
          'Retrieval quality matters — poorly structured documents lead to poor answers',
          'Slightly higher latency than a pure generation call',
          'Doesn\'t inherently learn style or tone from your documents',
        ],
      },
      {
        type: 'h2',
        text: 'The Practical Decision Framework',
      },
      {
        type: 'quote',
        text: 'Use RAG when your knowledge changes frequently or when accuracy and traceability matter. Use fine-tuning when you need consistent style and tone, and your knowledge is stable.',
      },
      {
        type: 'p',
        text: 'For the vast majority of product chatbots — customer support, internal knowledge bases, onboarding assistants — RAG is the right starting point. Your product documentation changes constantly. Your pricing updates. New features ship. Fine-tuning a model every time something changes is not viable.',
      },
      {
        type: 'h2',
        text: 'Can You Use Both?',
      },
      {
        type: 'p',
        text: 'Yes, and many production systems do. A common pattern is to fine-tune the base model once to adopt a specific persona, tone, and output format, then use RAG at inference time for factual grounding. This gives you the style consistency of fine-tuning with the accuracy and freshness of RAG.',
      },
      {
        type: 'h2',
        text: 'What Agenvik Uses',
      },
      {
        type: 'p',
        text: 'Agenvik is built on a RAG architecture using OpenAI embeddings and pgvector for semantic retrieval. When your agent receives a question, it searches your documents for the most semantically relevant passages and constructs a grounded prompt for the language model. This means your agent stays accurate as your knowledge base evolves — without any retraining.',
      },
    ],
  },
  {
    slug: '5-ways-ai-agents-reduce-support-costs',
    title: '5 Ways AI Agents Can Reduce Your Support Costs by 60%',
    excerpt:
      'Real business outcomes from teams that deployed AI agents on their support channels — and the specific mechanisms that drive the savings.',
    author: 'Agenvik Team',
    publishedAt: '2026-04-02',
    readTime: 4,
    tags: ['Business', 'ROI'],
    gradient: 'from-[#2D6A4F] to-[#52B788]',
    content: [
      {
        type: 'p',
        text: 'Customer support costs grow linearly with your user base — unless you break the link. AI agents are the most effective tool available today to do exactly that. Here are the five mechanisms that consistently deliver 50–70% cost reductions for teams that deploy them well.',
      },
      {
        type: 'h2',
        text: '1. Deflecting Tier-1 Tickets Entirely',
      },
      {
        type: 'p',
        text: 'The majority of support tickets are repetitive: "How do I reset my password?", "Where is my invoice?", "How do I connect my account to X?" These questions are trivially answerable by an AI agent with access to your documentation. Every deflected ticket is a direct cost saving — typically $5–$25 per ticket depending on your support cost structure.',
      },
      {
        type: 'h2',
        text: '2. Eliminating Wait Time as a Cost Driver',
      },
      {
        type: 'p',
        text: 'Human agents spend a significant portion of their time waiting — for the user to respond, for an internal tool to load, for a senior agent to become available. AI agents respond in milliseconds and never idle. This alone compresses conversations that might take 20 minutes over email into under 2 minutes.',
      },
      {
        type: 'h2',
        text: '3. 24/7 Coverage Without Overtime',
      },
      {
        type: 'p',
        text: 'Staffing for global time zones requires either expensive overnight shifts or degraded service quality for users in non-primary markets. An AI agent covers every timezone simultaneously for a flat infrastructure cost. Teams report that 30–40% of their support requests come outside business hours — all of which can be handled autonomously.',
      },
      {
        type: 'quote',
        text: 'We used to have a 6-hour average first response time for our APAC users. After deploying an AI agent, it dropped to under 30 seconds.',
        author: 'Head of Support, B2B SaaS company',
      },
      {
        type: 'h2',
        text: '4. Freeing Human Agents for High-Value Work',
      },
      {
        type: 'p',
        text: 'When AI handles the routine, your human agents focus on complex, sensitive, or high-value conversations — onboarding enterprise clients, handling escalations, and building relationships. This increases job satisfaction, reduces churn among your support staff, and lets you handle more volume with the same headcount rather than hiring proportionally.',
      },
      {
        type: 'h2',
        text: '5. Consistent Quality at Scale',
      },
      {
        type: 'p',
        text: 'Human agents have good days and bad days. New hires make mistakes. An AI agent gives the same quality answer at 3am on a Sunday as it does at 9am on Monday. Consistency reduces the cost of quality assurance, re-work, and customer recovery from bad support experiences.',
      },
      {
        type: 'h2',
        text: 'The Numbers',
      },
      {
        type: 'ul',
        items: [
          '60–80% of Tier-1 tickets deflected on average',
          '$5–$25 saved per deflected ticket',
          '30–40% of volume comes outside business hours',
          'Human agent capacity doubles without new hires',
          'CSAT scores typically improve 15–25 points',
        ],
      },
      {
        type: 'p',
        text: 'The ROI math is straightforward. If you\'re handling 10,000 tickets a month at $10 average cost, AI deflection of 65% saves $65,000 per month. The economics are even more compelling as you scale.',
      },
      {
        type: 'p',
        text: 'Getting started doesn\'t require a large investment. Agenvik\'s free tier lets you deploy an AI agent on your documentation in minutes, with no coding required. The cost reduction starts from day one.',
      },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
