import { create } from 'zustand/react';
import type { BehaviourSchema } from '@/services';

interface IBehaviourState {
  behaviourByChatbotId: Record<string, BehaviourSchema>;
  setBehaviour: (chatbotId: string, behaviour: BehaviourSchema) => void;
  updateBehaviour: (
    chatbotId: string,
    behaviour: Partial<BehaviourSchema>,
  ) => void;
}

export const useBehaviour = create<IBehaviourState>((set) => ({
  behaviourByChatbotId: {},

  setBehaviour: (chatbotId, behaviour) =>
    set((state) => ({
      behaviourByChatbotId: {
        ...state.behaviourByChatbotId,
        [chatbotId]: behaviour,
      },
    })),

  updateBehaviour: (chatbotId, behaviour) =>
    set((state) => {
      const existing = state.behaviourByChatbotId[chatbotId];

      return {
        behaviourByChatbotId: {
          ...state.behaviourByChatbotId,
          [chatbotId]: {
            ...(existing ?? {}),
            ...behaviour,
          },
        },
      };
    }),
}));
