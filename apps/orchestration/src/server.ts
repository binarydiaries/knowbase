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
import { toUIMessageStream } from '@ai-sdk/langchain';
import { createUIMessageStreamResponse } from 'ai';
import { graph } from './agent/graph.js';

const PORT = parseInt(process.env.PORT ?? '2024', 10);

new Elysia()

  // ── Health check ────────────────────────────────────────────────────────────
  .get('/ok', () => ({ ok: true }))

  // ── POST /threads ───────────────────────────────────────────────────────────
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
  // Uses the @ai-sdk/langchain adapter to convert the LangGraph stream directly
  // to the AI SDK data-stream protocol. The backend proxies this response
  // body straight to the client — no SSE parsing needed on either side.
  .post(
    '/threads/:threadId/runs/stream',
    async ({ params, body }) => {
      const lgStream = await graph.stream(body.input ?? {}, {
        configurable: {
          thread_id: params.threadId,
          ...body.config?.configurable,
        },
        streamMode: ['values', 'messages'],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return createUIMessageStreamResponse({ stream: toUIMessageStream(lgStream as any) });
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
