# Agenvik — Full Organic Visibility Audit
**Date:** 2026-05-20  
**Scope:** SEO · AEO · GEO · Vertical & Channel Search  
**Site:** https://agenvik.com  
**Generator:** Astro v6.3.5 (SSG — fully static, excellent crawlability baseline)

---

## Executive Summary

Agenvik has a technically clean foundation (Astro SSG, structured data, proper meta) but is operating at roughly 10% of its organic potential. The core problems:

1. **No content depth** — 1 blog post, zero landing pages for specific use cases or features
2. **No social proof** — zero testimonials, customer logos, reviews, or case studies on the homepage
3. **GEO is essentially zero** — AI search engines (Perplexity, ChatGPT, Gemini) have nothing to cite
4. **AEO is set up but misfiring** — schema exists, but FAQ targets generic questions, not real search queries
5. **No comparison or "vs" content** — highest-intent buyer traffic goes to competitors
6. **Zero vertical presence** — not on G2, Capterra, Product Hunt, Reddit, YouTube

---

## 1. Technical SEO

### 1.1 Crawlability & Indexability

| Signal | Status | Detail |
|--------|--------|--------|
| `robots.txt` | ✅ Pass | `Allow: /` for all agents; sitemap declared |
| Sitemap | ✅ Pass | `sitemap-index.xml` → `sitemap-0.xml` |
| Sitemap URLs | ⚠️ Thin | Only 7 URLs total (home, blog/, 1 post, book-demo, privacy, security, terms) |
| Canonical | ✅ Pass | `<link rel="canonical" href="https://agenvik.com/">` present |
| SSR vs CSR | ✅ SSG | Astro generates fully static HTML — Google can parse without JS execution |
| `hreflang` | — | Not set; acceptable for English-only now. Add when targeting IN/US separately |
| Sitemap `lastmod` | ❌ Missing | No `<lastmod>` dates in sitemap entries — Googlebot can't prioritise re-crawl |
| `/docs` in sitemap | ❌ Missing | Footer links to `/docs`, `/docs/developer-guide/overview`, `/docs/help-and-support/overview` — not in sitemap and may resolve to Mintlify subdomain |

**Action:** Add `<lastmod>` to all sitemap entries. Confirm `/docs` resolves to `docs.agenvik.com` or same origin; if same origin, add to sitemap.

---

### 1.2 Meta Tags

| Tag | Current Value | Issue |
|-----|---------------|-------|
| `<title>` | `Agenvik — The Fastest Way to Build Your AI Agent` | ✅ Good (55 chars). Could test variant with "No-Code" keyword |
| `<meta description>` | `Upload your PDFs, paste your FAQ, or point it at your website — your AI agent goes live in minutes. No coding required. Deploy on your site, WhatsApp, or Slack.` | ✅ Good. 162 chars, action-oriented |
| `og:title` | Same as title | ✅ |
| `og:image` | `https://agenvik.com/og-image.png` (1200×630) | ✅ Correct dimensions |
| `og:type` | `website` | ✅ |
| `twitter:card` | `summary_large_image` | ✅ |
| `meta[name=robots]` | Not set (defaults to `index,follow`) | ✅ Fine but explicit is better |
| `meta[name=viewport]` | Not captured but implied by Astro | Verify it exists in source |
| Blog `<title>` | `Introducing Agenvik: Build AI Agents from Your Knowledge, Instantly — Agenvik Blog` | ✅ |

---

### 1.3 Structured Data (Schema.org)

Agenvik has unusually good schema coverage for a new product. Here is what's present and what's missing.

**Present — Homepage:**

| Schema Type | Status | Notes |
|-------------|--------|-------|
| `Organization` | ✅ | `sameAs` includes X, LinkedIn, Instagram |
| `WebSite` | ✅ | — |
| `SoftwareApplication` | ✅ | `applicationCategory: BusinessApplication`, `featureList` (9 items), free offer in INR |
| `FAQPage` | ✅ | 10 questions with full answers |
| `HowTo` | ✅ | 5 steps, `totalTime: PT10M`, cost in INR |

**Present — Blog post:**

