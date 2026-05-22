import { useUser } from '@clerk/clerk-react';
import { Button } from '@knowbase/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { getAdminDemoBookings } from '@/services';
import { isAdminEmail } from '@/utils/adminAccess';

type DemoBooking = {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string | null;
  message: string | null;
  createdAt: string;
  updatedAt: string;
};

type BookingsResponse = {
  rows: DemoBooking[];
  total: number;
  page: number;
  limit: number;
};

const PAGE_SIZE = 25;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function truncate(s: string | null, n = 60) {
  if (!s) return '—';
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export const Route = createFileRoute('/admin/demo-bookings/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const canAccessAdmin = isAdminEmail(email);

  const [page, setPage] = useState(1);

  const bookingsQuery = useQuery<BookingsResponse>({
    queryKey: ['admin-demo-bookings', page],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await getAdminDemoBookings({
        query: { page, limit: PAGE_SIZE },
      } as any);
      return data as BookingsResponse;
    },
    enabled: canAccessAdmin,
  });

  const rows = bookingsQuery.data?.rows ?? [];
  const total = bookingsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-sm font-medium flex-1">Demo Bookings</h1>
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
            <div className="flex items-center gap-3">
              <Card className="flex-1">
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs text-muted-foreground font-normal">
                    Total Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {total}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  Demo Requests
                  {bookingsQuery.isFetching && (
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
                    disabled={!hasPrev || bookingsQuery.isFetching}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={!hasNext || bookingsQuery.isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {bookingsQuery.error ? (
                  <p className="p-4 text-sm text-destructive">
                    Failed to load demo bookings.
                  </p>
                ) : rows.length === 0 && !bookingsQuery.isFetching ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    No demo bookings yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Use Case</TableHead>
                          <TableHead className="whitespace-nowrap">
                            Submitted
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                              {row.name}
                            </TableCell>
                            <TableCell className="text-sm">
                              {row.email}
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                              {row.company}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {row.phone ?? '—'}
                            </TableCell>
                            <TableCell
                              className="text-xs text-muted-foreground max-w-xs"
                              title={row.message ?? ''}
                            >
                              {truncate(row.message)}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                              {formatDate(row.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
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
