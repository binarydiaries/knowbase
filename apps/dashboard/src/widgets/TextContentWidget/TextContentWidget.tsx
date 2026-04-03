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
import { useMutation } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
import {
  type DocumentSchema,
  patchDocumentsById,
  postDocuments,
} from '@/services';
import {
  CHATBOT_LOCK_TOOLTIP,
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
  const [content, setContent] = useState(
    (document?.content.type === 'text' && document?.content?.data) || '',
  );
  const [title, setTitle] = useState(document?.title);
  const { chatbotId } = useParams({ strict: false });

  if (!chatbotId) {
    throw new Error('Chatbot not found');
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
          chatbotId,
        },
      });

      return {
        document: data.document,
      };
    },
    onSuccess: ({ document }) => {
      addUpdateDocument(chatbotId, document);
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
            ? 'Update existing questions and answers'
            : 'Add Text source to the chatbot'}
        </SheetDescription>
      </SheetHeader>
      <div className="grid flex-1 auto-rows-min gap-6 px-4">
        <div className="grid gap-3">
          <Label htmlFor="sheet-demo-name">Title</Label>
          <Input
            id="sheet-demo-name"
            placeholder="Enter a title for this text source..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={readOnly}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="sheet-demo-username">Content</Label>
          <RichEditor value={content} onChange={readOnly ? () => {} : setContent} />
        </div>
      </div>
      <SheetFooter>
        <DisabledTooltip disabled={readOnly} content={CHATBOT_LOCK_TOOLTIP}>
          <Button
            onClick={handleSave}
            disabled={readOnly || saveTextMutation.isPending}
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
