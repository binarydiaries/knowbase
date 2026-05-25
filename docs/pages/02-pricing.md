# Pricing Page — `/pricing`

**Purpose:** Let visitors confidently choose a plan. Reduce "is this worth it?" anxiety. Address every comparison objection on the page.

**Meta title:** Agenvik Pricing — Free Plan + Paid Plans from ₹499/month
**Meta description:** Start free forever. Agenvik plans scale from solo projects to enterprise — no hidden fees, no long-term contracts. See exactly what's included in each plan.

---

## NAV
Same as homepage.

---

## SECTION 1 — Header

> **Design decision:** The eyebrow badge (✦ PRICING) was removed to match the clean entry pattern of the features page. Hero opens directly with H1.

### H1
Simple pricing that grows with you

### Subhead
Agenvik starts free — no credit card, no time limit. Pay only when you need more capacity. No hidden fees, no long-term lock-in, just clear limits and real value at every tier.

### Toggle (if applicable in future)
[PLACEHOLDER: Monthly / Annual toggle — "Save 20% annually" — implement when annual billing is ready]

---

## SECTION 2 — Plan Comparison Table

### Design note
4 columns (one per plan). Growth column is highlighted as "Most Popular" via a floating badge **above** the card — not inside it — so all 4 cards remain the same height. Each row is a feature with check/cross/value for each plan. Mobile: horizontal scroll on the table. Sticky header removed (caused tbody category rows to visually overlap the header when scrolling; plain non-sticky header is cleaner).

---

### Plan Cards Row

**FREE**
₹0 / forever
*No credit card required*

Best for: Trying Agenvik, personal projects, testing before committing

[CTA Button] Get started free →

---

**STARTER**
₹499 / month
*Billed monthly*

Best for: Solo builders, small businesses, single product agents

[CTA Button] Start Starter →

---

**GROWTH** ← ★ Most Popular
₹1,499 / month
*Billed monthly*

Best for: Growing teams, multi-product companies, active customer support

[CTA Button] Start Growth →

---

**PRO**
₹3,999 / month
*Billed monthly*

Best for: High-volume businesses, agencies, teams running multiple agents

[CTA Button] Start Pro →

---

### Feature Comparison Table

| Feature | Free | Starter | Growth | Pro |
|---------|------|---------|--------|-----|
| **Agents** | | | | |
| Active agents | 1 | 3 | 10 | 30 |
| **Knowledge** | | | | |
| Knowledge sources | 10 | 250 | 1,000 | 5,000 |
| PDF upload | ✓ | ✓ | ✓ | ✓ |
| Plain text / FAQ | ✓ | ✓ | ✓ | ✓ |
| Website URL crawling | ✗ | ✓ | ✓ | ✓ |
| Training runs / day | 3 | 10 | 20 | 40 |
| **Conversations** | | | | |
| Messages / month | 100 | 500 | 2,000 | 8,000 |
| **Channels** | | | | |
| Website chat widget | ✓ | ✓ | ✓ | ✓ |
| WhatsApp integration | ✗ | ✓ | ✓ | ✓ |
| Slack integration | ✗ | ✗ | ✓ | ✓ |
| **Platform** | | | | |
| Usage stats | ✓ | ✓ | ✓ | ✓ |
| Conversation analytics | ✗ | ✓ | ✓ | ✓ |
| Custom agent tone | ✓ | ✓ | ✓ | ✓ |
| **Support** | | | | |
| Support tier | Community | Email | Email | Priority |
| Response time | — | 48h | 24h | 4h |

> **Notes:**
> - Website URL crawling starts from Starter — not available on Free.
> - Platform splits into two rows: "Usage stats" (quota visibility, all plans) and "Conversation analytics" (full analytics dashboard, Starter and above).
> - Tooltip `?` icons on: Knowledge sources, Website URL crawling, Training runs / day, Messages / month.

---

## SECTION 3 — Tooltips / Explainers (inline)

Add `?` tooltip icons next to these terms. The `?` character inside the button must be wrapped in `<span aria-hidden="true">` — the button itself carries the accessible label via `aria-label`.

**"Knowledge sources"** → A source is any document, URL, or text block you add to your agent's knowledge base. One PDF = one source. One URL = one source.

**"Training runs / day"** → Each time you add or update knowledge and click "Train", that counts as one training run.

**"Messages / month"** → One question + one response = one message. Test messages from you don't count.

**"Website URL crawling"** → Point your agent at a URL and it automatically reads and indexes the page content as a knowledge source.

---

## SECTION 4 — FAQ (Pricing-specific)

**Purpose:** Handle the 6 objections that stop plan selection.

> **GEO rule:** FAQ answers must include "Agenvik" by name in at least 4 of 6 answers so AI assistants can attribute the answer to the correct product when serving as a snippet.

### H2
Pricing questions

**Q: What happens when I hit my message limit?**
A: On Agenvik, your agent stops responding to new conversations for the rest of the month. Existing conversations in progress complete normally. You'll get an email warning at 80% usage so you can upgrade before hitting the limit.

