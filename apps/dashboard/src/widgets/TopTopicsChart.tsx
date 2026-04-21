import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@knowbase/ui/components/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@knowbase/ui/components/card';
import { Skeleton } from '@knowbase/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { getAnalyticsTopTopics } from '@/services';

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

export function TopTopicsChart({ agentId, startDate, endDate }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics-top-topics', agentId, startDate, endDate],
    queryFn: async () => {
      const res = await getAnalyticsTopTopics({
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
        <CardTitle className="text-base">Top Topics</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <div className="flex h-64 items-center justify-center text-sm text-destructive">
            Failed to load topic data
          </div>
        ) : !data?.data.length ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No topic data for this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart
              data={data.data}
              layout="vertical"
              margin={{ left: 8, right: 16 }}
            >
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis
                dataKey="topic"
                type="category"
                width={130}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
