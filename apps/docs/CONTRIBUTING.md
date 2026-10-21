# Contribute to Agenvik documentation

Product guides use Mintlify MDX. Start with the [repository contribution guide](../../CONTRIBUTING.md) for the development workflow and community expectations.

## Make a change

1. Create a branch or fork the repository.
2. Edit the relevant MDX page, or add a page and register it in `docs.json`.
3. Run `mint dev` from `apps/docs` and review the page in the browser.
4. Run `mint broken-links` and check navigation, code samples, and images.
5. Open a pull request explaining the user-facing change.

The docs preview normally uses port 3000, which is also the backend API's default. Run one at a time or configure a different preview port.

## Writing guidelines

- Address the reader as "you" and use active voice.
- Lead with the task the reader wants to complete.
- Use **bold** for UI labels and backticks for commands, paths, and configuration keys.
- Use consistent terms: agent, knowledge source, channel, conversation, and workspace.
- Distinguish hosted product instructions from local development and deployment instructions.
- Explain provider setup, feature flags, or plan requirements where they affect a task.
- Use synthetic data in examples and screenshots; remove credentials and customer content.

Keep guides focused, preserve working links, and verify installation snippets against the embed implementation. Report vulnerabilities privately through [SECURITY.md](../../SECURITY.md).
