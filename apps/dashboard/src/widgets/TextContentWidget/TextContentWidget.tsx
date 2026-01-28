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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { patchDocumentsById, postDocuments } from '@/services';

type Props = {
  mode?: 'add' | 'edit';
  document?: any;
  onClose?: () => void;
};

export const TextContentWidget = ({
  mode = 'add',
  document,
  onClose,
}: Props) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const { chatbotId } = useParams({ strict: false });

  useEffect(() => {
    if (mode === 'edit' && document) {
      setTitle(document.title);
      setContent(document.content.data);
    }
  }, [mode, document]);

  useEffect(() => {
    if (mode === 'add') {
      setTitle('');
      setContent('');
    }
  }, [mode]);

  const queryClient = useQueryClient();

  const handleSave = () => {
    saveQnAMutation.mutate();
  };
  const saveQnAMutation = useMutation({
    mutationFn: async () => {
      if (mode === 'edit') {
        return patchDocumentsById({
          path: {
            id: document.id,
          },
          body: {
            title,
            content: {
              type: 'text',
              data: content,
            },
          },
        });
      }

      return postDocuments({
        body: JSON.stringify({
          chatbotId,
          title,
          content: {
            type: 'text',
            data: content,
          },
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      onClose?.();
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
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="sheet-demo-username">Content</Label>
          <RichEditor />
        </div>
      </div>
      <SheetFooter>
        <Button
          onClick={handleSave}
          disabled={saveQnAMutation.isPending}
          type="submit"
        >
          {mode === 'edit' ? 'Update changes' : 'Save changes'}
        </Button>
        <SheetClose asChild>
          <Button variant="outline">Close</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  );
};