| Schema Type | Status | Notes |
|-------------|--------|-------|
| `BlogPosting` | ✅ | `datePublished`, `author`, `keywords`, `headline` |
| `BreadcrumbList` | ⚠️ Bug | Position 3 `item` is `https://agenvik.com` instead of the full article URL `https://agenvik.com/blog/introducing-agenvik/` — Google will reject this breadcrumb |

**Missing everywhere:**

| Schema Type | Priority | Why It Matters |
|-------------|----------|----------------|
| `Product` with `AggregateRating` | 🔴 High | Required for star ratings in SERPs — the #1 CTR booster |
| `Review` blocks | 🔴 High | Feeds `AggregateRating`; also cited by AI engines |
| `VideoObject` | 🟡 Medium | Once you have demo/tutorial videos |
| `ItemList` for use cases | 🟡 Medium | Enables rich list results |
| `PriceSpecification` per plan | 🟡 Medium | Can show pricing in AI overviews |
| `Person` schema for founders | 🟡 Medium | Builds author authority for GEO |
| `Event` for webinars/demos | 🟢 Low | When relevant |

**Fix the BreadcrumbList bug now** — it's the one actively wrong thing.

---

### 1.4 Performance

From headless browser `perf`:

| Metric | Value |
|--------|-------|
| TTFB | ~0ms (CDN-cached static) |
| DOM parse | 7ms |
| DOM ready | 17ms |
| Full load | 17ms |

The static Astro build delivers near-instant load times — this is a genuine strength. Core Web Vitals should be green. Verify with PageSpeed Insights in a real browser to get LCP, CLS, INP numbers.

**Image format:** All images are WebP. ✅  
**Lazy loading:** Step images use `loading="lazy"`. ✅  
**No `srcset`:** None of the images use responsive `srcset` — hero image at 2368×1590 natural width but rendered at 976×655. Add `srcset` with 2x/1x variants.

---

### 1.5 Internal Linking

**Current state:** Extremely thin. Navigation links to anchor sections (`#features`, `#pricing`, etc.). Every CTA points to `https://app.agenvik.com/` — a separate domain. No internal linking between pages at all.

**Problems:**
- PageRank cannot flow to any inner page (there are almost no inner pages)
- Blog post gets no internal links from the homepage
- `/book-demo` appears in nav but receives no contextual in-body links
- Docs pages are not linked from any content section

**Required:** A full internal linking strategy once new landing pages exist.

---

## 2. On-Page SEO

### 2.1 Heading Structure

```
H1: The Fastest Way to Build Your AI Agent
  H2: AI Agents Built on Your Knowledge
    H3: Knowledge Sources
    H3: Instant Agent Creation
    H3: Real-time Responses
    H3: Smart Retrieval
  H2: Built for Every Use Case
    H3: Customer Support Agents
    H3: Study Assistants
    H3: Internal Knowledge Agents
    H3: Product Assistants
  H2: Manage and Scale Your AI Agents Effortlessly
    H3: Usage Insights
    H3: Knowledge Management
    H3: Custom Agent Settings
    H3: Secure & Scalable
  H2: Get Started in Minutes
    H3: Set Up Your Account … (5 steps)
  H2: Simple, transparent pricing that scales with you
    H3: Free / Starter / Growth / Pro
  H2: Common Questions About Agenvik
    H3: (FAQ items as H3 effectively)
```

**Assessment:** Hierarchy is logical. H1 is keyword-rich. However:
- H1 renders as two lines in DOM (`"The Fastest Way to\n  Build Your AI Agent"`) — clean this up to a single string
- "Common Questions About Agenvik" as the FAQ H2 is weak for SEO. Better: `"Frequently Asked Questions About Agenvik's AI Agent Builder"`
- H2 headings don't include any target keywords beyond generic product language

### 2.2 Keyword Strategy

**Currently targeted (implicit):**
- "build AI agent"
- "AI agent platform"
- "no-code AI agent"
- "AI agent WhatsApp"

**Not targeted but high value:**

