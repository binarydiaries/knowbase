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

The `test` script is currently a placeholder. There is no complete backend test suite; describe how changes were verified in your pull request.

## Deployment notes

The existing Dockerfiles expect `apps/backend` as their build context, rather than the monorepo root. The API Dockerfile currently accepts a database URL through a build argument and environment variable, then runs migrations at build time. Use development credentials only: credentials can remain in intermediate build metadata, so move migrations to a separate release step before using sensitive credentials. The worker Dockerfile currently starts the indexing worker alone, while `src/queue/worker.ts` loads indexing and email workers. Review and adapt these files for your deployment.

Use development credentials when working locally. Review [SECURITY.md](../../SECURITY.md) before exposing an installation to users.
