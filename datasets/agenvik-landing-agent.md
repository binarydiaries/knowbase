# Agenvik Landing Page Agent — Complete Dataset

> **Purpose:** This file is the authoritative knowledge base and configuration guide for the Agenvik landing-page AI agent. It covers agent behavior settings, channel configuration, all knowledge content, and FAQs. Copy the relevant sections directly into the Agenvik platform when setting up the agent.

---

## 1. Agent Configuration

### 1.1 Agent Identity

| Field       | Value                                                                 |
|-------------|-----------------------------------------------------------------------|
| Name        | Agenvik Assistant                                                     |
| Description | Answers visitor questions about Agenvik — features, pricing, and how to get started. |
| Status      | Active                                                                |

---

### 1.2 Behavior Settings

| Setting          | Recommended Value                                                    |
|------------------|----------------------------------------------------------------------|
| Tone             | `friendly`                                                           |
| Verbosity        | `balanced`                                                           |
| Fallback message | `I don't have that information right now. For more details, reach out to us at hello@agenvik.com.` |

**System Prompt:**

```
You are the Agenvik Assistant — a friendly, knowledgeable guide for visitors on the Agenvik website.

Your job is to help visitors understand what Agenvik is, how it works, what it costs, and how to get started. You represent the Agenvik brand with warmth and confidence.

Always answer using the knowledge base provided. Be concise but complete. If a visitor seems interested in signing up or needs more help, encourage them to get started at agenvik.com or contact the team at hello@agenvik.com.
```

**Guardrails:**

```
- Do not discuss competitor platforms or make comparisons.
- Do not make promises about future features, release dates, or availability that are not confirmed in the knowledge base.
- Do not discuss internal system architecture, pricing structures beyond what is documented, or employee information.
- Do not engage with off-topic requests unrelated to Agenvik (e.g., general coding help, unrelated research).
- Do not accept, store, or process any personal data beyond what is naturally shared in conversation.
- Always redirect billing disputes or account issues to hello@agenvik.com.
- Do not claim to be a human. If asked, confirm you are an AI assistant for Agenvik.
```

---

### 1.3 Channel Configuration — Web

| Setting            | Value                                                    |
|--------------------|----------------------------------------------------------|
| Display Name       | Agenvik Assistant                                        |
| Subtitle           | Ask me anything about Agenvik                            |
| Welcome Message    | Hi there! 👋 I'm the Agenvik Assistant. Ask me anything about our platform, pricing, or how to get started. |
| Input Placeholder  | Ask about features, pricing, or how it works...          |
| Primary Color      | `#301B69`                                                |
| Allowed Domains    | `agenvik.com`, `www.agenvik.com`                         |

> **Brand note:** The primary color `#301B69` is Agenvik's deep purple — the dominant color across all UI elements, headings, and CTAs on the landing page. The accent gradient ends at `#B07CD1` (soft lavender). Use `#301B69` as the chat widget's primary color for a consistent on-brand experience.

---

## 2. Knowledge Base — Text Sources

### 2.1 About Agenvik

**Title:** What is Agenvik

**Content:**

Agenvik is an AI agent platform that lets anyone build intelligent assistants trained on their own data. Instead of giving generic responses, Agenvik agents answer based on the specific knowledge you provide — your documents, notes, FAQs, and more.

Agenvik works for individuals, teams, and businesses of all sizes. You do not need any coding skills to create and deploy an agent. The platform is designed to be intuitive, fast, and powerful right out of the box.

Agenvik is built around one core belief: AI should be grounded in your knowledge. Every agent you create is unique to you — reflecting your data, your tone, and your use case.

---

### 2.2 Core Features

**Title:** Agenvik Core Features

**Content:**

**Knowledge Sources**
You can train your Agenvik agent using two types of knowledge sources:
- **Text** — paste in articles, documentation, product descriptions, policies, or any free-form content. Maximum 10,000 characters per text source.
- **Q&A (Questions & Answers)** — create structured question-and-answer pairs for precise, predictable responses. Up to 50 Q&A pairs per source, with a combined maximum of 20,000 characters.

You can add multiple knowledge sources to a single agent. The agent uses all sources together to answer questions accurately and contextually.

**Instant Agent Creation**
Create a fully functional AI agent in seconds. There is no configuration overhead, no technical setup, and no coding required. Simply define your agent, add your knowledge, and it is ready to go.

