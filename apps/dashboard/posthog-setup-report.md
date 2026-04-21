<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of your project. The following changes were made in this session:

- **`vite.config.ts`** — Vite dev-server reverse proxy updated to add `/ingest/static` and `/ingest/array` routes to the PostHog assets CDN (`us-assets.i.posthog.com`), ensuring PostHog's static assets load correctly through the proxy.
- **`.env`** — `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` confirmed and updated.
- **3 feature files** newly instrumented with `posthog.capture()` calls (see table below).

The existing integration (`PostHogProvider`, user identification via Clerk, and all previously added `posthog.capture()` calls) was left intact.

| Event | Description | File |
|---|---|---|
| `whatsapp_connected` | Fired when a user successfully connects their WhatsApp Business Account. Properties: `business_account_id`, `phone_numbers_count` | `src/widgets/WhatsAppIntegrationCard/WhatsAppIntegrationCard.tsx` |
| `whatsapp_disconnected` | Fired when a user disconnects their WhatsApp Business Account | `src/widgets/WhatsAppIntegrationCard/WhatsAppIntegrationCard.tsx` |
| `action_toggled` | Fired when a user enables or disables an agent action. Properties: `action_type`, `enabled`, `agent_id` | `src/widgets/ActionsCard/ActionsCard.tsx` |
| `lead_generation_configured` | Fired when a user saves lead generation configuration settings. Properties: `action_id`, `fields_collected` | `src/widgets/ActionsCard/LeadGenerationConfigDrawer.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/374831/dashboard/1492572
- **Agent creation over time**: https://us.posthog.com/project/374831/insights/efX1C4Y8
- **Agent training funnel** (knowledge source saved → training started): https://us.posthog.com/project/374831/insights/W2hfvn5U
- **Upgrade intent clicks**: https://us.posthog.com/project/374831/insights/w8z9SSvL
- **Subscription page to upgrade funnel**: https://us.posthog.com/project/374831/insights/vE9Luvfz
- **Integration adoption (WhatsApp & Lead Generation)**: https://us.posthog.com/project/374831/insights/HsfoSxOc

## LLM Analytics

LLM analytics is instrumented via the `$ai_generation` PostHog event in the agent preview chat widget. This project uses the **Vercel AI SDK** (`@ai-sdk/react` + `ai`) with a custom streaming backend.

**How it works:** `AgentPreviewContent` uses `useChat` from `@ai-sdk/react` to stream responses from the backend API at `VITE_API_BASE/chat`. The `onFinish` callback fires when each streamed response completes and captures a `$ai_generation` event. A `useEffect` watching the `status` field detects when the first streaming chunk arrives to compute time-to-first-token.

**File:** `src/widgets/AgentPreview/AgentPreview.tsx`

| Property | Value |
|---|---|
| `$ai_trace_id` | Unique conversation ID (from `useChat`) — groups all turns in one conversation |
| `$ai_session_id` | `agentId` — groups generations by agent |
| `$ai_provider` | `custom` — actual provider is determined server-side |
| `$ai_stream` | `true` |
| `$ai_latency` | Client-measured total latency from send to finish (seconds) |
| `$ai_time_to_first_token` | Client-measured time from send to first streaming chunk (seconds) |
| `$ai_span_name` | `agent_preview_chat` |
| `$ai_base_url` | `VITE_API_BASE` — the chat API endpoint |
| `$ai_is_error` | `true` if the generation failed |

> **Note:** Token counts (`$ai_input_tokens`, `$ai_output_tokens`) and model name (`$ai_model`) are only available server-side. For full LLM analytics including cost tracking, add `posthog-node` instrumentation to the backend API using the same `$ai_trace_id` (the `conversationId`) to correlate server and client events.

View LLM generations in PostHog: https://us.posthog.com/llm-analytics/generations

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-react-tanstack-router-file-based/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
