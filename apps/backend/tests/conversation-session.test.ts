import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
  issueWebSession,
  scopedConversationId,
  verifyWebSession,
} from '../src/modules/chatv2/session';

const scope = { orgId: 'org_a', agentId: 'agent_a', channelId: 'channel_a' };
let previous: string | undefined;
beforeAll(() => {
  previous = process.env.TOKEN_ENCRYPTION_KEY;
  process.env.TOKEN_ENCRYPTION_KEY = 'ab'.repeat(32);
});
afterAll(() => {
  if (previous === undefined) delete process.env.TOKEN_ENCRYPTION_KEY;
  else process.env.TOKEN_ENCRYPTION_KEY = previous;
});

describe('server-issued visitor capabilities', () => {
  test('a valid token continues the same conversation', () => {
    const token = issueWebSession(scope);
    const visitor = verifyWebSession(scope, token);
    expect(visitor).not.toBeNull();
    expect(verifyWebSession(scope, token)).toBe(visitor);
    expect(issueWebSession(scope)).not.toBe(token);
  });
  test('another organization, agent or channel cannot resume it', () => {
    const token = issueWebSession(scope);
    for (const other of [
      { ...scope, orgId: 'org_b' },
      { ...scope, agentId: 'agent_b' },
      { ...scope, channelId: 'channel_b' },
    ]) {
      expect(verifyWebSession(other, token)).toBeNull();
    }
  });
  test('forged, malformed and expired capabilities fail closed', () => {
    const now = 1_800_000_000_000;
    const token = issueWebSession(scope, now);
    expect(verifyWebSession(scope, token, now + 86_400_000)).toBeNull();
    expect(verifyWebSession(scope, token.slice(0, -1), now)).toBeNull();
    expect(
      verifyWebSession(scope, token.replace(/^[^.]+/, 'a'.repeat(43)), now),
    ).toBeNull();
    expect(verifyWebSession(scope, 'legacy-conversation-id', now)).toBeNull();
  });
});

test('the same external identity never crosses organization, agent, channel or ingress boundaries', () => {
  const externalId = 'same-external-identity';
  const ids = [
    scopedConversationId(scope, 'web', externalId),
    scopedConversationId(scope, 'preview', externalId),
    scopedConversationId(scope, 'whatsapp', externalId),
    scopedConversationId(scope, 'slack', externalId),
    scopedConversationId({ ...scope, orgId: 'org_b' }, 'web', externalId),
    scopedConversationId({ ...scope, agentId: 'agent_b' }, 'web', externalId),
    scopedConversationId(
      { ...scope, channelId: 'channel_b' },
      'web',
      externalId,
    ),
  ];
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids).not.toContain(externalId);
});
