# FAQ Page — `/faq`

**Purpose:** Answer every real question a buyer has before signing up. This page also targets "how to X with AI" search queries — each question is written to match what people actually type.

**Meta title:** Agenvik FAQ — How it Works, Pricing, Data Security & More
**Meta description:** Answers to the most common questions about building AI agents with Agenvik — setup, pricing, data privacy, channels, and what happens when something goes wrong.

---

## NAV
Same as homepage.

---

## SECTION 1 — Header

### Eyebrow
✦ FAQ

### H1
Everything you want to know about Agenvik

### Subhead
Can't find your answer? Email us at hello@agenvik.com — we reply to every message.

### Search bar (optional future enhancement)
[PLACEHOLDER: "Search questions..." — add when there are 20+ questions]

---

## SECTION 2 — FAQ Categories

### Category nav (horizontal tabs or anchor links)
- Getting Started
- Knowledge & Training
- Channels & Deployment
- Pricing & Plans
- Data & Security
- Troubleshooting

---

## CATEGORY: Getting Started

**Q: What is Agenvik?**
Agenvik is a platform that lets you build AI agents trained on your own content — documents, FAQs, websites. Once trained, your agent answers questions from customers, team members, or students over any channel you choose: website chat, WhatsApp, or Slack.

It's different from generic AI chatbots because it only speaks from what you've given it. No hallucinations. No off-topic responses.

**Q: Do I need technical skills to use Agenvik?**
No. Agenvik is designed for non-technical users. You upload documents, fill in a few settings, copy one line of code for the website widget, and you're done. The most technical thing you'll do is paste an embed snippet.

If you do have technical skills, there's a developer API coming soon.

**Q: How long does it take to set up my first agent?**
Most users go from sign-up to a live agent in under 30 minutes. The core steps — uploading documents, naming your agent, configuring tone — take about 10 minutes. Getting it on your website takes another 2 minutes with the embed code.

WhatsApp setup takes a bit longer (15–20 minutes) because it requires connecting a WhatsApp Business number.

**Q: What's the difference between an AI agent and a regular chatbot?**
Traditional chatbots follow scripts — you define every possible question and response in a flow diagram. If someone asks something slightly differently, the bot breaks.

An AI agent understands natural language. You don't pre-write every answer — instead, you give it your actual content and it figures out how to answer any question from that material. It's the difference between teaching someone a script and teaching them the subject.

**Q: Can I try Agenvik before paying?**
Yes. The free plan lets you create 1 agent, add up to 10 knowledge sources, and handle 100 conversations per month — forever. No credit card required. You only need to upgrade when you want more capacity or channels like WhatsApp.

**Q: Can I create multiple agents?**
Yes. Each agent is independent — its own name, knowledge base, tone, and channels. Starter gives you 3 agents, Growth gives you 10, Pro gives you 30.

A common pattern: one agent for public customer support, a separate one for internal team knowledge, and a third as a sales qualifier.

---

## CATEGORY: Knowledge & Training

**Q: What types of content can I upload?**
Four formats are supported today:
- **PDF documents** — policy docs, manuals, guides, reports
- **Plain text** — paste any text directly
- **Q&A pairs** — structured question-and-answer format for FAQs
- **Website URLs** — point your agent at a URL and it reads and indexes the page content

**Q: Can I train my agent on a PDF?**
Yes. Upload the PDF in the Knowledge section. Agenvik breaks it into chunks, creates embeddings, and stores them. Your agent can then answer questions using the exact content in that document, and will cite the source in its responses.

**Q: How many documents can I upload?**
The number of knowledge sources depends on your plan: 10 on Free, 250 on Starter, 1,000 on Growth, 5,000 on Pro. One document = one knowledge source. One URL = one knowledge source.

**Q: Does it index my entire website if I give it a URL?**
Currently, it indexes the specific URL you provide — not a full site crawl. To index multiple pages, add each URL as a separate knowledge source. Full site crawl with depth settings is on the roadmap.

**Q: How accurate are the answers?**
Accuracy depends directly on the quality of your knowledge base. If your documents are clear, specific, and well-structured, your agent answers accurately. If your documents are vague or outdated, the answers will reflect that.

Agenvik uses a RAG (Retrieval-Augmented Generation) architecture — answers are constructed from retrieved passages in your documents, not generated from the AI's general knowledge. This means the agent won't answer questions your documents don't cover, which is a feature, not a bug.

**Q: What if my agent doesn't know the answer?**
It says so. The agent is configured to respond with something like "I don't have that information — please contact [your email]" rather than guessing. You can customise this fallback message.

**Q: Can I update my agent's knowledge after it's live?**
Yes, at any time. Add new documents, delete outdated ones, edit text. After updating, click "Train" to re-index. Changes are live within a few minutes.

**Q: How often should I update my agent's knowledge?**
Whenever your source material changes. If you update your refund policy, upload the new version. If you launch a new product feature, add the documentation. The agent is only as accurate as the information you give it.

---

## CATEGORY: Channels & Deployment

