import { useAuth, useUser } from '@clerk/clerk-react';
import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@knowbase/ui/components/card';
import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@knowbase/ui/components/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { isAdminEmail } from '@/utils/adminAccess';

type QueueJob = {
  id: string;
  name: string;
  data: { documentId: string; orgId: string; version: number | null };
  state: string;
  attemptsMade: number;
  timestamp: number;
  processedOn: number | null;
  finishedOn: number | null;
  failedReason: string | null;
};

type QueueJobsResponse = {
  jobs: QueueJob[];
  total: number;
  page: number;
  limit: number;
};

type QueueCounts = {
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
  completed: number;
};

type StatusFilter = 'all' | 'waiting' | 'active' | 'delayed' | 'failed' | 'completed';

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Waiting', value: 'waiting' },
  { label: 'Active', value: 'active' },
  { label: 'Delayed', value: 'delayed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Completed', value: 'completed' },
];

const STATE_BADGE: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  waiting: { variant: 'secondary', label: 'Waiting' },
  active: { variant: 'default', label: 'Active' },
  delayed: { variant: 'outline', label: 'Delayed' },
  failed: { variant: 'destructive', label: 'Failed' },
  completed: { variant: 'secondary', label: 'Completed' },
};

const PAGE_SIZE = 25;

function formatTs(ts: number | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs text-muted-foreground font-normal">{label}</CardTitle>
      </CardHeader>
      <CardContent className={`text-2xl font-semibold ${highlight && value > 0 ? 'text-destructive' : ''}`}>
        {value}
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute('/admin/queue/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const email = user?.primaryEmailAddress?.emailAddress;
  const canAccessAdmin = isAdminEmail(email);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const apiBase = import.meta.env.VITE_API_BASE as string;

  async function authFetch(path: string, options: RequestInit = {}) {
    const token = await getToken();
    const res = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  const countsQuery = useQuery<QueueCounts>({
    queryKey: ['admin-queue-counts'],
    queryFn: () => authFetch('/admin/queue/counts'),
    enabled: canAccessAdmin,
    refetchInterval: 10_000,
  });

  const jobsQuery = useQuery<QueueJobsResponse>({
    queryKey: ['admin-queue-jobs', statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      return authFetch(`/admin/queue/jobs?${params}`);
    },
    enabled: canAccessAdmin,
    refetchInterval: 10_000,
  });

  const retryMutation = useMutation({
    mutationFn: (jobId: string) => authFetch(`/admin/queue/jobs/${jobId}/retry`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-queue-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-queue-counts'] });
    },
  });

  const executeMutation = useMutation({
    mutationFn: (jobId: string) => authFetch(`/admin/queue/jobs/${jobId}/execute`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-queue-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-queue-counts'] });
    },
  });

  function handleFilterChange(f: StatusFilter) {
    setStatusFilter(f);
    setPage(1);
  }

  const counts = countsQuery.data;
  const response = jobsQuery.data;
  const jobs = response?.jobs ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <h1 className="text-sm font-medium">Admin Queue</h1>
        </div>
        <div className="px-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['admin-queue-jobs'] });
              queryClient.invalidateQueries({ queryKey: ['admin-queue-counts'] });
            }}
          >
            Refresh
          </Button>
        </div>
      </header>
      <Separator />

      <div className="p-6 space-y-6">
        {!canAccessAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>Forbidden</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This page is only available to configured admin accounts.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Counts */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
              <StatCard label="Waiting" value={counts?.waiting ?? 0} />
              <StatCard label="Active" value={counts?.active ?? 0} />
              <StatCard label="Delayed" value={counts?.delayed ?? 0} />
              <StatCard label="Failed" value={counts?.failed ?? 0} highlight />
              <StatCard label="Completed" value={counts?.completed ?? 0} />
            </div>

            {/* Status filter */}
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <Button
                  key={f.value}
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange(f.value)}
                >
                  {f.label}
                  {counts && f.value !== 'all' ? (
                    <span className="ml-1.5 text-xs opacity-70">
                      {counts[f.value as keyof QueueCounts]}
                    </span>
                  ) : null}
                </Button>
              ))}
            </div>

            {/* Jobs table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  Jobs
                  {jobsQuery.isFetching && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">Loading…</span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {total > 0
                      ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`
                      : '0 jobs'}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={!hasPrev || jobsQuery.isFetching}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={!hasNext || jobsQuery.isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {jobsQuery.error ? (
                  <p className="p-4 text-sm text-destructive">Failed to load queue jobs.</p>
                ) : jobs.length === 0 && !jobsQuery.isFetching ? (
                  <p className="p-4 text-sm text-muted-foreground">No jobs found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job ID</TableHead>
                          <TableHead>Document ID</TableHead>
                          <TableHead>Org ID</TableHead>
                          <TableHead>Ver</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead className="text-right">Attempts</TableHead>
                          <TableHead>Added</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Finished</TableHead>
                          <TableHead>Failure</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobs.map((job) => {
                          const badge = STATE_BADGE[job.state] ?? { variant: 'outline' as const, label: job.state };
                          const canRetry = job.state === 'failed' || job.state === 'delayed';
                          const canExecute = job.state !== 'active' && job.state !== 'completed';
                          const isActing = retryMutation.isPending || executeMutation.isPending;
                          return (
                            <TableRow key={job.id}>
                              <TableCell className="font-mono text-xs">{job.id}</TableCell>
                              <TableCell className="font-mono text-xs max-w-[160px] truncate">
                                {job.data.documentId || '—'}
                              </TableCell>
                              <TableCell className="font-mono text-xs max-w-[140px] truncate">
                                {job.data.orgId || '—'}
                              </TableCell>
                              <TableCell className="text-right">
                                {job.data.version ?? '—'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </TableCell>
                              <TableCell className="text-right">{job.attemptsMade}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{formatTs(job.timestamp)}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{formatTs(job.processedOn)}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{formatTs(job.finishedOn)}</TableCell>
                              <TableCell className="text-xs max-w-[180px] truncate text-destructive">
                                {job.failedReason ?? '—'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {canRetry && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={isActing}
                                      onClick={() => retryMutation.mutate(job.id)}
                                    >
                                      {job.state === 'delayed' ? 'Promote' : 'Retry'}
                                    </Button>
                                  )}
                                  {canExecute && (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      disabled={isActing}
                                      onClick={() => executeMutation.mutate(job.id)}
                                    >
                                      Execute Now
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