**Real-Time Responses**
Agenvik agents deliver fast, streaming responses. They are optimised for low latency and high relevance, ensuring users get answers immediately.

**Smart Retrieval**
The platform uses AI-powered semantic retrieval to find the most relevant parts of your knowledge base for every question asked. Agents understand context, not just keywords.

**Custom Behavior**
You can fully control how your agent behaves. Set the tone (friendly, professional, or neutral), adjust verbosity (short, balanced, or detailed), write a custom system prompt, and define guardrails to restrict what the agent will and will not say.

**Multi-Channel Deployment**
Deploy your agent across multiple channels — embed it on your website, connect it to WhatsApp, or integrate it with Slack. Each channel can be configured independently.

**Lead Generation Actions**
Agents can be configured to collect lead information (name, email, phone, company) during natural conversation. Lead collection is triggered intelligently based on visitor intent.

**Analytics**
Available on Growth and Pro plans. Track message volume, agent usage, and user interaction patterns over time from a single dashboard.

---

### 2.3 How It Works

**Title:** How Agenvik Works — Step by Step

**Content:**

Getting started with Agenvik takes only a few minutes. Here is how it works:

**Step 1 — Set Up Your Account**
Sign up at agenvik.com. Your dashboard is ready immediately. There is no lengthy onboarding, no credit card required for the free plan, and no complex configuration to complete before you can start building.

**Step 2 — Create Your Agent**
Give your agent a name and a description that reflects its purpose. You can create multiple agents — one for customer support, one for internal knowledge, one for your product — each completely independent from the others.

**Step 3 — Add Knowledge**
Upload text content or add structured Q&A pairs to build your agent's knowledge base. Your agent learns from the real information you provide. You can continuously expand and update its knowledge as your needs evolve.

**Step 4 — Customize Behavior**
Control how your agent thinks and responds. Adjust its tone, set response verbosity, write a custom system prompt, and configure guardrails to keep it focused and on-brand. You can also set a fallback message for when the agent cannot answer a question.

**Step 5 — Embed and Share**
Deploy your agent wherever your users are. Embed it on your website using the web channel, connect it to WhatsApp for mobile conversations, or integrate it with Slack for internal team use. Your agent is shareable and accessible the moment it is published.

---

### 2.4 Channels

**Title:** Agenvik Channels — Where You Can Deploy Your Agent

**Content:**

Agenvik supports multiple deployment channels. Each agent can be connected to one or more channels.

**Web Channel**
Embed your agent directly on any website as a chat widget. You can customise the widget's display name, subtitle, welcome message, input placeholder text, and primary color. You can restrict the widget to specific allowed domains for security. The web channel is available on all plans.

**WhatsApp Channel**
Connect your agent to WhatsApp Business to let users chat with your agent via WhatsApp messages. WhatsApp integration requires a phone number ID from the WhatsApp Business API. WhatsApp is available on the Starter, Growth, and Pro plans.

**Slack Channel**
Integrate your agent with a Slack workspace. You can configure the agent to respond in a specific Slack channel, activate on mentions, or respond to a custom slash command. Slack integration is available and requires a Slack workspace connection.

**Instagram** *(coming soon)*
Instagram channel support is planned for a future release.

---

### 2.5 Pricing and Plans

**Title:** Agenvik Pricing Plans

**Content:**

Agenvik offers four subscription plans. All plans are billed monthly.

---

**Free Plan — ₹0 forever**
- 1 active agent
- 10 knowledge sources
- 100 messages per month
- 3 training runs per day
- Web channel
- No credit card required

---

**Starter Plan — ₹499 per month**
- 3 active agents
- 250 knowledge sources
- 500 messages per month
- 10 training runs per day
- Web channel
- WhatsApp channel

---

**Growth Plan — ₹1,499 per month** *(Most Popular)*
- 10 active agents
- 1,000 knowledge sources
- 2,000 messages per month
- 20 training runs per day
- Web channel
- WhatsApp channel
- Analytics

---

**Pro Plan — ₹3,999 per month**
- 30 active agents
- 5,000 knowledge sources
- 8,000 messages per month
- 40 training runs per day
- Web channel
- WhatsApp channel
- Analytics
- Priority support

---

All paid plans can be started immediately. Upgrades take effect right away. There are no hidden fees and no long-term contracts — cancel any time.

