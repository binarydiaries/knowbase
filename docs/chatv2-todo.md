# ChatV2 (LangGraph Pipeline) — TODO

## Scope: sendPreview first, then full production rollout

---

## sendPreview — in progress

- [x] RAG streaming works end-to-end (suppressPipelineNodes + streamEvents v2)
- [x] Pipeline node leak fixed (extractEntities, detectIntent, rewriteQuery suppressed)
- [x] executeActions success/failure message reaches client (on_chain_end synthesiser)
- [x] suppressPipelineNodes extracted to `graph/utils/stream.ts`
- [ ] Conversation persistence — save to DB after each turn (conversationId, lastUserQuestion, lastAssistantUtterance, lastMessageAt)
- [ ] AI cost tracking — call AiCostEventService.recordEvent for each LLM node (generateResponse, collectMissingData, extractEntities, detectIntent, rewriteQuery)
- [ ] Fix hardcoded conversationId in executeActions — replace stub with real thread_id from config
- [ ] Usage increment — call OrgUsageMonthlyService.incrementAssistantMessages after each completed turn

---

## sendWeb (after sendPreview is solid)

- [ ] Wire up LangGraph pipeline in ChatV2Service.sendWeb (remove "Not implemented" stub)
- [ ] Domain allowlist enforcement
- [ ] Subscription guard — assertMessagesPerMonthLimitNotReached before invoking graph
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
