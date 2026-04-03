import { Button } from '@knowbase/ui/components/button';
import { toast } from '@knowbase/ui/components/sonner';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@knowbase/ui/components/empty';
import { Sheet } from '@knowbase/ui/components/sheet';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { ArrowUpRightIcon, FolderIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DocumentItem } from '@/components/DocumentItem/DocumentItem.tsx';
import {
  type DocumentSchema,
  deleteDocumentsById,
  getIndexingStatus,
  postIndexing,
} from '@/services';
import { useDocuments } from '@/store/useDocuments.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';
import { AddDocumentDropdown } from '@/widgets/DocumentsWidget/AddDocumentDropdown.tsx';
import { QAContentWidget } from '@/widgets/QAContentWidget/QAContentWidget.tsx';
import { TextContentWidget } from '@/widgets/TextContentWidget/TextContentWidget.tsx';

export const DocumentsWidget = ({ readOnly = false }: { readOnly?: boolean }) => {
  const { chatbotId } = useParams({ strict: false });
  const { documentsByChatbotId, deleteDocument, addUpdateDocument } =
    useDocuments();
  const [isTextContentSheetOpen, setIsTextContentSheetOpen] = useState(false);
  const [isQASheetOpen, setIsQASheetOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentSchema>();
  const [isPollingActive, setIsPollingActive] = useState(true);

  if (!chatbotId) {
    throw 'Not chatbot id';
  }

  const documents = (documentsByChatbotId[chatbotId] || []).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const isEdit = !!selectedDocument;

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDocumentsById({
        path: {
          id,
        },
      });
      return {
        documentId: id,
      };
    },
    onSuccess: ({ documentId }) => deleteDocument(chatbotId, documentId),
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const trainMutation = useMutation({
    mutationFn: () => postIndexing({ body: { chatbotId } }),
    onSuccess: () => setIsPollingActive(true),
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const indexStatusQuery = useQuery({
    queryFn: () => getIndexingStatus({ query: { chatbotId } }),
    queryKey: ['indexStatus', chatbotId],
    enabled: isPollingActive,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (indexStatusQuery.data?.data) {
      setIsPollingActive(indexStatusQuery.data?.data.isPollingActive);
      indexStatusQuery.data.data.documentIds?.forEach((value) => {
        addUpdateDocument(chatbotId, value);
      });
    }
  }, [addUpdateDocument, chatbotId, indexStatusQuery?.data?.data]);

  const isDocumentsAvailable = !!documents?.length;
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className={'text-xl'}>Knowledge Sources</CardTitle>
          <CardDescription>
            Your chatbot will only answer based on the sources you add here.
          </CardDescription>
          {isDocumentsAvailable && (
            <CardAction className="flex gap-2">
              <Button
                onClick={() => trainMutation.mutate()}
                disabled={readOnly || trainMutation.isPending}
              >
                Train
              </Button>
              <AddDocumentDropdown
                onTextClick={() => setIsTextContentSheetOpen(true)}
                onQaClick={() => setIsQASheetOpen(true)}
                disabled={readOnly}
              >
                <Button variant="outline" disabled={readOnly}>
                  Add
                </Button>
              </AddDocumentDropdown>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              type={doc.content.type}
              title={doc.title}
              status={doc.status}
              lastTrainedAt={doc.lastTrainedAt}
              description={
                doc.content?.type === 'qna'
                  ? `${doc.content.data.length} questions`
                  : String(doc.content?.data)
              }
              onEdit={() => {
                setSelectedDocument(doc);
                if (doc.content.type === 'text') {
                  setIsTextContentSheetOpen(true);
                } else {
                  setIsQASheetOpen(true);
                }
              }}
              onDelete={(e) => {
                e.stopPropagation();
                deleteDocumentMutation.mutate(doc.id);
              }}
              readOnly={readOnly}
            />
          ))}

          {!isDocumentsAvailable && (
            <Empty className="md:py-5">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderIcon />
                </EmptyMedia>
                <EmptyTitle>No Knowledge Sources Yet</EmptyTitle>
                <EmptyDescription>
                  Add documents, links, or text to help your chatbot answer
                  questions accurately.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="flex-row justify-center gap-2">
                <AddDocumentDropdown
                  onTextClick={() => setIsTextContentSheetOpen(true)}
                  onQaClick={() => setIsQASheetOpen(true)}
                  disabled={readOnly}
                >
                  <Button disabled={readOnly}>Add Source</Button>
                </AddDocumentDropdown>
              </EmptyContent>
              <Button
                variant="link"
                asChild
                className="text-muted-foreground"
                size="sm"
              >
                <a href="http://help.com">
                  Learn More <ArrowUpRightIcon />
                </a>
              </Button>
            </Empty>
          )}
        </CardContent>
      </Card>
      <Sheet
        open={isTextContentSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDocument(undefined);
          }
          setIsTextContentSheetOpen(open);
        }}
      >
        {isTextContentSheetOpen && (
          <TextContentWidget
            mode={isEdit ? 'edit' : 'add'}
            document={selectedDocument}
            onClose={() => {
              setIsTextContentSheetOpen(false);
              setSelectedDocument(undefined);
            }}
            readOnly={readOnly}
          />
        )}
      </Sheet>
      <Sheet
        open={isQASheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDocument(undefined);
          }
          setIsQASheetOpen(open);
        }}
      >
        {isQASheetOpen && (
          <QAContentWidget
            mode={isEdit ? 'edit' : 'add'}
            document={selectedDocument}
            onClose={() => {
              setIsQASheetOpen(false);
              setSelectedDocument(undefined);
            }}
            readOnly={readOnly}
          />
        )}
      </Sheet>
    </>
  );
};
