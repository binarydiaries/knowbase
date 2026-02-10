import { Badge } from '@knowbase/ui/components/badge';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@knowbase/ui/components/item';
import { ScrollArea } from '@knowbase/ui/components/scroll-area';
import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { BotIcon, ChevronRightIcon, UserIcon } from 'lucide-react';
import { getConversations, getMessages } from '@/services';

export const Route = createFileRoute('/conversations/{-$conversationId}/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { conversationId } = Route.useParams();
  const conversationQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(),
  });

  const messageQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () =>
      getMessages({ query: { conversationId: conversationId || '' } }),
    enabled: !!conversationId,
  });

  return (
    <div className="flex flex-col h-screen">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-sm font-medium flex-1">Conversations</h1>
        </div>
      </header>
      <Separator />
      <div className="flex flex-1 overflow-hidden">
        <ScrollArea className="flex w-full max-w-md flex-col gap-4 border-r">
          {conversationQuery.data?.data.conversations.map((conversation) => (
            <Item
              asChild
              key={conversation.id}
              variant={conversation.id === conversationId ? 'muted' : 'default'}
            >
              <Link
                to={'/conversations/{-$conversationId}'}
                params={{ conversationId: conversation.id }}
              >
                <ItemContent>
                  <ItemTitle>{conversation.lastUserQuestion}</ItemTitle>
                  <ItemDescription>
                    {conversation.lastAssistantUtterance}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <ChevronRightIcon className="size-4" />
                </ItemActions>
              </Link>
            </Item>
          ))}
        </ScrollArea>
        <ScrollArea className="w-full px-4">
          {messageQuery.data?.data.messages.map((message) => (
            <Item
              key={message.id}
              variant={message.role === 'user' ? 'default' : 'muted'}
            >
              <ItemMedia variant="icon">
                {message.role === 'user' ? <UserIcon /> : <BotIcon />}
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  <p>{message?.role.toUpperCase()}</p>
                  <span className="text-xs font-light text-gray-400">
                    10.00AM
                  </span>
                </ItemTitle>
                <ItemDescription>{message.content}</ItemDescription>

                {message?.metadata?.confidenceScore && (
                  <div className="mt-2">
                    <Separator />
                    <div className="flex gap-3">
                      <div className="flex gap-2 py-2 items-center">
                        <p className="text-xs">Confidence Score: </p>
                        <Badge variant="outline">
                          {Math.round(message?.metadata?.confidenceScore * 100)}
                          %
                        </Badge>
                      </div>
                      <div className="flex gap-2 py-2 items-center">
                        <p className="text-xs">Sources: </p>
                        <Badge variant="outline">Policy</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </ItemContent>
            </Item>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}
