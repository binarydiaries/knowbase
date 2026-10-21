import { afterAll, beforeAll, expect, test } from 'bun:test';
import { createHmac } from 'node:crypto';
import { verifySlackSignature } from '../src/modules/slack/signature';
import { createWhatsAppWebhook } from '../src/modules/whatsapp/webhook';

const secret = 'synthetic-webhook-secret';
let previous: string | undefined;
beforeAll(() => {
  previous = process.env.WHATSAPP_APP_SECRET;
  process.env.WHATSAPP_APP_SECRET = secret;
});
afterAll(() => {
  if (previous === undefined) delete process.env.WHATSAPP_APP_SECRET;
  else process.env.WHATSAPP_APP_SECRET = previous;
});

test('WhatsApp checks exact raw bytes before dispatch and rejects unsigned or tampered events', async () => {
  const received: unknown[] = [];
  const app = createWhatsAppWebhook(async (payload) => {
    received.push(payload);
  });
  const body = '{ "object": "whatsapp_business_account", "text": "héllo" }';
  const sig = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  const send = (text: string, signature?: string) =>
    app.handle(
      new Request('http://localhost/webhook/whatsapp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(signature ? { 'x-hub-signature-256': signature } : {}),
        },
        body: text,
      }),
    );
  expect((await send(body)).status).toBe(403);
  expect((await send(body, 'sha256=bad')).status).toBe(403);
  expect((await send(`${body} `, sig)).status).toBe(403);
  expect(received).toHaveLength(0);
  expect((await send(body, sig)).status).toBe(200);
  expect(received).toEqual([JSON.parse(body)]);
  delete process.env.WHATSAPP_APP_SECRET;
  expect((await send(body, sig)).status).toBe(403);
  process.env.WHATSAPP_APP_SECRET = secret;
});

test('Slack rejects altered bytes, stale/future timestamps, and malformed signatures', () => {
  const now = 1_800_000_000_000;
  const ts = String(now / 1000);
  const body = '{"type":"event_callback"}';
  const sign = (timestamp: string) =>
    `v0=${createHmac('sha256', secret).update(`v0:${timestamp}:${body}`).digest('hex')}`;
  expect(verifySlackSignature(sign(ts), ts, body, secret, now)).toBe(true);
  expect(verifySlackSignature(sign(ts), ts, `${body} `, secret, now)).toBe(
    false,
  );
  for (const offset of [-301, 301]) {
    const other = String(Number(ts) + offset);
    expect(verifySlackSignature(sign(other), other, body, secret, now)).toBe(
      false,
    );
  }
  expect(verifySlackSignature('v0=bad', ts, body, secret, now)).toBe(false);
});
