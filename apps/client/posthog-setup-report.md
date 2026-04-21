<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Knowbase chat widget client. PostHog (`posthog-js` + `@posthog/react`) was installed and initialized in `src/main.tsx` using environment variables, with a `PostHogProvider` wrapping the entire app. Six meaningful events were instrumented in the `AgentWidget` component, covering the full user journey from widget open to close, including error and usage-limit signals.

| Event | Description | File |
|---|---|---|
| `chat_widget_opened` | Fired when the chat widget channel loads and the agent UI is rendered for the first time | `src/widgets/AgentWidget/AgentWidget.tsx` |
| `chat_message_sent` | Fired when a user submits a message to the AI agent | `src/widgets/AgentWidget/AgentWidget.tsx` |
| `chat_new_session_started` | Fired when the user clicks to start a fresh chat conversation | `src/widgets/AgentWidget/AgentWidget.tsx` |
| `chat_widget_closed` | Fired when the user closes the chat widget (posts KB_CLOSE_CHAT to parent window) | `src/widgets/AgentWidget/AgentWidget.tsx` |
| `chat_error_occurred` | Fired when an error occurs during chat (non-usage-limit errors) | `src/widgets/AgentWidget/AgentWidget.tsx` |
| `chat_usage_limit_reached` | Fired when the channel's message limit is exhausted (MESSAGE_LIMIT_REACHED error code) | `src/widgets/AgentWidget/AgentWidget.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** https://us.posthog.com/project/374831/dashboard/1492617
- **Chat Widget Daily Engagement** (widget opens + messages over time): https://us.posthog.com/project/374831/insights/0buP22Lz
- **Chat Engagement Funnel** (opened → message sent → new session): https://us.posthog.com/project/374831/insights/BQ3eW1Te
- **Errors & Usage Limit Events** (churn signals): https://us.posthog.com/project/374831/insights/K42PfjbD
- **Widget Close vs Message Sent Rate** (engagement quality): https://us.posthog.com/project/374831/insights/uNquCxwO
- **Unique Users by Channel** (channel performance breakdown): https://us.posthog.com/project/374831/insights/UqvtzhWq

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