| Keyword | Monthly Volume (est.) | Difficulty | Gap |
|---------|----------------------|------------|-----|
| `chatbot builder` | 40K+ | High | No page |
| `no-code chatbot` | 15K+ | Medium | Implicit only |
| `AI customer support chatbot` | 10K+ | Medium | No dedicated page |
| `chatbase alternative` | 3K+ | Low | No page |
| `custom chatbot for website` | 8K+ | Medium | No page |
| `WhatsApp chatbot builder` | 12K+ | Medium | No page |
| `AI agent for Slack` | 2K+ | Low | No page |
| `train chatbot on PDF` | 5K+ | Low | No page |
| `RAG chatbot builder` | 2K+ | Low | No page (but explained in blog) |
| `chatbot for ecommerce` | 6K+ | Medium | No page |
| `AI knowledge base` | 5K+ | Medium | No page |

**Priority:** Build `/features/whatsapp-chatbot`, `/use-cases/customer-support`, and a `chatbase-alternative` comparison page first. These have clear buyer intent and low competition for a new domain.

### 2.3 Content Depth & Social Proof

**Homepage word count:** ~900 words of visible body copy. This is very thin for a competitive SaaS category. Target 2,000+ words with added testimonials, case studies, and expanded feature explanations.

**Social proof: ZERO**
- No customer testimonials
- No customer logos
- No user count ("X businesses trust Agenvik")
- No review scores
- No press logos ("As seen in")
- No case studies

This is the single biggest conversion and SEO gap on the homepage. Google's Quality Rater Guidelines (EEAT) heavily weight real-world credibility signals. AI search engines specifically look for these signals when deciding whether to cite a product.

---

## 3. AEO — Answer Engine Optimization

AEO targets Google's featured snippets, People Also Ask boxes, and voice search results.

### 3.1 Current State

**What works:**
- `FAQPage` schema with 10 Q&A pairs ✅
- `HowTo` schema with 5 steps ✅
- Direct, non-verbose answers in FAQ ✅
- FAQ renders on-page (not just in schema) ✅

**What's broken:**

The FAQ questions are written from a **product marketing perspective**, not from **real search queries**. Nobody types "What is Agenvik?" into Google. The questions need to match actual user queries.

### 3.2 FAQ Question Audit

| Current Question | Search Value | Better Version |
|-----------------|--------------|----------------|
| "What is Agenvik?" | ❌ Zero (branded, no volume) | "What is a no-code AI agent builder?" |
| "What kind of data can I use?" | ❌ Generic | "Can I train a chatbot on a PDF?" |
| "Do I need coding skills?" | ⚠️ OK but weak | "How do I build an AI chatbot without coding?" |
| "Can I create multiple agents?" | ❌ Too specific | "How many chatbots can I run on one account?" |
| "How accurate are the responses?" | ⚠️ OK | "How do I improve AI chatbot accuracy?" |
| "Is my data secure?" | ✅ Good intent | Keep, expand with specifics (encryption, data residency) |
| "Can I customize agent behavior?" | ⚠️ OK | "How do I change my chatbot's tone and personality?" |
| "Where can I use my agent?" | ✅ Good | Expand: name specific embed code steps |
| "How does pricing work?" | ✅ Good | Add plan comparison table in answer |
| "What's coming next?" | ❌ Not a search query | Replace with: "Does Agenvik integrate with CRM tools?" |

### 3.3 Featured Snippet Opportunities

These are zero-competition or low-competition queries where Agenvik's content can win a featured snippet if a dedicated page exists:

| Query | Snippet Type | Required Content |
|-------|--------------|-----------------|
| "how to train a chatbot on your own data" | HowTo list | Step-by-step tutorial page |
| "what is RAG chatbot" | Definition paragraph | Glossary or explainer page |
| "how to add chatbot to website without coding" | HowTo list | Dedicated tutorial |
| "WhatsApp chatbot for small business" | Paragraph | Use-case landing page |
| "difference between chatbot and AI agent" | Definition table | Comparison blog post |
| "how to embed chat widget in website" | Code snippet | Developer docs page |
| "chatbot for PDF documents" | Paragraph | Feature page |

### 3.4 People Also Ask (PAA) Gaps

PAA boxes on "AI chatbot builder" and related queries currently show answers from Tidio, Botpress, Chatbase, Intercom. Agenvik is not represented because:
- No pages target these queries
- No content structured as a direct answer to the question
- Domain authority is near zero (new site)

