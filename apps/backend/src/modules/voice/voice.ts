import { Elysia, t } from 'elysia';
import { VoiceService } from './service';

export const Voice = new Elysia({ prefix: '/voice' }).ws('/session', {
  query: t.Object({
    channelId: t.String(),
    orgId: t.String(),
    conversationId: t.String(),
  }),
  body: t.Any(),
  async open(ws) {
    await VoiceService.open(ws).catch((err) => {
      console.error('[voice] open error:', err);
      try { ws.close(); } catch {}
    });
  },
  message(ws, message) {
    VoiceService.message(ws, message);
  },
  close(ws) {
    VoiceService.close(ws);
  },
});
