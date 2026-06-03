import { Elysia } from 'elysia';
import { z } from 'zod';
import { BehaviourSchema, UpdateBehaviourBody } from '@knowbase/models/schemas';

export { BehaviourSchema, UpdateBehaviourBody };

const OneBehaviourResponse = z.object({ behaviour: BehaviourSchema });
const ManyBehaviourResponse = z.object({ behaviours: z.array(BehaviourSchema) });

export const BehaviourModel = new Elysia().model({
  UpdateBehaviourBody,
  OneBehaviourResponse,
  ManyBehaviourResponse,
  BehaviourSchema,
});
