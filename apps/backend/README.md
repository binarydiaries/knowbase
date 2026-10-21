# Agenvik backend

The Elysia API serves agent configuration, chat, conversations, knowledge sources, integrations, analytics, and billing. LangGraph orchestrates chat turns; BullMQ workers handle indexing and email.

## Local development

Follow the [root setup guide](../../README.md#run-locally) to configure PostgreSQL with pgvector, Redis, OpenAI, Clerk organizations, and the encryption key. From the repository root:

```bash
bun run --cwd apps/backend db:migrate
bun run --cwd apps/backend dev
```

The API defaults to `http://localhost:3000`, with generated OpenAPI documentation at `/docs`. The development command starts both the API and workers. To run them independently, use `dev:app` and `dev:worker` in separate terminals.

## Source map

- `src/server.ts`: application configuration and route registration.
- `src/index.ts`: production cluster entry point.
- `src/modules`: feature routes, services, models, and the conversation graph.
- `src/db/schema` and `drizzle`: database definitions and migrations.
- `src/queue/worker.ts`: indexing and email worker entry point.
- `src/utils/env.utils.ts`: required startup configuration.

## Commands

Run from `apps/backend`:

```bash
bun run dev:app       # API with file watching
bun run dev:worker    # Background workers with file watching
bun run db:generate   # Generate migrations after schema changes
bun run db:migrate    # Apply migrations to the configured database
bun run studio       # Inspect your development database
bun run build        # Compile API and worker binaries
```

## Security regression tests

Use **disposable** PostgreSQL with pgvector and Redis 6.2+ instances. These tests write synthetic rows, checkpoint tables, and expiring Redis keys. They do not call OpenAI, Clerk, Meta, or Slack.

```bash
export TEST_DATABASE_URL=postgresql://postgres:local-password@localhost:5432/agenvik_test
export TEST_REDIS_URL=redis://localhost:6379/1
DATABASE_URL="$TEST_DATABASE_URL" bun run db:migrate
bun run test
bun run check-types
```

The suite covers visitor token tampering and expiry, cross-organization/agent/channel checkpoints and database writes, restored-agent authorization, raw-byte webhook signatures, and browser-bound, single-use Slack OAuth state. It also boots the complete API with synthetic provider keys and checks nine HTTP authorization and response boundaries. External provider happy paths require separate development-account tests.

## Deployment notes

Build from the **repository root**, using the root `bun.lock`:

```bash
docker build -f apps/backend/Dockerfile -t agenvik-api .
docker build -f apps/backend/Worker.Dockerfile -t agenvik-worker .
```

Images contain compiled binaries and run as a non-root user. Both indexing and email workers start from the worker image. Never pass database URLs or provider secrets as build arguments. Inject backend secrets only at runtime. Run pending migrations once as a separate release job with runtime database access:

```bash
bun run --cwd apps/backend db:release
```

Deploy the API and chat client together: the widget now obtains a signed conversation capability from `POST /chatv2/session` before sending messages. Old caller-selected conversation IDs are rejected. Existing transcripts remain available to their owners; legacy checkpoints are deliberately not resumed. Reload already-open widgets after the rollout.

Set `WHATSAPP_APP_SECRET` to the Meta app secret before enabling inbound WhatsApp. Unsigned requests and missing secrets fail closed. Slack requires `SLACK_SIGNING_SECRET`, Redis 6.2+, and an HTTPS `API_BASE`; callbacks use an HTTP-only, secure, same-site cookie and a ten-minute authorization state.

See [the deployment guide](../../docs/deployment.md) for Dokploy build contexts, public frontend build arguments, release ordering, and verification.
