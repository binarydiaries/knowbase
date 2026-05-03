import { create } from 'zustand/react';

export interface SlackChannel {
  slackChannelId: string;
  slackChannelName: string;
  boundToAgentId: string | null;
  agentName: string | null;
}

interface ISlackConnectionState {
  connected: boolean;
  teamName: string | null;
  slackChannels: SlackChannel[];
  setConnection: (data: { teamName: string; channels: SlackChannel[] }) => void;
  updateChannelBinding: (
    slackChannelId: string,
    boundToAgentId: string | null,
    agentName: string | null,
  ) => void;
  clearConnection: () => void;
}

export const useSlackConnection = create<ISlackConnectionState>((set) => ({
  connected: false,
  teamName: null,
  slackChannels: [],

  setConnection: ({ teamName, channels }) =>
    set({ connected: true, teamName, slackChannels: channels }),

  updateChannelBinding: (slackChannelId, boundToAgentId, agentName) =>
    set((state) => ({
      slackChannels: state.slackChannels.map((c) =>
        c.slackChannelId === slackChannelId
          ? { ...c, boundToAgentId, agentName }
          : c,
      ),
    })),

  clearConnection: () =>
    set({ connected: false, teamName: null, slackChannels: [] }),
}));
