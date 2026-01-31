import { create } from 'zustand/react';

interface IDocumentsState {
  documentsByChatbotId: Record<string, any>;
}

const useBear = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
}));
