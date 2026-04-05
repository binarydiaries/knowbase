import { Badge } from '@knowbase/ui/components/badge';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@knowbase/ui/components/item';
import dayjs from 'dayjs';
import { BotIcon, DatabaseIcon, UserIcon } from 'lucide-react';
import type { MessageSchema } from '@/services';

interface IConversationMessageItemProps {
  message: MessageSchema;
}

export function ConversationMessageItem({
  message,
}: IConversationMessageItemProps) {
  const sourceCount = message?.metadata?.sources?.length ?? 0;

  return (
    <Item variant={message.role === 'user' ? 'default' : 'muted'}>
      <ItemMedia variant="icon">
        {message.role === 'user' ? <UserIcon /> : <BotIcon />}
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          <p>{message.role.toUpperCase()}</p>
          <span className="text-xs font-light text-gray-400">
            {dayjs(message.createdAt).format('h:mm A')}
          </span>
        </ItemTitle>
        <ItemDescription>{message.content}</ItemDescription>

        <div className="mt-2 flex flex-wrap gap-2">
          {message?.metadata?.confidenceScore !== null &&
            message?.metadata?.confidenceScore !== undefined && (
              <Badge variant="outline">
                Confidence {Math.round(message.metadata.confidenceScore * 100)}%
              </Badge>
            )}

          <Badge variant="outline">
            <DatabaseIcon className="mr-1 size-3" />
            Sources {sourceCount}
          </Badge>
        </div>
      </ItemContent>
    </Item>
  );
}
