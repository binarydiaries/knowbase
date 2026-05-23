# Use Case: Internal Teams / Company Playbook — `/use-cases/internal-knowledge`

**Purpose:** Target team leads, ops managers, and founders who are losing time to repetitive internal questions — onboarding, SOPs, policies, "where is the X doc?" The core angle is the **company playbook**: institutional knowledge that lives in documents (or in people's heads) and needs to be findable by anyone, anytime, without interrupting a senior person.

**Meta title:** AI Agent for Internal Teams — Turn Your Company Playbook Into an Instant Answer Machine
**Meta description:** Stop being the person your team DMs for things that should be written down. Build an AI agent on Slack trained on your SOPs, playbook, and policies. Knowledge stays — even when people leave.

**Priority:** 🔴 High — primary target vertical

---

## NAV
Same as homepage.

---

## SECTION 1 — Hero

### Eyebrow
✦ INTERNAL TEAMS

### H1
Your team keeps asking questions that are already answered somewhere.
Your playbook should answer them.

> **Design note:** Two-line headline. Line 1 lighter weight. Line 2 bolder.

### Subhead
Build an internal AI agent trained on your company playbook — SOPs, policies, onboarding guides, process docs. Deploy it in Slack. Every team member gets an accurate answer in seconds, without pinging a senior person or searching Notion for 10 minutes.

### CTAs
- **Primary:** Start free → (links to `app.agenvik.com`)
- **Secondary:** See how it works ↓

[ILLUSTRATION: Slack channel view — #general-knowledge or #ask-aria. A new hire asks "How do I submit a reimbursement request?" The agent replies in-thread with the exact 4-step process from the company's expense policy document. Response time: "just now". Below it: another person gives a 👍 reaction.]

---

## SECTION 2 — The Real Cost of Not Having This

### H2
Every time a senior person answers a repeat question, they lose 10 minutes of deep work

### Body
It's not just the question. It's the context switch. The ping at the wrong moment. The "let me find that link" that turns into 5 minutes of searching. Multiply that by 10 people asking 5 repeat questions a week — that's hours of productivity lost every week on things that should be documented.

And the person being asked? They start to gate-keep. Or they burn out. Or they leave, and the knowledge leaves with them.

### 3 signals you need an internal knowledge agent:
1. New hires ask the same questions your team has answered 50 times
2. Institutional knowledge lives in one person's head (and they're always busy)
3. Your docs exist but nobody can find the right one fast enough

> **Playbook angle:** The deepest version of this problem is attrition. When a senior person leaves, they take years of institutional knowledge with them. If that knowledge was never written into a playbook — and even if it was, if the playbook isn't findable — the cost of their departure is far higher than their replacement hire. An internal agent forces the playbook to be written, and makes it perpetually accessible.

---

## SECTION 3 — What It Can Know

### H2
Train it on everything that's already written down

### Content types (visual grid or list):
- HR policies (leave, travel, reimbursement, benefits)
- Onboarding guides and checklists
- Engineering runbooks and SOPs
- Company handbook
- Meeting notes and decision logs
- Product documentation
- Brand guidelines
- Process guides
- OKR frameworks and goal documentation
- Vendor and tooling guides ("How do we use Notion / Jira / Figma")

### Callout
**You don't need to write anything new.** Upload what you already have — even rough Google Docs and old Notion pages. The agent figures out how to answer from them.

---

## SECTION 4 — Where It Lives

### H2
In Slack, where your team already works

### Slack
Deploy your internal agent as a Slack bot in any workspace channel. Team members type a question in natural language — no command syntax, no searching. The agent replies in thread with the exact information from your docs.

**Smart routing:** Create multiple channel-specific agents:
- `#ask-hr` — knows all HR policies
- `#ask-eng` — knows runbooks and technical docs
- `#ask-product` — knows product specs and roadmap docs

[ILLUSTRATION: Slack workspace with 3 channels highlighted: #ask-hr, #ask-eng, #ask-product. One channel is open — #ask-hr. A new hire asks "How many days of paid leave do I get in year 1?" Agent replies with exact policy: "You receive 15 days of paid leave in your first year, accrued monthly from your start date. Here's the full leave policy: [source]".]

### Private web portal (optional)
Deploy a private, password-protected or SSO-gated web interface for teams that don't use Slack. Share the URL internally.

---

## SECTION 5 — Onboarding Use Case (Deep Dive)

### H2
New hire starts Monday. Your agent has them up to speed by Friday.

### Body
The first week is the highest-anxiety, highest-question-volume period for any new team member. They need to understand your tools, processes, culture, and role — fast — without constantly feeling like a burden to their colleagues.

### What your onboarding agent handles:
- "What tools does the team use and how do I get access?"
- "Where do I find the project briefs?"
- "Who do I talk to about [specific domain]?"
- "What's the process for shipping code / approving designs / getting sign-off?"
- "How does the standup format work?"
- "What are the company values and how do we make decisions?"

### Callout
Your agent doesn't replace a buddy system or manager check-ins — it handles the factual, documentation-based questions so those relationships can focus on culture, judgment, and the nuanced stuff only a human can teach.

---

## SECTION 6 — FAQ (Internal teams specific)

**Q: Our docs are a mess. Will it still work?**
A: Partially. Agenvik's accuracy depends on the quality of what you give it. Messy or contradictory docs will produce less reliable answers. This is actually a useful forcing function — building your knowledge agent will highlight exactly what documentation needs to be cleaned up.

**Q: Can I restrict what the agent knows by team?**
A: Yes — create separate Agenvik agents for separate teams with different knowledge bases. Your engineering agent doesn't need to know HR policy; your HR agent doesn't need the deployment runbook.

**Q: What if someone asks something confidential or sensitive?**
A: Only add content you're comfortable having accessible to anyone who can access the agent. Don't add documents with individual salary information, performance reviews, or other sensitive PII to a shared agent. For role-gated knowledge, wait for Agenvik's access control features (on the roadmap).

**Q: Does the Slack bot work in private channels?**
A: Yes — invite the bot to any channel, including private ones. It only responds in channels it's been added to.

---

## SECTION 7 — CTA

### H2
Your team's questions have answers. Let your agent deliver them.

### Body
Start on the free plan. Build your internal knowledge agent this week.

### CTA
**Button:** Build your internal agent → (links to `app.agenvik.com`)

---

## FOOTER
Same as homepage.

---

## IMPLEMENTATION NOTES — SEO / AEO / GEO

### Structured data (JSON-LD)
Emit from the page file:
1. **`WebPage`** — page identity, canonical URL, `dateModified` (build date), `BreadcrumbList` (Home → Use Cases → Internal Teams).
2. **`FAQPage`** — the 4 FAQ Q&As in Section 6. Write answers in full sentences naming the product where natural — AI assistants pull these verbatim as snippets.

`Organization` + `WebSite` schemas come from `Layout.astro` — do not duplicate them here.

### Entity recognition (GEO)
"Agenvik" must appear in visible body text — not just headings or schema. The subhead names it. Section 2 body, Section 3 callout, and Section 5 body should each reference "Agenvik" at first mention. FAQ answers should include "Agenvik" by name in at least 3 of 4 answers (see updated answers in Section 6).

### Channel emphasis
Internal knowledge is a **Slack-first** use case. The hero subhead leads with Slack. Section 4 leads with Slack as the primary deployment target and lists the optional private web portal as secondary. If a channel icon or badge is shown, use a generic message icon in brand colours — do not use Slack purple or any platform brand colour.

### Illustration containers
All illustration placeholders (Section 1 Slack mockup, Section 4 Slack workspace) must render inside `<div aria-hidden="true">` containers. Decorative UI chrome must not surface in the accessibility tree.

### Eyebrow badge
The `✦ INTERNAL TEAMS` eyebrow badge is intentional on use-case pages. Wrap its outer container in `aria-hidden="true"` if it contains decorative glyphs (✦).

### Attrition / playbook callout
Section 2 contains a `> **Playbook angle:**` callout block. In the rendered page this should appear as a visually distinct aside (e.g. border-left accent, slightly muted background) — not a primary call-to-action element. Keep it readable but subordinate to the main column content.

### Section background rhythm
Follow the alternating pattern — no two consecutive sections share the same background style:
- Hero (Section 1): white with subtle grid
- Problem (Section 2): `bg-[#1a0f3d] rounded-3xl` (dark navy)
- What It Can Know (Section 3): white
- Where It Lives (Section 4): textured bg-image (`pricing-bg.png`) with `bg-white/55 backdrop-blur-[2px]` overlay
- Onboarding Deep Dive (Section 5): white
- FAQ (Section 6): `bg-[#1a0f3d] rounded-3xl` (dark navy)
- CTA (Section 7): `FinalCTASection` → `bg-[#301B69]`

Never let two consecutive sections both be white or both be dark.

### Section spacing
Sections use `px-6 pt-16` only — no `pb-` on intermediate sections. Gap between sections comes from `pt-16` on each section. `FinalCTASection` uses `pt-16 pb-10`.

### Tone option naming
If tone is referenced anywhere on this page, use the four official preset names: **Formal**, **Friendly**, **Direct**, **Supportive**. Do not use "Professional", "Neutral", or "Casual".
