import { create } from 'zustand/react';

export interface IBehaviourConfig {
  systemPrompt: string;
  tone: 'friendly' | 'professional' | 'neutral';
  verbosity: 'short' | 'balanced' | 'detailed';
  fallbackMessage: string;
  guardrails?: string;
}

interface IBehaviourState {
  behaviourByChatbotId: Record<string, IBehaviourConfig>;
  setBehaviour: (chatbotId: string, behaviour: IBehaviourConfig) => void;
  patchBehaviour: (
    chatbotId: string,
    behaviour: Partial<IBehaviourConfig>,
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

  /* ✏️ Patch behaviour safely */
  patchBehaviour: (chatbotId, behaviour) =>
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
