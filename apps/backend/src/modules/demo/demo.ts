import { Elysia } from 'elysia';
import { DemoBookingModel } from './model';
import { DemoBookingService } from './service';

async function verifyCaptcha(token: string): Promise<boolean> {
  const secret = Bun.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // skip verification when key is not configured (local dev)

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }).toString(),
  });
  const data = (await res.json()) as { success: boolean; score?: number };
  return data.success && (data.score === undefined || data.score >= 0.5);
}

export const Demo = new Elysia({ prefix: '/demo', tags: ['Demo'] })
  .use(DemoBookingModel)
  .post(
    '/',
    async ({ body, set }) => {
      const { captchaToken, ...bookingData } = body;
      const valid = await verifyCaptcha(captchaToken);
      if (!valid) {
        set.status = 400;
        return { message: 'CAPTCHA verification failed' };
      }
      return DemoBookingService.create(bookingData);
    },
    { body: 'CreateDemoBookingSchema' },
  );
