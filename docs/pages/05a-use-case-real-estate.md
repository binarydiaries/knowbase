# Use Case: Real Estate Agents — `/use-cases/real-estate`

**Purpose:** Convert real estate agents and agency owners who are overwhelmed by WhatsApp messages asking the same property questions. High-intent vertical — they feel the pain daily and are actively looking for a way out.

**Meta title:** AI Agent for Real Estate Agents — Handle WhatsApp Property Queries Automatically
**Meta description:** Stop answering the same property questions on WhatsApp. Agenvik trains on your listings and FAQs — handles price, availability, process queries 24/7, so you focus on closings.

**Priority:** 🔴 High — primary target vertical

---

## NAV
Same as homepage.

---

## SECTION 1 — Hero

### Layout
Two-column on desktop (md+). Left: copy. Right: WhatsApp mockup illustration. Single column on mobile (mockup stacks below copy).

### Eyebrow
✦ REAL ESTATE

> **Implementation note:** Wrap outer container in `aria-hidden="true"` so screen readers skip the ✦ glyph.

### H1
Your phone never stops buzzing.
Most messages ask the same 5 questions.

> **Design note:** Two-line headline. Line 1 lighter weight (`font-normal`). Line 2 bolder (`font-bold`).

### Subhead (GEO anchor — `id="page-description"`)
Agenvik is an AI agent for real estate agents that handles property enquiries on WhatsApp — prices, availability, documents needed, next steps — instantly, accurately, 24/7. You only step in when a lead is ready to move.

> **GEO note:** This sentence is the product-definition anchor. It contains the primary entity ("Agenvik"), the product category ("AI agent for real estate agents"), and the channel ("WhatsApp"). The `id="page-description"` is referenced by the `speakable` JSON-LD spec.

### Trust chips
Four inline chips between subhead and CTAs:
- ✓ Replies in under 3 seconds
- ✓ Available 24/7
- ✓ Every answer sourced from your docs
- ✓ Free to start

> **Rationale:** Replaces the social proof placeholder. Factual, credible, requires no testimonials.

### CTAs
- **Primary:** Start free → (links to `app.agenvik.com`)
- **Secondary:** See how it works ↓ (anchor links to `#how-it-works`)

### Fine print
Free plan · No credit card required · Live in 30 minutes

### Illustration (right column)
WhatsApp conversation mockup. Render inside `<div aria-hidden="true">`.

**Mockup structure:**
- **Header:** Green WA bar (`#075E54`), avatar with buyer initial ("R"), contact name "Ravi Kumar", "online" status
- **Chat thread:** Tan background (`#E5DDD5`) with subtle dot pattern
  - Buyer (white bubble, left): "Hi, I saw your 2BHK listing in Sector 12. What's the price?"
  - Agent (green bubble `#DCF8C6`, right): Full answer with price/floor/parking/possession + PDF citation badge ("Property Brief — Sector 12.pdf") + blue double ticks
  - Buyer (white, left): "Is it still available? What documents would I need?"
  - Agent (green, right): Full docs list + PDF citation ("Booking Process.pdf") + blue double ticks
  - Buyer (white, left, **green left-border `border-l-[3px] border-[#25D366]`**): "Perfect. I'm ready to visit — can I come this Saturday?"
  - System pill (centered, green): "🔥 Flagged for you — lead ready to visit"
- **Footer bar:** "Aria handled this · flagged for follow-up" · "Reply →" chip

> **Channel note:** Do not use WhatsApp brand green `#25D366` for decorative elements. The green left-border and flag pill are acceptable as they represent the agent's internal flag state, not the WhatsApp brand. Use brand colours only inside the mockup's simulated WA chrome.

---

## SECTION 2 — The Problem

### H2
What happens while you're in a showing

### 3 columns

**Column 1**
**Stat:** 30+
**Label:** WhatsApp messages before breakfast
**Body:** "What's the price?" "Is it still available?" "How far is it from the station?" Your phone buzzes before you've had coffee. The answers are in your property brief — but you're typing them again.

