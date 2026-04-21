import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@knowbase/ui/components/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@knowbase/ui/components/card';
import { Skeleton } from '@knowbase/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { getAnalyticsConversationsDaily } from '@/services';

const chartConfig = {
  count: {
    label: 'Conversations',
    color: '#3b82f6',
  },
} satisfies ChartConfig;

type Props = {
  agentId: string;
  startDate: string;
  endDate: string;
};

export function ConversationsDailyChart({ agentId, startDate, endDate }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics-conv-daily', agentId, startDate, endDate],
    queryFn: async () => {
      const res = await getAnalyticsConversationsDaily({
        query: {
          startDate,
          endDate,
          ...(agentId !== 'all' && { agentId }),
        } as never,
      });
      return res.data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conversations Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <div className="flex h-64 items-center justify-center text-sm text-destructive">
            Failed to load conversation data
          </div>
        ) : data?.data.length === 0 || data?.data.every((d) => d.count === 0) ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No conversations in this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <LineChart data={data?.data ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(val: string) => {
                  const d = new Date(val + 'T00:00:00Z');
                  return d.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'UTC',
                  });
                }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(val) => {
                      const d = new Date((val as string) + 'T00:00:00Z');
                      return d.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'UTC',
                      });
                    }}
                  />
                }
              />
              <Line
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
