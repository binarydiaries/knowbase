import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@knowbase/ui/components/button';
import { Card, CardContent } from '@knowbase/ui/components/card';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { Loader2, Trash2 } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
import { FormTextarea } from '@/components/FormTextArea/FormTextArea.tsx';
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

type IQAContentWidgetProps = {
  mode?: 'add' | 'edit';
  document?: DocumentSchema;
  onClose?: () => void;
  readOnly?: boolean;
};

const qaItemSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
});

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  qaList: z.array(qaItemSchema),
});
type FormValues = z.infer<typeof schema>;

function initQaList(
  document: DocumentSchema | undefined,
): { question: string; answer: string }[] {
  if (document?.content.type === 'qna' && document.content.data.length > 0) {
    return document.content.data.map((qa) => ({
      question: qa.question,
      answer: qa.answer,
    }));
  }
  return [{ question: '', answer: '' }];
}

export const QAContentWidget = ({
  mode = 'add',
  document,
  onClose,
  readOnly = false,
}: IQAContentWidgetProps) => {
  const posthog = usePostHog();
  const { addUpdateDocument } = useDocuments();
  const { agentId } = useParams({ strict: false });
  const queryClient = useQueryClient();

  if (!agentId) {
    throw new Error('Agent not found');
  }

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: document?.title ?? '',
      qaList: initQaList(document),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'qaList',
  });

  const saveQnAMutation = useMutation({
    mutationFn: async ({ title, qaList }: FormValues) => {
      const data_payload = qaList.map(({ question, answer }) => ({
        question,
        answer,
      }));

      if (mode === 'edit') {
        const { data } = await patchDocumentsById({
          path: { id: document?.id || '' },
          body: { title, content: { type: 'qna', data: data_payload } },
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
        <FormInput
          name="title"
          control={control}
          label="Title"
          placeholder="Enter a title for this Q&A group"
          disabled={readOnly}
        />
        <div className="flex flex-row justify-between items-center">
          <Label>Questions & Answers</Label>
          <DisabledTooltip disabled={readOnly} content={AGENT_LOCK_TOOLTIP}>
            <Button
              variant="outline"
              onClick={() => append({ question: '', answer: '' })}
              disabled={readOnly}
            >
              + Add Question
            </Button>
          </DisabledTooltip>
        </div>
        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardContent className="space-y-4">
              <div className="flex flex-row justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Question {index + 1}
                </p>
                {fields.length > 1 && (
                  <DisabledTooltip
                    disabled={readOnly}
                    content={AGENT_LOCK_TOOLTIP}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={readOnly}
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DisabledTooltip>
                )}
              </div>
              <FormInput
                name={`qaList.${index}.question` as `qaList.${number}.question`}
                control={control}
                label="Question"
                placeholder="Enter question..."
                disabled={readOnly}
              />
              <FormTextarea
                name={`qaList.${index}.answer` as `qaList.${number}.answer`}
                control={control}
                label="Answer"
                placeholder="Enter the answer..."
                disabled={readOnly}
              />
            </CardContent>
          </Card>
        ))}
      </div>
      <SheetFooter>
        <DisabledTooltip disabled={readOnly} content={AGENT_LOCK_TOOLTIP}>
          <Button
            onClick={handleSubmit((values) => saveQnAMutation.mutate(values))}
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
