import { Elysia } from 'elysia';
import { verifyWhatsAppSignature } from './signature';

export function createWhatsAppWebhook(
  dispatch: (payload: unknown) => Promise<void>,
) {
  return new Elysia().post(
    '/webhook/whatsapp',
    async ({ request, status }) => {
      const bytes = new Uint8Array(await request.arrayBuffer());
      if (
        !verifyWhatsAppSignature(
          bytes,
          request.headers.get('x-hub-signature-256'),
          process.env.WHATSAPP_APP_SECRET,
        )
      ) {
        return status(403, { code: 'FORBIDDEN', message: 'Invalid signature' });
      }
      let payload: unknown;
      try {
        payload = JSON.parse(new TextDecoder().decode(bytes));
      } catch {
        return status(400, { code: 'BAD_REQUEST', message: 'Invalid JSON' });
      }
      // Dispatch owns error logging and acknowledgement timing; only authenticated bytes reach it.
      void dispatch(payload);
      return new Response('OK');
    },
    { parse: 'none' },
  );
}
