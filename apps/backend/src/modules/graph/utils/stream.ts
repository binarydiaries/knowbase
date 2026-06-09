/**
 * Stream event utilities for the LangGraph v2 streamEvents pipeline.
 *
 * streamEvents v2 forces ALL LLM calls to stream, including internal pipeline
 * nodes.  We block on_chat_model_stream events from nodes whose output must
 * not reach the client.  Blocklist (not allowlist) so future nodes default to
 * passing through.
 *
 * Node map (from reading both subgraph files):
 *   main graph    : loadAgent · extractEntities · detectIntent · ragGraph · workflowGraph
 *   ragGraph      : rewriteQuery · vectorSearch · generateResponse  ← streams to client
 *   workflowGraph : loadWorkflow · checkRequirements · collectMissingData · executeActions
 *
 * Special case — executeActions:
 *   This node constructs an AIMessage directly (no LLM call), so no
 *   on_chat_model_stream ever fires for it.  We intercept the on_chain_end
 *   for that node and synthesise a fake on_chat_model_stream so the
 *   success/failure message reaches the client.
 */

const PIPELINE_NODES = new Set([
  'extractEntities', // main graph — structured JSON, must not reach client
  'detectIntent', // main graph — structured JSON, must not reach client
  'rewriteQuery', // inside ragGraph — internal text rewrite, not user-visible
]);

// biome-ignore lint/suspicious/noExplicitAny: streamEvents yields untyped events
type StreamEvent = any;

export async function* suppressPipelineNodes(
  stream: AsyncIterable<StreamEvent>,
): AsyncIterable<StreamEvent> {
  for await (const event of stream) {
    if (event.event === 'on_chat_model_stream') {
      const node = event.metadata?.langgraph_node as string | undefined;
      if (node && PIPELINE_NODES.has(node)) continue;
    }

    // executeActions doesn't call an LLM — it constructs an AIMessage directly,
    // so no on_chat_model_stream event ever fires for it.  Intercept the
    // on_chain_end for that node and synthesise a fake streaming event so the
    // success/failure message reaches the client.
    if (
      event.event === 'on_chain_end' &&
      event.metadata?.langgraph_node === 'executeActions'
    ) {
      // biome-ignore lint/suspicious/noExplicitAny: untyped LangGraph output
      const msgs: any[] = event.data?.output?.messages ?? [];
      for (const msg of msgs) {
        const text =
          typeof msg?.content === 'string' ? msg.content.trim() : '';
        if (text) {
          yield {
            event: 'on_chat_model_stream',
            run_id: event.run_id,
            name: 'executeActions',
            data: {
              chunk: {
                content: text,
                id: `execute-${event.run_id}`,
              },
            },
            metadata: {
              ...event.metadata,
              langgraph_node: 'executeActions',
            },
          };
        }
      }
      continue; // don't forward the raw on_chain_end
    }

    yield event;
  }
}
