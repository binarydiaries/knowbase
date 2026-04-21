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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@knowbase/ui/components/dialog';
import { Sheet } from '@knowbase/ui/components/sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { FolderIcon } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { DocumentItem } from '@/components/DocumentItem/DocumentItem.tsx';
import {
  type DocumentSchema,
  deleteDocumentsById,
  getIndexingStatus,
  postIndexing,
} from '@/services';
import {
  AGENT_LOCK_TOOLTIP,
  DisabledTooltip,
  KNOWLEDGE_SOURCE_LIMIT_TOOLTIP,
  NO_READY_TRAINING_TOOLTIP,
  TRAINING_LIMIT_TOOLTIP,
} from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import { UsageMeter } from '@/components/UsageMeter/UsageMeter.tsx';
import { useDocuments } from '@/store/useDocuments.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';
import { AddDocumentDropdown } from '@/widgets/DocumentsWidget/AddDocumentDropdown.tsx';
import { QAContentWidget } from '@/widgets/QAContentWidget/QAContentWidget.tsx';
import { TextContentWidget } from '@/widgets/TextContentWidget/TextContentWidget.tsx';
import type { SubscriptionStatusSchema } from '@/services';

dayjs.extend(utc);

export const DocumentsWidget = ({
  readOnly = false,
  subscription,
}: {
  readOnly?: boolean;
  subscription?: SubscriptionStatusSchema;
}) => {
  const posthog = usePostHog();
  const { agentId } = useParams({ strict: false });
  const { documentsByAgentId, deleteDocument, addUpdateDocument } =
    useDocuments();
  const queryClient = useQueryClient();
  const [isTextContentSheetOpen, setIsTextContentSheetOpen] = useState(false);
  const [isQASheetOpen, setIsQASheetOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentSchema>();
  const [isPollingActive, setIsPollingActive] = useState(true);
  const [isTrainDialogOpen, setIsTrainDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!agentId) {
    throw new Error('agentId not available');
  }

  const documents = (documentsByAgentId[agentId] || []).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const isEdit = !!selectedDocument;
  const hasReachedKnowledgeSourceLimit =
    subscription?.hasReachedKnowledgeSourceLimit ?? false;
  const hasReachedTrainingLimit =
    subscription?.hasReachedTrainingRunsPerDayLimit ?? false;
  const hasReadyDocuments = documents.some((document) => document.status === 'ready');
  const nextUtcMidnight = dayjs.utc().add(1, 'day').startOf('day').local();
  const nextUtcMonth = dayjs.utc().add(1, 'month').startOf('month').local();
  const trainingResetLabel = nextUtcMidnight.format('h:mm A');
  const monthlyResetLabel = nextUtcMonth.format('MMM D, h:mm A');
  const isAddDisabled = readOnly || hasReachedKnowledgeSourceLimit;
  const isTrainDisabled =
    readOnly || hasReachedTrainingLimit || !hasReadyDocuments;
  const addDisabledReason = readOnly
    ? AGENT_LOCK_TOOLTIP
    : KNOWLEDGE_SOURCE_LIMIT_TOOLTIP;
  const trainDisabledReason = readOnly
    ? AGENT_LOCK_TOOLTIP
    : hasReachedTrainingLimit
      ? TRAINING_LIMIT_TOOLTIP
      : NO_READY_TRAINING_TOOLTIP;
  const runsRemainingToday = Math.max(
    (subscription?.trainingRunsPerDayLimit ?? 0) -
      (subscription?.trainingRunsToday ?? 0),
    0,
  );

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
      posthog.capture('knowledge_source_deleted', {
        agent_id: agentId,
        document_id: documentId,
      });
      deleteDocument(agentId, documentId);
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const trainMutation = useMutation({
    mutationFn: () => postIndexing({ body: { agentId } }),
    onSuccess: ({ data }) => {
      if (data.status === 'no_documents_ready') {
        toast.info(data.message);
        setIsTrainDialogOpen(false);
        return;
      }

      posthog.capture('agent_training_started', {
        agent_id: agentId,
        documents_count: documents.filter((d) => d.status === 'ready').length,
      });
      setIsPollingActive(true);
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      setIsTrainDialogOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const indexStatusQuery = useQuery({
    queryFn: () => getIndexingStatus({ query: { agentId } }),
    queryKey: ['indexStatus', agentId],
    enabled: isPollingActive,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (indexStatusQuery.data?.data) {
      setIsPollingActive(indexStatusQuery.data?.data.isPollingActive);
      indexStatusQuery.data.data.documentIds?.forEach((value) => {
        addUpdateDocument(agentId, value);
      });
    }
  }, [addUpdateDocument, agentId, indexStatusQuery?.data?.data]);

  const isDocumentsAvailable = !!documents?.length;
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className={'text-xl'}>Knowledge Sources</CardTitle>
          <CardDescription>
            Your agent will only answer based on the sources you add here.
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
                        Track your knowledge source, monthly message, and daily
                        training limits.
                      </p>
                    </div>
                    <UsageMeter
                      label="Knowledge Sources"
                      current={subscription.knowledgeSourceCount}
                      limit={subscription.knowledgeSourceLimit}
                    />
                    <UsageMeter
                      label="Monthly Messages"
                      current={subscription.messagesThisMonth}
                      limit={subscription.messagesPerMonthLimit}
                      helperText={`Resets monthly on ${monthlyResetLabel}.`}
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
                      onClick={() => setIsTrainDialogOpen(true)}
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
                setDeleteConfirmId(doc.id);
              }}
              readOnly={readOnly}
              disabledReason={AGENT_LOCK_TOOLTIP}
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
                  Add documents, links, or text to help your agent answer
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
                    content={AGENT_LOCK_TOOLTIP}
                    disabled
                  >
                    <Button disabled>Add Source</Button>
                  </DisabledTooltip>
                )}
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </Card>
      <Dialog open={isTrainDialogOpen} onOpenChange={setIsTrainDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start training?</DialogTitle>
            <DialogDescription>
              Training will queue all ready knowledge sources for this agent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium capitalize">
                {subscription?.plan}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Daily limit</span>
              <span className="font-medium">
                {subscription?.trainingRunsPerDayLimit ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Used today</span>
              <span className="font-medium">
                {subscription?.trainingRunsToday ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Remaining today</span>
              <span className="font-medium">{runsRemainingToday}</span>
            </div>
            <p className="text-muted-foreground">
              One daily training run is consumed only if at least one ready
              knowledge source is queued. Resets daily at {trainingResetLabel}.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTrainDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => trainMutation.mutate()}
              disabled={trainMutation.isPending}
            >
              Start Training
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete knowledge source?</DialogTitle>
            <DialogDescription>
              This knowledge source will be permanently deleted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              disabled={deleteDocumentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteDocumentMutation.isPending}
              onClick={() => {
                if (deleteConfirmId) {
                  deleteDocumentMutation.mutate(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
