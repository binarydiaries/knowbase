# Pricing Page — `/pricing`

**Purpose:** Let visitors confidently choose a plan. Reduce "is this worth it?" anxiety. Address every comparison objection on the page.

**Meta title:** Agenvik Pricing — Free Plan + Paid Plans from ₹499/month
**Meta description:** Start free forever. Agenvik plans scale from solo projects to enterprise — no hidden fees, no long-term contracts. See exactly what's included in each plan.

---

## NAV
Same as homepage.

---

## SECTION 1 — Header

### Eyebrow
✦ PRICING

### H1
Simple pricing that grows with you

### Subhead
Agenvik starts free — no credit card, no time limit. Pay only when you need more capacity. No hidden fees, no long-term lock-in, just clear limits and real value at every tier.

### Toggle (if applicable in future)
[PLACEHOLDER: Monthly / Annual toggle — "Save 20% annually" — implement when annual billing is ready]

---

## SECTION 2 — Plan Comparison Table

### Design note
4 columns (one per plan). Growth column is highlighted as "Most Popular". Each row is a feature with check/cross/value for each plan. Sticky header when scrolling. Mobile: horizontal scroll or accordion per plan.

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
| Website URL crawling | ✓ | ✓ | ✓ | ✓ |
| Training runs / day | 3 | 10 | 20 | 40 |
| **Conversations** | | | | |
| Messages / month | 100 | 500 | 2,000 | 8,000 |
| **Channels** | | | | |
| Website chat widget | ✓ | ✓ | ✓ | ✓ |
| WhatsApp integration | ✗ | ✓ | ✓ | ✓ |
| Slack integration | ✗ | ✗ | ✓ | ✓ |
| **Platform** | | | | |
| Usage analytics | ✗ | ✗ | ✓ | ✓ |
| Custom agent tone | ✓ | ✓ | ✓ | ✓ |
| **Support** | | | | |
| Support tier | Community | Email | Email | Priority |
| Response time | — | 48h | 24h | 4h |

> **Note for dev:** Tooltip icons on any row where "knowledge sources" or "training runs" need explanation. Keep explanations under 10 words.

---

## SECTION 3 — Tooltips / Explainers (inline)

Add `?` tooltip icons next to these terms:

**"Knowledge sources"** → A source is any document, URL, or text block you add to your agent's knowledge base. One PDF = one source. One URL = one source.

**"Training runs / day"** → Each time you add or update knowledge and click "Train", that counts as one training run.

**"Messages / month"** → One message = one question sent to your agent + one response. Only counts billable usage, not test messages from you.

**"Website URL crawling"** → Point your agent at a URL and it automatically reads and indexes the page content as a knowledge source.

---

## SECTION 4 — FAQ (Pricing-specific)

**Purpose:** Handle the 5 objections that stop plan selection.

### H2
Pricing questions

**Q: What happens when I hit my message limit?**
A: Your agent stops responding to new conversations for the rest of the month. Existing conversations in progress complete normally. You'll get an email warning at 80% usage so you can upgrade before hitting the limit.

**Q: Can I upgrade or downgrade anytime?**
A: Yes. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period. No penalties, no questions asked.

**Q: Is there an annual plan?**
A: Not yet — monthly billing only for now. Annual plans with a discount are on the roadmap. Join the waitlist if that's a blocker for you: hello@agenvik.com

**Q: Do you offer refunds?**
A: Yes. If you're unhappy in the first 7 days of a paid plan, email us and we'll refund in full.

**Q: What payment methods do you accept?**
A: All major credit and debit cards (Visa, Mastercard, RuPay) via Razorpay. UPI coming soon.

**Q: Is there a plan for agencies or multiple clients?**
A: The Pro plan supports 30 agents — enough for most agencies. If you need a custom arrangement, email hello@agenvik.com and we'll work something out.

---

## SECTION 5 — Enterprise / Custom

### H2
Need more than the Pro plan?

### Body
Custom message limits, dedicated support, SLA agreements, and white-labelling are available for high-volume businesses and agencies. Talk to us.

### CTA
**Button:** Contact us → (links to `mailto:hello@agenvik.com` or a contact form)

---

## SECTION 6 — Final CTA

### H2
Not sure which plan is right?

### Body
Start with the free plan — no credit card, no time limit. Upgrade only when you need more. Takes 2 minutes to get started.

### CTA
**Button:** Start for free → (links to `app.agenvik.com`)

---

---

## IMPLEMENTATION NOTES — SEO / AEO / GEO

These are lessons carried over from the features page build. Apply them here to avoid repeating the same mistakes.

### Structured data (JSON-LD)
Emit these schemas from `pricing.astro`:
1. **`WebPage`** — page identity, canonical URL, `dateModified` (set to build date), `BreadcrumbList` (Home → Pricing).
2. **`FAQPage`** — the 6 pricing Q&As in Section 4. Write them in full sentences — AI assistants pull these verbatim for snippet answers about Agenvik pricing.
3. **`Product`** (optional but valuable) — one `Product` entry for Agenvik with `offers` listing each plan as an `Offer` with `name`, `price`, `priceCurrency: "INR"`, and `eligibleQuantity` or `description`. This helps Google rich results and price-comparison AI queries.

`Organization` + `WebSite` schemas come from `Layout.astro` — do not duplicate them here.

### Entity recognition (GEO)
"Agenvik" must appear in visible body text on this page — not just in headings or schema. The subhead above names it. If any section body copy is written without naming the product, add "Agenvik" at first reference in that section.

### Section background rhythm
Follow the same alternating pattern used across the site — no two consecutive sections share the same background style. For the pricing page, a safe sequence is:

- Header section: white/grid (matches homepage hero)
- Plan table (Section 2): `bg-[#F5F3FF] border border-[#301B69]/10 rounded-3xl` (light lavender) or textured bg-image with `bg-white/50 backdrop-blur-[2px]` overlay
- FAQ (Section 4): `bg-[#1a0f3d] rounded-3xl` (dark navy) — breaks the light-to-light rhythm
- Enterprise / Final CTA: white or textured

Adjust as needed but never let two consecutive sections both be white or both be dark navy.

### `aria-hidden` on decorative elements
Any UI mockup, illustration, icon decoration, or non-functional badge inside a section must have `aria-hidden="true"` on its outermost container. This prevents tiny opacity text (e.g. `text-[9px] text-[#301B69]/30`) from failing Lighthouse contrast checks. This was the most widespread accessibility issue found on the features page.

### Preconnect vs dns-prefetch
`embed.agenvik.com` uses `dns-prefetch` only in `Layout.astro` — **do not add a `preconnect` hint for it**. The embed script is `defer async`, so establishing an early connection wastes a TCP slot. `app.agenvik.com` keeps `preconnect` because it is on the critical CTA path.

### Icon and colour consistency
Plan feature icons (check/cross rows) and any section icons should use the brand palette: `text-[#301B69]` for filled/active states, `text-[#301B69]/30` for inactive. Do not use third-party platform brand colours (WhatsApp green, Slack purple) in the comparison table — use standard check/cross glyphs only.

### Tone option naming
If tone is referenced anywhere on this page (e.g. in a feature row tooltip or a callout), use the four official preset names: **Formal**, **Friendly**, **Direct**, **Supportive**. Do not use "Professional", "Neutral", or "Casual" — those were the old names and they do not match the product UI.

## FOOTER
Same as homepage.
