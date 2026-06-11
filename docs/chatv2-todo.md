# ChatV2 (LangGraph Pipeline) — TODO

## Scope: sendPreview first, then full production rollout

---

## sendPreview — done

- [x] RAG streaming works end-to-end (suppressPipelineNodes + streamEvents v2)
- [x] Pipeline node leak fixed (extractEntities, detectIntent, rewriteQuery suppressed)
- [x] executeActions success/failure message reaches client (on_chain_end synthesiser)
- [x] suppressPipelineNodes extracted to `graph/utils/stream.ts`
- [x] Conversation persistence — `initConversation` node (first in graph) creates on new thread / updates lastUserQuestion + lastMessageAt on existing; uses `getLastUserMessage` from `graph/utils/messages.ts`
- [x] Conversation persistence — `persistTurn` node (after ragGraph/workflowGraph) saves user + assistant messages to `messages` table and updates `lastAssistantUtterance`; includes RAG sources metadata and `finalQuery` systemMetadata
- [x] Conversation enrichment — `enrichConversation` node runs in parallel with `persistTurn`; geo (IP → country) + topic label (nano LLM, new conversations only); fire-and-forget, gating for paid plans to be added later
- [x] Agent status guard — `loadAgent` throws if `agentStatus !== 'active'`
- [x] AI cost tracking — `CostTrackingHandler` LangChain callback in `graph/utils/cost.ts`; wired into all LLM nodes via `createCostCallback({ orgId, agentId, conversationId, nodeName })` passed to `createLlm` / `createNanoLlm` / `createStreamingNanoLlm` factory args; covers generateRagResponse, collectMissingData, extractEntities, detectIntent, rewriteQuery, scoreSentiment, enrichConversation (topic label)
- [x] Lead email notification — `send_email` workflow action type; toggle in `LeadCaptureDrawer`; generic `send-email` queue job; action handlers extracted to `graph/actions/`
- [x] Gating — sentiment scoring in `persistTurn` behind `isPaid` config flag
- [x] Gating — enrichment (geo + topic) in `enrichConversation` behind `isPaid` config flag
- [x] Fix hardcoded conversationId in executeActions — replaced stub with real thread_id from config
- [x] Usage increment — `OrgUsageMonthlyService.incrementAssistantMessages` called in `persistTurn` (inside Promise.all with conversation + message writes)

---

## sendWeb — done

- [x] Wire up LangGraph pipeline in ChatV2Service.sendWeb
- [x] Domain allowlist enforcement (was already in stub, preserved)
- [x] Subscription guard — `assertMessageLimit` called; `MessageLimitReachedError` now carries full payload (plan, messagesPerMonthLimit, messagesThisMonth) matching response schema
- [x] Conversation enrichment — handled by `enrichConversation` node (parallel, gated behind isPaid); ip passed through configurable
- [x] Sentiment scoring — handled by `persistTurn` (gated behind isPaid)
- [x] Public route `POST /chatv2` added (no AuthGuard); orgId + agentId sourced from channel record via `ChannelService.singleById`

---

## WhatsApp — done

- [x] sendWhatsApp — typing indicator (best-effort), seen receipt / blue ticks (best-effort), reply sending
- [x] Conversation persistence — handled by `initConversation` node; thread_id = senderPhone
- [x] Subscription guard — `assertMessageLimit` called

---

## Slack — done

- [x] sendSlack — thinking placeholder posted, updated with final response after graph.invoke
- [x] app_mention bot-mention prefix stripped (`<@BOTID>` regex) before passing to graph
- [x] Conversation persistence — handled by `initConversation` node; thread_id = threadTs
- [x] Subscription guard — `assertMessageLimit` called

---

## Client widget — done

- [x] Point apps/client at v2 endpoint — `apps/client/src/services/chat.ts` baseUrl changed from `/chat` to `/chatv2`
- [x] `GET /chatv2/channel` added to backend; client `getChannel` uses v2 endpoint

---

## Remaining

- [x] **Lead email notification** — done; `send_email` action type, toggle UI, generic queue
- [x] **DB migration** — `20260610001000_add_trigger_instructions` applied successfully
- [ ] **V1 cleanup** — delete `apps/backend/src/modules/chat/` (7 files) + remove `.use(Chat)` from `server.ts` once confirmed safe
- [x] **SDK regeneration** — dashboard `src/services/` regenerated

---

## Notes

- v2 uses LangGraph checkpoint for multi-turn state — once message history is injected at graph start, the checkpointer handles mid-conversation continuity automatically
- rewriteQuery in ragGraph replaces v1's standalone resolveReferences LLM call
- suppressPipelineNodes in graph/utils/stream.ts handles both LLM suppression and executeActions message synthesis
