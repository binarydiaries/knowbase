import { z } from 'zod';

export const conversationChannel = z.enum(['web', 'instagram', 'whatsapp']);