---

### 2.6 Security and Privacy

**Title:** Data Security and Privacy at Agenvik

**Content:**

Your data is private and scoped exclusively to your account. Agenvik does not expose your knowledge base publicly. Only you and the agents you configure can access your uploaded content.

Agenvik implements industry-standard security measures including encryption in transit (TLS) and encryption at rest. Access controls are enforced at the account and organisation level.

Agenvik does not sell your personal information to third parties.

If you delete your account, your personal information will be deleted or anonymised within 30 days, except where retention is required by law.

For privacy-related requests, contact privacy@agenvik.com. For general enquiries, contact hello@agenvik.com.

More advanced security controls are on the roadmap for future releases.

---

### 2.7 Use Cases

**Title:** What Can You Build With Agenvik

**Content:**

Agenvik is flexible and works across many different contexts. Here are the most common use cases:

**Customer Support Agents**
Automate repetitive support queries and provide 24/7 instant assistance without growing your team. Train the agent on your help documentation, product FAQs, and policies.

**Product Assistants**
Guide users through your product with contextual, real-time recommendations. Boost conversions and reduce drop-off by giving visitors the right answer at the right moment.

**Internal Knowledge Agents**
Help teams find answers across internal documentation instantly. Reduce dependence on key individuals and improve overall team productivity.

**Study Assistants**
Convert notes and study materials into an interactive AI tutor. Ask questions, explore topics, and learn faster with AI-guided explanations.

**Lead Generation**
Configure your agent to intelligently collect contact information (name, email, phone, company) from interested visitors during natural conversation.

---

### 2.8 Platform Management

**Title:** Managing Your Agents on Agenvik

**Content:**

The Agenvik dashboard gives you full control over all your agents from one place.

**Knowledge Management**
Add, edit, and delete knowledge sources at any time. Re-train your agent after updates to keep responses accurate and current.

**Training Runs**
Every time you update or add knowledge sources, you trigger a training run. Training runs index your content so the agent can retrieve it accurately. Training run limits are per day and reset at midnight.

**Usage Insights**
Available on Growth and Pro plans. Monitor message volume, query patterns, and agent activity over time. Understand exactly how users are interacting with your AI.

**Agent Status**
Agents can be set to active or archived. Archived agents are preserved but not accessible to end users. You can reactivate an archived agent at any time.

**Multiple Agents**
Each agent is fully independent. You can create agents for different use cases, teams, or products — each with its own knowledge base, behavior settings, and channels.

---

### 2.9 Content and Knowledge Source Limits

**Title:** Knowledge Source Validation Rules

**Content:**

When adding knowledge to your agent, the following limits apply:

**Text Sources**
- Maximum 10,000 characters per text source.
- Content should be clear, accurate, and relevant to the questions your agent will be asked.

**Q&A Sources**
- Maximum 50 question-and-answer pairs per Q&A source.
- Maximum 20,000 combined characters across all questions and answers in a single Q&A source.
- Each question and answer should be self-contained and precise.

**Agent Name and Description**
- Agent names and descriptions can be updated at any time from the agent settings page.

**Channel Config**
- The web channel primary color must be a valid hex color code (e.g. `#301B69`).
- Allowed domains should be entered without the `https://` prefix (e.g. `agenvik.com`).
- Welcome message and subtitle are optional but recommended for a better user experience.

**Behavior / Guardrails**
- Tone options: `friendly`, `professional`, `neutral`.
- Verbosity options: `short`, `balanced`, `detailed`.
- Guardrails are free-text restrictions that tell the agent what it must not do. Keep them specific and clear.

---

### 2.10 Contact and Support

**Title:** Agenvik Contact and Support

**Content:**

**General Enquiries**
Email: hello@agenvik.com

**Privacy Requests**
Email: privacy@agenvik.com

**User Guide**
Documentation is available at docs.agenvik.com

**Developer Guide**
API and developer documentation is available at docs.agenvik.com/developer-guide/overview

**Help and Support**
Self-service support resources are available at docs.agenvik.com/help-and-support/overview

Agenvik's support team responds to emails during business hours. Pro plan users receive priority support with faster response times.

---

## 3. Knowledge Base — Q&A Sources

### 3.1 General FAQs

**Title:** Agenvik General FAQ

**Q&A Pairs:**

