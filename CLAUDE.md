# CLAUDE.md — Agenvik (Knowbase)

## Project Overview

**Agenvik** (formerly KnowBase) is a SaaS platform for building AI-powered chatbots with multi-channel support (web, WhatsApp, Slack). It is a **Turborepo monorepo** managed with **Bun workspaces**.

### Apps

| App | Path | Purpose |
|-----|------|---------|
| `backend` | `apps/backend/` | REST API server (Elysia + Bun) + BullMQ worker |
| `dashboard` | `apps/dashboard/` | Admin UI — agent management, analytics, billing |
| `client` | `apps/client/` | Customer-facing embeddable chat widget |
| `landing` | `apps/landing/` | Marketing site |
| `embed` | `apps/embed/` | Embeddable widget distribution bundle |
| `docs` | `apps/docs/` | Mintlify documentation site |

### Shared Packages

| Package | Path | Purpose |
|---------|------|---------|
| `@knowbase/ui` | `packages/ui/` | Shared React component library (Radix UI + TipTap + Tailwind 4) |

---

## Tech Stack

### Backend (`apps/backend`)
- **Runtime/framework**: Bun 1.2.12 + Elysia 1.4.x
- **Database**: PostgreSQL via Drizzle ORM (beta)
- **Cache/Queue**: Redis + BullMQ
- **Auth**: Clerk (`elysia-clerk`)
- **AI**: OpenAI via Vercel AI SDK (`@ai-sdk/openai`, `ai`)
- **Payments**: Razorpay
- **Email**: Resend
- **Validation**: Zod 4.x
- **ID generation**: `@paralleldrive/cuid2`

### Frontend (dashboard / client / landing)
- **Framework**: React 19 + Vite (rolldown-vite)
- **Styling**: Tailwind CSS 4.x (primary color `#301B69`)
- **UI primitives**: Radix UI via `@knowbase/ui`
- **Routing**: TanStack Router (dashboard), React Router DOM 7 (landing)
- **State**: Zustand 5 (dashboard)
- **Server state**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Rich editor**: TipTap
- **Auth**: Clerk (`@clerk/clerk-react`)
- **Charts**: Recharts

### Monorepo tooling
- **Monorepo**: Turborepo 2.7.2
- **Package manager**: Bun 1.2.12 (required — do not use npm/yarn/pnpm)
- **Linter/formatter**: Biome 2.3.11 (replaces ESLint + Prettier)
- **Type checker**: TypeScript 5.9.2

---

## Development Workflow

### Prerequisites
- Bun ≥ 1.2.12
- Node.js ≥ 22
- PostgreSQL (running locally or via Docker)
- Redis (running locally or via Docker)

### Environment setup

