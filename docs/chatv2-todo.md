# ChatV2 (LangGraph Pipeline) — TODO

## Scope: sendPreview first, then full production rollout

---

## sendPreview — in progress

- [x] RAG streaming works end-to-end (suppressPipelineNodes + streamEvents v2)
- [x] Pipeline node leak fixed (extractEntities, detectIntent, rewriteQuery suppressed)
- [x] executeActions success/failure message reaches client (on_chain_end synthesiser)
- [x] suppressPipelineNodes extracted to `graph/utils/stream.ts`
- [x] Conversation persistence — `initConversation` node (first in graph) creates on new thread / updates lastUserQuestion + lastMessageAt on existing; uses `getLastUserMessage` from `graph/utils/messages.ts`
- [x] Conversation persistence — `persistTurn` node (after ragGraph/workflowGraph) saves user + assistant messages to `messages` table and updates `lastAssistantUtterance`; includes RAG sources metadata and `finalQuery` systemMetadata
- [x] Conversation enrichment — `enrichConversation` node runs in parallel with `persistTurn`; geo (IP → country) + topic label (nano LLM, new conversations only); fire-and-forget, gating for paid plans to be added later
- [x] Agent status guard — `loadAgent` throws if `agentStatus !== 'active'`
- [x] AI cost tracking — `CostTrackingHandler` LangChain callback in `graph/utils/cost.ts`; wired into all LLM nodes via `createCostCallback({ orgId, agentId, conversationId, nodeName })` passed to `createLlm` / `createNanoLlm` / `createStreamingNanoLlm` factory args; covers generateRagResponse, collectMissingData, extractEntities, detectIntent, rewriteQuery, scoreSentiment, enrichConversation (topic label)
- [ ] Lead email notification — `executeActions` save_lead action doesn't fire email; revisit when notification model is redesigned
- [x] Gating — sentiment scoring in `persistTurn` behind `isPaid` config flag
- [x] Gating — enrichment (geo + topic) in `enrichConversation` behind `isPaid` config flag
- [x] Fix hardcoded conversationId in executeActions — replaced stub with real thread_id from config
- [x] Usage increment — `OrgUsageMonthlyService.incrementAssistantMessages` called in `persistTurn` (inside Promise.all with conversation + message writes)

---

## sendWeb (after sendPreview is solid)

- [ ] Wire up LangGraph pipeline in ChatV2Service.sendWeb (remove "Not implemented" stub)
- [ ] Domain allowlist enforcement
- [x] Subscription guard — `ChatV2Service.assertMessageLimit` throws `MessageLimitReachedError` and returns `isPaid`; called in `sendPreview` (and to be called in `sendWeb`)
- [ ] Conversation enrichment — geo (IP → country) + topic labelling on new conversations
- [ ] Sentiment scoring — on paid plans only

---

## WhatsApp + Slack (after sendWeb)

- [ ] sendWhatsApp — typing indicator, seen receipt, reply sending, conversation persistence
- [ ] sendSlack — placeholder → update flow, conversation persistence

---

## Client widget

- [ ] Point apps/client at v2 endpoint once sendWeb is production-ready

---

## Notes

- v2 uses LangGraph checkpoint for multi-turn state — once message history is injected at graph start, the checkpointer handles mid-conversation continuity automatically
- rewriteQuery in ragGraph replaces v1's standalone resolveReferences LLM call
- suppressPipelineNodes in graph/utils/stream.ts handles both LLM suppression and executeActions message synthesis
- Do NOT touch the hardcoded conversationId in executeActions until the fix task above is picked up (it's a test stub)
