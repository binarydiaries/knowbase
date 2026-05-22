# Homepage — `/`

**Purpose:** Convert cold traffic into sign-ups. Answer "what is this, is it for me, can I trust it" in the first viewport.

---

## NAV

**Logo:** Agenvik (text + mark)

**Links:** Features · Solutions ▾ · Pricing · Blog

**Secondary button (right, outlined):** Book a Demo — links to `/book-demo`

**Primary button (right, filled):** Get Started — links to `app.agenvik.com`

**Note:** See `10-nav.md` for full nav spec including Solutions dropdown contents and mobile menu.

---

## SECTION 1 — Hero

**Purpose:** Make the value obvious in 5 seconds. State what it does, who it's for, and what they get.

### Eyebrow (small label above headline)
Free to start · No code · Live in 10 minutes

### H1
Your customers ask.
Your AI agent answers — from your own docs.

> **Design note:** Two-line headline. "Your customers ask." on line 1 in lighter weight. "Your AI agent answers — from your own docs." on line 2, heavier/bolder.

### Subhead
Upload a PDF, paste your FAQ, or point it at your website. Your agent goes live on your site, WhatsApp, or Slack. No coding. No hallucinations. No waiting.

### CTA Row
- **Primary button:** Start for free → (links to `app.agenvik.com`)
- **Secondary link:** Watch 2-min demo ▶ (links to demo video or `/book-demo`)

### Social proof line (below CTAs)
[PLACEHOLDER: "Trusted by 200+ businesses" + 5 star icons + "★★★★★ on G2"]
*Until reviews exist, use:* "Free plan. No credit card required. Cancel anytime."

### Hero background
White base with a subtle CSS grid pattern (48 × 48 px, brand purple at 7% opacity). The grid fades out via a bottom mask so it doesn't compete with the dashboard screenshot. A faint radial highlight at top-center lifts the heading area. No background image file — pure CSS.

> **Design note:** Grid pattern references Linear / Vercel-style hero treatment. Keep it subtle — the copy and screenshot are the focus.

### Hero visual
Full-width product screenshot of the Agenvik dashboard (`hero-dashboard.png`). No gradient overlay. Clean `rounded-2xl shadow-2xl` with a `ring-1 ring-[#301B69]/15` border.

> **Implementation note:** `loading="eager" fetchpriority="high"` on the `<Image>` component — this is the LCP element, so it gets browser priority.

---

## SECTION 2 — Problem

**Purpose:** Make visitors feel seen before pitching the solution.

### H2
You're answering the same questions. Every. Single. Day.

### Body copy
Your support team handles 80% repeat queries. Customers message at 2am and get silence. New hires spend their first week asking senior people for things that should be in a doc. Sales prospects ask pricing questions nobody is around to answer.

You don't need more staff. You need an agent that knows your business cold — and handles it for you, 24/7.

> **Design note:** This section should feel like a sigh of relief, not a scare tactic. Dark background or subtle contrast from the hero. No icons. Just copy.

---

## SECTION 3 — Comparison (Why Agenvik vs. alternatives)

**Purpose:** Answer the "why not just use X?" objection before visitors ask it. Targets comparison-intent search queries and AEO/GEO citation opportunities. Replaces the earlier "SEE IT WORK" 3-panel section, which was redundant with Section 4 (How It Works).

### Eyebrow
✦ WHY AGENVIK

### H2
Why not just use ChatGPT?

### Subhead
Generic AI makes things up. Chatbot builders make you write scripts. Agenvik reads your documents and answers from them — accurately, every time.

### Comparison table

| Feature | Chatbot builder | Generic AI (ChatGPT etc.) | Agenvik |
|---|---|---|---|
| Learns directly from your documents | ✗ (uses decision trees) | ✗ (uses general training) | ✓ |
| Cites the source for every answer | ✗ | ✗ | ✓ |
| Says "I don't know" instead of guessing | ✗ (gives scripted fallback) | ✗ (may confidently hallucinate) | ✓ |
| One setup — same knowledge across all channels | ✗ (separate per channel) | ✗ (no deployment) | ✓ |
| No scripts or decision trees to write | ✗ | ✓ | ✓ |
| Live in under 10 minutes | ✗ (scripting takes time) | ✓ | ✓ |

