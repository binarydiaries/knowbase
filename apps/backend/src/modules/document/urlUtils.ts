import dns from 'node:dns/promises';
import { parse as htmlParse } from 'node-html-parser';

const URL_MAX_TEXT_CHARS = 50_000;
const FETCH_TIMEOUT_MS = 15_000;
const RESPONSE_BODY_LIMIT_BYTES = 5_000_000;
const MAX_REDIRECTS = 5;

const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0', '::1']);

const PRIVATE_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./,
  /^fc00:/i,
  /^fe80:/i,
];

export async function assertPublicUrl(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw Object.assign(new Error('INVALID_URL'), { code: 'INVALID_URL' });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw Object.assign(new Error('INVALID_URL'), { code: 'INVALID_URL' });
  }

  if (BLOCKED_HOSTNAMES.has(parsed.hostname)) {
    throw Object.assign(new Error('PRIVATE_HOST'), { code: 'PRIVATE_HOST' });
  }

  let addresses: { address: string }[];
  try {
    addresses = await dns.lookup(parsed.hostname, { all: true });
  } catch {
    throw Object.assign(new Error('DNS_FAILED'), { code: 'DNS_FAILED' });
  }

  for (const { address } of addresses) {
    if (PRIVATE_IP_RANGES.some((r) => r.test(address))) {
      throw Object.assign(new Error('PRIVATE_HOST'), { code: 'PRIVATE_HOST' });
    }
  }
}

async function fetchFollowingRedirects(
  url: string,
  hopsLeft = MAX_REDIRECTS,
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'Agenvik-Bot/1.0 (+https://agenvik.com)' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'manual',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('timeout') || msg.includes('aborted')) {
      throw Object.assign(new Error('FETCH_TIMEOUT'), {
        code: 'FETCH_TIMEOUT',
      });
    }
    throw Object.assign(new Error('FETCH_FAILED'), { code: 'FETCH_FAILED' });
  }

  if (res.status >= 300 && res.status < 400) {
    if (hopsLeft === 0) {
      throw Object.assign(new Error('FETCH_FAILED'), { code: 'FETCH_FAILED' });
    }
    const location = res.headers.get('location');
    if (!location) {
      throw Object.assign(new Error('FETCH_FAILED'), { code: 'FETCH_FAILED' });
    }
    const nextUrl = new URL(location, url).toString();
    await assertPublicUrl(nextUrl);
    return fetchFollowingRedirects(nextUrl, hopsLeft - 1);
  }

  return res;
}

export async function urlToText(
  rawUrl: string,
): Promise<{ text: string; title: string; charCount: number }> {
  await assertPublicUrl(rawUrl);

  const res = await fetchFollowingRedirects(rawUrl);

  if (!res.ok) {
    throw Object.assign(new Error(`HTTP_${res.status}`), {
      code: 'FETCH_FAILED',
      httpStatus: res.status,
    });
  }

  const contentLength = res.headers.get('content-length');
  if (
    contentLength &&
    Number.parseInt(contentLength, 10) > RESPONSE_BODY_LIMIT_BYTES
  ) {
    throw Object.assign(new Error('FETCH_FAILED'), { code: 'FETCH_FAILED' });
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (
    !contentType.includes('text/html') &&
    !contentType.includes('text/plain')
  ) {
    throw Object.assign(new Error('NOT_HTML'), { code: 'NOT_HTML' });
  }

  const html = await res.text();
  const root = htmlParse(html);

  // Remove noise elements
  for (const el of root.querySelectorAll(
    'script, style, nav, footer, header, noscript, [aria-hidden="true"]',
  )) {
    el.remove();
  }

  const title = root.querySelector('title')?.text.trim() ?? rawUrl;
  const text = (
    root.querySelector('main') ??
    root.querySelector('body') ??
    root
  ).text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, URL_MAX_TEXT_CHARS);

  return { text, title, charCount: text.length };
}
