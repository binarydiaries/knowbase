import { create } from 'zustand/react';

interface IInstagramConnectionState {
  connected: boolean;
  pageId: string | null;
  instagramAccountId: string | null;
  username: string | null;
  boundToChatbotId: string | null;
  chatbotName: string | null;
  setConnection: (data: {
    pageId: string;
    instagramAccountId: string;
    username: string | null;
    boundToChatbotId: string | null;
    chatbotName: string | null;
  }) => void;
  updateBinding: (
    boundToChatbotId: string | null,
    chatbotName: string | null,
  ) => void;
  clearConnection: () => void;
}

export const useInstagramConnection = create<IInstagramConnectionState>(
  (set) => ({
    connected: false,
    pageId: null,
    instagramAccountId: null,
    username: null,
    boundToChatbotId: null,
    chatbotName: null,

    setConnection: ({
      pageId,
      instagramAccountId,
      username,
      boundToChatbotId,
      chatbotName,
    }) =>
      set({
        connected: true,
        pageId,
        instagramAccountId,
        username,
        boundToChatbotId,
        chatbotName,
      }),

    updateBinding: (boundToChatbotId, chatbotName) =>
      set({ boundToChatbotId, chatbotName }),

    clearConnection: () =>
      set({
        connected: false,
        pageId: null,
        instagramAccountId: null,
        username: null,
        boundToChatbotId: null,
        chatbotName: null,
      }),
  }),
);
