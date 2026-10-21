# Contributing to Agenvik

Contributions to Agenvik are welcome: bug fixes, documentation, accessibility improvements, integrations, and focused tests all help. For substantial changes, open an issue first so maintainers can discuss the approach with you.

## Get started

1. Fork the repository and create a branch from `main`.
2. Follow the [local setup guide](README.md#run-locally).
3. Read the README in the app you are changing.
4. Keep your change focused and explain its purpose in your pull request.

Use Bun workspaces from the repository root. Keep dependency changes in the root `bun.lock`; do not create npm or Yarn lockfiles. Use synthetic documents, accounts, and conversations when developing or taking screenshots.

## Code conventions

- Use TypeScript and the existing patterns in the app you change.
- Backend modules separate routes, services, and Zod models. Validate input at the route boundary.
- Derive organization identity from the authenticated session. Check ownership before reading or modifying organization resources, including background jobs and conversation state.
- Keep credentials on the server. Variables prefixed with `VITE_` or `PUBLIC_` are browser-visible configuration.
- Use the shared `@knowbase/ui` package for reusable React components.
- Update setup instructions and example environment files when your change introduces configuration.

## Validate your change

Run the checks relevant to the files you changed:

```bash
# Run from the repository root
bun run lint
bun run build:dashboard
bun run build:client
bun run build:landing
bun run build:embed
```

The dashboard and client builds include TypeScript checking. The backend currently has a placeholder `test` script, and the root `check-types` task has no workspace implementations. Do not treat either as a passing test suite. For backend changes, describe the tests or manual verification you performed and their limitations.

Add regression tests when they demonstrate a meaningful behavior or protect a security boundary. Do not change live accounts, production data, or paid service configuration to validate a contribution. For UI changes, include screenshots at desktop and mobile sizes using synthetic data. Report pre-existing check failures separately from failures introduced by your change.

## Pull requests

Explain the problem, the resulting behavior, and how you verified it. Link the related issue, describe new configuration or migrations, and flag any compatibility changes. Never include real API keys, customer data, private logs, or database exports in an issue, pull request, fixture, or screenshot.

By submitting a contribution, you agree that it may be distributed under the project's [MIT license](LICENSE). Preserve existing third-party copyright and license notices.

## Documentation

Product guides live in [`apps/docs`](apps/docs); engineering setup and architecture notes belong in this repository. See the [documentation contribution guide](apps/docs/CONTRIBUTING.md) for the Mintlify workflow.

## Security and community

Follow the [code of conduct](CODE_OF_CONDUCT.md). Report vulnerabilities privately using [SECURITY.md](SECURITY.md), rather than opening a public issue.
