import { create } from 'zustand/react';

interface IInstagramConnectionState {
  connected: boolean;
  instagramAccountId: string | null;
  username: string | null;
  boundToAgentId: string | null;
  agentName: string | null;
  setConnection: (data: {
    instagramAccountId: string;
    username: string | null;
    boundToAgentId: string | null;
    agentName: string | null;
  }) => void;
  updateBinding: (boundToAgentId: string | null, agentName: string | null) => void;
  clearConnection: () => void;
}

export const useInstagramConnection = create<IInstagramConnectionState>((set) => ({
  connected: false,
  instagramAccountId: null,
  username: null,
  boundToAgentId: null,
  agentName: null,

  setConnection: ({ instagramAccountId, username, boundToAgentId, agentName }) =>
    set({ connected: true, instagramAccountId, username, boundToAgentId, agentName }),

  updateBinding: (boundToAgentId, agentName) =>
    set({ boundToAgentId, agentName }),

  clearConnection: () =>
    set({
      connected: false,
      instagramAccountId: null,
      username: null,
      boundToAgentId: null,
      agentName: null,
    }),
}));
