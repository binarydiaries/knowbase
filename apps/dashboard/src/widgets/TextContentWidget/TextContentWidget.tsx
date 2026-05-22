import * as amplitude from '@amplitude/unified';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@knowbase/ui/components/button';
import { Label } from '@knowbase/ui/components/label';
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@knowbase/ui/components/sheet';
import { RichEditor } from '@knowbase/ui/widgets/RichEditor/RichEditor';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormInput } from '@/components/FormInput/FormInput.tsx';
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

type ITextContentWidgetProps = {
  mode?: 'add' | 'edit';
  document?: DocumentSchema;
  onClose?: () => void;
  onSuccess?: () => void;
  readOnly?: boolean;
};

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().refine(
    (val) => val.replace(/<[^>]*>/g, '').trim().length > 0,
    'Content is required',
  ),
});
type FormValues = z.infer<typeof schema>;

export const TextContentWidget = ({
  mode = 'add',
  document,
  onClose,
  onSuccess,
  readOnly = false,
}: ITextContentWidgetProps) => {
  const { agentId } = useParams({ strict: false });
  const queryClient = useQueryClient();

  if (!agentId) {
    throw new Error('Agent not found');
  }

  const { addUpdateDocument } = useDocuments();

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: document?.title ?? '',
      content:
        (document?.content.type === 'text' && document.content.data) || '',
    },
  });

  const saveTextMutation = useMutation({
    mutationFn: async ({ title, content }: FormValues) => {
      if (mode === 'edit') {
        const { data } = await patchDocumentsById({
          path: { id: document?.id || '' },
          body: { title, content: { type: 'text', data: content } },
        });
        return { document: data.document };
      }

      const { data } = await postDocuments({
        body: {
          title,
          content: { type: 'text', data: content },
          agentId,
        },
      });
      return { document: data.document };
    },
    onSuccess: ({ document: savedDocument }) => {
      addUpdateDocument(agentId, savedDocument);
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      toast.success(
        mode === 'edit' ? 'Text source updated' : 'Text source added',
      );
      if (mode === 'add') {
        amplitude.track('Knowledge Source Added', { agent_id: agentId, source_type: 'text' });
        onSuccess?.();
      }
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
          {mode === 'edit' ? 'Edit Text Source' : 'Add Text Source'}
        </SheetTitle>
        <SheetDescription>
          {mode === 'edit'
            ? 'Update the title and content of this text source.'
            : 'Add free-form text your agent will use when answering questions.'}
        </SheetDescription>
      </SheetHeader>
      <div className="grid flex-1 auto-rows-min gap-6 px-4">
        <FormInput
          name="title"
          control={control}
          label="Title"
          placeholder="Enter a title for this text source..."
          disabled={readOnly}
        />
        <div className="grid gap-3">
          <Label>Content</Label>
          <Controller
            control={control}
            name="content"
            render={({ field, fieldState }) => (
              <>
                <RichEditor
                  value={field.value}
                  onChange={field.onChange}
                  readOnly={readOnly}
                />
                {fieldState.error && (
                  <p className="text-sm text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
      </div>
      <SheetFooter>
        <DisabledTooltip disabled={readOnly} content={AGENT_LOCK_TOOLTIP}>
          <Button
            onClick={handleSubmit((values) => saveTextMutation.mutate(values))}
            disabled={readOnly || saveTextMutation.isPending}
            type="submit"
          >
            {saveTextMutation.isPending && (
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
