# Agenvik — Competitive Feature Roadmap

## Context

Agenvik is targeting **SMBs and startups** in India. The platform already has a solid foundation: RAG chat, multi-channel (Web/WhatsApp/Slack), lead capture, analytics, and Razorpay billing. This roadmap prioritises closing critical acquisition gaps (features buyers expect before signing up) and adding differentiated capabilities that no direct competitor offers cleanly.

**Competitors benchmarked**: Chatbase, CustomGPT, Botpress, Tidio, Crisp, Intercom, ManyChat, Respond.io

---

## Shipped ✅

| Feature | Version | Date |
|---------|---------|------|
| Optional Lead Capture Fields (soft-ask, never block) | v0.7.0 | Jun 18, 2026 |
| Batched Field Collection (ask all required fields at once) | v0.7.0 | Jun 18, 2026 |
| Name Personalization in chat responses | v0.7.0 | Jun 18, 2026 |
| PDF Upload as Knowledge Source | v0.6.0 | May 26, 2026 |
| URL / Website Crawl as Knowledge Source | v0.6.0 | May 26, 2026 |
| Lead Generation (conversational capture) | v0.3.0 | Apr 20, 2026 |
| Lead Generation plan gating (Starter+) | v0.4.0 | Apr 21, 2026 |
| Multi-channel: Web, WhatsApp, Slack | v0.1.0 | May 20, 2026 |
| Analytics dashboard | v0.1.0 | May 20, 2026 |
| Razorpay billing + live subscription management | v0.4.0 | Apr 21, 2026 |
| Bubble color + suggestion questions customisation | v0.5.0 | May 8, 2026 |
| Dark mode | v0.5.0 | May 8, 2026 |

---

## Tier 1 — Quick Wins (1–2 weeks each)

High impact, low complexity. These close the most common "I went to a competitor instead" objections.

### ~~1. PDF Upload as Knowledge Source~~ ✅ Shipped v0.6.0

PDF and website URL knowledge sources are live. Agents can be trained from uploaded PDFs (up to 200K chars) or any public webpage. Gated behind the `url_crawling` feature flag on Starter+.

---

### ~~2. URL / Website Crawl as Knowledge Source~~ ✅ Shipped v0.6.0

See above — shipped alongside PDF in v0.6.0.

---

### 3. Lead Capture Webhook

**Why**: Every captured lead is currently stranded in the Agenvik dashboard. Customers need leads flowing into their CRM, Google Sheets, or Zapier workflows. Without this, the lead generation feature has limited value for most users.

**How**:
- Extend `LeadGenerationConfig` (stored as JSONB in `agentActions`) with `webhookUrl` and `webhookSecret`
- In `chat/persistence.ts` `handleLeadCapture`, after saving the lead, enqueue a BullMQ webhook delivery job
- Deliver via `fetch(webhookUrl, { method: 'POST', body: JSON.stringify(lead) })` with `X-Agenvik-Signature: sha256=<hmac>` header
- Retry up to 3 times with exponential backoff

**Payload**: `{ leadId, agentId, agentName, name, email, phone, company, conversationId, channelType, capturedAt }`

**Plan gate**: Starter+

**Critical files**:
- `apps/backend/src/db/schema/agentActions.ts`
- `apps/backend/src/modules/chat/persistence.ts`
- `apps/backend/src/queue/` — new webhook queue job type
- `apps/dashboard/src/widgets/ActionsCard` — webhook URL + secret field in UI

---

### 4. Fallback / Unanswered Question Email Alerts

**Why**: Operators who get alerted when the bot can't answer will improve their knowledge base. This closes the "bot is useless" churn loop. The Resend + BullMQ email infrastructure is already fully wired — this is almost entirely new business logic.

**How**:
- In `chat/service.ts` `onFinish`, compare response to `behavior.fallbackMessage`
- If match, enqueue a `fallback-alert` email job — batched per agent per hour to prevent spam
- Email includes: user question, timestamp, deep link to conversation in the dashboard
- Add notification preference toggle in account settings

**Plan gate**: Daily digest on Free; real-time hourly alerts on Starter+

**Critical files**:
- `apps/backend/src/modules/chat/service.ts`
- `apps/backend/src/queue/email.queue.ts`
- New `fallback-alert` email template

---

### 5. Conversation & Lead Export (CSV)

**Why**: Every competing platform offers data export. Without it, customers can't do their own analysis, and fear of lock-in reduces conversion. Also a short-term bridge while CRM integrations are being built.

