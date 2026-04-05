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
import { Input } from '@knowbase/ui/components/input';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@knowbase/ui/components/popover';
import { ScrollArea } from '@knowbase/ui/components/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@knowbase/ui/components/select';
import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { Skeleton } from '@knowbase/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import {
  AlertCircleIcon,
  BotIcon,
  ChevronRightIcon,
  DatabaseIcon,
  FilterIcon,
  UserIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { MessageSchema } from '@/services';
import {
  getChannels,
  getChatbots,
  getConversations,
  getMessages,
} from '@/services';
import { getErrorMessage } from '@/utils/errorHelper';

export const Route = createFileRoute('/conversations/{-$conversationId}/')({
  component: RouteComponent,
});

const PAGE_SIZE = 10;

function RouteComponent() {
  const { conversationId } = Route.useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [chatbotIdFilter, setChatbotIdFilter] = useState<string>('all');
  const [channelIdFilter, setChannelIdFilter] = useState<string>('all');

  const chatbotQuery = useQuery({
    queryKey: ['chatbots'],
    queryFn: () => getChatbots(),
  });

  const channelsQuery = useQuery({
    queryKey: ['channels', chatbotIdFilter],
    queryFn: () =>
      getChannels({
        query: { chatbotId: chatbotIdFilter },
      }),
    enabled: chatbotIdFilter !== 'all',
  });

  const channels = channelsQuery.data?.data.channels ?? [];

  const conversationQuery = useQuery({
    queryKey: ['conversations', chatbotIdFilter, channelIdFilter, page],
    queryFn: () =>
      getConversations({
        query: {
          page,
          limit: PAGE_SIZE,
          chatbotId: chatbotIdFilter === 'all' ? undefined : chatbotIdFilter,
          channelId: channelIdFilter === 'all' ? undefined : channelIdFilter,
        },
      }),
  });

  const conversations = conversationQuery.data?.data.conversations ?? [];
  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) {
      return conversations;
    }

    const query = searchTerm.toLowerCase();

    return conversations.filter((conversation) => {
      return (
        conversation.lastUserQuestion.toLowerCase().includes(query) ||
        conversation.lastAssistantUtterance.toLowerCase().includes(query) ||
        conversation.id.toLowerCase().includes(query)
      );
    });
  }, [conversations, searchTerm]);

  const totalPages = conversationQuery.data?.data.totalPages ?? 1;
  const activeFilterCount =
    (chatbotIdFilter !== 'all' ? 1 : 0) + (channelIdFilter !== 'all' ? 1 : 0);

  useEffect(() => {
    setPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

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
    if (
      !conversationQuery.isLoading &&
      conversations.length > 0 &&
      (!conversationId || !selectedConversation)
    ) {
      navigate({
        from: '/conversations/{-$conversationId}/',
        params: {
          conversationId: conversations[0].id,
        },
        replace: true,
      });
    }
  }, [
    conversationId,
    conversationQuery.isLoading,
    conversations,
    navigate,
    selectedConversation,
  ]);

  return (
    <div className="flex h-screen min-h-0 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex flex-1 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="flex-1 text-sm font-medium">Conversations</h1>
        </div>
      </header>
      <Separator />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 w-full max-w-md flex-col border-r">
          <div className="space-y-2 border-b p-3">
            <div className="flex items-center gap-2">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search thread, reply, or ID"
                className="w-full"
              />

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <FilterIcon className="size-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>

                <PopoverContent align="end" className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Chatbot</p>
                    <Select
                      value={chatbotIdFilter}
                      onValueChange={(value) => {
                        setChatbotIdFilter(value);
                        setChannelIdFilter('all');
                        setPage(1);
                        navigate({
                          from: '/conversations/{-$conversationId}/',
                          params: { conversationId: undefined },
                          replace: true,
                        });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All chatbots" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All chatbots</SelectItem>
                        {chatbotQuery.data?.data.chatbots.map((chatbot) => (
                          <SelectItem key={chatbot.id} value={chatbot.id}>
                            {chatbot.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Channel</p>
                    <Select
                      value={channelIdFilter}
                      onValueChange={(value) => {
                        setChannelIdFilter(value);
                        setPage(1);
                      }}
                      disabled={chatbotIdFilter === 'all'}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            chatbotIdFilter === 'all'
                              ? 'Select chatbot first'
                              : 'All channels'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All channels</SelectItem>
                        {channels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            {renderChannelLabel(
                              channel.id,
                              channel.additional.type,
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setChatbotIdFilter('all');
                      setChannelIdFilter('all');
                      setPage(1);
                    }}
                    disabled={activeFilterCount === 0}
                  >
                    Clear filters
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-2 p-3">
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
                filteredConversations.length === 0 && (
                  <Empty className="min-h-[220px]">
                    <EmptyHeader>
                      <EmptyTitle>No conversations found</EmptyTitle>
                      <EmptyDescription>
                        Try changing your search/filter or wait for new
                        conversations.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}

              {filteredConversations.map((conversation) => (
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
                    <ItemContent className="gap-2">
                      <ItemHeader>
                        <ItemTitle className="max-w-[190px] truncate">
                          {conversation.lastUserQuestion}
                        </ItemTitle>
                        <Badge variant="outline" className="capitalize">
                          {dayjs(conversation.lastMessageAt).format(
                            'MMM D, h:mm A',
                          )}
                        </Badge>
                      </ItemHeader>

                      <ItemDescription>
                        {conversation.lastAssistantUtterance}
                      </ItemDescription>

                      <ItemFooter>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {getChannelBadgeLabelById(
                              conversation.channelId,
                              channels,
                            )}
                          </Badge>
                          {conversation.isTesting && (
                            <Badge variant="default">Testing</Badge>
                          )}
                        </div>
                      </ItemFooter>
                    </ItemContent>
                    <ItemActions>
                      <ChevronRightIcon className="size-4" />
                    </ItemActions>
                  </Link>
                </Item>
              ))}
            </div>
          </ScrollArea>

          {!conversationQuery.isLoading &&
            !conversationQuery.isError &&
            conversations.length > 0 && (
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
                      <PaginationLink isActive>
                        {page} / {totalPages}
                      </PaginationLink>
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

        <ScrollArea className="min-h-0 w-full p-4">
          {!conversationId && !conversationQuery.isLoading && (
            <Empty className="min-h-[300px] border">
              <EmptyHeader>
                <EmptyTitle>Select a conversation</EmptyTitle>
                <EmptyDescription>
                  Choose a conversation from the left panel to inspect this
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
              <p>Channel ID: {selectedConversation.channelId}</p>
              <p>Testing: {selectedConversation.isTesting ? 'Yes' : 'No'}</p>
              <p>
                Channel:{' '}
                {getChannelBadgeLabelById(
                  selectedConversation.channelId,
                  channels,
                )}
              </p>
              <p>
                Created:{' '}
                {dayjs(selectedConversation.createdAt).format(
                  'MMM D, YYYY h:mm A',
                )}
              </p>
              <p>
                Last activity:{' '}
                {dayjs(selectedConversation.lastMessageAt).format(
                  'MMM D, YYYY h:mm A',
                )}
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

function getChannelBadgeLabelById(
  channelId: string,
  channels: Array<{
    id: string;
    additional: {
      type: 'web' | 'whatsapp' | 'instagram';
    };
  }>,
) {
  const channel = channels.find((value) => value.id === channelId);

  if (!channel) {
    return `Channel ${channelId.slice(0, 8)}`;
  }

  return renderChannelLabel(channel.id, channel.additional.type);
}

function renderChannelLabel(
  channelId: string,
  channelType: 'web' | 'whatsapp' | 'instagram',
) {
  if (channelType === 'web') {
    return `Web · ${channelId.slice(0, 8)}`;
  }

  if (channelType === 'whatsapp') {
    return `WhatsApp · ${channelId.slice(0, 8)}`;
  }

  return `Instagram · ${channelId.slice(0, 8)}`;
}
