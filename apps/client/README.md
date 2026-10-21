# Agenvik chat client

The React chat client is the customer-facing conversation UI loaded inside the embed loader's iframe. It uses the Vercel AI SDK for streamed responses and the backend's `/chatv2` API.

## Run locally

Follow the [root setup guide](../../README.md#run-locally), set `VITE_API_BASE=http://localhost:3000` in `apps/client/.env`, and run from the repository root:

```bash
bun run --cwd apps/client dev
```

The development client runs at `http://localhost:4000`. Use a configured web channel and the [embed loader](../embed/README.md) to test the complete page-to-iframe flow.

```bash
bun run build:client   # TypeScript checking and production build
```

## Source map

- `src/widgets`: chat interfaces.
- `src/services/chat.ts`: backend chat client.
- `src/hooks/useQueryParams.ts`: iframe query configuration.
- `src/utils/chatError.ts`: user-facing chat error handling.

Use synthetic conversations when testing or taking screenshots. Check streaming, error states, long messages, and small viewport sizes when changing the chat interface. See [CONTRIBUTING.md](../../CONTRIBUTING.md).
