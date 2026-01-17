import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
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
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

type QA = {
  question: string;
  answer: string;
};

export const QAContentWidget = () => {
  const [qaList, setQaList] = useState<QA[]>([{ question: '', answer: '' }]);

  const addQuestion = () => {
    setQaList([...qaList, { question: '', answer: '' }]);
  };

  const updateQA = (
    index: number,
    field: 'question' | 'answer',
    value: string,
  ) => {
    const updated = [...qaList];
    updated[index][field] = value;
    setQaList(updated);
  };
  const deleteQuestion = (index: number) => {
    setQaList(qaList.filter((_, i) => i !== index));
  };

  return (
    <SheetContent className="sm:max-w-175 overflow-auto">
      <SheetHeader>
        <SheetTitle>Q&A Source</SheetTitle>
        <SheetDescription>
          This is used to add Q&A source to the chatbot
        </SheetDescription>
      </SheetHeader>
      <div className="grid flex-1 auto-rows-min gap-6 px-4">
        <div className="grid gap-3">
          <Label htmlFor="sheet-demo-name">Title</Label>
          <Input
            id="sheet-demo-name"
            placeholder="Enter a title for this Q&A group"
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
                  <div className={'flex flex-row justify-between'}>
                    <div>
                      <p className="text-sm text-muted-foreground ">
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
        <Button type="submit">Save changes</Button>
        <SheetClose asChild>
          <Button variant="outline">Close</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  );
};
