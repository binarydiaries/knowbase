import { RichEditor } from '@knowbase/editor/components/RichEditor/RichEditor';
import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Input } from '@knowbase/ui/components/input';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@knowbase/ui/components/item';
import { Label } from '@knowbase/ui/components/label';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@knowbase/ui/components/sheet';
import { MoreHorizontal, ShieldAlertIcon } from 'lucide-react';

export const DocumentsWidget = () => {
  return (
    <Sheet>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Knowledge Sources</CardTitle>
          <CardDescription>
            You stored knowledge used for chatbot
          </CardDescription>
          <CardAction>
            <SheetTrigger asChild>
              <Button variant="outline">Add</Button>
            </SheetTrigger>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Item variant="outline">
            <ItemMedia variant="icon">
              <ShieldAlertIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Security Alert</ItemTitle>
              <ItemDescription>
                New login detected from unknown device.
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button size="icon" variant="ghost">
                <MoreHorizontal />
              </Button>
            </ItemActions>
          </Item>
        </CardContent>
      </Card>

      <SheetContent className="sm:max-w-125 ">
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
            <RichEditor />
          </div>
        </div>
        <SheetFooter>
          <Button type="submit">Save changes</Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
