import { Elysia } from 'elysia';
import { DemoBookingModel } from './model';
import { DemoBookingService } from './service';

export const Demo = new Elysia({ prefix: '/demo', tags: ['Demo'] })
  .use(DemoBookingModel)
  .post('/', ({ body }) => DemoBookingService.create(body), {
    body: 'CreateDemoBookingSchema',
  });
