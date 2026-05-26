import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const content = `# Agenvik

> Agenvik is an AI agent platform that lets any business build and deploy AI agents trained on their own documents, FAQs, and websites — without writing code. Agents answer questions accurately from your content only, with no hallucinations. Deploy on website chat, WhatsApp, or Slack.

## Pages

- [Home](https://agenvik.com/): Platform overview, core value proposition, features summary, pricing tiers, and how Agenvik works
- [Features](https://agenvik.com/features): Full feature breakdown — knowledge base builder, multi-channel deployment, agent customisation, analytics, and coming-soon roadmap
- [Pricing](https://agenvik.com/pricing): Free, Starter, Growth, and Pro plans with per-plan limits on agents, knowledge sources, and monthly messages
- [Use Cases](https://agenvik.com/use-cases): Industry-specific use cases — real estate, clinics and hospitals, e-commerce, SaaS, education, and internal team knowledge bases
- [FAQ](https://agenvik.com/faq): Common questions about setup time, knowledge training, supported file formats, channels, pricing, data security, and what happens when the agent doesn't know an answer
- [Blog](https://agenvik.com/blog): Tutorials, guides, and product updates from the Agenvik team
- [About](https://agenvik.com/about): Company background, founding story, philosophy on AI accuracy and simplicity
- [Book a Demo](https://agenvik.com/book-demo): Request a personalised 30-minute live walkthrough — bring your own documents and see a working agent built in real time
- [Documentation](https://agenvik.com/docs): Setup guides, developer API reference, and help articles
- [Changelog](https://agenvik.com/changelog): Full release history — every new feature, improvement, and fix across all versions. Latest: v0.6.0 (May 26, 2026)
- [Privacy Policy](https://agenvik.com/privacy-policy): How Agenvik collects, uses, and protects personal data
- [Security Policy](https://agenvik.com/security-policy): Infrastructure security, data isolation, access controls, and vulnerability disclosure
- [Terms & Conditions](https://agenvik.com/terms): Terms governing use of the Agenvik platform

## Full Content

- [llms-full.txt](https://agenvik.com/llms-full.txt): Complete product details, pricing tiers, all FAQ questions and answers

## Contact

- General: hello@agenvik.com
- Security: security@agenvik.com
- App: https://app.agenvik.com
`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
