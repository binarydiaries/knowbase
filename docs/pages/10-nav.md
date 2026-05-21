# Navigation — All Pages

**Applies to:** Every page on agenvik.com
**Component:** `Header.astro`

---

## Problems With Current Nav (to fix)

- All links are hash anchors (`#features`, `#pricing`) — break on any page other than homepage
- 6 nav items + CTA is too many — clutters on smaller screens
- "Book a Demo" occupies a nav slot — it's a CTA, not a destination
- No "Use Cases" entry — those pages have no way to be discovered
- No mobile menu — `hidden md:flex` means mobile users see logo + "Get Started" only

---

## Confirmed Nav — Option B

One dropdown on Solutions. Book a Demo as outlined secondary button. Build once use case pages are ready; use Phase 1 in the meantime.

### Phase 1 — Build Now (while use case pages are being written)

```
[Agenvik logo]   Features · Pricing · Blog · About   [Book a Demo]  [Get Started →]
```

| Label | Type | Link | Notes |
|-------|------|------|-------|
| Features | Nav link | `/features` | Real page, not `#features` |
| Pricing | Nav link | `/pricing` | Real page, not `#pricing` |
| Blog | Nav link | `/blog` | Exists already |
| About | Nav link | `/about` | New page |
| Book a Demo | **Outlined secondary button** | `/book-demo` | Sits right of the nav links, left of Get Started |
| Get Started → | **Filled primary button** | `app.agenvik.com` | Rightmost, always visible |

### Phase 2 — Once Use Case Pages Are Live

```
[Agenvik logo]   Features · Solutions ▾ · Pricing · Blog   [Book a Demo]  [Get Started →]
```

"About" moves to the footer — nav has enough items at this point.


### Solutions dropdown contents

Opens on hover (desktop) or tap (mobile).

```
┌──────────────────────────────────────────────┐
│                                              │
│  🎧  Customer Support                        │
│      Automate tier-1 queries, 24/7           │
│      → /use-cases/customer-support           │
│                                              │
│  🛍  E-commerce                              │
│      Handle shipping & returns automatically │
│      → /use-cases/ecommerce                  │
│                                              │
│  🏢  Internal Teams                          │
│      Company knowledge, always findable      │
│      → /use-cases/internal-knowledge         │
│                                              │
│  ⚡  SaaS & Product                          │
│      Reduce support, improve activation      │
│      → /use-cases/saas                       │
│                                              │
└──────────────────────────────────────────────┘
```

Each item has:
- Icon (simple, single colour)
- Label (short, bold)
- One-line description (the user's outcome, not the feature)
- Link

"About" moves to the footer in Phase 2 — the nav has enough items.

---

## What's Not in the Nav (and Why)

### How it Works — Not in the nav
"How it Works" is a scroll section on the homepage — the 3-step walkthrough. It's not a destination people navigate *to*; it's part of the homepage flow visitors discover by scrolling.

With a Solutions dropdown in Phase 2, it's also redundant — visitors who want to understand the product will either scroll the homepage or land on a use case page, both of which explain the flow in context.

If it ever becomes a full standalone interactive demo or deep technical explainer, revisit. For now: homepage section only.

### FAQ — Not in the nav
`/faq` is a search-traffic destination — people arrive from Google, not from clicking the nav. Belongs in the footer. Keeping it out of the nav also keeps the nav focused on conversion, not information.

### Book a Demo — Not a nav link, it's a button
It sits as an outlined secondary button between the nav links and the Get Started button. It's a CTA, not a category of content.

---

## Mobile Menu — Both Phases

Currently there is no mobile menu. This needs to be built.

**Trigger:** Hamburger icon (☰) on the right side, replacing the "Get Started" button position on small screens. "Get Started" button stays visible at all times — it's the most important tap target.

**Mobile menu behaviour:**
- Slides in from the right OR drops down from the header (either works — decide with design)
- Full-width overlay
- Tapping outside or pressing ✕ closes it

**Mobile menu contents (Phase 1):**
```
Features          →  /features
Pricing           →  /pricing
Blog              →  /blog
About             →  /about
Book a Demo       →  /book-demo

[Get Started →]   (full-width button at bottom)
```

**Mobile menu contents (Phase 2 — with Solutions):**
```
Features          →  /features

Solutions
  ↳ Customer Support
  ↳ E-commerce
  ↳ Internal Teams
  ↳ SaaS & Product

Pricing           →  /pricing
Blog              →  /blog

[Get Started →]   (full-width button at bottom)
```
Solutions section expands inline (accordion) — no nested menu.

---

## Active State

The current `activePage` prop only supports `'blog'`. Expand it to handle all pages.

```typescript
// Proposed activePage values
type ActivePage = 'home' | 'features' | 'pricing' | 'blog' | 'about' | 'use-cases'
```

Active link style: slightly bolder or an underline — keep it subtle, the nav is already branded purple.

---

## Scroll Behaviour

Current header is `fixed` with `bg-white/60 backdrop-blur-md`. Keep this. Works well.

One addition: on the homepage, when the user hasn't scrolled yet (hero is visible), the nav background can be fully transparent. Once they scroll past the hero, the frosted glass kicks in. This is a minor polish detail — do last.

---

## Footer Nav (reference)

FAQ lives here, not in the top nav.

```
Column 1 — Product       Column 2 — Solutions        Column 3 — Resources     Column 4 — Company
Features                 Customer Support             Blog                     About
How it Works             E-commerce                   Documentation            Book a Demo
Pricing                  Internal Teams               Developer Guide          Contact
Changelog                SaaS & Product               Help & Support           hello@agenvik.com
```

Bottom bar: © 2026 Agenvik · Privacy Policy · Terms · Security · [X] [LinkedIn] [Instagram]