**Accuracy notes:**
- Chatbot builders (Tidio, ManyChat, etc.) do support multiple channels, but require separate configuration per channel and use decision trees — not document learning.
- Generic AI (ChatGPT, Gemini, etc.) has broad knowledge but cannot be grounded in your specific documents without RAG; hallucination is a real risk.
- Rows 1–4 are Agenvik's unique differentiators; rows 5–6 show parity with modern AI but advantage over traditional chatbots.

### CTA
**Button:** Try Agenvik free → (links to `app.agenvik.com`)
**Subtext:** No credit card. Live in 10 minutes.

---

## SECTION 4 — How It Works (3 Steps)

**Purpose:** Remove the fear of setup. Show that complexity is handled.

### Eyebrow
✦ HOW IT WORKS

### H2
Three steps. Ten minutes. Done.

### Steps

**Step 1 — Add your knowledge**
Upload PDFs, paste your FAQ, drop in a website URL, or type plain text. Your agent learns from whatever you already have — there's nothing new to write.

[MOCKUP — built in HTML/CSS, no image file needed]
Dashed drop-zone with upload icon ("Drop files here"). Two file chips below: "shipping-policy.pdf" and "product-faq.pdf", each with a green "Trained" badge. A URL row showing "help.yoursite.com" with a globe icon.

**Step 2 — Configure your agent**
Give your agent a name, a tone (Formal, Friendly, Direct, or Supportive), and tell it which channels to live on. It takes 2 minutes. You can change anything later.

[MOCKUP — built in HTML/CSS, no image file needed]
Settings panel with three fields: Agent name input showing "Aria" with a blinking cursor; Tone dropdown set to "Friendly"; Channels section with toggle rows — Website ✓, WhatsApp ✓, Slack ✗.

**Step 3 — Go live**
Copy one line of code to embed on your website. Connect your WhatsApp business number. Link your Slack workspace. Your agent is live and handling queries immediately.

[MOCKUP — built in HTML/CSS, no image file needed]
Three stacked channel previews: (1) Website — chat bubble with "Aria · Agenvik" greeting; (2) WhatsApp — green thread showing "What's your return policy?" → "Returns accepted within 30 days… Source: Returns Policy.pdf"; (3) Slack — dark panel with "Aria APP" answering a pricing question.

> **Design note:** No product screenshots in this section. All step visuals are coded HTML/CSS mockups — no external image files required. This keeps the section fast and easy to update. Do NOT add arrow/line connectors between the cards; they look cluttered and have been intentionally removed.

> **Container note:** Section uses `bg-[#1a0f3d] rounded-3xl` (dark navy) — matching the deep navy used in Agent Builder and Coming Soon. Cards inside are `bg-white/5 border-white/10` with white text. Padding: `p-10 md:p-14`. The bottom CTA bar is `bg-white/5 border-white/10`.

### Bottom CTA
**Text:** Start building — it's free
**Button:** Get Started → (links to `app.agenvik.com`)

---

## SECTION 5 — Features (Benefit-framed, not feature-named)

**Purpose:** Justify the decision. Address "but does it actually work?" concerns.

### Eyebrow
✦ WHAT YOU GET

### H2
Built to give accurate answers, not impressive-sounding ones

### Feature cards (4 cards, 2×2 grid)

**Card 1**
**Headline:** Answers from your content, not guesswork
**Body:** Every response is grounded in documents you uploaded. Agenvik cites the source, so you can verify. No hallucinations. No confident wrong answers.
[ILLUSTRATION: Small icon or micro-visual showing a response with "Source: Q2 Product Guide.pdf · page 4" citation]

**Card 2**
**Headline:** Your tone. Your brand. Not robot speak.
**Body:** Set how your agent sounds — formal, casual, concise, detailed. It writes like your team, not like a generic AI. Customers won't know it's automated unless you tell them.
[ILLUSTRATION: Tone selector UI — a slider or dropdown with options: Formal · Friendly · Direct · Supportive]

**Card 3**
**Headline:** One agent. Three channels.
**Body:** Build once, deploy everywhere. Website chat widget, WhatsApp Business, Slack. Your agent is consistent across all of them — same knowledge, same tone, zero duplication.
[ILLUSTRATION: Single agent "icon" in the center with three arrows branching out to website, WhatsApp, Slack logos]

