import { create } from 'zustand/react';
import type { DocumentSchema } from '@/services';

interface IDocumentsState {
  documentsByChatbotId: Record<string, DocumentSchema[]>;
  setDocuments: (chatbotId: string, documents: DocumentSchema[]) => void;
  addUpdateDocument: (
    chatbotId: string,
    document: Partial<DocumentSchema>,
  ) => void;
  deleteDocument: (chatbotId: string, documentId: string) => void;
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
    set((state) => {
      const docs = state.documentsByChatbotId[chatbotId] ?? [];
      const index = docs.findIndex((d) => d.id === document.id);

      if (index === -1) {
        return {
          documentsByChatbotId: {
            ...state.documentsByChatbotId,
            [chatbotId]: [{ ...docs[index], ...document }, ...docs],
          },
        };
      }

      return {
        documentsByChatbotId: {
          ...state.documentsByChatbotId,
          [chatbotId]: docs.map((d) =>
            d.id === document.id ? { ...d, ...document } : d,
          ),
        },
      };
    }),
  deleteDocument: (chatbotId, documentId) =>
    set((state) => ({
      documentsByChatbotId: {
        ...state.documentsByChatbotId,
        [chatbotId]:
          state.documentsByChatbotId[chatbotId]?.filter(
            (document) => document.id !== documentId,
          ) ?? [],
      },
    })),
}));