**How**:
- `GET /conversations/export` and `GET /leads/export` — stream CSV via Bun `Response` with `Content-Disposition: attachment; filename=...`
- Leads CSV: `agentName, channelType, name, email, phone, company, capturedAt`
- Conversations CSV: `agentName, topic, country, sentiment, messageCount, lastMessageAt`
- Free tier: last 100 rows. Starter+: full export.

**Critical files**:
- `apps/backend/src/modules/conversation/conversation.ts`
- `apps/backend/src/modules/lead/lead.ts`
- Export buttons in dashboard conversations and leads pages

---

## Tier 2 — Strategic Features (2–4 weeks each)

These build competitive moats and unlock new buyer segments.

### 6. REST API + API Keys

**Why**: Opens the developer and agency buyer segment entirely. Chatbase and CustomGPT both offer this. Technical buyers will not seriously evaluate a platform without an API. API access also unlocks headless deployments (mobile apps, internal tools).

**How**:
- New `apiKeys` Drizzle schema: `id`, `orgId`, `keyHash` (SHA-256 only — show raw key once at creation), `name`, `lastUsedAt`, `rateLimit`, `enabled`
- New `apiKeyGuard` middleware parallel to the existing `authGuard` — validates `Bearer <api-key>` against the hashed table
- New versioned route group `/v1/*` in `server.ts`
- Rate limiting via Redis sliding window per `keyId` + minute bucket (Redis already present)
- v1 endpoints: `POST /v1/chat/{channelId}` (non-streaming JSON), `GET /v1/conversations`, `GET /v1/leads`, `GET /v1/agents`

**Plan gate**: Growth+ for API access; higher rate limits on Pro

**Critical files**:
- `apps/backend/src/db/schema/` — new `apiKeys` table
- `apps/backend/src/middleware/apiKeyGuard.ts`
- `apps/backend/src/server.ts` — register `/v1` route group
- `apps/dashboard/src/routes/integrations/` — API Keys management page (create, revoke, view last-used)

---

### 7. Human Handoff / Team Inbox

**Why**: "What happens when the bot can't help?" is the #1 objection from support-focused buyers. Tidio and Crisp are built around this. Without it, Agenvik cannot be seriously considered for customer support use cases — the largest market segment.

**How**:
- Add `handoffStatus: 'none' | 'pending' | 'active' | 'resolved'` and `assignedTo` (Clerk user ID) to `conversations` table
- `POST /conversations/{id}/handoff` — marks conversation as `pending`; fires SSE event to dashboard inbox
- New Inbox route in dashboard: lists `pending` + `active` conversations, real-time via SSE (pattern already exists in chat streaming)
- `POST /conversations/{id}/reply` — human agent sends message; bypasses LLM; routes through WhatsApp/Slack/Web channel send path
- Auto-trigger: N consecutive fallback hits within a conversation → auto-escalate to `pending`
- Widget: "Talk to a human" button that sends a system message and shows "Connecting you..." state

**Plan gate**: Growth+

**Critical files**:
- `apps/backend/src/db/schema/conversations.ts` — add `handoffStatus`, `assignedTo`
- `apps/backend/src/modules/conversation/conversation.ts` — handoff + reply endpoints
- `apps/dashboard/src/routes/` — new Inbox route (can reuse `ConversationListItem`, `ConversationMessageItem`, `ConversationThreadMeta` components)
- `apps/client/` — "Talk to a human" button in chat widget

---

### 8. Instagram DM Channel

**Why**: The `instagram` channel type is already stubbed in the DB schema and channel enum. Instagram DM automation is the core ManyChat use case, critical for fashion, retail, and creator-economy SMBs — exactly the audience the INR pricing targets.

**How**:
- Mirror the `whatsapp/` module: new `apps/backend/src/modules/instagram/` with `connectionService.ts` and webhook handler
- Use Facebook Messenger Platform API (not WhatsApp API) — `instagram` and `messenger` share the same Meta webhook infrastructure
- New `instagramConnections` schema: `orgId`, `pageId`, `accessToken`, `instagramAccountId`
- Facebook OAuth flow to obtain page access token; subscribe to `messages` webhook events

**Plan gate**: Starter+ (same as WhatsApp)

**Critical files**:
- `apps/backend/src/modules/instagram/` — new module
- `apps/backend/src/db/schema/instagramConnections.ts`
- `apps/backend/src/modules/channel/channel.ts` — register Instagram handler

