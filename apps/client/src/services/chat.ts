import axios from 'axios';
import type { ChannelSchema } from '@/types/ChannelSchema.ts';

export const baseUrl = 'http://localhost:3000/chat';

export const getChannel = async (
  channelId: string,
): Promise<{ channel: ChannelSchema }> => {
  return (
    await axios.get(`${baseUrl}/channel`, {
      params: { channelId },
    })
  ).data;
};
