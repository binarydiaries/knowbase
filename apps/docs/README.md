# Agenvik product documentation

This Mintlify site contains product guides and developer instructions, published at [agenvik.com/docs](https://agenvik.com/docs). Repository setup and source contribution guidance live in the [root README](../../README.md) and [contribution guide](../../CONTRIBUTING.md).

## Preview and check links

With the Mintlify CLI available, run from this directory:

```bash
mint dev
mint broken-links
```

Mintlify normally uses port 3000. Stop the backend API or choose another available port when previewing both locally. See the [Mintlify CLI documentation](https://www.mintlify.com/docs/installation) for installation and command options.

## Structure

- `docs.json`: navigation, branding, and site configuration.
- `index.mdx`: documentation landing page.
- `user-guides`: agent setup, conversations, analytics, and workspace guides.
- `developer-guide`: installation and embed configuration.
- `help-and-support`: support and troubleshooting.
- `demo-data`: example knowledge sources for demonstrations.
- `images`: documentation images; use synthetic data in new screenshots.

Follow the [documentation contribution guide](CONTRIBUTING.md) when adding pages. The original Mintlify starter kit's [MIT notice](LICENSE) is retained.