---

### 9. Knowledge Base Management via API

**Why**: Technical teams want CI/CD-style KB syncing — auto-update the agent's knowledge on every product deploy. Customers who automate KB updates via API are maximally sticky and essentially impossible to churn.

**How**:
- Extends Feature 6 (API Keys). Add `/v1/agents/{agentId}/documents` CRUD under `apiKeyGuard`
- Auto-trigger indexing on create/update (same as dashboard flow)
- Return document `status` in response so callers can poll for `indexed` state
- Supports `type: "text"`, `"qna"`, `"url"` (after Feature 2), and PDF multipart upload

**Critical files**: Same API key infrastructure from Feature 6 + existing `document/` and `indexing/` modules

---

### 10. Advanced Widget Customisation

**Why**: The web widget is the most visible brand touchpoint for customers' websites. Rich theming deepens attachment to the platform and is a natural upsell gate.

**New config options**:
- `avatarUrl` — custom bot avatar image
- `launcherText` — CTA bubble text ("Chat with us!", "Need help?")
- `launcherDelay` — auto-open widget after N seconds on page
- `removePoweredBy` — hide "Powered by Agenvik" branding
- Additional colour controls (background, text, bubble colours)

**Plan gate**: Basic options on Free; `removePoweredBy` and launcher customisation on Growth+

**Critical files**:
- `apps/backend/src/modules/channel/model.ts` — extend `ChannelWebConfigSchema`
- `apps/embed/src/launcher.ts` — read new config fields
- `apps/client/src/widgets/AgentWidget.tsx` — render new options

---

## Tier 3 — Differentiation (1+ month each)

High-complexity features that create defensible long-term moats.

### 11. Multi-LLM Support (Claude, Gemini, Llama)

**Why**: "Use your preferred LLM" is a strong selling point vs. GPT-only platforms. The Vercel AI SDK (`ai` package) already in use abstracts LLM providers behind a unified interface — this is architecturally the cleanest possible foundation for multi-LLM.

**How**:
- Add `modelProvider` and `modelId` columns to the `behaviors` table
- Replace hardcoded `openai('gpt-4.1-mini')` in `chat/service.ts` with a `getModel(provider, modelId)` factory function
- Add `@ai-sdk/anthropic`, `@ai-sdk/google`, `ollama-ai-provider` packages
- Update `AiCostEventService` cost-per-token config map to include each model's pricing
- Dashboard: model selector in agent settings with capability badges (Faster / More accurate / Lower cost)

**Starting models**: Claude Haiku (cost), Gemini Flash (speed), GPT-4.1-mini (default)

**Plan gate**: Model selection on Growth+; Free/Starter locked to the default

**Critical files**:
- `apps/backend/src/modules/chat/service.ts`
- `apps/backend/src/db/schema/behaviors.ts`
- `apps/backend/src/modules/admin/costEvent.service.ts`

---

### 12. WhatsApp Broadcast / Campaign Messages

**Why**: This is the ManyChat use case. No competitor combines RAG chatbot + broadcast messaging in one platform. Customers use broadcast for marketing campaigns, appointment reminders, and re-engagement — directly revenue-generating, which justifies the Pro plan price point.

**How**:
- New `whatsappTemplates` table: template name, components (header/body/buttons), Meta approval status
- New `broadcastCampaigns` table: template, target list, scheduled time, delivery status
- New `broadcastRecipients` table: contact, delivery status, sent/read timestamps
- BullMQ broadcast executor with rate limiting (~1,000 msg/sec WhatsApp limit)
- Template manager UI: submit template to Meta for approval, view approval status
- Campaign builder UI: pick template, select contacts / upload CSV, schedule, view delivery stats
- Opt-out handling: STOP replies set `optedOut: true` and are respected in all future campaigns

**Plan gate**: Pro only

---

### 13. KB Gaps & AI-Suggested Improvements *(Most Unique)*

**Why**: No direct competitor has this. Chatbase has a raw "Questions" export but no suggestions. This closes the knowledge-gap feedback loop automatically — the platform actively shows operators what to fix, making the bot measurably smarter over time. This is a defensible product moat.