Copy `.env.example` in each app you need to run:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/dashboard/.env.example apps/dashboard/.env
cp apps/client/.env.example apps/client/.env
cp apps/landing/.env.example apps/landing/.env
cp apps/embed/.env.example apps/embed/.env
```

### Common commands (run from repo root)

```bash
bun run dev               # Start all apps in watch mode
bun run dev --filter=dashboard  # Start a single app
bun run build             # Build all apps
bun run build:dashboard   # Build single app
bun run lint              # Biome check (all files)
bun run lint:fix          # Biome check + auto-fix
bun run check-types       # TypeScript type-check all apps
```

### Backend-specific commands (run from `apps/backend/`)

```bash
bun run dev               # Start API server + queue worker in parallel
bun run dev:app           # API server only (watch mode)
bun run dev:worker        # BullMQ worker only (watch mode)
bun run db:generate       # Generate a new Drizzle migration
bun run db:migrate        # Run pending migrations
bun run db:push           # Push schema changes directly (dev only)
bun run studio            # Open Drizzle Studio (database GUI)
```

---

## Backend Architecture (`apps/backend/`)

### Entry points
- `src/server.ts` — Elysia HTTP application; registers all modules and serves OpenAPI docs at `/docs`
- `src/queue/worker.ts` — BullMQ worker process for background jobs

### Module pattern

Each feature lives under `src/modules/<name>/` and follows this structure:

```
src/modules/agent/
├── agent.ts        # Elysia plugin with route definitions
├── service.ts      # Static abstract class with business logic
└── model.ts        # Zod schemas for request/response bodies
```

All service classes use **static methods**:

```typescript
export abstract class AgentService {
  static async create(data: CreateAgentInput) { ... }
  static async list({ orgId }: { orgId: string }) { ... }
}
```

### Multi-tenancy

Every query is scoped by `orgId` (Clerk organisation ID). All database tables include an indexed `orgId` column via shared column utilities in `src/utils/columns.utils.ts`.

### Database schema (`src/db/schema/`)

Key tables: `agents`, `channels`, `conversations`, `documents`, `embeddings`, `messages`, `behaviors`, `leads`, `whatsappConnections`, `slackConnections`, `orgSubscriptions`, `orgUsageDaily`, `orgUsageMonthly`, `agentActions`, `aiCostEvents`.

Primary keys use CUID2 (`createId()`). All tables have `createdAt`/`updatedAt` with timezone.

### RAG pipeline

1. Documents are stored via `document` module
2. `indexing` module chunks text (LangChain `TextSplitter`) and generates embeddings (`text-embedding-3-small`)
3. Embeddings stored in `embeddings` table as pgvector
4. `chat/context.ts` performs semantic search to build RAG context
5. `chat/service.ts` runs the LLM call with streamed response

### Background jobs

- `indexing.queue.ts` — document embedding jobs
- `email.queue.ts` — transactional emails via Resend

---

## Frontend Architecture

### Dashboard (`apps/dashboard/`)

- **Routing**: TanStack Router with file-based routes under `src/routes/`
  - `$agentId` = dynamic route param; `{-$conversationId}` = optional param
- **API client**: Auto-generated from the backend's OpenAPI spec; lives in `src/services/` — **never edit these files manually**
- **State stores** (`src/store/`): Zustand stores for channels, documents, behaviour, Slack/WhatsApp connections
- **Route tree** (`src/routeTree.gen.ts`): auto-generated by TanStack Router — **never edit manually**

### Client widget (`apps/client/`)

Standalone React SPA embedded in customer sites. Channel config loaded from URL query params via `src/hooks/useQueryParams.ts`. Chat messages stream from the backend.

### Landing page (`apps/landing/`)

Uses React Router DOM 7. Also uses **ESLint** (flat config) in addition to Biome — run `eslint .` if working in this app.

---

## Shared UI Library (`packages/ui/`)

Import components as:

```typescript
import { Button } from '@knowbase/ui/components/button';
import { RichEditor } from '@knowbase/ui/widgets/RichEditor';
```

Components use **CVA** (`class-variance-authority`) for variant styling. Dark mode is supported via `next-themes`. Never modify generated Tailwind output files.

---

## Code Conventions

### Formatting & linting (Biome)
- **Indent**: spaces (not tabs)
- **Quotes**: single quotes in JavaScript/TypeScript
- **Import organisation**: enforced automatically by Biome assist
- Run `bun run lint:fix` before committing to auto-fix formatting

### Auto-generated files — never edit
- `apps/dashboard/src/routeTree.gen.ts`
- `apps/dashboard/src/services/*`

### TypeScript
- Strict mode enabled
- Prefer `type` imports for types
- Use Zod schemas as the source of truth for API shapes

### No tests
There is currently no test suite. The backend `test` script is a placeholder.

---

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `OPENAI_API_KEY` | OpenAI API key for embeddings + LLM |
| `CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payment gateway |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signature |
| `RAZORPAY_PLAN_ID_*` | Plan IDs for each subscription tier |
| `RESEND_API_KEY` | Transactional email |
| `EMAIL_FROM` | Sender email address |
| `ADMIN_EMAILS` / `ADMIN_USER_IDS` | Comma-separated admin access list |
| `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` / `SLACK_SIGNING_SECRET` | Slack OAuth |
| `APP_URL` | Public URL of the deployed app |
| `LEAD_GENERATION_ENABLED` | Feature flag for lead capture |
| `PAYMENT_PROVIDER` | `razorpay` (currently only supported) |

### Dashboard (`apps/dashboard/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE` | Backend API base URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `VITE_EMBED_BASE` | Embed widget base URL |
| `VITE_FACEBOOK_APP_ID` | Facebook app for Meta integrations |
| `VITE_ADMIN_EMAILS` | Comma-separated admin emails |
| `VITE_SLACK_ENABLED` | Feature flag |
| `VITE_LEAD_GENERATION_ENABLED` | Feature flag |

### Client & Landing

`VITE_API_BASE` and `VITE_CLERK_PUBLISHABLE_KEY` (landing only). See each app's `.env.example`.

---

## Feature Flags

Feature flags are managed at runtime via the admin dashboard (**Admin → System → Feature Flags**) and support per-organisation overrides.

**Backend**: use `FeatureFlagService.isEnabled(flag, orgId)` in route handlers.  
**Dashboard**: use the `useFeatureFlags()` hook (`src/hooks/useFeatureFlags.ts`) and read `flags?.['flag_key']`.

| Flag key | Default | Purpose |
|----------|---------|---------|
| `url_crawling` | `false` | Enables URL knowledge sources. Gates `/documents/url/preview` and `/documents/url` (403 when off); hides "Website URL" in the knowledge-source dropdown. |
| `lead_generation` | `false` | Enables lead capture action type. Skips lead capture on the backend when off; hides the Lead Generation action card in the dashboard. |
| `whatsapp` | `false` | Shows WhatsApp integration in channel settings and integrations page. |
| `slack` | `false` | Shows Slack integration in channel settings and integrations page. |

When adding a new flag: create it in the admin panel, gate the backend route with `FeatureFlagService.isEnabled`, conditionally render UI via `useFeatureFlags()`, and add a row to this table and the README table.

---

## Git & Branch Conventions

| Aspect | Convention |
|--------|-----------|
| Main branch | `main` |
| Staging branch | `stage` |
| Feature branches | `claude/<description>-<taskId>` |
| Commit messages | Imperative mood; reference PR numbers (e.g., `#45`) |
| Merge strategy | Merge commits (not rebase) |

There are no pre-commit hooks or CI/CD pipelines currently configured.

---

## Docker

The backend ships two Dockerfiles (multi-stage Bun builds targeting distroless):

| File | Purpose |
|------|---------|
| `apps/backend/Dockerfile` | API server (`server` binary) |
| `apps/backend/Worker.Dockerfile` | BullMQ worker (`worker-server` binary) |

Database migrations run automatically during the Docker build step.

---

## gstack

Use the `/browse` skill from gstack for all web browsing. **Never use `mcp__claude-in-chrome__*` tools.**

Available gstack skills:

| Skill | Purpose |
|-------|---------|
| `/office-hours` | Async Q&A and coaching session |
| `/plan-ceo-review` | CEO-level plan review |
| `/plan-eng-review` | Engineering plan review |
| `/plan-design-review` | Design plan review |
| `/design-consultation` | Design consultation session |
| `/design-shotgun` | Rapid design exploration |
| `/design-html` | HTML/CSS design output |
| `/review` | Code review |
| `/ship` | Ship a feature end-to-end |
| `/land-and-deploy` | Land and deploy changes |
| `/canary` | Canary deployment |
| `/benchmark` | Performance benchmarking |
| `/browse` | Headless browser for web browsing and QA |
| `/connect-chrome` | Connect to a Chrome browser instance |
| `/qa` | Full QA pass |
| `/qa-only` | QA without setup steps |
| `/design-review` | Visual design review |
| `/setup-browser-cookies` | Configure browser cookies |
| `/setup-deploy` | Configure deployment pipeline |
| `/setup-gbrain` | Configure gbrain |
| `/retro` | Retrospective |
| `/investigate` | Investigate a bug or issue |
| `/document-release` | Document a release |
| `/document-generate` | Generate documentation |
| `/codex` | Codex agent task |
| `/cso` | CSO-level security review |
| `/autoplan` | Automatically generate a plan |
| `/plan-devex-review` | Developer experience plan review |
| `/devex-review` | Developer experience review |
| `/careful` | Careful/cautious mode for risky changes |
| `/freeze` | Freeze the codebase |
| `/guard` | Guard mode |
| `/unfreeze` | Unfreeze the codebase |
| `/gstack-upgrade` | Upgrade gstack |
| `/learn` | Learning and onboarding session |
