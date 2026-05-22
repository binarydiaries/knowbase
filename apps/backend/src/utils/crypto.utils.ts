import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
// Prefix so we can distinguish encrypted values from plaintext (for migration)
const ENC_PREFIX = 'enc:v1:';

function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error('TOKEN_ENCRYPTION_KEY is not set');
  const key = Buffer.from(raw, 'hex');
  if (key.length !== 32)
    throw new Error(
      'TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes)',
    );
  return key;
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // Format: enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
  return `${ENC_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptToken(value: string): string {
  // Transparently pass through plaintext tokens (migration safety)
  if (!value.startsWith(ENC_PREFIX)) return value;

  const key = getKey();
  const parts = value.slice(ENC_PREFIX.length).split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted token format');

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8');
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}

/** HMAC-SHA256 constant-time comparison (reusable for webhook verification) */
export { timingSafeEqual };
