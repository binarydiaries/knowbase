import { create } from 'zustand/react';

export interface BehaviourConfig {
  systemPrompt: string;
  tone: 'friendly' | 'professional' | 'neutral';
  verbosity: 'short' | 'balanced' | 'detailed';
  fallbackMessage: string;
  guardrails?: string;
}

interface IBehaviourState {
  behaviourByChatbotId: Record<string, BehaviourConfig | undefined>;

  setBehaviour: (chatbotId: string, behaviour: BehaviourConfig) => void;

  patchBehaviour: (
    chatbotId: string,
    behaviour: Partial<BehaviourConfig>,
  ) => void;
}

export const useBehaviour = create<IBehaviourState>((set) => ({
  behaviourByChatbotId: {},

  /* 📥 Set full behaviour from backend */
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