**Fast path to PAA:** Write 5-10 blog posts that begin with a direct one-sentence answer to the target question, then expand. Google's PAA algorithm heavily favours "inverted pyramid" content structure.

---

## 4. GEO — Generative Engine Optimization

GEO is about being cited by AI search systems: ChatGPT (Browse), Perplexity, Google AI Overviews, Gemini, Claude, and Bing Copilot. These systems synthesize answers from trusted, authoritative, citable sources.

### 4.1 Current GEO Score: Very Low

**Why AI engines won't cite Agenvik today:**
- New domain with zero backlinks (no DA/authority)
- No third-party reviews on G2, Capterra, Product Hunt
- Not mentioned in any major tech publication
- No Wikipedia presence
- No academic or industry report citations
- Social profiles exist but have no visible engagement signals
- Only 1 blog post — insufficient content depth for topic authority

### 4.2 What AI Engines Cite

AI search engines synthesize from:
1. **High-DA publications** (TechCrunch, Product Hunt, Forbes, Wired)
2. **Review aggregators** (G2, Capterra, Trustpilot, GetApp)
3. **Community discussions** (Reddit, Hacker News, Stack Overflow, Quora)
4. **Official documentation** (clear, factual, well-structured)
5. **Wikipedia and Wikidata**
6. **YouTube transcripts** (Perplexity and Gemini index these)
7. **Competitor comparison pages** (frequently cited in "X vs Y" responses)

### 4.3 GEO Action Plan

#### Tier 1: Listings (do first — free, immediate)

| Platform | Action | Impact |
|----------|--------|--------|
| **Product Hunt** | Launch (with full media kit, demo video, early access offer) | High — Perplexity and ChatGPT frequently cite PH pages |
| **G2** | Create free profile, get 5+ reviews | High — G2 is heavily indexed by all AI engines |
| **Capterra** | Create free profile | Medium — similar to G2 |
| **Crunchbase** | Add company, funding, team | High — AI engines cite Crunchbase for "what is X company" |
| **LinkedIn Company** | Fully fill out Products section | Medium |
| **Trustpilot** | Create profile, ask early users to review | Medium |
| **AlternativeTo** | List Agenvik, add it as alternative to Chatbase, Tidio | Medium — "alternative to X" queries |

#### Tier 2: Content for Citation

AI engines prefer to cite content that contains:
- **Specific, verifiable statistics** (not "AI is transforming business" — "87% of customer queries are repetitive, per [source]")
- **Named competitor comparisons** (structured tables)
- **Technical explanations** (RAG pipeline, vector embeddings — you have this in the blog)
- **Case studies with named companies and metrics**
- **Research citations** ("According to Gartner 2025...")

The blog post "Introducing Agenvik" is actually well-written and explains RAG clearly — this is citable content. Expand it and add more like it.

#### Tier 3: Digital PR

| Outlet | Angle | Priority |
|--------|-------|----------|
| YC Startup School / IndieHackers | "How we built our AI agent platform" | 🔴 High |
| Hacker News "Show HN" | Launch post with technical depth | 🔴 High |
| Dev.to / Hashnode | "Building a RAG pipeline for business chatbots" | 🔴 High |
| The SaaS Podcast / Indie Bites | Founder interview | 🟡 Medium |
| TechCrunch / VentureBeat | Press release or contributor article | 🟡 Medium |
| LinkedIn Articles | Founder thought leadership (weekly) | 🟡 Medium |
| Substack AI newsletters | Sponsor or guest post | 🟢 Low |

#### Tier 4: Structured Citations Page

Create a `/about` or `/company` page with:
- Founding year, founders' names, location
- Mission statement
- Funding status (even if bootstrapped, say so)
- Key metrics (agents created, messages handled, countries)
- Press kit download

AI engines need factual anchors to cite a company. Right now Agenvik is a "ghost" — no verifiable company facts beyond the website itself.

### 4.4 "LLM.txt" / AI Discoverability

Emerging standard: create `https://agenvik.com/llms.txt` — a plain-text file that tells AI crawlers what your product does and what pages to prioritize. Format:

