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
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  Bot,
  Brain,
  Cpu,
  Edit,
  Loader2,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Sparkles,
  Star,
  Wand2,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { ArchiveAgentDialog } from '@/components/ArchiveAgentDialog/ArchiveAgentDialog.tsx';
import {
  AGENT_LIMIT_TOOLTIP,
  AGENT_LOCK_TOOLTIP,
  DisabledTooltip,
} from '@/components/DisabledTooltip/DisabledTooltip.tsx';
import { SubscriptionLimitBanner } from '@/components/SubscriptionLimitBanner/SubscriptionLimitBanner.tsx';
import {
  type AgentSchema,
  getAgents,
  getAgentsById,
  patchAgentsById,
} from '@/services';
import { timeAgo } from '@/utils/datetimeHelper.ts';
import { getErrorMessage } from '@/utils/errorHelper.ts';
import { CreateAgentDialog } from '@/widgets/CreateAgentDialog/CreateAgentDialog.tsx';

export const Route = createFileRoute('/agents/')({
  component: RouteComponent,
});

type BotAppearance = { Icon: LucideIcon; bg: string; fg: string };

const APPEARANCES: BotAppearance[] = [
  { Icon: Sparkles, bg: 'bg-violet-100', fg: 'text-violet-600' },
  { Icon: Zap, bg: 'bg-amber-100', fg: 'text-amber-600' },
  { Icon: Brain, bg: 'bg-blue-100', fg: 'text-blue-600' },
  { Icon: MessageSquare, bg: 'bg-emerald-100', fg: 'text-emerald-600' },
  { Icon: Star, bg: 'bg-rose-100', fg: 'text-rose-600' },
  { Icon: Cpu, bg: 'bg-cyan-100', fg: 'text-cyan-600' },
  { Icon: Wand2, bg: 'bg-indigo-100', fg: 'text-indigo-600' },
  { Icon: Bot, bg: 'bg-orange-100', fg: 'text-orange-600' },
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function getBotAppearance(id: string): BotAppearance {
  return APPEARANCES[hashId(id) % APPEARANCES.length];
}

type ArchiveConfirm = {
  id: string;
  name: string;
  newStatus: 'active' | 'archived';
};

function RouteComponent() {
  const query = useQuery({
    queryKey: ['agents'],
    queryFn: () => getAgents(),
  });
  const queryClient = useQueryClient();
  const isAgentAvailable =
    !query.isLoading && !!query?.data?.data?.agents?.length;
  const subscription = query.data?.data.subscription;
  const hasReachedAgentLimit =
    (subscription?.activeAgentCount ?? 0) >=
    (subscription?.activeAgentLimit ?? Number.MAX_SAFE_INTEGER);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<AgentSchema>();
  const [archiveConfirm, setArchiveConfirm] = useState<ArchiveConfirm | null>(
    null,
  );

  const archiveAgentMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: 'active' | 'archived';
    }) => {
      return patchAgentsById({
        path: { id },
        body: { agentStatus: status },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success(variables.status === 'archived' ? 'Agent archived' : 'Agent unarchived');
      setArchiveConfirm(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      setArchiveConfirm(null);
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
          <h1 className="text-sm font-medium flex-1">Agents</h1>
          <CreateAgentDialog
            open={dialogOpen}
            setOpen={setDialogOpen}
            agent={editingBot}
            onClose={() => setEditingBot(undefined)}
            disabled={hasReachedAgentLimit}
            disabledReason={AGENT_LIMIT_TOOLTIP}
          />
        </div>
      </header>
      <Separator />

      <div className="p-5">
        <div className="mb-5">
          <SubscriptionLimitBanner subscription={subscription} />
        </div>

        {/* Loading */}
        {query.isLoading && (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {query.isError && (
          <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Failed to load agents</p>
              <p className="text-xs text-muted-foreground">
                Something went wrong. Please try again.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => query.refetch()}>
              Retry
            </Button>
          </div>
        )}

        {/* Agent List */}
        {query.isSuccess && isAgentAvailable && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.data.agents.map((bot) => {
              const { Icon, bg, fg } = getBotAppearance(bot.id);
              const isArchived = bot.agentStatus === 'archived';

              return (
                <Link
                  key={bot.id}
                  to="/agents/$agentId"
                  params={{ agentId: bot.id }}
                  className="block"
                  onMouseEnter={() => {
                    queryClient.prefetchQuery({
                      queryKey: ['agent', bot.id],
                      queryFn: () => getAgentsById({ path: { id: bot.id } }),
                    });
                  }}
                >
                  <Card
                    className={`rounded-xl border bg-background shadow-sm transition-all duration-150 hover:shadow-md ${isArchived ? 'opacity-50' : ''}`}
                  >
                    <CardContent>
                      {/* Top row */}
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${isArchived ? 'bg-muted' : bg}`}
                        >
                          <Icon
                            className={`h-6 w-6 ${isArchived ? 'text-muted-foreground' : fg}`}
                          />
                        </div>

                        {/* Title + badges */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold leading-snug line-clamp-1">
                            {bot.name}
                          </h3>
                          <div className="mt-1 flex gap-1 flex-wrap">
                            {bot.locked && !isArchived && (
                              <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">
                                Locked
                              </Badge>
                            )}
                            {isArchived && (
                              <Badge className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0">
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
                              className="text-muted-foreground cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-40">
                            <DisabledTooltip
                              disabled={subscription?.isOverLimit}
                              content={AGENT_LOCK_TOOLTIP}
                            >
                              <div>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingBot(bot);
                                    setDialogOpen(true);
                                  }}
                                  disabled={subscription?.isOverLimit}
                                  className="flex items-center cursor-pointer gap-2"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              </div>
                            </DisabledTooltip>

                            <DisabledTooltip
                              disabled={
                                bot.agentStatus === 'archived' &&
                                hasReachedAgentLimit
                              }
                              content={AGENT_LIMIT_TOOLTIP}
                            >
                              <div>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setArchiveConfirm({
                                      id: bot.id,
                                      name: bot.name,
                                      newStatus:
                                        bot.agentStatus === 'archived'
                                          ? 'active'
                                          : 'archived',
                                    });
                                  }}
                                  disabled={
                                    (bot.agentStatus === 'archived' &&
                                      hasReachedAgentLimit) ||
                                    archiveAgentMutation.isPending
                                  }
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  {bot.agentStatus === 'archived' ? (
                                    <ArchiveRestore className="h-4 w-4" />
                                  ) : (
                                    <Archive className="h-4 w-4" />
                                  )}
                                  {bot.agentStatus === 'archived'
                                    ? 'Unarchive'
                                    : 'Archive'}
                                </DropdownMenuItem>
                              </div>
                            </DisabledTooltip>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Description */}
                      {bot.description ? (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {bot.description}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground/40 italic">
                          No description
                        </p>
                      )}

                      {/* Footer */}
                      <div className="mt-4 flex items-center justify-end">
                        <span className="text-[11px] text-muted-foreground">
                          Updated {timeAgo(bot.updatedAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {query.isSuccess && !isAgentAvailable && (
          <Empty className="md:py-5">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageCircle />
              </EmptyMedia>
              <EmptyTitle>No agents yet</EmptyTitle>
              <EmptyDescription>
                Create your first agent to answer questions using your content.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
              <CreateAgentDialog
                open={dialogOpen}
                setOpen={setDialogOpen}
                agent={editingBot}
                onClose={() => setEditingBot(undefined)}
                disabled={hasReachedAgentLimit}
                disabledReason={AGENT_LIMIT_TOOLTIP}
              />
            </EmptyContent>
          </Empty>
        )}
      </div>

      {/* Archive confirmation dialog */}
      <ArchiveAgentDialog
        open={!!archiveConfirm}
        onOpenChange={(open) => {
          if (!open) setArchiveConfirm(null);
        }}
        agentName={archiveConfirm?.name}
        currentStatus={
          archiveConfirm?.newStatus === 'archived' ? 'active' : 'archived'
        }
        isPending={archiveAgentMutation.isPending}
        onConfirm={() => {
          if (archiveConfirm) {
            archiveAgentMutation.mutate({
              id: archiveConfirm.id,
              status: archiveConfirm.newStatus,
            });
          }
        }}
      />
    </>
  );
}
