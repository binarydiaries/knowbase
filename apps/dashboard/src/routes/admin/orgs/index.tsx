import { useAuth, useUser } from '@clerk/clerk-react';
import { Badge } from '@knowbase/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@knowbase/ui/components/card';
import { Input } from '@knowbase/ui/components/input';
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
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ArrowDown, ArrowUp, ArrowUpDown, Bot, Building2, MessageSquare, MessagesSquare } from 'lucide-react';
import { useMemo, useState } from 'react';
import { isAdminEmail } from '@/utils/adminAccess';

type OrgRow = {
  orgId: string;
  agentCount: number;
  conversationCount: number;
  messageCount: number;
  lastActiveAt: string | null;
  currentMonthMessages: number;
};

type OrgsOverviewResponse = {
  data: OrgRow[];
  meta: {
    orgCount: number;
    agentCount: number;
    conversationCount: number;
    messageCount: number;
    monthKey: string;
  };
};

type SortKey = keyof Pick<OrgRow, 'orgId' | 'agentCount' | 'conversationCount' | 'messageCount' | 'lastActiveAt' | 'currentMonthMessages'>;
type SortDir = 'asc' | 'desc';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (column !== sortKey) return <ArrowUpDown className="size-3 ml-1 opacity-40" />;
  return sortDir === 'asc'
    ? <ArrowUp className="size-3 ml-1" />
    : <ArrowDown className="size-3 ml-1" />;
}

export const Route = createFileRoute('/admin/orgs/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const canAccessAdmin = isAdminEmail(email);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('lastActiveAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data, isFetching, error } = useQuery({
    queryKey: ['admin-orgs-overview'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/admin/orgs/overview`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!res.ok) throw new Error('Failed to load orgs overview');
      return (await res.json()) as OrgsOverviewResponse;
    },
    enabled: canAccessAdmin,
  });

  const rows = useMemo(() => {
    let list = data?.data ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => r.orgId.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null && bv === null) return 0;
      if (av === null) return sortDir === 'asc' ? -1 : 1;
      if (bv === null) return sortDir === 'asc' ? 1 : -1;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [data, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function thProps(key: SortKey) {
    return {
      className: 'cursor-pointer select-none whitespace-nowrap',
      onClick: () => toggleSort(key),
    };
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <h1 className="text-sm font-medium">Orgs Overview</h1>
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="size-4" /> Total Orgs
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{data?.meta.orgCount ?? '—'}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Bot className="size-4" /> Total Agents
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{data?.meta.agentCount ?? '—'}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <MessagesSquare className="size-4" /> Total Conversations
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{data?.meta.conversationCount ?? '—'}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="size-4" /> Total Messages
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{data?.meta.messageCount ?? '—'}</CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <CardTitle>Organizations</CardTitle>
                <div className="flex items-center gap-2">
                  {data && (
                    <Badge variant="secondary" className="text-xs">
                      {rows.length} of {data.meta.orgCount}
                    </Badge>
                  )}
                  <Input
                    className="w-56 h-8 text-sm"
                    placeholder="Filter by org ID…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isFetching ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : error ? (
                  <p className="text-sm text-destructive">Failed to load org data.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead {...thProps('orgId')}>
                          <span className="flex items-center">
                            Org ID <SortIcon column="orgId" sortKey={sortKey} sortDir={sortDir} />
                          </span>
                        </TableHead>
                        <TableHead {...thProps('agentCount')} className="text-right cursor-pointer select-none">
                          <span className="flex items-center justify-end">
                            Agents <SortIcon column="agentCount" sortKey={sortKey} sortDir={sortDir} />
                          </span>
                        </TableHead>
                        <TableHead {...thProps('conversationCount')} className="text-right cursor-pointer select-none">
                          <span className="flex items-center justify-end">
                            Conversations <SortIcon column="conversationCount" sortKey={sortKey} sortDir={sortDir} />
                          </span>
                        </TableHead>
                        <TableHead {...thProps('messageCount')} className="text-right cursor-pointer select-none">
                          <span className="flex items-center justify-end">
                            All Messages <SortIcon column="messageCount" sortKey={sortKey} sortDir={sortDir} />
                          </span>
                        </TableHead>
                        <TableHead {...thProps('currentMonthMessages')} className="text-right cursor-pointer select-none">
                          <span className="flex items-center justify-end">
                            This Month <SortIcon column="currentMonthMessages" sortKey={sortKey} sortDir={sortDir} />
                          </span>
                        </TableHead>
                        <TableHead {...thProps('lastActiveAt')} className="text-right cursor-pointer select-none">
                          <span className="flex items-center justify-end">
                            Last Active <SortIcon column="lastActiveAt" sortKey={sortKey} sortDir={sortDir} />
                          </span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">
                            No organizations found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((row) => (
                          <TableRow key={row.orgId}>
                            <TableCell className="font-mono text-xs">{row.orgId}</TableCell>
                            <TableCell className="text-right">{row.agentCount}</TableCell>
                            <TableCell className="text-right">{row.conversationCount}</TableCell>
                            <TableCell className="text-right">{row.messageCount}</TableCell>
                            <TableCell className="text-right">
                              {row.currentMonthMessages > 0 ? (
                                <Badge variant="secondary">{row.currentMonthMessages}</Badge>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(row.lastActiveAt)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
