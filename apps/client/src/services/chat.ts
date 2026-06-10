import axios from 'axios';
import type { ChannelSchema } from '@/types/ChannelSchema.ts';

/** Chat message endpoint — v2 pipeline */
export const baseUrl = `${import.meta.env.VITE_API_BASE}/chatv2`;

/** Channel config + domain validation — still served by v1 route */
const channelUrl = `${import.meta.env.VITE_API_BASE}/chat`;

export const getChannel = async (
  channelId: string,
  parentOrigin?: string,
): Promise<{ channel: ChannelSchema }> => {
  return (
    await axios.get(`${channelUrl}/channel`, {
      params: { channelId, ...(parentOrigin ? { parentOrigin } : {}) },
    })
  ).data;
};
