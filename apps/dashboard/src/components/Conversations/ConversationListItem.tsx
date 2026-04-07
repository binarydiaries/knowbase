import { Badge } from '@knowbase/ui/components/badge';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemTitle,
} from '@knowbase/ui/components/item';
import { Link } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { ChevronRightIcon } from 'lucide-react';

interface IConversationListItemProps {
  id: string;
  lastUserQuestion: string;
  lastAssistantUtterance: string;
  lastMessageAt: string;
  chatbotName: string;
  channelLabel: string;
  active: boolean;
}

export function ConversationListItem({
  id,
  lastUserQuestion,
  lastAssistantUtterance,
  lastMessageAt,
  chatbotName,
  channelLabel,
  active,
}: IConversationListItemProps) {
  return (
    <Item asChild variant={active ? 'muted' : 'default'} className="w-full">
      <Link
        to={'/conversations/{-$conversationId}'}
        params={{ conversationId: id }}
        search={(prev) => ({ page: prev.page ?? 1 })}
      >
        <ItemContent className="gap-2">
          <ItemHeader>
            <ItemTitle className="max-w-[190px] truncate">
              {lastUserQuestion}
            </ItemTitle>
            <Badge variant="outline" className="capitalize">
              {dayjs(lastMessageAt).format('MMM D, h:mm A')}
            </Badge>
          </ItemHeader>

          <ItemDescription>{lastAssistantUtterance}</ItemDescription>

          <ItemFooter>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                {chatbotName}
              </Badge>
              <Badge variant="secondary" className="font-normal">
                {channelLabel}
              </Badge>
            </div>
          </ItemFooter>
        </ItemContent>
        <ItemActions>
          <ChevronRightIcon className="size-4" />
        </ItemActions>
      </Link>
    </Item>
  );
}
