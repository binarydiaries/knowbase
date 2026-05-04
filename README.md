# Agenvik

**Agenvik** (formerly KnowBase) is a SaaS platform for building AI-powered chatbots with multi-channel support — web, WhatsApp, and Slack. Connect your knowledge base, configure your agent, and embed it anywhere.

## Features

- **Multi-channel chatbots** — Deploy to web widget, WhatsApp, and Slack from a single dashboard
- **RAG pipeline** — Upload documents; the platform chunks, embeds, and retrieves context automatically
- **Lead generation** — Agents can capture contact info through natural conversation
- **Analytics** — Message volume, sentiment, top topics, usage cost tracking
- **Subscription billing** — Free / Starter / Growth / Pro tiers via Razorpay
- **Rich editor** — TipTap-based editor for agent behaviour/system prompts
- **Dark mode** — Full dark mode support across the dashboard

## Monorepo Structure

This is a **Turborepo** monorepo managed with **Bun workspaces**.

```
apps/
  backend/    REST API server (Elysia + Bun) + BullMQ worker
  dashboard/  Admin UI — agent management, analytics, billing
  client/     Embeddable customer-facing chat widget
  landing/    Marketing site
  embed/      Widget distribution bundle
  docs/       Mintlify documentation site
packages/
  ui/         Shared React component library (@knowbase/ui)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun 1.2.12 |
| API framework | Elysia 1.4.x |
| Database | PostgreSQL + Drizzle ORM |
| Cache / Queue | Redis + BullMQ |
| AI | OpenAI via Vercel AI SDK |
| Auth | Clerk |
| Payments | Razorpay |
| Email | Resend |
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS 4.x |
| State | Zustand + TanStack Query |
| Routing | TanStack Router (dashboard), React Router 7 (landing) |
| Linter/Formatter | Biome 2.x |
| Type checker | TypeScript 5.9 |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.2.12
- Node.js ≥ 22
- PostgreSQL
- Redis

### Install dependencies

```bash
bun install
```

### Configure environment

Copy the example env files for each app you want to run:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/dashboard/.env.example apps/dashboard/.env
cp apps/client/.env.example apps/client/.env
```

Fill in at minimum: `DATABASE_URL`, `REDIS_URL`, `OPENAI_API_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.

### Run database migrations

```bash
cd apps/backend
bun run db:migrate
```

### Start development servers

```bash
# All apps
bun run dev

# Single app
bun run dev --filter=dashboard
```

## Common Commands

```bash
bun run build          # Build all apps
bun run lint           # Biome lint check
bun run lint:fix       # Biome lint + auto-fix
bun run check-types    # TypeScript type-check
```

## Docker

The backend ships two production Dockerfiles:

```bash
# API server
docker build -f apps/backend/Dockerfile -t agenvik-api .

# BullMQ worker
docker build -f apps/backend/Worker.Dockerfile -t agenvik-worker .
```

## Contributing

See `apps/docs/CONTRIBUTING.md` for writing and development guidelines.

For AI assistants working in this repository, refer to `CLAUDE.md` for architecture details, module patterns, and code conventions.