```
# Agenvik

> Agenvik is a no-code AI agent platform. Businesses upload documents, FAQs, or website URLs to train AI agents deployed on websites, WhatsApp, and Slack.

## Key pages
- https://agenvik.com/ : Homepage
- https://agenvik.com/blog/ : Blog
- https://agenvik.com/docs : Documentation

## Product
- Build AI agents from your own knowledge (PDFs, FAQ, URLs)
- No coding required
- Deploy on website chat widget, WhatsApp, Slack
- Pricing from ₹0/month
```

Perplexity, Anthropic, and OpenAI have all indicated they will use `llms.txt` as a discoverability signal.

---

## 5. Content Strategy Gaps

### 5.1 Missing Pages (Prioritised)

| Page | Target Keyword | Type | Priority |
|------|----------------|------|----------|
| `/use-cases/customer-support` | "AI customer support chatbot" | Use-case LP | 🔴 |
| `/use-cases/saas-onboarding` | "AI agent for SaaS onboarding" | Use-case LP | 🔴 |
| `/use-cases/ecommerce` | "chatbot for ecommerce" | Use-case LP | 🔴 |
| `/features/whatsapp-chatbot` | "WhatsApp chatbot builder" | Feature LP | 🔴 |
| `/features/pdf-chatbot` | "train chatbot on PDF" | Feature LP | 🔴 |
| `/features/website-chat-widget` | "custom chat widget for website" | Feature LP | 🔴 |
| `/compare/chatbase-alternative` | "chatbase alternative" | Comparison | 🔴 |
| `/compare/tidio-alternative` | "tidio alternative" | Comparison | 🟡 |
| `/compare/botpress-alternative` | "botpress alternative" | Comparison | 🟡 |
| `/blog/how-to-build-chatbot-without-coding` | "build chatbot without coding" | Blog | 🔴 |
| `/blog/what-is-rag-chatbot` | "what is RAG chatbot" | Blog | 🔴 |
| `/blog/whatsapp-chatbot-tutorial` | "how to set up WhatsApp chatbot" | Blog | 🔴 |
| `/blog/chatbot-vs-ai-agent` | "chatbot vs AI agent difference" | Blog | 🟡 |
| `/blog/best-chatbot-for-small-business` | "best AI chatbot for small business" | Blog | 🟡 |
| `/customers` or `/case-studies` | "AI agent case study" | Social proof | 🔴 |
| `/about` | "Agenvik company" | Company | 🟡 |
| `/integrations` | "AI agent integrations" | LP | 🟡 |

### 5.2 Blog Cadence Target

Current: 1 post (May 2026).  
Target: 4 posts/month minimum for the first 6 months.

**Recommended first 8 posts:**

1. "How to Train a Chatbot on Your PDF Documents (Step-by-Step)"
2. "What Is a RAG Chatbot and Why It Beats Generic AI"
3. "How to Add a Chat Widget to Your Website in 5 Minutes"
4. "WhatsApp Business Chatbot: Complete Setup Guide for 2026"
5. "Chatbase vs Agenvik: Honest Comparison for 2026"
6. "7 Ways E-commerce Stores Are Using AI Agents to Reduce Support Tickets"
7. "AI Agent vs Traditional Chatbot: What's the Difference?"
8. "How to Build an Internal Knowledge Base with AI"

Each post should: start with a direct answer (PAA/AEO), use H2 for each section, include a working example/screenshot from Agenvik's dashboard, and link internally to the relevant feature or use-case page.

---

## 6. Vertical & Channel SEO

### 6.1 Search Channels Beyond Google

