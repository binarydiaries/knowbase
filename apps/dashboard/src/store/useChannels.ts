import { create } from 'zustand/react';
import type { ChannelSchema } from '@/services';

interface IChannelsState {
  channelsByAgentId: Record<string, ChannelSchema[]>;
  setChannels: (agentId: string, channels: ChannelSchema[]) => void;
  updateChannel: (agentId: string, data: Partial<ChannelSchema>) => void;
}

export const useChannels = create<IChannelsState>((set) => ({
  channelsByAgentId: {},

  setChannels: (agentId, channels) =>
    set((state) => ({
      channelsByAgentId: {
        ...state.channelsByAgentId,
        [agentId]: channels,
      },
    })),

  updateChannel: (agentId, data) =>
    set((state) => {
      const channels = state.channelsByAgentId[agentId];
      if (!channels) return state;

      return {
        channelsByAgentId: {
          ...state.channelsByAgentId,
          [agentId]: channels.map((channel) =>
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
