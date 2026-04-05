import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@knowbase/ui/components/alert';
import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@knowbase/ui/components/empty';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from '@knowbase/ui/components/item';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@knowbase/ui/components/pagination';
import { ScrollArea } from '@knowbase/ui/components/scroll-area';
import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { Skeleton } from '@knowbase/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  AlertCircleIcon,
  BotIcon,
  ChevronRightIcon,
  DatabaseIcon,
  MessageCircleIcon,
  UserIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { MessageSchema } from '@/services';
import { getConversations, getMessages } from '@/services';
import { timeAgo } from '@/utils/datetimeHelper';
import { getErrorMessage } from '@/utils/errorHelper';

export const Route = createFileRoute('/conversations/{-$conversationId}/')({
  component: RouteComponent,
});

const PAGE_SIZE = 8;

function RouteComponent() {
  const { conversationId } = Route.useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const conversationQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations(),
  });

  const conversations = conversationQuery.data?.data.conversations ?? [];
  const totalPages = Math.max(1, Math.ceil(conversations.length / PAGE_SIZE));

  useEffect(() => {
    setPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  const pagedConversations = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return conversations.slice(start, start + PAGE_SIZE);
  }, [conversations, page]);

  const selectedConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === conversationId),
    [conversations, conversationId],
  );

  const messageQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () =>
      getMessages({ query: { conversationId: conversationId || '' } }),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId && conversations[0]?.id) {
      navigate({
        from: '/conversations/{-$conversationId}/',
        params: {
          conversationId: conversations[0].id,
        },
        replace: true,
      });
    }
  }, [conversationId, conversations, navigate]);

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
          <Badge variant="secondary">Thread for testing</Badge>
        </div>
      </header>
      <Separator />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-full max-w-md flex-col border-r">
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {conversationQuery.isLoading && (
                <div className="space-y-2">
                  {[
                    'conversation-skeleton-1',
                    'conversation-skeleton-2',
                    'conversation-skeleton-3',
                    'conversation-skeleton-4',
                    'conversation-skeleton-5',
                  ].map((skeletonId) => (
                    <Skeleton key={skeletonId} className="h-20 w-full" />
                  ))}
                </div>
              )}

              {conversationQuery.isError && (
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>Unable to load conversations</AlertTitle>
                  <AlertDescription>
                    {getErrorMessage(conversationQuery.error)}
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => conversationQuery.refetch()}
                    >
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {!conversationQuery.isLoading &&
                !conversationQuery.isError &&
                conversations.length === 0 && (
                  <Empty className="min-h-[220px]">
                    <EmptyHeader>
                      <EmptyTitle>No conversations yet</EmptyTitle>
                      <EmptyDescription>
                        New user threads will appear here once people start
                        chatting.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}

              {pagedConversations.map((conversation) => (
                <Item
                  asChild
                  key={conversation.id}
                  variant={
                    conversation.id === conversationId ? 'muted' : 'default'
                  }
                  className="w-full"
                >
                  <Link
                    to={'/conversations/{-$conversationId}'}
                    params={{ conversationId: conversation.id }}
                  >
                    <ItemContent>
                      <ItemHeader>
                        <ItemTitle>{conversation.lastUserQuestion}</ItemTitle>
                        <Badge variant="outline" className="capitalize">
                          {timeAgo(conversation.lastMessageAt)}
                        </Badge>
                      </ItemHeader>
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
            </div>
          </ScrollArea>

          {!conversationQuery.isLoading && conversations.length > 0 && (
            <div className="border-t p-3">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setPage((previousPage) => previousPage - 1)
                      }
                      disabled={page === 1}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive>{page}</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((previousPage) => previousPage + 1)
                      }
                      disabled={page === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

        <ScrollArea className="w-full p-4">
          {!conversationId && !conversationQuery.isLoading && (
            <Empty className="min-h-[300px] border">
              <EmptyHeader>
                <EmptyTitle>Select a conversation</EmptyTitle>
                <EmptyDescription>
                  Choose a conversation from the left panel to inspect the
                  thread.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {conversationId && messageQuery.isLoading && (
            <div className="space-y-3">
              {[
                'message-skeleton-1',
                'message-skeleton-2',
                'message-skeleton-3',
                'message-skeleton-4',
                'message-skeleton-5',
                'message-skeleton-6',
              ].map((skeletonId) => (
                <Skeleton key={skeletonId} className="h-24 w-full" />
              ))}
            </div>
          )}

          {conversationId && messageQuery.isError && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Unable to load messages</AlertTitle>
              <AlertDescription>
                {getErrorMessage(messageQuery.error)}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => messageQuery.refetch()}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {conversationId &&
            !messageQuery.isLoading &&
            !messageQuery.isError &&
            messageQuery.data?.data.messages.length === 0 && (
              <Empty className="min-h-[300px] border">
                <EmptyHeader>
                  <EmptyTitle>No messages in this thread</EmptyTitle>
                  <EmptyDescription>
                    This conversation exists but no message history is available
                    yet.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

          {messageQuery.data?.data.messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}

          {selectedConversation && (
            <div className="mt-4 rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
              <p className="font-medium">Thread metadata (admin)</p>
              <p>Conversation ID: {selectedConversation.id}</p>
              <p>Chatbot ID: {selectedConversation.chatbotId}</p>
              <p>
                Created:{' '}
                {new Date(selectedConversation.createdAt).toLocaleString()}
              </p>
              <p>
                Last activity:{' '}
                {new Date(selectedConversation.lastMessageAt).toLocaleString()}
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

function MessageItem({ message }: { message: MessageSchema }) {
  const sourceCount = message?.metadata?.sources?.length ?? 0;

  return (
    <Item
      key={message.id}
      variant={message.role === 'user' ? 'default' : 'muted'}
    >
      <ItemMedia variant="icon">
        {message.role === 'user' ? <UserIcon /> : <BotIcon />}
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          <p>{message.role.toUpperCase()}</p>
          <span className="text-xs font-light text-gray-400">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
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

          {message?.systemMetadata?.finalQuery && (
            <Badge variant="secondary" className="max-w-full truncate">
              <MessageCircleIcon className="mr-1 size-3" />
              Query: {message.systemMetadata.finalQuery}
            </Badge>
          )}
        </div>
      </ItemContent>
    </Item>
  );
}