**How**:
- Track `hitFallback: boolean` in `MessageMetaData` in `persistence.ts` (when response === `behavior.fallbackMessage`)
- Daily BullMQ job: groups last 7 days of fallback questions per agent → calls GPT-4.1-nano with a prompt that generates draft Q&A pair suggestions
- New "Gaps & Suggestions" tab in the Analytics section:
  - Each row: missed user question + AI-drafted answer + confidence
  - One-click "Add to KB" pre-fills the document creation form
  - Over time shows trend: "Gaps resolved this week: 12"

**Plan gate**: Growth+ (matches existing analytics gating)

**Critical files**:
- `apps/backend/src/modules/chat/persistence.ts` — add `hitFallback` flag to message metadata
- `apps/backend/src/modules/analytics/service.ts` — `getFallbackConversations()`
- `apps/backend/src/modules/` — new `suggestions` module
- `apps/dashboard/src/routes/analytics/` — Gaps & Suggestions tab

---

### 14. White-Label / Custom Domain

**Why**: Unlocks the agency and reseller channel. A single agency customer can represent 10–50 end-client seats. Phase 1 (branding removal) is achievable quickly; Phase 2 (full custom domain) requires proxy infrastructure.

**Phase 1 (2 weeks)**:
- New `orgBranding` table: `removePoweredBy`, `logoUrl`, `brandPrimaryColor`
- Widget reads branding config at load time; removes/replaces Agenvik branding

**Phase 2 (custom domain)**:
- Cloudflare Workers proxy: route `chat.customer-domain.com` → Agenvik client app with `orgId` injected via request header
- Resend custom domain support for from-address in lead emails

**Plan gate**: Phase 1 as an add-on for Growth+; Phase 2 as an Agency tier or high-value add-on

---

## Recommended Sequencing

| Timeline | Ship | Status |
|----------|------|--------|
| ~~Week 1–2~~ | ~~PDF Upload + URL Crawl~~ | ✅ Shipped v0.6.0 (May 26, 2026) |
| Next | Lead Webhook + Email Alerts | Extends existing Resend + BullMQ infra; makes lead gen actually useful |
| Next | Conversation & Lead Export | Appears on every "missing features" list from prospects |
| Month 2 | REST API + KB Management API | Shared API key infra; unlocks developer and agency segment |
| Month 2–3 | Human Handoff Inbox | Unblocks support-team deals; conversation UI components already exist |
| Month 3 | Instagram Channel | Near-clone of WhatsApp module; targets core SMB audience |
| Month 4+ | Multi-LLM, WhatsApp Broadcasts, KB Gaps, White-Label | Ship in order of customer demand signals |

---

## Key Files Across All Features

| File | Why It Matters |
|------|---------------|
| `apps/backend/src/modules/document/model.ts` | Add `pdf` and `url` to `DocumentContent` union — foundational for T1 |
| `apps/backend/src/queue/indexing/indexing.worker.ts` | Route new doc types through parse → embed pipeline |
| `apps/backend/src/modules/chat/persistence.ts` | Lead webhook dispatch + fallback flag tracking |
| `apps/backend/src/modules/chat/service.ts` | Fallback detection, model selection, handoff auto-trigger |
| `apps/backend/src/modules/subscription/plans.ts` | Gate every new feature behind correct plan limits |
| `apps/backend/src/db/schema/agentActions.ts` | Extend `LeadGenerationConfig` with `webhookUrl` / `webhookSecret` |
| `apps/backend/src/db/schema/conversations.ts` | Add `handoffStatus` + `assignedTo` for inbox feature |

---

## Verification Checklist

| Feature | Test | Status |
|---------|------|--------|
| PDF Upload | Upload PDF with known content → train → ask PDF-specific question → verify correct answer | ✅ Shipped |
| URL Crawl | Add a public URL → wait for `indexed` status → ask question from that page → verify answer | ✅ Shipped |
| Lead Webhook | Configure a requestbin URL → trigger lead capture in widget → verify POST received with valid HMAC | Pending |
| Email Alerts | Trigger fallback N times → verify batched alert email received with conversation link | Pending |
| Export | Click export on conversations page → verify CSV with correct headers and all rows | Pending |
| REST API | Create API key in dashboard → `POST /v1/chat/{channelId}` with Bearer token → verify chat response | Pending |
| Human Handoff | Trigger "Talk to a human" in widget → verify conversation appears in Inbox → reply from dashboard → verify message in widget | Pending |
| Instagram | Send DM to connected Instagram account → verify response routed through correct agent | Pending |
| KB Gaps | Let agent hit fallback 10+ times → run suggestions job → verify Gaps tab shows missed questions + AI-drafted answers | Pending |
