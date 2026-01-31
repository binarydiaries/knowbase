import { create } from 'zustand/react';
import type { ChannelSchema } from '@/services';

interface IChannelsState {
  channelsByChatbotId: Record<string, ChannelSchema[]>;
  setChannels: (chatbotId: string, channels: ChannelSchema[]) => void;
}

export const useChannels = create<IChannelsState>((set) => ({
  channelsByChatbotId: {},
  setChannels: (chatbotId, channels) =>
    set((state) => ({
      channelsByChatbotId: {
        ...state.channelsByChatbotId,
        [chatbotId]: channels,
      },
    })),
}));
