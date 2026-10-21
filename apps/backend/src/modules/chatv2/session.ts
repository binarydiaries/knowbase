import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

export interface ConversationScope {
  orgId: string;
  agentId: string;
  channelId: string;
}

const SESSION_SECONDS = 24 * 60 * 60;

function signature(scope: ConversationScope, payload: string): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key || !/^[a-f\d]{64}$/i.test(key)) {
    throw new Error('A valid TOKEN_ENCRYPTION_KEY is required');
  }
  return createHmac('sha256', Buffer.from(key, 'hex'))
    .update(
      JSON.stringify([
        'web-session-v1',
        scope.orgId,
        scope.agentId,
        scope.channelId,
        payload,
      ]),
    )
    .digest();
}

export function issueWebSession(
  scope: ConversationScope,
  now = Date.now(),
): string {
  const id = randomBytes(32).toString('base64url');
  const payload = `${id}.${Math.floor(now / 1000) + SESSION_SECONDS}`;
  return `${payload}.${signature(scope, payload).toString('hex')}`;
}

export function verifyWebSession(
  scope: ConversationScope,
  token: string,
  now = Date.now(),
): string | null {
  const match = /^([A-Za-z\d_-]{43})\.(\d{10})\.([a-f\d]{64})$/.exec(token);
  if (!match || Number(match[2]) <= Math.floor(now / 1000)) return null;
  const expected = signature(scope, `${match[1]}.${match[2]}`);
  if (!timingSafeEqual(expected, Buffer.from(match[3], 'hex'))) return null;
  return match[1];
}

export function scopedConversationId(
  scope: ConversationScope,
  kind: 'web' | 'preview' | 'whatsapp' | 'slack',
  externalId: string,
): string {
  // A new key space deliberately never resumes legacy unscoped checkpoints.
  return `v2_${createHash('sha256')
    .update(
      JSON.stringify([
        scope.orgId,
        scope.agentId,
        scope.channelId,
        kind,
        externalId,
      ]),
    )
    .digest('hex')}`;
}
