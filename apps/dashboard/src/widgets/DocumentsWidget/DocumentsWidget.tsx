import { Button } from '@knowbase/ui/components/button';
import { toast } from '@knowbase/ui/components/sonner';
import { Alert, AlertDescription, AlertTitle } from '@knowbase/ui/components/alert';
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@knowbase/ui/components/hover-card';
import { Sheet } from '@knowbase/ui/components/sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import {
  CHATBOT_LOCK_TOOLTIP,
  DisabledTooltip,
  KNOWLEDGE_SOURCE_LIMIT_TOOLTIP,
  TRAINING_LIMIT_TOOLTIP,
} from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import { UsageMeter } from '@/components/UsageMeter/UsageMeter.tsx';
import { useDocuments } from '@/store/useDocuments.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';
import { AddDocumentDropdown } from '@/widgets/DocumentsWidget/AddDocumentDropdown.tsx';
import { QAContentWidget } from '@/widgets/QAContentWidget/QAContentWidget.tsx';
import { TextContentWidget } from '@/widgets/TextContentWidget/TextContentWidget.tsx';
import type { SubscriptionStatusSchema } from '@/services';

export const DocumentsWidget = ({
  readOnly = false,
  subscription,
}: {
  readOnly?: boolean;
  subscription?: SubscriptionStatusSchema;
}) => {
  const { chatbotId } = useParams({ strict: false });
  const { documentsByChatbotId, deleteDocument, addUpdateDocument } =
    useDocuments();
  const queryClient = useQueryClient();
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
  const hasReachedKnowledgeSourceLimit =
    subscription?.hasReachedKnowledgeSourceLimit ?? false;
  const hasReachedTrainingLimit =
    subscription?.hasReachedTrainingRunsPerDayLimit ?? false;
  const trainingResetLabel = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(Date.UTC(2024, 0, 2, 0, 0, 0)));
  const isAddDisabled = readOnly || hasReachedKnowledgeSourceLimit;
  const isTrainDisabled = readOnly || hasReachedTrainingLimit;
  const addDisabledReason = readOnly
    ? CHATBOT_LOCK_TOOLTIP
    : KNOWLEDGE_SOURCE_LIMIT_TOOLTIP;
  const trainDisabledReason = readOnly
    ? CHATBOT_LOCK_TOOLTIP
    : TRAINING_LIMIT_TOOLTIP;

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
    onSuccess: ({ documentId }) => {
      deleteDocument(chatbotId, documentId);
      queryClient.invalidateQueries({ queryKey: ['chatbot', chatbotId] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const trainMutation = useMutation({
    mutationFn: () => postIndexing({ body: { chatbotId } }),
    onSuccess: () => {
      setIsPollingActive(true);
      queryClient.invalidateQueries({ queryKey: ['chatbot', chatbotId] });
    },
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
          {(isDocumentsAvailable || subscription) && (
            <CardAction className="flex gap-2">
              {subscription ? (
                <HoverCard openDelay={100} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <a
                      href="#usage"
                      onClick={(e) => e.preventDefault()}
                      className="inline-flex items-center text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      Usage
                    </a>
                  </HoverCardTrigger>
                  <HoverCardContent align="end" className="w-80 space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Usage</p>
                      <p className="text-sm text-muted-foreground">
                        Track your knowledge source and daily training limits.
                      </p>
                    </div>
                    <UsageMeter
                      label="Knowledge Sources"
                      current={subscription.knowledgeSourceCount}
                      limit={subscription.knowledgeSourceLimit}
                    />
                    <UsageMeter
                      label="Daily Training"
                      current={subscription.trainingRunsToday}
                      limit={subscription.trainingRunsPerDayLimit}
                      helperText={`Resets daily at ${trainingResetLabel}.`}
                    />
                  </HoverCardContent>
                </HoverCard>
              ) : null}
              {isDocumentsAvailable && (
                <>
                  <DisabledTooltip
                    disabled={isTrainDisabled}
                    content={trainDisabledReason}
                  >
                    <Button
                      onClick={() => trainMutation.mutate()}
                      disabled={isTrainDisabled || trainMutation.isPending}
                    >
                      Train
                    </Button>
                  </DisabledTooltip>
                  {!isAddDisabled ? (
                    <AddDocumentDropdown
                      onTextClick={() => setIsTextContentSheetOpen(true)}
                      onQaClick={() => setIsQASheetOpen(true)}
                    >
                      <Button variant="outline">Add</Button>
                    </AddDocumentDropdown>
                  ) : (
                    <DisabledTooltip
                      content={addDisabledReason}
                      disabled
                    >
                      <Button variant="outline" disabled>
                        Add
                      </Button>
                    </DisabledTooltip>
                  )}
                </>
              )}
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {hasReachedKnowledgeSourceLimit && !readOnly ? (
            <Alert>
              <AlertTitle>Knowledge source limit reached</AlertTitle>
              <AlertDescription>
                Delete knowledge sources or upgrade your subscription to add
                more.
              </AlertDescription>
            </Alert>
          ) : null}

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
              disabledReason={CHATBOT_LOCK_TOOLTIP}
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
                {!readOnly ? (
                  !hasReachedKnowledgeSourceLimit ? (
                    <AddDocumentDropdown
                      onTextClick={() => setIsTextContentSheetOpen(true)}
                      onQaClick={() => setIsQASheetOpen(true)}
                    >
                      <Button>Add Source</Button>
                    </AddDocumentDropdown>
                  ) : (
                    <DisabledTooltip
                      content={KNOWLEDGE_SOURCE_LIMIT_TOOLTIP}
                      disabled
                    >
                      <Button disabled>Add Source</Button>
                    </DisabledTooltip>
                  )
                ) : (
                  <DisabledTooltip
                    content={CHATBOT_LOCK_TOOLTIP}
                    disabled
                  >
                    <Button disabled>Add Source</Button>
                  </DisabledTooltip>
                )}
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
