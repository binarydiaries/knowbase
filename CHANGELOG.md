# Changelog

All notable changes to this project will be documented in this file.

---

## [0.5.0] — 2026-05-08

### Added
- **Mintlify Docs** — Integrated Mintlify documentation site; added proxy route on the landing page for seamless docs access.
- **Social Media Presence** — Added official social accounts (X/Twitter, LinkedIn, etc.) wired up to footer links; created a 30-day content calendar.
- **OG / Social Preview** — Branded Open Graph preview image for social sharing; compressed and expanded title/description metadata.
- **Notification Tone & Mute** — Chat widget plays a soft Web Audio API tone on new messages; mute/unmute toggle persists preference to `localStorage`.
- **Suggestion Questions** — Configurable suggestion questions for the web chat widget (dashboard + client).
- **Amplitude Analytics** — Integrated Amplitude for product analytics in the dashboard.
- **Bubble Color Customization** — Per-chatbot bubble color setting for the embedded chat widget.
- **Embedding Cost Tracking** — Records per-request costs for `text-embedding-3-small` in `aiCostEvents`.
- **TipTap Rich Editor** — Migrated `RichEditor` from Lexical to TipTap with a redesigned `EditorToolbar` and updated styles.
- **Dark Mode** — Full dark mode support across the dashboard.
- **Rebranding** — Project rebranded to **Agenvik** with SEO improvements and semantic HTML overhaul on the landing page.
- **CLAUDE.md** — Added comprehensive codebase documentation for AI-assisted development.

### Changed
- **RAG Indexing & Retrieval** — Improved indexing pipeline in `indexing/service.ts` and updated `MarkdownHeaderTextSplitter` for better chunk quality.
- **Sentry** — Externalised Sentry configuration; added error boundary and user identification in the dashboard.
- **Chat header** — Replaced individual mute/new-chat buttons with a 3-dot overflow menu; subtitle is now truncated.

### Removed
- **PostHog** — Removed PostHog analytics integration in favour of Amplitude.
- **Clerk from landing** — Removed Clerk dependency from the landing page to reduce bundle size.

---

## [0.4.0] — 2026-04-21

### Added
- **Lead Generation (Gating)** — Lead Generation Actions restricted to Starter plan and above.
- **Admin Cost Analysis** — New admin panel view for tracking per-chatbot LLM costs.
- **Privacy Policy & Terms pages** — Added `/privacy` and `/terms` pages to the landing site.
- **Clerk Auth + Live Billing** — Integrated Clerk authentication and live billing plans on the landing page.

### Fixed
- **Landing page scroll** — Replaced JavaScript-driven scroll with native hash-based navigation for anchor links.

---

## [0.3.0] — 2026-04-20

### Added
- **Actions System — Lead Generation MVP** — Extensible "Actions" framework enabling chatbots to capture contact information through natural conversation.
  - New `chatbot_actions` and `leads` DB tables (Drizzle schema + relations).
  - `ActionService` / `LeadService` with CRUD and paginated list endpoints.
  - REST routes: `GET/POST/PATCH/DELETE /chatbot-actions` and `GET /leads`.
  - AI SDK `capture_lead` tool integrated into `ChatService` for both web and WhatsApp channels; leads stored on `onFinish`.
  - Conversation history (last 6 messages) passed to the LLM when actions are active, enabling multi-turn lead collection.
  - `buildActionsPrompt()` helper keeps tool use from conflicting with knowledge-base-only rules.
  - **Dashboard** — `ActionsCard` widget on the chatbot detail page with toggle and per-action-type configuration.
- **Docker support** — Added Docker configuration for the landing app.

---

## [0.2.0] — 2026-04-21

### Added
- **Chatbot UX improvements** — Auto-scroll to latest message, "New Chat" button, and keyboard accessibility enhancements.

---

## [0.1.0] — Earlier

### Added
- Initial monorepo setup with Turborepo, Bun workspaces, and shared `packages/ui`.
- Backend API with Drizzle ORM, Hono, and AI SDK streaming.
- Dashboard app with chatbot management.
- Landing page with pricing and feature sections.