**Q: Can I upgrade or downgrade anytime?**
A: Yes. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period. No penalties, no questions asked.

**Q: Is there an annual plan?**
A: Not yet — Agenvik is on monthly billing only for now. Annual plans with a discount are on the roadmap. Join the waitlist if that's a blocker for you: hello@agenvik.com

**Q: Do you offer refunds?**
A: Yes. If you're unhappy in the first 7 days of a paid plan, email us and we'll refund in full.

**Q: What payment methods do you accept?**
A: Agenvik accepts all major credit and debit cards (Visa, Mastercard, RuPay) and UPI.

**Q: Is there a plan for agencies or multiple clients?**
A: Agenvik's Pro plan supports 30 agents — enough for most agencies. If you need a custom arrangement, email hello@agenvik.com and we'll work something out.

---

## SECTION 5 — Enterprise / Custom

> **Design decision:** Reworked from a feature laundry list to a direct, warm ask. Uses the textured pricing background (same as Section 2) to avoid being a plain white card sandwiched between two dark sections.

### H2
Running at scale or managing multiple clients?

### Body
If Agenvik's Pro plan isn't quite the right fit, we'll work something out. Tell us what you need.

### CTA
**Button:** Let's talk → (links to `mailto:hello@agenvik.com`)

---

## SECTION 6 — Final CTA

Uses the shared `FinalCTASection` component — no custom copy needed here.

---

---

## IMPLEMENTATION NOTES — SEO / AEO / GEO

### Structured data (JSON-LD)
Emit these schemas from `pricing.astro`:
1. **`WebPage`** — page identity, canonical URL, `dateModified` (set to build date), `BreadcrumbList` (Home → Pricing).
2. **`FAQPage`** — the 6 pricing Q&As in Section 4. Write them in full sentences — AI assistants pull these verbatim for snippet answers about Agenvik pricing.
3. **`Product`** — one `Product` entry for Agenvik with `offers` listing each plan as an `Offer` with `name`, `price`, `priceCurrency: "INR"`, `description`, and **`availability: "https://schema.org/InStock"`**. The availability field is required for Google price-comparison rich results.

`Organization` + `WebSite` schemas come from `Layout.astro` — do not duplicate them here.

### Entity recognition (GEO)
"Agenvik" must appear in visible body text on this page — not just in headings or schema. The subhead names it. FAQ answers must also include "Agenvik" by name (see Section 4 rule above). The enterprise section body must name "Agenvik" at first reference.

### Section background rhythm
Follow the same alternating pattern used across the site — no two consecutive sections share the same background style. Current implemented sequence:

- Header (Section 1): white/grid
- Plan table (Section 2): textured bg-image (`pricing-bg.png`) with `bg-white/55 backdrop-blur-[2px]` overlay
- FAQ (Section 4): `bg-[#1a0f3d] rounded-3xl` (dark navy)
- Enterprise (Section 5): textured bg-image (`pricing-bg.png`) with `bg-white/60 backdrop-blur-[2px]` overlay
- Final CTA: `bg-[#301B69]` (via shared `FinalCTASection` component)

Never let two consecutive sections both be white or both be dark navy.

### `aria-hidden` on decorative elements
Any UI mockup, illustration, icon decoration, or non-functional badge inside a section must have `aria-hidden="true"` on its outermost container. This prevents tiny opacity text (e.g. `text-[9px] text-[#301B69]/30`) from failing Lighthouse contrast checks.

For tooltip `?` buttons specifically: the button element itself must **not** be `aria-hidden` (it is interactive and carries `aria-label`). Wrap only the visible `?` character in `<span aria-hidden="true">?</span>` so Lighthouse does not flag the 9px glyph for contrast.

### Section spacing
Sections use `px-6 pt-16` only — no `pb-` on intermediate sections. Gap between sections is created by `pt-16` on each section, matching the features page rhythm. Exception: `FinalCTASection` uses `pt-16 pb-10`.

### Preconnect vs dns-prefetch
`embed.agenvik.com` uses `dns-prefetch` only in `Layout.astro` — **do not add a `preconnect` hint for it**. The embed script is `defer async`, so establishing an early connection wastes a TCP slot. `app.agenvik.com` keeps `preconnect` because it is on the critical CTA path.

### Icon and colour consistency
Plan feature icons (check/cross rows) and any section icons should use the brand palette: `text-[#301B69]` for filled/active states, `text-[#301B69]/25` for inactive (em dash). Do not use third-party platform brand colours (WhatsApp green, Slack purple) in the comparison table — use standard check/dash glyphs only.

### Tone option naming
If tone is referenced anywhere on this page (e.g. in a feature row tooltip or a callout), use the four official preset names: **Formal**, **Friendly**, **Direct**, **Supportive**. Do not use "Professional", "Neutral", or "Casual" — those were the old names and they do not match the product UI.

## FOOTER
Same as homepage.
