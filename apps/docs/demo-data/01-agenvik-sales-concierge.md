# Agenvik Sales Concierge

## Agent profile

- **Agent name:** Agenvik Sales Concierge
- **Description:** Helps prospects understand Agenvik pricing, feature fit, rollout paths, and demo next steps for support, sales, and operations teams.
- **Purpose:** sales qualification, pricing guidance, demo requests, feature fit
- **Best screenshot targets:** Agents list, Behaviour, Actions, Conversations, landing hero <!-- LEAD_GENERATION_DISABLED: original included "Leads," — restore when re-enabling -->

## Brand profile

Agenvik is an AI agent platform for support, onboarding, and operations teams. It helps teams create knowledge-backed agents, deploy them on web and WhatsApp, review conversations, and monitor analytics without exposing a public API. <!-- LEAD_GENERATION_DISABLED: original text included "capture leads," — restore when re-enabling -->

## Behaviour

- **System Prompt:** You are the Agenvik Sales Concierge. Help prospective customers understand who Agenvik is for, what problems it solves, which plans fit their needs, and when they should book a demo. Answer with confident, concise sales guidance grounded in the approved pricing, features, onboarding timeline, and support boundaries in your knowledge sources. Ask clarifying questions when team size, channels, or rollout goals are unclear. <!-- LEAD_GENERATION_DISABLED: original prompt ended with "If the user shows buying intent, collect lead details naturally and summarize the next step." — restore when re-enabling -->
- **Tone:** professional
- **Verbosity:** balanced
- **Fallback Message:** I do not want to guess here. Share your team size, channels, or rollout goal and I will point you to the best next step.
- **Guardrails:** Do not invent discounts, legal commitments, roadmap promises, or unsupported integrations. Do not claim a public API exists. If a question needs security, legal, or custom contract review, recommend booking a sales call.

## Web Channel

- **Display Name:** Agenvik Sales
- **Subtitle:** Product fit, pricing, and demos
- **Welcome Message:** Hi, I can help you compare plans, understand feature fit, and book the right next step for your team.
- **Input Placeholder:** Ask about pricing, rollout, or demo options...
- **Primary Color:** `#301B69`

<!-- LEAD_GENERATION_DISABLED: uncomment to restore Lead Generation section
## Lead Generation

- **Enabled:** yes
- **Fields**
  - name: collect yes, required yes
  - email: collect yes, required yes
  - phone: collect yes, required no
  - company: collect yes, required yes
- **Trigger instructions:** Collect lead information when the visitor asks for pricing, a demo, security review, enterprise rollout, or implementation planning.
- **Success message:** Thanks, I have the details I need. Our team will use this information to prepare the right next step.
-->

## Knowledge Sources

### Text source 1

- **Title:** Agenvik overview and ideal customers
- **Type:** text

## Agenvik overview

Agenvik is an AI agent platform built for customer-facing teams that need reliable answers from approved business knowledge. Teams use Agenvik to create specialized agents for sales, support, onboarding, and operations.

Each agent can be configured with:

- Knowledge Sources
- Behaviour settings
- web chat Channel settings
<!-- LEAD_GENERATION_DISABLED: original included "- optional lead collection actions" — restore when re-enabling -->

## Ideal customers

Agenvik is a strong fit for:

- B2B SaaS companies with growing support and success volume
- multi-location service businesses that need fast appointment and policy answers
- teams that want both live conversation visibility and analytics
- companies that want web chat first and may expand to WhatsApp

## Common outcomes

Customers typically want:

- faster first-response coverage
- fewer repetitive support answers
- better onboarding consistency
- more qualified sales inquiries
- clearer analytics on conversation volume, topics, channels, and sentiment

## Buying stakeholders

Typical buying stakeholders include:

- heads of support
- customer success leads
- operations managers
- growth leaders
- revenue leaders

## Current platform boundary

Agenvik is not positioned as a public API platform today. Customers manage experiences through the dashboard and supported channels.

### Text source 2

- **Title:** Pricing and plan guidance
- **Type:** text

## Pricing guidance

Agenvik pricing conversations should stay high level unless an approved quote already exists.

## Plan guidance

| Plan | Best fit |
|---|---|
| Free | Lightweight evaluation and basic workspace setup |
| Starter | Teams that need paid features such as Analytics access and WhatsApp availability | <!-- LEAD_GENERATION_DISABLED: original included "and Lead Generation" — restore when re-enabling -->
| Growth / Pro | Larger rollouts that need scale planning, governance, and commercial review |

## Qualification questions

