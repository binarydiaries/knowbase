import { create } from 'zustand/react';
import type { ChannelSchema } from '@/services';

interface IChannelsState {
  channelsByChatbotId: Record<string, ChannelSchema[]>;
  setChannels: (chatbotId: string, channels: ChannelSchema[]) => void;
  updateChannel: (chatbotId: string, data: Partial<ChannelSchema>) => void;
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

  updateChannel: (chatbotId, data) =>
    set((state) => {
      const channels = state.channelsByChatbotId[chatbotId];
      if (!channels) return state;

      return {
        channelsByChatbotId: {
          ...state.channelsByChatbotId,
          [chatbotId]: channels.map((channel) =>
            channel.id === data.id
              ? {
                  ...channel,
                  ...data,
                  additional: {
                    ...channel.additional,
                    ...(data.additional ?? {}),
                  },
                }
              : channel,
          ),
        },
      };
    }),
}));