**Column 2**
**Stat:** 11pm
**Label:** When serious buyers are researching
**Body:** A buyer shortlists your property at night, sends a question, and doesn't hear back until morning. By then they've already booked a viewing somewhere else.

**Column 3**
**Stat:** ~40%
**Label:** Of enquiries that never convert
**Body:** Not because the buyer wasn't interested — because the response was slow, generic, or never came. Pre-qualification questions kill deals before they start.

---

## SECTION 3 — The Solution

### H2 (SEO + speakable anchor — `id="solution-heading"`)
An AI agent for real estate agents — trained on your listings, live on WhatsApp

> **SEO note:** H2 intentionally contains target keywords ("AI agent for real estate agents", "WhatsApp"). The H1 is conversion-first copy; this H2 carries the keyword signal. Do not revert to the original phrasing.

### Body
Upload your property briefs, pricing sheets, and FAQs once. Agenvik reads them and handles every inbound query on WhatsApp — with accurate, sourced answers in seconds. You get a log of every conversation, so you know exactly who's hot and who needs a follow-up.

### Internal links (below body paragraph)
- See all features → (`/features`)
- View pricing → (`/pricing`)

### What it handles
- Property price, size, configuration (1BHK / 2BHK / villa etc.)
- Availability and possession timeline
- Location, nearby infrastructure, connectivity
- What documents a buyer or tenant needs to proceed
- Process overview from enquiry to booking
- Viewing request routing (shares your booking link or collects details)

### What it hands off
- Negotiation (any question about price reduction or special terms routes to you)
- Legal or registration queries (routes to your designated contact)
- Anything not covered in your uploaded docs

---

## SECTION 4 — How It Works for Real Estate

### H2
Set up once. Your WhatsApp handles itself.

### Steps

**Step 1 — Upload your property docs**
Drop in property briefs, pricing sheets, FAQs, and your standard process document. One PDF per property works fine. Agenvik reads and indexes everything automatically — no formatting required.

**Step 2 — Connect your WhatsApp Business number**
Link your WhatsApp Business account in about 15 minutes. From that point, every inbound message gets handled by your agent first.

**Step 3 — Agent handles the flood**
Buyers and renters get instant, accurate answers about price, availability, location, and next steps — any hour, any day. The agent uses your exact content so nothing is made up.

**Step 4 — You see the leads**
Every conversation is logged. The agent flags enquiries that have moved past FAQ-stage — "I want to book a viewing", "I'm ready to proceed" — so you know exactly who needs your attention today.

---

## SECTION 5 — FAQ (Real Estate-specific)

> **Note:** Section 5 (Social Proof) was intentionally removed — no real testimonials exist yet. When real testimonials are collected, add a Social Proof section between How It Works and FAQ with `bg-white` (maintains alternating rhythm). The current section numbers skip from 4 to 5 (FAQ).

**Q: Can Agenvik handle multiple properties?**
A: Yes. Upload one document per property, or combine them into a single knowledge base. Agenvik reads and indexes all of them — the agent knows which details belong to which listing and answers accordingly.

**Q: What if a buyer asks to negotiate on price?**
A: Agenvik doesn't negotiate — that's your job. It'll acknowledge the question and route it to you: "For pricing discussions, please contact [your name] directly at [number]." You control the fallback message.

**Q: What if someone asks for a viewing?**
A: The Agenvik agent can share your booking link, collect the person's details for a callback, or provide your contact number — whichever you prefer. Direct calendar integration is on the roadmap.

**Q: Will buyers know it's not me personally?**
A: Only if you want them to. Most agents give their Agenvik agent a name (e.g. "Aria from [Agency Name]") and it handles the initial conversation seamlessly. Being upfront that it's an AI assistant is also fine — buyers generally don't mind as long as Agenvik gives them accurate answers fast.

**Q: What happens after hours?**
A: Agenvik runs 24/7. A buyer messaging at 11pm gets an accurate answer immediately. You see the conversation in the morning and follow up if needed.

> **AEO rule:** All 5 FAQ answers must name "Agenvik" at least once. Currently: Q1 ✅ Q2 ✅ Q3 ✅ Q4 ✅ Q5 ✅

