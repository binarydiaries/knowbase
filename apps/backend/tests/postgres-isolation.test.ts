import { afterAll, beforeAll, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import {
  END,
  MessagesValue,
  START,
  StateGraph,
  StateSchema,
} from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { Pool } from 'pg';
import { scopedConversationId } from '../src/modules/chatv2/session';

const url = process.env.TEST_DATABASE_URL;
if (!url)
  throw new Error(
    'TEST_DATABASE_URL must point to a disposable PostgreSQL database',
  );
// Import application services only after selecting the disposable database.
process.env.DATABASE_URL = url;
const { db } = await import('../src/db');
const { agents } = await import('../src/db/schema/agents');
const { channels } = await import('../src/db/schema/channels');
const { conversations } = await import('../src/db/schema/conversations');
const { ConversationService } = await import(
  '../src/modules/conversation/service'
);
const { loadAgent } = await import('../src/modules/graph/nodes/loadAgent');
const pool = new Pool({ connectionString: url });
const saver = PostgresSaver.fromConnString(url);
const runId = randomUUID();
const scope = {
  orgId: `org_a_${runId}`,
  agentId: `agent_a_${runId}`,
  channelId: `channel_a_${runId}`,
};
const id = scopedConversationId(scope, 'web', 'visitor_a');

beforeAll(async () => {
  // The release check migrates a fresh database before executing this suite.
  await db
    .insert(agents)
    .values([
      {
        id: scope.agentId,
        name: 'Synthetic A',
        orgId: scope.orgId,
        createdBy: 'user_a',
      },
      {
        id: 'agent_b',
        name: 'Synthetic B',
        orgId: 'org_b',
        createdBy: 'user_b',
      },
    ])
    .onConflictDoNothing();
  await db
    .insert(channels)
    .values({
      id: scope.channelId,
      agentId: scope.agentId,
      type: 'web',
      enabled: true,
      config: {},
      usage: {},
      createdBy: 'user_a',
    })
    .onConflictDoNothing();
  await db
    .insert(conversations)
    .values({
      id,
      agentId: scope.agentId,
      channelId: scope.channelId,
      lastUserQuestion: 'Synthetic private question',
      lastAssistantUtterance: '',
      lastMessageAt: new Date(),
    })
    .onConflictDoNothing();
  await saver.setup();
});

afterAll(async () => {
  await saver.end();
  await pool.end();
  await db.$client.end();
});

test('Postgres checkpoints resume only within the server-derived conversation scope', async () => {
  const state = new StateSchema({ messages: MessagesValue });
  const graph = new StateGraph(state)
    .addNode('echo', () => ({
      messages: [new AIMessage('Synthetic response')],
    }))
    .addEdge(START, 'echo')
    .addEdge('echo', END)
    .compile({ checkpointer: saver });
  const config = { configurable: { thread_id: id } };
  await graph.invoke(
    { messages: [new HumanMessage('Synthetic tenant A private content')] },
    config,
  );
  expect((await graph.getState(config)).values.messages).toHaveLength(2);
  for (const other of [
    { ...scope, orgId: 'org_b' },
    { ...scope, agentId: 'agent_b' },
    { ...scope, channelId: 'channel_b' },
  ]) {
    const restored = await graph.getState({
      configurable: {
        thread_id: scopedConversationId(other, 'web', 'visitor_a'),
      },
    });
    expect(restored.values.messages ?? []).toHaveLength(0);
  }
  expect(
    (await graph.getState({ configurable: { thread_id: 'visitor_a' } })).values
      .messages ?? [],
  ).toHaveLength(0);
});

test('conversation writes reject the wrong organization, agent and channel in PostgreSQL', async () => {
  for (const other of [
    { ...scope, orgId: 'org_b' },
    { ...scope, agentId: 'agent_b' },
    { ...scope, channelId: 'channel_b' },
  ]) {
    expect(
      await ConversationService.update(
        { ...other, id },
        { lastUserQuestion: 'forged overwrite' },
      ),
    ).toBeUndefined();
  }
  expect(
    (await ConversationService.single({ id, orgId: scope.orgId }))
      ?.lastUserQuestion,
  ).toBe('Synthetic private question');
  expect(
    await ConversationService.single({ id, orgId: 'org_b' }),
  ).toBeUndefined();
  expect(
    (
      await ConversationService.update(
        { ...scope, id },
        { lastAssistantUtterance: 'Authorized response' },
      )
    )?.lastAssistantUtterance,
  ).toBe('Authorized response');
});

test('a restored behavior cannot bypass current agent ownership or archive checks', async () => {
  const restored = { behaviour: { agentId: scope.agentId } } as Parameters<
    typeof loadAgent
  >[0];
  const invoke = (orgId: string) =>
    Promise.resolve(
      loadAgent(restored, {
        configurable: { agentId: scope.agentId, orgId },
      } as Parameters<typeof loadAgent>[1]),
    );
  expect(await invoke(scope.orgId)).toEqual({});
  await expect(invoke('org_b')).rejects.toThrow('not found or inactive');
  await pool.query('UPDATE agents SET "agentStatus" = $1 WHERE id = $2', [
    'archived',
    scope.agentId,
  ]);
  await expect(invoke(scope.orgId)).rejects.toThrow('not found or inactive');
});
