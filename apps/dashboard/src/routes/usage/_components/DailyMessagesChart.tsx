import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@knowbase/ui/components/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@knowbase/ui/components/card';
import { Skeleton } from '@knowbase/ui/components/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { getUsageMessagesDaily } from '@/services';

const chartConfig = {
  count: {
    label: 'Messages',
    color: '#3b82f6',
  },
} satisfies ChartConfig;

type Props = {
  chatbotId: string;
  startDate: string;
  endDate: string;
};

export function DailyMessagesChart({ chatbotId, startDate, endDate }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['usage-daily', chatbotId, startDate, endDate],
    queryFn: async () => {
      const res = await getUsageMessagesDaily({
        query: {
          startDate,
          endDate,
          ...(chatbotId !== 'all' && { chatbotId }),
        } as never,
      });
      return res.data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Daily Messages</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <div className="flex h-64 items-center justify-center text-sm text-destructive">
            Failed to load daily message data
          </div>
        ) : data?.data.length === 0 || data?.data.every((d) => d.count === 0) ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No messages in this period
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart data={data?.data ?? []}>
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
                    labelFormatter={(val: string) => {
                      const d = new Date(val + 'T00:00:00Z');
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
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
