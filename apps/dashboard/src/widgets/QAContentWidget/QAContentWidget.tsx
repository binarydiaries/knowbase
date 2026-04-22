import { Button } from '@knowbase/ui/components/button';
import { Card, CardContent } from '@knowbase/ui/components/card';
import { Input } from '@knowbase/ui/components/input';
import { Label } from '@knowbase/ui/components/label';
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@knowbase/ui/components/sheet';
import { toast } from '@knowbase/ui/components/sonner';
import { Textarea } from '@knowbase/ui/components/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import {
  type DocumentSchema,
  patchDocumentsById,
  postDocuments,
} from '@/services';
import {
  AGENT_LOCK_TOOLTIP,
  DisabledTooltip,
} from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import { useDocuments } from '@/store/useDocuments.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';

type QA = {
  id: string;
  question: string;
  answer: string;
};

type IQAContentWidgetProps = {
  mode?: 'add' | 'edit';
  document?: DocumentSchema;
  onClose?: () => void;
  readOnly?: boolean;
};

function makeQA(question = '', answer = ''): QA {
  return { id: crypto.randomUUID(), question, answer };
}

function initQaList(document: DocumentSchema | undefined): QA[] {
  if (document?.content.type === 'qna' && document.content.data.length > 0) {
    return document.content.data.map((qa) =>
      makeQA(qa.question, qa.answer),
    );
  }
  return [makeQA()];
}

export const QAContentWidget = ({
  mode = 'add',
  document,
  onClose,
  readOnly = false,
}: IQAContentWidgetProps) => {
  const posthog = usePostHog();
  const { addUpdateDocument } = useDocuments();
  const [qaList, setQaList] = useState<QA[]>(() => initQaList(document));
  const [title, setTitle] = useState(document?.title ?? '');
  const [submitted, setSubmitted] = useState(false);
  const { agentId } = useParams({ strict: false });
  const queryClient = useQueryClient();

  if (!agentId) {
    throw new Error('Agent not found');
  }

  const titleError = submitted && !title.trim() ? 'Title is required' : null;
  const qaErrors = qaList.map((qa) => ({
    question: submitted && !qa.question.trim() ? 'Question is required' : null,
    answer: submitted && !qa.answer.trim() ? 'Answer is required' : null,
  }));
  const isValid =
    !!title.trim() &&
    qaList.every((qa) => qa.question.trim() && qa.answer.trim());

  const handleSave = () => {
    setSubmitted(true);
    if (!isValid) return;
    saveQnAMutation.mutate();
  };

  const saveQnAMutation = useMutation({
    mutationFn: async () => {
      const data_payload = qaList.map(({ question, answer }) => ({
        question,
        answer,
      }));

      if (mode === 'edit') {
        const { data } = await patchDocumentsById({
          path: { id: document?.id || '' },
          body: {
            title,
            content: { type: 'qna', data: data_payload },
          },
        });
        return { document: data.document };
      }

      const { data } = await postDocuments({
        body: {
          agentId,
          title,
          content: { type: 'qna', data: data_payload },
        },
      });
      return { document: data.document };
    },
    onSuccess: ({ document: saved }) => {
      posthog.capture('knowledge_source_saved', {
        agent_id: agentId,
        document_id: saved.id,
        source_type: 'qna',
        mode,
      });
      addUpdateDocument(agentId, saved);
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      toast.success(
        mode === 'edit' ? 'Q&A source updated' : 'Q&A source added',
      );
      onClose?.();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const addQuestion = () => {
    setQaList((prev) => [...prev, makeQA()]);
  };

  const updateQA = (id: string, field: 'question' | 'answer', value: string) => {
    setQaList((prev) =>
      prev.map((qa) => (qa.id === id ? { ...qa, [field]: value } : qa)),
    );
  };

  const deleteQuestion = (id: string) => {
    setQaList((prev) => prev.filter((qa) => qa.id !== id));
  };

  return (
    <SheetContent className="sm:max-w-175 overflow-auto">
      <SheetHeader>
        <SheetTitle>
          {mode === 'edit' ? 'Edit Q&A Source' : 'Add Q&A Source'}
        </SheetTitle>
        <SheetDescription>
          {mode === 'edit'
            ? 'Update the questions and answers your agent uses to respond.'
            : 'Create question & answer pairs your agent will reference when responding.'}
        </SheetDescription>
      </SheetHeader>
      <div className="grid flex-1 auto-rows-min gap-6 px-4">
        <div className="grid gap-3">
          <Label htmlFor="qa-title">Title</Label>
          <Input
            id="qa-title"
            placeholder="Enter a title for this Q&A group"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={readOnly}
          />
          {titleError && (
            <p className="text-sm text-destructive">{titleError}</p>
          )}
        </div>
        <div className="flex flex-row justify-between items-center">
          <Label>Questions & Answers</Label>
          <DisabledTooltip disabled={readOnly} content={AGENT_LOCK_TOOLTIP}>
            <Button variant="outline" onClick={addQuestion} disabled={readOnly}>
              + Add Question
            </Button>
          </DisabledTooltip>
        </div>
        {qaList.map((qa, index) => (
          <Card key={qa.id}>
            <CardContent className="space-y-4">
              <div className="flex flex-row justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Question {index + 1}
                </p>
                {qaList.length > 1 && (
                  <DisabledTooltip
                    disabled={readOnly}
                    content={AGENT_LOCK_TOOLTIP}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={readOnly}
                      onClick={() => deleteQuestion(qa.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DisabledTooltip>
                )}
              </div>
              <div className="space-y-1">
                <Input
                  placeholder="Enter question..."
                  value={qa.question}
                  onChange={(e) => updateQA(qa.id, 'question', e.target.value)}
                  disabled={readOnly}
                />
                {qaErrors[index]?.question && (
                  <p className="text-sm text-destructive">
                    {qaErrors[index].question}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Textarea
                  placeholder="Enter the answer..."
                  value={qa.answer}
                  onChange={(e) => updateQA(qa.id, 'answer', e.target.value)}
                  disabled={readOnly}
                />
                {qaErrors[index]?.answer && (
                  <p className="text-sm text-destructive">
                    {qaErrors[index].answer}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <SheetFooter>
        <DisabledTooltip disabled={readOnly} content={AGENT_LOCK_TOOLTIP}>
          <Button
            onClick={handleSave}
            disabled={readOnly || saveQnAMutation.isPending}
            type="submit"
          >
            {saveQnAMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === 'edit' ? 'Update changes' : 'Save changes'}
          </Button>
        </DisabledTooltip>
        <SheetClose asChild>
          <Button variant="outline">Cancel</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  );
};
