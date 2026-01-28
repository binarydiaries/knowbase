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
import { Textarea } from '@knowbase/ui/components/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { patchDocumentsById, postDocuments } from '@/services';

type QA = {
  question: string;
  answer: string;
};
type Props = {
  mode?: 'add' | 'edit';
  document?: any;
  onClose?: () => void;
};

export const QAContentWidget = ({ mode = 'add', document, onClose }: Props) => {
  const [qaList, setQaList] = useState<QA[]>([{ question: '', answer: '' }]);
  const [title, setTitle] = useState('');
  const { chatbotId } = useParams({ strict: false });

  useEffect(() => {
    console.log('inside qa widget');
    if (mode === 'edit' && document) {
      setTitle(document.title);
      setQaList(document.content.data);
    }
  }, [mode, document]);

  useEffect(() => {
    if (mode === 'add') {
      setTitle('');
      setQaList([{ question: '', answer: '' }]);
    }
  }, [mode]);

  const queryClient = useQueryClient();

  const handleSave = () => {
    saveQnAMutation.mutate();
  };
  // Mutations
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
              type: 'qna',
              data: qaList,
            },
          },
        });
      }

      return postDocuments({
        body: JSON.stringify({
          chatbotId,
          title,
          content: {
            type: 'qna',
            data: qaList,
          },
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      onClose?.();
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
            : 'Add Q&A source to the chatbot'}
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
          />
        </div>
        <div className=" flex flex-row  justify-between">
          <Label htmlFor="sheet-demo-username">Questions & Answer</Label>
          <Button variant="outline" onClick={addQuestion}>
            + Add Question
          </Button>
        </div>
        {/* Cards */}
        {qaList.map((qa, index) => (
          <Card key={index}>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={qaList.length === 1}
                        onClick={() => deleteQuestion(index)}
                        className="text-destructive hover:text-destructive mb-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <Input
                    placeholder="Enter question..."
                    value={qa.question}
                    onChange={(e) =>
                      updateQA(index, 'question', e.target.value)
                    }
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Answer</p>
                <Textarea
                  placeholder="Enter the answer..."
                  value={qa.answer}
                  onChange={(e) => updateQA(index, 'answer', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
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
