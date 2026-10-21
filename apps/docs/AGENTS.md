# Agenvik documentation instructions

This directory contains Agenvik's Mintlify product documentation. Read `README.md`, `CONTRIBUTING.md`, and `docs.json` before changing the documentation structure.

## Format and terminology

Pages are MDX files with YAML frontmatter. Use the terms agent, knowledge source, channel, conversation, and workspace consistently. Use active voice, address the reader as "you," and keep instructions task-focused. Use sentence case for headings, bold for UI labels, and code formatting for paths and configuration keys.

## Content boundaries

Document the product behavior supported by the implementation. Explain relevant provider setup, feature flags, and plan restrictions. Distinguish hosted product workflows from repository development setup. Keep internal admin procedures in engineering documentation unless the task explicitly requests them here.

Do not include real credentials, customer content, or personal information in examples or screenshots. Preserve third-party license notices.

## Validation

Preview changes with `mint dev` and check navigation with `mint broken-links` when the Mintlify CLI is available. Its default port conflicts with the backend API's port 3000; use a different preview port or stop the backend. Report checks you could not run.
