<wizard-report>

# Amplitude Setup Report — Agenvik Dashboard

## Integration Summary

- **SDK installed:** `@amplitude/unified` (npm, Bun workspace)
- **Framework:** React + Vite + TanStack Router (dashboard app)
- **Init location:** `apps/dashboard/src/main.tsx` — called before `RouterProvider` mounts
- **Features enabled:** Analytics (full autocapture) + Session Replay (sampleRate: 1) + Guides & Surveys (engagement: {})
- **User identify:** `apps/dashboard/src/routes/__root.tsx` — Amplitude `setUserId` + `identify` called alongside `SentryIdentify` whenever Clerk user loads

## SDK Init (main.tsx)

```typescript
amplitude.initAll(import.meta.env.VITE_AMPLITUDE_API_KEY, {
  analytics: {
    remoteConfig: { fetchRemoteConfig: true },
    autocapture: {
      attribution: true,
      pageViews: true,
      sessions: true,
      formInteractions: true,
      fileDownloads: true,
      elementInteractions: true,
      frustrationInteractions: true,
      pageUrlEnrichment: true,
      networkTracking: true,
      webVitals: true,
    },
  },
  sessionReplay: { sampleRate: 1 },
  engagement: {},
});
```

## Events Instrumented

| Event | Description | File |
|-------|-------------|------|
| Agent Created | Fires when user successfully creates a new agent. | `src/widgets/CreateAgentDialog/CreateAgentDialog.tsx` |
| Agent Updated | Fires when user saves edits to an existing agent. | `src/widgets/CreateAgentDialog/CreateAgentDialog.tsx` |
| Agent Archived | Fires when user archives or unarchives an agent. | `src/routes/agents/index.tsx` |
| Agent Opened | Fires when user navigates to an agent detail page. | `src/routes/agents/$agentId/index.tsx` |
| Knowledge Source Added | Fires when text or Q&A content is saved to an agent. | `src/widgets/TextContentWidget/TextContentWidget.tsx`, `src/widgets/QAContentWidget/QAContentWidget.tsx` |
| Knowledge Source Deleted | Fires when user confirms deletion of a knowledge source. | `src/widgets/DocumentsWidget/DocumentsWidget.tsx` |
| Agent Training Started | Fires when user confirms starting a training run. | `src/widgets/DocumentsWidget/DocumentsWidget.tsx` |
| Subscription Plan Selected | Fires when user subscribes to a plan (post-Razorpay success). | `src/hooks/useSubscriptionMutations.ts` |
| Subscription Cancelled | Fires when user confirms subscription cancellation. | `src/hooks/useSubscriptionMutations.ts` |
| Channel Settings Saved | Fires when user saves web channel configuration. | `src/widgets/ChannelCard/ChannelCard.tsx` |
| WhatsApp Channel Connected | Fires when a WhatsApp phone number is assigned to an agent. | `src/widgets/ChannelCard/WhatsAppChannelCard.tsx` |
| Conversation Viewed | Fires when user opens a specific conversation thread. | `src/routes/conversations/{-$conversationId}/index.tsx` |
| Conversation Filter Applied | Fires when user filters conversations by agent. | `src/routes/conversations/{-$conversationId}/index.tsx` |
| Lead Captured | Planned — fires when leads page loads (event definition only, no track call wired since Lead Captured is a backend event). | `src/routes/leads/index.tsx` |

## Dashboard

**Agenvik Product Analytics:** https://app.amplitude.com/analytics/lively-band-419278/dashboard/d3w894hp

Charts:
- **Daily Active Users** — unique active users per day (last 30 days)
- **Average Session Length** — average session duration in seconds
- **Weekly User Retention** — % of new users who return each week
- **User Stickiness** — weekly return frequency distribution

> Note: Custom events (Agent Created, Knowledge Source Added, etc.) will appear in charts once the SDK ships to production and real events flow through. The dashboard is pre-configured to show them automatically.

## Environment Variables

| Variable | Status | Notes |
|----------|--------|-------|
| `VITE_AMPLITUDE_API_KEY` | Set in `.env.local` | Public browser key — safe to inline in source if preferred. Not committed to git. |

**For production:** Set `VITE_AMPLITUDE_API_KEY` to your Amplitude project's API key in your deployment environment (Vercel, Railway, etc.) or CI secrets. The value is already stored in `.env.local` locally. The key is a public browser token — Amplitude enforces tenant isolation server-side.

## Autocapture Note

The `@amplitude/unified` SDK with full autocapture enabled will automatically track:
- Page views (SPA route changes via TanStack Router)
- Session start/end
- UTM attribution
- Form interactions
- Click interactions
- Web Vitals (LCP, INP, CLS)
- Network requests

These appear in Amplitude without any additional code.

## Session Replay

Configured with `sampleRate: 1` (100% of sessions). Lower this for high-traffic production use — e.g. `sampleRate: 0.1` for 10%.

## Next Steps

1. **Deploy** the dashboard app with `VITE_AMPLITUDE_API_KEY` set in production env.
2. **Verify** events appear in Amplitude's Live Events stream after first user action.
3. **Wire `Lead Captured`** — this is a backend-side event (leads come from the chatbot, not the dashboard UI). Consider firing it from `apps/backend` using `@amplitude/analytics-node` when a new lead is saved to the DB.
4. **Tune Session Replay** — reduce `sampleRate` from 1 to 0.1–0.2 for production to control volume.
5. **Add group analytics** — use `amplitude.setGroup('org_id', orgId)` after Clerk org loads to enable per-organization analysis.

</wizard-report>
