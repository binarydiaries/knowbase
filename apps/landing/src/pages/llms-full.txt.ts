import type { APIRoute } from 'astro';
import { faqCategories } from '../data/faqs';

export const GET: APIRoute = () => {
  // Build FAQ section from live data
  const faqSection = faqCategories
    .map((cat) => {
      const questions = cat.faqs
        .map((faq) => `### ${faq.question}\n\n${faq.answer}`)
        .join('\n\n');
      return `## ${cat.label}\n\n${questions}`;
    })
    .join('\n\n---\n\n');

  const content = `# Agenvik — Full Content

> Agenvik is an AI agent platform that lets any business build and deploy AI agents trained on their own documents, FAQs, and websites — without writing code. Agents answer questions accurately from your content only, with no hallucinations. Deploy on website chat, WhatsApp, or Slack.

---

## What is Agenvik?

Agenvik is a platform for building AI-powered agents trained on your own business knowledge. You upload documents (PDFs, plain text, Q&A pairs) or point the platform at a URL. Agenvik indexes the content, creates vector embeddings, and deploys a conversational agent that answers questions using only that content.

Unlike generic AI chatbots, Agenvik agents do not answer from the internet or general AI knowledge — they answer exclusively from the knowledge you provide. If the answer is not in your knowledge base, the agent says so.

---

## Key Features

- **Knowledge base builder** — upload PDFs, paste plain text, add Q&A pairs, or index URLs
- **RAG architecture** — retrieval-augmented generation grounds every answer in your actual documents
- **Multi-channel deployment** — website chat widget (one line of code), WhatsApp Business, Slack
- **Agent customisation** — name, avatar, tone, greeting message, and fallback response
- **Conversation analytics** — view every conversation, identify knowledge gaps, track volume
- **No hallucinations** — agents are scoped strictly to your knowledge base
- **No coding required** — setup takes under 30 minutes for non-technical users

---

## Pricing

### Free
- 1 AI agent
- 10 knowledge sources
- 100 conversations per month
- Website chat widget
- No credit card required

### Starter
- 3 AI agents
- 250 knowledge sources
- Website chat + WhatsApp + Slack channels

### Growth
- 10 AI agents
- 1,000 knowledge sources
- All channels

### Pro
- 30 AI agents
- 5,000 knowledge sources
- All channels + priority support

Upgrades apply immediately and are prorated. 7-day full refund guarantee on paid plans.

---

## Supported Channels

1. **Website chat widget** — embeds on any site with a single line of code (Webflow, Shopify, WordPress, custom HTML)
2. **WhatsApp** — connect a WhatsApp Business number; requires a Meta Business Manager account
3. **Slack** — deploy inside a Slack workspace for internal team use

---

## Supported Knowledge Source Formats

- PDF documents (policies, manuals, guides, reports)
- Plain text (paste any text directly)
- Q&A pairs (structured question-and-answer format)
- Website URLs (Agenvik reads and indexes the page content)

---

## Use Cases

- **Real estate** — property listings, area guides, FAQs, lead qualification
- **Clinics and hospitals** — appointment FAQs, service information, patient-facing support
- **E-commerce** — shipping, returns, product questions, order support
- **SaaS companies** — in-product help, onboarding, feature discovery
- **Education and coaches** — course FAQs, curriculum questions, student support
- **Internal teams** — company knowledge base, HR policies, onboarding assistant

---

## FAQ

${faqSection}

---

## Release History

### v0.6.0 — May 26, 2026 (latest)

- **PDF knowledge source** — Upload any PDF as a knowledge source. Agenvik extracts text page-by-page and indexes it automatically. Supports documents up to 200,000 characters.
- **Website URL knowledge source** — Point an agent at any public webpage. Agenvik fetches, strips, and indexes the content without manual copy-pasting.
- **Training reminder** — First-time users see a guided prompt after adding their first knowledge source, so no agent goes live without being trained.
- **Conversation filter** — Filter the conversation list in the dashboard to find specific chats quickly.

### v0.1.0 — May 20, 2026 (public launch)

- Agenvik launched publicly. Businesses can build AI agents from their own knowledge and deploy them on their website, WhatsApp, or Slack — no coding required.

### v0.5.0 — May 8, 2026

- **Dark mode** — Full dark mode support in the dashboard.
- **Notification sound** — Chat widget plays a soft tone on new messages; users can mute/unmute per session.
- **Suggestion questions** — Configure up to four suggested questions shown before the first message in the chat widget.
- **Bubble color customization** — Set a custom chat bubble color per agent to match brand colors.
- **Rich text editor** — Upgraded knowledge source editor with cleaner toolbar and improved paste behavior.

### v0.4.0 — April 21, 2026

- **Lead generation** — Agents can collect visitor contact details (name, email, phone) through natural conversation. Leads appear in the dashboard and can be exported.
- **Live billing plans** — Subscription management is live; upgrade, downgrade, or cancel from the dashboard.

### v0.2.0 — April 2026

- **Chat UX polish** — Messages auto-scroll to latest reply; New Chat button lets visitors start a fresh conversation; keyboard navigation improved.

---

## Company

Agenvik is a bootstrapped company founded in 2025, based in India.
Contact: hello@agenvik.com
App: https://app.agenvik.com
Docs: https://agenvik.com/docs
`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
