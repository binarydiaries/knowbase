import { Button } from '@knowbase/ui/components/button';
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
import { useMutation } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { ArrowUpRightIcon, FolderIcon } from 'lucide-react';
import { useState } from 'react';
import { DocumentItem } from '@/components/DocumentItem/DocumentItem.tsx';
import { type DocumentSchema, deleteDocumentsById } from '@/services';
import { useDocuments } from '@/store/useDocuments.ts';
import { AddDocumentDropdown } from '@/widgets/DocumentsWidget/AddDocumentDropdown.tsx';
import { QAContentWidget } from '@/widgets/QAContentWidget/QAContentWidget.tsx';
import { TextContentWidget } from '@/widgets/TextContentWidget/TextContentWidget.tsx';

export const DocumentsWidget = () => {
  const { chatbotId } = useParams({ strict: false });
  const { documentsByChatbotId, deleteDocument } = useDocuments();

  if (!chatbotId) {
    throw 'Not chatbot id';
  }

  const documents = documentsByChatbotId[chatbotId] || [];
  const [isTextContentSheetOpen, setIsTextContentSheetOpen] = useState(false);
  const [isQASheetOpen, setIsQASheetOpen] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState<DocumentSchema>();

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
  });

  const isDocumentsAvailable = !!documents?.length;
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className={'text-xl'}>Knowledge Sources</CardTitle>
          <CardDescription>
            Your chatbot will only answer based on the sources you add here.
          </CardDescription>
          <CardAction>
            <AddDocumentDropdown
              onTextClick={() => setIsTextContentSheetOpen(true)}
              onQaClick={() => setIsQASheetOpen(true)}
            >
              <Button variant="outline">Add</Button>
            </AddDocumentDropdown>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              type={doc.content.type}
              title={doc.title}
              status={doc.status}
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
                <Button>Add Source</Button>
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
            onClose={() => setIsTextContentSheetOpen(false)}
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
            onClose={() => setIsQASheetOpen(false)}
          />
        )}
      </Sheet>
    </>
  );
};
