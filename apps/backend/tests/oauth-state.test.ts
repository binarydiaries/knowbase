import { afterAll, expect, test } from 'bun:test';
import Redis from 'ioredis';
import {
  consumeSlackOAuthState,
  issueSlackOAuthState,
} from '../src/modules/slack/oauthState';

if (!process.env.TEST_REDIS_URL)
  throw new Error('TEST_REDIS_URL must point to a disposable test Redis');
const store = new Redis(process.env.TEST_REDIS_URL);
afterAll(async () => {
  await store.quit();
});

test('OAuth state is bound to the initiating browser, user and organization, and consumed once', async () => {
  const pending = await issueSlackOAuthState(store, 'org_a', 'user_a');
  expect(pending.state).not.toBe('org_a');
  expect(
    await consumeSlackOAuthState(store, pending.state, 'b'.repeat(43)),
  ).toBeNull();
  const results = await Promise.all([
    consumeSlackOAuthState(store, pending.state, pending.browserSecret),
    consumeSlackOAuthState(store, pending.state, pending.browserSecret),
  ]);
  expect(results.filter(Boolean)).toHaveLength(1);
  expect(results.find(Boolean)).toMatchObject({
    orgId: 'org_a',
    userId: 'user_a',
  });
  expect(
    await consumeSlackOAuthState(store, pending.state, pending.browserSecret),
  ).toBeNull();
});

test('expired state and raw organization IDs cannot authorize callbacks', async () => {
  const pending = await issueSlackOAuthState(store, 'org_b', 'user_b');
  await store.expire(`oauth:slack:v1:${pending.state}`, 0);
  expect(
    await consumeSlackOAuthState(store, pending.state, pending.browserSecret),
  ).toBeNull();
  expect(
    await consumeSlackOAuthState(store, 'org_b', pending.browserSecret),
  ).toBeNull();
});