1. **Q:** What is Agenvik?
   **A:** Agenvik is an AI agent platform that lets you build intelligent assistants trained on your own knowledge. You can create agents from your documents, notes, and FAQs — no coding required. Agents can be deployed on your website, WhatsApp, or Slack.

2. **Q:** Do I need coding skills to use Agenvik?
   **A:** No. Agenvik is designed for everyone. You can create, train, and deploy AI agents without writing a single line of code. The interface is intuitive and beginner-friendly.

3. **Q:** How do I get started with Agenvik?
   **A:** Visit agenvik.com and sign up for free. You can create your first agent immediately — no credit card required. The free plan includes 1 agent, 10 knowledge sources, and 100 messages per month.

4. **Q:** Is there a free plan?
   **A:** Yes. The free plan is ₹0 forever. It includes 1 active agent, 10 knowledge sources, 100 messages per month, and 3 training runs per day. No credit card is needed.

5. **Q:** Can I create multiple agents?
   **A:** Yes. The number of agents you can create depends on your plan — 1 on Free, 3 on Starter, 10 on Growth, and 30 on Pro. Each agent has its own independent knowledge base, behavior settings, and channels.

6. **Q:** What kind of content can I use to train my agent?
   **A:** You can add text content (up to 10,000 characters per source) and structured Q&A pairs (up to 50 pairs, 20,000 combined characters per source). Support for additional formats such as PDFs is coming in a future update.

7. **Q:** How accurate are the agent's responses?
   **A:** Agents answer directly from the knowledge you provide, making responses far more relevant and accurate than generic AI. Accuracy improves as you add well-structured, comprehensive knowledge. You stay in full control of what your agent knows.

8. **Q:** Is my data secure?
   **A:** Yes. Your data is private and scoped to your account. Agenvik does not expose your knowledge base publicly. Data is encrypted in transit and at rest. Agenvik does not sell your personal information.

9. **Q:** Can I customise how my agent behaves?
   **A:** Yes. You can control tone (friendly, professional, neutral), response verbosity (short, balanced, detailed), write a custom system prompt, set a fallback message, and define guardrails. Each agent's behavior is fully customisable.

10. **Q:** Where can I deploy my agent?
    **A:** You can deploy your agent on a website (web channel), WhatsApp (Starter plan and above), and Slack. Instagram support is coming soon.

---

### 3.2 Pricing FAQs

**Title:** Agenvik Pricing FAQ

**Q&A Pairs:**

1. **Q:** How much does Agenvik cost?
   **A:** Agenvik has four plans. Free (₹0/forever), Starter (₹499/month), Growth (₹1,499/month — most popular), and Pro (₹3,999/month). All plans are billed monthly with no long-term contracts.

2. **Q:** What is included in the free plan?
   **A:** The free plan includes 1 active agent, 10 knowledge sources, 100 messages per month, and 3 training runs per day. It is free forever with no credit card required.

3. **Q:** What does the Starter plan include?
   **A:** The Starter plan is ₹499/month and includes 3 active agents, 250 knowledge sources, 500 messages per month, 10 training runs per day, and WhatsApp channel access.

4. **Q:** What does the Growth plan include?
   **A:** The Growth plan is ₹1,499/month and includes 10 active agents, 1,000 knowledge sources, 2,000 messages per month, 20 training runs per day, WhatsApp, and Analytics. It is the most popular plan.

5. **Q:** What does the Pro plan include?
   **A:** The Pro plan is ₹3,999/month and includes 30 active agents, 5,000 knowledge sources, 8,000 messages per month, 40 training runs per day, WhatsApp, Analytics, and priority support.

6. **Q:** Are there any hidden fees?
   **A:** No. There are no hidden fees. You pay only the plan price shown. You can cancel or change your plan at any time.

7. **Q:** Can I upgrade or downgrade my plan?
   **A:** Yes. You can change your plan at any time from your account settings. Upgrades take effect immediately.

8. **Q:** What happens if I exceed my message limit?
   **A:** Agents will stop responding once the monthly message limit is reached. You can upgrade to a higher plan to restore access. Limits reset at the start of each billing cycle.

9. **Q:** Does Agenvik offer a refund?
   **A:** For refund or billing questions, please contact hello@agenvik.com. Our team will review your request and respond promptly.

