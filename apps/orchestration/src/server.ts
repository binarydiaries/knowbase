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
      body: t.Object({
        thread_id: t.Optional(t.String()),
        if_exists: t.Optional(t.String()),
      }),
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
      body: t.Object({
        assistant_id: t.Optional(t.String()),
        input: t.Optional(t.Record(t.String(), t.Unknown())),
        config: t.Optional(
          t.Object({
            configurable: t.Optional(t.Record(t.String(), t.Unknown())),
          }),
        ),
        multitask_strategy: t.Optional(t.String()),
      }),
    },
  )

  // ── POST /threads/:threadId/runs/stream ─────────────────────────────────────
  .post(
    '/threads/:threadId/runs/stream',
    async ({ params, body, set }) => {
      set.headers['Content-Type'] = 'text/event-stream';
      set.headers['Cache-Control'] = 'no-cache';
      set.headers['Connection'] = 'keep-alive';

      const lgStream = await graph.stream(body.input ?? {}, {
        configurable: {
          thread_id: params.threadId,
          ...body.config?.configurable,
        },
        streamMode: ['values', 'messages'],
      });

      // toUIMessageStream converts the LangGraph stream to the AI SDK
      // data-stream protocol so the backend can proxy it directly to useChat.
      // Cast needed: LangGraph's generic tuple type doesn't match the narrow
      // AIMessageChunk signature but the adapter handles both at runtime.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return toUIMessageStream(lgStream as any);
    },
    {
      body: t.Object({
        assistant_id: t.Optional(t.String()),
        input: t.Optional(t.Record(t.String(), t.Unknown())),
        config: t.Optional(
          t.Object({
            configurable: t.Optional(t.Record(t.String(), t.Unknown())),
          }),
        ),
        stream_mode: t.Optional(t.Union([t.String(), t.Array(t.String())])),
        multitask_strategy: t.Optional(t.String()),
      }),
    },
  )

  .listen(PORT, () => {
    console.log(`[orchestration] server listening on :${PORT}`);
  });
