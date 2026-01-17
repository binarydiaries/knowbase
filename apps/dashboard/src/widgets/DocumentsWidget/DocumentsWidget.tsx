import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@knowbase/ui/components/dropdown-menu';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@knowbase/ui/components/item';
import { Sheet } from '@knowbase/ui/components/sheet';
import { MoreHorizontal, ShieldAlertIcon } from 'lucide-react';
import { useState } from 'react';
import { TextContentWidget } from '@/widgets/TextContentWidget/TextContentWidget.tsx';

export const DocumentsWidget = () => {
  const [isTextContentSheetOpen, setIsTextContentSheetOpen] = useState(false);
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className={'text-xl'}>Knowledge Sources</CardTitle>
          <CardDescription>
            You stored knowledge used for chatbot
          </CardDescription>
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Add</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => setIsTextContentSheetOpen(true)}
                >
                  Text
                </DropdownMenuItem>
                <DropdownMenuItem>Q&A</DropdownMenuItem>
                <DropdownMenuItem>PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
      <Sheet
        open={isTextContentSheetOpen}
        onOpenChange={setIsTextContentSheetOpen}
      >
        <TextContentWidget />
      </Sheet>
    </>
  );
};
