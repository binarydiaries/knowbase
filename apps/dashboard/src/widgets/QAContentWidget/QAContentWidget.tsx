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
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
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
  question: string;
  answer: string;
};
type IQAContentWidgetProps = {
  mode?: 'add' | 'edit';
  document?: DocumentSchema;
  onClose?: () => void;
  readOnly?: boolean;
};

export const QAContentWidget = ({
  mode = 'add',
  document,
  onClose,
  readOnly = false,
}: IQAContentWidgetProps) => {
  const { addUpdateDocument } = useDocuments();
  const [qaList, setQaList] = useState<QA[]>(
    (document?.content.type === 'qna' && document?.content?.data) || [
      { question: '', answer: '' },
    ],
  );
  const [title, setTitle] = useState(document?.title);
  const { agentId } = useParams({ strict: false });
  const queryClient = useQueryClient();

  if (!agentId) {
    throw new Error('Agent not found');
  }

  const handleSave = () => {
    saveQnAMutation.mutate();
  };
  // Mutations
  const saveQnAMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'edit') {
        const { data } = await patchDocumentsById({
          path: {
            id: document?.id || '',
          },
          body: {
            title,
            content: {
              type: 'qna',
              data: qaList,
            },
          },
        });

        return {
          document: data.document,
        };
      }

      const { data } = await postDocuments({
        body: {
          agentId: agentId || '',
          title: title || '',
          content: {
            type: 'qna',
            data: qaList,
          },
        },
      });

      return {
        document: data.document,
      };
    },
    onSuccess: ({ document }) => {
      addUpdateDocument(agentId, document);
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      onClose?.();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const addQuestion = () => {
    setQaList([...qaList, { question: '', answer: '' }]);
  };

  const updateQA = (
    index: number,
    field: 'question' | 'answer',
    value: string,
  ) => {
    setQaList((prev) =>
      prev.map((qa, i) => (i === index ? { ...qa, [field]: value } : qa)),
    );
  };

  const deleteQuestion = (index: number) => {
    setQaList(qaList.filter((_, i) => i !== index));
  };

  return (
    <SheetContent className="sm:max-w-175 overflow-auto">
      <SheetHeader>
        <SheetTitle>
          {mode === 'edit' ? 'Edit Q&A Source' : 'Add Q&A Source'}
        </SheetTitle>
        <SheetDescription>
          {mode === 'edit'
            ? 'Update existing questions and answers'
            : 'Add Q&A source to the agent'}
        </SheetDescription>
      </SheetHeader>
      <div className="grid flex-1 auto-rows-min gap-6 px-4">
        <div className="grid gap-3">
          <Label htmlFor="sheet-demo-name">Title</Label>
          <Input
            id="sheet-demo-name"
            placeholder="Enter a title for this Q&A group"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={readOnly}
          />
        </div>
        <div className=" flex flex-row  justify-between">
          <Label htmlFor="sheet-demo-username">Questions & Answer</Label>
          <DisabledTooltip disabled={readOnly} content={AGENT_LOCK_TOOLTIP}>
            <Button variant="outline" onClick={addQuestion} disabled={readOnly}>
              + Add Question
            </Button>
          </DisabledTooltip>
        </div>
        {/* Cards */}
        {qaList.map((qa, index) => (
          <Card key={+index}>
            <CardContent className="space-y-4">
              <div>
                <div>
                  <div className={'flex flex-row justify-between items-center'}>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Question {index + 1}
                      </p>
                    </div>

                    {qaList.length > 1 && (
                      <DisabledTooltip
                        disabled={readOnly}
                        content={AGENT_LOCK_TOOLTIP}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={readOnly || qaList.length === 1}
                          onClick={() => deleteQuestion(index)}
                          className="text-destructive hover:text-destructive mb-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DisabledTooltip>
                    )}
                  </div>

                  <Input
                    placeholder="Enter question..."
                    value={qa.question}
                    onChange={(e) =>
                      updateQA(index, 'question', e.target.value)
                    }
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Answer</p>
                <Textarea
                  placeholder="Enter the answer..."
                  value={qa.answer}
                  onChange={(e) => updateQA(index, 'answer', e.target.value)}
                  disabled={readOnly}
                />
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
            {mode === 'edit' ? 'Update changes' : 'Save changes'}
          </Button>
        </DisabledTooltip>
        <SheetClose asChild>
          <Button variant="outline">Close</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  );
};