| Channel | Current State | Action |
|---------|---------------|--------|
| **Google Search** | Foundation exists, no authority | Build content + backlinks |
| **Bing / Copilot** | Same as Google (Bing crawls same signals) | Verify Bing Webmaster Tools submission |
| **Perplexity** | No citations found | Product Hunt launch + review profiles trigger Perplexity coverage |
| **ChatGPT Browse** | No citations found | G2 + Crunchbase + press = triggers |
| **Google AI Overviews** | Not appearing | FAQPage schema + high-authority backlinks needed |
| **YouTube Search** | No channel, no videos | Create demo + tutorial videos |
| **LinkedIn Search** | Company page likely exists | Publish weekly articles, add Products section |
| **Reddit** | No presence | Contribute genuinely to r/SaaS, r/chatbots, r/AItools, r/nocode |
| **Product Hunt** | Not launched | Launch ASAP — one-time high-impact event |
| **G2 / Capterra** | Not listed | Create profiles, request reviews |
| **AlternativeTo** | Not listed | Add Agenvik, mark as alternative to Chatbase, Botpress, Tidio |
| **Hacker News** | Not mentioned | "Show HN" post with technical RAG explanation |
| **Dev.to** | No presence | Technical blog posts on RAG implementation |
| **AppSumo** | Not listed | Consider lifetime deal launch for backlinks + reviews |

### 6.2 YouTube Strategy

YouTube is the second-largest search engine and is increasingly indexed by Gemini and Perplexity. Video transcripts become citable text.

**Minimum viable YouTube presence:**

| Video | Target Query | Length |
|-------|--------------|--------|
| "Agenvik Demo: Build an AI Agent in 10 Minutes" | brand + demo | 10min |
| "How to Train a Chatbot on a PDF" | tutorial | 5min |
| "How to Add a WhatsApp Chatbot to Your Business" | tutorial | 7min |
| "Agenvik vs Chatbase: Which Is Better?" | comparison | 8min |
| "How to Embed a Chat Widget on Your Website" | tutorial | 4min |

Upload captions. Use the target keyword in video title, description (first 2 lines), and tags. Each video description should link back to the relevant landing page.

### 6.3 Reddit Strategy

Reddit threads rank highly for "X vs Y" and "best tool for Y" queries. Approach:

- **Do not spam.** Build genuine karma in relevant subreddits first.
- Target: r/SaaS, r/nocode, r/artificial, r/chatbots, r/CustomerService, r/Entrepreneur, r/smallbusiness
- Contribute to existing threads about chatbot tools for 4 weeks before mentioning Agenvik
- Create a genuine "I built X, here's what I learned" post on r/SaaS and r/IndieHackers
- Answer questions about "how to add chatbot to website" or "WhatsApp automation for small business" with genuinely helpful answers that incidentally mention Agenvik where relevant

### 6.4 LinkedIn Strategy

LinkedIn is increasingly indexed by Google and cited by AI engines.

- Publish a weekly article from the founder account: use cases, product updates, lessons from building
- Post short-form updates (screenshots of new features, customer results, stats)
- Build the company page Products section with full feature descriptions
- Get team members to list Agenvik as their employer (DA signal)
- Engage in LinkedIn groups: AI Tools, SaaS Founders, No-Code Community

---

## 7. EEAT Signals (Google's Quality Rater Framework)

EEAT = Experience, Expertise, Authoritativeness, Trustworthiness. Critical for AI-adjacent content.

| Signal | Current State | Action |
|--------|---------------|--------|
| **Experience** | No customer stories, no "we use this ourselves" content | Add use-case stories from beta users |
| **Expertise** | Blog author is "Agenvik Team · Founders" — no named individual | Add founder bio pages with LinkedIn links; name the author on posts |
| **Authoritativeness** | Zero backlinks, not cited anywhere | Product Hunt, G2, press coverage |
| **Trustworthiness** | Privacy policy ✅, Terms ✅, Security policy ✅, email listed ✅ | Add physical address, company registration number, founders' names |

**Quick trust wins:**
- Add founders' names and photos to the About/blog author sections
- Add a company registration number (CIN) to the footer or `/about` page
- Add a phone number or at minimum a support SLA statement
- Display "X agents created" or "X conversations handled" as a live stat

---

## 8. Specific Schema Bugs to Fix Now

### Bug 1: BreadcrumbList on Blog Post

```json
// WRONG — currently:
{
  "@type": "ListItem",
  "position": 3,
  "name": "Introducing Agenvik...",
  "item": "https://agenvik.com"   // ← This is the homepage URL, not the article URL
}

// CORRECT:
{
  "@type": "ListItem",
  "position": 3,
  "name": "Introducing Agenvik...",
  "item": "https://agenvik.com/blog/introducing-agenvik/"
}
```

