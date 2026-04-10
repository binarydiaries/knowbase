import { create } from 'zustand/react';

export interface WhatsAppPhoneNumber {
  phoneNumberId: string;
  displayPhone: string;
  boundToChatbotId: string | null;
  chatbotName: string | null;
}

interface IWhatsAppConnectionState {
  connected: boolean;
  businessAccountId: string | null;
  phoneNumbers: WhatsAppPhoneNumber[];
  setConnection: (data: {
    businessAccountId: string;
    phoneNumbers: WhatsAppPhoneNumber[];
  }) => void;
  updatePhoneBinding: (
    phoneNumberId: string,
    boundToChatbotId: string | null,
    chatbotName: string | null,
  ) => void;
  clearConnection: () => void;
}

export const useWhatsAppConnection = create<IWhatsAppConnectionState>((set) => ({
  connected: false,
  businessAccountId: null,
  phoneNumbers: [],

  setConnection: ({ businessAccountId, phoneNumbers }) =>
    set({ connected: true, businessAccountId, phoneNumbers }),

  updatePhoneBinding: (phoneNumberId, boundToChatbotId, chatbotName) =>
    set((state) => ({
      phoneNumbers: state.phoneNumbers.map((p) =>
        p.phoneNumberId === phoneNumberId
          ? { ...p, boundToChatbotId, chatbotName }
          : p,
      ),
    })),

  clearConnection: () =>
    set({ connected: false, businessAccountId: null, phoneNumbers: [] }),
}));
