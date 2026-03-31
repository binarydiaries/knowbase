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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@knowbase/ui/components/tooltip';
import { formatDistance } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Files,
  FileText,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Send,
  Trash2,
} from 'lucide-react';
import { type MouseEventHandler, useMemo } from 'react';
import type { DocumentSchema } from '@/services';

interface IDocumentItemProps {
  type: 'text' | 'qna';
  title: string;
  description: string;
  lastTrainedAt?: string | null;
  onEdit: MouseEventHandler;
  onDelete: MouseEventHandler;
  status: DocumentSchema['status'];
}

export const DocumentItem = ({
  type,
  title,
  description,
  onEdit,
  onDelete,
  status,
  lastTrainedAt,
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

  const documentIndexingStatus = useMemo(() => {
    switch (status) {
      case 'ready':
        return {
          label: 'Ready',
          icon: <Send className="h-3 w-3" />,
          description: 'Ready to be trained',
        };

      case 'queue':
        return {
          label: 'Queued',
          icon: <Clock className="h-3 w-3" />,
          description: 'Waiting in training queue…',
        };

      case 'indexing':
        return {
          label: 'Training',
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          description: 'Training in progress…',
        };

      case 'failed':
        return {
          label: 'Failed',
          icon: <AlertTriangle className="h-3 w-3" />,
          description: 'Training failed. You can retry.',
        };

      case 'indexed':
      default:
        return {
          label: 'Trained',
          icon: <CheckCircle className="h-3 w-3" />,
          description: lastTrainedAt
            ? `Last trained ${formatDistance(lastTrainedAt, new Date(), { addSuffix: true })}`
            : 'Training complete',
        };
    }
  }, [status, lastTrainedAt]);

  return (
    <Item variant="outline">
      <ItemMedia variant="icon">{docIcon}</ItemMedia>
      <ItemContent>
        <div className={'flex flex-row gap-2'}>
          <ItemTitle>{title}</ItemTitle>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-muted-foreground px-1.5">
                {documentIndexingStatus.icon}
                {documentIndexingStatus.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{documentIndexingStatus.description}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <ItemDescription>{description}</ItemDescription>
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
