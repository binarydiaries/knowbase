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
import { useState } from 'react';

export const TextContentWidget = () => {
  const [content, setContent] = useState('## Keshav');
  console.log(content);
  return (
    <SheetContent className="sm:max-w-175 overflow-auto">
      <SheetHeader>
        <SheetTitle>Text Source</SheetTitle>
        <SheetDescription>
          This is used to add text source to the chatbot
        </SheetDescription>
      </SheetHeader>
      <div className="grid flex-1 auto-rows-min gap-6 px-4">
        <div className="grid gap-3">
          <Label htmlFor="sheet-demo-name">Title</Label>
          <Input
            id="sheet-demo-name"
            placeholder="Enter a title for this text source..."
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="sheet-demo-username">Content</Label>
          <RichEditor value={content} onChange={setContent} />
        </div>
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
