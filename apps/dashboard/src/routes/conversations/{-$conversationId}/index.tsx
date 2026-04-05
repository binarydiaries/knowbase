import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@knowbase/ui/components/alert';
import { Button } from '@knowbase/ui/components/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@knowbase/ui/components/empty';
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
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AlertCircleIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ConversationFiltersPopover } from '@/components/Conversations/ConversationFiltersPopover';
import { ConversationListItem } from '@/components/Conversations/ConversationListItem';
import { ConversationMessageItem } from '@/components/Conversations/ConversationMessageItem';
import { ConversationThreadMeta } from '@/components/Conversations/ConversationThreadMeta';
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
    queryFn: () => getChannels({ query: { chatbotId: chatbotIdFilter } }),
    enabled: chatbotIdFilter !== 'all',
  });

  const channels = channelsQuery.data?.data.channels ?? [];
  const chatbots = chatbotQuery.data?.data.chatbots ?? [];

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
  const totalPages = conversationQuery.data?.data.totalPages ?? 1;

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;

    const query = searchTerm.toLowerCase();
    return conversations.filter((conversation) => {
      return (
        conversation.lastUserQuestion.toLowerCase().includes(query) ||
        conversation.lastAssistantUtterance.toLowerCase().includes(query) ||
        conversation.id.toLowerCase().includes(query)
      );
    });
  }, [conversations, searchTerm]);

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
        params: { conversationId: conversations[0].id },
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

  const chatbotNameById = (id: string) => {
    return (
      chatbots.find((chatbot) => chatbot.id === id)?.name ?? 'Unknown chatbot'
    );
  };

  const channelLabelById = (id: string) => {
    const channel = channels.find((value) => value.id === id);

    if (!channel) return `Channel ${id.slice(0, 8)}`;
    const type = channel.additional.type;
    if (type === 'web') return `Web · ${id.slice(0, 8)}`;
    if (type === 'whatsapp') return `WhatsApp · ${id.slice(0, 8)}`;
    return `Instagram · ${id.slice(0, 8)}`;
  };

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
          <div className="border-b p-3">
            <ConversationFiltersPopover
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              chatbotIdFilter={chatbotIdFilter}
              onChatbotIdFilterChange={(value) => {
                setChatbotIdFilter(value);
                setChannelIdFilter('all');
                setPage(1);
                navigate({
                  from: '/conversations/{-$conversationId}/',
                  params: { conversationId: undefined },
                  replace: true,
                });
              }}
              channelIdFilter={channelIdFilter}
              onChannelIdFilterChange={(value) => {
                setChannelIdFilter(value);
                setPage(1);
              }}
              chatbotOptions={chatbots.map((chatbot) => ({
                id: chatbot.id,
                name: chatbot.name,
              }))}
              channelOptions={channels.map((channel) => ({
                id: channel.id,
                label: channelLabelById(channel.id),
              }))}
            />
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-2 p-3">
              {conversationQuery.isLoading && (
                <div className="space-y-2">
                  {['csk1', 'csk2', 'csk3', 'csk4', 'csk5'].map((id) => (
                    <Skeleton key={id} className="h-20 w-full" />
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
                <ConversationListItem
                  key={conversation.id}
                  id={conversation.id}
                  lastUserQuestion={conversation.lastUserQuestion}
                  lastAssistantUtterance={conversation.lastAssistantUtterance}
                  lastMessageAt={conversation.lastMessageAt}
                  chatbotId={conversation.chatbotId}
                  chatbotName={chatbotNameById(conversation.chatbotId)}
                  channelId={conversation.channelId}
                  channelLabel={channelLabelById(conversation.channelId)}
                  active={conversation.id === conversationId}
                />
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
                        onClick={() => setPage((p) => p - 1)}
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
                        onClick={() => setPage((p) => p + 1)}
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
              {['msk1', 'msk2', 'msk3', 'msk4', 'msk5', 'msk6'].map((id) => (
                <Skeleton key={id} className="h-24 w-full" />
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
            <ConversationMessageItem key={message.id} message={message} />
          ))}

          {selectedConversation && (
            <ConversationThreadMeta
              conversation={selectedConversation}
              chatbotName={chatbotNameById(selectedConversation.chatbotId)}
              channelLabel={channelLabelById(selectedConversation.channelId)}
            />
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
