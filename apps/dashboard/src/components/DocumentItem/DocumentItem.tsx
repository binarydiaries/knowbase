import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
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
import {
  Clock,
  Edit,
  Files,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import type { MouseEventHandler } from 'react';

interface IDocumentItemProps {
  type: 'text' | 'qna';
  title: string;
  description: string;
  onEdit: MouseEventHandler;
  onDelete: MouseEventHandler;
}

export const DocumentItem = ({
  type,
  title,
  description,
  onEdit,
  onDelete,
}: IDocumentItemProps) => {
  let docIcon = <Files className="h-4 w-4" />;
  switch (type) {
    case 'qna':
      docIcon = <MessageSquare className="h-4 w-4" />;
      break;
    case 'text':
      docIcon = <FileText className="h-4 w-4" />;
      break;
  }
  return (
    <Item variant="outline">
      <ItemMedia variant="icon">{docIcon}</ItemMedia>
      <ItemContent>
        <div className={'flex flex-row gap-2'}>
          <ItemTitle>{title}</ItemTitle>
          {/*<Badge variant="outline">*/}
          {/*  {doc.content.type === 'qna' ? 'Q&A' : 'Text'}*/}
          {/*</Badge>*/}
          <Badge variant={'outline'} className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Waiting to train…
          </Badge>
        </div>
        <ItemDescription>{description}</ItemDescription>
        <p className="text-xs text-muted-foreground">Last Trained: 11pm</p>
      </ItemContent>
      <ItemActions>
        {/*<Button size="icon" variant="ghost">*/}
        {/*  <MoreHorizontal />*/}
        {/*</Button>*/}
        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground  cursor-pointer "
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-40 ">
            <DropdownMenuItem
              onClick={onEdit}
              className="flex items-center cursor-pointer gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onDelete}
              className="flex items-center gap-2  cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 text-red" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ItemActions>
    </Item>
  );
};
