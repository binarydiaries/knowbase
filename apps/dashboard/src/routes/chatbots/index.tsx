import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import { Card, CardContent } from '@knowbase/ui/components/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@knowbase/ui/components/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@knowbase/ui/components/empty';
import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { toast } from '@knowbase/ui/components/sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Archive,
  ArchiveRestore,
  ArrowUpRightIcon,
  Bot,
  Edit,
  Loader2,
  MessageCircle,
  MoreHorizontal,
} from 'lucide-react';
import { useState } from 'react';
import {
  CHATBOT_LIMIT_TOOLTIP,
  CHATBOT_LOCK_TOOLTIP,
  DisabledTooltip,
} from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import { SubscriptionLimitBanner } from '@/components/SubscriptionLimitBanner/SubscriptionLimitBanner.tsx';
import { type ChatbotSchema, getChatbots, patchChatbotsById } from '@/services';
import { getErrorMessage } from '@/utils/errorHelper.ts';
import { timeAgo } from '@/utils/datetimeHelper.ts';
import { CreateChatbotDialog } from '@/widgets/CreateChatbotDialog/CreateChatbotDialog.tsx';

export const Route = createFileRoute('/chatbots/')({
  component: RouteComponent,
});

function RouteComponent() {
  const query = useQuery({
    queryKey: ['chatbots'],
    queryFn: () => {
      return getChatbots();
    },
  });
  const queryClient = useQueryClient();
  const isChatbotAvailable =
    !query.isLoading && query?.data?.data?.chatbots?.length;
  const subscription = query.data?.data.subscription;
  const hasReachedChatbotLimit =
    (subscription?.activeChatbotCount ?? 0) >=
    (subscription?.activeChatbotLimit ?? Number.MAX_SAFE_INTEGER);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<ChatbotSchema>();

  const archiveChatbotMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: 'active' | 'archived';
    }) => {
      return patchChatbotsById({
        path: { id },
        body: {
          chatbotStatus: status,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-sm font-medium flex-1">Chatbots</h1>
          <CreateChatbotDialog
            open={dialogOpen}
            setOpen={setDialogOpen}
            chatbot={editingBot}
            onClose={() => setEditingBot(undefined)}
            disabled={hasReachedChatbotLimit}
            disabledReason={CHATBOT_LIMIT_TOOLTIP}
          />
        </div>
      </header>
      <Separator />

      <div className="p-5">
        <div className="mb-5">
          <SubscriptionLimitBanner subscription={subscription} />
        </div>
        {/* Chatbot List */}
        {query.isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {query?.data?.data.chatbots.map((bot) => (
              <Link
                key={bot.id}
                to={`/chatbots/$chatbotId`}
                params={{ chatbotId: bot.id }}
                className="block"
              >
                <Card className="rounded-xl border bg-background shadow-sm hover:shadow-md transition">
                  <CardContent className="">
                    {/* Top row */}
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                        <Bot className="h-5 w-5" />
                      </div>

                      {/* Title + status */}
                      <div className={'flex-1'}>
                        <div className="flex flex-col gap-2">
                          <h3 className="text-base font-semibold leading-none">
                            {bot.name}
                          </h3>
                          {bot.locked && (
                            <Badge className={'bg-amber-100 text-amber-700'}>
                              Locked
                            </Badge>
                          )}
                          {bot.chatbotStatus === 'archived' && (
                            <Badge className={'bg-muted text-muted-foreground'}>
                              Archived
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-muted-foreground  cursor-pointer "
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-40 ">
                          <DisabledTooltip
                            disabled={subscription?.isOverLimit}
                            content={CHATBOT_LOCK_TOOLTIP}
                          >
                            <div>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation(); // IMPORTANT: prevent Link navigation
                                  setEditingBot(bot);
                                  setDialogOpen(true);
                                }}
                                disabled={subscription?.isOverLimit}
                                className="flex items-center  cursor-pointer gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </div>
                          </DisabledTooltip>

                          <DisabledTooltip
                            disabled={
                              bot.chatbotStatus === 'archived' &&
                              hasReachedChatbotLimit
                            }
                            content={CHATBOT_LIMIT_TOOLTIP}
                          >
                            <div>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newStatus =
                                    bot.chatbotStatus === 'archived'
                                      ? 'active'
                                      : 'archived';

                                  archiveChatbotMutation.mutate({
                                    id: bot.id,
                                    status: newStatus,
                                  });
                                }}
                                disabled={
                                  bot.chatbotStatus === 'archived' &&
                                  hasReachedChatbotLimit
                                }
                                className="flex items-center gap-2 cursor-pointer "
                              >
                                {bot.chatbotStatus === 'archived' ? (
                                  <ArchiveRestore className="h-4 w-4" />
                                ) : (
                                  <Archive className="h-4 w-4" />
                                )}
                                {bot.chatbotStatus === 'archived'
                                  ? 'Unarchive'
                                  : 'Archive'}
                              </DropdownMenuItem>
                            </div>
                          </DisabledTooltip>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {/* Description (optional / placeholder) */}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {bot.description}
                    </p>

                    {/* Bottom row */}
                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                      <span>0 conversations</span>
                      <span>Updated {timeAgo(bot.updatedAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {query.isSuccess && !isChatbotAvailable && (
          <Empty className="md:py-5">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageCircle />
              </EmptyMedia>
              <EmptyTitle>No chatbots yet</EmptyTitle>
              <EmptyDescription>
                Create your first chatbot to answer questions using your
                content.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
              <CreateChatbotDialog
                open={dialogOpen}
                setOpen={setDialogOpen}
                chatbot={editingBot}
                onClose={() => setEditingBot(undefined)}
                disabled={hasReachedChatbotLimit}
                disabledReason={CHATBOT_LIMIT_TOOLTIP}
              />
            </EmptyContent>
            <Button
              variant="link"
              asChild
              className="text-muted-foreground"
              size="sm"
            >
              <a href="/">
                Learn More <ArrowUpRightIcon />
              </a>
            </Button>
          </Empty>
        )}
      </div>
    </>
  );
}
