import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@knowbase/ui/components/alert';
import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@knowbase/ui/components/pagination';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@knowbase/ui/components/table';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AlertCircleIcon, ExternalLink, LockIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getAgents, getLeads } from '@/services';
import { useClerkPlan } from '@/hooks/useClerkPlan';

export const Route = createFileRoute('/leads/')({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
  }),
  component: RouteComponent,
});

const PAGE_SIZE = 20;

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
  const { page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { plan, isLoading: planLoading } = useClerkPlan();
  const hasLeadGeneration = plan !== 'free';

  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(
    undefined,
  );

  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: () => getAgents(),
  });

  const leadsQuery = useQuery({
    queryKey: ['leads', selectedAgentId, page],
    queryFn: () =>
      getLeads({
        query: {
          agentId: selectedAgentId,
          page,
          limit: PAGE_SIZE,
        },
      }),
  });

  const leads = leadsQuery.data?.data.leads ?? [];
  const total = leadsQuery.data?.data.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);

  const agents = agentsQuery.data?.data.agents ?? [];

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="h-screen flex flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-sm font-semibold">Leads</h1>
          {total > 0 && (
            <Badge variant="secondary">{total}</Badge>
          )}
        </div>
        <div className="ml-auto px-4">
          <Select
            value={selectedAgentId ?? 'all'}
            onValueChange={(v) => {
              setSelectedAgentId(v === 'all' ? undefined : v);
              navigate({ search: { page: 1 } });
            }}
          >
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {agents.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>
      <Separator />

      {!planLoading && !hasLeadGeneration && (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 text-center max-w-sm">
            <div className="rounded-full border p-4">
              <LockIcon className="size-6 text-muted-foreground" />
            </div>
            <h2 className="text-sm font-semibold">Lead Generation is a paid feature</h2>
            <p className="text-xs text-muted-foreground">
              Upgrade to the Starter plan or above to capture and view leads from your AI agents.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        {hasLeadGeneration && leadsQuery.isLoading && (
          <div className="flex flex-col gap-2 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {hasLeadGeneration && leadsQuery.isError && (
          <div className="flex flex-1 items-center justify-center p-6">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircleIcon />
              <AlertTitle>Failed to load leads</AlertTitle>
              <AlertDescription>
                Something went wrong. Please try again.
              </AlertDescription>
              <Button
                size="xs"
                variant="destructive"
                className="mt-2"
                onClick={() => leadsQuery.refetch()}
              >
                Retry
              </Button>
            </Alert>
          </div>
        )}

        {hasLeadGeneration && leadsQuery.isSuccess && leads.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-medium">No leads yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Leads will appear here once your agent captures contact information.
              </p>
            </div>
          </div>
        )}

        {hasLeadGeneration && leadsQuery.isSuccess && leads.length > 0 && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Captured At</TableHead>
                    <TableHead>Conversation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.name ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {lead.email ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {lead.phone ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {lead.company ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {lead.agent ? (
                          <Link
                            to="/agents/$agentId"
                            params={{ agentId: lead.agent.id }}
                            className="text-sm hover:underline"
                          >
                            {lead.agent.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.channel ? (
                          <Badge variant="outline" className="capitalize text-xs">
                            {lead.channel.type}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(lead.createdAt as unknown as string)}
                      </TableCell>
                      <TableCell>
                        {lead.conversation ? (
                          <Link
                            to="/conversations/{-$conversationId}"
                            params={{ conversationId: lead.conversation.id }}
                            search={{ page: 1 }}
                            className="inline-flex items-center gap-1 text-xs hover:underline"
                          >
                            View <ExternalLink className="size-3" />
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="border-t py-3">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          navigate({ search: { page: Math.max(1, page - 1) } })
                        }
                        aria-disabled={page === 1}
                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {pageNumbers.map((p, i) =>
                      p === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${i}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === page}
                            onClick={() => navigate({ search: { page: p } })}
                            className="cursor-pointer"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          navigate({ search: { page: Math.min(totalPages, page + 1) } })
                        }
                        aria-disabled={page === totalPages}
                        className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