**Q: Where can I deploy my agent?**
Three channels today:
1. **Website chat widget** — embeds on any website with a single line of code. Works on all website platforms (Webflow, Shopify, WordPress, custom HTML, etc.)
2. **WhatsApp** — connect your WhatsApp Business number. Your agent handles incoming messages automatically.
3. **Slack** — deploy inside your Slack workspace for internal use.

**Q: How do I add the chat widget to my website?**
Copy the embed snippet from your agent's "Deploy" tab. Paste it before the closing `</body>` tag on your website. The widget appears immediately. No build step, no frameworks, no dependencies.

If you're on Webflow, Shopify, or WordPress, there are specific instructions in the help docs for where to paste the snippet on each platform.

**Q: Do I need a WhatsApp Business account?**
Yes. You need a WhatsApp Business account and a phone number dedicated to it (not your personal WhatsApp number). If you don't have one, it takes about 15 minutes to set up through Meta's Business Manager. We have a step-by-step guide in the docs.

**Q: Can the same agent work on both website and WhatsApp?**
Yes. One agent, multiple channels. The same knowledge base and tone works across all channels you enable. You can enable or disable channels without touching the agent's knowledge.

**Q: Can I customise what the chat widget looks like?**
Basic customisation is available today: agent name, avatar, and greeting message. Full widget theming (colours, fonts, position) is on the roadmap.

**Q: Can my human team take over a conversation from the agent?**
Not yet — human handoff is on the roadmap. Currently, when the agent can't answer, it directs the user to your email or contact channel. Live handoff with a team inbox is coming.

---

## CATEGORY: Pricing & Plans

**Q: What does "messages per month" mean exactly?**
One message = one question sent to your agent + one response back. If a user sends 5 messages in one conversation, that counts as 5 messages toward your monthly limit. Test messages you send yourself from the dashboard don't count.

**Q: What happens if I exceed my message limit?**
Your agent stops responding to new incoming messages for the rest of that billing month. You'll receive an email warning at 80% of your limit so you have time to upgrade before hitting the cap. Your existing conversations complete normally.

**Q: Can I upgrade mid-month?**
Yes. Upgrades apply immediately and you're charged a prorated amount for the remainder of the month.

**Q: Is there an annual billing discount?**
Not yet. Annual plans with a discount are planned. Email hello@agenvik.com to be notified when they launch.

**Q: Do you offer refunds?**
Yes. Within 7 days of upgrading to a paid plan, email us and we'll refund in full, no questions asked.

---

## CATEGORY: Data & Security

**Q: Who can see my uploaded documents?**
Only you and the agents you've created. Your data is scoped to your account and organisation. Agenvik staff do not access customer knowledge bases except when required to resolve a specific support issue you've raised, with your permission.

**Q: Is my data used to train Agenvik's AI models?**
No. Your documents are used only to answer questions for your own agents. They are not used to train any shared or general-purpose AI model.

**Q: Where is my data stored?**
[PLACEHOLDER: Add data residency details once confirmed — region, cloud provider]

**Q: Is the chat widget GDPR compliant?**
[PLACEHOLDER: Add GDPR/data processing details. At minimum: no PII stored in conversations by default, data deletion on request, DPA available on request for paid plans]

**Q: Can I delete my data?**
Yes. You can delete individual knowledge sources, entire agents, or your full account at any time. Deletion is permanent and immediate.

---

## CATEGORY: Troubleshooting

**Q: My agent is giving wrong answers. What do I do?**
1. Check the conversation log to see which question triggered the wrong answer
2. Check if your knowledge base contains the correct information for that question
3. If the information is missing, add it as a knowledge source
4. If the information is there but the answer is wrong, try rephrasing or restructuring the relevant section in your document
5. Retrain the agent after making changes

Most accuracy issues come from missing or ambiguous content in the knowledge base, not from the AI itself.

**Q: The chat widget isn't showing on my website. What's wrong?**
Common causes:
- The snippet was added inside a JavaScript bundle (should go in raw HTML before `</body>`)
- A Content Security Policy (CSP) header is blocking the script — add `app.agenvik.com` to your CSP allowlist
- Ad-blockers or browser extensions are hiding it (test in incognito mode)

If none of these help, email hello@agenvik.com with your site URL.

**Q: My WhatsApp connection stopped working.**
WhatsApp Business API connections can disconnect if the access token expires or the Meta app permissions change. Go to Settings → Channels → WhatsApp and reconnect. If the issue persists, check your Meta Business Manager for any policy flags on your account.

**Q: Can I export my conversation data?**
[PLACEHOLDER: Add when data export is available. For now:] Conversation logs are viewable in the dashboard. Export functionality is on the roadmap. For urgent data needs, contact hello@agenvik.com.

---

## SECTION 3 — Still have a question?

### H2
Didn't find your answer?

### Body
We're a small team and we reply to every email. Reach out at hello@agenvik.com and we'll get back to you within 24 hours on weekdays.

### CTA
**Button:** Email us → (links to `mailto:hello@agenvik.com`)
**Secondary:** Or book a 20-min call → (links to `/book-demo`)

---

## FOOTER
Same as homepage.
