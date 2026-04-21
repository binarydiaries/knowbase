import { useAuth, useUser } from '@clerk/clerk-react';
import { Button } from '@knowbase/ui/components/button';
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
import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { isAdminEmail } from '@/utils/adminAccess';

type AdminCostsResponse = {
  data: Array<{
    orgId: string;
    requestCount: number;
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens: number;
    totalTokens: number;
    costUsd: number;
  }>;
  meta: {
    startMonth: string;
    endMonth: string;
    totalRequestCount: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCachedInputTokens: number;
    totalTokens: number;
    totalCostUsd: number;
  };
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export const Route = createFileRoute('/admin/costs/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [startMonth, setStartMonth] = useState(currentMonth());
  const [endMonth, setEndMonth] = useState(currentMonth());
  const email = user?.primaryEmailAddress?.emailAddress;
  const canAccessAdmin = isAdminEmail(email);

  const { data, isFetching, error } = useQuery({
    queryKey: ['admin-costs-by-organization', startMonth, endMonth],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams({ startMonth, endMonth });
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/admin/costs/by-organization?${params.toString()}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to load admin costs');
      }

      return (await response.json()) as AdminCostsResponse;
    },
    enabled: canAccessAdmin,
  });

  const csvRows = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      ['Organization ID', 'Requests', 'Input Tokens', 'Output Tokens', 'Cached Input Tokens', 'Total Tokens', 'Cost (USD)'],
      ...data.data.map((row) => [
        row.orgId,
        String(row.requestCount),
        String(row.inputTokens),
        String(row.outputTokens),
        String(row.cachedInputTokens),
        String(row.totalTokens),
        row.costUsd.toFixed(6),
      ]),
    ];
  }, [data]);

  const downloadCsv = () => {
    if (!csvRows.length) {
      return;
    }

    const csv = csvRows.map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `org-costs-${startMonth}-to-${endMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <h1 className="text-sm font-medium">Admin Costs</h1>
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
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Start month</label>
                  <Input
                    className="w-44"
                    type="month"
                    value={startMonth}
                    onChange={(event) => setStartMonth(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">End month</label>
                  <Input
                    className="w-44"
                    type="month"
                    value={endMonth}
                    onChange={(event) => setEndMonth(event.target.value)}
                  />
                </div>
                <Button onClick={downloadCsv} disabled={!data?.data.length}>
                  <Download className="size-4" />
                  Export CSV
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total AI Cost</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  ${data?.meta.totalCostUsd.toFixed(6) ?? '0.000000'}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total AI Requests</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {data?.meta.totalRequestCount ?? 0}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Tokens</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {data?.meta.totalTokens ?? 0}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>By Organization</CardTitle>
              </CardHeader>
              <CardContent>
                {isFetching ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : error ? (
                  <p className="text-sm text-destructive">Failed to load cost data.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organization ID</TableHead>
                        <TableHead className="text-right">Requests</TableHead>
                        <TableHead className="text-right">Input Tokens</TableHead>
                        <TableHead className="text-right">Output Tokens</TableHead>
                        <TableHead className="text-right">Cached Input</TableHead>
                        <TableHead className="text-right">Total Tokens</TableHead>
                        <TableHead className="text-right">Cost (USD)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.data.map((row) => (
                        <TableRow key={row.orgId}>
                          <TableCell className="font-medium">{row.orgId}</TableCell>
                          <TableCell className="text-right">{row.requestCount}</TableCell>
                          <TableCell className="text-right">{row.inputTokens}</TableCell>
                          <TableCell className="text-right">{row.outputTokens}</TableCell>
                          <TableCell className="text-right">{row.cachedInputTokens}</TableCell>
                          <TableCell className="text-right">{row.totalTokens}</TableCell>
                          <TableCell className="text-right">${row.costUsd.toFixed(6)}</TableCell>
                        </TableRow>
                      ))}
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
