import { create } from 'zustand/react';
import type { ChannelSchema } from '@/services';

interface IChannelsState {
  channelsByChatbotId: Record<string, ChannelSchema[]>;

  setChannels: (chatbotId: string, channels: ChannelSchema[]) => void;

  patchChannel: (
    chatbotId: string,
    channelId: string,
    patch: Partial<ChannelSchema>,
  ) => void;
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

  /** ✅ PATCH a single channel */
  patchChannel: (chatbotId, channelId, patch) =>
    set((state) => {
      const channels = state.channelsByChatbotId[chatbotId];
      if (!channels) return state;

      return {
        channelsByChatbotId: {
          ...state.channelsByChatbotId,
          [chatbotId]: channels.map((channel) =>
            channel.id === channelId
              ? {
                  ...channel,
                  ...patch,
                  additional: {
                    ...channel.additional,
                    ...(patch.additional ?? {}),
                  },
                }
              : channel,
          ),
        },
      };
    }),
}));