**Card 4**
**Headline:** See exactly what your customers are asking
**Body:** Every conversation is logged. See which questions come up most, where your agent is confident, and where it needs more knowledge. Improve over time with real data.
[ILLUSTRATION: A mini analytics dashboard showing: "Top questions this week" with 3-4 example queries and resolution rates]

---

## SECTION 6 — Use Cases

**Purpose:** Help visitors self-identify. "This is for me."

### Eyebrow
✦ WHO USES AGENVIK

### H2
Whatever your business. Wherever your customers are.

### Use case cards (4 cards)

**Card 1 — E-commerce & Retail**
**Icon:** shopping bag
**Headline:** Fewer support tickets. Happier customers.
**Body:** Shipping status, return policy, size guides, product questions — your agent handles tier-1 support automatically so your team focuses on the hard stuff.
**Proof line:** [PLACEHOLDER: "Reduced support load by 60% in the first month — [Customer Name], [Store Name]"]
**Link:** See how it works for e-commerce →

**Card 2 — SaaS & Tech Products**
**Icon:** code bracket / terminal
**Headline:** Answer product questions without a CS call
**Body:** Guide new users to their first "aha moment". Answer integration questions. Explain pricing. Your agent knows your docs better than most new hires.
**Proof line:** [PLACEHOLDER: testimonial]
**Link:** See how it works for SaaS →

**Card 3 — Internal Teams**
**Icon:** people / org chart
**Headline:** New hire asks Slack. Gets the answer. Done.
**Body:** Stop being the person everyone DMs for things that should be written down. Your agent knows your SOPs, processes, and company docs. Knowledge stops leaving when people do.
**Proof line:** [PLACEHOLDER: testimonial]
**Link:** See how it works for internal teams →

**Card 4 — Coaches & Educators**
**Icon:** graduation cap
**Headline:** Your expertise. Available 24/7.
**Body:** Turn your course material, workbooks, or coaching notes into an agent your students can ask anything, anytime. Personalised answers at scale.
**Proof line:** [PLACEHOLDER: testimonial]
**Link:** See how it works for educators →

---

## SECTION 7 — Social Proof

**Purpose:** Trust. This is the single most important section after the hero.

> **Container note:** Section uses `bg-[#F5F3FF] border border-[#301B69]/10 rounded-3xl p-10 md:p-14` (light lavender). This breaks the visual rhythm between the dark Use Cases section above and the Pricing section below. Cards inside are `bg-white shadow-sm`. A faint radial glow `bg-[#301B69]/10 blur-[120px]` sits at the top.

### H2
What our early users say

### Testimonial cards (3 cards)
[PLACEHOLDER: Real testimonials needed. Each card should include:]
- Photo of the person (real, not stock)
- Name + Title + Company
- 2-3 sentence quote that mentions: the specific problem they had, what they use Agenvik for, and a concrete result (time saved, tickets reduced, etc.)

Placeholder card copy: "Real testimonial coming soon — if you're using Agenvik and want to share your story, reach out at hello@agenvik.com"

**Sample format when real quotes arrive:**
> "Before Agenvik, our support team was handling 200 repeat questions a day. Now the agent handles 140 of them automatically. We set it up on a Friday afternoon."
> — Priya S., Head of Support, [Company Name]

### Stats row (below testimonials)
[PLACEHOLDER: once real data exists]
- `X+` agents created
- `X%` of questions answered without human escalation
- `X` channels supported (show: website, WhatsApp, Slack icons)

---

## SECTION 8 — Pricing Teaser

**Purpose:** Show value tiers quickly. Drive to `/pricing` for details.

### Eyebrow
✦ PRICING

### H2
Start free. Upgrade when you're ready.

### Subhead
No hidden fees. No lock-in. Downgrade or cancel anytime.

### 4 plan pills (lightweight — not full pricing table)

| Plan | Price | Best for |
|------|-------|----------|
| Free | ₹0/mo | Try it out |
| Starter | ₹499/mo | Solo builders |
| Growth | ₹1,499/mo | Growing teams |
| Pro | ₹3,999/mo | High-volume businesses |

### CTA
**Text:** See full plan details and feature comparison
**Button:** View pricing → (links to `/pricing`)

---

## SECTION 9 — FAQ Teaser

**Purpose:** Handle the 3-4 objections that stop people from clicking "Start free". Short. Not the full FAQ.

> **SEO note:** H2 is "Frequently asked questions" — matches the high-volume search query directly. The section also maps to the `FAQPage` JSON-LD schema in `index.astro`.

