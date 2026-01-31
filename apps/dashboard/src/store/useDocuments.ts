import { create } from 'zustand/react';
import type { DocumentSchema } from '@/services';

interface IDocumentsState {
  documentsByChatbotId: Record<string, DocumentSchema[]>;
  setDocuments: (chatbotId: string, documents: DocumentSchema[]) => void;
  addUpdateDocument: (chatbotId: string, document: DocumentSchema) => void;
}

export const useDocuments = create<IDocumentsState>((set) => ({
  documentsByChatbotId: {},
  setDocuments: (chatbotId, documents) =>
    set((state) => ({
      documentsByChatbotId: {
        ...state.documentsByChatbotId,
        [chatbotId]: documents,
      },
    })),
  addUpdateDocument: (chatbotId, document) =>
    set((state) => ({
      documentsByChatbotId: {
        ...state.documentsByChatbotId,
        [chatbotId]: {
          ...state.documentsByChatbotId[chatbotId],
          document,
        },
      },
    })),
}));
