import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Generates a per-org webhook verify token: base64url(orgId).hmac[0..31]
 * Uses INSTAGRAM_VERIFY_TOKEN_SECRET to prevent forgery.
 */
export function generateOrgVerifyToken(orgId: string): string {
  const secret = process.env.INSTAGRAM_VERIFY_TOKEN_SECRET;
  if (!secret) throw new Error('INSTAGRAM_VERIFY_TOKEN_SECRET is not set');

  const mac = createHmac('sha256', secret).update(orgId).digest('hex').slice(0, 32);
  const encodedOrgId = Buffer.from(orgId).toString('base64url');
  return `${encodedOrgId}.${mac}`;
}

/**
 * Verifies a token produced by generateOrgVerifyToken.
 * Returns the orgId on success, null on failure.
 */
export function verifyOrgVerifyToken(token: string): string | null {
  const secret = process.env.INSTAGRAM_VERIFY_TOKEN_SECRET;
  if (!secret) return null;

  const dotIdx = token.indexOf('.');
  if (dotIdx === -1) return null;

  const encodedOrgId = token.slice(0, dotIdx);
  const mac = token.slice(dotIdx + 1);

  let orgId: string;
  try {
    orgId = Buffer.from(encodedOrgId, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const expected = createHmac('sha256', secret).update(orgId).digest('hex').slice(0, 32);

  if (mac.length !== expected.length) return null;

  try {
    if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  } catch {
    return null;
  }

  return orgId;
}
