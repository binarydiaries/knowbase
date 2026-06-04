import axios from 'axios';
import type { ChannelSchema } from '@/types/ChannelSchema.ts';

export const baseUrl = `${import.meta.env.VITE_API_BASE}/chat`;
export const baseUrlV2 = `${import.meta.env.VITE_API_BASE}/v2/chat`;

export const getChannel = async (
  channelId: string,
  parentOrigin?: string,
): Promise<{ channel: ChannelSchema }> => {
  return (
    await axios.get(`${baseUrl}/channel`, {
      params: { channelId, ...(parentOrigin ? { parentOrigin } : {}) },
    })
  ).data;
};
