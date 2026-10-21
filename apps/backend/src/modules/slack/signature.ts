import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifySlackSignature(
  sig: string,
  timestamp: string,
  body: string,
  secret = process.env.SLACK_SIGNING_SECRET,
  now = Date.now(),
): boolean {
  if (!secret || !/^v0=[a-f\d]{64}$/.test(sig) || !/^\d{10}$/.test(timestamp))
    return false;
  if (Math.abs(Math.floor(now / 1000) - Number(timestamp)) > 300) return false;
  const expected = createHmac('sha256', secret)
    .update(`v0:${timestamp}:${body}`)
    .digest();
  return timingSafeEqual(expected, Buffer.from(sig.slice(3), 'hex'));
}
