/**
 * Elysia server exposing the compiled LangGraph agent via the
 * LangGraph SDK-compatible API.
 *
 * Implements only the three endpoints used by chatV2/service.ts:
 *   POST /threads                           — idempotent thread creation
 *   POST /threads/:threadId/runs/wait       — blocking invoke
 *   POST /threads/:threadId/runs/stream     — SSE token streaming
 *
 * State persistence is owned by the PostgresSaver checkpointer configured
 * in src/db/checkpointer.ts. Thread IDs map 1:1 to LangGraph thread_id
 * (= conversation UUID from the backend).
 */

import 'dotenv/config';
import { Elysia, t } from 'elysia';
import { AIMessageChunk } from '@langchain/core/messages';
import { graph } from './agent/graph.js';

const PORT = parseInt(process.env.PORT ?? '2024', 10);

new Elysia()

  // ── Health check ────────────────────────────────────────────────────────────
  .get('/ok', () => ({ ok: true }))

  // ── POST /threads ───────────────────────────────────────────────────────────
  // Idempotent: the checkpointer owns thread state; we just acknowledge.
  .post(
    '/threads',
    ({ body }) => ({
      thread_id: body.thread_id ?? crypto.randomUUID(),
      created_at: new Date().toISOString(),
      metadata: {},
      status: 'idle',
      values: null,
    }),
    {
      body: t.Object(
        { thread_id: t.Optional(t.String()), if_exists: t.Optional(t.String()) },
        { additionalProperties: true },
      ),
    },
  )

  // ── POST /threads/:threadId/runs/wait ───────────────────────────────────────
  .post(
    '/threads/:threadId/runs/wait',
    async ({ params, body }) => {
      const result = await graph.invoke(body.input ?? {}, {
        configurable: {
          thread_id: params.threadId,
          ...body.config?.configurable,
        },
      });
      return result;
    },
    {
      body: t.Object(
        {
          input: t.Optional(t.Record(t.String(), t.Unknown())),
          config: t.Optional(
            t.Object({
              configurable: t.Optional(t.Record(t.String(), t.Unknown())),
            }),
          ),
        },
        { additionalProperties: true },
      ),
    },
  )

  // ── POST /threads/:threadId/runs/stream ─────────────────────────────────────
  .post(
    '/threads/:threadId/runs/stream',
    async ({ params, body, set }) => {
      set.headers['Content-Type'] = 'text/event-stream';
      set.headers['Cache-Control'] = 'no-cache';
      set.headers['Connection'] = 'keep-alive';

      const encoder = new TextEncoder();

      return new ReadableStream({
        async start(controller) {
          try {
            // streamMode:'messages' yields [AIMessageChunk|AIMessage, nodeMetadata] per token.
            // Only AIMessageChunk carries incremental deltas — the final AIMessage has the
            // full concatenated content and must be skipped to avoid duplication.
            const lgStream = await graph.stream(body.input ?? {}, {
              configurable: {
                thread_id: params.threadId,
                ...body.config?.configurable,
              },
              streamMode: 'messages',
            });

            for await (const chunk of lgStream) {
              const [message] = chunk as [unknown, Record<string, unknown>];
              if (!message || typeof message !== 'object') continue;

              const msg = message as { id?: string; content?: unknown };
              if (!msg.id) continue;

              // Skip the final AIMessage (full text) — only stream incremental chunks
              if (!(message instanceof AIMessageChunk)) continue;

              const content =
                typeof msg.content === 'string'
                  ? msg.content
                  : JSON.stringify(msg.content);

              controller.enqueue(
                encoder.encode(
                  `event: messages/partial\ndata: ${JSON.stringify([{ id: msg.id, content }])}\n\n`,
                ),
              );
            }
          } catch (err) {
            console.error('[runs/stream]', err);
            controller.enqueue(
              encoder.encode(
                `event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`,
              ),
            );
          }

          controller.close();
        },
      });
    },
    {
      body: t.Object(
        {
          input: t.Optional(t.Record(t.String(), t.Unknown())),
          config: t.Optional(
            t.Object({
              configurable: t.Optional(t.Record(t.String(), t.Unknown())),
            }),
          ),
        },
        { additionalProperties: true },
      ),
    },
  )

  .listen(PORT, () => {
    console.log(`[orchestration] server listening on :${PORT}`);
  });