### Bug 2: SoftwareApplication Offer Price

```json
// CURRENT:
"offers": {
  "price": "0",
  "priceCurrency": "INR",
  "description": "Free plan available. Paid plans start from ₹0/month."
}
```

The description says "Paid plans start from ₹0/month" which is confusing. Fix: `"Paid plans start from ₹499/month."` Also consider using `AggregateOffer` with `lowPrice: 0` and `highPrice: 3999`.

### Bug 3: Missing `dateModified` on Homepage

Add a `dateModified` field to the `WebSite` and `SoftwareApplication` schema. Google uses this to understand freshness.

### Bug 4: Missing `SearchAction` on `WebSite`

Add a sitelinks searchbox to enable Google to display an inline search:
```json
{
  "@type": "WebSite",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://agenvik.com/docs?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

---

## 9. Quick Wins (Do This Week)

| Action | Effort | Impact |
|--------|--------|--------|
| Fix BreadcrumbList bug on blog post | 15 min | Breadcrumbs show in Google |
| Fix SoftwareApplication offer description | 5 min | Cleaner rich result |
| Create Crunchbase company profile | 30 min | GEO signal |
| Create G2 profile (even with 0 reviews) | 30 min | GEO signal + backlink |
| Submit to Bing Webmaster Tools | 15 min | Bing/Copilot indexing |
| Create `llms.txt` file | 20 min | AI crawler discoverability |
| Add `lastmod` to sitemap entries | 30 min (dev) | Faster re-crawl |
| Add `srcset` to hero image | 1 hour (dev) | LCP + image SEO |
| Add founders' names to blog post author | 10 min | EEAT signal |
| Add a testimonial from any beta user | 1 day | EEAT + conversion |
| List on AlternativeTo.net | 20 min | "Alternative to" query coverage |
| Write 1 "How to train chatbot on PDF" blog post | 1 day | Quick traffic from long-tail query |

---

## 10. 90-Day Organic Growth Roadmap

### Month 1 — Fix Foundation
- Fix all schema bugs
- Create `llms.txt`
- Add to Crunchbase, G2, Capterra, AlternativeTo, Bing Webmaster Tools
- Write 4 blog posts (tutorial format, targeting specific how-to queries)
- Launch on Product Hunt
- Post "Show HN" on Hacker News
- Add testimonials section to homepage (even 2-3 from beta users)
- Add founders' names + bios to blog

### Month 2 — Build Content Pillars
- Create 3 use-case landing pages (customer support, e-commerce, SaaS)
- Create 2 feature landing pages (WhatsApp chatbot, PDF chatbot)
- Create 1 competitor comparison page (Chatbase vs Agenvik)
- 4 more blog posts
- Upload first 3 YouTube tutorial videos
- Start LinkedIn weekly articles from founder account
- Get 5+ G2 reviews from beta users

### Month 3 — Amplify & Build Authority
- Create `/about` page with company facts, founders, mission
- Create `/customers` page with 2-3 mini case studies
- Begin Reddit contribution strategy
- Reach out to 5 AI/SaaS newsletters for coverage
- Guest post on Dev.to or Hashnode (technical RAG piece)
- 4 more blog posts
- 3 more YouTube videos
- Track PAA appearances; iterate FAQ content based on real queries showing up in Search Console

---

## 11. Tracking & Measurement

Set these up immediately if not already done:

| Tool | Purpose |
|------|---------|
| Google Search Console | Impressions, clicks, query data, index coverage |
| Google Analytics 4 | Traffic sources, conversion to sign-up |
| Bing Webmaster Tools | Bing-specific coverage |
| Ahrefs / Semrush (free tier) | Keyword tracking, backlink monitoring |
| Perplexity / ChatGPT manual checks | Monthly "what is the best AI agent builder" query to check citation status |

**Key metrics to track weekly:**
- Indexed pages (target: 50+ by end of Month 3)
- Organic clicks (baseline → track growth)
- Referring domains (target: 25+ by end of Month 3)
- G2 / Capterra reviews count
- Blog post rankings for target keywords

---

*Generated by SEO audit — agenvik.com — 2026-05-20*
