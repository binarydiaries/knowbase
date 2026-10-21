# Deploy Agenvik

Use Bun 1.4.3, PostgreSQL with pgvector, Redis 6.2+, and development provider accounts when rehearsing a release. The root workspace lockfile is the source of dependency versions. Container builds use it with lifecycle scripts disabled.

## Dokploy applications

Set the build context to the repository root (`.`) for every Dockerfile:

| Service | Dockerfile | Container port |
| --- | --- | --- |
| API | `apps/backend/Dockerfile` | 3000 |
| Indexing and email workers | `apps/backend/Worker.Dockerfile` | None |
| Dashboard | `apps/dashboard/Dockerfile` | 3000 |
| Chat client | `apps/client/Dockerfile` | 3000 |
| Marketing website | `apps/landing/Dockerfile` | 8080 |

Set API and worker secrets through Dokploy's runtime environment. Do not pass `DATABASE_URL`, provider keys, or encryption keys to image builds. The build context excludes environment files, credentials, backups, Git history, and local outputs.

Frontend settings are public build arguments. Pass the names listed as `ARG` in each Dockerfile, using your own HTTPS service URLs. In particular, configure `VITE_API_BASE` for dashboard/client, `VITE_CLERK_PUBLISHABLE_KEY` for dashboard, and `LANDING_URL` plus the relevant `PUBLIC_*` settings for the marketing website. Frontend environment changes require a rebuild. Never use a `VITE_` or `PUBLIC_` name for a secret. Sentry source-map uploads, when used outside these images, take `SENTRY_AUTH_TOKEN` as build-only configuration.

## Release order

1. Back up the production database using your established backup process.
2. Build and verify the API, worker, client, dashboard, and website from the same reviewed commit, without production secrets in the build environment.
3. Run `bun run --cwd apps/backend db:release` once in a release job with runtime database access. The images do not run migrations. A fresh database needs permission to enable pgvector; checkpoint initialization also needs table-creation permission.
4. Deploy the API and chat client together, then the worker, dashboard, and marketing website. Confirm Dokploy reports the expected Git revision and healthy running services. Reload existing chat widgets after the capability-token change.
5. Verify the website's desktop/mobile GitHub links, public web chat, authenticated dashboard access, and background indexing. Verify provider callbacks with development integrations before directing live events to a changed deployment.

## Security compatibility

- Web chat obtains a signed visitor capability from `POST /chatv2/session`. The caller cannot choose a checkpoint ID. Capabilities expire after 24 hours and are scoped to the organization, agent, and web channel. Starting a new chat obtains a new capability.
- Integration and preview checkpoint IDs include organization, agent, channel, ingress type, and external identity. Legacy checkpoints are not resumed. Existing conversation records remain available to their owners.
- Configure Meta's `WHATSAPP_APP_SECRET` and Slack's `SLACK_SIGNING_SECRET`. Inbound signatures fail closed. Redis deduplicates inbound provider event IDs for 24 hours.
- Slack authorization uses Redis 6.2+ and an expiring, single-use state bound to the initiating browser and user. Use HTTPS for `API_BASE` and the registered callback URL.
- Keep `TOKEN_ENCRYPTION_KEY` stable for the database. Rotating it requires a plan for encrypted integration tokens and invalidates outstanding web capabilities.

If a release fails verification, keep the repository private and restore the last working application images while investigating. Do not undo database migrations without reviewing their effect on stored data.
