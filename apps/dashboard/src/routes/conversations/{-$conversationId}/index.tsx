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
  PaginationEllipsis,
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
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
  }),
  component: RouteComponent,
});

const PAGE_SIZE = 10;

function getPageNumbers(
  current: number,
  total: number,
): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total];
  if (current >= total - 3)
    return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

function RouteComponent() {
  const { conversationId } = Route.useParams();
  const navigate = useNavigate();
  const { page } = Route.useSearch();
  const [searchTerm, setSearchTerm] = useState('');
  const [chatbotIdFilter, setChatbotIdFilter] = useState<string>('all');

  const chatbotQuery = useQuery({
    queryKey: ['chatbots'],
    queryFn: () => getChatbots(),
  });

  const channelsQuery = useQuery({
    queryKey: ['channels', chatbotIdFilter],
    queryFn: () =>
      getChannels({
        query: {
          chatbotId: chatbotIdFilter === 'all' ? undefined : chatbotIdFilter,
        },
      }),
  });

  const channels = channelsQuery.data?.data.channels ?? [];
  const chatbots = chatbotQuery.data?.data.chatbots ?? [];

  const conversationQuery = useQuery({
    queryKey: ['conversations', chatbotIdFilter, page],
    queryFn: () =>
      getConversations({
        query: {
          page,
          limit: PAGE_SIZE,
          chatbotId: chatbotIdFilter === 'all' ? undefined : chatbotIdFilter,
        },
      }),
  });

  const conversations = conversationQuery.data?.data.conversations ?? [];
  const totalPages = conversationQuery.data?.data.totalPages ?? 1;

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return conversations;

    const query = searchTerm.toLowerCase();
    return conversations.filter(
      (c) =>
        c.lastUserQuestion.toLowerCase().includes(query) ||
        c.lastAssistantUtterance.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query),
    );
  }, [conversations, searchTerm]);

  useEffect(() => {
    if (page > totalPages) {
      void navigate({
        search: (prev) => ({ ...prev, page: totalPages }),
        replace: true,
      });
    }
  }, [page, totalPages, navigate]);

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

    if (!channel) return 'Unknown channel';
    const type = channel.additional.type;
    if (type === 'web') return 'Web';
    if (type === 'whatsapp') return 'WhatsApp';
    return 'Instagram';
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
                navigate({
                  from: '/conversations/{-$conversationId}/',
                  params: { conversationId: undefined },
                  search: (prev) => ({ ...prev, page: 1 }),
                  replace: true,
                });
              }}
              chatbotOptions={chatbots.map((chatbot) => ({
                id: chatbot.id,
                name: chatbot.name,
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
                  chatbotName={chatbotNameById(conversation.chatbotId)}
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
                        onClick={() =>
                          void navigate({
                            search: (prev) => ({ ...prev, page: page - 1 }),
                            replace: true,
                          })
                        }
                        aria-disabled={page === 1}
                        className={
                          page === 1 ? 'pointer-events-none opacity-50' : ''
                        }
                      />
                    </PaginationItem>
                    {getPageNumbers(page, totalPages).map((p, i) =>
                      p === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${i}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === page}
                            onClick={() =>
                              void navigate({
                                search: (prev) => ({ ...prev, page: p }),
                                replace: true,
                              })
                            }
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          void navigate({
                            search: (prev) => ({ ...prev, page: page + 1 }),
                            replace: true,
                          })
                        }
                        aria-disabled={page === totalPages}
                        className={
                          page === totalPages
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
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