### H2
Frequently asked questions

### 4 questions max on homepage

**Q: Is this just another chatbot builder?**
A: No. Most chatbot builders make you write scripts and decision trees. Agenvik learns from your actual documents and answers in natural language — so you upload your content once and it handles the rest.

**Q: Will my customers know it's AI?**
A: Yes. We believe that's a good thing — customers don't mind AI when it actually helps them.

**Q: What if it gives a wrong answer?**
A: Agenvik only answers from content you provide. If the information isn't in your knowledge base, the agent says so rather than guessing. You can also see every conversation and add knowledge to fill gaps.

**Q: Do I need coding skills to set it up?**
A: No. Upload your documents, configure your agent, and you're live in under 10 minutes. No technical knowledge needed.

### Link
**Text:** More questions? See all FAQs →
**Link:** `/faq`

---

## SECTION 10 — Final CTA

**Purpose:** Last chance to convert. Remove every remaining friction.

### H2
Your first agent is free.
Start in 10 minutes.

### Subhead
No credit card. No engineering team. No complex setup. Just your documents and 10 minutes.

### CTAs
- **Primary button:** Start for free → (links to `app.agenvik.com`)
- **Secondary link:** Book a demo instead → (links to `/book-demo`)

### Trust row (small text beneath buttons)
Free plan · No credit card required · Cancel anytime · Data stays private

---

---

## IMPLEMENTATION NOTES — SEO / AEO / GEO

These decisions are intentional. Don't change them without understanding why.

### Structured data (JSON-LD)
Three schemas are emitted on the homepage via `index.astro`:
1. **`SoftwareApplication`** — describes Agenvik as a product with price, features, publisher.
2. **`HowTo`** — 3-step setup flow (matches Section 4). Step image URLs omitted intentionally — only include once real step screenshots exist at known public URLs.
3. **`FAQPage`** — the 4 homepage FAQ answers (from `src/data/faqs.ts → homepageFaqs`). This is a subset; the full FAQ lives at `/faq`.

`Organization` + `WebSite` schemas are emitted on every page via `Layout.astro`.

### Section heading hierarchy
- One `<h1>` per page (hero). All section titles are `<h2>`. All card/feature titles inside sections are `<h3>`. Never break this order.

### Hero LCP
`hero-dashboard.png` uses `loading="eager" fetchpriority="high"`. Do not change to `loading="lazy"` — this is the Largest Contentful Paint element.

### Preconnect hints (Layout.astro)
`<link rel="preconnect" href="https://app.agenvik.com">` is set globally (critical path — used by Get Started CTAs). `embed.agenvik.com` uses `dns-prefetch` only (not preconnect) because the embed script is `defer async` and establishing a full early connection wastes a TCP slot. DNS prefetch for Amplitude CDN. These reduce connection latency measured in Google's CrUX field data.

### Section container consistency
All homepage sections (except Hero, Problem, FinalCTA which have unique backgrounds) use `rounded-3xl p-10 md:p-14` with one of these styles:

- `bg-white border border-[#301B69]/10 shadow-sm` — clean white (Comparison)
- `bg-[#1a0f3d]` — dark navy with glow blobs (HowItWorks, UseCases)
- `bg-[#F5F3FF] border border-[#301B69]/10` — light lavender (SocialProof)
- `bg-cover bg-center` + `bg-white/50 backdrop-blur-[2px]` overlay — textured bg-image (Features, Pricing, FAQ)

**Section colour rhythm (top to bottom):** Hero (white) → Problem (dark contrast) → Comparison (white) → HowItWorks (dark navy) → Features (textured light) → UseCases (dark navy) → SocialProof (lavender) → Pricing (textured light) → FAQ (textured light) → FinalCTA (dark). No two consecutive sections share the same style.

Do not mix these patterns within a single section.

---

## FOOTER

### Column 1 — Product
- Features
- How it Works
- Pricing
- Changelog

### Column 2 — Use Cases
- Customer Support
- E-commerce
- Internal Teams
- SaaS & Product

### Column 3 — Resources
- Blog
- Documentation
- Developer Guide
- Help & Support

### Column 4 — Company
- About
- Book a Demo
- Contact: hello@agenvik.com

### Bottom bar
© 2026 Agenvik · Privacy Policy · Terms · Security
Social icons: X (Twitter) · LinkedIn · Instagram