---

## SECTION 6 — CTA

### H2
Stop missing leads while you're in a showing

### Body
Free plan. 30 minutes to set up. No credit card.

### CTAs
- **Primary:** Build your real estate agent → (links to `app.agenvik.com`)
- **Secondary:** Book a demo instead → (links to `/book-demo`)

### Fine print
Free plan · No credit card required · Cancel anytime · Data stays private

---

## FOOTER
Same as homepage.

---

## IMPLEMENTATION NOTES — SEO / AEO / GEO

### Structured data (JSON-LD)
Emit from the page file (pass as array to `jsonLd` prop on `<Layout>`):

1. **`WebPage`** — page identity, canonical URL, `dateModified` (hardcoded — update manually on content changes), `publisher`, `speakable`, `BreadcrumbList` (Home → Use Cases → Real Estate).
2. **`FAQPage`** — the 5 FAQ Q&As. Write answers in full sentences naming the product where natural.
3. **`HowTo`** — the 4 setup steps. Include `totalTime: "PT30M"` and a `name` that contains "Agenvik" and "real estate".

`Organization` + `WebSite` schemas come from `Layout.astro` — do not duplicate them here.

**`WebPage` schema must include:**
```json
{
  "publisher": { "@id": "https://agenvik.com/#organization" },
  "dateModified": "YYYY-MM-DD",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": ["#page-description", "#solution-heading"]
  }
}
```

**`dateModified` note:** Do NOT use `new Date()` — this changes on every build and dilutes Google's freshness signals. Hardcode the date and update it only when content changes.

### Breadcrumb
The `BreadcrumbList` is embedded inside the `WebPage` JSON-LD schema — no separate visible `<Breadcrumb>` component is rendered on this page. The schema alone is sufficient for Google's breadcrumb rich result.

### Entity recognition (GEO)
"Agenvik" must appear in visible body text — not just in headings or schema:
- Subhead (`#page-description`) ✅
- Solution section body ✅
- FAQ answers: all 5 must name Agenvik ✅

### Channel emphasis
Real estate is a **WhatsApp-first** use case. The hero subhead and H2 both reference WhatsApp explicitly. Section 4 (How It Works) names WhatsApp in step 2. The mockup simulates a WhatsApp conversation. Do not use WhatsApp brand green (`#25D366`) for UI elements outside the mockup's simulated chrome.

### Illustration containers
The WhatsApp mockup (Section 1 right column) renders inside `<div aria-hidden="true">`. This prevents decorative image alt text and non-functional UI chrome from affecting accessibility tree or Lighthouse contrast scores.

### Eyebrow badge
The `✦ REAL ESTATE` eyebrow badge is intentional on use-case pages. Wrap its outer container in `aria-hidden="true"` so screen readers skip the ✦ glyph.

### Section background rhythm
Follow the alternating pattern — no two consecutive sections share the same background style:
- Hero (Section 1): white with subtle grid
- Problem (Section 2): `bg-[#1a0f3d] rounded-3xl` (dark navy)
- Solution (Section 3): white
- How It Works (Section 4): textured bg-image (`pricing-bg.png`) with `bg-white/55 backdrop-blur-[2px]` overlay
- FAQ (Section 5): `bg-[#1a0f3d] rounded-3xl` (dark navy)
- CTA (Section 6): `bg-[#301B69] rounded-3xl`

When a Social Proof section is added in future, insert it between How It Works and FAQ with `bg-white` to maintain the alternating rhythm.

### Section spacing
Sections use `px-6 pt-16` only — no `pb-` on intermediate sections. Gap between sections comes from `pt-16` on each section. CTA section uses `pt-16` with no explicit bottom padding at the section level.

### Internal links
The Solution section includes two contextual text links:
- "See all features →" → `/features`
- "View pricing →" → `/pricing`

These serve both user navigation and SEO PageRank flow. Do not remove them.

### Tone option naming
If tone is referenced anywhere on this page, use the four official preset names: **Formal**, **Friendly**, **Direct**, **Supportive**. Do not use "Professional", "Neutral", or "Casual".
