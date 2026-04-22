import { Button } from '@knowbase/ui/components/button';
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
import { RichEditor } from '@knowbase/ui/widgets/RichEditor/RichEditor';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
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

type ITextContentWidgetProps = {
  mode?: 'add' | 'edit';
  document?: DocumentSchema;
  onClose?: () => void;
  readOnly?: boolean;
};

export const TextContentWidget = ({
  mode = 'add',
  document,
  onClose,
  readOnly = false,
}: ITextContentWidgetProps) => {
  const posthog = usePostHog();
  const [content, setContent] = useState(
    (document?.content.type === 'text' && document?.content?.data) || '',
  );
  const [title, setTitle] = useState(document?.title);
  const { agentId } = useParams({ strict: false });
  const queryClient = useQueryClient();

  if (!agentId) {
    throw new Error('Agent not found');
  }

  const { addUpdateDocument } = useDocuments();

  const handleSave = () => {
    saveTextMutation.mutate();
  };
  const saveTextMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'edit') {
        const { data } = await patchDocumentsById({
          path: {
            id: document?.id || '',
          },
          body: {
            title,
            content: {
              type: 'text',
              data: content,
            },
          },
        });
        return {
          document: data.document,
        };
      }

      const { data } = await postDocuments({
        body: {
          title: title || '',
          content: {
            type: 'text',
            data: content,
          },
          agentId,
        },
      });

      return {
        document: data.document,
      };
    },
    onSuccess: ({ document: savedDocument }) => {
      posthog.capture('knowledge_source_saved', {
        agent_id: agentId,
        document_id: savedDocument.id,
        source_type: 'text',
        mode,
      });
      addUpdateDocument(agentId, savedDocument);
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      toast.success(
        mode === 'edit' ? 'Text source updated' : 'Text source added',
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
          {mode === 'edit' ? 'Edit Text Source' : 'Add Text Source'}
        </SheetTitle>
        <SheetDescription>
          {mode === 'edit'
            ? 'Update the title and content of this text source.'
            : 'Add free-form text your agent will use when answering questions.'}
        </SheetDescription>
      </SheetHeader>
      <div className="grid flex-1 auto-rows-min gap-6 px-4">
        <div className="grid gap-3">
          <Label htmlFor="text-title">Title</Label>
          <Input
            id="text-title"
            placeholder="Enter a title for this text source..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={readOnly}
          />
        </div>
        <div className="grid gap-3">
          <Label>Content</Label>
          <RichEditor value={content} onChange={setContent} readOnly={readOnly} />
        </div>
      </div>
      <SheetFooter>
        <DisabledTooltip disabled={readOnly} content={AGENT_LOCK_TOOLTIP}>
          <Button
            onClick={handleSave}
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
