import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyWhatsAppSignature(
  body: Uint8Array,
  signature: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !signature || !/^sha256=[a-f\d]{64}$/.test(signature))
    return false;
  const expected = createHmac('sha256', secret).update(body).digest();
  return timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex'));
}
