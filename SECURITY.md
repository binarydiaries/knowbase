# Security policy

## Report a vulnerability privately

Use GitHub's **Security → Report a vulnerability** option when it is available. Otherwise, use the security contact listed in [Agenvik's vulnerability disclosure policy](https://agenvik.com/security-policy#vulnerability-disclosure).

Do not report vulnerabilities in public issues, discussions, or pull requests. Include the affected version or commit, a description of the impact, and minimal reproduction steps using synthetic data. Remove credentials, personal information, and customer content from attachments and logs.

Only test systems and accounts you are authorized to use. Avoid accessing other organizations' data, sending unsolicited messages, or making billable requests against the hosted service.

## Supported versions

Agenvik is actively developed. Security maintenance targets the latest code on `main`; historical releases do not have a separate security support commitment. A version number or a public repository does not establish that a deployment has been security-reviewed.

## Operating your own deployment

Keep local environment files and provider credentials outside version control. Use separate development and production accounts, restrict database and Redis access, and configure allowed origins explicitly. Review authorization, webhook authentication, external API actions, retention, and provider permissions for your deployment before exposing it to users.

If a credential enters Git history or build logs, revoke or rotate it first. Deleting the current file does not revoke the credential or remove earlier copies. Coordinate any history cleanup with maintainers and collaborators.
