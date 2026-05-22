import * as amplitude from '@amplitude/unified';
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
import { Input } from '@knowbase/ui/components/input';
import { Label } from '@knowbase/ui/components/label';
import { Sheet } from '@knowbase/ui/components/sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Check, Copy, FolderIcon, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const TRAINING_REMINDER_KEY = 'doc-training-reminder-seen';
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
import { useFeatureFlags } from '@/hooks/useFeatureFlags.ts';
import { AddDocumentDropdown } from '@/widgets/DocumentsWidget/AddDocumentDropdown.tsx';
import { PDFContentWidget } from '@/widgets/PDFContentWidget/PDFContentWidget.tsx';
import { QAContentWidget } from '@/widgets/QAContentWidget/QAContentWidget.tsx';
import { TextContentWidget } from '@/widgets/TextContentWidget/TextContentWidget.tsx';
import { URLContentWidget } from '@/widgets/URLContentWidget/URLContentWidget.tsx';
import type { SubscriptionStatusSchema } from '@/services';

dayjs.extend(utc);

export const DocumentsWidget = ({
  readOnly = false,
  subscription,
}: {
  readOnly?: boolean;
  subscription?: SubscriptionStatusSchema;
}) => {
  const { agentId } = useParams({ strict: false });
  const { documentsByAgentId, deleteDocument, addUpdateDocument } =
    useDocuments();
  const queryClient = useQueryClient();
  const [isTextContentSheetOpen, setIsTextContentSheetOpen] = useState(false);
  const [isQASheetOpen, setIsQASheetOpen] = useState(false);
  const [isPdfSheetOpen, setIsPdfSheetOpen] = useState(false);
  const [isUrlSheetOpen, setIsUrlSheetOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentSchema>();
  const [isPollingActive, setIsPollingActive] = useState(true);
  const [isTrainDialogOpen, setIsTrainDialogOpen] = useState(false);
  const [isTrainingReminderOpen, setIsTrainingReminderOpen] = useState(false);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<{ id: string; title: string } | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [copiedTitle, setCopiedTitle] = useState(false);

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
      deleteDocument(agentId, documentId);
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      toast.success('Knowledge source deleted');
      amplitude.track('Knowledge Source Deleted', { agent_id: agentId, document_id: documentId });
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

      toast.success('Training started');
      amplitude.track('Agent Training Started', { agent_id: agentId });
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

  const { data: featureFlags } = useFeatureFlags();
  const showUrlOption = !!featureFlags?.['url_crawling'];

  useEffect(() => {
    if (indexStatusQuery.data?.data) {
      setIsPollingActive(indexStatusQuery.data?.data.isPollingActive);
      indexStatusQuery.data.data.documentIds?.forEach((value) => {
        addUpdateDocument(agentId, value);
      });
    }
  }, [addUpdateDocument, agentId, indexStatusQuery?.data?.data]);

  useEffect(() => {
    if (!deleteConfirmDoc) setDeleteConfirmInput('');
  }, [deleteConfirmDoc]);

  useEffect(() => {
    if (documents.length > 0 && !localStorage.getItem(TRAINING_REMINDER_KEY)) {
      localStorage.setItem(TRAINING_REMINDER_KEY, '1');
      setIsTrainingReminderOpen(true);
    }
  }, [documents.length]);

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
                      onPdfClick={() => setIsPdfSheetOpen(true)}
                      onUrlClick={() => setIsUrlSheetOpen(true)}
                      showUrlOption={showUrlOption}
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
                  : doc.content?.type === 'pdf'
                    ? 'PDF document'
                    : doc.content?.type === 'url'
                      ? (doc.content.data as { url: string }).url
                      : String(doc.content?.data)
              }
              onEdit={() => {
                setSelectedDocument(doc);
                if (doc.content.type === 'text') {
                  setIsTextContentSheetOpen(true);
                } else if (doc.content.type === 'qna') {
                  setIsQASheetOpen(true);
                }
              }}
              onDelete={(e) => {
                e.stopPropagation();
                setDeleteConfirmDoc({ id: doc.id, title: doc.title });
              }}
              readOnly={readOnly}
              disableEdit={doc.content.type === 'pdf' || doc.content.type === 'url'}
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
                      onPdfClick={() => setIsPdfSheetOpen(true)}
                      onUrlClick={() => setIsUrlSheetOpen(true)}
                      showUrlOption={showUrlOption}
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
        open={!!deleteConfirmDoc}
        onOpenChange={(open) => { if (!open) setDeleteConfirmDoc(null); }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete knowledge source?</DialogTitle>
            <DialogDescription>
              This knowledge source will be permanently deleted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 flex-wrap">
              Type <strong>{deleteConfirmDoc?.title}</strong>
              <button
                type="button"
                title="Copy to clipboard"
                className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                  if (!deleteConfirmDoc?.title) return;
                  navigator.clipboard.writeText(deleteConfirmDoc.title);
                  setCopiedTitle(true);
                  setTimeout(() => setCopiedTitle(false), 1500);
                }}
              >
                {copiedTitle ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
              to confirm
            </Label>
            <Input
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder={deleteConfirmDoc?.title}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmDoc(null)}
              disabled={deleteDocumentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={
                deleteDocumentMutation.isPending ||
                deleteConfirmInput.trim() !== deleteConfirmDoc?.title
              }
              onClick={() => {
                if (deleteConfirmDoc) {
                  deleteDocumentMutation.mutate(deleteConfirmDoc.id);
                  setDeleteConfirmDoc(null);
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
      <Sheet
        open={isPdfSheetOpen}
        onOpenChange={setIsPdfSheetOpen}
      >
        {isPdfSheetOpen && (
          <PDFContentWidget
            onClose={() => setIsPdfSheetOpen(false)}
          />
        )}
      </Sheet>
      <Sheet
        open={isUrlSheetOpen}
        onOpenChange={setIsUrlSheetOpen}
      >
        {isUrlSheetOpen && (
          <URLContentWidget
            onClose={() => setIsUrlSheetOpen(false)}
          />
        )}
      </Sheet>
      <Dialog open={isTrainingReminderOpen} onOpenChange={setIsTrainingReminderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <DialogTitle>One more step — train your agent</DialogTitle>
            </div>
            <DialogDescription>
              Documents you add won't be used by your agent until you train it.
              After adding all your knowledge sources, click the{' '}
              <strong>Train</strong> button to process them.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
            <p className="font-medium">How it works</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Add your knowledge sources (text, PDF, Q&amp;A, URL)</li>
              <li>Click <strong className="text-foreground">Train</strong> to start processing</li>
              <li>Wait for the status to change to <strong className="text-foreground">Indexed</strong></li>
              <li>Your agent is ready to answer questions</li>
            </ol>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsTrainingReminderOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
