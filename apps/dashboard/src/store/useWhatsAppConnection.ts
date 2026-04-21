import { create } from 'zustand/react';

export interface WhatsAppPhoneNumber {
  phoneNumberId: string;
  displayPhone: string;
  boundToAgentId: string | null;
  agentName: string | null;
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
    boundToAgentId: string | null,
    agentName: string | null,
  ) => void;
  clearConnection: () => void;
}

export const useWhatsAppConnection = create<IWhatsAppConnectionState>((set) => ({
  connected: false,
  businessAccountId: null,
  phoneNumbers: [],

  setConnection: ({ businessAccountId, phoneNumbers }) =>
    set({ connected: true, businessAccountId, phoneNumbers }),

  updatePhoneBinding: (phoneNumberId, boundToAgentId, agentName) =>
    set((state) => ({
      phoneNumbers: state.phoneNumbers.map((p) =>
        p.phoneNumberId === phoneNumberId
          ? { ...p, boundToAgentId, agentName }
          : p,
      ),
    })),

  clearConnection: () =>
    set({ connected: false, businessAccountId: null, phoneNumbers: [] }),
}));
