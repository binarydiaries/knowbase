# Agenvik embed loader

This small JavaScript bundle creates the launcher and iframe that load the [Agenvik chat client](../client/README.md). It reads `window.AgenvikChat` before starting.

## Add it to a website

```html
<script>
  window.AgenvikChat = {
    channelId: "YOUR_WEB_CHANNEL_ID",
    primaryColor: "#301B69"
  };
</script>
<script src="https://embed.agenvik.com/embed.js" defer></script>
```

`channelId` is required. `primaryColor` is optional. Configure the widget before loading the script, and use the ID of a web channel created in your dashboard.

## Build and serve locally

From the repository root:

```bash
cp apps/embed/.env.example apps/embed/.env
# Set VITE_CLIENT_BASE=http://localhost:4000 in the copied file.
bun run build:embed
bun run --cwd apps/embed dev
```

The preview server serves the built bundle at `http://localhost:4173/embed.js`. The `dev` command uses Vite preview, so rebuild after making changes. Run the chat client and API separately as described in the [local setup guide](../../README.md#run-locally).

For your own deployment, set `VITE_CLIENT_BASE` to your hosted chat-client origin before building, publish `dist/embed.js`, and use your loader URL in the installation snippet. Avoid putting server credentials in the embed configuration or build environment variables prefixed with `VITE_`.

## Source map

`src/config.ts` reads page configuration; `launcher.ts` and `iframe.ts` create the UI; `listener.ts` handles page/iframe messages; `index.ts` initializes the loader. See the [installation guide](https://agenvik.com/docs/developer-guide/install-web-widget) for product usage.
