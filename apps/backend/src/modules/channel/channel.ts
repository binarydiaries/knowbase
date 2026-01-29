import { Elysia } from 'elysia';

export const channel = new Elysia({
  prefix: '/channels',
  tags: ['Channel'],
});
