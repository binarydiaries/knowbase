import { useAuth, useUser } from '@clerk/clerk-react';
import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Checkbox } from '@knowbase/ui/components/checkbox';
import { Separator } from '@knowbase/ui/components/separator';
import { SidebarTrigger } from '@knowbase/ui/components/sidebar';
import { toast } from '@knowbase/ui/components/sonner';
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
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { isAdminEmail } from '@/utils/adminAccess';

type SafeStatus =
  | 'healthy'
  | 'expiring'
  | 'risky'
  | 'expired'
  | 'pending'
  | 'free';

type SubRow = {
  orgId: string;
  plan: string;
  status: string;
  safeStatus: SafeStatus;
  provider: string;
  providerSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  lastPaymentId: string | null;
  updatedAt: string;
  createdAt: string;
};

type SubCounts = Record<SafeStatus | 'all', number>;

type SubsResponse = {
  rows: SubRow[];
  total: number;
  page: number;
  limit: number;
  counts: SubCounts;
};

type StatusFilter = SafeStatus | 'all';

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Healthy', value: 'healthy' },
  { label: 'Expiring', value: 'expiring' },
  { label: 'Risky', value: 'risky' },
  { label: 'Expired', value: 'expired' },
  { label: 'Pending', value: 'pending' },
  { label: 'Free', value: 'free' },
];

const SAFE_STATUS_BADGE: Record<
  SafeStatus,
  {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    label: string;
    className?: string;
  }
> = {
  healthy: {
    variant: 'default',
    label: 'Healthy',
    className: 'bg-green-600 text-white border-transparent',
  },
  expiring: {
    variant: 'outline',
    label: 'Expiring',
    className: 'border-amber-500 text-amber-600',
  },
  risky: { variant: 'destructive', label: 'Risky' },
  expired: { variant: 'secondary', label: 'Expired' },
  pending: {
    variant: 'secondary',
    label: 'Pending',
    className: 'bg-blue-100 text-blue-700 border-transparent',
  },
  free: { variant: 'outline', label: 'Free' },
};

const PLAN_BADGE: Record<string, string> = {
  free: 'bg-secondary text-secondary-foreground',
  starter: 'bg-violet-100 text-violet-700 border-transparent',
  growth: 'bg-indigo-600 text-white border-transparent',
  pro: 'bg-primary text-primary-foreground border-transparent',
};