10. **Q:** Is there a discount for annual billing?
    **A:** Annual billing options are not currently listed. Contact hello@agenvik.com to ask about available billing options.

---

### 3.3 Technical and Platform FAQs

**Title:** Agenvik Technical FAQ

**Q&A Pairs:**

1. **Q:** What is a training run?
   **A:** A training run indexes your knowledge sources so the agent can retrieve them accurately when answering questions. You need to trigger a training run after adding or updating knowledge sources. Each plan has a daily training run limit that resets at midnight.

2. **Q:** What is a knowledge source?
   **A:** A knowledge source is a piece of content you add to your agent — either a text document or a set of Q&A pairs. Each source contributes to the agent's knowledge base. Your plan determines the maximum number of sources you can have.

3. **Q:** What is the difference between a text source and a Q&A source?
   **A:** A text source is free-form content (articles, documentation, descriptions) up to 10,000 characters. A Q&A source is structured question-and-answer pairs — up to 50 pairs per source with a 20,000 character combined limit. Q&A sources are ideal when you know the exact questions users will ask.

4. **Q:** What is the web channel?
   **A:** The web channel lets you embed your agent as a chat widget on any website. You can customise the widget's appearance including display name, subtitle, welcome message, placeholder text, and brand color. You can also restrict it to specific domains.

5. **Q:** How do I connect my agent to WhatsApp?
   **A:** WhatsApp integration requires a WhatsApp Business API phone number ID. Once you have your credentials, you can connect them through the WhatsApp channel settings in your agent dashboard. WhatsApp is available on Starter, Growth, and Pro plans.

6. **Q:** What is a guardrail?
   **A:** Guardrails are instructions that tell your agent what it must not say or do. For example, you can instruct it not to discuss competitors, not to make pricing promises, or to always redirect certain questions to your support team. Guardrails help keep the agent focused and on-brand.

7. **Q:** What is the fallback message?
   **A:** The fallback message is what your agent says when it cannot find a relevant answer in the knowledge base. You can customise this message to direct users to contact support or visit your documentation.

8. **Q:** Can I update my agent's knowledge after it is live?
   **A:** Yes. You can add, edit, or remove knowledge sources at any time. After making changes, trigger a training run to apply the updates. Your agent reflects the latest knowledge immediately after retraining.

9. **Q:** What does "agent status" mean?
   **A:** An agent can be active (accessible to users) or archived (preserved but not accessible). You can archive agents you are not using and reactivate them at any time.

10. **Q:** What analytics does Agenvik provide?
    **A:** On Growth and Pro plans, you can track message volume, agent usage, and query patterns over time from the analytics dashboard. This helps you understand how users interact with your agent and identify gaps in your knowledge base.

---

## 4. Brand Reference

| Element           | Value                                         |
|-------------------|-----------------------------------------------|
| Brand name        | Agenvik                                       |
| Primary color     | `#301B69` (deep purple)                       |
| Gradient accent   | `#B07CD1` (soft lavender)                     |
| Background light  | `#f8f7fc`                                     |
| Primary text      | `#301B69`                                     |
| Muted text        | `#301B69` at 70% opacity                      |
| Widget color      | `#301B69`                                     |
| Contact email     | hello@agenvik.com                             |
| Privacy email     | privacy@agenvik.com                           |
| Website           | agenvik.com                                   |
| Docs              | docs.agenvik.com                              |
| Copyright         | © 2026 Agenvik. All rights reserved.          |

---

## 5. Agent Setup Checklist

Use this checklist when configuring the landing page agent in the Agenvik platform:

- [ ] Create agent: name `Agenvik Assistant`, add description
- [ ] Set behavior: tone `friendly`, verbosity `balanced`
- [ ] Paste system prompt from Section 1.2
- [ ] Paste guardrails from Section 1.2
- [ ] Set fallback message from Section 1.2
- [ ] Add web channel: display name, subtitle, welcome message, placeholder, color `#301B69`
- [ ] Set allowed domains: `agenvik.com`, `www.agenvik.com`
- [ ] Add all text sources from Section 2 (one source per subsection)
- [ ] Add Q&A sources from Section 3 (one source per subsection)
- [ ] Trigger training run after all sources are added
- [ ] Test agent on the web channel before publishing
- [ ] Verify fallback message works for out-of-scope questions
- [ ] Verify agent refuses to answer competitor questions (guardrail test)
