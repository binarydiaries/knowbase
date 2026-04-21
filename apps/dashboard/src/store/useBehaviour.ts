import { create } from 'zustand/react';
import type { BehaviourSchema } from '@/services';

interface IBehaviourState {
  behaviourByAgentId: Record<string, BehaviourSchema>;
  setBehaviour: (agentId: string, behaviour: BehaviourSchema) => void;
  updateBehaviour: (
    agentId: string,
    behaviour: Partial<BehaviourSchema>,
  ) => void;
}

export const useBehaviour = create<IBehaviourState>((set) => ({
  behaviourByAgentId: {},

  setBehaviour: (agentId, behaviour) =>
    set((state) => ({
      behaviourByAgentId: {
        ...state.behaviourByAgentId,
        [agentId]: behaviour,
      },
    })),

  updateBehaviour: (agentId, behaviour) =>
    set((state) => {
      const existing = state.behaviourByAgentId[agentId];

      return {
        behaviourByAgentId: {
          ...state.behaviourByAgentId,
          [agentId]: {
            ...(existing ?? {}),
            ...behaviour,
          },
        },
      };
    }),
}));