const PAGE_SIZE = 25;

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function truncate(s: string | null, n = 14) {
  if (!s) return '—';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs text-muted-foreground font-normal">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent
        className={`text-2xl font-semibold ${highlight && value > 0 ? 'text-destructive' : ''}`}
      >
        {value}
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute('/admin/subscriptions/')({
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [syncingOrgs, setSyncingOrgs] = useState<Set<string>>(new Set());

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

  const subsQuery = useQuery<SubsResponse>({
    queryKey: ['admin-subscriptions', statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      return authFetch(`/admin/subscriptions?${params}`);
    },
    enabled: canAccessAdmin,
  });

  const syncMutation = useMutation({
    mutationFn: async (orgId: string) => {
      setSyncingOrgs((prev) => new Set(prev).add(orgId));
      try {
        return await authFetch(`/admin/subscriptions/${orgId}/sync`, {
          method: 'POST',
        });
      } finally {
        setSyncingOrgs((prev) => {
          const next = new Set(prev);
          next.delete(orgId);
          return next;
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      toast.success('Subscription synced from Razorpay');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Sync failed');
    },
  });

  const bulkSyncMutation = useMutation({
    mutationFn: (orgIds: string[]) =>
      authFetch('/admin/subscriptions/bulk-sync', {
        method: 'POST',
        body: JSON.stringify(orgIds.length ? { orgIds } : {}),
      }),
    onSuccess: (data: { synced: number; errors: number; total: number }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      setSelected(new Set());
      toast.success(
        `Synced ${data.synced} of ${data.total}${data.errors ? ` (${data.errors} errors)` : ''}`,
      );
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Bulk sync failed');
    },
  });

  const rows = subsQuery.data?.rows ?? [];
  const counts = subsQuery.data?.counts;
  const total = subsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const allOnPageSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.orgId));
  const someOnPageSelected = rows.some((r) => selected.has(r.orgId));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        rows.forEach((r) => next.delete(r.orgId));
      } else {
        rows.forEach((r) => next.add(r.orgId));
      }
      return next;
    });
  }

  function toggleRow(orgId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(orgId) ? next.delete(orgId) : next.add(orgId);
      return next;
    });
  }

  function handleFilterChange(f: StatusFilter) {
    setStatusFilter(f);
    setPage(1);
    setSelected(new Set());
  }

  const isBulkBusy = bulkSyncMutation.isPending;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-sm font-medium flex-1">Admin Subscriptions</h1>
        </div>
        <div className="px-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isBulkBusy}
            onClick={() => bulkSyncMutation.mutate([])}
          >
            {isBulkBusy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Sync All
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
            {/* Stats */}
            <div className="grid gap-4 grid-cols-3 md:grid-cols-6">
              <StatCard label="Total" value={counts?.all ?? 0} />
              <StatCard label="Healthy" value={counts?.healthy ?? 0} />
              <StatCard label="Expiring" value={counts?.expiring ?? 0} />
              <StatCard label="Risky" value={counts?.risky ?? 0} highlight />
              <StatCard label="Expired" value={counts?.expired ?? 0} />
              <StatCard label="Pending" value={counts?.pending ?? 0} />
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
                  {counts && f.value !== 'all' && (
                    <span className="ml-1.5 text-xs opacity-70">
                      {counts[f.value as SafeStatus]}
                    </span>
                  )}
                </Button>
              ))}
            </div>

            {/* Bulk actions */}
            {selected.size > 0 && (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-2 text-sm">
                <span className="text-muted-foreground">
                  {selected.size} selected
                </span>
                <Button
                  size="sm"
                  disabled={isBulkBusy}
                  onClick={() => bulkSyncMutation.mutate([...selected])}
                >
                  {isBulkBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : null}
                  Sync Selected ({selected.size})
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected(new Set())}
                >
                  Clear
                </Button>
              </div>
            )}

            {/* Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  Subscriptions
                  {subsQuery.isFetching && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      Loading…
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {total > 0
                      ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`
                      : '0 records'}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={!hasPrev || subsQuery.isFetching}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={!hasNext || subsQuery.isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {subsQuery.error ? (
                  <p className="p-4 text-sm text-destructive">
                    Failed to load subscriptions.
                  </p>
                ) : rows.length === 0 && !subsQuery.isFetching ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    No subscriptions found.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={allOnPageSelected}
                              data-state={
                                someOnPageSelected && !allOnPageSelected
                                  ? 'indeterminate'
                                  : undefined
                              }
                              onCheckedChange={toggleAll}
                              aria-label="Select all on page"
                            />
                          </TableHead>
                          <TableHead>Org ID</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>DB Status</TableHead>
                          <TableHead>Period End</TableHead>
                          <TableHead>Subscription ID</TableHead>
                          <TableHead>Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row) => {
                          const safeBadge = SAFE_STATUS_BADGE[row.safeStatus];
                          const isSyncing = syncingOrgs.has(row.orgId);
                          const canSync = !!row.providerSubscriptionId;
                          return (
                            <TableRow
                              key={row.orgId}
                              data-state={
                                selected.has(row.orgId) ? 'selected' : undefined
                              }
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selected.has(row.orgId)}
                                  onCheckedChange={() => toggleRow(row.orgId)}
                                  aria-label={`Select ${row.orgId}`}
                                />
                              </TableCell>
                              <TableCell
                                className="font-mono text-xs"
                                title={row.orgId}
                              >
                                {truncate(row.orgId, 16)}
                              </TableCell>
                              <TableCell>
                                <Badge className={PLAN_BADGE[row.plan] ?? ''}>
                                  {row.plan}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={safeBadge.variant}
                                  className={safeBadge.className}
                                >
                                  {safeBadge.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {row.status}
                              </TableCell>
                              <TableCell className="text-xs whitespace-nowrap">
                                {formatDate(row.currentPeriodEnd)}
                              </TableCell>
                              <TableCell
                                className="font-mono text-xs"
                                title={row.providerSubscriptionId ?? ''}
                              >
                                {truncate(row.providerSubscriptionId, 18)}
                              </TableCell>
                              <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                                {formatDate(row.updatedAt)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!canSync || isSyncing || isBulkBusy}
                                  onClick={() => syncMutation.mutate(row.orgId)}
                                >
                                  {isSyncing ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <RefreshCw className="size-3.5" />
                                  )}
                                  Sync
                                </Button>
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
