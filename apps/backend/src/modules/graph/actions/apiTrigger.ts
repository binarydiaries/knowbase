import dns from 'node:dns/promises';
import { isIP } from 'node:net';
import { ApiTriggerConfigSchema } from '../../intent/model';
import type { ActionContext, IActionResult } from './types';

const REQUEST_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 100_000;

// Blocks SSRF against cloud metadata endpoints, loopback, and private ranges.
function isBlockedIp(ip: string): boolean {
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

async function assertSafeUrl(rawUrl: string): Promise<void> {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== 'https:') {
    throw new Error('api_trigger: only HTTPS URLs are allowed');
  }

  const addresses = await dns.lookup(parsed.hostname, { all: true });
  if (addresses.length === 0) {
    throw new Error('api_trigger: could not resolve host');
  }
  if (addresses.some((a) => isBlockedIp(a.address))) {
    throw new Error('api_trigger: target host resolves to a blocked address');
  }
}

function interpolate(
  template: string,
  entities: Record<string, string | null>,
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (match, key) => entities[key] ?? match,
  );
}

function interpolateRecord(
  record: Record<string, string> | undefined,
  entities: Record<string, string | null>,
): Record<string, string> | undefined {
  if (!record) return undefined;
  return Object.fromEntries(
    Object.entries(record).map(([k, v]) => [k, interpolate(v, entities)]),
  );
}

export async function apiTrigger(ctx: ActionContext): Promise<IActionResult> {
  const parsed = ApiTriggerConfigSchema.safeParse(ctx.config);
  if (!parsed.success) {
    return { success: false, error: 'api_trigger: invalid action config' };
  }
  const { method, url, headers, bodyTemplate } = parsed.data;

  const entities = ctx.entities ?? {};
  const interpolatedUrl = interpolate(url, entities);
  const interpolatedBody = interpolateRecord(bodyTemplate, entities);

  try {
    await assertSafeUrl(interpolatedUrl);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  try {
    const response = await fetch(interpolatedUrl, {
      method,
      headers: {
        Accept: 'application/json',
        ...headers,
        ...(method !== 'GET' && interpolatedBody
          ? { 'Content-Type': 'application/json' }
          : {}),
      },
      body:
        method !== 'GET' && interpolatedBody
          ? JSON.stringify(interpolatedBody)
          : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: 'error',
    });

    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) {
      return { success: false, error: 'api_trigger: response too large' };
    }

    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // Non-JSON response — pass the raw text through.
    }

    if (!response.ok) {
      return {
        success: false,
        data,
        error: `api_trigger: request failed with status ${response.status}`,
      };
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? `api_trigger: ${err.message}`
          : 'api_trigger: request failed',
    };
  }
}
