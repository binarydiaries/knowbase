# Agenvik dashboard

The React dashboard manages agents, knowledge sources, conversations, leads, integrations, analytics, subscriptions, and platform administration. It uses Vite, TanStack Router and Query, Clerk, Tailwind CSS, and the shared `@knowbase/ui` package.

## Run locally

Complete the [root setup guide](../../README.md#run-locally), then run from the repository root:

```bash
bun run --cwd apps/dashboard dev
```

Open `http://localhost:4001`. Configure `VITE_API_BASE` and `VITE_CLERK_PUBLISHABLE_KEY` in `.env`, and create or select a Clerk organization after signing in. The backend must use the matching Clerk instance.

```bash
bun run build:dashboard   # TypeScript checking and production build
```

## Source map

- `src/routes`: TanStack Router pages; `routeTree.gen.ts` is generated.
- `src/widgets`: feature UI, including agent configuration and integrations.
- `src/components`: dashboard components.
- `src/services`: generated API client; regenerate through `openapi-ts` when the backend schema changes.
- `src/hooks` and `src/store`: query hooks and client state.

The API generation configuration should point to your development API's OpenAPI schema. Do not regenerate against production with privileged credentials.

Variables beginning with `VITE_` can be exposed in browser bundles. Keep server credentials out of them. Platform admin access is enforced by backend configuration; a frontend setting alone does not grant access.

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for code and verification guidelines.