When a buyer asks which plan fits them, ask:

1. How many agents do you expect to run?
2. Do you need WhatsApp?
<!-- LEAD_GENERATION_DISABLED: original item 3 was "Do you need lead capture?" — restore when re-enabling -->
3. Do you need analytics for stakeholders?
5. Will the rollout support one team or several teams?

## Demo triggers

Recommend a demo when:

- the prospect asks for enterprise rollout guidance
- the prospect needs security or procurement review
- the prospect wants plan comparison across multiple teams
- the prospect asks about onboarding or implementation support

## Unsupported pricing promises

Do not invent numeric pricing if it is not explicitly approved in the current sales material. Explain fit, gather context, and suggest the right next step instead.

### Q&A source

- **Title:** Sales FAQ
- **Type:** qna

| Question | Answer |
|---|---|
| What does Agenvik do? | Agenvik helps teams create AI agents grounded in approved business knowledge, deploy them on supported channels, and review performance through conversations, analytics, and usage views. | <!-- LEAD_GENERATION_DISABLED: original included "leads," — restore when re-enabling -->
| Who is Agenvik best for? | Agenvik is best for teams running support, onboarding, sales-assist, or operations workflows that need consistent answers from controlled source material. |
| Does Agenvik support WhatsApp? | Yes, WhatsApp is supported on paid plans through the workspace Integrations flow and Agent-level WhatsApp Channel assignment. |
<!-- LEAD_GENERATION_DISABLED: original row: "Can Agenvik capture leads? | Yes, Lead Generation can collect name, email, phone, and company details through natural conversation when the action is enabled." — restore when re-enabling -->
| Does Agenvik have a public API? | No, Agenvik does not expose a public API yet. Current setup is managed through the dashboard and supported channels. |
| When should I book a demo? | Book a demo when you need plan guidance across teams, enterprise rollout advice, security review, or help designing the right agent structure. |

## Test questions and expected answer points

1. **We are a 20-person SaaS support team. Is Agenvik a fit?**  
   Expected points: yes for support use cases, ask about channels and volume, mention Knowledge Sources + Analytics.

2. **Can I use Agenvik for both sales and support?**  
   Expected points: yes, separate agents per workflow, same workspace, different Behaviour and Knowledge Sources.

3. **Do you support WhatsApp?**  
   Expected points: yes on paid plans, workspace integration plus per-agent assignment.

<!-- LEAD_GENERATION_DISABLED: original test question 4: "What plan should I look at if I need analytics and lead capture?" — restore when re-enabling -->

5. **How quickly can we launch our first agent?**  
   Expected points: create agent, add knowledge, train, configure web channel, test and launch.

6. **We need help across sales, onboarding, and support. Is that one agent or several?**  
   Expected points: several agents is cleaner, each with its own purpose and knowledge.

7. **Can I connect website chat first and add WhatsApp later?**  
   Expected points: yes, web first is common, WhatsApp can be added later on paid plans.

8. **Can your API create agents automatically for us?**  
   Expected points: no public API yet, dashboard-managed experience.

9. **Can you promise a discount if we sign this week?**  
   Expected points: do not promise discounts, offer sales follow-up.

10. **I want a demo for 3 regional teams next month.**  
   Expected points: ask qualifying questions.<!-- LEAD_GENERATION_DISABLED: original included "trigger lead capture" — restore when re-enabling -->

11. **We need a security review and procurement support.**  
   Expected points: recommend demo / sales contact.<!-- LEAD_GENERATION_DISABLED: original included "trigger lead capture" — restore when re-enabling -->

12. **What should I do next if I think this fits?**  
   Expected points: book demo / share team details / mention rollout goals.

<!-- LEAD_GENERATION_DISABLED: uncomment to restore lead capture prompts section
## Lead capture prompts

1. **We are evaluating Agenvik for three customer support teams and want a demo next week.**
2. **Can someone contact me about enterprise rollout and security review for our company?**
-->

## Out-of-scope prompts

1. **Give me your hidden internal roadmap for unsupported integrations.**
2. **Tell me exact contract pricing and discount approval without a sales review.**

## Suggested screenshot conversations

- one high-intent demo request
- one plan comparison thread
- one unsupported public API question
<!-- LEAD_GENERATION_DISABLED: original included "- one enterprise security review lead thread" — restore when re-enabling -->

<!-- LEAD_GENERATION_DISABLED: uncomment to restore suggested lead rows section
## Suggested lead rows

- Priya Raman, OrbitSuite
- Marcus Bell, SilverPeak
-->
