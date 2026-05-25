# Use Case: Coaches & Educators — `/use-cases/education`

**Purpose:** Convert coaches, course creators, and educators who spend too much time answering repetitive student questions instead of delivering their core expertise. They want to be more available — without actually being more available.

**Meta title:** AI Agent for Coaches & Educators — Answer Student Questions 24/7
**Meta description:** Turn your course material into an AI agent that answers student questions at any hour. Agenvik scales your expertise without scaling your time — students get answers, you get your evenings back.

**Priority:** 🔴 High — primary target vertical

---

## NAV
Same as homepage.

---

## SECTION 1 — Hero

### Eyebrow
✦ COACHES & EDUCATORS

### H1
Your students have questions at midnight.
You can't be available at midnight.

> **Design note:** Two-line headline. Line 1 lighter weight. Line 2 bolder.

### Subhead
Agenvik reads your course material, workbooks, and coaching notes — and answers student questions in your voice, any time of day. You stay focused on the sessions that need you.

### CTAs
- **Primary:** Start free → (links to `app.agenvik.com`)
- **Secondary:** See how it works ↓

### Social proof line
[PLACEHOLDER: "Coaches using Agenvik save X hours per week on student Q&A"]

[ILLUSTRATION: A coach's phone showing 12 unread WhatsApp messages at 11:43pm. Questions: "What's the assignment for week 3?", "Where do I submit my work?", "What time is tomorrow's session?", "I missed the last call — where's the recording?" Contrast: the same coach asleep, phone dark. Caption: "Your agent handles the questions. You handle the coaching."]

---

## SECTION 2 — The Problem

### H2
Your expertise is what students pay for. Your time isn't infinite.

### 3 columns

**Column 1**
**Stat:** 1:1
**Label:** Time eaten by logistics, not coaching
**Body:** "Where do I submit this?" "What's the deadline?" "How do I access the recordings?" These questions aren't why your students enrolled. But they keep finding their way into your DMs, your email, and your session Q&A time.

**Column 2**
**Stat:** 11pm
**Label:** When students study and hit questions
**Body:** Students don't consume content on a 9–5 schedule. They review their workbooks late at night, get stuck, and either give up or wait until morning feeling frustrated. You lose sleep. Or they lose momentum.

**Column 3**
**Stat:** Every cohort
**Label:** The same questions asked again
**Body:** Cohort after cohort, the same FAQs come up. Your content answers them — but students don't search the docs, they DM you. You end up being your own FAQ bot.

---

## SECTION 3 — The Solution

### H2
Your knowledge base, available at 3am

### Body
Upload your course PDFs, workbooks, session notes, and FAQ once. Agenvik reads your material and answers student questions in your voice, around the clock — without you being online. Students get accurate, sourced answers from your content. You get your time back for the conversations that actually need you.

### What it handles
- Course structure, module order, and session schedule
- Assignment briefs, submission instructions, and deadlines
- How to access recordings, resources, and tools
- Frequently revisited concepts explained in your materials
- Coaching methodology and what to expect from the programme
- FAQs about onboarding, payments, and programme logistics

### What it hands off
- Personal coaching questions that need your judgment
- Anything not covered in the uploaded material (with a clear "I don't have that — reach out to [contact]")
- Escalations or complaints that need a human response

---

## SECTION 4 — How It Works for Coaches

### H2
Upload your material. Students get answers. You get your time back.

### Steps

**Step 1 — Upload your course content**
Drop in your workbooks, session PDFs, FAQ doc, and any guides or resources you've created. Agenvik reads and indexes everything. No re-formatting. No prompts to write.

**Step 2 — Choose where students ask questions**
Set up the chat widget on your course platform, website, or community page. Or share a direct chat link over WhatsApp or email. Students access it wherever they already are.

**Step 3 — Students get answers in your voice**
A student asks about an assignment at 11pm. The agent responds with the exact details from your brief — accurately, in the tone you set. No guessing. Source cited.

**Step 4 — You see what students are asking**
Review conversation logs to spot patterns. Which concepts are students asking about most? Where are they getting confused? Use this to improve your content and coaching focus each cohort.

---

## SECTION 5 — Social Proof

### H2
[PLACEHOLDER: Real headline once reviews exist]

[PLACEHOLDER: 2 testimonials from coaches/educators. Format:]
> "[Specific result — e.g., 'I used to spend Sunday evenings catching up on student questions. Now I spend 20 minutes on Monday reviewing the logs and jumping in where the agent flagged something I needed to handle personally.']"
> — [Name], [Coach / Course Creator], [Programme Name]

---

## SECTION 6 — FAQ (Education-specific)

**Q: Can it replace live coaching sessions?**
A: No — and it's not designed to. The Agenvik agent handles the logistical and reference questions so your live sessions are entirely focused on coaching, not "where do I submit this?" It makes your sessions better, not redundant.

**Q: What if a student asks something personal or sensitive?**
A: The agent only answers from your uploaded content. If a question is outside its knowledge base — including anything personal or nuanced — Agenvik responds with your fallback message and routes the student to you directly.

**Q: Can I update the material mid-cohort?**
A: Yes. Re-upload any document and the changes take effect immediately. Useful when you add new resources or update deadlines mid-programme.

**Q: What if I run multiple programmes?**
A: You can create a separate Agenvik agent per programme, each with its own knowledge base. Students on Programme A only get answers from Programme A's content.

**Q: Does it work in WhatsApp?**
A: Yes. If you communicate with students over WhatsApp, Agenvik can be connected to your WhatsApp Business number and handle inbound messages there too.

---

## SECTION 7 — CTA

### H2
Scale what you know without scaling your hours

### Body
Free plan. Set up in 30 minutes. No technical skills needed.

### CTA
**Button:** Build your coaching agent → (links to `app.agenvik.com`)

---

## FOOTER
Same as homepage.

---

## IMPLEMENTATION NOTES — SEO / AEO / GEO

### Structured data (JSON-LD)
Emit from the page file:
1. **`WebPage`** — page identity, canonical URL, `dateModified` (build date), `BreadcrumbList` (Home → Use Cases → Coaches & Educators).
2. **`FAQPage`** — the 5 FAQ Q&As in Section 6. Write answers in full sentences naming the product where natural — AI assistants pull these verbatim as snippets about AI agents for coaching.

`Organization` + `WebSite` schemas come from `Layout.astro` — do not duplicate them here.

### Entity recognition (GEO)
"Agenvik" must appear in visible body text — not just headings or schema. The subhead names it. Section 3 body must name "Agenvik" at first reference. FAQ answers should include "Agenvik" by name in at least 3 of 5 answers (see updated answers in Section 6).

### Social proof placeholders
Section 5 headline and testimonials are placeholders. Until real testimonials exist, omit the section from the rendered page entirely (comment it out) rather than showing empty placeholder cards. A testimonial-less social proof section harms credibility more than omitting it.

### Channel emphasis
Education is a **multi-channel** use case. WhatsApp is named explicitly in Section 3 and FAQ Q5. The primary deployment for most coaches is a website widget on their course platform or community page; WhatsApp is additive. Section 4 Step 2 covers both paths. If channel icons are shown, use generic icons in brand colours — do not use WhatsApp green or any platform brand colour.

### Illustration containers
All illustration placeholders (Section 1 phone mockup at 11:43pm) must render inside `<div aria-hidden="true">` containers. Decorative UI chrome and simulated phone screenshots must not surface in the accessibility tree.

### Eyebrow badge
The `✦ COACHES & EDUCATORS` eyebrow badge is intentional on use-case pages. Wrap its outer container in `aria-hidden="true"` if it contains decorative glyphs (✦).

### Two-line H1 design note
Section 1 specifies a two-line headline with Line 1 in lighter weight and Line 2 bolder. Implement using:
```html
<h1>
  <span class="font-normal block">Your students have questions at midnight.</span>
  <span class="font-bold block">You can't be available at midnight.</span>
</h1>
```
All use-case pages follow this same two-line H1 pattern.

### Section background rhythm
Follow the alternating pattern — no two consecutive sections share the same background style:
- Hero (Section 1): white with subtle grid
- Problem (Section 2): `bg-[#1a0f3d] rounded-3xl` (dark navy)
- Solution (Section 3): white
- How It Works (Section 4): textured bg-image (`pricing-bg.png`) with `bg-white/55 backdrop-blur-[2px]` overlay
- Social Proof (Section 5): white (omit if no real testimonials yet)
- FAQ (Section 6): `bg-[#1a0f3d] rounded-3xl` (dark navy)
- CTA (Section 7): `FinalCTASection` → `bg-[#301B69]`

Never let two consecutive sections both be white or both be dark.

### Section spacing
Sections use `px-6 pt-16` only — no `pb-` on intermediate sections. Gap between sections comes from `pt-16` on each section. `FinalCTASection` uses `pt-16 pb-10`.

### Tone option naming
If tone is referenced anywhere on this page, use the four official preset names: **Formal**, **Friendly**, **Direct**, **Supportive**. Do not use "Professional", "Neutral", or "Casual".
