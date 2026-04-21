import { create } from 'zustand/react';
import type { DocumentSchema } from '@/services';

interface IDocumentsState {
  documentsByAgentId: Record<string, DocumentSchema[]>;
  setDocuments: (agentId: string, documents: DocumentSchema[]) => void;
  addUpdateDocument: (
    agentId: string,
    document: Partial<DocumentSchema>,
  ) => void;
  deleteDocument: (agentId: string, documentId: string) => void;
}

export const useDocuments = create<IDocumentsState>((set) => ({
  documentsByAgentId: {},
  setDocuments: (agentId, documents) =>
    set((state) => ({
      documentsByAgentId: {
        ...state.documentsByAgentId,
        [agentId]: documents,
      },
    })),
  addUpdateDocument: (agentId, document) =>
    set((state) => {
      const docs = state.documentsByAgentId[agentId] ?? [];
      const index = docs.findIndex((d) => d.id === document.id);

      if (index === -1) {
        return {
          documentsByAgentId: {
            ...state.documentsByAgentId,
            [agentId]: [document as DocumentSchema, ...docs],
          },
        };
      }

      return {
        documentsByAgentId: {
          ...state.documentsByAgentId,
          [agentId]: docs.map((d) =>
            d.id === document.id ? { ...d, ...document } : d,
          ),
        },
      };
    }),
  deleteDocument: (agentId, documentId) =>
    set((state) => ({
      documentsByAgentId: {
        ...state.documentsByAgentId,
        [agentId]:
          state.documentsByAgentId[agentId]?.filter(
            (document) => document.id !== documentId,
          ) ?? [],
      },
    })),
}));
