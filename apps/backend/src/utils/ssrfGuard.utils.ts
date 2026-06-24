import dns from 'node:dns/promises';
import { isIP } from 'node:net';

// Blocks SSRF against cloud metadata endpoints, loopback, and private ranges.
export function isBlockedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 127) return true; // loopback
    if (a === 10) return true; // private
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 0) return true;
    return false;
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1') return true; // loopback
    if (normalized.startsWith('fe80:')) return true; // link-local
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // unique local
    return false;
  }
  return true; // unparseable — treat as blocked
}

/**
 * Throws unless the URL is HTTPS and resolves only to public IP addresses.
 * Use before issuing any outbound request to a customer-configured endpoint.
 */
export async function assertSafeUrl(rawUrl: string): Promise<void> {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed');
  }

  const addresses = await dns.lookup(parsed.hostname, { all: true });
  if (addresses.length === 0) {
    throw new Error('Could not resolve host');
  }
  if (addresses.some((a) => isBlockedIp(a.address))) {
    throw new Error('Target host resolves to a blocked address');
  }
}
