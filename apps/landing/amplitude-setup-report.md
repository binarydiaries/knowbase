<wizard-report>
# Amplitude post-wizard report

The wizard has completed a deep integration of Amplitude analytics into the **Agenvik landing page** (`apps/landing`). The `@amplitude/unified` SDK (v1.1.0) was installed and initialized with autocapture enabled, automatically tracking page views, element clicks, form interactions, and sessions from the moment users visit the site.

## Integration summary

- **SDK**: `@amplitude/unified` — unified browser SDK with autocapture
- **Init location**: `src/lib/amplitude.ts` (imported as a side-effect in `src/main.tsx`)
- **API key**: loaded from `VITE_AMPLITUDE_API_KEY` env var (set in `.env.local`)
- **Autocapture**: enabled — captures `[Amplitude] Page Viewed`, `[Amplitude] Element Clicked`, `[Amplitude] Form Started/Submitted` automatically

## Instrumented events

| Event | Description | File |
|---|---|---|
| `Get Started Clicked` | User clicks any Get Started CTA button on the landing page | `src/components/GetStartedButton.tsx` |
| `Pricing Plan Viewed` | Pricing plans finish loading and become visible to the user | `src/Sections/PricingSection.tsx` |
| `FAQ Item Expanded` | User expands a FAQ accordion item to read the answer | `src/Sections/FAQSection.tsx` |
| `Contact Us Clicked` | User clicks the Contact Us link to open their email client | `src/Sections/HeroSection.tsx` |

### Event properties

- **Get Started Clicked**: `source` (`hero_nav` | `hero_body` | `pricing` | `how_it_works`), `plan_name` (pricing CTA only), `is_signed_in`
- **Pricing Plan Viewed**: `plan_count`, `plan_names[]`
- **FAQ Item Expanded**: `question`, `question_index`
- **Contact Us Clicked**: `source`

## Analytics dashboard

We've built a dashboard and 4 charts tied to your landing page flows:

**Dashboard**: [Agenvik Landing Analytics — 2026](https://app.amplitude.com/analytics/agenvik/dashboard/0u9cx59k)

| Chart | Type | URL |
|---|---|---|
| Top Pages by Volume (Autocapture) | Line | [Open](https://app.amplitude.com/analytics/agenvik/chart/38niy86x) |
| Top Clicked Elements (Autocapture) | Line | [Open](https://app.amplitude.com/analytics/agenvik/chart/nkt5cjwv) |
| Daily Active Visitors | Line | [Open](https://app.amplitude.com/analytics/agenvik/chart/w09glj44) |
| Visitor Retention (Return to Site) | Retention | [Open](https://app.amplitude.com/analytics/agenvik/chart/13izoptm) |

The following charts use Autocapture and will populate as soon as any user visits the app (no additional instrumentation required):
- **Top Pages by Volume** — shows which landing page sections get the most traffic
- **Top Clicked Elements** — shows which CTA text and links users click most
- **Daily Active Visitors** — total unique visitors per day

The following charts rely on custom events and will populate once those flows are triggered:
- **Visitor Retention** — tracks return visits; populates once real users visit the deployed app

## Next steps

### Environment variable configuration

`VITE_AMPLITUDE_API_KEY` has been set in `.env.local` (git-ignored). Before going to production, add this variable to your deployment platform:

- **Docker / self-hosted**: Add `VITE_AMPLITUDE_API_KEY=<your-amplitude-api-key>` to your container environment or CI/CD secrets
- **Vercel**: Settings → Environment Variables → add `VITE_AMPLITUDE_API_KEY`
- **Netlify**: Site settings → Build & deploy → Environment → add `VITE_AMPLITUDE_API_KEY`

Note: this is a **public browser key** (Amplitude's design) — it is safe to commit to environment files, but using `.env.local` keeps it out of the tracked `.env` template.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/`. You can use this context for further agent development when using Claude Code.

</wizard-report>
