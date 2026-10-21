import { createHash, randomBytes } from 'node:crypto';

interface StateStore {
  set(
    key: string,
    value: string,
    mode: 'EX',
    seconds: number,
  ): Promise<unknown>;
  get(key: string): Promise<string | null>;
  getdel(key: string): Promise<string | null>;
}

const TTL_SECONDS = 600;
const keyFor = (state: string) => `oauth:slack:v1:${state}`;
const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

interface PendingState {
  orgId: string;
  userId: string;
  browserHash: string;
}

export async function issueSlackOAuthState(
  store: StateStore,
  orgId: string,
  userId: string,
) {
  const state = randomBytes(32).toString('base64url');
  const browserSecret = randomBytes(32).toString('base64url');
  await store.set(
    keyFor(state),
    JSON.stringify({ orgId, userId, browserHash: hash(browserSecret) }),
    'EX',
    TTL_SECONDS,
  );
  return { state, browserSecret, maxAge: TTL_SECONDS };
}

export async function consumeSlackOAuthState(
  store: StateStore,
  state: string,
  browserSecret: string,
): Promise<PendingState | null> {
  if (
    !/^[A-Za-z\d_-]{43}$/.test(state) ||
    !/^[A-Za-z\d_-]{43}$/.test(browserSecret)
  )
    return null;
  const key = keyFor(state);
  const stored = await store.get(key);
  if (!stored) return null;
  const pending = JSON.parse(stored) as PendingState;
  if (pending.browserHash !== hash(browserSecret)) return null;
  // Only one callback can consume this state; invalid browser attempts do not burn it.
  const consumed = await store.getdel(key);
  return consumed === stored ? pending : null;
}
