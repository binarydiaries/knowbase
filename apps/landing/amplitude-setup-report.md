<wizard-report>
# Amplitude post-wizard report

The wizard has completed a full Amplitude integration for the Agenvik landing site (`apps/landing`), an Astro static site (SSG).

## What was changed

| File | Change |
|------|--------|
| `src/components/amplitude.astro` | **Created** — initialises `@amplitude/unified` via `initAll()` with full autocapture and Session Replay. Exposes `window.amplitude` for inline scripts. |
| `src/layouts/Layout.astro` | **Updated** — imports and renders `<Amplitude />` inside `<head>` on every page. |
| `src/env.d.ts` | **Created** — TypeScript declaration for `window.amplitude`. |
| `src/components/Header.astro` | **Updated** — tracks `Get Started Clicked` (source: header) and `Book Demo Clicked` (source: header). |
| `src/components/HeroSection.astro` | **Updated** — tracks `Get Started Clicked` (source: hero) and `Book Demo Clicked` (source: hero). |
| `src/components/PricingSection.astro` | **Updated** — tracks `Get Started Clicked` (source: pricing, plan_name) via event delegation on the dynamically-rendered pricing grid. |
| `src/pages/book-demo.astro` | **Updated** — tracks `Demo Requested` on successful API submission and `Demo Request Failed` on validation errors or API errors. |
| `package.json` | **Updated** — `@amplitude/unified` added as a dependency. |

## Instrumented events

| Event | Description | File |
|-------|-------------|------|
| `Get Started Clicked` | User clicked a "Get Started" CTA — `source` property distinguishes header / hero / pricing. `plan_name` included when clicked from a pricing card. | `Header.astro`, `HeroSection.astro`, `PricingSection.astro` |
| `Book Demo Clicked` | User clicked "Book a Demo" — `source` distinguishes header vs hero. | `Header.astro`, `HeroSection.astro` |
| `Demo Requested` | User successfully submitted the demo request form. Properties: `category`, `company`. | `book-demo.astro` |
| `Demo Request Failed` | Demo form submission failed. Properties: `error_reason` (validation \| api_error), `fields_with_errors`. | `book-demo.astro` |

## Autocapture (no extra code needed)

The Unified SDK with full autocapture is enabled. The following data is collected automatically:

- **Page views** — `[Amplitude] Page Viewed` on every page load and navigation
- **Sessions** — `[Amplitude] Start Session` / `[Amplitude] End Session`
- **Form interactions** — `[Amplitude] Form Started` / `[Amplitude] Form Submitted`
- **Element clicks** — `[Amplitude] Element Clicked` on all interactive elements
- **Frustration signals** — rage clicks, dead clicks
- **Web vitals** — LCP, INP, CLS reported on page hide
- **Network requests** — XHR / fetch events
- **Attribution** — UTM params and referrer captured on session start

## Analytics dashboard

A dashboard plan has been saved and will be created automatically by `amplitude-wizard dashboard` once events start ingesting. The planned charts are:

| Chart | Type | Event |
|-------|------|-------|
| CTA Conversion Funnel | Funnel | Get Started Clicked |
| Get Started Clicks by Source | Bar | Get Started Clicked |
| Demo Requests Over Time | Line | Demo Requested |
| Demo Booking Funnel | Funnel | Book Demo Clicked → Demo Requested |
| Demo Request Failures | Bar | Demo Request Failed |

Run `amplitude-wizard dashboard` after deploying and triggering at least one of these events to build the dashboard.

## Next steps

### Environment variable configuration

`PUBLIC_AMPLITUDE_API_KEY` is already set in `apps/landing/.env`. For production deployments, ensure this variable is set in your hosting platform's environment settings (Netlify, Vercel, or your CI pipeline). The `PUBLIC_` prefix exposes it to the browser bundle at build time — it must be present during `astro build`.

No `AMPLITUDE_SERVER_URL` is needed for this static site; the Unified SDK defaults to the correct US endpoint.

### Agent skill

The `.claude/skills/` folder contains the wizard skill context used during this run. You can use it for further instrumentation with Claude Code.
</wizard-report>
