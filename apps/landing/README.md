# Agenvik website

The marketing website and blog at [agenvik.com](https://agenvik.com) use Astro, MDX, and Tailwind CSS. This app can run independently of the dashboard and backend.

## Run locally

From the repository root:

```bash
bun install --frozen-lockfile
cp apps/landing/.env.example apps/landing/.env
bun run --cwd apps/landing dev
```

Open `http://localhost:4321`. The example environment sets a local site URL and staging robots behavior. Set `LANDING_URL` to the canonical site origin for a production build, and configure `PUBLIC_APP_URL` and `PUBLIC_API_BASE` for your deployment.

Analytics and reCAPTCHA need their own public keys. The chat widget needs `PUBLIC_EMBED_URL` and `PUBLIC_CHANNEL_ID`; these can remain unset when you are working only on site content. Every `PUBLIC_` value can be included in generated pages, so use public configuration only.

```bash
bun run build:landing
bun run --cwd apps/landing preview
```

Astro generates static output in `dist/`. Review the generated site and environment settings before publishing it.

## Content and layout

- `src/pages`: site routes.
- `src/components`: shared header, footer, and page sections.
- `src/layouts`: metadata and shared page layouts.
- `src/content/blog`: MDX posts.
- `src/data/project.ts`: canonical GitHub repository link used by the header and footer.
- `public`: static assets.

Use descriptive link text, keyboard-accessible interactions, and meaningful alternative text. Check desktop and mobile layouts when changing navigation. See [CONTRIBUTING.md](../../CONTRIBUTING.md).
