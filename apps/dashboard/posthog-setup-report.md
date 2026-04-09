<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Knowbase dashboard. Here is a summary of all changes made:

- **`posthog-js`** added to `package.json` — run `bun install` from the monorepo root (`/Users/shridhar/Documents/Keshav/knowbase/`) to install the package.
- **`.env`** — `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` written.
- **`vite.config.ts`** — Vite dev-server reverse proxy added for `/ingest` → PostHog host, preventing ad-blockers from dropping events.
- **`src/routes/__root.tsx`** — `PostHogProvider` wraps the entire app. A `PostHogIdentify` component calls `posthog.identify()` using the signed-in Clerk user's ID, email, and name on every load.
- **7 feature files** instrumented with `posthog.capture()` calls (see table below).

| Event | Description | File |
|---|---|---|
| `chatbot_created` | User successfully creates a new chatbot | `src/widgets/CreateChatbotDialog/CreateChatbotDialog.tsx` |
| `chatbot_updated` | User updates an existing chatbot's name or description | `src/widgets/CreateChatbotDialog/CreateChatbotDialog.tsx` |
| `chatbot_archived` | User archives an active chatbot | `src/widgets/ChatbotMenuActions/ChatbotMenuActions.tsx` |
| `chatbot_unarchived` | User restores an archived chatbot to active | `src/widgets/ChatbotMenuActions/ChatbotMenuActions.tsx` |
| `knowledge_source_saved` | A text knowledge source is created or updated | `src/widgets/TextContentWidget/TextContentWidget.tsx` |
| `knowledge_source_deleted` | A knowledge source is deleted from a chatbot | `src/widgets/DocumentsWidget/DocumentsWidget.tsx` |
| `chatbot_training_started` | User triggers a training run for a chatbot | `src/widgets/DocumentsWidget/DocumentsWidget.tsx` |
| `chatbot_behaviour_saved` | User saves chatbot behaviour settings | `src/widgets/BehaviourCard/BehaviourCard.tsx` |
| `chatbot_channel_saved` | User saves channel (web widget) appearance settings | `src/widgets/ChannelCard/ChannelCard.tsx` |
| `subscription_page_viewed` | User views the subscriptions/pricing page | `src/routes/subscriptions/index.tsx` |
| `upgrade_plan_clicked` | User clicks the Upgrade Plan link in the nav menu | `src/components/NavUser/NavUser.tsx` |
| `user_signed_out` | User signs out (also calls `posthog.reset()`) | `src/components/NavUser/NavUser.tsx` |

## Next steps

Run `bun install` from the monorepo root to install `posthog-js`, then start the dev server normally.

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/374831/dashboard/1446700
- **Chatbots Created Over Time**: https://us.posthog.com/project/374831/insights/lmLUSyuo
- **Upgrade Funnel** (Pricing viewed → Upgrade clicked): https://us.posthog.com/project/374831/insights/ej3FaczR
- **Knowledge Source & Training Activity**: https://us.posthog.com/project/374831/insights/9NGRmbpI
- **Chatbot Lifecycle: Created vs Archived**: https://us.posthog.com/project/374831/insights/O0FbPn42
- **Daily User Sign-outs**: https://us.posthog.com/project/374831/insights/JXxE1fpR

## LLM Analytics

LLM analytics has been added via the `$ai_generation` PostHog event in the chatbot preview widget.

**How it works:** The dashboard uses `useChat` from `@ai-sdk/react` to stream responses from the backend API. The actual LLM calls happen server-side. The `onFinish` callback on `useChat` fires when each streamed response completes, at which point a `$ai_generation` event is captured with client-measured latency and error status. Each conversation's unique `id` from `useChat` is used as the `$ai_trace_id`, so all turns within a session group together in PostHog's LLM Analytics traces view.

| Property | Value |
|---|---|
| `$ai_trace_id` | Unique conversation ID from `useChat` |
| `$ai_session_id` | `chatbotId` — groups generations by chatbot |
| `$ai_provider` | `custom` — actual provider determined server-side |
| `$ai_stream` | `true` |
| `$ai_latency` | Client-measured time from send to finish (seconds) |
| `$ai_is_error` | `true` if the generation failed |

**File:** `src/widgets/ChatbotPreview/ChatbotPreview.tsx`

> **Note:** Token counts and model name are only available server-side. To get richer LLM analytics (input/output tokens, cost, model), add `posthog-node` instrumentation to the backend API at `${VITE_API_BASE}/chat` and emit `$ai_generation` events there, using the same `$ai_trace_id` to correlate with client-side events.

View LLM generations in PostHog: https://us.posthog.com/llm-analytics/generations

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-react-tanstack-router-file-based/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
